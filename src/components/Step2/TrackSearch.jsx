import React, { useState, useMemo } from 'react'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { searchTracks, getTracksForPosition } from '../../data/loadPlaylistData'
import { Modal } from '../ui/Modal'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'

export function TrackSearch({ position, trackType, onSelect, onClose, browseMode = false }) {
  const { filteredTracks } = usePlaylistData()
  const [searchTerm, setSearchTerm] = useState('')

  // Get tracks for this position
  const positionTracks = useMemo(() => {
    return getTracksForPosition(filteredTracks, trackType)
  }, [filteredTracks, trackType])

  // Apply search filter
  const displayTracks = useMemo(() => {
    if (!searchTerm.trim()) {
      return positionTracks
    }
    return searchTracks(positionTracks, searchTerm)
  }, [positionTracks, searchTerm])

  const handleSelect = (track) => {
    onSelect(track)
    onClose()
  }

  const title = browseMode
    ? `Browse ${trackType} Tracks (${positionTracks.length})`
    : `Search ${trackType} Tracks`

  return (
    <Modal
      isOpen={true}
      onClose={onClose}
      title={title}
      size="lg"
    >
      <div className="space-y-4">
        {/* Search/Filter Input */}
        <div>
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={browseMode ? "Filter by title or artist..." : "Search by song title or artist..."}
            className="input-field"
            autoFocus={!browseMode}
          />
          <p className="eyebrow mt-2 tabular">
            {searchTerm ? `${displayTracks.length} of ${positionTracks.length} tracks` : `${displayTracks.length} tracks in your catalog`}
          </p>
        </div>

        {/* Results */}
        <div className="max-h-[400px] overflow-y-auto space-y-2">
          {displayTracks.length > 0 ? (
            displayTracks.map((track) => (
              <div
                key={`${track.Release}_${track['Song Title']}`}
                className="px-3 py-2.5 cursor-pointer hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
                onClick={() => handleSelect(track)}
              >
                <div className="flex justify-between items-start gap-2">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-sm text-ink-900 dark:text-ink-100">
                      {track['Song Title']}
                    </p>
                    <p className="text-ink-500 dark:text-ink-400 text-xs">
                      by {track.Artist}
                    </p>
                    <p className="text-ink-400 text-xs mt-1 tabular">
                      Release: <span className="release-number">{track.Release}</span>
                      {' | '}Duration: {track.Duration}
                      {' | '}{track.Genre}
                    </p>
                    {track.Tags && (
                      <div className="mt-2">
                        <TagList tags={track.Tags} size="sm" />
                      </div>
                    )}
                  </div>
                  <Button
                    variant="primary"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelect(track)
                    }}
                  >
                    Select
                  </Button>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-10 text-ink-400">
              <p className="font-medium">No tracks found</p>
              {searchTerm && (
                <p className="text-sm mt-1">
                  Try different search terms or clear the filter.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  )
}
