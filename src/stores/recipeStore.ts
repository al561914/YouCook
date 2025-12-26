import { create } from 'zustand'
import type { Recipe } from '@/types/recipe'

interface RecipeState {
  recipes: Recipe[]
  currentRecipe: Recipe | null
  loading: boolean
  error: string | null
  setRecipes: (recipes: Recipe[]) => void
  setCurrentRecipe: (recipe: Recipe | null) => void
  addRecipe: (recipe: Recipe) => void
  updateRecipe: (id: string, updates: Partial<Recipe>) => void
  removeRecipe: (id: string) => void
  setLoading: (loading: boolean) => void
  setError: (error: string | null) => void
}

export const useRecipeStore = create<RecipeState>((set) => ({
  recipes: [],
  currentRecipe: null,
  loading: false,
  error: null,

  setRecipes: (recipes) => set({ recipes }),

  setCurrentRecipe: (recipe) => set({ currentRecipe: recipe }),

  addRecipe: (recipe) => set((state) => ({
    recipes: [...state.recipes, recipe],
  })),

  updateRecipe: (id, updates) => set((state) => ({
    recipes: state.recipes.map((r) =>
      r.id === id ? { ...r, ...updates } : r
    ),
    currentRecipe:
      state.currentRecipe?.id === id
        ? { ...state.currentRecipe, ...updates }
        : state.currentRecipe,
  })),

  removeRecipe: (id) => set((state) => ({
    recipes: state.recipes.filter((r) => r.id !== id),
    currentRecipe: state.currentRecipe?.id === id ? null : state.currentRecipe,
  })),

  setLoading: (loading) => set({ loading }),

  setError: (error) => set({ error }),
}))
