import React, { useState } from 'react'
import { PlaylistProvider, usePlaylist } from './context/PlaylistContext'
import { usePlaylistBuilder } from './hooks/usePlaylistBuilder'
import { INSTRUCTOR_TAGS } from './utils/themes'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ReleaseSelector } from './components/Step1/ReleaseSelector'
import { QuickGenerate } from './components/Step2/QuickGenerate'
import { PlaylistBuilder } from './components/Step2/PlaylistBuilder'
import { GlobalSearch } from './components/GlobalSearch'
import { InlineSearch } from './components/InlineSearch'
import { StepHeading } from './components/ui/StepHeading'

function PlaylistApp() {
  const { state, actions } = usePlaylist()
  const { playlist } = usePlaylistBuilder()
  const filledCount = playlist.filter(Boolean).length
  const [mobileTab, setMobileTab] = useState('playlist')
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false)

  // Masthead theme links jump straight into the themes UI with that one filter
  // applied. Instructor tags (difficulty/length) live in a different slice of
  // state than theme tags, so route on which list the tag belongs to.
  const handleThemeSelect = (tag) => {
    const isInstructor = INSTRUCTOR_TAGS.includes(tag)
    actions.setThemeFilters({
      themeTags: isInstructor ? [] : [tag],
      instructorTags: isInstructor ? [tag] : [],
      selectedGenres: [],
    })
    setMobileTab('themes')
    // Both the desktop and mobile themes panels exist in the DOM at once (one
    // is hidden by CSS), so scroll whichever is actually visible.
    requestAnimationFrame(() => {
      const panel = Array.from(
        document.querySelectorAll('[data-themes-panel]')
      ).find((el) => el.offsetParent !== null)
      panel?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    })
  }

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
        <Header
          onSearchClick={() => setIsGlobalSearchOpen(true)}
          onThemeSelect={handleThemeSelect}
        />

        <section className="mb-10">
          <ReleaseSelector />
        </section>

        <section>
          <StepHeading
            number={2}
            title="Build your playlist"
            hint="Fill all ten slots randomly, or by search, theme, or music genre."
          />

          {/* Mobile: Search and Themes are tools that feed one destination,
              so they're grouped and an arrow points at the playlist, which
              carries a live filled-count badge to show it persists. */}
          <div className="lg:hidden mb-4">
            <div className="flex items-stretch border border-ink-200 dark:border-ink-800 rounded overflow-hidden">
              {[
                { id: 'search', label: 'Search' },
                { id: 'themes', label: 'Themes' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => setMobileTab(id)}
                  className={`flex-1 py-2.5 display-sm transition-colors border-r border-ink-200 dark:border-ink-800
                    ${mobileTab === id
                      ? 'bg-flare-600 text-white'
                      : 'text-ink-500 dark:text-ink-400'}`}
                >
                  {label}
                </button>
              ))}

              <span
                aria-hidden="true"
                className="flex items-center px-2 text-ink-300 dark:text-ink-600 border-r border-ink-200 dark:border-ink-800 select-none"
              >
                &rarr;
              </span>

              <button
                onClick={() => setMobileTab('playlist')}
                className={`flex-[1.3] py-2.5 display-sm transition-colors flex items-center justify-center gap-1.5
                  ${mobileTab === 'playlist'
                    ? 'bg-flare-600 text-white'
                    : 'text-ink-500 dark:text-ink-400'}`}
              >
                Playlist
                <span
                  className={`tabular text-[11px] font-bold px-1.5 py-0.5 rounded
                    ${mobileTab === 'playlist'
                      ? 'bg-white/25 text-white'
                      : filledCount > 0
                        ? 'bg-flare-600 text-white'
                        : 'bg-ink-100 dark:bg-ink-800 text-ink-400'}`}
                >
                  {filledCount}/10
                </span>
              </button>
            </div>

            <p className="eyebrow mt-1.5 normal-case tracking-normal text-ink-400">
              Add tracks from either tab.
            </p>
          </div>

          {/* Desktop: tools left, playlist right */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_1.1fr] gap-8">
            <div className="space-y-8">
              <div>
                <h3 className="display-sm text-ink-400 mb-2">Search your catalog</h3>
                <InlineSearch />
              </div>
              <div data-themes-panel>
                <QuickGenerate />
              </div>
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
              <div data-themes-panel>
                <QuickGenerate onPlaylistGenerated={() => setMobileTab('playlist')} />
              </div>
            )}
          </div>

          {/* Mobile: keep the playlist present while the tools are open, so it
              reads as an accumulating destination rather than a third tab. */}
          {mobileTab !== 'playlist' && filledCount > 0 && (
            <div className="lg:hidden sticky bottom-4 z-30 mt-4">
              <button
                onClick={() => setMobileTab('playlist')}
                className="w-full flex items-center justify-between gap-3 px-4 py-3 rounded
                           bg-ink-950 dark:bg-paper text-paper dark:text-ink-950 shadow-lg"
              >
                <span className="display-sm text-[11px] tabular">
                  {filledCount}/10 slots filled
                </span>
                <span className="display-sm text-[11px]">
                  View playlist &rarr;
                </span>
              </button>
            </div>
          )}
        </section>

        <Footer />
      </div>

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
