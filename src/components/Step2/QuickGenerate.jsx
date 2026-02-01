import React, { useState } from 'react'
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
  const [mobileTab, setMobileTab] = useState('random') // 'random' | 'theme'

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

  const filterCount = state.themeTags.length + state.instructorTags.length + state.selectedGenres.length

  // Random content section
  const RandomSection = () => (
    <div>
      <Button variant="primary" onClick={() => {
        generateRandom()
        if (onPlaylistGenerated) onPlaylistGenerated()
      }} className="w-full">
        {hasAnyTracks ? '🔄 Regenerate Random' : '🎲 Generate playlist (random)'}
      </Button>
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 text-center">
        Uses any tracks from your selected releases
      </p>
    </div>
  )

  // Theme content section
  const ThemeSection = () => (
    <div>
      {/* Theme Tags */}
      <div className="mb-3">
        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
          Themes
        </label>
        <div className="flex flex-wrap gap-1">
          {availableThemeTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleThemeTag(tag)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors
                ${state.themeTags.includes(tag)
                  ? 'bg-primary text-white'
                  : 'bg-white/70 text-gray-700 hover:bg-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {TAG_EMOJIS[tag] || ''} {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Instructor Tags */}
      <div className="mb-3">
        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
          Difficulty & Length
        </label>
        <div className="flex flex-wrap gap-1">
          {availableInstructorTags.map(tag => (
            <button
              key={tag}
              onClick={() => toggleInstructorTag(tag)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors
                ${state.instructorTags.includes(tag)
                  ? 'bg-primary text-white'
                  : 'bg-white/70 text-gray-700 hover:bg-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {TAG_EMOJIS[tag] || ''} {getTagDisplayName(tag)}
            </button>
          ))}
        </div>
      </div>

      {/* Genres */}
      <div className="mb-3">
        <label className="block text-sm font-bold text-gray-800 dark:text-gray-200 mb-2">
          Genres
        </label>
        <div className="flex flex-wrap gap-1">
          {genres.map(genre => (
            <button
              key={genre}
              onClick={() => toggleGenre(genre)}
              className={`px-2 py-0.5 rounded-full text-xs font-medium transition-colors
                ${state.selectedGenres.includes(genre)
                  ? 'bg-secondary text-white'
                  : 'bg-white/70 text-gray-700 hover:bg-white dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
            >
              {genre}
            </button>
          ))}
        </div>
      </div>

      {/* Themed Generate Button */}
      <div className="flex gap-2">
        <Button
          variant="secondary"
          onClick={() => {
            generateThemed()
            if (onPlaylistGenerated) onPlaylistGenerated()
          }}
          className="flex-1"
        >
          👻 Create Themed Playlist
        </Button>
        {hasFilters && (
          <Button variant="ghost" onClick={clearAll} className="text-xs px-2">
            Clear
          </Button>
        )}
      </div>
      {!hasFilters && (
        <p className="text-xs text-gray-400 mt-1 text-center">
          Select at least one filter above
        </p>
      )}
    </div>
  )

  return (
    <div className="bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">

      {/* Mobile: Tabs for Random vs Theme */}
      <div className="lg:hidden">
        <div className="flex border-b border-purple-200 dark:border-purple-700 mb-4">
          <button
            onClick={() => setMobileTab('random')}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors border-b-2 -mb-px
              ${mobileTab === 'random'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
          >
            🎲 Random
          </button>
          <button
            onClick={() => setMobileTab('theme')}
            className={`flex-1 py-2 px-3 text-sm font-medium transition-colors border-b-2 -mb-px
              ${mobileTab === 'theme'
                ? 'border-primary text-primary'
                : 'border-transparent text-gray-500 dark:text-gray-400'
              }`}
          >
            👻 Theme {hasFilters && `(${filterCount})`}
          </button>
        </div>

        {mobileTab === 'random' && <RandomSection />}
        {mobileTab === 'theme' && <ThemeSection />}
      </div>

      {/* Desktop: Show everything */}
      <div className="hidden lg:block">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <span className="text-2xl">⚡</span>
          <h3 className="text-lg font-bold text-gray-800 dark:text-gray-200">
            Generate A Full Playlist with One Click
          </h3>
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
          Fill all 10 tracks at once — randomly or by theme
        </p>

        {/* Random Button */}
        <div className="mb-4">
          <RandomSection />
        </div>

        {/* Divider */}
        <div className="flex items-center gap-2 mb-3">
          <div className="flex-1 border-t border-purple-200 dark:border-purple-700"></div>
          <span className="text-xs text-gray-500 dark:text-gray-400">or by theme</span>
          <div className="flex-1 border-t border-purple-200 dark:border-purple-700"></div>
        </div>

        <ThemeSection />
      </div>
    </div>
  )
}
