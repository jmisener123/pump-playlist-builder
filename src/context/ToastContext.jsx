import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'

const TOAST_DURATION_MS = 2200

const ToastContext = createContext(null)

/**
 * Brief confirmation for actions whose effect happens somewhere the user
 * can't currently see (e.g. adding from the Search tab on mobile).
 */
export function ToastProvider({ children }) {
  const [toast, setToast] = useState(null)
  const timerRef = useRef(null)

  const showToast = useCallback((message, detail) => {
    clearTimeout(timerRef.current)
    // A fresh id restarts the entry animation when toasts arrive back to back.
    setToast({ id: Date.now(), message, detail })
    timerRef.current = setTimeout(() => setToast(null), TOAST_DURATION_MS)
  }, [])

  useEffect(() => () => clearTimeout(timerRef.current), [])

  return (
    <ToastContext.Provider value={showToast}>
      {children}
      {/* Mobile sits above the sticky "View playlist" bar. */}
      <div
        role="status"
        aria-live="polite"
        className="pointer-events-none fixed inset-x-0 bottom-24 lg:bottom-8 z-50 flex justify-center px-5"
      >
        {toast && (
          <div
            key={toast.id}
            className="motion-safe:animate-toast-in flex items-center gap-3 px-4 py-2.5 rounded shadow-lg
                       bg-ink-950 dark:bg-paper text-paper dark:text-ink-950 text-sm"
          >
            <span className="font-semibold">{toast.message}</span>
            {toast.detail && (
              <span className="tabular text-xs text-ink-300 dark:text-ink-500">{toast.detail}</span>
            )}
          </div>
        )}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const showToast = useContext(ToastContext)
  if (!showToast) {
    throw new Error('useToast must be used within a ToastProvider')
  }
  return showToast
}
