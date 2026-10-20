import React, { useState } from 'react'
import { ContactModal, CONTACT_ACCESS_KEY } from './ContactModal'

export function Footer() {
  const [isContactOpen, setIsContactOpen] = useState(false)
  const linkClasses =
    'display-sm text-ink-500 hover:text-flare dark:text-ink-400 dark:hover:text-flare-400 transition-colors shrink-0'

  return (
    <footer className="mt-14 border-t border-ink-200 dark:border-ink-800 pt-5">
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <p className="text-xs leading-relaxed text-ink-400 dark:text-ink-500 max-w-md">
          Made by a certified BodyPump instructor as a personal project. Not affiliated
          with, endorsed by, or associated with Les Mills or the BodyPump program.
        </p>
        {CONTACT_ACCESS_KEY ? (
          <button type="button" onClick={() => setIsContactOpen(true)} className={linkClasses}>
            Questions? Contact me →
          </button>
        ) : (
          <a
            href="https://jessicamisener.com/contact"
            target="_blank"
            rel="noopener noreferrer"
            className={linkClasses}
          >
            Questions? Contact me →
          </a>
        )}
      </div>

      <ContactModal isOpen={isContactOpen} onClose={() => setIsContactOpen(false)} />
    </footer>
  )
}
