import React from 'react'

export function Select({
  value,
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  label,
  id,
  ...props
}) {
  const selectId = id || `select-${Math.random().toString(36).substr(2, 9)}`

  return (
    <div className={className}>
      {label && (
        <label
          htmlFor={selectId}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1"
        >
          {label}
        </label>
      )}
      <select
        id={selectId}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className="select-field"
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option
          const optionLabel = typeof option === 'object' ? option.label : option
          return (
            <option key={optionValue} value={optionValue}>
              {optionLabel}
            </option>
          )
        })}
      </select>
    </div>
  )
}

export function MultiSelect({
  value = [],
  onChange,
  options = [],
  placeholder = 'Select...',
  disabled = false,
  className = '',
  label,
  ...props
}) {
  const toggleOption = (optionValue) => {
    if (value.includes(optionValue)) {
      onChange(value.filter(v => v !== optionValue))
    } else {
      onChange([...value, optionValue])
    }
  }

  return (
    <div className={className}>
      {label && (
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          {label}
        </label>
      )}
      <div className="flex flex-wrap gap-2">
        {options.map((option) => {
          const optionValue = typeof option === 'object' ? option.value : option
          const optionLabel = typeof option === 'object' ? option.label : option
          const isSelected = value.includes(optionValue)

          return (
            <button
              key={optionValue}
              type="button"
              disabled={disabled}
              onClick={() => toggleOption(optionValue)}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors
                ${isSelected
                  ? 'bg-primary text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }
                ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {optionLabel}
            </button>
          )
        })}
      </div>
      {value.length === 0 && (
        <p className="text-sm text-gray-500 mt-1">{placeholder}</p>
      )}
    </div>
  )
}
