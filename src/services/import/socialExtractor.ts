import { supabase } from '@/services/supabase'

export type SocialPlatform = 'instagram' | 'unknown'

export interface PlatformInfo {
  name: SocialPlatform
  postId: string | null
}

export interface SocialExtractionResult {
  title: string
  description: string | null
  servings: number
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  raw_ingredients_text: string
  raw_procedure_text: string
  extraction_confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  source_url: string
  thumbnail_url: string | null
  thumbnail_base64: string | null
  thumbnail_mime_type: string | null
  import_metadata: {
    method: 'social'
    platform: SocialPlatform
    author: string
    extracted_at: string
  }
}

// Instagram URL patterns
const INSTAGRAM_PATTERNS = [
  /^https?:\/\/(www\.)?instagram\.com\/p\/([A-Za-z0-9_-]+)/,           // Posts
  /^https?:\/\/(www\.)?instagram\.com\/reel\/([A-Za-z0-9_-]+)/,        // Reels
  /^https?:\/\/(www\.)?instagram\.com\/reels\/([A-Za-z0-9_-]+)/,       // Reels (alternate)
  /^https?:\/\/(www\.)?instagram\.com\/tv\/([A-Za-z0-9_-]+)/,          // IGTV
]

/**
 * Detects the social media platform from a URL
 */
export function detectPlatform(url: string): PlatformInfo {
  // Normalize URL
  const normalizedUrl = url.trim()

  // Check Instagram patterns
  for (const pattern of INSTAGRAM_PATTERNS) {
    const match = normalizedUrl.match(pattern)
    if (match) {
      return {
        name: 'instagram',
        postId: match[2] || null,
      }
    }
  }

  return {
    name: 'unknown',
    postId: null,
  }
}

/**
 * Validates if a URL is a supported social media URL
 */
export function validateSocialUrl(url: string): { valid: boolean; error?: string; platform?: SocialPlatform } {
  if (!url || !url.trim()) {
    return { valid: false, error: 'Please enter a URL' }
  }

  // Basic URL validation
  try {
    new URL(url.trim())
  } catch {
    return { valid: false, error: 'Please enter a valid URL' }
  }

  const platform = detectPlatform(url)

  if (platform.name === 'unknown') {
    return {
      valid: false,
      error: 'Only Instagram posts and reels are supported'
    }
  }

  return { valid: true, platform: platform.name }
}

/**
 * Extracts a recipe from a social media URL
 * The Edge Function handles oembed fetch (to avoid CORS) and Claude extraction
 */
export async function extractSocialRecipe(url: string): Promise<SocialExtractionResult> {
  // Validate URL
  const validation = validateSocialUrl(url)
  if (!validation.valid) {
    throw new Error(validation.error)
  }

  const platform = detectPlatform(url)

  if (platform.name !== 'instagram') {
    throw new Error('Unsupported platform')
  }

  // Call edge function - it handles oembed fetch and extraction
  const { data, error } = await supabase.functions.invoke('extract-social-recipe', {
    body: {
      url,
      platform: 'instagram',
    },
  })

  if (error) {
    throw new Error(error.message || 'Failed to extract recipe')
  }

  if (!data) {
    throw new Error('No data returned from extraction')
  }

  return {
    ...data,
    source_url: url,
    thumbnail_url: data.thumbnail_url || null,
    import_metadata: {
      method: 'social',
      platform: 'instagram',
      author: data.author || 'unknown',
      extracted_at: new Date().toISOString(),
    },
  }
}
