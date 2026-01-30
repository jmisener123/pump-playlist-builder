import React from 'react'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'

export function TotalDuration() {
  const { totalDuration, hasAnyTracks } = usePlaylistBuilder()

  if (!hasAnyTracks) {
    return null
  }

  return (
    <div className="flex items-center justify-between bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 mb-2">
      <span className="text-gray-700 dark:text-gray-300 text-sm font-medium">
        🕒 Total Duration:
      </span>
      <span className="text-lg font-bold text-primary">
        {totalDuration}
      </span>
    </div>
  )
}
