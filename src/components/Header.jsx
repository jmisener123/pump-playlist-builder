import React from 'react'

export function Header({ onSearchClick }) {
  return (
    <header className="bg-gradient-header text-white rounded-2xl p-6 mb-6 shadow-lg">
      <div className="flex items-center justify-between">
        <div className="flex-1 text-center">
          <h1 className="text-3xl md:text-4xl font-bold mb-2">
            🎵 Pump Playlist Builder 💪
          </h1>
          <p className="text-lg opacity-90">
            Create your perfect Pump class lineup
          </p>
        </div>
        {/* Search button - visible on mobile and desktop */}
        <button
          onClick={onSearchClick}
          className="lg:hidden absolute right-6 top-6 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-full p-3 transition-all shadow-md active:scale-95"
          aria-label="Search catalog"
          title="Search entire catalog"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className="h-6 w-6" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" 
            />
          </svg>
        </button>
      </div>
    </header>
  )
}
