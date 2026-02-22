import { supabase } from './supabase'
import type { Recipe, RecipeWithRelations, RecipeIngredient, RecipeStep } from '@/types/recipe'

export async function getRecipes(userId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as Recipe[]
}

export async function getRecipesByCookbook(cookbookId: string): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('cookbook_id', cookbookId)
    .order('updated_at', { ascending: false })

  if (error) throw error
  return data as Recipe[]
}

export async function getRecipeWithRelations(recipeId: string): Promise<RecipeWithRelations | null> {
  const { data, error } = await supabase
    .from('recipes')
    .select(`
      *,
      recipe_ingredients (*),
      recipe_steps (*),
      recipe_nutrition (*),
      recipe_media (*)
    `)
    .eq('id', recipeId)
    .single()

  if (error) {
    if (error.code === 'PGRST116') return null
    throw error
  }

  // Transform the data to match our type
  const recipe = data as Record<string, unknown>
  const media = recipe.recipe_media as Array<{ order_index: number }> | undefined
  return {
    ...recipe,
    ingredients: recipe.recipe_ingredients as RecipeIngredient[],
    steps: (recipe.recipe_steps as RecipeStep[])?.sort((a, b) => a.step_number - b.step_number),
    nutrition: Array.isArray(recipe.recipe_nutrition)
      ? recipe.recipe_nutrition[0]
      : recipe.recipe_nutrition,
    media: media?.sort((a, b) => a.order_index - b.order_index),
  } as RecipeWithRelations
}

export async function createRecipe(recipe: {
  cookbook_id: string
  user_id: string
  title: string
  description?: string | null
  servings?: number
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
  raw_ingredients_text?: string | null
  raw_procedure_text?: string | null
  source_type?: 'manual' | 'pdf' | 'image' | 'url' | 'social'
  source_url?: string | null
  import_metadata?: any
  tags?: string[]
}): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .insert({
      ...recipe,
      parsing_status: 'pending',
    } as never)
    .select()
    .single()

  if (error) {
    console.error('createRecipe error:', error.code, error.message, error.details, error.hint)
    throw error
  }
  return data as Recipe
}

export async function updateRecipe(id: string, updates: {
  title?: string
  description?: string | null
  servings?: number
  prep_time_minutes?: number | null
  cook_time_minutes?: number | null
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
  raw_ingredients_text?: string | null
  raw_procedure_text?: string | null
  parsing_status?: 'pending' | 'parsing' | 'parsed' | 'review_needed' | 'failed'
  cookbook_id?: string
  tags?: string[]
}): Promise<Recipe> {
  const { data, error } = await supabase
    .from('recipes')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single()

  if (error) {
    console.error('updateRecipe error:', error.code, error.message, error.details, error.hint)
    console.error('updateRecipe payload:', JSON.stringify(updates))
    throw new Error(error.message || 'Failed to update recipe')
  }
  return data as Recipe
}

export async function deleteRecipe(id: string): Promise<void> {
  const { error } = await supabase
    .from('recipes')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getRecipeCount(userId: string): Promise<number> {
  const { count, error } = await supabase
    .from('recipes')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', userId)

  if (error) throw error
  return count ?? 0
}

export async function getRecentRecipes(userId: string, limit: number = 5): Promise<Recipe[]> {
  const { data, error } = await supabase
    .from('recipes')
    .select('*')
    .eq('user_id', userId)
    .order('updated_at', { ascending: false })
    .limit(limit)

  if (error) throw error
  return data as Recipe[]
}
