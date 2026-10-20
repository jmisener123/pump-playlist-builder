/**
 * Choreography data: what moves a track actually contains.
 *
 * The spreadsheet's Choreo column is hand-maintained and only meaningfully
 * covers Release 89 onward, so a blank value means "unknown", never "this
 * track has no moves".
 *
 * This powers search: typing "barbell only", "rotator raises" or "planks"
 * finds tracks by what you do in them, not just by title or artist.
 */

/**
 * Spelling variants and singular/plural splits that mean the same move.
 * Keeps search from missing tracks because of a typo in the source sheet.
 *
 * Hovers and planks are the same move, so the plank-named entries fold into
 * the hover names rather than showing up as a second set of chips. Plank Jacks,
 * Plank Foot Taps and Plank Arm Reaches stay separate - they're their own
 * moves, not alternate spellings.
 */
const CHOREO_ALIASES = {
  "A-Press": "A-Presses",
  "Rotator Raise": "Rotator Raises",
  "Narrow Press": "Narrow Presses",
  "Wide Press": "Wide Presses",
  "Mid-Grip": "Mid Grip",
  "Hip Brudges": "Hip Bridges",
  "Plate Squat Press": "Plate Squat Presses",
  "Side Hover": "Side Hovers",
  "Chest Press": "Chest Presses",
  "Planks": "Hovers",
  "Plank": "Hovers",
  "Side Planks": "Side Hovers",
  "Side Plank": "Side Hovers",
  "Rotating Planks": "Rotating Hovers",
  "Rotating Plank": "Rotating Hovers",
  "Rotating Side Planks": "Rotating Side Hovers",
  "Rotating Side Plank": "Rotating Side Hovers",
}

/**
 * Move families, used to widen a search beyond the literal words in the
 * sheet. Searching "planks" should find tracks logged as Hovers, and
 * "push-ups" should find the walking and spider variations too.
 *
 * `synonyms` are extra words that should find the family; the family's own
 * values are always searchable on their own.
 */
export const CHOREO_FAMILIES = [
  {
    id: 'push-ups',
    label: 'Push-Ups',
    values: ['Push-Ups', 'Walking Push-Ups', 'Spider Push-Ups', 'Plyo Push-Ups'],
    synonyms: ['pushup', 'press up', 'press ups'],
  },
  {
    id: 'hovers',
    label: 'Hovers & Planks',
    values: ['Hovers', 'Side Hovers', 'Rotating Hovers', 'Walking Hovers', 'Hover Taps', 'Rotating Side Hovers', 'Shoulder Tap Hovers', 'Hovers Forward/Back', 'Hover Stomps', 'Plank Jacks', 'Plank Foot Taps', 'Plank Arm Reaches'],
    synonyms: ['plank', 'planks', 'hover', 'hold'],
  },
  {
    id: 'rows',
    label: 'Rows',
    values: ['Rows', 'Single Arm Rows', 'Split Plate Rows', 'Narrow Rows', 'Wide Rows', 'Offset Deadrows'],
    synonyms: ['row'],
  },
  {
    id: 'overhead-presses',
    label: 'Overhead Presses',
    values: ['A-Presses', 'A-Press Sweeps', 'Arnold Presses', 'Narrow Presses', 'Wide Presses', 'Corner Presses', 'Diamond Presses'],
    synonyms: ['overhead', 'shoulder press', 'presses'],
  },
  {
    id: 'curls',
    label: 'Specialty Curls',
    values: ['Preacher Curls', 'Hammer Curls', 'Rainbow Curls', 'Preacher Hammer Curls'],
    synonyms: ['curl', 'curls'],
  },
  {
    id: 'cleans-deadlifts',
    label: 'Cleans & Deadlifts',
    values: ['Hang Cleans', 'Slow Cleans', 'Single Arm Deadlifts', 'Offset Deadlifts', 'Plate Sumo Deadlifts'],
    synonyms: ['clean', 'cleans', 'deadlift', 'deadlifts'],
  },
  {
    id: 'kickbacks',
    label: 'Kickbacks',
    values: ['Kickbacks', 'Double Kickbacks'],
    synonyms: ['kickback', 'tricep kickbacks'],
  },
  {
    id: 'hip-bridges',
    label: 'Hip Bridges',
    values: ['Hip Bridges', 'Hip Lifts'],
    synonyms: ['bridge', 'bridges', 'glute bridges'],
  },
  {
    id: 'dips',
    label: 'Dips',
    values: ['Dips'],
    synonyms: ['dip', 'tricep dips'],
  },
  {
    id: 'squat-presses',
    label: 'Plate Squat Presses',
    values: ['Plate Squat Presses', 'Drop Squat Plate Presses'],
    synonyms: ['squat press', 'squat presses'],
  },
  {
    id: 'raises',
    label: 'Raises',
    values: ['Rotator Raises', 'Forward Raises', 'Mac Raises', 'Side Raises with Extension', 'Split Rear Raises', 'Lu Raises', 'Wide Side Raises'],
    synonyms: ['raise', 'raises'],
  },
  {
    id: 'barbell-only',
    label: 'Barbell Only',
    values: ['Barbell Only'],
    synonyms: ['no plates', 'bar only', 'barbell'],
  },
]

/**
 * Lowercase, punctuation-free forms of a string. Returns both a spaced form
 * ("push ups") and a squashed one ("pushups") so that "push-ups", "push ups"
 * and "pushups" all find the same tracks.
 */
function normalizeForms(text) {
  const lower = String(text ?? '').toLowerCase()
  return {
    spaced: lower.replace(/[^a-z0-9]+/g, ' ').trim(),
    squashed: lower.replace(/[^a-z0-9]+/g, ''),
  }
}

/**
 * Canonical name for a single raw choreo value.
 */
export function canonicalizeChoreo(value) {
  const trimmed = String(value ?? '').trim()
  if (!trimmed || trimmed.toLowerCase() === 'nan') return null
  const canonical = CHOREO_ALIASES[trimmed] || trimmed
  return CHOREO_IGNORED.has(canonical) ? null : canonical
}

/**
 * Parse the raw Choreo cell into a de-duplicated list of canonical moves.
 * Returns [] for blank cells, which callers must read as "unknown".
 */
export function parseChoreo(choreoString) {
  if (!choreoString) return []
  const seen = new Set()
  for (const part of String(choreoString).split(',')) {
    const canonical = canonicalizeChoreo(part)
    if (canonical) seen.add(canonical)
  }
  return [...seen].sort()
}

/**
 * True when we actually know this track's choreography. A track from before
 * the Choreo backfill has no data, which is not the same as having no moves.
 */
export function hasChoreoData(track) {
  return Array.isArray(track?.ChoreoList) && track.ChoreoList.length > 0
}

/**
 * Every phrase that should find this set of moves: the moves themselves plus
 * the labels and synonyms of any family they belong to. Precomputed per track
 * at load time so searching stays a cheap string test.
 */
export function buildChoreoSearchText(choreoList = []) {
  if (choreoList.length === 0) return { spaced: '', squashed: '' }

  const phrases = [...choreoList]
  const owned = new Set(choreoList)
  for (const family of CHOREO_FAMILIES) {
    if (family.values.some(v => owned.has(v))) {
      phrases.push(family.label, ...family.synonyms)
    }
  }

  const forms = phrases.map(normalizeForms)
  return {
    spaced: forms.map(f => f.spaced).join(' | '),
    squashed: forms.map(f => f.squashed).join(' '),
  }
}

/**
 * Does a single search word describe this track's choreography?
 */
export function choreoMatchesWord(track, word) {
  const text = track?.ChoreoSearchText
  if (!text || !text.squashed) return false
  const { spaced, squashed } = normalizeForms(word)
  if (!squashed) return false
  return text.spaced.includes(spaced) || text.squashed.includes(squashed)
}

/**
 * Values dropped on sight. "Hard Timing" is a judgement about how a track
 * feels, not a description of its choreography, so it doesn't belong in the
 * move list. Handled here rather than in the spreadsheet so it stays gone
 * after a re-export.
 */
const CHOREO_IGNORED = new Set(['Hard Timing'])

/**
 * Values that describe the kit or grip rather than a movement.
 */
const EQUIPMENT_VALUES = new Set([
  'Barbell Only', 'Small Plates', 'Large Plate', 'No Bar Overhead', 'Mid Grip',
])

/**
 * Values that describe how a track is structured rather than what you do in it.
 */
const NOTE_VALUES = new Set([
  'No Squats', 'Isometric Holds', 'Horse Stance',
])

export const CHOREO_GROUPS = [
  { id: 'moves', label: 'Moves' },
  { id: 'equipment', label: 'Equipment & grip' },
  { id: 'notes', label: 'Timing & structure' },
]

export function getChoreoCategory(value) {
  if (EQUIPMENT_VALUES.has(value)) return 'equipment'
  if (NOTE_VALUES.has(value)) return 'notes'
  return 'moves'
}

/**
 * Choreo values grouped by the track they belong to.
 *
 * Almost all of them are slot-specific - "No Squats" is a lunges note, and
 * "Push-Ups" means something different in a chest track than a triceps one.
 * Listing them flat strips that context, so the track is the grouping.
 *
 * A value that genuinely spans tracks appears under each one. Counts are per
 * track, not catalog-wide, so ordering reflects what you'd actually find.
 *
 * Pass `slot` to get just one track's moves, for a list that already knows
 * which track it's filling.
 */
export function getChoreoVocabulary(tracks = [], { slot = null } = {}) {
  const bySlot = new Map()
  // A slot can accept more than one Track No#, so scoping takes a list too.
  const wanted = slot ? new Set(Array.isArray(slot) ? slot : [slot]) : null

  for (const track of tracks) {
    if (!Array.isArray(track?.ChoreoList) || track.ChoreoList.length === 0) continue
    const trackSlot = track['Track No#']
    if (wanted && !wanted.has(trackSlot)) continue

    if (!bySlot.has(trackSlot)) bySlot.set(trackSlot, new Map())
    const counts = bySlot.get(trackSlot)
    for (const value of track.ChoreoList) {
      counts.set(value, (counts.get(value) || 0) + 1)
    }
  }

  const toItems = (counts) =>
    [...counts.entries()]
      .map(([value, count]) => ({ value, count, category: getChoreoCategory(value) }))
      .sort((a, b) => b.count - a.count || a.value.localeCompare(b.value))

  if (wanted) {
    const merged = new Map()
    for (const [trackSlot, counts] of bySlot) {
      if (!wanted.has(trackSlot)) continue
      for (const [value, count] of counts) merged.set(value, (merged.get(value) || 0) + count)
    }
    return merged.size > 0 ? toItems(merged) : []
  }

  return [...bySlot.entries()]
    .map(([trackSlot, counts]) => ({
      id: trackSlot,
      label: trackSlot,
      bodyPart: trackSlot.split(' - ')[1] || trackSlot,
      items: toItems(counts),
    }))
    .sort((a, b) => (parseInt(a.id, 10) || 99) - (parseInt(b.id, 10) || 99))
}

/**
 * "Rule this out" options offered alongside a track's moves.
 *
 * Restricted to the tracks where avoiding the move is a real programming
 * choice. Push-ups turn up occasionally in the warmup, biceps and core too,
 * but there they're incidental - offering the option would imply those tracks
 * routinely have push-ups to avoid.
 *
 * These drop tracks whose choreography we never logged, because a blank means
 * "unknown", not "doesn't have it".
 */
export const CHOREO_NEGATIVES = [
  {
    id: 'no-push-ups',
    familyId: 'push-ups',
    label: 'No Push-Ups',
    query: '-pushups',
    bodyParts: ['Chest', 'Triceps', 'Shoulders'],
  },
]

/**
 * The rule-out options that make sense for a given track's moves.
 */
export function getChoreoNegatives(items = [], bodyPart = null) {
  if (!bodyPart) return []
  const values = new Set(items.map(item => item.value ?? item))

  return CHOREO_NEGATIVES.filter(negative => {
    if (!negative.bodyParts.some(part => part.toLowerCase() === bodyPart.toLowerCase())) return false
    const family = CHOREO_FAMILIES.find(f => f.id === negative.familyId)
    return family?.values.some(value => values.has(value))
  })
}

/**
 * The moves that caused this track to match, so results can say why.
 * Returns [] when nothing in the search described choreography.
 */
export function matchedChoreoValues(track, searchWords = []) {
  if (!hasChoreoData(track) || searchWords.length === 0) return []

  const matched = new Set()
  for (const word of searchWords) {
    const { spaced, squashed } = normalizeForms(word)
    if (!squashed) continue

    for (const value of track.ChoreoList) {
      const valueForms = normalizeForms(value)
      if (valueForms.spaced.includes(spaced) || valueForms.squashed.includes(squashed)) {
        matched.add(value)
      }
    }

    // A family word like "planks" matches moves that don't contain the word.
    // Substring, not equality, so this stays in step with how search matches.
    for (const family of CHOREO_FAMILIES) {
      const familyPhrases = [family.label, ...family.synonyms].map(normalizeForms)
      const hit = familyPhrases.some(f => f.spaced.includes(spaced) || f.squashed.includes(squashed))
      if (!hit) continue
      for (const value of track.ChoreoList) {
        if (family.values.includes(value)) matched.add(value)
      }
    }
  }
  return [...matched]
}
