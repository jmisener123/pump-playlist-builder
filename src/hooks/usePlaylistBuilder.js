import { usePlaylist } from '../context/PlaylistContext'
import { usePlaylistData } from './usePlaylistData'
import { calculateTotalDuration, TRACK_TYPES } from '../utils/trackUtils'

/**
 * Hook for playlist building operations
 */
export function usePlaylistBuilder() {
  const { state, actions } = usePlaylist()
  const { filteredTracks, themedTracks, getTracksForSlot, getThemedTracksForSlot } = usePlaylistData()

  // Get current playlist
  const playlist = state.playlist

  // Calculate total duration
  const totalDuration = calculateTotalDuration(playlist)

  // Check if playlist has any tracks
  const hasAnyTracks = playlist.some(track => track !== null)

  // Check if playlist is complete (all 10 slots filled)
  const isComplete = playlist.every(track => track !== null)

  // Generate random playlist
  const generateRandom = () => {
    actions.generateRandomPlaylist()
  }

  // Generate themed playlist
  const generateThemed = () => {
    actions.generateThemedPlaylist()
  }

  // Set track at a position
  const setTrack = (position, track) => {
    actions.setTrack(position, track)
  }

  // Clear track at a position
  const clearTrack = (position) => {
    actions.clearTrack(position)
  }

  // Clear entire playlist
  const clearPlaylist = () => {
    actions.setPlaylist(Array(10).fill(null))
  }

  // Randomize a single track (using current filters)
  const randomizeTrack = (position, useTheme = false) => {
    if (useTheme) {
      actions.randomizeTrackThemed(position)
    } else {
      actions.randomizeTrack(position)
    }
  }

  // Get available tracks for swapping at a position
  const getSwapOptions = (position, useTheme = false) => {
    const tracks = useTheme ? getThemedTracksForSlot(position) : getTracksForSlot(position)
    const currentTrack = playlist[position]

    // Filter out the current track
    return tracks.filter(t =>
      !currentTrack || t['Song Title'] !== currentTrack['Song Title']
    )
  }

  // Generate export text for copy/paste
  const getExportText = () => {
    if (!hasAnyTracks) return ''

    let text = `Pump Playlist - Total Time: ${totalDuration}\n`

    playlist.forEach((track, index) => {
      if (track) {
        text += `${track.Release} - ${track['Track No#']}: ${track['Song Title']} — ${track.Artist} (${track.Duration})\n`
      } else {
        text += `${TRACK_TYPES[index]}: [Empty]\n`
      }
    })

    return text
  }

  // Copy playlist to clipboard
  const copyToClipboard = async () => {
    const text = getExportText()
    try {
      await navigator.clipboard.writeText(text)
      return true
    } catch (err) {
      console.error('Failed to copy to clipboard:', err)
      return false
    }
  }

  return {
    playlist,
    totalDuration,
    hasAnyTracks,
    isComplete,
    generateRandom,
    generateThemed,
    setTrack,
    clearTrack,
    clearPlaylist,
    randomizeTrack,
    getSwapOptions,
    getExportText,
    copyToClipboard,
    trackTypes: TRACK_TYPES
  }
}
