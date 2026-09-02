import React from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Select } from '../ui/Select'

export function ReleaseSelector() {
  const { state, actions } = usePlaylist()
  const { releases, latestRelease, isLoading } = usePlaylistData()

  if (isLoading) {
    return (
      <div>
        <div className="flex items-baseline gap-3 mb-3">
          <span className="eyebrow tabular">01</span>
          <h2 className="display-md text-ink-950 dark:text-paper">Catalog</h2>
        </div>
        <div className="panel p-5 animate-pulse">
          <div className="h-4 bg-ink-100 dark:bg-ink-800 rounded w-1/2 mb-3"></div>
          <div className="h-9 bg-ink-100 dark:bg-ink-800 rounded w-full"></div>
        </div>
      </div>
    )
  }

  return (
    <div>
      <div className="flex items-baseline gap-3 mb-3">
        <span className="eyebrow tabular">01</span>
        <h2 className="display-md text-ink-950 dark:text-paper">Catalog</h2>
      </div>

      <div className="panel p-5">
        <p className="text-sm text-ink-500 dark:text-ink-400 mb-4">
          Choose the oldest release you own — everything newer is fair game.
        </p>

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
      </div>
    </div>
  )
}
