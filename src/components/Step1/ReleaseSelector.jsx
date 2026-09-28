import React, { useMemo, useState } from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Select } from '../ui/Select'
import { StepHeading } from '../ui/StepHeading'

// Mirrors filterTracks: the releases that actually feed the builder.
function getActiveReleases(releases, { earliestRelease, onlyRecent10, excludeNewest, latestRelease }) {
  const startIndex = Math.max(0, releases.indexOf(String(earliestRelease)))
  let active = releases.slice(startIndex)
  if (onlyRecent10) {
    const recent = new Set(releases.slice(-10))
    active = active.filter((r) => recent.has(r))
  }
  if (excludeNewest) {
    active = active.filter((r) => String(r) !== String(latestRelease))
  }
  return active
}

export function ReleaseSelector() {
  const { state, actions } = usePlaylist()
  const { releases, latestRelease, isLoading } = usePlaylistData()
  const [isCollapsed, setIsCollapsed] = useState(state.hasSavedCatalog)

  const summary = useMemo(() => {
    const active = getActiveReleases(releases, { ...state, latestRelease })
    if (active.length === 0) return 'No releases selected'
    if (active.length === 1) return `Release ${active[0]}`
    return `Releases ${active[0]}\u2013${active[active.length - 1]}`
  }, [releases, latestRelease, state.earliestRelease, state.onlyRecent10, state.excludeNewest])

  if (isLoading) {
    return (
      <div>
        <StepHeading number={1} title="Choose your catalog" />
        <div className="panel p-5 animate-pulse">
          <div className="h-4 bg-ink-100 dark:bg-ink-800 rounded w-1/2 mb-3"></div>
          <div className="h-9 bg-ink-100 dark:bg-ink-800 rounded w-full"></div>
        </div>
      </div>
    )
  }

  if (isCollapsed) {
    return (
      <button
        type="button"
        onClick={() => setIsCollapsed(false)}
        aria-expanded="false"
        aria-controls="catalog-settings"
        className="group w-full flex items-center gap-3 text-left"
      >
        <span
          aria-hidden="true"
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded
                     bg-flare-600 text-white
                     font-display font-black text-base tabular leading-none"
        >
          1
        </span>
        <span className="sr-only">Step 1 of 2: Catalog. </span>
        <span className="text-sm text-ink-700 dark:text-ink-300 tabular">
          {summary}
          <span aria-hidden="true" className="text-ink-300 dark:text-ink-600 mx-1.5">&middot;</span>
          <span className="text-flare-600 group-hover:underline underline-offset-2">Edit</span>
        </span>
        <span className="flex-1 border-t border-ink-200 dark:border-ink-800" />
      </button>
    )
  }

  return (
    <div id="catalog-settings">
      <StepHeading
        number={1}
        title="Choose your catalog"
        hint="Pick the oldest release you own. We'll use everything newer."
      />

      <div className="panel p-5">
        <div className="max-w-xs mb-5">
          <label className="eyebrow block mb-1.5">
            Oldest release owned
          </label>
          <Select
            value={state.earliestRelease}
            onChange={actions.setEarliestRelease}
            options={releases}
          />
        </div>

        <div className="space-y-2.5 text-sm border-t border-ink-200 dark:border-ink-800 pt-4">
        <label className="group flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={state.excludeNewest}
            onChange={(e) => actions.setExcludeNewest(e.target.checked)}
            className="w-4 h-4 accent-flare rounded-none border-ink-300"
          />
          <span className="text-ink-700 dark:text-ink-300 group-hover:text-ink-950 dark:group-hover:text-paper transition-colors">
            Exclude newest release <span className="tabular text-ink-400">({latestRelease})</span>
          </span>
        </label>

        <label className="group flex items-center gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            checked={state.onlyRecent10}
            onChange={(e) => actions.setOnlyRecent10(e.target.checked)}
            className="w-4 h-4 accent-flare rounded-none border-ink-300"
          />
          <span className="text-ink-700 dark:text-ink-300 group-hover:text-ink-950 dark:group-hover:text-paper transition-colors">
            Only use my 10 most recent releases
          </span>
        </label>
        </div>

        <div className="flex items-center justify-between gap-3 mt-4 pt-4 border-t border-ink-200 dark:border-ink-800">
          <span className="text-sm text-ink-500 dark:text-ink-400 tabular">{summary}</span>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="display-sm text-[11px] px-3 py-1.5 rounded bg-ink-950 dark:bg-paper text-paper dark:text-ink-950"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
