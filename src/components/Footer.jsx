import React from 'react'

export function Footer() {
  return (
    <footer className="mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
      <div className="text-center text-gray-600 dark:text-gray-400 text-sm italic mb-4">
        <strong>Disclaimer:</strong> This tool was created by a certified BodyPump instructor as a personal project.
        <br />
        It is <strong>not affiliated with, endorsed by, or associated with Les Mills or the BodyPump program</strong>.
      </div>
      <div className="text-center">
        <a
          href="https://github.com/jmisener123/pump-playlist-builder/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm underline"
        >
          GitHub / Contact me
        </a>
      </div>
    </footer>
  )
}
