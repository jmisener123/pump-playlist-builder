import React, { useEffect, useRef, useState } from 'react'
import { PlaylistProvider, usePlaylist } from './context/PlaylistContext'
import { ToastProvider } from './context/ToastContext'
import { usePlaylistBuilder } from './hooks/usePlaylistBuilder'
import { INSTRUCTOR_TAGS } from './utils/themes'
import { Header } from './components/Header'
import { Footer } from './components/Footer'
import { ReleaseSelector } from './components/Step1/ReleaseSelector'
import { QuickGenerate } from './components/Step2/QuickGenerate'
import { PlaylistBuilder } from './components/Step2/PlaylistBuilder'
import { InlineSearch } from './components/InlineSearch'
import { StepHeading } from './components/ui/StepHeading'

function PlaylistApp() {
  const { state, actions } = usePlaylist()
  const { playlist } = usePlaylistBuilder()
  const filledCount = playlist.filter(Boolean).length
  const [mobileTab, setMobileTab] = useState('playlist')
  const [searchFocusRequest, setSearchFocusRequest] = useState(0)
  // Sits where the mobile tab bar naturally starts; used to detect when the
  // bar is pinned and to scroll back to the top of the tab content.
  const tabSentinelRef = useRef(null)
  const [isTabBarStuck, setIsTabBarStuck] = useState(false)

  useEffect(() => {
    const sentinel = tabSentinelRef.current
    if (!sentinel) return
    const observer = new IntersectionObserver(
      ([entry]) => setIsTabBarStuck(!entry.isIntersecting && entry.boundingClientRect.top < 0)
    )
    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [state.isLoading])

  // Switching tabs from deep in a long list would otherwise leave you
  // mid-way down the new tab, so jump to its top when the bar is pinned.
  const selectTab = (id) => {
    setMobileTab(id)
    const sentinel = tabSentinelRef.current
    if (!sentinel) return
    // The pinned bar starts 8px above the sentinel (its -mt-2).
    const top = sentinel.getBoundingClientRect().top + window.scrollY - 8
    if (window.scrollY > top) {
      requestAnimationFrame(() => window.scrollTo({ top }))
    }
  }

  // The header search icon is a shortcut into the Search tab, not a separate
  // search. Focus after the tab has rendered its input.
  useEffect(() => {
    if (searchFocusRequest === 0) return
    const input = Array.from(
      document.querySelectorAll('[data-search-input]')
    ).find((el) => el.offsetParent !== null)
    if (input) {
      input.scrollIntoView({ behavior: 'smooth', block: 'center' })
      input.focus({ preventScroll: true })
    }
  }, [searchFocusRequest])

  const handleSearchClick = () => {
    setMobileTab('search')
    setSearchFocusRequest((n) => n + 1)
  }

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
          onSearchClick={handleSearchClick}
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
          <div ref={tabSentinelRef} className="lg:hidden" aria-hidden="true" />
          <div
            className={`lg:hidden sticky top-0 z-30 -mx-5 px-5 py-2 -mt-2 bg-paper dark:bg-ink-950 transition-shadow
              ${isTabBarStuck ? 'shadow-[0_1px_0_0] shadow-ink-200 dark:shadow-ink-800' : ''}`}
          >
            <div className="flex items-stretch border border-ink-200 dark:border-ink-800 rounded overflow-hidden bg-paper dark:bg-ink-950">
              {[
                { id: 'search', label: 'Search' },
                { id: 'themes', label: 'Themes' },
              ].map(({ id, label }) => (
                <button
                  key={id}
                  onClick={() => selectTab(id)}
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
                onClick={() => selectTab('playlist')}
                className={`flex-[1.3] py-2.5 display-sm transition-colors flex items-center justify-center gap-1.5
                  ${mobileTab === 'playlist'
                    ? 'bg-flare-600 text-white'
                    : 'text-ink-500 dark:text-ink-400'}`}
              >
                Playlist
                <span
                  key={filledCount}
                  className={`tabular text-[11px] font-bold px-1.5 py-0.5 rounded ${filledCount > 0 ? 'motion-safe:animate-count-bump' : ''}
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
          </div>

          <p className="lg:hidden eyebrow mt-0.5 mb-4 normal-case tracking-normal text-ink-400">
            Add tracks from either tab.
          </p>

          {/* Desktop: tools left, playlist right */}
          <div className="hidden lg:grid lg:grid-cols-[1fr_1.1fr] gap-8">
            <div className="space-y-8">
              <div>
                <h3 className="display-sm text-ink-400 mb-2">Search your catalog</h3>
                <InlineSearch />
              </div>
              <div data-themes-panel>
                <QuickGenerate autoFill />
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
                <QuickGenerate onPlaylistGenerated={() => selectTab('playlist')} />
              </div>
            )}
          </div>

          {/* Mobile: keep the playlist present while the tools are open, so it
              reads as an accumulating destination rather than a third tab. */}
          {mobileTab !== 'playlist' && filledCount > 0 && (
            <div className="lg:hidden sticky bottom-4 z-30 mt-4">
              <button
                onClick={() => selectTab('playlist')}
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

    </div>
  )
}

function App() {
  return (
    <PlaylistProvider>
      <ToastProvider>
        <PlaylistApp />
      </ToastProvider>
    </PlaylistProvider>
  )
}

export default App
