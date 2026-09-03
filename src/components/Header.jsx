import React from 'react'
import { usePlaylistData } from '../hooks/usePlaylistData'
import { THEME_TAGS, INSTRUCTOR_TAGS } from '../utils/themes'
import { TAG_EMOJIS } from '../utils/trackUtils'

// How many themes to name before collapsing the rest into a count.
const TEASER_COUNT = 4

// THEME_TAGS is alphabetical, which would lead with "Beast Mode, Break-Up
// Songs, Emo". Lead with the most evocative ones instead; anything not listed
// still counts toward the "+N more" total.
const FEATURED_ORDER = [
  'Halloween',
  'Easy to Learn',
  'Summer',
  "Valentine's Day",
  'Beast Mode',
  'Sing-Along',
  'Women of Pop',
  'Positive Vibes',
]

export function Header({ onSearchClick, onThemeSelect }) {
  const { availableTags } = usePlaylistData()

  // Only advertise themes that actually exist in the loaded catalog, so this
  // line stays true as the data changes instead of hardcoding names.
  const themes = [...THEME_TAGS, ...INSTRUCTOR_TAGS].filter((t) =>
    availableTags.includes(t)
  )
  const featured = FEATURED_ORDER.filter((t) => themes.includes(t))
  const shown = [...featured, ...themes.filter((t) => !featured.includes(t))]
    .slice(0, TEASER_COUNT)
  const remaining = themes.length - shown.length

  return (
    <header className="mb-8 md:mb-10">
      {/* Nameplate */}
      <div className="flex items-end justify-between gap-4 pb-2">
        <h1 className="display-xl text-[2.25rem] sm:text-[3rem] md:text-[3.75rem] text-ink-950 dark:text-paper">
          <span className="block">Pump Playlist</span>
          <span className="block">Builder<span className="text-accent">.</span></span>
        </h1>

        {/* Desktop keeps a persistent search panel in the left column, so this
            modal trigger would duplicate it; it only earns its place on mobile. */}
        <button
          type="button"
          onClick={onSearchClick}
          className="btn-outline mb-2 shrink-0 gap-2 lg:hidden"
          aria-label="Search the full catalog"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Rule + standfirst, newspaper-style */}
      <div className="border-t-2 border-flare pt-2">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          The fastest way to plan your next Pump class.
        </p>

        {shown.length > 0 && (
          <p className="text-xs text-ink-400 dark:text-ink-500 mt-1.5">
            {shown.map((tag, i) => (
              <span key={tag} className="whitespace-nowrap">
                <button
                  type="button"
                  onClick={() => onThemeSelect && onThemeSelect(tag)}
                  className="hover:text-accent underline decoration-ink-200 dark:decoration-ink-700
                             underline-offset-2 hover:decoration-current transition-colors"
                  title={`Fill your playlist with ${tag} tracks`}
                >
                  {TAG_EMOJIS[tag] && (
                    <span aria-hidden="true" className="mr-1">{TAG_EMOJIS[tag]}</span>
                  )}
                  {tag}
                </button>
                {i < shown.length - 1 && (
                  <span className="mx-1.5 text-ink-300 dark:text-ink-700">·</span>
                )}
              </span>
            ))}
            {remaining > 0 && (
              <span className="whitespace-nowrap">
                <span className="mx-1.5 text-ink-300 dark:text-ink-700">·</span>
                <span>and more themes</span>
              </span>
            )}
          </p>
        )}
      </div>
    </header>
  )
}
