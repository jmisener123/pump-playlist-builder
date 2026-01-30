import React, { useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { searchTracks, getTracksForPosition } from '../../data/loadPlaylistData'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'
import { TotalDuration } from './TotalDuration'
import { PlaylistExport } from './PlaylistExport'
import { TRACK_TYPES } from '../../utils/trackUtils'

export function CustomBuilder() {
  const { state } = usePlaylist()
  const { playlist, setTrack } = usePlaylistBuilder()
  const { filteredTracks } = usePlaylistData()
  const [searchTerm, setSearchTerm] = useState('')

  // Get search results
  const searchResults = searchTerm.trim()
    ? searchTracks(filteredTracks, searchTerm)
    : []

  // Group search results by track type
  const groupedResults = TRACK_TYPES.reduce((acc, trackType) => {
    acc[trackType] = searchResults.filter(t => t['Track No#'] === trackType)
    return acc
  }, {})

  const hasSearchResults = searchResults.length > 0

  return (
    <div className="grid md:grid-cols-2 gap-6">
      {/* Left Column: Search */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          🔍 Search & Browse
        </h3>

        <div className="mb-4">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by song title or artist..."
            className="input-field"
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Search for songs by title or artist name. Uses exact text matching for precise results.
          </p>
        </div>

        {searchTerm.trim() ? (
          hasSearchResults ? (
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                <strong>Found {searchResults.length} tracks</strong> matching "{searchTerm}"
              </p>

              <div className="space-y-4 max-h-[500px] overflow-y-auto">
                {TRACK_TYPES.map(trackType => {
                  const results = groupedResults[trackType]
                  if (results.length === 0) return null

                  const position = TRACK_TYPES.indexOf(trackType)

                  return (
                    <div key={trackType}>
                      <h4 className="font-medium text-gray-700 dark:text-gray-300 text-sm mb-2">
                        {trackType} ({results.length} matches)
                      </h4>
                      <div className="space-y-2">
                        {results.map(track => (
                          <div
                            key={`${track.Release}_${track['Song Title']}`}
                            className="playlist-card rounded-lg border-l-4 border-primary p-3 text-sm"
                          >
                            <div className="flex justify-between items-start gap-2">
                              <div className="flex-1 min-w-0">
                                <p className="font-medium text-gray-900 dark:text-gray-100 truncate">
                                  {track['Song Title']}
                                </p>
                                <p className="text-gray-600 dark:text-gray-400 text-xs">
                                  by {track.Artist}
                                </p>
                                <p className="text-gray-500 dark:text-gray-500 text-xs mt-1">
                                  Release: <span className="release-number">{track.Release}</span>
                                  {' | '}{track.Duration}
                                  {' | '}{track.Genre}
                                </p>
                                {track.Tags && (
                                  <div className="mt-1">
                                    <TagList tags={track.Tags} size="sm" />
                                  </div>
                                )}
                              </div>
                              <Button
                                variant="primary"
                                size="sm"
                                onClick={() => setTrack(position, track)}
                                title={`Add to ${trackType}`}
                              >
                                ➕
                              </Button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-500 dark:text-gray-400 font-medium">
                🔍 No results found
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                No tracks found matching "{searchTerm}". Try different keywords.
              </p>
            </div>
          )
        ) : (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <p>Enter a search term above to find specific tracks,</p>
            <p>or use the playlist builder on the right to browse all available options.</p>
          </div>
        )}
      </div>

      {/* Right Column: Playlist Builder */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-6">
        <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-4">
          🛠️ Build Your Custom Playlist
        </h3>
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
          See all your available options for each track:
        </p>

        <TotalDuration />

        <div className="space-y-3 max-h-[500px] overflow-y-auto">
          {TRACK_TYPES.map((trackType, index) => {
            const tracksForSlot = getTracksForPosition(filteredTracks, trackType)
            const currentTrack = playlist[index]

            return (
              <div key={trackType} className="flex gap-2 items-center">
                <div className="flex-1">
                  <select
                    className="select-field text-sm"
                    value={currentTrack ? `${currentTrack.Release}_${currentTrack['Song Title']}` : ''}
                    onChange={(e) => {
                      if (e.target.value) {
                        const selected = tracksForSlot.find(
                          t => `${t.Release}_${t['Song Title']}` === e.target.value
                        )
                        if (selected) setTrack(index, selected)
                      }
                    }}
                  >
                    <option value="">{trackType} - Select a track...</option>
                    {tracksForSlot.map(track => (
                      <option
                        key={`${track.Release}_${track['Song Title']}`}
                        value={`${track.Release}_${track['Song Title']}`}
                      >
                        [{track.Release}] {track['Song Title']} by {track.Artist}
                      </option>
                    ))}
                  </select>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // Reset to first track or empty
                    if (tracksForSlot.length > 0) {
                      setTrack(index, tracksForSlot[0])
                    }
                  }}
                  title="Reset to first option"
                >
                  🗑️
                </Button>
              </div>
            )
          })}
        </div>

        <PlaylistExport />
      </div>
    </div>
  )
}
