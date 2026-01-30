import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { loadPlaylistDataAsync, filterTracks, filterByTheme, pickRandomTrack } from '../data/loadPlaylistData'
import { TRACK_TYPES } from '../utils/trackUtils'

// Action types
const ActionTypes = {
  SET_TRACKS: 'SET_TRACKS',
  SET_EARLIEST_RELEASE: 'SET_EARLIEST_RELEASE',
  SET_EXCLUDE_NEWEST: 'SET_EXCLUDE_NEWEST',
  SET_ONLY_RECENT_10: 'SET_ONLY_RECENT_10',
  SET_PLAYLIST: 'SET_PLAYLIST',
  SET_TRACK: 'SET_TRACK',
  CLEAR_TRACK: 'CLEAR_TRACK',
  SET_SEARCH_MODAL: 'SET_SEARCH_MODAL',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_THEME_FILTERS: 'SET_THEME_FILTERS',
  SET_LOADING: 'SET_LOADING'
}

// Initial state
const initialState = {
  // Data
  tracks: [],
  latestRelease: '135',
  releases: [],
  genres: [],
  availableTags: [],

  // Filters (Step 1)
  earliestRelease: '60',
  excludeNewest: false,
  onlyRecent10: false,

  // Playlist (Step 2)
  playlist: Array(10).fill(null),

  // Theme filters (for Theme tab)
  themeTags: [],
  instructorTags: [],
  selectedGenres: [],

  // UI state
  activeTab: 'quick', // 'quick' | 'custom'
  searchModal: { open: false, position: null },
  isLoading: true
}

// Reducer
function playlistReducer(state, action) {
  switch (action.type) {
    case ActionTypes.SET_TRACKS:
      return {
        ...state,
        tracks: action.payload.tracks,
        latestRelease: action.payload.latestRelease,
        releases: action.payload.releases,
        genres: action.payload.genres || [],
        availableTags: action.payload.availableTags || [],
        earliestRelease: action.payload.releases[0] || '60',
        isLoading: false
      }

    case ActionTypes.SET_EARLIEST_RELEASE:
      return {
        ...state,
        earliestRelease: action.payload
      }

    case ActionTypes.SET_EXCLUDE_NEWEST:
      return {
        ...state,
        excludeNewest: action.payload
      }

    case ActionTypes.SET_ONLY_RECENT_10:
      return {
        ...state,
        onlyRecent10: action.payload
      }

    case ActionTypes.SET_PLAYLIST:
      return {
        ...state,
        playlist: action.payload
      }

    case ActionTypes.SET_TRACK:
      const newPlaylist = [...state.playlist]
      newPlaylist[action.payload.position] = action.payload.track
      return {
        ...state,
        playlist: newPlaylist
      }

    case ActionTypes.CLEAR_TRACK:
      const clearedPlaylist = [...state.playlist]
      clearedPlaylist[action.payload] = null
      return {
        ...state,
        playlist: clearedPlaylist
      }

    case ActionTypes.SET_SEARCH_MODAL:
      return {
        ...state,
        searchModal: action.payload
      }

    case ActionTypes.SET_ACTIVE_TAB:
      return {
        ...state,
        activeTab: action.payload
      }

    case ActionTypes.SET_THEME_FILTERS:
      return {
        ...state,
        themeTags: action.payload.themeTags ?? state.themeTags,
        instructorTags: action.payload.instructorTags ?? state.instructorTags,
        selectedGenres: action.payload.selectedGenres ?? state.selectedGenres
      }

    case ActionTypes.SET_LOADING:
      return {
        ...state,
        isLoading: action.payload
      }

    default:
      return state
  }
}

// Context
const PlaylistContext = createContext(null)

// Provider component
export function PlaylistProvider({ children }) {
  const [state, dispatch] = useReducer(playlistReducer, initialState)

  // Load data on mount
  useEffect(() => {
    async function loadData() {
      const { tracks, latestRelease, releases } = await loadPlaylistDataAsync()

      // Extract unique genres and tags
      const genreSet = new Set()
      const tagSet = new Set()

      tracks.forEach(track => {
        if (track.Genre && track.Genre !== 'nan') {
          genreSet.add(track.Genre)
        }
        if (track.Tags) {
          track.Tags.split(',').forEach(tag => {
            const trimmed = tag.trim()
            if (trimmed && trimmed !== 'nan') {
              tagSet.add(trimmed)
            }
          })
        }
      })

      dispatch({
        type: ActionTypes.SET_TRACKS,
        payload: {
          tracks,
          latestRelease,
          releases,
          genres: Array.from(genreSet).sort(),
          availableTags: Array.from(tagSet).sort()
        }
      })
    }

    loadData()
  }, [])

  // Get filtered tracks based on current filters
  const getFilteredTracks = () => {
    return filterTracks(state.tracks, {
      earliestRelease: state.earliestRelease,
      excludeNewest: state.excludeNewest,
      latestRelease: state.latestRelease,
      onlyRecent10: state.onlyRecent10,
      allReleases: state.releases
    })
  }

  // Get themed filtered tracks
  const getThemedTracks = () => {
    const baseFiltered = getFilteredTracks()
    return filterByTheme(baseFiltered, {
      themeTags: state.themeTags,
      instructorTags: state.instructorTags,
      genres: state.selectedGenres
    })
  }

  // Actions
  const actions = {
    setEarliestRelease: (release) => {
      dispatch({ type: ActionTypes.SET_EARLIEST_RELEASE, payload: release })
    },

    setExcludeNewest: (exclude) => {
      dispatch({ type: ActionTypes.SET_EXCLUDE_NEWEST, payload: exclude })
    },

    setOnlyRecent10: (only) => {
      dispatch({ type: ActionTypes.SET_ONLY_RECENT_10, payload: only })
    },

    setActiveTab: (tab) => {
      dispatch({ type: ActionTypes.SET_ACTIVE_TAB, payload: tab })
    },

    setThemeFilters: (filters) => {
      dispatch({ type: ActionTypes.SET_THEME_FILTERS, payload: filters })
    },

    setTrack: (position, track) => {
      dispatch({ type: ActionTypes.SET_TRACK, payload: { position, track } })
    },

    clearTrack: (position) => {
      dispatch({ type: ActionTypes.CLEAR_TRACK, payload: position })
    },

    openSearchModal: (position) => {
      dispatch({ type: ActionTypes.SET_SEARCH_MODAL, payload: { open: true, position } })
    },

    closeSearchModal: () => {
      dispatch({ type: ActionTypes.SET_SEARCH_MODAL, payload: { open: false, position: null } })
    },

    generateRandomPlaylist: () => {
      const filteredTracks = getFilteredTracks()
      const usedTitles = []
      const newPlaylist = TRACK_TYPES.map(trackType => {
        const track = pickRandomTrack(filteredTracks, trackType, usedTitles)
        if (track) {
          usedTitles.push(track['Song Title'])
        }
        return track
      })
      dispatch({ type: ActionTypes.SET_PLAYLIST, payload: newPlaylist })
    },

    generateThemedPlaylist: () => {
      const themedTracks = getThemedTracks()
      const usedTitles = []
      const newPlaylist = TRACK_TYPES.map(trackType => {
        const track = pickRandomTrack(themedTracks, trackType, usedTitles)
        if (track) {
          usedTitles.push(track['Song Title'])
        }
        return track
      })
      dispatch({ type: ActionTypes.SET_PLAYLIST, payload: newPlaylist })
    },

    randomizeTrack: (position) => {
      const filteredTracks = getFilteredTracks()
      const trackType = TRACK_TYPES[position]
      const currentTrack = state.playlist[position]
      const excludeTitles = currentTrack ? [currentTrack['Song Title']] : []

      // Also exclude other tracks in the playlist
      state.playlist.forEach((t, i) => {
        if (t && i !== position) {
          excludeTitles.push(t['Song Title'])
        }
      })

      const newTrack = pickRandomTrack(filteredTracks, trackType, excludeTitles)
      if (newTrack) {
        dispatch({ type: ActionTypes.SET_TRACK, payload: { position, track: newTrack } })
      }
    },

    randomizeTrackThemed: (position) => {
      const themedTracks = getThemedTracks()
      const trackType = TRACK_TYPES[position]
      const currentTrack = state.playlist[position]
      const excludeTitles = currentTrack ? [currentTrack['Song Title']] : []

      state.playlist.forEach((t, i) => {
        if (t && i !== position) {
          excludeTitles.push(t['Song Title'])
        }
      })

      const newTrack = pickRandomTrack(themedTracks, trackType, excludeTitles)
      if (newTrack) {
        dispatch({ type: ActionTypes.SET_TRACK, payload: { position, track: newTrack } })
      }
    },

    setPlaylist: (playlist) => {
      dispatch({ type: ActionTypes.SET_PLAYLIST, payload: playlist })
    }
  }

  const value = {
    state,
    actions,
    getFilteredTracks,
    getThemedTracks
  }

  return (
    <PlaylistContext.Provider value={value}>
      {children}
    </PlaylistContext.Provider>
  )
}

// Hook to use the context
export function usePlaylist() {
  const context = useContext(PlaylistContext)
  if (!context) {
    throw new Error('usePlaylist must be used within a PlaylistProvider')
  }
  return context
}

export { ActionTypes }
