import React, { useState } from 'react'
import { PlaylistProvider, usePlaylist } from './context/PlaylistContext'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ReleaseSelector } from './components/Step1/ReleaseSelector'
import { QuickGenerate } from './components/Step2/QuickGenerate'
import { TrackByTrackBuilder } from './components/Step2/TrackByTrackBuilder'
import { PlaylistBuilder } from './components/Step2/PlaylistBuilder'

function PlaylistApp() {
  const { state } = usePlaylist()
  const [mobileTab, setMobileTab] = useState('playlist') // 'playlist' | 'build'

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
        <Header />

        {/* Step 1: Release Selection */}
        <ReleaseSelector />

        {/* Step 2: Playlist Building */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-4 md:p-6 mb-4">
          <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
            Step 2: Build Your Playlist
          </h2>
          <p className="text-sm text-gray-600 dark:text-gray-400 hidden lg:block">
            Use the tools on the left to add tracks. Your playlist appears on the right.
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400 lg:hidden">
            Tap any track to swap it, or generate all 10 at once.
          </p>
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
            🎲 Generate
          </button>
        </div>

        {/* Two Column Layout - Desktop */}
        <div className="hidden lg:grid lg:grid-cols-2 gap-4">
          {/* Build Tools - Left on desktop */}
          <div className="space-y-4">
            <div className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide px-1">
              Build Tools
            </div>
            <QuickGenerate />
            <div className="text-center text-xs text-gray-400 dark:text-gray-500">— or —</div>
            <TrackByTrackBuilder />
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
            <QuickGenerate />
          )}
        </div>

        <Footer />
      </div>
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
