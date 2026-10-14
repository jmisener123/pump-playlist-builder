import { useState, useCallback } from 'react'
import { appendSearchTerm } from '../data/loadPlaylistData'

/**
 * Move picks held as structured filters rather than as text in the search box.
 *
 * The search syntax ('track:chest "Push-Ups"') is an implementation detail -
 * showing it to an instructor reads as code and, worse, invites them to edit
 * it into something that silently matches nothing. Filters are kept as objects
 * and rendered as removable chips; the query is assembled only when searching.
 */
/**
 * Add, remove, or replace a pick. Exported separately from the hook so the
 * rule about cross-track picks can be tested without a renderer.
 */
export function toggleMoveFilter(filters, filter) {
  if (filters.some(f => f.id === filter.id)) {
    return filters.filter(f => f.id !== filter.id)
  }

  // Moves are matched against a single track, so combining them across
  // tracks can only ever return nothing - no one track is both a chest
  // and a back track. Picking from elsewhere starts a new set instead of
  // quietly producing zero results.
  return [...filters.filter(f => f.trackId === filter.trackId), filter]
}

export function useMoveFilters() {
  const [filters, setFilters] = useState([])

  const toggleFilter = useCallback((filter) => {
    setFilters(current => toggleMoveFilter(current, filter))
  }, [])

  const removeFilter = useCallback((id) => {
    setFilters(current => current.filter(f => f.id !== id))
  }, [])

  const clearFilters = useCallback(() => setFilters([]), [])

  return { filters, toggleFilter, removeFilter, clearFilters }
}

/**
 * Fold the active filters and whatever was typed into one query string.
 */
export function buildMoveQuery(filters = [], typedTerm = '') {
  const fromFilters = filters.reduce((query, filter) => appendSearchTerm(query, filter.query), '')
  const typed = String(typedTerm ?? '').trim()
  return [fromFilters, typed].filter(Boolean).join(' ')
}
