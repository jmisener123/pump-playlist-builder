import React, { useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { searchTracks, getTracksForPosition } from '../../data/loadPlaylistData'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'
import { TRACK_TYPES } from '../../utils/trackUtils'

export function TrackByTrackBuilder() {
  const { state } = usePlaylist()
  const { playlist, setTrack } = usePlaylistBuilder()
  const { filteredTracks, getThemedTracksForSlot } = usePlaylistData()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedPosition, setSelectedPosition] = useState(null)
  const [isExpanded, setIsExpanded] = useState(false)

  // Check if any theme filters are active
  const hasThemeFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

  // Get tracks for selected position
  const getTracksForSelectedPosition = () => {
    if (selectedPosition === null) return []
    const trackType = TRACK_TYPES[selectedPosition]
    let tracks = getTracksForPosition(filteredTracks, trackType)

    // Apply search filter
    if (searchTerm.trim()) {
      tracks = searchTracks(tracks, searchTerm)
    }

    return tracks
  }

  const availableTracks = getTracksForSelectedPosition()

  // Get count of empty slots
  const emptySlots = playlist.filter(t => t === null).length

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <span className="text-2xl">🎯</span>
          <div className="text-left">
            <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
              Pick Individual Tracks
            </h3>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Browse and select specific songs for each position
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {emptySlots > 0 && emptySlots < 10 && (
            <span className="text-xs bg-amber-200 dark:bg-amber-800 text-amber-800 dark:text-amber-200 px-2 py-0.5 rounded-full">
              {emptySlots} empty
            </span>
          )}
          <span className="text-gray-500 text-xl">
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4">

          {/* Position Selector */}
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select position to fill:
            </label>
            <div className="flex flex-wrap gap-1">
              {TRACK_TYPES.map((trackType, index) => {
                const isFilled = playlist[index] !== null
                const themedCount = hasThemeFilters ? getThemedTracksForSlot(index).length : 0

                return (
                  <button
                    key={trackType}
                    onClick={() => setSelectedPosition(index)}
                    className={`px-2 py-1 rounded text-xs font-medium transition-colors relative
                      ${selectedPosition === index
                        ? 'bg-amber-500 text-white'
                        : isFilled
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-300'
                          : 'bg-white/70 text-gray-700 hover:bg-white dark:bg-gray-700 dark:text-gray-300'
                      }`}
                  >
                    {index + 1}. {trackType.split(' - ')[1]}
                    {isFilled && ' ✓'}
                    {themedCount > 0 && !isFilled && (
                      <span className="ml-1 text-purple-600 dark:text-purple-400">👻</span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {selectedPosition !== null && (
            <>
              {/* Search Input */}
              <div className="mb-3">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder={`Search ${TRACK_TYPES[selectedPosition].split(' - ')[1]} tracks...`}
                  className="w-full px-3 py-2 text-sm border border-amber-300 dark:border-amber-600 rounded-lg bg-white dark:bg-gray-800"
                />
              </div>

              {/* Track List */}
              <div className="max-h-64 overflow-y-auto space-y-1 bg-white/50 dark:bg-gray-800/50 rounded-lg p-2">
                {availableTracks.length > 0 ? (
                  <>
                    <p className="text-xs text-gray-500 mb-2">
                      {availableTracks.length} tracks available
                      {hasThemeFilters && ` (themed options highlighted)`}
                    </p>
                    {availableTracks.map(track => {
                      // Check if this track matches theme filters
                      const isThemed = hasThemeFilters && track.Tags &&
                        [...state.themeTags, ...state.instructorTags].some(tag =>
                          track.Tags.includes(tag)
                        )

                      return (
                        <div
                          key={`${track.Release}_${track['Song Title']}`}
                          onClick={() => {
                            setTrack(selectedPosition, track)
                            setSearchTerm('')
                          }}
                          className={`p-2 rounded cursor-pointer transition-colors
                            ${isThemed
                              ? 'bg-purple-50 dark:bg-purple-900/30 hover:bg-purple-100 dark:hover:bg-purple-900/50 border-l-2 border-purple-400'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-700'
                            }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-sm text-gray-900 dark:text-gray-100 truncate">
                                {track['Song Title']}
                                {isThemed && <span className="ml-1">👻</span>}
                              </p>
                              <p className="text-xs text-gray-600 dark:text-gray-400">
                                {track.Artist} • Release {track.Release} • {track.Duration}
                              </p>
                              {track.Tags && (
                                <div className="mt-1">
                                  <TagList tags={track.Tags} size="sm" />
                                </div>
                              )}
                            </div>
                            <Button variant="primary" size="sm" className="flex-shrink-0">
                              Add
                            </Button>
                          </div>
                        </div>
                      )
                    })}
                  </>
                ) : (
                  <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
                    {searchTerm ? 'No tracks match your search' : 'No tracks available'}
                  </p>
                )}
              </div>
            </>
          )}

          {selectedPosition === null && (
            <p className="text-center text-gray-500 dark:text-gray-400 py-4 text-sm">
              Select a position above to browse available tracks
            </p>
          )}
        </div>
      )}
    </div>
  )
}
