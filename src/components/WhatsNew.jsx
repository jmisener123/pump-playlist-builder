import React, { useState, useEffect } from 'react'
import { Modal } from './ui/Modal'

const VERSION_KEY = 'whats-new-v2'

const CHANGES = [
  {
    label: 'Expanded catalog history',
    detail: 'Now goes all the way back to Release 1 (with exceptions where tracklists aren\'t available).'
  },
  {
    label: 'Cleaner mobile layout',
    detail: 'Reduced visual noise and improved layout on small screens.'
  },
]

export function WhatsNew() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem(VERSION_KEY)) {
      setIsOpen(true)
    }
  }, [])

  function dismiss() {
    localStorage.setItem(VERSION_KEY, '1')
    setIsOpen(false)
  }

  return (
    <Modal isOpen={isOpen} onClose={dismiss} title="What's New" size="sm">
      <p className="eyebrow -mt-1 mb-4">May 15</p>
      <ul className="space-y-3">
        {CHANGES.map((c) => (
          <li key={c.label} className="flex gap-3">
            <span className="mt-1.5 flex-shrink-0 w-1.5 h-1.5 rounded-full bg-flare" />
            <div>
              <p className="text-sm font-semibold text-ink-900 dark:text-ink-100">{c.label}</p>
              <p className="text-xs text-ink-500 dark:text-ink-400 mt-0.5">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <button
        onClick={dismiss}
        className="btn-primary mt-6 w-full"
      >
        Got it
      </button>
    </Modal>
  )
}
