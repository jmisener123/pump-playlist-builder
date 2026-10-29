import React, { useState, useEffect } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Button } from '../ui/Button'
import { TrackSlot, EmptyTrackMessage } from './TrackSlot'
import { TotalDuration } from './TotalDuration'
import { TrackSearch } from './TrackSearch'
import { PlaylistExport } from './PlaylistExport'
import { ThemeBrowser } from './ThemeBrowser'
import { formatThemeLabel, formatTrackType, getTagDisplayName, getThemeMatch } from '../../utils/trackUtils'
import { useToast } from '../../context/ToastContext'

export function PlaylistBuilder({ mode = 'random' }) {
  const { state, actions } = usePlaylist()
  const { playlist, setTrack, clearTrack, clearPlaylist, randomizeTrack, generateRandom, hasAnyTracks, copyShareLink } = usePlaylistBuilder()
  const { getTracksForSlot, getThemedTracksForSlot, getRelaxedTracksForSlot, getSlotTypes, allThemedTracks, trackTypes } = usePlaylistData()
  const showToast = useToast()
  const [searchPosition, setSearchPosition] = useState(null)
  const [showThemeBrowser, setShowThemeBrowser] = useState(false)
  // Both bulk actions destroy hand-picked tracks with no undo, so they swap
  // the row in place for a confirmation instead of firing immediately.
  const [pending, setPending] = useState(null)
  const [shareLabel, setShareLabel] = useState('Share your playlist')

  const handleShare = async () => {
    const copied = await copyShareLink()
    setShareLabel(copied ? 'Link copied' : 'Copy failed')
    showToast(copied ? 'Share link copied' : 'Could not copy link', copied ? 'Paste it anywhere' : undefined)
    setTimeout(() => setShareLabel('Share your playlist'), 2000)
  }

  const filledCount = playlist.filter(Boolean).length

  // Don't let a pending confirm survive the playlist emptying out.
  useEffect(() => {
    if (!hasAnyTracks) setPending(null)
  }, [hasAnyTracks])

  // Check if any theme filters are active
  const hasThemeFilters = state.themeTags.length > 0 ||
    state.instructorTags.length > 0 ||
    state.selectedGenres.length > 0

  // Only show themed options if filters are active AND playlist has tracks
  const showThemedOptions = hasThemeFilters && hasAnyTracks

  // Get active theme description
  const getActiveThemeText = () => formatThemeLabel(state, { emoji: false })

  // The browse row sits far below the theme pill, so name the filter outright
  // when it's a single tag. Stacked filters would run too long, so they fall
  // back to the generic wording.
  const singleFilterName = [...state.themeTags, ...state.instructorTags, ...state.selectedGenres].length === 1
    ? getTagDisplayName([...state.themeTags, ...state.instructorTags, ...state.selectedGenres][0])
    : null

  const handleBrowse = (position) => {
    setSearchPosition(position)
  }

  const handleSelectTrack = (track) => {
    if (searchPosition !== null) {
      setTrack(searchPosition, track)
      setSearchPosition(null)
    }
  }

  const handleCloseSearch = () => {
    setSearchPosition(null)
  }

  // Get themed options for a position (excluding current track). When the
  // exact theme has nothing left for this slot, offer the closest matches so
  // a swap is still one tap away instead of a trip to Browse.
  const getThemedOptionsForSlot = (index) => {
    if (!showThemedOptions) return { options: [], relaxed: false }
    const currentTrack = playlist[index]
    const notCurrent = (t) => !currentTrack || t['Song Title'] !== currentTrack['Song Title']
    // Newest first: the likeliest swap is a recent release.
    const newestFirst = (list) => [...list].sort((a, b) => b.SortKey - a.SortKey)

    const exact = getThemedTracksForSlot(index).filter(notCurrent)
    if (exact.length > 0) return { options: newestFirst(exact), relaxed: false }

    const relaxed = getRelaxedTracksForSlot(index).filter(notCurrent)
    return { options: newestFirst(relaxed), relaxed: relaxed.length > 0 }
  }

  // Honest summary before you scroll: how much of this playlist is actually
  // on theme, given slots the theme couldn't fill. With several filters
  // stacked, "on theme" would overstate it - name the real bar instead.
  const themeMatches = playlist.map(track =>
    hasThemeFilters ? getThemeMatch(track, state) : null
  )
  const onThemeCount = themeMatches.filter(m => m === 'exact').length
  const activeFilterGroups = [state.themeTags, state.instructorTags, state.selectedGenres]
    .filter(g => g.length > 0).length
  const matchSummaryLabel = activeFilterGroups > 1 ? 'match all filters' : 'on theme'

  // Explain the compromise once, above the list, instead of repeating a
  // sentence on every badged row - the badges mark which rows, this says why.
  const compromisedCount = themeMatches.filter(m => m === 'partial' || m === 'off').length
  const themeName = getActiveThemeText().length <= 24 ? getActiveThemeText() : 'theme'

  // With no theme pill and no bulk actions, this row would render as an empty
  // 40px strip with a rule under it, so only show it when it has content.
  const showToolbar = hasThemeFilters || hasAnyTracks

  return (
    <div className="panel">
      {showToolbar && (
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2 px-3 py-2 border-b border-ink-200 dark:border-ink-800 min-h-[2.5rem]">
          <div className="flex items-center gap-2 min-w-0 max-w-full">
            {hasThemeFilters && (
              <span className="pill-accent max-w-full" title={getActiveThemeText()}>
                <span className="truncate">{formatThemeLabel(state)}</span>
              </span>
            )}
            {hasThemeFilters && hasAnyTracks && (
              <span className="display-sm text-[11px] text-ink-400 dark:text-ink-500 whitespace-nowrap tabular">
                {onThemeCount} of {filledCount} {matchSummaryLabel}
              </span>
            )}
          </div>
          {hasAnyTracks && (
            pending ? (
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 ml-auto">
                <span className="display-sm text-[11px] text-ink-500 dark:text-ink-400">
                  {pending === 'refill' ? 'Replace' : 'Clear'} all {filledCount}?
                </span>
                <button
                  onClick={() => {
                    if (pending === 'refill') generateRandom()
                    else clearPlaylist()
                    setPending(null)
                  }}
                  className="display-sm text-[11px] text-flare-600 dark:text-flare-400 hover:underline"
                  autoFocus
                >
                  Yes
                </button>
                <span aria-hidden="true" className="text-ink-200 dark:text-ink-700">|</span>
                <button
                  onClick={() => setPending(null)}
                  className="display-sm text-[11px] text-ink-400 hover:text-ink-950 dark:hover:text-paper"
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 ml-auto">
                <Button
                  variant={shareLabel === 'Share your playlist' ? 'outline' : 'accent'}
                  size="sm"
                  onClick={handleShare}
                  className="gap-1.5"
                  title="Copy a link that opens this playlist for someone else"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 8.25H7.5a2.25 2.25 0 00-2.25 2.25v9a2.25 2.25 0 002.25 2.25h9a2.25 2.25 0 002.25-2.25v-9a2.25 2.25 0 00-2.25-2.25H15m0-3l-3-3m0 0l-3 3m3-3V15" />
                  </svg>
                  {shareLabel}
                </Button>
                <button
                  onClick={() => setPending('refill')}
                  className="display-sm text-[11px] text-ink-400 hover:text-flare dark:hover:text-flare-400 transition-colors"
                  title="Replace every slot, including tracks you picked yourself"
                >
                  Refill all randomly
                </button>
                <span aria-hidden="true" className="text-ink-200 dark:text-ink-700">|</span>
                <button
                  onClick={() => setPending('clear')}
                  className="display-sm text-[11px] text-ink-400 hover:text-flare dark:hover:text-flare-400 transition-colors"
                  title="Empty every slot and start over"
                >
                  Clear all
                </button>
              </div>
            )
          )}
        </div>
      )}

      {state.isSharedPlaylist && (
        <div className="flex items-start gap-3 px-3 py-2.5 border-b border-ink-200 dark:border-ink-800 bg-flare-600/10 dark:bg-flare-400/10">
          <p className="text-xs text-ink-600 dark:text-ink-300 flex-1">
            <span className="display-sm text-ink-950 dark:text-paper">This playlist was shared with you.</span>{' '}
            It's yours now: swap any track, refill it, or start from scratch.
          </p>
          <button
            onClick={actions.dismissSharedNotice}
            className="display-sm text-[11px] text-ink-400 hover:text-ink-950 dark:hover:text-paper shrink-0"
          >
            Got it
          </button>
        </div>
      )}

      {compromisedCount > 0 && (
        <p className="px-3 py-2 text-xs text-ink-500 dark:text-ink-400 border-b border-ink-200 dark:border-ink-800 bg-ink-50/60 dark:bg-ink-900/40">
          No {themeName} track was available for{' '}
          <span className="tabular">{compromisedCount}</span>{' '}
          {compromisedCount === 1 ? 'slot' : 'slots'}, so the closest{' '}
          {compromisedCount === 1 ? 'match is' : 'matches are'} used below. Swap any of them from its row.
        </p>
      )}

      {!hasAnyTracks && (
        <div className="p-3 border-b border-ink-200 dark:border-ink-800">
          <Button variant="primary" onClick={generateRandom} className="w-full">
            Fill all randomly
          </Button>
          <p className="text-xs text-ink-400 mt-2">
            <span className="hidden lg:inline">Or pick a theme on the left, or fill any slot below.</span>
            <span className="lg:hidden">Or use the Search or Themes tabs, or fill any slot below.</span>
          </p>
        </div>
      )}

      <TotalDuration />

      <div className="space-y-0">
        {trackTypes.map((trackType, index) => {
          const track = playlist[index]
          const { options: themedOptions, relaxed: themedOptionsRelaxed } = getThemedOptionsForSlot(index)
          const availableTracks = getTracksForSlot(index)

          return (
            <TrackSlot
              key={trackType}
              position={index}
              trackType={formatTrackType(trackType, state.classFormat)}
              track={track}
              onRandom={() => randomizeTrack(index, false)}
              onBrowse={() => handleBrowse(index)}
              onClear={() => clearTrack(index)}
              themedOptions={themedOptions}
              themedOptionsRelaxed={themedOptionsRelaxed}
              themeMatch={themeMatches[index]}
              availableCount={availableTracks.length}
              onThemedSwap={(newTrack) => setTrack(index, newTrack)}
              onRandomThemed={() => {
                if (themedOptions.length > 0) {
                  const randomIndex = Math.floor(Math.random() * themedOptions.length)
                  setTrack(index, themedOptions[randomIndex])
                }
              }}
              hasThemeFilters={showThemedOptions}
              activeFilterTags={[...state.themeTags, ...state.instructorTags]}
              activeThemeText={getActiveThemeText()}
            />
          )
        })}
      </div>

      {hasThemeFilters && allThemedTracks.length > 0 && (
        <button
          onClick={() => setShowThemeBrowser(true)}
          className="flex items-center justify-between gap-3 w-full text-left px-3 py-2.5 border-t border-ink-200 dark:border-ink-800 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
        >
          <span className="display-sm text-ink-950 dark:text-paper">
            Browse all <span className="tabular">{allThemedTracks.length}</span>{' '}
            {singleFilterName ? `${singleFilterName} tracks` : 'matching tracks'} from every release
          </span>
          <span className="text-ink-400 text-lg leading-none w-4 text-center">→</span>
        </button>
      )}

      <PlaylistExport />

      {/* Browse Modal */}
      {searchPosition !== null && (
        <TrackSearch
          position={searchPosition}
          trackType={trackTypes[searchPosition]}
          slotTypes={getSlotTypes(searchPosition)}
          trackTypeLabel={formatTrackType(trackTypes[searchPosition], state.classFormat)}
          onSelect={handleSelectTrack}
          onClose={handleCloseSearch}
        />
      )}

      {/* Every track matching the theme, across all releases */}
      {showThemeBrowser && (
        <ThemeBrowser
          themeLabel={getActiveThemeText()}
          onSelect={(index, track) => {
            if (index >= 0) setTrack(index, track)
          }}
          onClose={() => setShowThemeBrowser(false)}
        />
      )}
    </div>
  )
}
