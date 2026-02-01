import React from 'react'

export function Header({ onSearchClick }) {
  return (
    <header className="bg-gradient-header text-white rounded-2xl p-6 mb-6 shadow-lg">
      <div className="text-center mb-4">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          🎵 Pump Playlist Builder 💪
        </h1>
        <p className="text-lg opacity-90">
          Create your perfect Pump class lineup
        </p>
      </div>
      
      {/* Global Search Button */}
      <div className="flex justify-center">
        <button
          onClick={onSearchClick}
          className="bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-medium transition-all hover:scale-105 flex items-center gap-2 shadow-lg border border-white/30"
        >
          <span className="text-xl">🔍</span>
          <span>Search Catalog</span>
        </button>
      </div>
      <p className="text-center text-xs text-white/80 mt-2">
        Find any song or artist across your entire catalog
      </p>
    </header>
  )
}
