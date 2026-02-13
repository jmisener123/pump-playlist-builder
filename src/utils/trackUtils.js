/**
 * Tag emoji mappings
 */
export const TAG_EMOJIS = {
  "Halloween": "🎃",
  "Women of Pop": "👩‍🎤",
  "Break-Up Songs": "💔",
  "Beast Mode": "💪",
  "Positive Vibes": "✨",
  "Sing-Along": "🎤",
  "Emo": "🎸",
  "P!nk": "💗",
  "New Year's Eve": "🥳",
  "Valentine's Day": "💘",
  "Summer": "☀️",
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
  "Beast Mode": "#b3e0ff",
  "Sing-Along": "#e0c3fc",
  "New Year's Eve": "#b9fbc0",
  "Positive Vibes": "#b9fbc0",
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
 * Get display name for a tag (e.g., "Hard" -> "Hard Workout")
 */
export function getTagDisplayName(tag) {
  if (tag === "Hard") return "Hard Workout"
  return tag
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
 * Track position labels
 */
export const TRACK_TYPES = [
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
 * Get the index for a track type
 */
export function getTrackIndex(trackType) {
  return TRACK_TYPES.indexOf(trackType)
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
