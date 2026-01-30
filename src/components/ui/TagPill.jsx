import React from 'react'
import { getTagColor, getTagEmoji, getTagDisplayName } from '../../utils/trackUtils'

export function TagPill({ tag, size = 'md' }) {
  const color = getTagColor(tag)
  const emoji = getTagEmoji(tag)
  const displayName = getTagDisplayName(tag)

  const sizeClasses = {
    sm: 'px-2 py-0.5 text-xs',
    md: 'px-2.5 py-1 text-sm',
    lg: 'px-3 py-1.5 text-base'
  }

  return (
    <span
      className={`inline-flex items-center rounded-full font-medium ${sizeClasses[size]}`}
      style={{ backgroundColor: color, color: '#222' }}
    >
      {emoji && <span className="mr-1">{emoji}</span>}
      {displayName}
    </span>
  )
}

export function TagList({ tags, size = 'md', className = '' }) {
  if (!tags || tags.length === 0) return null

  // Parse tags if it's a string
  const tagArray = typeof tags === 'string'
    ? tags.split(',').map(t => t.trim()).filter(t => t && t !== 'nan')
    : tags

  if (tagArray.length === 0) return null

  return (
    <div className={`flex flex-wrap gap-1.5 ${className}`}>
      {tagArray.map((tag, index) => (
        <TagPill key={`${tag}-${index}`} tag={tag} size={size} />
      ))}
    </div>
  )
}
