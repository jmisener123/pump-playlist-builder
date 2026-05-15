import React from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Button } from '../ui/Button'
import { TAG_EMOJIS, getTagDisplayName } from '../../utils/trackUtils'
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

  const pillBase = 'px-3 py-1 rounded-full text-sm font-medium transition-colors'
  const pillUnselected = 'bg-gray-100 border border-gray-200 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-600'

  const RandomSection = () => (
    <div>
      <Button variant="primary" onClick={() => {
        generateRandom()
        if (onPlaylistGenerated) onPlaylistGenerated()
      }} className="w-full">
        Fill All Randomly
      </Button>
    </div>
  )

  const ApplyBar = () => (
    <div className="flex gap-2 mb-3">
      <Button variant="primary" onClick={() => {
        generateThemed()
        if (onPlaylistGenerated) onPlaylistGenerated()
      }} className="flex-1" disabled={!hasFilters}>
        Apply Theme & Fill
      </Button>
      {hasFilters
        ? <Button variant="ghost" onClick={clearAll} className="text-xs px-2">Clear</Button>
        : <span className="text-xs text-gray-400 self-center">Select filters first</span>
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
        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Themes</label>
        <div className="flex flex-wrap gap-1.5">
          {availableThemeTags.map(tag => (
            <button key={tag} onClick={(e) => toggleThemeTag(tag, e)}
              className={`${pillBase} ${state.themeTags.includes(tag) ? 'bg-primary text-white' : pillUnselected}`}>
              {TAG_EMOJIS[tag] || ''} {tag}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Difficulty & Length</label>
        <div className="flex flex-wrap gap-1.5">
          {availableInstructorTags.map(tag => (
            <button key={tag} onClick={(e) => toggleInstructorTag(tag, e)}
              className={`${pillBase} ${state.instructorTags.includes(tag) ? 'bg-primary text-white' : pillUnselected}`}>
              {TAG_EMOJIS[tag] || ''} {getTagDisplayName(tag)}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-3">
        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">Genres</label>
        <div className="flex flex-wrap gap-1.5">
          {genres.map(genre => (
            <button key={genre} onClick={(e) => toggleGenre(genre, e)}
              className={`${pillBase} ${state.selectedGenres.includes(genre) ? 'bg-secondary text-white' : pillUnselected}`}>
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
      <div className="lg:hidden bg-gradient-to-r from-blue-50 via-sky-100 to-blue-100 dark:from-blue-900/30 dark:via-sky-900/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-4">
        <div className="mb-4">
          <RandomSection />
        </div>
        <div className="border-t border-blue-200 dark:border-blue-700 pt-4">
          <ThemeSection />
        </div>
      </div>

      {/* Desktop: two option cards */}
      <div className="hidden lg:flex lg:flex-col lg:gap-3">
        {/* Option 2: Track by track */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
          <div className="text-base font-bold text-gray-800 dark:text-gray-200 mb-0.5">Build track by track</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Use the Random, Browse, or Search buttons on each slot. Or fill all at once:</p>
          <RandomSection />
        </div>

        {/* Option 3: Fill with a theme */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
          <div className="text-base font-bold text-gray-800 dark:text-gray-200 mb-0.5">Fill with a theme</div>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">Filter by vibe, genre, or difficulty, then fill your playlist.</p>
          <ThemeSection />
        </div>
      </div>
    </div>
  )
}
