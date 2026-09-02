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

function SectionHeading({ index, title, children }) {
  return (
    <div className="flex items-baseline gap-3 mb-3">
      <span className="eyebrow tabular">{index}</span>
      <h2 className="display-md text-ink-950 dark:text-paper">{title}</h2>
      {children}
    </div>
  )
}

function PlaylistApp() {
  const { state } = usePlaylist()
  const [mobileTab, setMobileTab] = useState('playlist')
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)

  if (state.isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto h-px w-24 bg-ink-950 dark:bg-paper animate-pulse" />
          <p className="eyebrow mt-4">Loading catalog</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen">
      <div className="max-w-6xl mx-auto px-5 md:px-8 py-8 md:py-12">
        <Header onSearchClick={() => setIsGlobalSearchOpen(true)} />

        <section className="mb-10">
          <ReleaseSelector />
        </section>

        <section>
          <SectionHeading index="02" title="Build" />

          {/* Mobile segmented control */}
          <div className="lg:hidden flex border border-ink-200 dark:border-ink-800 rounded mb-4 overflow-hidden">
            {[
              { id: 'search', label: 'Search' },
              { id: 'themes', label: 'Themes' },
              { id: 'playlist', label: 'Playlist' },
            ].map(({ id, label }) => (
              <button
                key={id}
                onClick={() => setMobileTab(id)}
                className={`flex-1 py-2.5 display-sm transition-colors border-r last:border-r-0 border-ink-200 dark:border-ink-800
                  ${mobileTab === id
                    ? 'bg-ink-950 text-paper dark:bg-paper dark:text-ink-950'
                    : 'text-ink-500 dark:text-ink-400 hover:text-ink-950 dark:hover:text-paper'}`}
              >
                {label}
              </button>
            ))}
          </div>

          {/* Desktop: tools left, playlist right */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_1.1fr] gap-8">
            <div className="space-y-8">
              <div>
                <h3 className="display-sm text-ink-400 mb-2">Search your catalog</h3>
                <InlineSearch />
              </div>
              <QuickGenerate />
            </div>

            <div className="lg:sticky lg:top-8 lg:self-start">
              <h3 className="display-sm text-ink-400 mb-2">Your playlist</h3>
              <PlaylistBuilder />
            </div>
          </div>

          {/* Mobile panes */}
          <div className="lg:hidden">
            {mobileTab === 'playlist' && <PlaylistBuilder />}
            {mobileTab === 'search' && <InlineSearch />}
            {mobileTab === 'themes' && (
              <QuickGenerate onPlaylistGenerated={() => setMobileTab('playlist')} />
            )}
          </div>
        </section>

        <Footer />
      </div>

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
