import React, { useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Button } from '../ui/Button'
import { TrackSlot, EmptyTrackMessage } from './TrackSlot'
import { TotalDuration } from './TotalDuration'
import { TrackSearch } from './TrackSearch'
import { PlaylistExport } from './PlaylistExport'
import { TRACK_TYPES, TAG_EMOJIS } from '../../utils/trackUtils'

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

  // Get emoji for the active theme
  const getThemeEmoji = () => {
    // Prioritize theme tags
    if (state.themeTags.length === 1) {
      return TAG_EMOJIS[state.themeTags[0]] || '👻'
    }
    if (state.themeTags.length > 1) {
      return '👻'
    }
    // Then instructor tags
    if (state.instructorTags.length === 1) {
      return TAG_EMOJIS[state.instructorTags[0]] || '👻'
    }
    if (state.instructorTags.length > 1) {
      return '👻'
    }
    // Default for genres only
    if (state.selectedGenres.length > 0) {
      return '🎵'
    }
    return '👻'
  }

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
    <div className="bg-gray-50 dark:bg-gray-900/50 border border-gray-200 dark:border-gray-700 rounded-md p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Your Playlist
          </h3>
          {hasThemeFilters && (
            <span className="text-xs bg-rose-100 dark:bg-rose-900/50 text-rose-700 dark:text-rose-300 px-2 py-0.5 rounded-full">
              {getThemeEmoji()} {getActiveThemeText()}
            </span>
          )}
        </div>
        {hasAnyTracks && (
          <button
            onClick={clearPlaylist}
            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            title="Clear playlist and start over"
          >
            Clear All
          </button>
        )}
      </div>

      {showRandomAction && (
        <div className="mb-3">
          <Button variant="primary" onClick={generateRandom} className="w-full">
            Fill All Randomly
          </Button>
        </div>
      )}

      {!hasAnyTracks && !showRandomAction && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Build track-by-track below, or use the Themes tab to generate a full playlist.</p>
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
