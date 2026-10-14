import React from 'react'

/**
 * Text input with a clear button that appears once there's something to clear.
 *
 * Focus returns to the input after clearing so you can keep typing.
 */
export function SearchInput({ value, onChange, onClear, className = '', ...inputProps }) {
  const inputRef = React.useRef(null)

  const handleClear = () => {
    onClear()
    inputRef.current?.focus()
  }

  return (
    <div className="relative">
      <input
        ref={inputRef}
        type="text"
        value={value}
        onChange={onChange}
        className={`input-field ${value ? 'pr-9' : ''} ${className}`}
        {...inputProps}
      />
      {value && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute inset-y-0 right-0 flex items-center px-2.5 text-ink-400 hover:text-ink-900 dark:hover:text-ink-100 transition-colors"
          title="Clear search"
          aria-label="Clear search"
        >
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      )}
    </div>
  )
}
