import React, { useState } from 'react'
import { formatTrackRelease } from '../../utils/trackUtils'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'

/**
 * Wraps instead of truncating so long artist names stay readable on narrow
 * screens; release and duration stay glued together on one line.
 */
function TrackMeta({ track }) {
  return (
    <span className="block text-xs text-ink-500 dark:text-ink-400 tabular break-words">
      {track.Artist}{' '}
      <span className="whitespace-nowrap">
        {'\u00B7'} {formatTrackRelease(track)} {'\u00B7'} {track.Duration}
      </span>
    </span>
  )
}

/**
 * Splits "2 - Squats" into its number and body-part name so the slot header
 * can lead with a badge instead of a faint run-on label.
 */
function splitTrackType(trackType) {
  const match = /^(\d+)\s*-\s*(.*)$/.exec(trackType)
  return match ? { number: match[1], name: match[2] } : { number: '', name: trackType }
}

function SlotHeading({ trackType, filled }) {
  const { number, name } = splitTrackType(trackType)
  return (
    <div className="flex items-center gap-2 min-w-0">
      {number && (
        <span
          aria-hidden="true"
          className={`shrink-0 w-5 h-5 rounded-sm flex items-center justify-center font-display font-bold text-[11px] tabular ${filled
            ? 'bg-ink-950 dark:bg-paper text-paper dark:text-ink-950'
            : 'border border-ink-300 dark:border-ink-700 text-ink-400 dark:text-ink-500'}`}
        >
          {number}
        </span>
      )}
      <h4 className={`display-sm text-xs truncate ${filled
        ? 'text-ink-950 dark:text-paper'
        : 'text-ink-400 dark:text-ink-500'}`}
      >
        {name}
      </h4>
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
  const noThemedTrackAvailable = hasThemeFilters && !hasThemedOptions
  const [showActions, setShowActions] = useState(false)
  // Name the theme instead of saying "themed"; fall back for long combos.
  const themeLabel = activeThemeText && activeThemeText.length <= 18 ? activeThemeText : 'Theme'
  // Show the current track in its place so the newest-first order reads clearly.
  const themedListItems = track
    ? [...themedOptions, { ...track, isCurrent: true }].sort((a, b) => b.SortKey - a.SortKey)
    : themedOptions

  return (
    <div className={`border-b border-ink-200 dark:border-ink-800 last:border-b-0 px-3 py-2.5 ${isEmpty ? 'bg-ink-50/60 dark:bg-ink-900/40' : ''}`}>
      {/* Track Type Header */}
      <div className="flex items-center justify-between gap-2">
        <SlotHeading trackType={trackType} filled={!isEmpty} />
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
                        <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100 break-words">
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
                      <span className="block text-sm font-semibold text-ink-900 dark:text-ink-100 break-words">
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
        </div>
      )}
    </div>
  )
}

export function EmptyTrackMessage({ position, trackType, onRandom, onPartialMatch, hasPartialMatches }) {
  return (
    <div className="border-b border-ink-200 dark:border-ink-800 last:border-b-0 px-3 py-2.5">
      <div className="flex items-center justify-between">
        <SlotHeading trackType={trackType} filled={false} />
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
