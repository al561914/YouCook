import { useState, useEffect } from 'react'
import { Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'
import type { PDFPageImage } from '@/services/import'

interface PDFPageSelectorProps {
  pages: PDFPageImage[]
  onSelectionChange: (selectedPageNumbers: number[]) => void
  disabled?: boolean
}

export function PDFPageSelector({ pages, onSelectionChange, disabled }: PDFPageSelectorProps) {
  const [selectedPages, setSelectedPages] = useState<Set<number>>(
    new Set(pages.map((p) => p.pageNumber))
  )

  useEffect(() => {
    onSelectionChange(Array.from(selectedPages))
  }, [selectedPages, onSelectionChange])

  const togglePage = (pageNumber: number) => {
    if (disabled) return

    setSelectedPages((prev) => {
      const next = new Set(prev)
      if (next.has(pageNumber)) {
        next.delete(pageNumber)
      } else {
        next.add(pageNumber)
      }
      return next
    })
  }

  const selectAll = () => {
    if (disabled) return
    setSelectedPages(new Set(pages.map((p) => p.pageNumber)))
  }

  const selectNone = () => {
    if (disabled) return
    setSelectedPages(new Set())
  }

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="text-sm text-gray-600">
          {selectedPages.size} of {pages.length} pages selected
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
            disabled={disabled || selectedPages.size === pages.length}
          >
            Select All
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={selectNone}
            disabled={disabled || selectedPages.size === 0}
          >
            Clear All
          </Button>
        </div>
      </div>

      {/* Page grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {pages.map((page) => {
          const isSelected = selectedPages.has(page.pageNumber)

          return (
            <button
              key={page.pageNumber}
              onClick={() => togglePage(page.pageNumber)}
              disabled={disabled}
              className={cn(
                'relative aspect-[8.5/11] rounded-lg border-2 overflow-hidden transition-all',
                'hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500',
                isSelected
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400',
                disabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Thumbnail */}
              <img
                src={`data:image/png;base64,${page.imageBase64}`}
                alt={`Page ${page.pageNumber}`}
                className="w-full h-full object-contain"
              />

              {/* Page number badge */}
              <div className="absolute top-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
                Page {page.pageNumber}
              </div>

              {/* Selection indicator */}
              {isSelected && (
                <div className="absolute top-2 right-2 bg-blue-500 text-white rounded-full p-1">
                  <Check className="h-4 w-4" />
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
