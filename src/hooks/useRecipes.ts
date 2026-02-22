import { useEffect, useState, useCallback } from 'react'
import { useAuthStore } from '@/stores/authStore'
import * as recipeService from '@/services/recipes'
import type { Recipe, RecipeWithRelations } from '@/types/recipe'
import type { RecipeFormData } from '@/components/recipes/RecipeForm'

export function useRecipes() {
  const { user } = useAuthStore()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecipes = useCallback(async () => {
    if (!user) {
      setRecipes([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await recipeService.getRecipes(user.id)
      setRecipes(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipes')
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchRecipes()
  }, [fetchRecipes])

  const createRecipe = async (
    data: RecipeFormData,
    options?: {
      source_url?: string | null
      import_metadata?: any
      source_type?: 'manual' | 'pdf' | 'image' | 'url' | 'social'
    }
  ): Promise<Recipe> => {
    if (!user) throw new Error('Not authenticated')

    if (!data.cookbookId) throw new Error('Please select a cookbook')

    const recipe = await recipeService.createRecipe({
      user_id: user.id,
      cookbook_id: data.cookbookId,
      title: data.title,
      description: data.description || null,
      servings: data.servings,
      prep_time_minutes: data.prepTimeMinutes,
      cook_time_minutes: data.cookTimeMinutes,
      difficulty: data.difficulty,
      raw_ingredients_text: data.rawIngredientsText,
      raw_procedure_text: data.rawProcedureText,
      tags: data.tags || [],
      source_type: options?.source_type || 'manual',
      source_url: options?.source_url,
      import_metadata: options?.import_metadata,
    })

    setRecipes((prev) => [recipe, ...prev])
    return recipe
  }

  const updateRecipe = async (id: string, data: Partial<RecipeFormData>): Promise<Recipe> => {
    const updates: Parameters<typeof recipeService.updateRecipe>[1] = {}

    if (data.title !== undefined) updates.title = data.title
    if (data.description !== undefined) updates.description = data.description || null
    if (data.servings !== undefined) updates.servings = Number.isNaN(data.servings) ? 4 : data.servings
    if (data.prepTimeMinutes !== undefined) updates.prep_time_minutes = Number.isNaN(data.prepTimeMinutes) ? null : data.prepTimeMinutes
    if (data.cookTimeMinutes !== undefined) updates.cook_time_minutes = Number.isNaN(data.cookTimeMinutes) ? null : data.cookTimeMinutes
    if (data.difficulty !== undefined && data.difficulty) updates.difficulty = data.difficulty
    if (data.rawIngredientsText !== undefined) updates.raw_ingredients_text = data.rawIngredientsText
    if (data.rawProcedureText !== undefined) updates.raw_procedure_text = data.rawProcedureText
    if (data.cookbookId !== undefined && data.cookbookId) updates.cookbook_id = data.cookbookId
    if (data.tags !== undefined) updates.tags = data.tags

    const recipe = await recipeService.updateRecipe(id, updates)

    setRecipes((prev) =>
      prev.map((r) => (r.id === id ? recipe : r))
    )
    return recipe
  }

  const deleteRecipe = async (id: string): Promise<void> => {
    await recipeService.deleteRecipe(id)
    setRecipes((prev) => prev.filter((r) => r.id !== id))
  }

  return {
    recipes,
    loading,
    error,
    refresh: fetchRecipes,
    createRecipe,
    updateRecipe,
    deleteRecipe,
  }
}

export function useRecipe(recipeId: string | undefined) {
  const [recipe, setRecipe] = useState<RecipeWithRelations | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchRecipe = useCallback(async () => {
    if (!recipeId) {
      setRecipe(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    try {
      const data = await recipeService.getRecipeWithRelations(recipeId)
      setRecipe(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch recipe')
    } finally {
      setLoading(false)
    }
  }, [recipeId])

  useEffect(() => {
    fetchRecipe()
  }, [fetchRecipe])

  return { recipe, loading, error, refresh: fetchRecipe }
}

export function useRecentRecipes(limit: number = 5) {
  const { user } = useAuthStore()
  const [recipes, setRecipes] = useState<Recipe[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setRecipes([])
      setLoading(false)
      return
    }

    const fetchRecent = async () => {
      setLoading(true)
      try {
        const data = await recipeService.getRecentRecipes(user.id, limit)
        setRecipes(data)
      } catch (err) {
        console.error('Failed to fetch recent recipes:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchRecent()
  }, [user, limit])

  return { recipes, loading }
}

export function useRecipeStats() {
  const { user } = useAuthStore()
  const [stats, setStats] = useState({ recipeCount: 0, cookbookCount: 0 })
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!user) {
      setStats({ recipeCount: 0, cookbookCount: 0 })
      setLoading(false)
      return
    }

    const fetchStats = async () => {
      setLoading(true)
      try {
        const [recipeCount] = await Promise.all([
          recipeService.getRecipeCount(user.id),
        ])
        setStats({ recipeCount, cookbookCount: 0 })
      } catch (err) {
        console.error('Failed to fetch stats:', err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [user])

  return { stats, loading }
}
