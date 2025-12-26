import { supabase } from './supabase'
import type { Food, FoodSearchResult } from '@/types/food'

interface SearchFoodsResponse {
  foods: FoodSearchResult[]
  totalHits: number
}

export async function searchFoods(query: string, pageSize: number = 10): Promise<SearchFoodsResponse> {
  const { data, error } = await supabase.functions.invoke('search-foods', {
    body: { query, pageSize },
  })

  if (error) {
    throw new Error(error.message || 'Failed to search foods')
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data as SearchFoodsResponse
}

export async function saveFood(food: FoodSearchResult): Promise<Food> {
  // Check if food already exists
  const { data: existing } = await supabase
    .from('foods')
    .select('*')
    .eq('source', food.source)
    .eq('external_id', food.externalId)
    .single()

  if (existing) {
    return existing as Food
  }

  // Insert new food
  const { data: newFood, error: foodError } = await supabase
    .from('foods')
    .insert({
      name: food.name,
      name_normalized: food.name.toLowerCase().trim(),
      brand: food.brand,
      source: food.source,
      external_id: food.externalId,
    } as never)
    .select()
    .single()

  if (foodError) throw foodError

  // Insert nutrients
  const { error: nutrientError } = await supabase
    .from('food_nutrients')
    .insert({
      food_id: (newFood as Food).id,
      calories: food.nutrients.calories,
      protein_g: food.nutrients.protein_g,
      carbs_g: food.nutrients.carbs_g,
      fat_g: food.nutrients.fat_g,
      fiber_g: food.nutrients.fiber_g,
      sugar_g: food.nutrients.sugar_g,
      sodium_mg: food.nutrients.sodium_mg,
    } as never)

  if (nutrientError) {
    console.error('Failed to insert nutrients:', nutrientError)
  }

  return newFood as Food
}

export async function matchIngredientToFood(
  ingredientId: string,
  food: FoodSearchResult
): Promise<void> {
  // Save the food first
  const savedFood = await saveFood(food)

  // Update the ingredient
  const { error } = await supabase
    .from('recipe_ingredients')
    .update({
      food_id: savedFood.id,
      match_status: 'user_confirmed',
      match_confidence: 1.0,
    } as never)
    .eq('id', ingredientId)

  if (error) throw error
}

export async function unmatchIngredient(ingredientId: string): Promise<void> {
  const { error } = await supabase
    .from('recipe_ingredients')
    .update({
      food_id: null,
      match_status: 'unmatched',
      match_confidence: null,
    } as never)
    .eq('id', ingredientId)

  if (error) throw error
}

export async function getFoodWithNutrients(foodId: string) {
  const { data, error } = await supabase
    .from('foods')
    .select(`
      *,
      food_nutrients (*)
    `)
    .eq('id', foodId)
    .single()

  if (error) throw error
  return data
}
