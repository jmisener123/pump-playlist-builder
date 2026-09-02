import React from 'react'

/**
 * Numbered section heading. The solid numeral plus the explicit
 * "Step N of total" marker make the sequence unmistakable, while the
 * rule-fill keeps it reading as editorial rather than as a wizard.
 */
export function StepHeading({ number, title, total = 2, hint }) {
  return (
    <div className="mb-4">
      <div className="flex items-center gap-3">
        <span
          aria-hidden="true"
          className="flex items-center justify-center shrink-0 w-8 h-8 rounded
                     bg-ink-950 text-paper dark:bg-paper dark:text-ink-950
                     font-display font-black text-base tabular leading-none"
        >
          {number}
        </span>

        <h2 className="display-md text-ink-950 dark:text-paper">
          <span className="sr-only">{`Step ${number} of ${total}: `}</span>
          {title}
        </h2>

        <span className="flex-1 border-t border-ink-200 dark:border-ink-800" />

        <span className="eyebrow shrink-0 whitespace-nowrap">
          Step {number} of {total}
        </span>
      </div>

      {hint && (
        <p className="text-sm text-ink-500 dark:text-ink-400 mt-2 ml-11">
          {hint}
        </p>
      )}
    </div>
  )
}
