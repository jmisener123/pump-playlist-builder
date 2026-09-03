import React from 'react'

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  disabled = false,
  onClick,
  className = '',
  ...props
}) {
  const base = 'btn-base'

  // Legacy variant names are aliased so existing call sites keep working.
  const variantClasses = {
    primary: 'bg-ink-950 text-paper hover:bg-flare-600 dark:bg-paper dark:text-ink-950 dark:hover:bg-flare-600 dark:hover:text-paper',
    accent: 'bg-flare-600 text-white hover:bg-flare-600',
    secondary: 'bg-flare-600 text-white hover:bg-flare-600',
    blue: 'bg-ink-950 text-paper hover:bg-flare-600 dark:bg-paper dark:text-ink-950 dark:hover:bg-flare-600 dark:hover:text-paper',
    outline: 'border border-ink-300 dark:border-ink-700 text-ink-800 dark:text-ink-200 hover:bg-ink-950 hover:text-paper hover:border-ink-950 dark:hover:bg-paper dark:hover:text-ink-950 dark:hover:border-paper',
    'blue-outline': 'border border-ink-300 dark:border-ink-700 text-ink-800 dark:text-ink-200 hover:bg-ink-950 hover:text-paper hover:border-ink-950 dark:hover:bg-paper dark:hover:text-ink-950 dark:hover:border-paper',
    ghost: 'text-ink-500 dark:text-ink-400 hover:text-ink-950 dark:hover:text-paper hover:bg-ink-100 dark:hover:bg-ink-800',
    icon: 'p-2 text-ink-500 hover:text-ink-950 hover:bg-ink-100 dark:text-ink-400 dark:hover:text-paper dark:hover:bg-ink-800',
  }

  const sizeClasses = {
    sm: 'px-2.5 py-1.5 text-[11px]',
    md: 'px-4 py-2 text-xs',
    lg: 'px-6 py-3 text-sm',
    icon: 'p-2',
  }

  const variantCls = variantClasses[variant] || variantClasses.primary
  const sizeCls = variant === 'icon' ? sizeClasses.icon : (sizeClasses[size] || sizeClasses.md)

  return (
    <button
      className={`${base} ${variantCls} ${sizeCls} ${className}`}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
