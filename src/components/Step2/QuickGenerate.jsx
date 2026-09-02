import React from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Button } from '../ui/Button'
import { getTagDisplayName } from '../../utils/trackUtils'
import { THEME_TAGS, INSTRUCTOR_TAGS } from '../../utils/themes'

export function QuickGenerate({ onPlaylistGenerated }) {
  const { state, actions } = usePlaylist()
  const { generateRandom, generateThemed, hasAnyTracks } = usePlaylistBuilder()
  const { availableTags, genres } = usePlaylistData()

  const availableThemeTags = THEME_TAGS.filter(tag => availableTags.includes(tag))
  const availableInstructorTags = INSTRUCTOR_TAGS.filter(tag => availableTags.includes(tag))

  const toggleThemeTag = (tag, event) => {
    if (event) event.stopPropagation()
    const newTags = state.themeTags.includes(tag)
      ? state.themeTags.filter(t => t !== tag)
      : [...state.themeTags, tag]
    actions.setThemeFilters({ themeTags: newTags })
  }

  const toggleInstructorTag = (tag, event) => {
    if (event) event.stopPropagation()
    const newTags = state.instructorTags.includes(tag)
      ? state.instructorTags.filter(t => t !== tag)
      : [...state.instructorTags, tag]
    actions.setThemeFilters({ instructorTags: newTags })
  }

  const toggleGenre = (genre, event) => {
    if (event) event.stopPropagation()
    const newGenres = state.selectedGenres.includes(genre)
      ? state.selectedGenres.filter(g => g !== genre)
      : [...state.selectedGenres, genre]
    actions.setThemeFilters({ selectedGenres: newGenres })
  }

  const clearAll = () => {
    actions.setThemeFilters({ themeTags: [], instructorTags: [], selectedGenres: [] })
  }

  const hasFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

  const pillOn = 'pill-on'
  const pillOff = 'pill-off'

  const RandomSection = () => (
    <div>
      <Button variant="primary" onClick={() => {
        generateRandom()
        if (onPlaylistGenerated) onPlaylistGenerated()
      }} className="w-full">
        Fill all randomly
      </Button>
    </div>
  )

  const ApplyBar = () => (
    <div className="flex gap-2 mb-3">
      <Button variant="primary" onClick={() => {
        generateThemed()
        if (onPlaylistGenerated) onPlaylistGenerated()
      }} className="flex-1" disabled={!hasFilters}>
        Apply theme &amp; fill
      </Button>
      {hasFilters
        ? <Button variant="ghost" onClick={clearAll} className="text-xs px-2">Clear</Button>
        : <span className="text-xs text-ink-400 self-center">Pick a filter first</span>
      }
    </div>
  )

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
      {/* Mobile: random fill + themes */}
      <div className="lg:hidden panel p-4">
        <div className="mb-4">
          <RandomSection />
        </div>
        <div className="border-t border-ink-200 dark:border-ink-800 pt-4">
          <ThemeSection />
        </div>
      </div>

      {/* Desktop: two option cards */}
      <div className="hidden lg:flex lg:flex-col lg:gap-3">
        {/* Option 2: Track by track */}
        <div className="panel p-4">
          <h3 className="display-sm text-ink-950 dark:text-paper mb-1">Track by track</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">Use Random, Browse or Search on any slot — or fill everything at once.</p>
          <RandomSection />
        </div>

        {/* Option 3: Fill with a theme */}
        <div className="panel p-4">
          <h3 className="display-sm text-ink-950 dark:text-paper mb-1">Fill with a theme</h3>
          <p className="text-xs text-ink-500 dark:text-ink-400 mb-3">Filter by vibe, genre or difficulty, then fill.</p>
          <ThemeSection />
        </div>
      </div>
    </div>
  )
}
