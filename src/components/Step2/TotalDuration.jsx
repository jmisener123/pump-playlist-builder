import React from 'react'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'

export function TotalDuration() {
  const { totalDuration, hasAnyTracks } = usePlaylistBuilder()

  if (!hasAnyTracks) {
    return null
  }

  return (
    <div className="flex items-baseline justify-between px-3 py-2 border-b border-ink-200 dark:border-ink-800">
      <span className="eyebrow">Total runtime</span>
      <span className="font-display font-black text-xl tabular tracking-tight text-ink-950 dark:text-paper">
        {totalDuration}
      </span>
    </div>
  )
}
