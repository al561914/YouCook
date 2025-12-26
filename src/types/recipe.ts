import type { Database } from './database'

export type Recipe = Database['public']['Tables']['recipes']['Row']
export type RecipeInsert = Database['public']['Tables']['recipes']['Insert']
export type RecipeUpdate = Database['public']['Tables']['recipes']['Update']

export type RecipeIngredient = Database['public']['Tables']['recipe_ingredients']['Row']
export type RecipeIngredientInsert = Database['public']['Tables']['recipe_ingredients']['Insert']

export type RecipeStep = Database['public']['Tables']['recipe_steps']['Row']
export type RecipeStepInsert = Database['public']['Tables']['recipe_steps']['Insert']

export type RecipeNutrition = Database['public']['Tables']['recipe_nutrition']['Row']

export type RecipeMedia = Database['public']['Tables']['recipe_media']['Row']

export type SourceType = Database['public']['Enums']['source_type']
export type Difficulty = Database['public']['Enums']['difficulty']
export type ParsingStatus = Database['public']['Enums']['parsing_status']

export interface RecipeWithRelations extends Recipe {
  ingredients?: RecipeIngredient[]
  steps?: RecipeStep[]
  nutrition?: RecipeNutrition
  media?: RecipeMedia[]
}

export interface ParsedIngredient {
  quantity: number | null
  unit: string | null
  name: string
  preparation: string | null
  original: string
}

export interface ParsedStep {
  step_number: number
  instruction: string
  duration_minutes: number | null
  duration_label: string | null
  temperature_f: number | null
  original: string
}
