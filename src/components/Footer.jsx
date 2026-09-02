import React from 'react'

export function Footer() {
  return (
    <footer className="mt-14 border-t border-ink-200 dark:border-ink-800 pt-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <p className="text-xs leading-relaxed text-ink-400 dark:text-ink-500 max-w-md">
          Made by a certified BodyPump instructor as a personal project. Not affiliated
          with, endorsed by, or associated with Les Mills or the BodyPump program.
        </p>
        <a
          href="https://github.com/jmisener123/pump-playlist-builder/"
          target="_blank"
          rel="noopener noreferrer"
          className="display-sm text-ink-500 hover:text-flare dark:text-ink-400 dark:hover:text-flare transition-colors shrink-0"
        >
          GitHub &amp; contact →
        </a>
      </div>
    </footer>
  )
}
