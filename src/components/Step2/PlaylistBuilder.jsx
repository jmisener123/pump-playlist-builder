import React, { useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Button } from '../ui/Button'
import { TrackSlot, EmptyTrackMessage } from './TrackSlot'
import { TotalDuration } from './TotalDuration'
import { TrackSearch } from './TrackSearch'
import { PlaylistExport } from './PlaylistExport'
import { TRACK_TYPES } from '../../utils/trackUtils'

export function PlaylistBuilder({ mode = 'random', showRandomAction = false }) {
  const { state } = usePlaylist()
  const { playlist, setTrack, clearTrack, clearPlaylist, randomizeTrack, generateRandom, hasAnyTracks } = usePlaylistBuilder()
  const { getTracksForSlot, getThemedTracksForSlot } = usePlaylistData()
  const [searchPosition, setSearchPosition] = useState(null)
  const [browseMode, setBrowseMode] = useState(false)

  // Check if any theme filters are active
  const hasThemeFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

  // Only show themed options if filters are active AND playlist has tracks
  const showThemedOptions = hasThemeFilters && hasAnyTracks

  // Get active theme description
  const getActiveThemeText = () => {
    const parts = []
    if (state.themeTags.length > 0) {
      parts.push(state.themeTags.join(', '))
    }
    if (state.instructorTags.length > 0) {
      parts.push(state.instructorTags.join(', '))
    }
    if (state.selectedGenres.length > 0) {
      parts.push(state.selectedGenres.join(', '))
    }
    return parts.join(' • ')
  }

  const handleSearch = (position) => {
    setBrowseMode(false)
    setSearchPosition(position)
  }

  const handleBrowse = (position) => {
    setBrowseMode(true)
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
    setBrowseMode(false)
  }

  // Get themed options for a position (excluding current track)
  const getThemedOptionsForSlot = (index) => {
    if (!showThemedOptions) return []
    const themedTracks = getThemedTracksForSlot(index)
    const currentTrack = playlist[index]
    // Exclude current track from options
    return themedTracks.filter(t =>
      !currentTrack || t['Song Title'] !== currentTrack['Song Title']
    )
  }

  return (
    <div className="panel">
      <div className="flex items-center justify-between gap-2 px-3 py-2 border-b border-ink-200 dark:border-ink-800 min-h-[2.5rem]">
        <div className="flex items-center gap-2">
          {hasThemeFilters && (
            <span className="pill-accent max-w-[22rem] truncate" title={getActiveThemeText()}>
              {getActiveThemeText()}
            </span>
          )}
        </div>
        {hasAnyTracks && (
          <button
            onClick={clearPlaylist}
            className="display-sm text-[11px] text-ink-400 hover:text-flare transition-colors shrink-0"
            title="Clear playlist and start over"
          >
            Clear all
          </button>
        )}
      </div>

      {showRandomAction && (
        <div className="p-3 border-b border-ink-200 dark:border-ink-800">
          <Button variant="primary" onClick={generateRandom} className="w-full">
            Fill all randomly
          </Button>
        </div>
      )}

      {!hasAnyTracks && !showRandomAction && (
        <div className="px-3 py-4 text-ink-400">
          <p className="text-sm hidden lg:block">Empty. Use the tools on the left, or fill any slot directly below.</p>
          <p className="text-sm lg:hidden">Empty. Use the Search or Themes tabs, or fill any slot below.</p>
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
              onSearch={() => handleSearch(index)}
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

      <PlaylistExport />

      {/* Search/Browse Modal */}
      {searchPosition !== null && (
        <TrackSearch
          position={searchPosition}
          trackType={TRACK_TYPES[searchPosition]}
          onSelect={handleSelectTrack}
          onClose={handleCloseSearch}
          browseMode={browseMode}
        />
      )}
    </div>
  )
}
