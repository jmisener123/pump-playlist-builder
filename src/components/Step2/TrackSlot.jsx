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
  hasThemeFilters = false
}) {
  const bodyPart = getBodyPart(trackType)
  const isEmpty = !track
  const [showThemedDropdown, setShowThemedDropdown] = useState(false)

  const hasThemedOptions = themedOptions.length > 0
  const noThemedTrackAvailable = hasThemeFilters && !hasThemedOptions

  return (
    <div className="playlist-card rounded-lg border-l-4 border-primary px-3 py-2 mb-1">
      {/* Track Type Header */}
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          {trackType}
        </h4>
        <div className="flex items-center gap-2">
          {hasThemedOptions && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-1.5 py-0.5 rounded">
              👻 {themedOptions.length} themed
            </span>
          )}
          {noThemedTrackAvailable && (
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
        <div className="py-2 text-center">
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-2">
            Select a {bodyPart.toLowerCase()} track
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            <Button variant="primary" size="sm" onClick={onRandom}>
              🎲 Random
            </Button>
            {hasThemedOptions && (
              <Button variant="secondary" size="sm" onClick={onRandomThemed}>
                👻 Themed
              </Button>
            )}
            <Button variant="outline" size="sm" onClick={onBrowse}>
              📂 Browse ({availableCount})
            </Button>
            <Button variant="outline" size="sm" onClick={onSearch}>
              🔍 Search
            </Button>
          </div>
        </div>
      ) : (
        /* Filled State */
        <div className="mt-1">
          {/* Track Info */}
          <div className="mb-1">
            <p className="font-medium text-sm text-gray-900 dark:text-gray-100">
              "{track['Song Title']}" <span className="font-normal text-gray-600 dark:text-gray-400">by {track.Artist}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Release: <span className="release-number">{track.Release}</span>
              {' | '}{track.Genre || 'Unknown'}
            </p>
          </div>

          {/* Tags */}
          {track.Tags && (
            <div className="mb-1">
              <TagList tags={track.Tags} size="sm" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 hidden sm:inline">Change:</span>
            <div className="flex items-center gap-1">
              <button
                onClick={onRandom}
                className="p-2 sm:px-2 sm:py-1 text-base sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Random"
              >
                🎲
              </button>
              {hasThemedOptions && (
                <button
                  onClick={() => setShowThemedDropdown(!showThemedDropdown)}
                  className={`p-2 sm:px-2 sm:py-1 text-base sm:text-sm rounded transition-colors
                    ${showThemedDropdown
                      ? 'bg-purple-100 dark:bg-purple-900/50'
                      : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                    }`}
                  title={`Themed (${themedOptions.length})`}
                >
                  👻
                </button>
              )}
              <button
                onClick={onBrowse}
                className="p-2 sm:px-2 sm:py-1 text-base sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title={`Browse (${availableCount})`}
              >
                📂
              </button>
              <button
                onClick={onSearch}
                className="p-2 sm:px-2 sm:py-1 text-base sm:text-sm hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                title="Search"
              >
                🔍
              </button>
              <span className="text-gray-300 dark:text-gray-600 mx-1">|</span>
              <button
                onClick={onClear}
                className="p-2 sm:px-2 sm:py-1 text-base sm:text-sm text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors"
                title="Remove"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Themed Swap Dropdown */}
          {showThemedDropdown && hasThemedOptions && (
            <div className="mt-2 pt-2 border-t border-purple-200 dark:border-purple-700 bg-purple-50 dark:bg-purple-900/20 -mx-3 -mb-2 px-3 pb-2 rounded-b-lg">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-purple-700 dark:text-purple-300">
                  👻 Swap with themed track ({themedOptions.length} options)
                </span>
                <button
                  onClick={() => setShowThemedDropdown(false)}
                  className="text-xs text-gray-500 hover:text-gray-700"
                >
                  ✕
                </button>
              </div>
              <select
                className="w-full text-xs py-1.5 px-2 border border-purple-300 dark:border-purple-600 rounded bg-white dark:bg-gray-800"
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
              <button
                onClick={() => {
                  if (themedOptions.length > 0) {
                    const randomIndex = Math.floor(Math.random() * themedOptions.length)
                    onThemedSwap(themedOptions[randomIndex])
                    setShowThemedDropdown(false)
                  }
                }}
                className="mt-1 w-full text-xs py-1 text-purple-600 dark:text-purple-400 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded"
              >
                🎲 Random themed track
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

export function EmptyTrackMessage({ position, trackType, onRandom, onPartialMatch, hasPartialMatches }) {
  return (
    <div className="playlist-card rounded-lg border-l-4 border-yellow-500 px-3 py-2 mb-1">
      <div className="flex items-center justify-between">
        <h4 className="font-semibold text-sm text-gray-800 dark:text-gray-200">
          {trackType}
        </h4>
        <span className="text-yellow-600 dark:text-yellow-400 text-xs font-medium">
          ⚠️ No themed track
        </span>
      </div>
      <div className="flex gap-2 mt-1">
        <Button variant="primary" size="sm" onClick={onRandom}>
          🎲 Random
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
