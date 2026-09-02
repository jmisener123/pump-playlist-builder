import React from 'react'
import { getTagDisplayName } from '../../utils/trackUtils'

/**
 * Tags read as quiet metadata, not decoration: hairline border, no fill,
 * no emoji. Colour is reserved for the single accent elsewhere in the UI.
 */
export function TagPill({ tag, size = 'md', active = false }) {
  const displayName = getTagDisplayName(tag)

  const sizeClasses = {
    sm: 'px-1.5 py-0.5 text-[10px]',
    md: 'px-2 py-0.5 text-[11px]',
    lg: 'px-2.5 py-1 text-xs',
  }

  const tone = active
    ? 'border-flare text-flare'
    : 'border-ink-200 dark:border-ink-700 text-ink-500 dark:text-ink-400'

  return (
    <span
      className={`inline-flex items-center rounded border font-medium tracking-[0.04em] uppercase whitespace-nowrap ${sizeClasses[size]} ${tone}`}
    >
      {displayName}
    </span>
  )
}

export function TagList({ tags, size = 'md', className = '', activeTags = [], max }) {
  if (!tags || tags.length === 0) return null

  const tagArray = typeof tags === 'string'
    ? tags.split(',').map(t => t.trim()).filter(t => t && t !== 'nan')
    : tags

  if (tagArray.length === 0) return null

  const shown = typeof max === 'number' ? tagArray.slice(0, max) : tagArray
  const overflow = tagArray.length - shown.length

  return (
    <div className={`flex flex-wrap items-center gap-1 ${className}`}>
      {shown.map((tag, index) => (
        <TagPill
          key={`${tag}-${index}`}
          tag={tag}
          size={size}
          active={activeTags.includes(tag)}
        />
      ))}
      {overflow > 0 && (
        <span className="text-[10px] text-ink-400 tabular">+{overflow}</span>
      )}
    </div>
  )
}
