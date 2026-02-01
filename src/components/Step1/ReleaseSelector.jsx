import React from 'react'
import { usePlaylist } from '../../context/PlaylistContext'
import { usePlaylistData } from '../../hooks/usePlaylistData'
import { Select } from '../ui/Select'

export function ReleaseSelector() {
  const { state, actions } = usePlaylist()
  const { releases, latestRelease, isLoading } = usePlaylistData()

  if (isLoading) {
    return (
      <div className="bg-gradient-to-r from-rose-100 via-pink-100 to-red-200 dark:from-rose-900/30 dark:via-pink-900/30 dark:to-red-900/30 rounded-2xl shadow-lg p-4 md:p-6 mb-4">
        <div className="animate-pulse">
          <div className="h-6 bg-white/50 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-white/50 rounded w-3/4"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-gradient-to-r from-rose-100 via-pink-100 to-red-200 dark:from-rose-900/30 dark:via-pink-900/30 dark:to-red-900/30 rounded-2xl shadow-lg p-4 md:p-6 mb-4">
      <h2 className="text-xl font-bold text-gray-800 dark:text-gray-200 mb-1">
        Step 1: Select Your Catalog
      </h2>
      <p className="text-sm text-gray-700 dark:text-gray-300 mb-4">
        Choose the oldest release you own. We'll use everything newer.
      </p>

      <div className="flex items-center gap-3 mb-4">
        <div className="flex-1">
          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
            Oldest release I own
          </label>
          <Select
            value={state.earliestRelease}
            onChange={actions.setEarliestRelease}
            options={releases}
          />
        </div>
      </div>

      <div className="space-y-2 text-sm">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.excludeNewest}
            onChange={(e) => actions.setExcludeNewest(e.target.checked)}
            className="w-4 h-4 text-primary rounded focus:ring-primary"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Exclude newest release ({latestRelease})
          </span>
        </label>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={state.onlyRecent10}
            onChange={(e) => actions.setOnlyRecent10(e.target.checked)}
            className="w-4 h-4 text-primary rounded focus:ring-primary"
          />
          <span className="text-gray-700 dark:text-gray-300">
            Only use my 10 most recent releases
          </span>
        </label>
      </div>
    </div>
  )
}
