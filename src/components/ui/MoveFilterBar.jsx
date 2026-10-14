import React from 'react'

/**
 * The moves currently constraining a search, shown as removable chips.
 *
 * The track name is printed once rather than on every chip, since all active
 * filters belong to the same track by construction.
 */
export function MoveFilterBar({ filters, onRemove, onClear }) {
  if (filters.length === 0) return null

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <span className="eyebrow text-ink-400">{filters[0].bodyPart}</span>
      {filters.map(filter => (
        <button
          key={filter.id}
          type="button"
          onClick={() => onRemove(filter.id)}
          className="pill-on inline-flex items-center gap-1"
          title={`Remove ${filter.label}`}
          aria-label={`Remove ${filter.label}`}
        >
          {filter.label}
          <svg className="w-3 h-3" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      ))}
      {filters.length > 1 && (
        <button
          type="button"
          onClick={onClear}
          className="eyebrow text-ink-500 dark:text-ink-400 hover:text-ink-900 dark:hover:text-paper transition-colors"
        >
          Clear
        </button>
      )}
    </div>
  )
}
