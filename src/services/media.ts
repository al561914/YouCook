import { supabase } from './supabase'
import type { Database } from '@/types/database'

type RecipeMedia = Database['public']['Tables']['recipe_media']['Row']
type RecipeMediaInsert = Database['public']['Tables']['recipe_media']['Insert']

const BUCKET_NAME = 'recipe-media'

export interface UploadResult {
  url: string
  path: string
}

export async function uploadRecipeImage(
  userId: string,
  recipeId: string,
  file: File
): Promise<UploadResult> {
  // Generate unique filename
  const ext = file.name.split('.').pop()?.toLowerCase() || 'jpg'
  const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${ext}`
  const path = `${userId}/${recipeId}/${filename}`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET_NAME)
    .upload(path, file, {
      cacheControl: '3600',
      upsert: false,
    })

  if (uploadError) throw uploadError

  const { data: urlData } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(path)

  return {
    url: urlData.publicUrl,
    path,
  }
}

export async function deleteRecipeImage(path: string): Promise<void> {
  const { error } = await supabase.storage
    .from(BUCKET_NAME)
    .remove([path])

  if (error) throw error
}

export async function addRecipeMedia(
  recipeId: string,
  url: string,
  mediaType: string = 'image',
  caption?: string
): Promise<RecipeMedia> {
  // Get the current max order_index
  const { data: existing } = await supabase
    .from('recipe_media')
    .select('order_index')
    .eq('recipe_id', recipeId)
    .order('order_index', { ascending: false })
    .limit(1)

  const existingItems = existing as Array<{ order_index: number }> | null
  const orderIndex = existingItems && existingItems.length > 0 ? existingItems[0].order_index + 1 : 0

  const insert: RecipeMediaInsert = {
    recipe_id: recipeId,
    url,
    media_type: mediaType,
    caption: caption || null,
    order_index: orderIndex,
  }

  const { data, error } = await supabase
    .from('recipe_media')
    .insert(insert as never)
    .select()
    .single()

  if (error) throw error
  return data as RecipeMedia
}

export async function getRecipeMedia(recipeId: string): Promise<RecipeMedia[]> {
  const { data, error } = await supabase
    .from('recipe_media')
    .select('*')
    .eq('recipe_id', recipeId)
    .order('order_index', { ascending: true })

  if (error) throw error
  return data as RecipeMedia[]
}

export async function deleteRecipeMedia(mediaId: string, storagePath?: string): Promise<void> {
  // Delete from storage if path provided
  if (storagePath) {
    await deleteRecipeImage(storagePath).catch(console.error)
  }

  // Delete from database
  const { error } = await supabase
    .from('recipe_media')
    .delete()
    .eq('id', mediaId)

  if (error) throw error
}

export async function updateMediaCaption(mediaId: string, caption: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_media')
    .update({ caption } as never)
    .eq('id', mediaId)

  if (error) throw error
}

export async function reorderMedia(recipeId: string, mediaIds: string[]): Promise<void> {
  // Update order_index for each media item
  const updates = mediaIds.map((id, index) =>
    supabase
      .from('recipe_media')
      .update({ order_index: index } as never)
      .eq('id', id)
      .eq('recipe_id', recipeId)
  )

  await Promise.all(updates)
}

// Extract storage path from public URL
export function getStoragePathFromUrl(url: string): string | null {
  const match = url.match(/\/storage\/v1\/object\/public\/recipe-media\/(.+)$/)
  return match ? match[1] : null
}

/**
 * Uploads a base64 image to recipe media
 * Used for importing images that were downloaded server-side
 */
export async function uploadBase64Image(
  userId: string,
  recipeId: string,
  base64: string,
  mimeType: string,
  caption?: string
): Promise<RecipeMedia> {
  // Convert base64 to blob
  const byteString = atob(base64)
  const arrayBuffer = new ArrayBuffer(byteString.length)
  const uint8Array = new Uint8Array(arrayBuffer)
  for (let i = 0; i < byteString.length; i++) {
    uint8Array[i] = byteString.charCodeAt(i)
  }
  const blob = new Blob([uint8Array], { type: mimeType })

  // Determine file extension from MIME type
  const ext = mimeType.split('/')[1]?.split(';')[0] || 'jpg'

  // Create a File object
  const filename = `instagram-${Date.now()}.${ext}`
  const file = new File([blob], filename, { type: mimeType })

  // Upload to storage
  const { url: storageUrl } = await uploadRecipeImage(userId, recipeId, file)

  // Add to recipe_media table
  return await addRecipeMedia(recipeId, storageUrl, 'image', caption)
}
