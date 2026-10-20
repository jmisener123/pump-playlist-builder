/**
 * Tag emoji mappings
 */
export const TAG_EMOJIS = {
  "Halloween": "🎃",
  "Heaven and Hell": "😇😈",
  "Women of Pop": "👩‍🎤",
  "Break-Up Songs": "💔",
  "Beast Mode": "💪",
  "Positive Vibes": "✨",
  "Sing-Along": "🎤",
  "Emo": "🎸",
  "P!nk": "💗",
  "New Year's Eve": "🥳",
  "Valentine's Day": "💘",
  "Spring": "🌷",
  "Summer": "☀️",
  "Fall": "🍂",
  "Winter": "❄️",
  "Pride": "🌈",
  "Spicy": "🌶️",
  "Hard": "💀",
  "Easy to Learn": "😅",
  "Short (<4:30)": "⏱️",
  "Long (>6 min)": "⌛"
}

/**
 * Tag color mappings
 */
export const TAG_COLORS = {
  "Women of Pop": "#ffd1e7",
  "Valentine's Day": "#ffb6c1",
  "Halloween": "#ffe5b4",
  "Heaven and Hell": "#d8c7f0",
  "Beast Mode": "#b3e0ff",
  "Sing-Along": "#fde68a",
  "New Year's Eve": "#b9fbc0",
  "Positive Vibes": "#b9fbc0",
  "Spring": "#c3f7c8",
  "Fall": "#f6c28b",
  "Winter": "#b3e5fc",
  "Pride": "#fb923c",
  "Spicy": "#ff6b6b",
  "Hard": "#7eb8e6",
  "Short (<4:30)": "#c6f6d5",
  "Long (>6 min)": "#e2e8f0",
  "default": "#ffeaa7"
}

/**
 * Convert duration string (MM:SS) to seconds
 */
export function durationToSeconds(duration) {
  if (!duration || duration === '-') return 0
  try {
    const [minutes, seconds] = duration.split(':').map(Number)
    return minutes * 60 + seconds
  } catch {
    return 0
  }
}

/**
 * Convert seconds to formatted duration string (MM:SS)
 */
export function secondsToDuration(totalSeconds) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

/**
 * Calculate total duration of a playlist
 */
export function calculateTotalDuration(playlist) {
  const totalSeconds = playlist.reduce((sum, track) => {
    if (!track) return sum
    return sum + durationToSeconds(track.Duration)
  }, 0)
  return secondsToDuration(totalSeconds)
}

/**
 * Parse tags from comma-separated string
 */
export function parseTags(tagString) {
  if (!tagString || tagString === 'nan' || tagString === 'None' || tagString === '-') {
    return []
  }
  return tagString
    .split(',')
    .map(tag => tag.trim())
    .filter(tag => tag && tag !== 'nan' && tag !== 'None')
}

/**
 * Display names for tags whose data value reads awkwardly in the UI.
 */
const TAG_DISPLAY_NAMES = {
  "Hard": "Hard Workout",
  "Heaven and Hell": "Heaven & Hell",
}

/**
 * Get display name for a tag (e.g., "Hard" -> "Hard Workout")
 */
export function getTagDisplayName(tag) {
  return TAG_DISPLAY_NAMES[tag] || tag
}

/**
 * How well a track answers the active theme filters:
 *   'exact'   — satisfies every active filter category
 *   'partial' — satisfies some but not all of them
 *   'off'     — satisfies none
 * Returns null when no filters are active, so callers can skip the badge.
 *
 * Derived from the track rather than stored on the playlist, so a hand-picked
 * swap is judged by the same rule as a generated one.
 */
export function getThemeMatch(track, { themeTags = [], instructorTags = [], selectedGenres = [] } = {}) {
  if (!track) return null

  const checks = [
    [themeTags.length > 0, () => themeTags.some(t => parseTags(track.Tags).includes(t))],
    [instructorTags.length > 0, () => instructorTags.some(t => parseTags(track.Tags).includes(t))],
    [selectedGenres.length > 0, () => selectedGenres.includes(track.Genre)],
  ].filter(([active]) => active)

  if (checks.length === 0) return null

  const matched = checks.filter(([, passes]) => passes()).length
  if (matched === checks.length) return 'exact'
  return matched > 0 ? 'partial' : 'off'
}

/**
 * Filter sets to try in order when the exact theme has no track for a slot:
 * drop the narrowest constraint first (genre, then difficulty/length) so the
 * named theme is the last thing to go. Ends with the unfiltered catalog.
 */
export function relaxedThemeFilters({ themeTags = [], instructorTags = [], selectedGenres = [] } = {}) {
  const variants = [
    { themeTags, instructorTags, genres: selectedGenres },
    { themeTags, instructorTags, genres: [] },
    { themeTags, instructorTags: [], genres: [] },
    { themeTags: [], instructorTags: [], genres: [] },
  ]

  // Drop variants that don't actually loosen anything.
  const seen = new Set()
  return variants.filter(v => {
    const key = JSON.stringify([v.themeTags, v.instructorTags, v.genres])
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

/**
 * Get color for a tag
 */
export function getTagColor(tag) {
  return TAG_COLORS[tag] || TAG_COLORS.default
}

/**
 * Get emoji for a tag
 */
export function getTagEmoji(tag) {
  return TAG_EMOJIS[tag] || ""
}

/**
 * Generate a unique key for a track
 */
export function makeTrackKey(track) {
  if (!track) return null
  const base = `${track['Track No#']}_${track['Song Title']}_${track['Artist']}_${track['Release']}`
  // Simple hash function for browser
  let hash = 0
  for (let i = 0; i < base.length; i++) {
    const char = base.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16)
}

/**
 * Track position labels for the 55-minute class: one track per body part.
 */
export const TRACK_TYPES_55 = [
  "1 - Warmup",
  "2 - Squats",
  "3 - Chest",
  "4 - Back",
  "5 - Triceps",
  "6 - Biceps",
  "7 - Lunges",
  "8 - Shoulders",
  "9 - Core",
  "10 - Cooldown"
]

/**
 * Track position labels for the 45-minute class, which replaces four tracks
 * with two combos: triceps/biceps and lunges/shoulders.
 */
export const TRACK_TYPES_45 = [
  "1 - Warmup",
  "2 - Squats",
  "3 - Chest",
  "4 - Back",
  "11 - Triceps/Biceps",
  "12 - Lunges/Shoulders",
  "9 - Core",
  "10 - Cooldown"
]

/**
 * Default export kept for the 55-minute class, which is what most instructors
 * teach and what the builder starts on.
 */
export const TRACK_TYPES = TRACK_TYPES_55

/**
 * The slots unique to the 45-minute class.
 */
export const COMBO_TRACK_TYPES = TRACK_TYPES_45.filter(t => !TRACK_TYPES_55.includes(t))

/**
 * Functional Strength tracks (R118-122) are taught in place of Core in the
 * 45-minute class, so they're an alternative to that slot rather than a slot
 * of their own. They're deliberately kept out of random fills - you have to
 * go looking for one.
 */
export const FUNCTIONAL_STRENGTH_TYPES = ['13 - Functional Strength', '14 - Functional Strength']

/**
 * Extra Track No# values a slot will accept, by class format.
 */
const SLOT_ALTERNATES = {
  '45': { '9 - Core': FUNCTIONAL_STRENGTH_TYPES }
}

/**
 * Slot names that differ from the track's own body part, because the slot
 * covers more than one kind of track.
 */
const SLOT_NAMES = {
  '45': { '9 - Core': 'Core / Functional Strength' }
}

/**
 * Les Mills only started releasing combo tracks at this release, so a catalog
 * that stops short of it can't build a 45-minute class.
 */
export const COMBO_FIRST_RELEASE = 103

export const CLASS_FORMATS = [
  { id: '55', label: '55 min', detail: '10 tracks' },
  { id: '45', label: '45 min', detail: '8 tracks, combos' }
]

/**
 * Slot list for a class format, defaulting to the 55-minute class.
 */
export function getTrackTypes(format) {
  return String(format) === '45' ? TRACK_TYPES_45 : TRACK_TYPES_55
}

/**
 * Every Track No# a slot can be filled from: the slot itself plus any
 * alternates this format allows.
 */
export function getSlotTrackTypes(trackType, format) {
  return [trackType, ...(SLOT_ALTERNATES[String(format)]?.[trackType] || [])]
}

/**
 * Every Track No# a format can use, slots and alternates alike.
 */
export function getFormatTrackTypes(format) {
  return getTrackTypes(format).flatMap(type => getSlotTrackTypes(type, format))
}

/**
 * Every track type either format uses, in 55-minute order with the 45-minute
 * extras appended. Used when searching across both formats.
 */
export const ALL_TRACK_TYPES = [...TRACK_TYPES_55, ...COMBO_TRACK_TYPES, ...FUNCTIONAL_STRENGTH_TYPES]

/**
 * The slot a track belongs in for a given format, resolving alternates, so a
 * Functional Strength track lands in the 45-minute Core slot. -1 when the
 * format has no place for it.
 */
export function getTrackIndex(trackType, format) {
  const types = getTrackTypes(format)
  const direct = types.indexOf(trackType)
  if (direct !== -1) return direct
  return types.findIndex(type => getSlotTrackTypes(type, format).includes(trackType))
}

/**
 * The class formats a track type can be used in, e.g. ['55'] for
 * "5 - Triceps", ['55', '45'] for "2 - Squats", ['45'] for a combo or
 * Functional Strength track.
 */
export function getTrackTypeFormats(trackType) {
  return ['55', '45'].filter(format => getFormatTrackTypes(format).includes(trackType))
}

/**
 * Short label marking a track that only fits the other format, e.g. "45 min
 * only". Null when the slot works in the format you're building.
 */
export function formatOnlyLabel(trackType, format) {
  const formats = getTrackTypeFormats(trackType)
  if (formats.length !== 1 || formats[0] === String(format)) return null
  return `${formats[0]} min only`
}

/**
 * Slot label numbered by where it falls in the class you're teaching, rather
 * than by its spreadsheet number: the combo tracks are logged as 11 and 12,
 * but a 45-minute class runs them fifth and sixth, so it reads
 * "5 - Triceps/Biceps" through to "8 - Cooldown".
 *
 * A slot from the other format keeps its own format's numbering, so a combo
 * track turning up in a 55-minute search still reads as the 45-minute class's
 * fifth track rather than its eleventh.
 */
export function formatTrackType(trackType, format) {
  let slotFormat = String(format)
  let index = getTrackIndex(trackType, slotFormat)
  if (index === -1) {
    slotFormat = getTrackTypeFormats(trackType)[0]
    if (!slotFormat) return trackType
    index = getTrackIndex(trackType, slotFormat)
  }
  if (index === -1) return trackType
  const name = SLOT_NAMES[slotFormat]?.[trackType] || getBodyPart(trackType)
  return `${index + 1} - ${name}`
}

/**
 * Get the position number from a track type string
 */
export function getPositionNumber(trackType) {
  const match = trackType.match(/^(\d+)/)
  return match ? parseInt(match[1], 10) : 0
}

/**
 * Get the body part name from a track type
 */
export function getBodyPart(trackType) {
  const parts = trackType.split(' - ')
  return parts[1] || trackType
}

/**
 * Compact release label: "R138" for numbered releases, the name as-is for
 * special releases like "United".
 */
export function formatReleaseShort(release) {
  const value = String(release ?? '').trim()
  return /^\d+(\.\d+)?$/.test(value) ? `R${value}` : value
}

/**
 * Release label for a track, including its Bonus/Alt version: "R122 Alt".
 * Pass `short: false` for the plain release ("122 Alt").
 */
export function formatTrackRelease(track, { short = true } = {}) {
  if (!track) return ''
  const release = short ? formatReleaseShort(track.Release) : String(track.Release ?? '').trim()
  return track.Version ? `${release} ${track.Version}` : release
}

/**
 * Human label for the active theme filters, e.g. "🎃 Halloween • EDM".
 * Genres have no emoji; pass `emoji: false` for a plain-text label.
 */
export function formatThemeLabel({ themeTags = [], instructorTags = [], selectedGenres = [] }, { emoji = true } = {}) {
  const withEmoji = (tag) => {
    const name = getTagDisplayName(tag)
    return emoji && TAG_EMOJIS[tag] ? `${TAG_EMOJIS[tag]} ${name}` : name
  }
  return [
    themeTags.map(withEmoji).join(', '),
    instructorTags.map(withEmoji).join(', '),
    selectedGenres.join(', '),
  ].filter(Boolean).join(' • ')
}
