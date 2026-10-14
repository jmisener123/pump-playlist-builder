import React, { useState, useMemo } from 'react'
import { usePlaylistData } from '../hooks/usePlaylistData'
import { usePlaylistBuilder } from '../hooks/usePlaylistBuilder'
import { useToast } from '../context/ToastContext'
import { searchTracks, getSearchWords } from '../data/loadPlaylistData'
import { matchedChoreoValues } from '../utils/choreo'
import { useMoveFilters, buildMoveQuery } from '../hooks/useMoveFilters'
import { Button } from './ui/Button'
import { TagList } from './ui/TagPill'
import { SearchInput } from './ui/SearchInput'
import { MoveFilterBar } from './ui/MoveFilterBar'
import { ChoreoBrowser } from './ChoreoBrowser'
import { usePlaylist } from '../context/PlaylistContext'
import { TRACK_TYPES, getBodyPart, formatTrackRelease } from '../utils/trackUtils'

// One of each kind of search the box understands: artist, song, move.
const EXAMPLE_SEARCHES = ['Lady Gaga', 'Somebody to Love', 'rotator raises']

export function InlineSearch() {
  const { filteredTracks } = usePlaylistData()
  const { playlist, setTrack } = usePlaylistBuilder()
  const showToast = useToast()
  const { state } = usePlaylist()
  const activeTags = [...state.themeTags, ...state.instructorTags]
  const [searchTerm, setSearchTerm] = useState('')
  const { filters, toggleFilter, removeFilter, clearFilters } = useMoveFilters()

  const query = useMemo(() => buildMoveQuery(filters, searchTerm), [filters, searchTerm])
  const hasQuery = query.trim().length > 0

  const displayTracks = useMemo(() => {
    if (!hasQuery) return []
    return searchTracks(filteredTracks, query)
  }, [filteredTracks, query, hasQuery])

  const searchWords = useMemo(() => getSearchWords(query), [query])

  const getCompatibleSlots = (track) => {
    const trackTypeIndex = TRACK_TYPES.findIndex(t => t === track['Track No#'])
    return trackTypeIndex !== -1 ? [trackTypeIndex] : []
  }

  const getAvailableSlots = (track) => {
    return getCompatibleSlots(track).filter(i => !playlist[i])
  }

  const placeTrack = (track, slotIndex) => {
    const wasEmpty = !playlist[slotIndex]
    setTrack(slotIndex, track)
    const filled = playlist.filter(Boolean).length + (wasEmpty ? 1 : 0)
    const part = getBodyPart(TRACK_TYPES[slotIndex])
    showToast(wasEmpty ? `Added to ${part} \u2713` : `Replaced ${part} \u2713`, `${filled}/10`)
  }

  const addToPlaylist = (track) => {
    const available = getAvailableSlots(track)
    if (available.length > 0) placeTrack(track, available[0])
  }

  const addToSlot = (track, slotIndex) => placeTrack(track, slotIndex)

  return (
    <div>
      <SearchInput
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        onClear={() => setSearchTerm('')}
        placeholder="Song, artist or move"
        aria-label="Search your catalog by song title, artist or choreography"
        data-search-input
      />
      {!hasQuery && (
        <div className="mt-2.5 flex flex-wrap items-center gap-1.5">
          <span className="eyebrow">Try</span>
          {EXAMPLE_SEARCHES.map((example) => (
            <button
              key={example}
              type="button"
              onClick={() => setSearchTerm(example)}
              className="pill-off hover:border-flare-600 hover:text-accent"
            >
              {example}
            </button>
          ))}
        </div>
      )}
      <MoveFilterBar filters={filters} onRemove={removeFilter} onClear={clearFilters} />
      <ChoreoBrowser
        tracks={filteredTracks}
        onPick={toggleFilter}
        activeIds={filters.map(f => f.id)}
      />
      {hasQuery && (
        <p className="eyebrow mt-2 tabular">
          {displayTracks.length > 0
            ? `${displayTracks.length} result${displayTracks.length !== 1 ? 's' : ''}`
            : 'No matches'}
        </p>
      )}
      {hasQuery && displayTracks.length > 0 && (
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
                        {formatTrackRelease(track)} · {track.Duration} · {track.Genre}
                      </span>
                    </div>
                    {track.Tags && (() => {
                      // Tags matching the active theme lead, as in the playlist.
                      const tags = track.Tags.split(',').map(t => t.trim()).filter(Boolean)
                      const ordered = [...tags.filter(t => activeTags.includes(t)), ...tags.filter(t => !activeTags.includes(t))]
                      return <TagList tags={ordered} size="sm" max={3} activeTags={activeTags} className="mt-1" />
                    })()}
                    {(() => {
                      // Say why a track turned up when the match was its choreography.
                      const moves = matchedChoreoValues(track, searchWords)
                      if (moves.length === 0) return null
                      return (
                        <p className="text-ink-500 dark:text-ink-400 text-xs mt-1 truncate">
                          🏋️ {moves.join(', ')}
                        </p>
                      )
                    })()}
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
