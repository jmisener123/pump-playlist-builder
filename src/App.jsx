import React, { useState } from 'react'
import { PlaylistProvider, usePlaylist } from './context/PlaylistContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ReleaseSelector } from './components/Step1/ReleaseSelector'
import { QuickGenerate } from './components/Step2/QuickGenerate'
import { PlaylistBuilder } from './components/Step2/PlaylistBuilder'
import { GlobalSearch } from './components/GlobalSearch'
import { InlineSearch } from './components/InlineSearch'
import { WhatsNew } from './components/WhatsNew'

function PlaylistApp() {
  const { state } = usePlaylist()
  const [mobileTab, setMobileTab] = useState('playlist') // 'playlist' | 'search' | 'themes'
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)

  if (state.isLoading) {
    return (
      <div className="min-h-screen bg-gray-100 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-4 border-primary border-t-transparent"></div>
          <p className="mt-4 text-gray-600 dark:text-gray-400">Loading playlist data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      <div className="max-w-6xl mx-auto px-4 py-6">
        <Header onSearchClick={() => setIsGlobalSearchOpen(true)} />

        {/* Step 1: Release Selection */}
        <ReleaseSelector />

        {/* Step 2: Playlist Building */}
        <div className="bg-white dark:bg-gray-800 rounded-md shadow-lg p-4 md:p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200">
            Step 2: Build Your Playlist
          </h2>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden flex mb-4 bg-white dark:bg-gray-800 rounded-md p-1 shadow gap-1">
          {['search', 'themes'].map((id) => (
            <button
              key={id}
              onClick={() => setMobileTab(id)}
              className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-colors capitalize
                ${mobileTab === id ? 'bg-primary text-white' : 'text-gray-600 dark:text-gray-400'}`}
            >
              {id.charAt(0).toUpperCase() + id.slice(1)}
            </button>
          ))}
          <div className="w-px bg-gray-200 dark:bg-gray-700 my-1" />
          <button
            onClick={() => setMobileTab('playlist')}
            className={`flex-1 py-2 px-2 rounded-md text-sm font-medium transition-colors
              ${mobileTab === 'playlist'
                ? 'bg-primary text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'}`}
          >
            Playlist
          </button>
        </div>

        {/* Two Column Layout - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-4">
          {/* Build Tools - Left on desktop */}
          <div className="space-y-3">
            {/* Option 1: Search */}
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <div className="text-base font-bold text-gray-800 dark:text-gray-200 mb-3">Search your catalog</div>
              <InlineSearch />
            </div>
            {/* Options 2 & 3: Track by track + Theme */}
            <QuickGenerate />
          </div>

          {/* Playlist - Right on desktop */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="text-lg font-bold text-gray-800 dark:text-gray-200 px-1 mb-2">
              Your Playlist
            </div>
            <PlaylistBuilder />
          </div>
        </div>

        {/* Mobile Tab Content */}
        <div className="lg:hidden">
          {mobileTab === 'playlist' && (
            <PlaylistBuilder />
          )}
          {mobileTab === 'search' && (
            <div className="bg-white dark:bg-gray-800 rounded-md shadow p-4">
              <InlineSearch />
            </div>
          )}
          {mobileTab === 'themes' && (
            <QuickGenerate onPlaylistGenerated={() => setMobileTab('playlist')} />
          )}
        </div>

        <Footer />
      </div>

      {/* Global Search Modal */}
      <GlobalSearch
        isOpen={isGlobalSearchOpen}
        onClose={() => setIsGlobalSearchOpen(false)}
      />

      <WhatsNew />
    </div>
  )
}

function App() {
  return (
    <PlaylistProvider>
      <PlaylistApp />
    </PlaylistProvider>
  )
}

export default App
