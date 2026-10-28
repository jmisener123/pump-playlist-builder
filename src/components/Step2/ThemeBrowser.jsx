import React, { useMemo, useState } from 'react'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { useToast } from '../../context/ToastContext'
import { Modal } from '../ui/Modal'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'
import { copyText } from '../../utils/clipboard'
import { ALL_TRACK_TYPES, formatTrackLine, formatTrackRelease, formatTrackType, getTrackIndex, formatOnlyLabel } from '../../utils/trackUtils'

/**
 * Every track matching the active theme, across all releases — including the
 * ones outside your catalog. Grouped by slot so it reads as "what could this
 * theme look like", and so an in-range pick can drop straight into place.
 */
export function ThemeBrowser({ themeLabel, onSelect, onClose }) {
  const { allThemedTracks, filteredTracks, trackTypes, classFormat, searchBothFormats } = usePlaylistData()
  const [ownedOnly, setOwnedOnly] = useState(false)
  // Which copy button last fired, so only that one flips to "Copied".
  const [copiedKey, setCopiedKey] = useState(null)
  const showToast = useToast()

  // Same objects flow through both filters, so reference identity is enough
  // to tell an owned track from one outside the catalog.
  const ownedSet = useMemo(() => new Set(filteredTracks), [filteredTracks])

  // Slots from the other format only appear when you've asked to see both,
  // and they sit after the ones you're actually building.
  const visibleTypes = useMemo(
    () => (searchBothFormats
      ? [...trackTypes, ...ALL_TRACK_TYPES.filter(t => !trackTypes.includes(t))]
      : trackTypes),
    [trackTypes, searchBothFormats]
  )

  const groups = useMemo(() => {
    const byType = new Map(visibleTypes.map(type => [type, []]))
    allThemedTracks.forEach(track => {
      const bucket = byType.get(track['Track No#'])
      if (bucket) bucket.push(track)
    })
    return visibleTypes.map(type => ({
      type,
      tracks: byType.get(type).sort((a, b) => b.SortKey - a.SortKey)
    }))
  }, [allThemedTracks, visibleTypes])

  // "Usable" means two things: inside your release range, and in a slot the
  // format you're building actually has. A combo track you own is still no
  // use while you're teaching a 55-minute class.
  const isUsable = (track) =>
    ownedSet.has(track) && !formatOnlyLabel(track['Track No#'], classFormat)

  const usableCount = allThemedTracks.filter(isUsable).length
  const unusableCount = allThemedTracks.length - usableCount
  const otherFormatCount = allThemedTracks.filter(
    t => formatOnlyLabel(t['Track No#'], classFormat)
  ).length
  const outsideCount = allThemedTracks.filter(t => !ownedSet.has(t)).length

  // What's actually on screen, so a copied list always matches what you see.
  const visibleGroups = useMemo(
    () => groups
      .map(({ type, tracks }) => ({
        type,
        tracks: ownedOnly ? tracks.filter(isUsable) : tracks
      }))
      .filter(group => group.tracks.length > 0),
    [groups, ownedOnly, ownedSet, classFormat]
  )

  // Plain text you can paste straight into a chat or a Facebook comment --
  // no emoji bullets, no markdown, one track per line.
  const groupText = ({ type, tracks }) =>
    [
      `${themeLabel} \u2014 ${formatTrackType(type, classFormat)} (${tracks.length})`,
      ...tracks.map(formatTrackLine)
    ].join('\n')

  const handleCopy = async (key, text, detail) => {
    if (!await copyText(text)) {
      showToast('Copy failed', 'Try again')
      return
    }
    setCopiedKey(key)
    setTimeout(() => setCopiedKey(current => (current === key ? null : current)), 2000)
    showToast('List copied \u2713', detail)
  }

  const copyAll = () => {
    const text = visibleGroups.map(groupText).join('\n\n')
    const total = visibleGroups.reduce((sum, group) => sum + group.tracks.length, 0)
    handleCopy('all', text, `${total} tracks`)
  }

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
            {usableCount} you can use
            {outsideCount > 0 && ` · ${outsideCount} outside your releases`}
            {otherFormatCount > 0 && ` · ${otherFormatCount} other format`}
          </p>
          {unusableCount > 0 && (
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

        {visibleGroups.length > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-2 border border-ink-200 dark:border-ink-800 rounded px-3 py-2">
            <p className="text-xs text-ink-500 dark:text-ink-400">
              Copy these as plain text to share in a chat or group.
            </p>
            <Button
              variant={copiedKey === 'all' ? 'accent' : 'outline'}
              size="sm"
              onClick={copyAll}
              className="shrink-0"
            >
              {copiedKey === 'all' ? 'Copied \u2713' : 'Copy all to clipboard'}
            </Button>
          </div>
        )}

        <div className="space-y-4">
          {visibleGroups.map(({ type, tracks: shown }) => {
            const otherFormat = formatOnlyLabel(type, classFormat)

            return (
              <div key={type}>
                <h4 className="display-sm text-[11px] text-ink-400 dark:text-ink-500 sticky top-0 bg-white dark:bg-ink-900 py-1 flex flex-wrap items-center justify-between gap-x-2">
                  <span>
                    {formatTrackType(type, classFormat)} ({shown.length})
                    {otherFormat && (
                      <span className="ml-1.5 normal-case tracking-normal text-ink-400">· {otherFormat}</span>
                    )}
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCopy(
                      type,
                      groupText({ type, tracks: shown }),
                      `${shown.length} ${shown.length === 1 ? 'track' : 'tracks'}`
                    )}
                    className="shrink-0 normal-case tracking-normal text-[11px] text-ink-500 hover:text-flare dark:text-ink-400 dark:hover:text-flare-400 transition-colors"
                  >
                    {copiedKey === type ? 'Copied \u2713' : 'Copy list to clipboard'}
                  </button>
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
                          {otherFormat ? (
                            <span className="eyebrow text-ink-400 whitespace-nowrap">
                              {otherFormat}
                            </span>
                          ) : owned ? (
                            <Button
                              variant="primary"
                              size="sm"
                              onClick={() => {
                                onSelect(getTrackIndex(track['Track No#'], classFormat), track)
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

        {unusableCount > 0 && !ownedOnly && (
          <p className="text-[11px] text-ink-400 dark:text-ink-500">
            {outsideCount > 0 && 'Dimmed tracks sit outside your release range. Lower your earliest release in Step 1 to use them. '}
            {otherFormatCount > 0 && `Tracks marked "45 min only" or "55 min only" belong to the other class format. Switch format in Step 1 to use them.`}
          </p>
        )}
      </div>
    </Modal>
  )
}
