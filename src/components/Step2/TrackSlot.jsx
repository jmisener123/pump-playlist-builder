import React, { useState } from 'react'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'
import { getBodyPart } from '../../utils/trackUtils'

export function TrackSlot({
  position,
  trackType,
  track,
  onRandom,
  onSearch,
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
  const bodyPart = getBodyPart(trackType)
  const isEmpty = !track
  const [showThemedDropdown, setShowThemedDropdown] = useState(false)

  const hasThemedOptions = themedOptions.length > 0
  const noThemedTrackAvailable = hasThemeFilters && !hasThemedOptions
  const [showActions, setShowActions] = useState(false)

  return (
    <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm px-3 py-2 mb-2">
      {/* Track Type Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 pl-2 border-l-2 border-blue-500">
          {trackType}
        </h4>
        <div className="flex items-center gap-2">
          {hasThemedOptions && (
            <button
              onClick={() => setShowThemedDropdown(!showThemedDropdown)}
              className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-1.5 py-0.5 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors cursor-pointer"
              title="Click to view themed tracks"
            >
              Swap themed ({themedOptions.length})
            </button>
          )}
          {noThemedTrackAvailable && isEmpty && (
            <span className="text-xs bg-yellow-100 dark:bg-yellow-900/50 text-yellow-700 dark:text-yellow-300 px-1.5 py-0.5 rounded">
              ⚠️ No themed track
            </span>
          )}
          {track && (
            <span className="text-xs text-gray-500 dark:text-gray-400">
              {track.Duration}
            </span>
          )}
        </div>
      </div>

      {isEmpty ? (
        /* Empty State */
        <div className="py-2">
          <div className={`grid gap-1 ${hasThemedOptions ? 'grid-cols-4' : 'grid-cols-3'}`}>
            <Button variant="blue" size="sm" onClick={onRandom} className="w-full">
              Random
            </Button>
            {hasThemedOptions && (
              <Button variant="secondary" size="sm" onClick={onRandomThemed} className="w-full">
                Themed
              </Button>
            )}
            <Button variant="blue-outline" size="sm" onClick={onBrowse} className="w-full">
              Browse ({availableCount})
            </Button>
            <Button variant="blue-outline" size="sm" onClick={onSearch} className="w-full">
              Search
            </Button>
          </div>
        </div>
      ) : (
        /* Filled State */
        <div className="mt-1">
          {/* Track Info */}
          <div className="flex items-start justify-between gap-2">
            <div className="min-w-0">
              <p className="font-semibold text-base text-gray-900 dark:text-gray-100 truncate">
                "{track['Song Title']}"
              </p>
              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                {track.Artist}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Release <span className="release-number">{track.Release}</span>
                {' · '}{track.Genre || 'Unknown'}
              </p>
              {track.Tags && (() => {
                const filtered = track.Tags.split(',').map(t => t.trim()).filter(t => t && t !== 'nan' && !activeFilterTags.includes(t)).join(', ')
                return filtered ? <div className="mt-1"><TagList tags={filtered} size="sm" /></div> : null
              })()}
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={() => setShowActions(!showActions)}
                className={`px-2 py-1 text-xs rounded transition-colors ${showActions ? 'bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-gray-200' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                title="Change track"
              >
                ✎
              </button>
              <button
                onClick={onClear}
                className="px-2 py-1 text-xs text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Action Buttons — collapsed by default */}
          {showActions && (
            <div className="flex items-center gap-1 mt-2 pt-2 border-t border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-400 mr-1">Change:</span>
              <button onClick={onRandom} className="px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Random</button>
              {hasThemedOptions && (
                <button
                  onClick={() => setShowThemedDropdown(!showThemedDropdown)}
                  className={`px-2 py-1 text-xs rounded transition-colors ${showThemedDropdown ? 'bg-rose-100 dark:bg-rose-900/50' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}`}
                >
                  Themed
                </button>
              )}
              <button onClick={onBrowse} className="px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Browse</button>
              <button onClick={onSearch} className="px-2 py-1 text-xs hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors">Search</button>
            </div>
          )}

          {/* Themed Swap Dropdown */}
          {showThemedDropdown && hasThemedOptions && (
            <div className="mt-2 pt-2 border-t border-rose-200 dark:border-rose-700 bg-rose-50 dark:bg-rose-900/20 -mx-3 -mb-2 px-3 pb-2 rounded-b-md">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-rose-700 dark:text-rose-300">
                  Choose a different themed track for {trackType} ({themedOptions.length} options)
                </span>
                <button
                  onClick={() => setShowThemedDropdown(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <select
                className="w-full text-xs py-1.5 px-2 border border-rose-300 dark:border-rose-600 rounded bg-white dark:bg-gray-800"
                value=""
                onChange={(e) => {
                  if (e.target.value) {
                    const selected = themedOptions.find(
                      t => `${t.Release}_${t['Song Title']}` === e.target.value
                    )
                    if (selected) {
                      onThemedSwap(selected)
                      setShowThemedDropdown(false)
                    }
                  }
                }}
              >
                <option value="">Select a themed track...</option>
                {themedOptions.map((t) => (
                  <option
                    key={`${t.Release}_${t['Song Title']}`}
                    value={`${t.Release}_${t['Song Title']}`}
                  >
                    [{t.Release}] {t['Song Title']} by {t.Artist}
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
    <div className="bg-white dark:bg-gray-800 rounded-md border border-gray-200 dark:border-gray-700 shadow-sm px-3 py-2 mb-2">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200 pl-2 border-l-2 border-blue-500">
          {trackType}
        </h4>
        <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">
          ⚠️ No themed track
        </span>
      </div>
      <div className="flex gap-2 mt-1">
        <Button variant="blue" size="sm" onClick={onRandom}>
          Random
        </Button>
        {hasPartialMatches && (
          <Button variant="outline" size="sm" onClick={onPartialMatch}>
            🎯 Partial
          </Button>
        )}
      </div>
    </div>
  )
}
