import { supabase } from './supabase'
import type { Cookbook, CookbookWithRecipes } from '@/types/cookbook'

export async function getCookbooks(userId: string): Promise<Cookbook[]> {
  const { data, error } = await supabase
    .from('cookbooks')
    .select(`
      *,
      recipes:recipes(count)
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error

  // Transform to include recipe_count
  return (data as Array<Cookbook & { recipes: Array<{ count: number }> }>).map((cookbook) => ({
    ...cookbook,
    recipe_count: cookbook.recipes?.[0]?.count || 0,
  })) as Cookbook[]
}

export async function getCookbookWithRecipes(cookbookId: string): Promise<CookbookWithRecipes | null> {
  const { data, error } = await supabase
    .from('cookbooks')
    .select(`
      *,
      recipes (
        id,
        title,
        description,
        servings,
        prep_time_minutes,
        cook_time_minutes,
        difficulty,
        parsing_status,
        cover_image_url,
        created_at,
        recipe_media (
          id,
          url,
          order_index
        )
      )
    `)
    .eq('id', cookbookId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Transform to add thumbnail_url from first media if no cover_image_url
  const cookbook = data as Record<string, unknown>
  const recipes = cookbook.recipes as Array<Record<string, unknown>> | undefined

  if (recipes) {
    cookbook.recipes = recipes.map((recipe) => {
      const media = recipe.recipe_media as Array<{ url: string; order_index: number }> | undefined
      const sortedMedia = media?.sort((a, b) => a.order_index - b.order_index)
      return {
        ...recipe,
        thumbnail_url: recipe.cover_image_url || sortedMedia?.[0]?.url || null,
      }
    })
  }

  return cookbook as unknown as CookbookWithRecipes
}

export async function createCookbook(cookbook: {
  user_id: string
  name: string
  description?: string | null
  is_public?: boolean
}): Promise<Cookbook> {
  const { data, error } = await supabase
    .from('cookbooks')
    .insert(cookbook as never)
    .select()
    .single()

  if (error) throw error
  return data as Cookbook
}

export async function updateCookbook(id: string, updates: {
  name?: string
  description?: string | null
  is_public?: boolean
}): Promise<Cookbook> {
  const { data, error } = await supabase
    .from('cookbooks')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as Cookbook
}

export async function deleteCookbook(id: string): Promise<void> {
  const { error } = await supabase
    .from('cookbooks')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getCookbookCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('cookbooks')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count ?? 0
}
