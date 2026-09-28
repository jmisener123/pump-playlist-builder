import React, { useState } from 'react'
import { formatReleaseShort } from '../../utils/trackUtils'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'

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
                <span className="release-number">{formatReleaseShort(track.Release)}</span>
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
              {hasThemedOptions && (
                <button
                  onClick={() => setShowThemedDropdown(!showThemedDropdown)}
                  className={`btn-quiet tabular whitespace-nowrap ${showThemedDropdown ? 'text-accent' : ''}`}
                  aria-expanded={showThemedDropdown}
                >
                  {themeLabel} ({themedOptions.length})
                </button>
              )}
              <button onClick={onBrowse} className="btn-quiet">Browse</button>
            </div>
          )}

          {/* Theme swap: picks from the other tracks matching the active theme */}
          {showActions && showThemedDropdown && hasThemedOptions && (
            <div className="mt-2">
              <select
                className="select-field text-xs py-1.5"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const selected = themedOptions.find(
                      t => `${t.Release}_${t['Song Title']}` === e.target.value
                    )
                    if (selected) {
                      onThemedSwap(selected)
                      setShowThemedDropdown(false)
                      setShowActions(false)
                    }
                  }
                }}
              >
                <option value="">Pick a {themeLabel === 'Theme' ? 'matching' : themeLabel} track…</option>
                {themedOptions.map((t) => (
                  <option
                    key={`${t.Release}_${t['Song Title']}`}
                    value={`${t.Release}_${t['Song Title']}`}
                  >
                    {formatReleaseShort(t.Release)} — {t['Song Title']} · {t.Artist}
                  </option>
                ))}
              </select>
            </div>
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
