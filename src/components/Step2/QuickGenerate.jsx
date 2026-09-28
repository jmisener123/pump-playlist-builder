import React, { useEffect, useRef, useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { useToast } from '../../context/ToastContext'
import { Button } from '../ui/Button'
import { TAG_EMOJIS, getTagDisplayName } from '../../utils/trackUtils'
import { THEME_TAGS, INSTRUCTOR_TAGS, sortThemesBySeason } from '../../utils/themes'

/**
 * `autoFill` (desktop, where the playlist is visible alongside) fills the
 * playlist as soon as a filter is picked, but only while doing so can't
 * overwrite anything hand-picked: when the playlist is empty, or still exactly
 * what the last auto-fill produced.
 */
export function QuickGenerate({ onPlaylistGenerated, autoFill = false }) {
  const { state, actions } = usePlaylist()
  const { generateThemed } = usePlaylistBuilder()
  const { availableTags, genres } = usePlaylistData()
  const showToast = useToast()
  const [confirmingReplace, setConfirmingReplace] = useState(false)
  // The playlist array this panel last generated; any later edit replaces the
  // array in state, so reference equality means "untouched since".
  const lastFillRef = useRef(null)
  const pendingAutoFillRef = useRef(false)

  const filledCount = state.playlist.filter(Boolean).length
  const isUntouchedFill = lastFillRef.current !== null && lastFillRef.current === state.playlist
  const canAutoFill = autoFill && (filledCount === 0 || isUntouchedFill)

  const fillWithTheme = () => {
    const result = generateThemed()
    lastFillRef.current = result
    setConfirmingReplace(false)
    const filled = result.filter(Boolean).length
    showToast(
      filled === 10
        ? 'Playlist filled \u2713'
        : filled === 0
          ? 'No tracks match this theme'
          : `Filled ${filled} slots \u2713`,
      filled > 0 && filled < 10 ? `${filled}/10 \u00b7 ${10 - filled} had no match` : `${filled}/10`
    )
    if (onPlaylistGenerated) onPlaylistGenerated()
  }

  // Filters live in shared state, so fill after they've been committed.
  useEffect(() => {
    if (!pendingAutoFillRef.current) return
    pendingAutoFillRef.current = false
    const hasAny = state.themeTags.length > 0 || state.instructorTags.length > 0 || state.selectedGenres.length > 0
    if (hasAny) fillWithTheme()
  }, [state.themeTags, state.instructorTags, state.selectedGenres])

  const setFilters = (filters) => {
    setConfirmingReplace(false)
    if (canAutoFill) pendingAutoFillRef.current = true
    actions.setThemeFilters(filters)
  }

  const availableThemeTags = sortThemesBySeason(THEME_TAGS.filter(tag => availableTags.includes(tag)))
  const availableInstructorTags = INSTRUCTOR_TAGS.filter(tag => availableTags.includes(tag))

  const toggleThemeTag = (tag, event) => {
    if (event) event.stopPropagation()
    const newTags = state.themeTags.includes(tag)
      ? state.themeTags.filter(t => t !== tag)
      : [...state.themeTags, tag]
    setFilters({ themeTags: newTags })
  }

  const toggleInstructorTag = (tag, event) => {
    if (event) event.stopPropagation()
    const newTags = state.instructorTags.includes(tag)
      ? state.instructorTags.filter(t => t !== tag)
      : [...state.instructorTags, tag]
    setFilters({ instructorTags: newTags })
  }

  const toggleGenre = (genre, event) => {
    if (event) event.stopPropagation()
    const newGenres = state.selectedGenres.includes(genre)
      ? state.selectedGenres.filter(g => g !== genre)
      : [...state.selectedGenres, genre]
    setFilters({ selectedGenres: newGenres })
  }

  const clearAll = () => {
    setConfirmingReplace(false)
    actions.setThemeFilters({ themeTags: [], instructorTags: [], selectedGenres: [] })
  }

  const hasFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

  const pillOn = 'pill-on'
  const pillOff = 'pill-off'

  const handleApply = () => {
    // Hand-picked tracks would be lost with no undo, so confirm first.
    if (filledCount > 0 && !isUntouchedFill) setConfirmingReplace(true)
    else fillWithTheme()
  }

  const ApplyBar = () => {
    if (hasFilters && confirmingReplace) {
      return (
        <div className="flex items-center gap-3 mb-3 min-h-[2.25rem]">
          <span className="text-sm text-ink-700 dark:text-ink-300 flex-1">
            Replace {filledCount} {filledCount === 1 ? 'track' : 'tracks'}?
          </span>
          <Button variant="primary" size="sm" onClick={fillWithTheme} autoFocus>Replace</Button>
          <Button variant="ghost" size="sm" onClick={() => setConfirmingReplace(false)}>Cancel</Button>
        </div>
      )
    }
    return (
      <div className="flex gap-2 mb-3">
        <Button variant="primary" onClick={handleApply} className="flex-1" disabled={!hasFilters}>
          Apply theme & fill
        </Button>
        {hasFilters
          ? <Button variant="ghost" onClick={clearAll} className="text-xs px-2">Clear</Button>
          : <span className="text-xs text-ink-400 self-center">{autoFill && filledCount === 0 ? 'Pick a filter to fill' : 'Pick a filter first'}</span>
        }
      </div>
    )
  }

  const ThemeSection = () => (
    <div>
      {/* Mobile: apply bar at top so it's always reachable */}
      <div className="lg:hidden">
        <ApplyBar />
      </div>

      <div className="mb-3">
        <label className="eyebrow block mb-2">Themes</label>
        <div className="flex flex-wrap gap-1.5">
          {availableThemeTags.map(tag => (
            <button key={tag} onClick={(e) => toggleThemeTag(tag, e)}
              className={state.themeTags.includes(tag) ? pillOn : pillOff}>
              {TAG_EMOJIS[tag] && (
                <span aria-hidden="true" className="mr-1 text-[13px] leading-none">{TAG_EMOJIS[tag]}</span>
              )}
              {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="eyebrow block mb-2">Difficulty &amp; length</label>
        <div className="flex flex-wrap gap-1.5">
          {availableInstructorTags.map(tag => (
            <button key={tag} onClick={(e) => toggleInstructorTag(tag, e)}
              className={state.instructorTags.includes(tag) ? pillOn : pillOff}>
              {TAG_EMOJIS[tag] && (
                <span aria-hidden="true" className="mr-1 text-[13px] leading-none">{TAG_EMOJIS[tag]}</span>
              )}
              {getTagDisplayName(tag)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="eyebrow block mb-2">Genres</label>
        <div className="flex flex-wrap gap-1.5">
          {genres.map(genre => (
            <button key={genre} onClick={(e) => toggleGenre(genre, e)}
              className={state.selectedGenres.includes(genre) ? pillOn : pillOff}>
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: apply bar at bottom */}
      <div className="hidden lg:block">
        <ApplyBar />
      </div>
    </div>
  )

  return (
    <div>
      {/* Mobile: themes only — random fill lives in the playlist panel */}
      <div className="lg:hidden panel p-4">
        <ThemeSection />
      </div>

      <div className="hidden lg:block panel p-4">
        <h3 className="display-sm text-ink-950 dark:text-paper mb-3">Fill with a theme</h3>
        <ThemeSection />
      </div>
    </div>
  )
}
