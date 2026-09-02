import React from 'react'

export function Header({ onSearchClick }) {
  return (
    <header className="mb-8 md:mb-10">
      {/* Nameplate */}
      <div className="flex items-end justify-between gap-4 pb-2">
        <h1 className="display-xl text-[2.5rem] sm:text-[3.25rem] md:text-[4.25rem] text-ink-950 dark:text-paper">
          Pump<span className="text-flare">.</span>
          <br className="sm:hidden" />
          Playlist
        </h1>

        <button
          type="button"
          onClick={onSearchClick}
          className="btn-outline mb-2 shrink-0 gap-2"
          aria-label="Search the full catalog"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11a6 6 0 11-12 0 6 6 0 0112 0z" />
          </svg>
          <span className="hidden sm:inline">Search</span>
        </button>
      </div>

      {/* Rule + standfirst, newspaper-style */}
      <div className="border-t-2 border-ink-950 dark:border-paper pt-2">
        <p className="text-sm text-ink-500 dark:text-ink-400">
          Build a class lineup from the releases you actually own.
        </p>
      </div>
    </header>
  )
}
