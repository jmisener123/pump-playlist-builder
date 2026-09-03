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

  // Only show themed indicators if filters are active AND playlist has tracks at least one track
  const showThemedIndicators = hasThemeFilters && playlist.some(t => t !== null)

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
    <div className="panel p-4">
      {/* Header */}
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="text-left">
          <h3 className="display-sm text-ink-950 dark:text-paper">
            Pick individual tracks
          </h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
            Browse and choose a song for each position
          </p>
        </div>
        <div className="flex items-center gap-2">
          {emptySlots > 0 && emptySlots < 10 && (
            <span className="pill-off tabular">
              {emptySlots} empty
            </span>
          )}
          <span className="text-ink-400 text-lg leading-none w-4 text-center">
            {isExpanded ? '−' : '+'}
          </span>
        </div>
      </button>

      {isExpanded && (
        <div className="mt-4">

          {/* Position Selector */}
          <div className="mb-3">
            <label className="eyebrow block mb-1.5">
              Position to fill
            </label>
            <div className="flex flex-wrap gap-1">
              {TRACK_TYPES.map((trackType, index) => {
                const isFilled = playlist[index] !== null
                const themedCount = showThemedIndicators ? getThemedTracksForSlot(index).length : 0

                return (
                  <button
                    key={trackType}
                    onClick={() => setSelectedPosition(index)}
                    className={`px-2 py-1 rounded border text-xs font-medium transition-colors relative
                      ${selectedPosition === index
                        ? 'border-ink-950 bg-ink-950 text-paper dark:border-paper dark:bg-paper dark:text-ink-950'
                        : isFilled
                          ? 'border-ink-300 dark:border-ink-600 text-ink-900 dark:text-ink-100'
                          : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400 hover:border-ink-400'
                      }`}
                  >
                    {index + 1}. {trackType.split(' - ')[1]}
                    {isFilled && <span className="ml-1 text-accent">•</span>}
                    {themedCount > 0 && !isFilled && (
                      <span className="ml-1 text-accent">·</span>
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
                  className="input-field"
                />
              </div>

              {/* Track List */}
              <div className="max-h-64 overflow-y-auto divide-y divide-ink-100 dark:divide-ink-800 border border-ink-200 dark:border-ink-800 rounded">
                {availableTracks.length > 0 ? (
                  <>
                    <p className="eyebrow px-3 py-2 tabular">
                      {availableTracks.length} available
                      {hasThemeFilters && ' · themed marked'}
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
                          className={`px-3 py-2 cursor-pointer transition-colors group
                            ${isThemed
                              ? 'border-l-2 border-flare hover:bg-flare-50 dark:hover:bg-ink-800'
                              : 'hover:bg-ink-50 dark:hover:bg-ink-800'
                            }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <div className="flex-1 min-w-0">
                              <p className="font-semibold text-sm text-ink-900 dark:text-ink-100 truncate">
                                {track['Song Title']}
                              </p>
                              <p className="text-xs text-ink-500 dark:text-ink-400 tabular">
                                {track.Artist} · R{track.Release} · {track.Duration}
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
                  <p className="text-center text-ink-400 py-6 text-sm">
                    {searchTerm ? 'Nothing matches that search' : 'No tracks available'}
                  </p>
                )}
              </div>
            </>
          )}

          {selectedPosition === null && (
            <p className="text-center text-ink-400 py-6 text-sm">
              Choose a position above to browse tracks
            </p>
          )}
        </div>
      )}
    </div>
  )
}
