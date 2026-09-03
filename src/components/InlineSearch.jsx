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
        placeholder="Song title or artist"
        className="input-field"
      />
      {searchTerm.trim() && (
        <p className="eyebrow mt-2 tabular">
          {displayTracks.length > 0
            ? `${displayTracks.length} result${displayTracks.length !== 1 ? 's' : ''}`
            : 'No matches'}
        </p>
      )}
      {searchTerm.trim() && displayTracks.length > 0 && (
        <div className="mt-2 max-h-72 overflow-y-auto border border-ink-200 dark:border-ink-800 rounded divide-y divide-ink-100 dark:divide-ink-800">
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
                className="px-3 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-900 dark:text-ink-100 truncate">{track['Song Title']}</p>
                    <p className="text-ink-500 dark:text-ink-400 text-xs truncate">{track.Artist}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-0.5">
                      {compatibleSlots.map(i => (
                        <span key={i} className="pill-off text-accent border-flare-200">
                          {getBodyPart(TRACK_TYPES[i])}
                        </span>
                      ))}
                      <span className="text-ink-400 text-xs tabular">
                        R{track.Release} · {track.Duration} · {track.Genre}
                      </span>
                    </div>
                  </div>
                  <div className="flex-shrink-0">
                    {alreadyInPlaylist ? (
                      <span className="eyebrow text-ink-400">Added</span>
                    ) : canAdd ? (
                      <Button variant="primary" size="sm" onClick={() => addToPlaylist(track)}>
                        Add
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
