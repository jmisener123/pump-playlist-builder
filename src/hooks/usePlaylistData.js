import { useMemo } from 'react'
import { usePlaylist } from '../context/PlaylistContext'
import { searchTracks, getTracksForPosition, filterByTheme } from '../data/loadPlaylistData'
import { relaxedThemeFilters, getSlotTrackTypes } from '../utils/trackUtils'

/**
 * Hook for accessing and filtering playlist data
 */
export function usePlaylistData() {
  const { state, trackTypes, getFilteredTracks, getSearchTracks, getThemedTracks, getAllThemedTracks } = usePlaylist()

  // Memoized filtered tracks
  const filteredTracks = useMemo(() => {
    return getFilteredTracks()
  }, [state.tracks, state.earliestRelease, state.excludeNewest, state.onlyRecent10, state.releases, state.excludedReleases])

  // What search and browse look through, which may span both class formats
  const searchTracksPool = useMemo(() => {
    return getSearchTracks()
  }, [filteredTracks, state.classFormat, state.searchBothFormats])

  // Memoized themed tracks
  const themedTracks = useMemo(() => {
    return getThemedTracks()
  }, [filteredTracks, state.themeTags, state.instructorTags, state.selectedGenres])

  // Theme matches across every release, not just the ones you own
  const allThemedTracks = useMemo(() => {
    return getAllThemedTracks()
  }, [state.tracks, state.themeTags, state.instructorTags, state.selectedGenres])

  // Search within the current format's tracks
  const searchInFiltered = (searchTerm) => {
    return searchTracks(searchTracksPool, searchTerm)
  }

  // Every Track No# a slot accepts, including alternates like the 45-minute
  // Core slot's Functional Strength tracks.
  const getSlotTypes = (position) => {
    const trackType = trackTypes[position]
    return trackType ? getSlotTrackTypes(trackType, state.classFormat) : []
  }

  // Get tracks for a specific position, alternates included - this is the
  // browse list, so a Functional Strength track is one tap away even though
  // random fills never pick one.
  const getTracksForSlot = (position) => {
    const types = getSlotTypes(position)
    return types.length > 0 ? getTracksForPosition(filteredTracks, types) : []
  }

  // Get themed tracks for a specific position
  const getThemedTracksForSlot = (position) => {
    const trackType = trackTypes[position]
    return trackType ? getTracksForPosition(themedTracks, trackType) : []
  }

  // Closest-match tracks for a slot the exact theme can't fill: loosen the
  // filters a step at a time and return the first pool that has something.
  // Never falls all the way back to the unfiltered catalog - that's Browse.
  const getRelaxedTracksForSlot = (position) => {
    const trackType = trackTypes[position]
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
    trackTypes.forEach((type, index) => {
      counts[index] = getTracksForPosition(filteredTracks, type).length
    })
    return counts
  }, [filteredTracks, state.classFormat])

  return {
    allTracks: state.tracks,
    filteredTracks,
    searchTracksPool,
    trackTypes,
    classFormat: state.classFormat,
    searchBothFormats: state.searchBothFormats,
    themedTracks,
    releases: state.releases,
    latestRelease: state.latestRelease,
    genres: state.genres,
    availableTags: state.availableTags,
    isLoading: state.isLoading,
    searchInFiltered,
    getSlotTypes,
    getTracksForSlot,
    getThemedTracksForSlot,
    getRelaxedTracksForSlot,
    allThemedTracks,
    trackCounts
  }
}
