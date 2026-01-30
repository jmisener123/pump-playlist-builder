import React from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Button } from '../ui/Button'
import { TAG_EMOJIS, getTagDisplayName } from '../../utils/trackUtils'
import { THEME_TAGS, INSTRUCTOR_TAGS } from '../../utils/themes'

export function ThemeGenerator() {
  const { state, actions } = usePlaylist()
  const { generateThemed } = usePlaylistBuilder()
  const { availableTags, genres } = usePlaylistData()

  // Filter theme and instructor tags to only show those that exist in the data
  const availableThemeTags = THEME_TAGS.filter(tag => availableTags.includes(tag))
  const availableInstructorTags = INSTRUCTOR_TAGS.filter(tag => availableTags.includes(tag))

  const toggleThemeTag = (tag) => {
    const newTags = state.themeTags.includes(tag)
      ? state.themeTags.filter(t => t !== tag)
      : [...state.themeTags, tag]
    actions.setThemeFilters({ themeTags: newTags })
  }

  const toggleInstructorTag = (tag) => {
    const newTags = state.instructorTags.includes(tag)
      ? state.instructorTags.filter(t => t !== tag)
      : [...state.instructorTags, tag]
    actions.setThemeFilters({ instructorTags: newTags })
  }

  const toggleGenre = (genre) => {
    const newGenres = state.selectedGenres.includes(genre)
      ? state.selectedGenres.filter(g => g !== genre)
      : [...state.selectedGenres, genre]
    actions.setThemeFilters({ selectedGenres: newGenres })
  }

  const clearAll = () => {
    actions.setThemeFilters({
      themeTags: [],
      instructorTags: [],
      selectedGenres: []
    })
  }

  const hasFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

  return (
    <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-5">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-2xl">👻</span>
        <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
          Quick Generate - Themed
        </h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 text-sm mb-3">
        Select themes, difficulty, and genres, then generate a complete playlist matching your criteria.
      </p>

      {/* Theme Tags */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Theme tags
        </label>
        <div className="flex flex-wrap gap-2">
          {availableThemeTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleThemeTag(tag)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors
                ${state.themeTags.includes(tag)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {TAG_EMOJIS[tag] || ''} {tag}
            </button>
          ))}
        </div>
        {availableThemeTags.length === 0 && (
          <p className="text-sm text-gray-400">No theme tags available</p>
        )}
      </div>

      {/* Instructor Tags */}
      <div className="mb-3">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Difficulty & Length
        </label>
        <div className="flex flex-wrap gap-2">
          {availableInstructorTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleInstructorTag(tag)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors
                ${state.instructorTags.includes(tag)
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {TAG_EMOJIS[tag] || ''} {getTagDisplayName(tag)}
            </button>
          ))}
        </div>
        {availableInstructorTags.length === 0 && (
          <p className="text-sm text-gray-400">No difficulty/length tags available</p>
        )}
      </div>

      {/* Genres */}
      <div className="mb-4">
        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
          Genres
        </label>
        <div className="flex flex-wrap gap-2">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors
                ${state.selectedGenres.includes(genre)
                  ? 'bg-secondary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {genre}
            </button>
          ))}
        </div>
        {genres.length === 0 && (
          <p className="text-sm text-gray-400">No genres available</p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-2">
        <Button variant="primary" onClick={generateThemed} className="flex-1">
          👻 Build Themed Playlist
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearAll} className="text-sm">
            Clear
          </Button>
        )}
      </div>

      <div className="mt-3 pt-3 border-t border-purple-200 dark:border-purple-700">
        <p className="text-xs text-gray-500 dark:text-gray-400">
          💡 <strong>Tip:</strong> Tracks matching ALL selected categories will be used. Use swap buttons to fine-tune.
        </p>
      </div>
    </div>
  )
}
