import React, { useState, useEffect } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Button } from '../ui/Button'
import { TrackSlot, EmptyTrackMessage } from './TrackSlot'
import { TotalDuration } from './TotalDuration'
import { TrackSearch } from './TrackSearch'
import { PlaylistExport } from './PlaylistExport'
import { ThemeBrowser } from './ThemeBrowser'
import { TRACK_TYPES, formatThemeLabel } from '../../utils/trackUtils'

export function PlaylistBuilder({ mode = 'random' }) {
  const { state } = usePlaylist()
  const { playlist, setTrack, clearTrack, clearPlaylist, randomizeTrack, generateRandom, hasAnyTracks } = usePlaylistBuilder()
  const { getTracksForSlot, getThemedTracksForSlot, allThemedTracks } = usePlaylistData()
  const [searchPosition, setSearchPosition] = useState(null)
  const [showThemeBrowser, setShowThemeBrowser] = useState(false)
  // Both bulk actions destroy hand-picked tracks with no undo, so they swap
  // the row in place for a confirmation instead of firing immediately.
  const [pending, setPending] = useState(null)

  const filledCount = playlist.filter(Boolean).length

  // Don't let a pending confirm survive the playlist emptying out.
  useEffect(() => {
    if (!hasAnyTracks) setPending(null)
  }, [hasAnyTracks])

  // Check if any theme filters are active
  const hasThemeFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

  // Only show themed options if filters are active AND playlist has tracks
  const showThemedOptions = hasThemeFilters && hasAnyTracks

  // Get active theme description
  const getActiveThemeText = () => formatThemeLabel(state, { emoji: false })

  // The browse row sits far below the theme pill, so name the filter outright
  // when it's a single tag. Stacked filters would run too long, so they fall
  // back to the generic wording.
  const singleFilterName = [...state.themeTags, ...state.instructorTags, ...state.selectedGenres].length === 1
    ? [...state.themeTags, ...state.instructorTags, ...state.selectedGenres][0]
    : null

  const handleBrowse = (position) => {
    setSearchPosition(position)
  }

  const handleSelectTrack = (track) => {
    if (searchPosition !== null) {
      setTrack(searchPosition, track)
      setSearchPosition(null)
    }
  }

  const handleCloseSearch = () => {
    setSearchPosition(null)
  }

  // Get themed options for a position (excluding current track)
  const getThemedOptionsForSlot = (index) => {
    if (!showThemedOptions) return []
    const themedTracks = getThemedTracksForSlot(index)
    const currentTrack = playlist[index]
    // Newest first: the likeliest swap is a recent release.
    return themedTracks
      .filter(t => !currentTrack || t['Song Title'] !== currentTrack['Song Title'])
      .sort((a, b) => b.SortKey - a.SortKey)
  }

  // With no theme pill and no bulk actions, this row would render as an empty
  // 40px strip with a rule under it, so only show it when it has content.
  const showToolbar = hasThemeFilters || hasAnyTracks

  return (
    <div className="panel">
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 border-b border-ink-200 dark:border-ink-800 min-h-[2.5rem]">
          <div className="flex items-center gap-2 min-w-0 max-w-full">
            {hasThemeFilters && (
              <span className="pill-accent max-w-full" title={getActiveThemeText()}>
                <span className="truncate">{formatThemeLabel(state)}</span>
              </span>
            )}
          </div>
          {hasAnyTracks && (
            pending ? (
              <div className="flex items-center gap-2 shrink-0 ml-auto">
                <span className="display-sm text-[11px] text-ink-500 dark:text-ink-400">
                  {pending === 'refill' ? 'Replace' : 'Clear'} all {filledCount}?
                </span>
                <button
                  onClick={() => {
                    if (pending === 'refill') generateRandom()
                    else clearPlaylist()
                    setPending(null)
                  }}
                  className="display-sm text-[11px] text-flare-600 dark:text-flare-400 hover:underline"
                  autoFocus
                >
                  Yes
                </button>
                <span aria-hidden="true" className="text-ink-200 dark:text-ink-700">|</span>
                <button
                  onClick={() => setPending(null)}
                  className="display-sm text-[11px] text-ink-400 hover:text-ink-950 dark:hover:text-paper"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3 shrink-0 ml-auto">
                <button
                  onClick={() => setPending('refill')}
                  className="display-sm text-[11px] text-ink-400 hover:text-flare dark:hover:text-flare-400 transition-colors"
                  title="Replace every slot, including tracks you picked yourself"
                >
                  Refill all randomly
                </button>
                <span aria-hidden="true" className="text-ink-200 dark:text-ink-700">|</span>
                <button
                  onClick={() => setPending('clear')}
                  className="display-sm text-[11px] text-ink-400 hover:text-flare dark:hover:text-flare-400 transition-colors"
                  title="Empty every slot and start over"
                >
                  Clear all
                </button>
              </div>
            )
          )}
        </div>
      )}

      {!hasAnyTracks && (
        <div className="p-3 border-b border-ink-200 dark:border-ink-800">
          <Button variant="primary" onClick={generateRandom} className="w-full">
            Fill all randomly
          </Button>
          <p className="text-xs text-ink-400 mt-2">
            <span className="hidden lg:inline">Or pick a theme on the left, or fill any slot below.</span>
            <span className="lg:hidden">Or use the Search or Themes tabs, or fill any slot below.</span>
          </p>
        </div>
      )}

      <TotalDuration />

      <div className="space-y-0">
        {TRACK_TYPES.map((trackType, index) => {
          const track = playlist[index]
          const themedOptions = getThemedOptionsForSlot(index)
          const availableTracks = getTracksForSlot(index)

          return (
            <TrackSlot
              key={trackType}
              position={index}
              trackType={trackType}
              track={track}
              onRandom={() => randomizeTrack(index, false)}
              onBrowse={() => handleBrowse(index)}
              onClear={() => clearTrack(index)}
              themedOptions={themedOptions}
              availableCount={availableTracks.length}
              onThemedSwap={(newTrack) => setTrack(index, newTrack)}
              onRandomThemed={() => {
                if (themedOptions.length > 0) {
                  const randomIndex = Math.floor(Math.random() * themedOptions.length)
                  setTrack(index, themedOptions[randomIndex])
                }
              }}
              hasThemeFilters={showThemedOptions}
              activeFilterTags={[...state.themeTags, ...state.instructorTags]}
              activeThemeText={getActiveThemeText()}
            />
          )
        })}
      </div>

      {hasThemeFilters && allThemedTracks.length > 0 && (
        <button
          onClick={() => setShowThemeBrowser(true)}
          className="flex items-center justify-between gap-3 w-full text-left px-3 py-2.5 border-t border-ink-200 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
        >
          <span className="display-sm text-ink-950 dark:text-paper">
            Browse all <span className="tabular">{allThemedTracks.length}</span>{' '}
            {singleFilterName ? `${singleFilterName} tracks` : 'matching tracks'} from every release
          </span>
          <span className="text-ink-400 text-lg leading-none w-4 text-center">→</span>
        </button>
      )}

      <PlaylistExport />

      {/* Browse Modal */}
      {searchPosition !== null && (
        <TrackSearch
          position={searchPosition}
          trackType={TRACK_TYPES[searchPosition]}
          onSelect={handleSelectTrack}
          onClose={handleCloseSearch}
        />
      )}

      {/* Every track matching the theme, across all releases */}
      {showThemeBrowser && (
        <ThemeBrowser
          themeLabel={getActiveThemeText()}
          onSelect={(index, track) => {
            if (index >= 0) setTrack(index, track)
          }}
          onClose={() => setShowThemeBrowser(false)}
        />
      )}
    </div>
  )
}
