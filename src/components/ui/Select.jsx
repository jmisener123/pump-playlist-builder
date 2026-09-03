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
          className="eyebrow block mb-1.5"
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
        <label className="eyebrow block mb-1.5">
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
              className={`${isSelected ? 'pill-on' : 'pill-off'}
                ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}
              `}
            >
              {optionLabel}
            </button>
          )
        })}
      </div>
      {value.length === 0 && (
        <p className="text-xs text-ink-400 mt-1.5">{placeholder}</p>
      )}
    </div>
  )
}
