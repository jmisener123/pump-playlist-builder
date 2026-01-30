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
  const baseClasses = 'inline-flex items-center justify-center font-medium rounded-lg transition-all focus:outline-none focus:ring-2 focus:ring-offset-2'

  const variantClasses = {
    primary: 'bg-primary text-white hover:opacity-90 focus:ring-primary disabled:opacity-50',
    secondary: 'bg-secondary text-white hover:opacity-90 focus:ring-secondary disabled:opacity-50',
    accent: 'bg-accent text-white hover:opacity-90 focus:ring-accent disabled:opacity-50',
    outline: 'border-2 border-primary text-primary hover:bg-primary hover:text-white focus:ring-primary disabled:opacity-50',
    ghost: 'text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 focus:ring-gray-400 disabled:opacity-50',
    icon: 'p-2 text-gray-600 hover:bg-gray-200 dark:text-gray-400 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50'
  }

  const sizeClasses = {
    sm: 'px-3 py-1.5 text-sm',
    md: 'px-4 py-2 text-base',
    lg: 'px-6 py-3 text-lg',
    icon: 'p-2'
  }

  const classes = `${baseClasses} ${variantClasses[variant]} ${variant !== 'icon' ? sizeClasses[size] : sizeClasses.icon} ${className}`

  return (
    <button
      className={classes}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  )
}
