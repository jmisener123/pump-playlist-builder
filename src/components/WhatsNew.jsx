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
      <p className="text-xs text-gray-400 dark:text-gray-500 -mt-1 mb-3">May 15</p>
      <ul className="space-y-3">
        {CHANGES.map((c) => (
          <li key={c.label} className="flex gap-3">
            <span className="mt-0.5 flex-shrink-0 w-5 h-5 rounded-full bg-gradient-to-br from-orange-400 to-pink-500 flex items-center justify-center">
              <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </span>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{c.label}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400">{c.detail}</p>
            </div>
          </li>
        ))}
      </ul>
      <button
        onClick={dismiss}
        className="mt-5 w-full py-2 px-4 bg-gradient-to-r from-orange-400 to-pink-500 text-white text-sm font-medium rounded-md hover:opacity-90 transition-opacity"
      >
        Got it
      </button>
    </Modal>
  )
}
