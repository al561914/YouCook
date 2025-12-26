import { useState } from 'react'
import { X, Trash2, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
} from '@/components/ui/dialog'
import { deleteRecipeMedia, getStoragePathFromUrl } from '@/services/media'
import type { Database } from '@/types/database'

type RecipeMedia = Database['public']['Tables']['recipe_media']['Row']

interface ImageGalleryProps {
  media: RecipeMedia[]
  editable?: boolean
  onDelete?: (mediaId: string) => void
}

export function ImageGallery({ media, editable = false, onDelete }: ImageGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [deleting, setDeleting] = useState<string | null>(null)

  const images = media.filter((m) => m.media_type === 'image')

  if (images.length === 0) {
    return null
  }

  const handleDelete = async (e: React.MouseEvent, item: RecipeMedia) => {
    e.stopPropagation()
    if (!confirm('Delete this image?')) return

    setDeleting(item.id)
    try {
      const storagePath = getStoragePathFromUrl(item.url)
      await deleteRecipeMedia(item.id, storagePath || undefined)
      onDelete?.(item.id)
    } catch (err) {
      console.error('Failed to delete image:', err)
    } finally {
      setDeleting(null)
    }
  }

  const showPrev = () => {
    if (selectedIndex !== null && selectedIndex > 0) {
      setSelectedIndex(selectedIndex - 1)
    }
  }

  const showNext = () => {
    if (selectedIndex !== null && selectedIndex < images.length - 1) {
      setSelectedIndex(selectedIndex + 1)
    }
  }

  return (
    <>
      {/* Grid of thumbnails */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
        {images.map((item, index) => (
          <div
            key={item.id}
            className="relative group aspect-square rounded-lg overflow-hidden cursor-pointer bg-gray-100"
            onClick={() => setSelectedIndex(index)}
          >
            <img
              src={item.url}
              alt={item.caption || 'Recipe image'}
              className="w-full h-full object-cover transition-transform group-hover:scale-105"
            />

            {/* Overlay on hover */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />

            {/* Delete button */}
            {editable && (
              <Button
                variant="destructive"
                size="icon"
                className="absolute top-2 right-2 h-7 w-7 opacity-0 group-hover:opacity-100 transition-opacity"
                onClick={(e) => handleDelete(e, item)}
                disabled={deleting === item.id}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}

            {/* Caption */}
            {item.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/50 text-white text-xs p-1.5 truncate">
                {item.caption}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Lightbox modal */}
      <Dialog open={selectedIndex !== null} onOpenChange={() => setSelectedIndex(null)}>
        <DialogContent className="max-w-4xl p-0 bg-black/95 border-none">
          <div className="relative">
            {/* Close button */}
            <Button
              variant="ghost"
              size="icon"
              className="absolute top-2 right-2 z-10 text-white hover:bg-white/20"
              onClick={() => setSelectedIndex(null)}
            >
              <X className="h-5 w-5" />
            </Button>

            {/* Navigation buttons */}
            {selectedIndex !== null && selectedIndex > 0 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute left-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={showPrev}
              >
                <ChevronLeft className="h-8 w-8" />
              </Button>
            )}
            {selectedIndex !== null && selectedIndex < images.length - 1 && (
              <Button
                variant="ghost"
                size="icon"
                className="absolute right-2 top-1/2 -translate-y-1/2 z-10 text-white hover:bg-white/20"
                onClick={showNext}
              >
                <ChevronRight className="h-8 w-8" />
              </Button>
            )}

            {/* Image */}
            {selectedIndex !== null && images[selectedIndex] && (
              <div className="flex items-center justify-center min-h-[300px] max-h-[80vh]">
                <img
                  src={images[selectedIndex].url}
                  alt={images[selectedIndex].caption || 'Recipe image'}
                  className="max-w-full max-h-[80vh] object-contain"
                />
              </div>
            )}

            {/* Caption */}
            {selectedIndex !== null && images[selectedIndex]?.caption && (
              <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-center py-3 px-4">
                {images[selectedIndex].caption}
              </div>
            )}

            {/* Image counter */}
            {images.length > 1 && selectedIndex !== null && (
              <div className="absolute top-2 left-2 text-white text-sm bg-black/50 px-2 py-1 rounded">
                {selectedIndex + 1} / {images.length}
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
