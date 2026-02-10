import React, { useState } from 'react'
import { PlaylistProvider, usePlaylist } from './context/PlaylistContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ReleaseSelector } from './components/Step1/ReleaseSelector'
import { QuickGenerate } from './components/Step2/QuickGenerate'
import { PlaylistBuilder } from './components/Step2/PlaylistBuilder'
import { GlobalSearch } from './components/GlobalSearch'

function PlaylistApp() {
  const { state } = usePlaylist()
  const [mobileTab, setMobileTab] = useState('playlist') // 'playlist' | 'build'
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
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
            Step 2: Build Your Playlist
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 hidden lg:block">
            Use the tools on the left to add tracks. Your playlist appears on the right. You can always swap individual tracks later.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 lg:hidden mb-3">
            Build track-by-track, or generate a full random or themed playlist using the Generate tab.
          </p>
          
          {/* Mobile Search Tool */}
          <div className="lg:hidden mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => setIsGlobalSearchOpen(true)}
              className="w-full flex items-center justify-between p-3 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 hover:border-blue-300 dark:hover:border-blue-700 transition-colors group"
            >
              <div className="flex items-center gap-3">
                <div className="text-2xl">🔍</div>
                <div className="text-left">
                  <div className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Search Catalog
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    Search your entire catalog by artist or song title
                  </div>
                </div>
              </div>
              <svg 
                className="w-5 h-5 text-gray-400 group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors" 
                fill="none" 
                viewBox="0 0 24 24" 
                stroke="currentColor"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Tab Navigation */}
        <div className="lg:hidden flex mb-4 bg-white dark:bg-gray-800 rounded-xl p-1 shadow">
          <button
            onClick={() => setMobileTab('playlist')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
              ${mobileTab === 'playlist'
                ? 'bg-primary text-white'
                : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            📋 Playlist
          </button>
          <button
            onClick={() => setMobileTab('build')}
            className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-colors
              ${mobileTab === 'build'
                ? 'bg-primary text-white'
                : 'text-gray-600 dark:text-gray-400'
              }`}
          >
            ⚡ Generate
          </button>
        </div>

        {/* Two Column Layout - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-4">
          {/* Build Tools - Left on desktop */}
          <div className="space-y-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Start Building
            </div>
            <div className="px-1 -mt-2 mb-2">
              <button
                onClick={() => setIsGlobalSearchOpen(true)}
                className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors underline decoration-dotted underline-offset-2"
              >
                🔍 Search entire catalog
              </button>
            </div>
            <QuickGenerate />
          </div>

          {/* Playlist - Right on desktop */}
          <div className="lg:sticky lg:top-4 lg:self-start">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1 mb-2">
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
          {mobileTab === 'build' && (
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
