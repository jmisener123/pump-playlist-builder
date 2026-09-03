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
    // TRACK_TYPES is like ["1 - Warmup", "2 - Squats", ...]
    // trackNumber from CSV is like "1 - Warmup"
    const trackTypeIndex = TRACK_TYPES.findIndex(type => type === trackNumber)
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
      title="Search catalog"
      size="xl"
    >
      <div className="space-y-4">
        {/* Search Input */}
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Song title or artist"
            className="input-field text-base"
            autoFocus
          />
          <p className="eyebrow mt-2 tabular">
            {searchTerm ? (
              displayTracks.length > 0 
                ? `${displayTracks.length} result${displayTracks.length !== 1 ? 's' : ''}`
                : 'No matches'
            ) : (
              `${filteredTracks.length} tracks in your catalog`
            )}
          </p>
        </div>

        {/* Results */}
        <div className="max-h-[500px] overflow-y-auto divide-y divide-ink-100 dark:divide-ink-800 border-t border-ink-200 dark:border-ink-800">
          {!searchTerm.trim() ? (
            <div className="text-center py-14 text-ink-400">
              <p className="display-sm text-ink-500 dark:text-ink-400">Start typing to search</p>
              <p className="text-sm mt-1.5">
                Any song or artist across your whole catalog
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
                  className="px-3 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                >
                  <div className="flex justify-between items-start gap-3">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-sm text-ink-900 dark:text-ink-100">
                        {track['Song Title']}
                      </p>
                      <p className="text-ink-500 dark:text-ink-400 text-xs">
                        {track.Artist}
                      </p>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        {compatibleSlots.map(slotIndex => {
                          const trackType = TRACK_TYPES[slotIndex]
                          const bodyPart = getBodyPart(trackType)
                          return (
                            <span 
                              key={slotIndex}
                              className="pill-off text-accent border-flare-200"
                            >
                              {bodyPart}
                            </span>
                          )
                        })}
                        <p className="text-ink-400 text-xs tabular">
                          <span className="release-number">R{track.Release}</span>
                          {' · '}{track.Duration}
                          {' · '}{track.Genre}
                        </p>
                      </div>
                      {track.Tags && (
                        <div className="mt-2">
                          <TagList tags={track.Tags} size="sm" />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col gap-1">
                      {alreadyInPlaylist ? (
                        <span className="eyebrow whitespace-nowrap">In playlist</span>
                      ) : canAdd ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={() => addToPlaylist(track)}
                        >
                          Add
                        </Button>
                      ) : hasFilledSlot ? (
                        <>
                          <span className="eyebrow text-center block py-1.5">
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
            <div className="text-center py-10 text-ink-400">
              <p className="font-medium">No tracks found</p>
              <p className="text-sm mt-1">
                Try different terms or check the spelling
              </p>
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
