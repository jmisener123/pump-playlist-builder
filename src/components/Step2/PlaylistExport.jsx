import React, { useState } from 'react'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { Button } from '../ui/Button'
import {
  MUSIC_SERVICES,
  getTrackSearchQuery,
  formatTrackType,
  formatTrackRelease,
} from '../../utils/trackUtils'
import { usePlaylist } from '../../context/PlaylistContext'

export function PlaylistExport() {
  const { hasAnyTracks, getExportText, copyToClipboard, playlist } = usePlaylistBuilder()
  const { state } = usePlaylist()
  const [isExpanded, setIsExpanded] = useState(false)
  const [copied, setCopied] = useState(false)

  if (!hasAnyTracks) {
    return null
  }

  const handleCopy = async () => {
    const success = await copyToClipboard()
    if (success) {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const exportText = getExportText()
  const filledTracks = playlist.filter(Boolean)

  return (
    <div className="border-t border-ink-200 dark:border-ink-800">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between gap-3 w-full text-left px-3 py-2.5 hover:bg-ink-50 dark:hover:bg-ink-800 transition-colors"
      >
        <span className="display-sm text-ink-950 dark:text-paper">
          Export playlist
        </span>
        <span className="text-ink-400 text-lg leading-none w-4 text-center">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="px-3 pb-3">
          <div className="relative">
            <pre className="bg-ink-50 dark:bg-ink-950 border border-ink-200 dark:border-ink-800 p-4 rounded text-xs leading-relaxed overflow-x-auto whitespace-pre-wrap font-mono text-ink-700 dark:text-ink-300">
              {exportText}
            </pre>
            <Button
              variant={copied ? 'accent' : 'primary'}
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2"
            >
              {copied ? 'Copied' : 'Copy'}
            </Button>
          </div>

          {/* Search links rather than a real playlist transfer: the class
              recordings are licensed through Les Mills and mostly aren't in
              these catalogs, so this finds whatever version does exist
              instead of silently importing the wrong one. */}
          {filledTracks.length > 0 && (
            <div className="mt-4">
              <p className="display-sm text-[11px] text-ink-400 dark:text-ink-500">
                Find these tracks
              </p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">
                Class tracks are Les Mills recordings, so streaming versions may differ or be missing.
              </p>
              <ul className="mt-2 border border-ink-200 dark:border-ink-800 rounded divide-y divide-ink-100 dark:divide-ink-800">
                {filledTracks.map((track, index) => {
                  const query = getTrackSearchQuery(track)
                  return (
                    <li key={`${track.Release}_${track['Song Title']}_${index}`} className="px-3 py-2">
                      <p className="text-sm font-semibold text-ink-900 dark:text-ink-100 break-words">
                        {formatTrackType(track['Track No#'], state.classFormat)}: {track['Song Title']}
                      </p>
                      <p className="text-xs text-ink-500 dark:text-ink-400 break-words">
                        {track.Artist}{' '}
                        <span className="whitespace-nowrap">
                          {'\u00B7'} {formatTrackRelease(track)}
                        </span>
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                        {MUSIC_SERVICES.map(service => (
                          <a
                            key={service.id}
                            href={service.searchUrl(query)}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="display-sm text-[11px] text-ink-500 hover:text-flare dark:text-ink-400 dark:hover:text-flare-400 transition-colors whitespace-nowrap"
                          >
                            {service.name}
                          </a>
                        ))}
                      </div>
                    </li>
                  )
                })}
              </ul>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
