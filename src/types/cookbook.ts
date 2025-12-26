import type { Database } from './database'
import type { Recipe } from './recipe'

export type Cookbook = Database['public']['Tables']['cookbooks']['Row']
export type CookbookInsert = Database['public']['Tables']['cookbooks']['Insert']
export type CookbookUpdate = Database['public']['Tables']['cookbooks']['Update']

export interface CookbookWithRecipes extends Cookbook {
  recipes?: Recipe[]
  recipe_count?: number
}
