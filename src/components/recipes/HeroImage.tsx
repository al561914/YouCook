import type { RecipeMedia } from '@/types/recipe'

interface HeroImageProps {
  media: RecipeMedia[] | undefined
  title: string
}

export function HeroImage({ media, title }: HeroImageProps) {
  if (!media || media.length === 0) {
    return null
  }

  // Find first image with order_index 0, or fallback to first image
  const heroImage =
    media.find((m) => m.media_type === 'image' && m.order_index === 0) ||
    media.find((m) => m.media_type === 'image')

  if (!heroImage) {
    return null
  }

  return (
    <div className="aspect-video w-full overflow-hidden rounded-lg bg-gray-100">
      <img
        src={heroImage.url}
        alt={title}
        className="h-full w-full object-cover"
      />
    </div>
  )
}
