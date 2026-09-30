import React, { useState } from 'react'
import { formatTrackRelease } from '../../utils/trackUtils'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'

/**
 * Artist truncates on its own; release and duration stay pinned so a long
 * artist name can't push them out of view on narrow screens.
 */
function TrackMeta({ track }) {
  return (
    <span className="flex items-baseline gap-1 text-xs text-ink-500 dark:text-ink-400 tabular">
      <span className="min-w-0 truncate">{track.Artist}</span>
      <span className="shrink-0">{'\u00B7'} {formatTrackRelease(track)} {'\u00B7'} {track.Duration}</span>
    </span>
  )
}

/**
 * Read-only note for theme matches that sit below the earliest-release
 * cutoff. Collapsed by default: at a recent cutoff these can outnumber the
 * usable options, and none of them are selectable.
 */
function OlderMatchesNote({ tracks, earliestRelease, className = '' }) {
  const [open, setOpen] = useState(false)
  if (tracks.length === 0) return null

  return (
    <div className={className}>
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        className="text-xs text-ink-400 dark:text-ink-500 hover:text-ink-700 dark:hover:text-ink-300 transition-colors tabular"
      >
        {tracks.length} more before release {earliestRelease}
        <span aria-hidden="true" className="ml-1">{open ? '\u25B4' : '\u25BE'}</span>
      </button>
      {open && (
        <div className="mt-1.5">
          <ul className="border border-dashed border-ink-200 dark:border-ink-800 rounded divide-y divide-ink-100 dark:divide-ink-800 max-h-48 overflow-y-auto opacity-70">
            {tracks.map((t) => (
              <li key={`${t.Release}_${t['Song Title']}`} className="px-3 py-2 min-w-0">
                <span className="block text-sm font-semibold text-ink-700 dark:text-ink-300 truncate">
                  {t['Song Title']}
                </span>
                <TrackMeta track={t} />
              </li>
            ))}
          </ul>
          <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500">
            Outside your releases — lower your earliest release to use these.
          </p>
        </div>
      )}
    </div>
  )
}

export function TrackSlot({
  position,
  trackType,
  track,
  onRandom,
  onClear,
  onBrowse,
  themedOptions = [],
  olderThemedOptions = [],
  earliestRelease,
  availableCount = 0,
  onThemedSwap,
  onRandomThemed,
  hasThemeFilters = false,
  activeThemeText = '',
  activeFilterTags = []
}) {
  const isEmpty = !track
  const [showThemedDropdown, setShowThemedDropdown] = useState(false)

  const hasThemedOptions = themedOptions.length > 0
  // Only worth its own line when the slot otherwise looks like a dead end.
  // With swappable options present it would just stack a near-identical
  // disclosure under the existing one, so the count moves into that list.
  const showOlderNote = olderThemedOptions.length > 0 && !hasThemedOptions
  const noThemedTrackAvailable = hasThemeFilters && !hasThemedOptions
  const [showActions, setShowActions] = useState(false)
  // Name the theme instead of saying "themed"; fall back for long combos.
  const themeLabel = activeThemeText && activeThemeText.length <= 18 ? activeThemeText : 'Theme'
  // Show the current track in its place so the newest-first order reads clearly.
  const themedListItems = track
    ? [...themedOptions, { ...track, isCurrent: true }].sort((a, b) => b.SortKey - a.SortKey)
    : themedOptions

  return (
    <div className="border-b border-ink-200 dark:border-ink-800 last:border-b-0 px-3 py-2.5">
      {/* Track Type Header */}
      <div className="flex items-center justify-between gap-2">
        <h4 className="display-sm text-[11px] text-ink-400 dark:text-ink-500">
          {trackType}
        </h4>
        <div className="flex items-center gap-2">
          {noThemedTrackAvailable && isEmpty && (
            <span className="text-xs text-ink-400">
              No {themeLabel === 'Theme' ? 'theme' : themeLabel} match
            </span>
          )}
          {track && (
            <span className="text-xs text-ink-400 tabular">
              {track.Duration}
            </span>
          )}
        </div>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="py-2">
          {/* Wraps instead of squeezing: a rigid 4-col grid clipped the
              longer "Browse all" label on narrow screens. */}
          <div className="flex flex-wrap gap-1">
            <Button variant="outline" size="sm" onClick={onRandom} className="flex-1 min-w-[4.5rem] whitespace-nowrap">
              Random
            </Button>
            {hasThemedOptions && (
              <Button variant="secondary" size="sm" onClick={onRandomThemed} className="flex-1 min-w-[4.5rem] whitespace-nowrap" title={`Random ${activeThemeText} track`}>
                {themeLabel}
              </Button>
            )}
            <Button variant="blue-outline" size="sm" onClick={onBrowse} className="flex-1 min-w-[7rem] whitespace-nowrap">
              Browse all ({availableCount})
            </Button>
          </div>
          <OlderMatchesNote
            tracks={showOlderNote ? olderThemedOptions : []}
            earliestRelease={earliestRelease}
            className="mt-2"
          />
        </div>
      ) : (
        /* Filled State */
        <div className="mt-1">
          {/* Track Info */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-display font-extrabold text-[15px] leading-tight text-ink-950 dark:text-paper truncate">
                {track['Song Title']}
              </p>
              <p className="text-sm text-ink-600 dark:text-ink-300 truncate">
                {track.Artist}
              </p>
              <p className="text-xs text-ink-400 mt-1 tabular">
                <span className="release-number">{formatTrackRelease(track)}</span>
                {' · '}{track.Genre || 'Unknown'}
              </p>
              {track.Tags && (() => {
                // Tags matching the active theme lead and take the accent, so
                // you can see why each track made the cut.
                const tags = track.Tags.split(',').map(t => t.trim()).filter(t => t && t !== 'nan')
                const ordered = [
                  ...tags.filter(t => activeFilterTags.includes(t)),
                  ...tags.filter(t => !activeFilterTags.includes(t)),
                ]
                return ordered.length > 0
                  ? <div className="mt-1"><TagList tags={ordered} size="sm" activeTags={activeFilterTags} /></div>
                  : null
              })()}
              {hasThemedOptions && (
                <button
                  onClick={() => {
                    setShowThemedDropdown(!showThemedDropdown)
                    setShowActions(false)
                  }}
                  aria-expanded={showThemedDropdown}
                  className="mt-1.5 text-xs font-semibold text-accent hover:underline underline-offset-2 tabular"
                >
                  {showThemedDropdown ? 'Hide' : 'See'} {themedOptions.length} more{' '}
                  {themeLabel === 'Theme' ? 'matching' : themeLabel}{' '}
                  {themedOptions.length === 1 ? 'track' : 'tracks'}
                  <span aria-hidden="true" className="ml-1">{showThemedDropdown ? '\u25B4' : '\u25BE'}</span>
                </button>
              )}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => {
                  setShowActions(!showActions)
                  setShowThemedDropdown(false)
                }}
                aria-expanded={showActions}
                className={`px-2 py-1 display-sm text-[11px] rounded border transition-colors ${showActions
                  ? 'bg-ink-950 dark:bg-paper text-paper dark:text-ink-950 border-ink-950 dark:border-paper'
                  : 'text-ink-600 dark:text-ink-300 border-ink-200 dark:border-ink-700 hover:border-ink-950 hover:text-ink-950 dark:hover:border-paper dark:hover:text-paper'}`}
              >
                Change
              </button>
              <button
                onClick={onClear}
                className="px-1.5 py-1 text-xs text-ink-400 hover:text-flare dark:hover:text-flare-400 rounded transition-colors"
                title="Remove"
                aria-label="Remove track"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>

          {/* Action Buttons — collapsed by default */}
          {showActions && (
            <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-ink-100 dark:border-ink-800">
              <button onClick={onRandom} className="btn-quiet">Random</button>
              <button onClick={onBrowse} className="btn-quiet">Browse</button>
            </div>
          )}

          {/* Other tracks matching the active theme, shown inline so they can
              be scanned and swapped in with one tap. */}
          {showThemedDropdown && hasThemedOptions && (
            <ul className="mt-2 border border-ink-200 dark:border-ink-800 rounded divide-y divide-ink-100 dark:divide-ink-800 max-h-64 overflow-y-auto">
              {themedListItems.map((t) => (
                <li key={`${t.Release}_${t['Song Title']}`}>
                  {t.isCurrent ? (
                    <div
                      aria-current="true"
                      className="flex items-center justify-between gap-3 px-3 py-2 bg-ink-50 dark:bg-ink-800/60"
                    >
                      <span className="min-w-0">
                        <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100 truncate">
                          {t['Song Title']}
                        </span>
                        <TrackMeta track={t} />
                      </span>
                      <span className="display-sm text-[11px] text-accent shrink-0">Current</span>
                    </div>
                  ) : (
                  <button
                    onClick={() => {
                      onThemedSwap(t)
                      setShowThemedDropdown(false)
                    }}
                    className="w-full flex items-center justify-between gap-3 px-3 py-2 text-left
                               hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                  >
                    <span className="min-w-0">
                      <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100 truncate">
                        {t['Song Title']}
                      </span>
                      <TrackMeta track={t} />
                    </span>
                    <span className="display-sm text-[11px] text-ink-500 dark:text-ink-400 shrink-0">Swap</span>
                  </button>
                  )}
                </li>
              ))}
            </ul>
          )}

          {/* Once the list is open, the count rides along as a footnote rather
              than claiming a disclosure line of its own. */}
          {showThemedDropdown && hasThemedOptions && olderThemedOptions.length > 0 && (
            <p className="mt-1 text-[11px] text-ink-400 dark:text-ink-500 tabular">
              {olderThemedOptions.length} more before release {earliestRelease}, outside your releases.
            </p>
          )}

          <OlderMatchesNote
            tracks={showOlderNote ? olderThemedOptions : []}
            earliestRelease={earliestRelease}
            className="mt-2"
          />
        </div>
      )}
    </div>
  )
}

export function EmptyTrackMessage({ position, trackType, onRandom, onPartialMatch, hasPartialMatches }) {
  return (
    <div className="border-b border-ink-200 dark:border-ink-800 last:border-b-0 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <h4 className="display-sm text-[11px] text-ink-400 dark:text-ink-500">
          {trackType}
        </h4>
        <span className="pill-off text-accent border-flare-200">
          No themed match
        </span>
      </div>
      <div className="flex gap-2 mt-1">
        <Button variant="outline" size="sm" onClick={onRandom}>
          Random
        </Button>
        {hasPartialMatches && (
          <Button variant="outline" size="sm" onClick={onPartialMatch}>
            Partial
          </Button>
        )}
      </div>
    </div>
  )
}
