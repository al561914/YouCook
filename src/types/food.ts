import type { Database } from './database'

export type Food = Database['public']['Tables']['foods']['Row']
export type FoodInsert = Database['public']['Tables']['foods']['Insert']
export type FoodUpdate = Database['public']['Tables']['foods']['Update']

export type FoodNutrients = Database['public']['Tables']['food_nutrients']['Row']
export type FoodNutrientsInsert = Database['public']['Tables']['food_nutrients']['Insert']

export type MatchStatus = Database['public']['Enums']['match_status']

export interface FoodWithNutrients extends Food {
  nutrients?: FoodNutrients
}

export interface FoodMatch {
  food: FoodWithNutrients
  confidence: number
  source: 'local' | 'usda' | 'openfoodfacts'
}

export interface FoodSearchResult {
  id: string
  name: string
  brand: string | null
  source: string
  externalId: string
  nutrients: {
    calories: number | null
    protein_g: number | null
    carbs_g: number | null
    fat_g: number | null
    fiber_g: number | null
    sugar_g: number | null
    sodium_mg: number | null
  }
}
