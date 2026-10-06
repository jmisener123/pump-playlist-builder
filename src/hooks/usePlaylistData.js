import { useMemo } from 'react'
import { usePlaylist } from '../context/PlaylistContext'
import { searchTracks, getTracksForPosition, filterByTheme } from '../data/loadPlaylistData'
import { TRACK_TYPES, relaxedThemeFilters } from '../utils/trackUtils'

/**
 * Hook for accessing and filtering playlist data
 */
export function usePlaylistData() {
  const { state, getFilteredTracks, getThemedTracks, getAllThemedTracks } = usePlaylist()

  // Memoized filtered tracks
  const filteredTracks = useMemo(() => {
    return getFilteredTracks()
  }, [state.tracks, state.earliestRelease, state.excludeNewest, state.onlyRecent10, state.releases])

  // Memoized themed tracks
  const themedTracks = useMemo(() => {
    return getThemedTracks()
  }, [filteredTracks, state.themeTags, state.instructorTags, state.selectedGenres])

  // Theme matches across every release, not just the ones you own
  const allThemedTracks = useMemo(() => {
    return getAllThemedTracks()
  }, [state.tracks, state.themeTags, state.instructorTags, state.selectedGenres])

  // Search within filtered tracks
  const searchInFiltered = (searchTerm) => {
    return searchTracks(filteredTracks, searchTerm)
  }

  // Get tracks for a specific position
  const getTracksForSlot = (position) => {
    const trackType = state.tracks.length > 0 ?
      ['1 - Warmup', '2 - Squats', '3 - Chest', '4 - Back', '5 - Triceps',
       '6 - Biceps', '7 - Lunges', '8 - Shoulders', '9 - Core', '10 - Cooldown'][position] :
      null
    return trackType ? getTracksForPosition(filteredTracks, trackType) : []
  }

  // Get themed tracks for a specific position
  const getThemedTracksForSlot = (position) => {
    const trackType = ['1 - Warmup', '2 - Squats', '3 - Chest', '4 - Back', '5 - Triceps',
      '6 - Biceps', '7 - Lunges', '8 - Shoulders', '9 - Core', '10 - Cooldown'][position]
    return trackType ? getTracksForPosition(themedTracks, trackType) : []
  }

  // Closest-match tracks for a slot the exact theme can't fill: loosen the
  // filters a step at a time and return the first pool that has something.
  // Never falls all the way back to the unfiltered catalog — that's Browse.
  const getRelaxedTracksForSlot = (position) => {
    const trackType = TRACK_TYPES[position]
    if (!trackType) return []

    const variants = relaxedThemeFilters({
      themeTags: state.themeTags,
      instructorTags: state.instructorTags,
      selectedGenres: state.selectedGenres
    }).filter(v => v.themeTags.length || v.instructorTags.length || v.genres.length)

    for (const variant of variants) {
      const pool = getTracksForPosition(filterByTheme(filteredTracks, variant), trackType)
      if (pool.length > 0) return pool
    }
    return []
  }

  // Count available tracks by position
  const trackCounts = useMemo(() => {
    const counts = {}
    const types = ['1 - Warmup', '2 - Squats', '3 - Chest', '4 - Back', '5 - Triceps',
      '6 - Biceps', '7 - Lunges', '8 - Shoulders', '9 - Core', '10 - Cooldown']

    types.forEach((type, index) => {
      counts[index] = getTracksForPosition(filteredTracks, type).length
    })

    return counts
  }, [filteredTracks])

  return {
    allTracks: state.tracks,
    filteredTracks,
    themedTracks,
    releases: state.releases,
    latestRelease: state.latestRelease,
    genres: state.genres,
    availableTags: state.availableTags,
    isLoading: state.isLoading,
    searchInFiltered,
    getTracksForSlot,
    getThemedTracksForSlot,
    getRelaxedTracksForSlot,
    allThemedTracks,
    trackCounts
  }
}
