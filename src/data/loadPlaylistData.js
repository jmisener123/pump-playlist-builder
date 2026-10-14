import { parseCSV, normalizeText, normalizeFeaturing } from '../utils/csvParser'
import { parseChoreo, buildChoreoSearchText, choreoMatchesWord, hasChoreoData } from '../utils/choreo'

/**
 * Clean and normalize tags from raw CSV data
 */
function cleanTags(tagStr) {
  if (!tagStr || tagStr.trim().toLowerCase() === 'nan' || tagStr.trim() === '' || tagStr === 'None' || tagStr === '-') {
    return null
  }

  const tags = tagStr.split(',').map(t => t.trim()).filter(t => t)

  // Apply tag replacements for consistency
  const replacements = {
    "Break-up Songs": "Break-Up Songs",
    "🌈": "✨"
  }

  const cleaned = tags.map(tag => replacements[tag] || tag)
  const uniqueSorted = [...new Set(cleaned)].sort()

  return uniqueSorted.length > 0 ? uniqueSorted.join(', ') : null
}

/**
 * Get sorting key for releases (handles "United" special case)
 */
function getSortKey(release) {
  if (String(release) === "United") {
    return 113.5
  }
  const parsed = parseFloat(release)
  return isNaN(parsed) ? 0 : parsed
}

/**
 * "Bonus" or "Alt" from the spreadsheet's Bonus/Alt column, else null.
 */
function getVersion(value) {
  const v = String(value ?? '').trim().toLowerCase()
  if (v.startsWith('bonus')) return 'Bonus'
  if (v.startsWith('alt')) return 'Alt'
  return null
}

/**
 * Process raw CSV data into tracks
 */
function processRawTracks(rawTracks) {
  // Process and normalize tracks, skipping stray spreadsheet rows with no
  // release, slot or title.
  const tracks = rawTracks
    .filter(track => [track['Release'], track['Track No#'], track['Song Title']].every(v => String(v ?? '').trim()))
    .map(track => {
      const choreoList = parseChoreo(track['Choreo'])
      return {
        ...track,
        'Song Title': normalizeFeaturing(normalizeText(track['Song Title'])),
        'Artist': normalizeFeaturing(normalizeText(track['Artist'])),
        'Genre': normalizeText(track['Genre']),
        'Tags': cleanTags(track['Tags']),
        'Version': getVersion(track['Bonus/Alt track']),
        'SortKey': getSortKey(track['Release']),
        'ChoreoList': choreoList,
        'ChoreoSearchText': buildChoreoSearchText(choreoList)
      }
    })

  // Sort by release number
  tracks.sort((a, b) => a.SortKey - b.SortKey)

  // Find latest release and all unique releases
  let maxSortKey = 0
  let latestRelease = '135'
  const releaseSet = new Set()

  tracks.forEach(track => {
    releaseSet.add(track.Release)
    if (track.SortKey > maxSortKey) {
      maxSortKey = track.SortKey
      latestRelease = track.Release
    }
  })

  // Sort releases by their sort key
  const releases = Array.from(releaseSet).sort((a, b) => getSortKey(a) - getSortKey(b))

  return {
    tracks,
    latestRelease,
    releases
  }
}

/**
 * Load and process playlist data from base64-encoded file (async)
 */
export async function loadPlaylistDataAsync() {
  try {
    const response = await fetch('/playlist-data.txt')
    if (!response.ok) {
      throw new Error(`Failed to fetch data: ${response.status}`)
    }
    const base64String = await response.text()
    // Decode base64 to CSV string
    const csvString = atob(base64String.trim())
    const rawTracks = parseCSV(csvString)
    return processRawTracks(rawTracks)
  } catch (error) {
    console.error('Failed to load playlist data:', error)
    return { tracks: [], latestRelease: '135', releases: [] }
  }
}

/**
 * Synchronous version for backwards compatibility (returns empty data)
 * Use loadPlaylistDataAsync instead
 */
export function loadPlaylistData() {
  console.warn('loadPlaylistData is deprecated, use loadPlaylistDataAsync')
  return { tracks: [], latestRelease: '135', releases: [] }
}

/**
 * The releases the range controls (oldest owned + checkboxes) resolve to.
 * Individually excluded releases are dropped last, so callers that need the
 * full span to choose from can leave `excludedReleases` off.
 */
export function getRangeReleases({ releases = [], earliestRelease, onlyRecent10, excludeNewest, latestRelease, excludedReleases = [] } = {}) {
  const startIndex = releases.indexOf(String(earliestRelease))
  let active = releases.slice(startIndex === -1 ? 0 : startIndex)
  if (onlyRecent10) {
    const recent = new Set(releases.slice(-10))
    active = active.filter(r => recent.has(r))
  }
  if (excludeNewest) {
    active = active.filter(r => String(r) !== String(latestRelease))
  }
  if (excludedReleases.length > 0) {
    const excluded = new Set(excludedReleases.map(String))
    active = active.filter(r => !excluded.has(String(r)))
  }
  return active
}

/**
 * Filter tracks based on release range and options
 */
export function filterTracks(tracks, options = {}) {
  const {
    earliestRelease = null,
    excludeNewest = false,
    latestRelease = null,
    onlyRecent10 = false,
    allReleases = [],
    excludedReleases = []
  } = options

  let filtered = [...tracks]

  // Get sort key for earliest release
  const earliestSortKey = earliestRelease ? getSortKey(earliestRelease) : 0

  // Filter by earliest release
  if (earliestRelease) {
    filtered = filtered.filter(track => track.SortKey >= earliestSortKey)
  }

  // Filter to only recent 10 releases
  if (onlyRecent10 && allReleases.length > 0) {
    const recentReleases = allReleases.slice(-10)
    const recentSortKeys = new Set(recentReleases.map(r => getSortKey(r)))
    filtered = filtered.filter(track => recentSortKeys.has(track.SortKey))
  }

  // Exclude newest release
  if (excludeNewest && latestRelease) {
    filtered = filtered.filter(track => String(track.Release) !== String(latestRelease))
  }

  // Drop individually excluded releases
  if (excludedReleases.length > 0) {
    const excluded = new Set(excludedReleases.map(String))
    filtered = filtered.filter(track => !excluded.has(String(track.Release)))
  }

  return filtered
}

/**
 * Filter tracks by theme tags and genres
 */
export function filterByTheme(tracks, options = {}) {
  const {
    themeTags = [],
    instructorTags = [],
    genres = []
  } = options

  let filtered = [...tracks]

  // Filter by tags (using AND logic between theme and instructor categories, OR within each)
  if (themeTags.length > 0 || instructorTags.length > 0) {
    filtered = filtered.filter(track => {
      if (!track.Tags) return false

      const trackTags = track.Tags.split(',').map(t => t.trim())

      // Check theme tags (at least one must match if any selected)
      const hasThemeTag = themeTags.length === 0 ||
        themeTags.some(tag => trackTags.includes(tag))

      // Check instructor tags (at least one must match if any selected)
      const hasInstructorTag = instructorTags.length === 0 ||
        instructorTags.some(tag => trackTags.includes(tag))

      return hasThemeTag && hasInstructorTag
    })
  }

  // Filter by genres
  if (genres.length > 0) {
    filtered = filtered.filter(track => genres.includes(track.Genre))
  }

  return filtered
}

/**
 * Add a term to an existing search without clobbering what's already there,
 * so picking several moves in a row builds up rather than restarts.
 *
 * A `track:` scope is singular - picking a move from a different track swaps
 * the scope instead of stacking a second one. Repeats are ignored.
 */
export function appendSearchTerm(current, addition) {
  const tokenize = (text) => {
    const tokens = []
    const pattern = /-?(?:"[^"]*"|\S+)/g
    let match
    while ((match = pattern.exec(String(text ?? ''))) !== null) tokens.push(match[0])
    return tokens
  }

  const isScope = (token) => /^-?track:/i.test(token)
  const incoming = tokenize(addition)

  let tokens = tokenize(current)
  if (incoming.some(isScope)) tokens = tokens.filter(token => !isScope(token))

  for (const token of incoming) {
    if (!tokens.some(existing => existing.toLowerCase() === token.toLowerCase())) {
      tokens.push(token)
    }
  }

  return [...tokens.filter(isScope), ...tokens.filter(token => !isScope(token))].join(' ')
}

/**
 * Split a search term into the terms every match must account for, separating
 * out `-term` exclusions and `track:` scopes.
 *
 * Quoted text is kept together as one term, so `"no squats"` looks for that
 * exact note instead of matching any squat track whose title contains "no".
 *
 * `track:chest` restricts results to a slot. It needs to be explicit because
 * a bare "chest" legitimately matches the move "Chest Presses" in a warmup
 * track, which is the opposite of scoping.
 *
 * Exclusion uses an explicit `-` rather than the word "no" because the Choreo
 * column itself contains literal values like "No Squats" and "No Bar Overhead",
 * so "no squats" is a real thing to search *for*.
 */
export function parseSearchTerm(searchTerm) {
  const include = []
  const exclude = []
  const slots = []
  const pattern = /(-?)(?:"([^"]*)"|(\S+))/g
  const input = String(searchTerm ?? '').toLowerCase()

  let match
  while ((match = pattern.exec(input)) !== null) {
    const raw = match[2] !== undefined ? match[2] : match[3]
    const term = raw.replace(/"/g, '').trim().replace(/\s+/g, ' ')
    if (!term) continue

    const scoped = term.match(/^track:(.+)$/)
    if (scoped) {
      slots.push(scoped[1])
      continue
    }

    ;(match[1] ? exclude : include).push(term)
  }

  return { include, exclude, slots }
}

/**
 * The words a result should explain itself against.
 */
export function getSearchWords(searchTerm) {
  return parseSearchTerm(searchTerm).include
}

// Normalize for special character matching (P!nk)
function normalizeForSearch(text) {
  let normalized = text.toLowerCase()
  normalized = normalized.replace('p!nk', 'pink')
  normalized = normalized.replace('pink', 'p!nk pink')
  return normalized
}

/**
 * Search tracks by title, artist or choreography.
 *
 * Results are ranked so the familiar matches stay on top:
 *   3. every word is in the title
 *   2. every word is in the artist
 *   1. every word turns up somewhere - title, artist, track slot or moves
 *
 * Tier 1 is what makes searches like "chest barbell only" or "planks" work,
 * since those words live in different fields (or in no field at all, in the
 * case of a move family like planks matching tracks logged as Hovers).
 *
 * Prefixing a word with `-` excludes it, so "chest -pushups" finds chest
 * tracks without push-ups. When the excluded word names a move, tracks whose
 * choreography we don't know are dropped too: most tracks before Release 89
 * have no choreo logged, and a blank means "unknown", not "doesn't have it".
 *
 * `track:lunges "No Squats"` pins the search to one slot, which is how the
 * move browser keeps a track-specific note from matching anything else.
 */
export function searchTracks(tracks, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return tracks
  }

  const { include, exclude, slots } = parseSearchTerm(searchTerm)
  if (include.length === 0 && exclude.length === 0 && slots.length === 0) return tracks

  // A word only triggers the unknown-choreo cull if it actually names a move
  // somewhere in the catalog, so "-remix" doesn't wipe out the back catalog.
  const choreoExclusions = new Set(
    exclude.filter(word => tracks.some(track => choreoMatchesWord(track, word)))
  )

  const scored = []

  tracks.forEach((track, index) => {
    const title = (track['Song Title'] || '').toLowerCase()
    const artist = (track['Artist'] || '').toLowerCase()
    const slot = String(track['Track No#'] || '').toLowerCase()
    const normalizedTitle = normalizeForSearch(title)
    const normalizedArtist = normalizeForSearch(artist)

    const matchesAnywhere = (word) =>
      normalizedTitle.includes(word) ||
      normalizedArtist.includes(word) ||
      slot.includes(word) ||
      choreoMatchesWord(track, word)

    if (slots.length > 0 && !slots.some(wanted => slot.includes(wanted))) return

    if (include.length === 0 && exclude.length === 0) {
      scored.push({ track, score: 1, index })
      return
    }

    for (const word of exclude) {
      if (matchesAnywhere(word)) return
      // We can't promise a track is free of a move we never logged.
      if (choreoExclusions.has(word) && !hasChoreoData(track)) return
    }

    if (include.length === 0) {
      scored.push({ track, score: 1, index })
      return
    }

    let score = 0
    if (include.every(word => normalizedTitle.includes(word))) {
      score = 3
    } else if (include.every(word => normalizedArtist.includes(word))) {
      score = 2
    } else if (include.every(matchesAnywhere)) {
      score = 1
    }

    if (score > 0) scored.push({ track, score, index })
  })

  // Higher tiers first, otherwise keep the incoming release order.
  scored.sort((a, b) => b.score - a.score || a.index - b.index)

  return scored.map(entry => entry.track)
}

/**
 * Get tracks for a specific position
 */
export function getTracksForPosition(tracks, position) {
  return tracks.filter(track => track['Track No#'] === position)
}

/**
 * Pick a random track for a position from filtered tracks
 */
export function pickRandomTrack(tracks, position, excludeTitles = []) {
  const positionTracks = getTracksForPosition(tracks, position)
  const available = positionTracks.filter(t => !excludeTitles.includes(t['Song Title']))

  if (available.length === 0) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * available.length)
  return available[randomIndex]
}

/**
 * Get all unique genres from tracks
 */
export function getAllGenres(tracks) {
  const genres = new Set()
  tracks.forEach(track => {
    if (track.Genre && track.Genre !== 'nan') {
      genres.add(track.Genre)
    }
  })
  return Array.from(genres).sort()
}

/**
 * Get all unique tags from tracks
 */
export function getAllTags(tracks) {
  const tags = new Set()
  tracks.forEach(track => {
    if (track.Tags) {
      track.Tags.split(',').forEach(tag => {
        const trimmed = tag.trim()
        if (trimmed && trimmed !== 'nan') {
          tags.add(trimmed)
        }
      })
    }
  })
  return Array.from(tags).sort()
}
