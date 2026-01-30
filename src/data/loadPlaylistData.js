import { parseCSV, normalizeText } from '../utils/csvParser'

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
 * Process raw CSV data into tracks
 */
function processRawTracks(rawTracks) {
  // Process and normalize tracks
  const tracks = rawTracks.map(track => ({
    ...track,
    'Song Title': normalizeText(track['Song Title']),
    'Artist': normalizeText(track['Artist']),
    'Genre': normalizeText(track['Genre']),
    'Tags': cleanTags(track['Tags']),
    'SortKey': getSortKey(track['Release'])
  }))

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
 * Load and process playlist data from CSV file (async)
 */
export async function loadPlaylistDataAsync() {
  try {
    const response = await fetch('/data.csv')
    if (!response.ok) {
      throw new Error(`Failed to fetch CSV: ${response.status}`)
    }
    const csvString = await response.text()
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
 * Filter tracks based on release range and options
 */
export function filterTracks(tracks, options = {}) {
  const {
    earliestRelease = null,
    excludeNewest = false,
    latestRelease = null,
    onlyRecent10 = false,
    allReleases = []
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
 * Search tracks by song title or artist
 */
export function searchTracks(tracks, searchTerm) {
  if (!searchTerm || !searchTerm.trim()) {
    return tracks
  }

  const searchLower = searchTerm.toLowerCase().trim()

  // Normalize for special character matching (P!nk)
  const normalizeForSearch = (text) => {
    let normalized = text.toLowerCase()
    normalized = normalized.replace('p!nk', 'pink')
    normalized = normalized.replace('pink', 'p!nk pink')
    return normalized
  }

  const searchWords = searchLower.split(/\s+/).filter(w => w)

  return tracks.filter(track => {
    const title = (track['Song Title'] || '').toLowerCase()
    const artist = (track['Artist'] || '').toLowerCase()
    const normalizedTitle = normalizeForSearch(title)
    const normalizedArtist = normalizeForSearch(artist)

    // For multi-word searches, require ALL words
    if (searchWords.length > 1) {
      const titleMatch = searchWords.every(word => normalizedTitle.includes(word))
      const artistMatch = searchWords.every(word => normalizedArtist.includes(word))
      return titleMatch || artistMatch
    }

    // Single word search
    const singleWord = searchWords[0] || searchLower
    return title.includes(singleWord) ||
           artist.includes(singleWord) ||
           normalizedTitle.includes(singleWord) ||
           normalizedArtist.includes(singleWord)
  })
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
