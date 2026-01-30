import React, { useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { TrackSlot, EmptyTrackMessage } from './TrackSlot'
import { TotalDuration } from './TotalDuration'
import { TrackSearch } from './TrackSearch'
import { PlaylistExport } from './PlaylistExport'
import { TRACK_TYPES } from '../../utils/trackUtils'

export function PlaylistBuilder({ mode = 'random' }) {
  const { state } = usePlaylist()
  const { playlist, setTrack, clearTrack, clearPlaylist, randomizeTrack, hasAnyTracks } = usePlaylistBuilder()
  const { getTracksForSlot, getThemedTracksForSlot } = usePlaylistData()
  const [searchPosition, setSearchPosition] = useState(null)
  const [browseMode, setBrowseMode] = useState(false)

  // Check if any theme filters are active
  const hasThemeFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

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
    if (!hasThemeFilters) return []
    const themedTracks = getThemedTracksForSlot(index)
    const currentTrack = playlist[index]
    // Exclude current track from options
    return themedTracks.filter(t =>
      !currentTrack || t['Song Title'] !== currentTrack['Song Title']
    )
  }

  return (
    <div className="bg-gradient-to-br from-teal-50 to-cyan-50 dark:from-teal-900/20 dark:to-cyan-900/20 border border-teal-200 dark:border-teal-800 rounded-xl p-3 md:p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-xl">📋</span>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Your Playlist
          </h3>
          {hasThemeFilters && (
            <span className="text-xs bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-2 py-0.5 rounded-full">
              👻 Theme active
            </span>
          )}
        </div>
        {hasAnyTracks && (
          <button
            onClick={clearPlaylist}
            className="text-xs text-gray-500 hover:text-red-600 dark:text-gray-400 dark:hover:text-red-400 transition-colors"
            title="Clear playlist and start over"
          >
            🗑️ Clear All
          </button>
        )}
      </div>

      {!hasAnyTracks && (
        <div className="text-center py-6 text-gray-500 dark:text-gray-400">
          <p className="text-sm">Build track-by-track below or use the Generate tab to build by theme</p>
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
              hasThemeFilters={hasThemeFilters}
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
