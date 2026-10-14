import React, { useMemo, useState } from 'react'
import { getChoreoVocabulary, getChoreoNegatives } from '../utils/choreo'

const TOP_PER_TRACK = 6

const BETA_NOTE = 'Beta — move tags are most accurate from Release 89 up. Older releases may be missing moves.'

/**
 * Picks are pinned to their track, since a bare "chest" would also match the
 * move "Chest Presses" elsewhere. A list already filtered to one track needs
 * no prefix.
 */
function scopePrefix(group) {
  return group.preScoped ? '' : `track:${group.bodyPart.toLowerCase()} `
}

/**
 * Collapsible list of the moves in the catalog, so you don't have to guess
 * what's searchable. Clicking one drops it into the search box.
 *
 * Grouped by track, because the values are overwhelmingly track-specific:
 * "No Squats" is a lunges note and means nothing on its own. For the same
 * reason a pick is scoped to its track, unless the caller is already filtered
 * to one (`slot`), in which case the scope is implied.
 *
 * Values are quoted because several are multi-word and would otherwise match
 * too loosely - "no squats" shouldn't pull in every squat track whose title
 * happens to contain "no".
 */
export function ChoreoBrowser({ tracks, onPick, slot = null }) {
  const [open, setOpen] = useState(false)
  const [showAll, setShowAll] = useState(false)

  const groups = useMemo(() => {
    if (slot) {
      const items = getChoreoVocabulary(tracks, { slot })
      if (!items.length) return []
      return [{
        id: slot,
        label: slot,
        bodyPart: slot.split(' - ')[1] || slot,
        preScoped: true,
        items,
      }]
    }
    return getChoreoVocabulary(tracks)
  }, [tracks, slot])

  const hiddenCount = useMemo(
    () => groups.reduce((n, g) => n + Math.max(0, g.items.length - TOP_PER_TRACK), 0),
    [groups]
  )

  if (groups.length === 0) return null

  const visibleGroups = groups.map(group => ({
    ...group,
    items: showAll ? group.items : group.items.slice(0, TOP_PER_TRACK),
    negatives: getChoreoNegatives(group.items, group.bodyPart),
  }))

  return (
    <div className="mt-2">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="eyebrow text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-paper transition-colors"
        aria-expanded={open}
      >
        {open ? '− Hide moves' : '+ Browse moves'} <span className="text-flare">Beta</span>
      </button>

      {open && (
        <div className="mt-2 border border-ink-200 dark:border-ink-800 rounded p-3">
          <p className="text-xs text-ink-400 mb-3">{BETA_NOTE}</p>

          <div className="space-y-3 max-h-56 overflow-y-auto">
            {visibleGroups.map(group => (
              <div key={group.id}>
                {!slot && <p className="eyebrow text-ink-400 mb-1.5">{group.label}</p>}
                <div className="flex flex-wrap gap-1.5">
                  {group.items.map(item => (
                    <button
                      key={item.value}
                      type="button"
                      onClick={() => onPick(scopePrefix(group) + `"${item.value}"`)}
                      className="pill-off"
                    >
                      {item.value}
                    </button>
                  ))}
                  {group.negatives.map(negative => (
                    <button
                      key={negative.id}
                      type="button"
                      onClick={() => onPick(scopePrefix(group) + negative.query)}
                      className="pill-off border-dashed"
                      title="Rule this move out"
                    >
                      {negative.label}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {hiddenCount > 0 && (
            <button
              type="button"
              onClick={() => setShowAll(!showAll)}
              className="eyebrow text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-paper transition-colors mt-3"
            >
              {showAll ? 'Show fewer' : `Show ${hiddenCount} more`}
            </button>
          )}
        </div>
      )}
    </div>
  )
}
