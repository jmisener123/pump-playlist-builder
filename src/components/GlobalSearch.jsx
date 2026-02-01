import React, { useState, useMemo } from 'react'
import { usePlaylistData } from '../hooks/usePlaylistData'
import { usePlaylistBuilder } from '../hooks/usePlaylistBuilder'
import { searchTracks } from '../data/loadPlaylistData'
import { Modal } from './ui/Modal'
import { TagList } from './ui/TagPill'
import { Button } from './ui/Button'
import { TRACK_TYPES, getBodyPart } from '../utils/trackUtils'

export function GlobalSearch({ isOpen, onClose }) {
  const { filteredTracks } = usePlaylistData()
  const { playlist, setTrack } = usePlaylistBuilder()
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTrack, setSelectedTrack] = useState(null)

  // Apply search filter across ALL tracks
  const displayTracks = useMemo(() => {
    if (!searchTerm.trim()) {
      return []
    }
    return searchTracks(filteredTracks, searchTerm)
  }, [filteredTracks, searchTerm])

  // Get which track positions a song can be used for
  const getCompatibleSlots = (track) => {
    const trackNumber = track['Track No#']
    const trackTypeIndex = TRACK_TYPES.findIndex(type => type.startsWith(`${trackNumber} -`))
    return trackTypeIndex !== -1 ? [trackTypeIndex] : []
  }

  // Get available slots (where the track can go and it's not already filled)
  const getAvailableSlots = (track) => {
    const compatibleSlots = getCompatibleSlots(track)
    return compatibleSlots.filter(index => !playlist[index])
  }

  // Add track to the first available compatible slot
  const addToPlaylist = (track) => {
    const availableSlots = getAvailableSlots(track)
    if (availableSlots.length > 0) {
      setTrack(availableSlots[0], track)
      setSelectedTrack(null)
      // Keep search open so user can continue searching
    }
  }

  // Add track to a specific slot
  const addToSlot = (track, slotIndex) => {
    setTrack(slotIndex, track)
    setSelectedTrack(null)
  }

  const handleClose = () => {
    setSearchTerm('')
    setSelectedTrack(null)
    onClose()
  }

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="🔍 Search Catalog"
      size="xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search by song title, artist, or both (e.g., 'Lady Gaga' or 'Born This Way')..."
            className="input-field text-base"
            autoFocus
          />
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {searchTerm ? (
              displayTracks.length > 0 
                ? `${displayTracks.length} track${displayTracks.length !== 1 ? 's' : ''} found`
                : 'No tracks found - try different search terms'
            ) : (
              `Search across all ${filteredTracks.length} tracks in your catalog`
            )}
          </p>
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto space-y-2">
          {!searchTerm.trim() ? (
            <div className="text-center py-12 text-gray-500 dark:text-gray-400">
              <p className="text-2xl mb-2">🔍</p>
              <p className="font-medium">Start typing to search</p>
              <p className="text-sm mt-1">
                Search for any song or artist across your entire catalog
              </p>
            </div>
          ) : displayTracks.length > 0 ? (
            displayTracks.map((track) => {
              const compatibleSlots = getCompatibleSlots(track)
              const availableSlots = getAvailableSlots(track)
              const canAdd = availableSlots.length > 0
              const hasFilledSlot = compatibleSlots.length > 0 && availableSlots.length === 0
              const alreadyInPlaylist = compatibleSlots.some(index => 
                playlist[index] && playlist[index]['Song Title'] === track['Song Title']
              )

              return (
                <div
                  key={`${track.Release}_${track['Song Title']}`}
                  className="playlist-card rounded-lg border-l-4 border-primary p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-gray-100">
                        "{track['Song Title']}"
                      </p>
                      <p className="text-gray-600 dark:text-gray-400 text-sm">
                        by {track.Artist}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <p className="text-gray-500 dark:text-gray-500 text-xs">
                          Release: <span className="release-number">{track.Release}</span>
                          {' | '}Duration: {track.Duration}
                          {' | '}{track.Genre}
                        </p>
                        {compatibleSlots.map(slotIndex => {
                          const trackType = TRACK_TYPES[slotIndex]
                          const bodyPart = getBodyPart(trackType)
                          return (
                            <span 
                              key={slotIndex}
                              className="text-xs bg-blue-100 dark:bg-blue-900/50 text-blue-700 dark:text-blue-300 px-2 py-0.5 rounded"
                            >
                              {bodyPart}
                            </span>
                          )
                        })}
                      </div>
                      {track.Tags && (
                        <div className="mt-2">
                          <TagList tags={track.Tags} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {alreadyInPlaylist ? (
                        <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-3 py-1.5 rounded font-medium">
                          ✓ In Playlist
                        </span>
                      ) : canAdd ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => addToPlaylist(track)}
                        >
                          + Add
                        </Button>
                      ) : hasFilledSlot ? (
                        <>
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-3 py-1.5 rounded text-center">
                            Slot filled
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              const slotIndex = compatibleSlots[0]
                              if (slotIndex !== undefined) {
                                addToSlot(track, slotIndex)
                              }
                            }}
                          >
                            Replace
                          </Button>
                        </>
                      ) : null
                      }
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <p className="font-medium">No tracks found</p>
              <p className="text-sm mt-1">
                Try different search terms or check your spelling
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
