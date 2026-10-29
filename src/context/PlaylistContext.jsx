import React, { createContext, useContext, useReducer, useEffect } from 'react'
import { loadPlaylistDataAsync, filterTracks, filterByTheme, pickRandomTrack } from '../data/loadPlaylistData'
import { getTrackTypes, getFormatTrackTypes, ALL_TRACK_TYPES, relaxedThemeFilters } from '../utils/trackUtils'

// Action types
const ActionTypes = {
  SET_TRACKS: 'SET_TRACKS',
  SET_EARLIEST_RELEASE: 'SET_EARLIEST_RELEASE',
  SET_EXCLUDE_NEWEST: 'SET_EXCLUDE_NEWEST',
  SET_ONLY_RECENT_10: 'SET_ONLY_RECENT_10',
  SET_EXCLUDED_RELEASES: 'SET_EXCLUDED_RELEASES',
  SET_CLASS_FORMAT: 'SET_CLASS_FORMAT',
  SET_SEARCH_BOTH_FORMATS: 'SET_SEARCH_BOTH_FORMATS',
  SET_PLAYLIST: 'SET_PLAYLIST',
  SET_TRACK: 'SET_TRACK',
  CLEAR_TRACK: 'CLEAR_TRACK',
  SET_SEARCH_MODAL: 'SET_SEARCH_MODAL',
  SET_ACTIVE_TAB: 'SET_ACTIVE_TAB',
  SET_THEME_FILTERS: 'SET_THEME_FILTERS',
  SET_LOADING: 'SET_LOADING'
}

const CATALOG_STORAGE_KEY = 'pump.catalogSettings.v1'
const PLAYLIST_STORAGE_KEY = 'pump.playlist.v1'

function loadSavedCatalog() {
  try {
    const raw = localStorage.getItem(CATALOG_STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

function saveCatalog(settings) {
  try {
    localStorage.setItem(CATALOG_STORAGE_KEY, JSON.stringify(settings))
  } catch {
    // Storage may be unavailable (private mode, quota); settings just won't persist.
  }
}

/**
 * Identity of a track in the catalog. Stored instead of the whole object so a
 * saved playlist picks up corrected data on the next visit rather than
 * resurrecting a stale copy of the row.
 */
function trackKey(track) {
  if (!track) return null
  return [track.Release, track['Track No#'], track['Song Title'], track.Version ?? '']
    .map(v => String(v ?? '').trim())
    .join('|')
}

function loadSavedPlaylist() {
  try {
    const raw = localStorage.getItem(PLAYLIST_STORAGE_KEY)
    const parsed = raw ? JSON.parse(raw) : null
    return Array.isArray(parsed) ? parsed : null
  } catch {
    return null
  }
}

function savePlaylist(playlist, trackTypes) {
  try {
    const entries = playlist
      .map((track, i) => (track ? { type: trackTypes[i], key: trackKey(track) } : null))
      .filter(entry => entry && entry.type && entry.key)
    if (entries.length === 0) {
      localStorage.removeItem(PLAYLIST_STORAGE_KEY)
      return
    }
    localStorage.setItem(PLAYLIST_STORAGE_KEY, JSON.stringify(entries))
  } catch {
    // Storage may be unavailable (private mode, quota); the playlist just won't persist.
  }
}

/**
 * Rebuild a saved playlist against the freshly loaded catalog. Slots are keyed
 * by track type rather than index so a saved 55-minute playlist still lands in
 * the right rows of a 45-minute one, and vice versa.
 */
function restorePlaylist(saved, tracks, format) {
  const types = getTrackTypes(format)
  const empty = Array(types.length).fill(null)
  if (!saved || saved.length === 0) return empty

  const byKey = new Map()
  tracks.forEach(track => {
    const key = trackKey(track)
    if (key && !byKey.has(key)) byKey.set(key, track)
  })

  const savedByType = new Map()
  saved.forEach(entry => {
    if (entry && entry.type && !savedByType.has(entry.type)) savedByType.set(entry.type, entry.key)
  })

  return types.map(type => byKey.get(savedByType.get(type)) || null)
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
  // Individual releases switched off inside the chosen range
  excludedReleases: [],
  // '55' (separate triceps/biceps/lunges/shoulders) or '45' (combo tracks)
  classFormat: '55',
  // Let search and browse turn up the other format's tracks too
  searchBothFormats: false,
  // True when catalog settings were restored from a previous visit
  hasSavedCatalog: false,

  // Playlist (Step 2)
  playlist: Array(getTrackTypes('55').length).fill(null),

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
    case ActionTypes.SET_TRACKS: {
      const { releases, saved, savedPlaylist } = action.payload
      const savedIsValid = saved && releases.includes(String(saved.earliestRelease))
      // Drop any saved exclusions for releases that no longer exist.
      const savedExcluded = savedIsValid && Array.isArray(saved.excludedReleases)
        ? saved.excludedReleases.map(String).filter(r => releases.includes(r))
        : []
      const classFormat = savedIsValid && saved.classFormat === '45' ? '45' : state.classFormat
      return {
        ...state,
        tracks: action.payload.tracks,
        latestRelease: action.payload.latestRelease,
        releases,
        genres: action.payload.genres || [],
        availableTags: action.payload.availableTags || [],
        earliestRelease: savedIsValid ? String(saved.earliestRelease) : (releases[0] || '60'),
        excludeNewest: savedIsValid ? !!saved.excludeNewest : state.excludeNewest,
        onlyRecent10: savedIsValid ? !!saved.onlyRecent10 : state.onlyRecent10,
        excludedReleases: savedExcluded,
        classFormat,
        searchBothFormats: savedIsValid ? !!saved.searchBothFormats : state.searchBothFormats,
        playlist: restorePlaylist(savedPlaylist, action.payload.tracks, classFormat),
        hasSavedCatalog: !!savedIsValid,
        isLoading: false
      }
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

    case ActionTypes.SET_EXCLUDED_RELEASES:
      return {
        ...state,
        excludedReleases: action.payload
      }

    case ActionTypes.SET_CLASS_FORMAT: {
      const format = action.payload === '45' ? '45' : '55'
      if (format === state.classFormat) return state
      // The two formats share six slots, so keep whatever is already in them
      // rather than making you rebuild the playlist from scratch.
      const oldTypes = getTrackTypes(state.classFormat)
      const newTypes = getTrackTypes(format)
      const playlist = newTypes.map(type => {
        const oldIndex = oldTypes.indexOf(type)
        return oldIndex === -1 ? null : state.playlist[oldIndex]
      })
      return {
        ...state,
        classFormat: format,
        playlist
      }
    }

    case ActionTypes.SET_SEARCH_BOTH_FORMATS:
      return {
        ...state,
        searchBothFormats: action.payload
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
          availableTags: Array.from(tagSet).sort(),
          saved: loadSavedCatalog(),
          savedPlaylist: loadSavedPlaylist()
        }
      })
    }

    loadData()
  }, [])

  // Persist catalog settings once loaded, so return visits skip Step 1
  useEffect(() => {
    if (state.isLoading) return
    saveCatalog({
      earliestRelease: state.earliestRelease,
      excludeNewest: state.excludeNewest,
      onlyRecent10: state.onlyRecent10,
      excludedReleases: state.excludedReleases,
      classFormat: state.classFormat,
      searchBothFormats: state.searchBothFormats
    })
  }, [
    state.isLoading,
    state.earliestRelease,
    state.excludeNewest,
    state.onlyRecent10,
    state.excludedReleases,
    state.classFormat,
    state.searchBothFormats
  ])

  // The slots this class format is built from
  const trackTypes = getTrackTypes(state.classFormat)

  // Persist the playlist itself, so a refresh or a closed tab doesn't wipe out
  // tracks that were picked by hand.
  useEffect(() => {
    if (state.isLoading) return
    savePlaylist(state.playlist, trackTypes)
  }, [state.isLoading, state.playlist, trackTypes])

  // Get filtered tracks based on current filters
  const getFilteredTracks = () => {
    return filterTracks(state.tracks, {
      earliestRelease: state.earliestRelease,
      excludeNewest: state.excludeNewest,
      latestRelease: state.latestRelease,
      onlyRecent10: state.onlyRecent10,
      allReleases: state.releases,
      excludedReleases: state.excludedReleases
    })
  }

  // What search and browse look through: the slots you can actually use,
  // widened to the other format's tracks when you've asked to see them.
  const getSearchTracks = () => {
    const allowed = new Set(state.searchBothFormats ? ALL_TRACK_TYPES : getFormatTrackTypes(state.classFormat))
    return getFilteredTracks().filter(track => allowed.has(track['Track No#']))
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

  // Every track matching the active theme, ignoring the release filters, so
  // the theme browser can show what exists beyond the catalog you own.
  const getAllThemedTracks = () => {
    if (state.themeTags.length === 0 && state.instructorTags.length === 0 && state.selectedGenres.length === 0) {
      return []
    }
    const allowed = new Set(state.searchBothFormats ? ALL_TRACK_TYPES : getFormatTrackTypes(state.classFormat))
    return filterByTheme(state.tracks.filter(t => allowed.has(t['Track No#'])), {
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

    setClassFormat: (format) => {
      dispatch({ type: ActionTypes.SET_CLASS_FORMAT, payload: format })
    },

    setSearchBothFormats: (value) => {
      dispatch({ type: ActionTypes.SET_SEARCH_BOTH_FORMATS, payload: value })
    },

    setExcludedReleases: (releases) => {
      dispatch({ type: ActionTypes.SET_EXCLUDED_RELEASES, payload: releases })
    },

    toggleExcludedRelease: (release) => {
      const value = String(release)
      const current = state.excludedReleases
      dispatch({
        type: ActionTypes.SET_EXCLUDED_RELEASES,
        payload: current.includes(value)
          ? current.filter(r => r !== value)
          : [...current, value]
      })
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
      const newPlaylist = trackTypes.map(trackType => {
        const track = pickRandomTrack(filteredTracks, trackType, usedTitles)
        if (track) {
          usedTitles.push(track['Song Title'])
        }
        return track
      })
      dispatch({ type: ActionTypes.SET_PLAYLIST, payload: newPlaylist })
    },

    generateThemedPlaylist: () => {
      // Never leave a hole: a class needs all ten tracks, so when the theme
      // has nothing for a slot, fall back through progressively looser
      // filters. The row badges itself from the track it ends up with.
      const baseFiltered = getFilteredTracks()
      const pools = relaxedThemeFilters({
        themeTags: state.themeTags,
        instructorTags: state.instructorTags,
        selectedGenres: state.selectedGenres
      }).map(filters => filterByTheme(baseFiltered, filters))

      const usedTitles = []
      const newPlaylist = trackTypes.map(trackType => {
        let track = null
        for (const pool of pools) {
          track = pickRandomTrack(pool, trackType, usedTitles)
          if (track) break
        }
        if (track) {
          usedTitles.push(track['Song Title'])
        }
        return track
      })
      dispatch({ type: ActionTypes.SET_PLAYLIST, payload: newPlaylist })
      return newPlaylist
    },

    randomizeTrack: (position) => {
      const filteredTracks = getFilteredTracks()
      const trackType = trackTypes[position]
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
      const trackType = trackTypes[position]
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
    trackTypes,
    getFilteredTracks,
    getSearchTracks,
    getThemedTracks,
    getAllThemedTracks
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
