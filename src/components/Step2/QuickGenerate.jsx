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
  const pillUnselected = 'bg-white/80 text-gray-700 hover:bg-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'

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

  const ThemeSection = () => (
    <div>
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

      <div className="flex gap-2">
        <Button variant="primary" onClick={() => {
          generateThemed()
          if (onPlaylistGenerated) onPlaylistGenerated()
        }} className="flex-1">
          Apply Theme & Fill
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearAll} className="text-xs px-2">Clear</Button>
        )}
      </div>
      {!hasFilters && (
        <p className="text-xs text-gray-400 mt-1 text-center">Select at least one filter above</p>
      )}
    </div>
  )

  return (
    <div className="bg-gradient-to-r from-blue-50 via-sky-100 to-blue-100 dark:from-blue-900/30 dark:via-sky-900/30 dark:to-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-md p-4">

      {/* Mobile: Themes only (Random button lives in Playlist tab) */}
      <div className="lg:hidden">
        <ThemeSection />
      </div>

      {/* Desktop: Show everything */}
      <div className="hidden lg:block">
        <div className="flex items-center gap-2 mb-4">
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">Start Building Your Playlist</h3>
        </div>

        <div className="mb-4">
          <RandomSection />
        </div>

        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
          <span className="text-sm font-semibold text-gray-500 dark:text-gray-400">Or build around a specific vibe</span>
          <div className="flex-1 border-t border-gray-200 dark:border-gray-700"></div>
        </div>

        <ThemeSection />
      </div>
    </div>
  )
}
