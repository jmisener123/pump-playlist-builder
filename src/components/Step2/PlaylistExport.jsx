import React, { useState } from 'react'
import { usePlaylistBuilder } from '../../hooks/usePlaylistBuilder'
import { Button } from '../ui/Button'

export function PlaylistExport() {
  const { hasAnyTracks, getExportText, copyToClipboard } = usePlaylistBuilder()
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
        </div>
      )}
    </div>
  )
}
