import React, { useState, useMemo } from 'react'
import { usePlaylistData } from '../hooks/usePlaylistData'
import { usePlaylistBuilder } from '../hooks/usePlaylistBuilder'
import { searchTracks } from '../data/loadPlaylistData'
import { Button } from './ui/Button'
import { TRACK_TYPES, getBodyPart } from '../utils/trackUtils'

export function InlineSearch() {
  const { filteredTracks } = usePlaylistData()
  const { playlist, setTrack } = usePlaylistBuilder()
  const [searchTerm, setSearchTerm] = useState('')

  const displayTracks = useMemo(() => {
    if (!searchTerm.trim()) return []
    return searchTracks(filteredTracks, searchTerm)
  }, [filteredTracks, searchTerm])

  const getCompatibleSlots = (track) => {
    const trackTypeIndex = TRACK_TYPES.findIndex(t => t === track['Track No#'])
    return trackTypeIndex !== -1 ? [trackTypeIndex] : []
  }

  const getAvailableSlots = (track) => {
    return getCompatibleSlots(track).filter(i => !playlist[i])
  }

  const addToPlaylist = (track) => {
    const available = getAvailableSlots(track)
    if (available.length > 0) setTrack(available[0], track)
  }

  const addToSlot = (track, slotIndex) => setTrack(slotIndex, track)

  return (
    <div>
      <input
        type="text"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        placeholder="Search by song title or artist..."
        className="input-field"
      />
      {searchTerm.trim() && (
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          {displayTracks.length > 0
            ? `${displayTracks.length} track${displayTracks.length !== 1 ? 's' : ''} found`
            : 'No tracks found — try different terms'}
        </p>
      )}
      {searchTerm.trim() && displayTracks.length > 0 && (
        <div className="mt-2 max-h-72 overflow-y-auto space-y-2">
          {displayTracks.map((track) => {
            const compatibleSlots = getCompatibleSlots(track)
            const availableSlots = getAvailableSlots(track)
            const canAdd = availableSlots.length > 0
            const hasFilledSlot = compatibleSlots.length > 0 && availableSlots.length === 0
            const alreadyInPlaylist = compatibleSlots.some(i =>
              playlist[i]?.['Song Title'] === track['Song Title']
            )

            return (
              <div
                key={`${track.Release}_${track['Song Title']}`}
                className="rounded-md border-l-4 border-primary p-2.5 bg-gray-50 dark:bg-gray-700/50"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-900 dark:text-gray-100">"{track['Song Title']}"</p>
                    <p className="text-gray-500 dark:text-gray-400 text-xs">{track.Artist}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {compatibleSlots.map(i => (
                        <span key={i} className="text-xs font-semibold bg-red-100 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-1.5 py-0.5 rounded">
                          {getBodyPart(TRACK_TYPES[i])}
                        </span>
                      ))}
                      <span className="text-gray-400 dark:text-gray-500 text-xs">
                        R{track.Release} · {track.Duration} · {track.Genre}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {alreadyInPlaylist ? (
                      <span className="text-xs bg-green-100 dark:bg-green-900/50 text-green-700 dark:text-green-300 px-2 py-1 rounded font-medium">
                        ✓ Added
                      </span>
                    ) : canAdd ? (
                      <Button variant="primary" size="sm" onClick={() => addToPlaylist(track)}>
                        + Add
                      </Button>
                    ) : hasFilledSlot ? (
                      <Button variant="outline" size="sm" onClick={() => addToSlot(track, compatibleSlots[0])}>
                        Replace
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
