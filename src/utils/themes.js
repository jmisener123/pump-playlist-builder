export const THEMES = {
  halloween: {
    name: "Halloween",
    emoji: "🎃",
    tags: ["Halloween"]
  },
  heavenAndHell: {
    name: "Heaven and Hell",
    emoji: "😇😈",
    tags: ["Heaven and Hell"]
  },
  eighties: {
    name: "80s",
    emoji: "🎸",
    tags: ["80s"]
  },
  rock: {
    name: "Rock",
    emoji: "🤘",
    genres: ["Rock"]
  },
  womenOfPop: {
    name: "Women of Pop",
    emoji: "👩‍🎤",
    tags: ["Women of Pop"]
  },
  beastMode: {
    name: "Beast Mode",
    emoji: "💪",
    tags: ["Beast Mode"]
  },
  singAlong: {
    name: "Sing-Along",
    emoji: "🎤",
    tags: ["Sing-Along"]
  },
  breakUp: {
    name: "Break-Up Songs",
    emoji: "💔",
    tags: ["Break-Up Songs"]
  },
  positiveVibes: {
    name: "Positive Vibes",
    emoji: "✨",
    tags: ["Positive Vibes"]
  },
  valentines: {
    name: "Valentine's Day",
    emoji: "💘",
    tags: ["Valentine's Day"]
  },
  newYears: {
    name: "New Year's Eve",
    emoji: "🥳",
    tags: ["New Year's Eve"]
  },
  summer: {
    name: "Summer",
    emoji: "☀️",
    tags: ["Summer"]
  },
  emo: {
    name: "Emo",
    emoji: "🎸",
    tags: ["Emo"]
  },
  pink: {
    name: "P!nk",
    emoji: "💗",
    tags: ["P!nk"]
  },
  spicy: {
    name: "Spicy",
    emoji: "🌶️",
    tags: ["Spicy"]
  },
  spring: {
    name: "Spring",
    emoji: "🌷",
    tags: ["Spring"]
  },
  fall: {
    name: "Fall",
    emoji: "🍂",
    tags: ["Fall"]
  },
  winter: {
    name: "Winter",
    emoji: "❄️",
    tags: ["Winter"]
  },
  pride: {
    name: "Pride",
    emoji: "🌈",
    tags: ["Pride"]
  }
}

// Theme tags that users can select for themed playlists
export const THEME_TAGS = [
  "Beast Mode",
  "Break-Up Songs",
  "Emo",
  "Fall",
  "Halloween",
  "Heaven and Hell",
  "New Year's Eve",
  "P!nk",
  "Positive Vibes",
  "Pride",
  "Sing-Along",
  "Spicy",
  "Spring",
  "Summer",
  "Valentine's Day",
  "Winter",
  "Women of Pop"
]

// Instructor-focused tags for difficulty and length filtering
export const INSTRUCTOR_TAGS = [
  "Easy to Learn",
  "Hard",
  "Short (<4:30)",
  "Long (>6 min)"
]

// When each seasonal theme is relevant, as inclusive [month, day] windows.
// Windows may wrap the year end (e.g. Winter). Themes not listed are evergreen.
export const THEME_SEASONS = {
  "New Year's Eve": { start: [12, 1], end: [1, 10] },
  "Valentine's Day": { start: [1, 15], end: [2, 14] },
  "Spring": { start: [3, 1], end: [5, 31] },
  "Pride": { start: [5, 15], end: [6, 30] },
  "Summer": { start: [6, 1], end: [8, 31] },
  "Fall": { start: [9, 1], end: [11, 30] },
  "Halloween": { start: [9, 15], end: [10, 31] },
  "Heaven and Hell": { start: [10, 1], end: [11, 2] },
  "Winter": { start: [12, 1], end: [2, 28] },
}

const DAY_MS = 24 * 60 * 60 * 1000

// Days from `date` until the next occurrence of [month, day] (0 if today).
function daysUntil([month, day], date) {
  const today = new Date(date.getFullYear(), date.getMonth(), date.getDate())
  let target = new Date(today.getFullYear(), month - 1, day)
  if (target < today) target = new Date(today.getFullYear() + 1, month - 1, day)
  return Math.round((target - today) / DAY_MS)
}

function seasonStatus(tag, date) {
  const season = THEME_SEASONS[tag]
  if (!season) return { group: 1, rank: 0 }
  const toStart = daysUntil(season.start, date)
  const toEnd = daysUntil(season.end, date)
  // In season when the window's end comes before its next start.
  return toEnd < toStart || toStart === 0
    ? { group: 0, rank: toEnd }
    : { group: 2, rank: toStart }
}

/**
 * Order themes by the calendar: in-season first (ending soonest leads),
 * then evergreen themes in their given order, then off-season themes by how
 * soon they come around. Set `includeOffSeason: false` to drop the last group.
 */
export function sortThemesBySeason(tags, { date = new Date(), includeOffSeason = true } = {}) {
  return tags
    .map((tag, index) => ({ tag, index, ...seasonStatus(tag, date) }))
    .filter((t) => includeOffSeason || t.group !== 2)
    .sort((a, b) => a.group - b.group || a.rank - b.rank || a.index - b.index)
    .map((t) => t.tag)
}
