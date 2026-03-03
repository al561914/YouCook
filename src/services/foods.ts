import { supabase } from './supabase'
import type { Food, FoodSearchResult, FoodWithNutrients } from '@/types/food'

interface SearchFoodsResponse {
  foods: FoodSearchResult[]
  totalHits: number
  source: 'local' | 'api' | 'combined'
}

/**
 * Search local foods database by name
 */
export async function searchLocalFoods(query: string, limit: number = 20): Promise<FoodSearchResult[]> {
  const words = query.toLowerCase().trim().split(/\s+/).filter(Boolean)
  if (words.length === 0) return []

  // Chain one .or() per word so all words must match (AND across words, OR across name/brand per word)
  let q = supabase
    .from('foods')
    .select(`*, food_nutrients (*)`)

  for (const word of words) {
    q = q.or(`name_normalized.ilike.%${word}%,brand.ilike.%${word}%`) as typeof q
  }

  const { data, error } = await q.order('name').limit(limit)

  if (error) throw error

  // Transform to FoodSearchResult format
  return (data as Array<Food & { food_nutrients: any[] }>).map((food) => {
    const nutrients = food.food_nutrients?.[0] || {}
    return {
      id: food.id,
      name: food.name,
      brand: food.brand,
      source: food.source as 'usda' | 'openfoodfacts' | 'user',
      externalId: food.external_id || '',
      servingSize: food.serving_size || null,
      servingUnit: food.serving_unit || null,
      servingDescription: food.serving_description || null,
      nutrients: {
        calories: nutrients.calories || null,
        protein_g: nutrients.protein_g || null,
        carbs_g: nutrients.carbs_g || null,
        fat_g: nutrients.fat_g || null,
        fiber_g: nutrients.fiber_g || null,
        sugar_g: nutrients.sugar_g || null,
        sodium_mg: nutrients.sodium_mg || null,
      },
    }
  })
}

/**
 * Search foods - local first, then API if needed
 */
export async function searchFoods(query: string, pageSize: number = 10): Promise<SearchFoodsResponse> {
  if (!query || query.trim().length < 2) {
    return { foods: [], totalHits: 0, source: 'local' }
  }

  // Search local database first
  const localResults = await searchLocalFoods(query, pageSize)

  // If we have enough local results, return them
  if (localResults.length >= pageSize) {
    return {
      foods: localResults.slice(0, pageSize),
      totalHits: localResults.length,
      source: 'local',
    }
  }

  // If not enough local results, search API
  const { data, error } = await supabase.functions.invoke('search-foods', {
    body: { query, pageSize },
  })

  if (error) {
    // If API fails but we have local results, return them
    if (localResults.length > 0) {
      return {
        foods: localResults,
        totalHits: localResults.length,
        source: 'local',
      }
    }
    throw new Error(error.message || 'Failed to search foods')
  }

  if (data.error) {
    if (localResults.length > 0) {
      return {
        foods: localResults,
        totalHits: localResults.length,
        source: 'local',
      }
    }
    throw new Error(data.error)
  }

  const apiResults = data.foods || []

  // Combine local and API results, removing duplicates
  const combined = [...localResults]
  const existingIds = new Set(localResults.map((f) => f.externalId))

  for (const apiFood of apiResults) {
    if (!existingIds.has(apiFood.externalId)) {
      combined.push(apiFood)
    }
  }

  return {
    foods: combined.slice(0, pageSize),
    totalHits: (data.totalHits || 0) + localResults.length,
    source: localResults.length > 0 && apiResults.length > 0 ? 'combined' : localResults.length > 0 ? 'local' : 'api',
  }
}

export async function saveFood(food: FoodSearchResult, userId?: string): Promise<Food> {
  // Check if food already exists
  const { data: existing } = await supabase
    .from('foods')
    .select('*')
    .eq('source', food.source)
    .eq('external_id', food.externalId)
    .single()

  if (existing) {
    const existingFood = existing as Food
    // If existing food has no user_id and we have one, update it
    if (!existingFood.user_id && userId) {
      const { data: updated, error: updateError } = await supabase
        .from('foods')
        .update({ user_id: userId } as never)
        .eq('id', existingFood.id)
        .select()
        .single()

      if (updateError) throw updateError
      return updated as Food
    }
    return existingFood
  }

  // Insert new food
  const { data: newFood, error: foodError } = await supabase
    .from('foods')
    .insert({
      user_id: userId || null,
      name: food.name,
      name_normalized: food.name.toLowerCase().trim(),
      brand: food.brand,
      source: food.source,
      external_id: food.externalId,
      serving_size: food.servingSize,
      serving_unit: food.servingUnit,
      serving_description: food.servingDescription,
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

export async function getFoodWithNutrients(foodId: string): Promise<FoodWithNutrients> {
  const { data, error } = await supabase
    .from('foods')
    .select(`
      *,
      food_nutrients (*)
    `)
    .eq('id', foodId)
    .single()

  if (error) throw error
  return data as FoodWithNutrients
}

/**
 * Get all user's custom foods (includes saved API foods)
 */
export async function getUserFoods(userId: string): Promise<FoodWithNutrients[]> {
  const { data, error } = await supabase
    .from('foods')
    .select(`
      *,
      food_nutrients (*)
    `)
    .eq('user_id', userId)
    .order('name')

  if (error) throw error
  return data as FoodWithNutrients[]
}

/**
 * Create a custom food with manual nutrition entry
 */
export async function createCustomFood(
  userId: string,
  foodData: {
    name: string
    brand?: string
    servingSize?: number
    servingUnit?: string
    servingDescription?: string
    nutrients: {
      calories?: number
      protein_g?: number
      carbs_g?: number
      fat_g?: number
      fiber_g?: number
      sugar_g?: number
      sodium_mg?: number
    }
  }
): Promise<FoodWithNutrients> {
  // Insert food
  const { data: newFood, error: foodError } = await supabase
    .from('foods')
    .insert({
      user_id: userId,
      name: foodData.name,
      name_normalized: foodData.name.toLowerCase().trim(),
      brand: foodData.brand || null,
      source: 'user',
      external_id: null,
      serving_size: foodData.servingSize || null,
      serving_unit: foodData.servingUnit || null,
      serving_description: foodData.servingDescription || null,
    } as never)
    .select()
    .single()

  if (foodError) throw foodError

  // Insert nutrients
  const { data: nutrients, error: nutrientError } = await supabase
    .from('food_nutrients')
    .insert({
      food_id: (newFood as Food).id,
      calories: foodData.nutrients.calories || null,
      protein_g: foodData.nutrients.protein_g || null,
      carbs_g: foodData.nutrients.carbs_g || null,
      fat_g: foodData.nutrients.fat_g || null,
      fiber_g: foodData.nutrients.fiber_g || null,
      sugar_g: foodData.nutrients.sugar_g || null,
      sodium_mg: foodData.nutrients.sodium_mg || null,
    } as never)
    .select()
    .single()

  if (nutrientError) throw nutrientError

  return {
    ...(newFood as Food),
    food_nutrients: [nutrients],
  } as FoodWithNutrients
}

/**
 * Update a custom food or convert an API food to custom
 */
export async function updateCustomFood(
  foodId: string,
  userId: string,
  foodData: {
    name?: string
    brand?: string
    servingSize?: number
    servingUnit?: string
    servingDescription?: string
    nutrients?: {
      calories?: number
      protein_g?: number
      carbs_g?: number
      fat_g?: number
      fiber_g?: number
      sugar_g?: number
      sodium_mg?: number
    }
  }
): Promise<FoodWithNutrients> {
  // First, get the current food to check if it's an API food
  const { data: currentFood, error: fetchError } = await supabase
    .from('foods')
    .select('source, original_source')
    .eq('id', foodId)
    .eq('user_id', userId)
    .single()

  if (fetchError) throw fetchError

  // Build update object
  const foodUpdate: any = {}
  if (foodData.name) {
    foodUpdate.name = foodData.name
    foodUpdate.name_normalized = foodData.name.toLowerCase().trim()
  }
  if (foodData.brand !== undefined) foodUpdate.brand = foodData.brand
  if (foodData.servingSize !== undefined) foodUpdate.serving_size = foodData.servingSize
  if (foodData.servingUnit !== undefined) foodUpdate.serving_unit = foodData.servingUnit
  if (foodData.servingDescription !== undefined) foodUpdate.serving_description = foodData.servingDescription || null

  // If this is an API food being edited for the first time, convert it to custom
  const food = currentFood as { source: string; original_source: string | null }
  if (food.source !== 'user' && !food.original_source) {
    foodUpdate.original_source = food.source // Preserve the API source
    foodUpdate.source = 'user' // Convert to custom food
  }

  if (Object.keys(foodUpdate).length > 0) {
    const { error: foodError } = await supabase
      .from('foods')
      .update(foodUpdate as never)
      .eq('id', foodId)
      .eq('user_id', userId)

    if (foodError) throw foodError
  }

  // Update nutrients if provided
  if (foodData.nutrients) {
    const { error: nutrientError } = await supabase
      .from('food_nutrients')
      .update(foodData.nutrients as never)
      .eq('food_id', foodId)

    if (nutrientError) throw nutrientError
  }

  // Return updated food
  return getFoodWithNutrients(foodId)
}

/**
 * Delete a user's food (custom foods or saved API foods)
 */
export async function deleteCustomFood(foodId: string, userId: string): Promise<void> {
  const { error } = await supabase
    .from('foods')
    .delete()
    .eq('id', foodId)
    .eq('user_id', userId)

  if (error) throw error
}
