import { useState } from 'react'
import { RECIPE_TAGS } from '@/lib/constants'
import { TagBadge } from './TagBadge'
import { cn } from '@/lib/utils'

interface TagEditorProps {
  value: string[]
  onChange: (tags: string[]) => void
}

export function TagEditor({ value, onChange }: TagEditorProps) {
  const [filter, setFilter] = useState('')

  const selectedSet = new Set(value)

  const visibleTags = filter.trim()
    ? RECIPE_TAGS.filter((t) => t.includes(filter.toLowerCase()))
    : RECIPE_TAGS

  const toggle = (tag: string) => {
    if (selectedSet.has(tag)) {
      onChange(value.filter((t) => t !== tag))
    } else {
      onChange([...value, tag])
    }
  }

  return (
    <div className="space-y-3">
      {/* Selected tags */}
      {value.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {value.map((tag) => (
            <TagBadge key={tag} tag={tag} onRemove={() => toggle(tag)} />
          ))}
        </div>
      )}

      {/* Filter input */}
      <input
        type="text"
        placeholder="Filter tags..."
        value={filter}
        onChange={(e) => setFilter(e.target.value)}
        className="w-full text-sm border border-gray-200 rounded-md px-3 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />

      {/* Tag grid */}
      <div className="flex flex-wrap gap-1.5 max-h-40 overflow-y-auto">
        {visibleTags.map((tag) => {
          const selected = selectedSet.has(tag)
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggle(tag)}
              className={cn(
                'px-2 py-0.5 rounded-full text-xs font-medium border transition-colors',
                selected
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-600 border-gray-300 hover:border-blue-400 hover:text-blue-600'
              )}
            >
              {tag}
            </button>
          )
        })}
        {visibleTags.length === 0 && (
          <p className="text-xs text-gray-400">No tags match "{filter}"</p>
        )}
      </div>
    </div>
  )
}
