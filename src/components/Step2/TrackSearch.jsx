import React, { useState, useMemo } from 'react'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { searchTracks, getTracksForPosition, getSearchWords } from '../../data/loadPlaylistData'
import { matchedChoreoValues } from '../../utils/choreo'
import { useMoveFilters, buildMoveQuery } from '../../hooks/useMoveFilters'
import { Modal } from '../ui/Modal'
import { TagList } from '../ui/TagPill'
import { Button } from '../ui/Button'
import { SearchInput } from '../ui/SearchInput'
import { MoveFilterBar } from '../ui/MoveFilterBar'
import { ChoreoBrowser } from '../ChoreoBrowser'
import { formatTrackRelease } from '../../utils/trackUtils'

export function TrackSearch({ position, trackType, onSelect, onClose }) {
  const { filteredTracks } = usePlaylistData()
  const [searchTerm, setSearchTerm] = useState('')
  const { filters, toggleFilter, removeFilter, clearFilters } = useMoveFilters()

  // Newest first, matching the themed swap lists.
  const positionTracks = useMemo(() => {
    return [...getTracksForPosition(filteredTracks, trackType)].sort((a, b) => b.SortKey - a.SortKey)
  }, [filteredTracks, trackType])

  const query = useMemo(() => buildMoveQuery(filters, searchTerm), [filters, searchTerm])
  const hasQuery = query.trim().length > 0

  // Apply search filter
  const displayTracks = useMemo(() => {
    if (!hasQuery) {
      return positionTracks
    }
    return searchTracks(positionTracks, query)
  }, [positionTracks, query, hasQuery])

  const searchWords = useMemo(() => getSearchWords(query), [query])

  const handleSelect = (track) => {
    onSelect(track)
    onClose()
  }

  const title = `Browse ${trackType} Tracks (${positionTracks.length})`

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
          <SearchInput
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onClear={() => setSearchTerm('')}
            placeholder="Filter by title, artist or move..."
          />
          <MoveFilterBar filters={filters} onRemove={removeFilter} onClear={clearFilters} />
          <ChoreoBrowser
            tracks={positionTracks}
            onPick={toggleFilter}
            slot={trackType}
            activeIds={filters.map(f => f.id)}
          />
          <p className="eyebrow mt-2 tabular">
            {hasQuery ? `${displayTracks.length} of ${positionTracks.length} tracks` : `${displayTracks.length} tracks in your catalog`}
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
                      Release: <span className="release-number">{formatTrackRelease(track, { short: false })}</span>
                      {' | '}Duration: {track.Duration}
                      {' | '}{track.Genre}
                    </p>
                    {track.Tags && (
                      <div className="mt-2">
                        <TagList tags={track.Tags} size="sm" />
                      </div>
                    )}
                    {(() => {
                      // Say why a track turned up when the match was its choreography.
                      const moves = matchedChoreoValues(track, searchWords)
                      if (moves.length === 0) return null
                      return (
                        <p className="text-ink-500 dark:text-ink-400 text-xs mt-1">
                          🏋️ {moves.join(', ')}
                        </p>
                      )
                    })()}
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
              {hasQuery && (
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
