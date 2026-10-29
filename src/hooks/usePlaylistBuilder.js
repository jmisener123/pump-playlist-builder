import { usePlaylist } from '../context/PlaylistContext'
import { usePlaylistData } from './usePlaylistData'
import { calculateTotalDuration, formatThemeLabel, formatTrackRelease, formatTrackType } from '../utils/trackUtils'
import { buildShareUrl } from '../utils/shareLink'
import { copyText } from '../utils/clipboard'

/**
 * Hook for playlist building operations
 */
export function usePlaylistBuilder() {
  const { state, actions } = usePlaylist()
  const { filteredTracks, themedTracks, trackTypes, getTracksForSlot, getThemedTracksForSlot } = usePlaylistData()

  // Get current playlist
  const playlist = state.playlist

  // Calculate total duration
  const totalDuration = calculateTotalDuration(playlist)

  // Check if playlist has any tracks
  const hasAnyTracks = playlist.some(track => track !== null)

  // Check if playlist is complete (every slot in this format filled)
  const isComplete = playlist.every(track => track !== null)

  // Generate random playlist
  const generateRandom = () => {
    actions.generateRandomPlaylist()
  }

  // Generate themed playlist
  const generateThemed = () => {
    return actions.generateThemedPlaylist()
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
    actions.setPlaylist(Array(trackTypes.length).fill(null))
    actions.setThemeFilters({ themeTags: [], instructorTags: [], selectedGenres: [] })
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

    const theme = formatThemeLabel(state)
    const format = state.classFormat === '45' ? '45-Minute ' : ''
    let text = `${theme ? `${theme} ` : ''}${format}Pump Playlist - Total Time: ${totalDuration}\n`

    playlist.forEach((track, index) => {
      if (track) {
        text += `${formatTrackRelease(track, { short: false })} - ${formatTrackType(track['Track No#'], state.classFormat)}: ${track['Song Title']} - ${track.Artist} (${track.Duration})\n`
      } else {
        text += `${formatTrackType(trackTypes[index], state.classFormat)}: [Empty]\n`
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

  // A link that reopens this playlist, theme and all, in someone else's browser
  const getShareUrl = () => buildShareUrl({
    playlist,
    classFormat: state.classFormat,
    tracks: state.tracks,
    themeTags: state.themeTags,
    instructorTags: state.instructorTags,
    selectedGenres: state.selectedGenres
  })

  const copyShareLink = async () => {
    const url = getShareUrl()
    if (!url) return false
    return copyText(url)
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
    getShareUrl,
    copyShareLink,
    trackTypes
  }
}
