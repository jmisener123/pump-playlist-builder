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
    <div className="mt-6 border-t border-gray-200 dark:border-gray-700 pt-4">
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className="flex items-center justify-between w-full text-left p-3 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
      >
        <span className="font-medium text-gray-700 dark:text-gray-300">
          📋 Ready to teach it? Click to get a copy/paste version of your playlist.
        </span>
        <span className="text-gray-500 text-xl">
          {isExpanded ? '−' : '+'}
        </span>
      </button>

      {isExpanded && (
        <div className="mt-3">
          <div className="relative">
            <pre className="bg-gray-100 dark:bg-gray-900 p-4 rounded-lg text-sm overflow-x-auto whitespace-pre-wrap font-mono text-gray-800 dark:text-gray-200">
              {exportText}
            </pre>
            <Button
              variant={copied ? 'secondary' : 'primary'}
              size="sm"
              onClick={handleCopy}
              className="absolute top-2 right-2"
            >
              {copied ? '✓ Copied!' : '📋 Copy'}
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}
