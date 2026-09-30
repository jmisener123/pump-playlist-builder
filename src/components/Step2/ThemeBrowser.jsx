import React, { useMemo, useState } from 'react'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Modal } from '../ui/Modal'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'
import { TRACK_TYPES, formatTrackRelease, getTrackIndex } from '../../utils/trackUtils'

/**
 * Every track matching the active theme, across all releases — including the
 * ones outside your catalog. Grouped by slot so it reads as "what could this
 * theme look like", and so an in-range pick can drop straight into place.
 */
export function ThemeBrowser({ themeLabel, onSelect, onClose }) {
  const { allThemedTracks, filteredTracks } = usePlaylistData()
  const [ownedOnly, setOwnedOnly] = useState(false)

  // Same objects flow through both filters, so reference identity is enough
  // to tell an owned track from one outside the catalog.
  const ownedSet = useMemo(() => new Set(filteredTracks), [filteredTracks])

  const groups = useMemo(() => {
    const byType = new Map(TRACK_TYPES.map(type => [type, []]))
    allThemedTracks.forEach(track => {
      const bucket = byType.get(track['Track No#'])
      if (bucket) bucket.push(track)
    })
    return TRACK_TYPES.map(type => ({
      type,
      tracks: byType.get(type).sort((a, b) => b.SortKey - a.SortKey)
    }))
  }, [allThemedTracks])

  const ownedCount = allThemedTracks.filter(t => ownedSet.has(t)).length
  const outsideCount = allThemedTracks.length - ownedCount

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={`All ${themeLabel} tracks (${allThemedTracks.length})`}
      size="lg"
    >
      <div className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="eyebrow tabular">
            {ownedCount} in your releases
            {outsideCount > 0 && ` · ${outsideCount} outside`}
          </p>
          {outsideCount > 0 && (
            <label className="flex items-center gap-1.5 text-xs text-ink-600 dark:text-ink-300 cursor-pointer">
              <input
                type="checkbox"
                checked={ownedOnly}
                onChange={(e) => setOwnedOnly(e.target.checked)}
                className="accent-current"
              />
              Only show what I can use
            </label>
          )}
        </div>

        <div className="space-y-4">
          {groups.map(({ type, tracks }) => {
            const shown = ownedOnly ? tracks.filter(t => ownedSet.has(t)) : tracks
            if (shown.length === 0) return null

            return (
              <div key={type}>
                <h4 className="display-sm text-[11px] text-ink-400 dark:text-ink-500 sticky top-0 bg-white dark:bg-ink-900 py-1">
                  {type} ({shown.length})
                </h4>
                <ul className="divide-y divide-ink-100 dark:divide-ink-800 border-t border-ink-100 dark:border-ink-800">
                  {shown.map(track => {
                    const owned = ownedSet.has(track)
                    return (
                      <li
                        key={`${track.Release}_${track['Song Title']}`}
                        className={`flex items-start justify-between gap-3 py-2 ${owned ? '' : 'opacity-60'}`}
                      >
                        <div className="min-w-0">
                          <p className="font-semibold text-sm text-ink-900 dark:text-ink-100 truncate">
                            {track['Song Title']}
                          </p>
                          <p className="text-xs text-ink-500 dark:text-ink-400 truncate">
                            {track.Artist}
                          </p>
                          <p className="text-xs text-ink-400 mt-0.5 tabular">
                            <span className="release-number">{formatTrackRelease(track, { short: false })}</span>
                            {' · '}{track.Duration}
                            {' · '}{track.Genre || 'Unknown'}
                          </p>
                          {track.Tags && (
                            <TagList tags={track.Tags} size="sm" max={4} className="mt-1" />
                          )}
                        </div>
                        <div className="shrink-0">
                          {owned ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                onSelect(getTrackIndex(track['Track No#']), track)
                                onClose()
                              }}
                            >
                              Use
                            </Button>
                          ) : (
                            <span className="eyebrow text-ink-400 whitespace-nowrap">
                              Not in your releases
                            </span>
                          )}
                        </div>
                      </li>
                    )
                  })}
                </ul>
              </div>
            )
          })}
        </div>

        {outsideCount > 0 && !ownedOnly && (
          <p className="text-[11px] text-ink-400 dark:text-ink-500">
            Dimmed tracks sit outside your release range — lower your earliest
            release in Step 1 to use them.
          </p>
        )}
      </div>
    </Modal>
  )
}
