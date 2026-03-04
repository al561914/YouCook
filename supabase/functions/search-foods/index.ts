import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface USDAFood {
  fdcId: number
  description: string
  dataType: string
  brandName?: string
  servingSize?: number
  servingSizeUnit?: string
  foodNutrients: Array<{
    nutrientId: number
    nutrientName: string
    value: number
    unitName: string
  }>
  labelNutrients?: {
    fat?: { value: number }
    saturatedFat?: { value: number }
    transFat?: { value: number }
    cholesterol?: { value: number }
    sodium?: { value: number }
    carbohydrates?: { value: number }
    fiber?: { value: number }
    sugars?: { value: number }
    protein?: { value: number }
    calcium?: { value: number }
    iron?: { value: number }
    potassium?: { value: number }
    calories?: { value: number }
  }
}

interface USDASearchResponse {
  foods: USDAFood[]
  totalHits: number
}

interface OFFProduct {
  product_name?: string
  brands?: string
  code: string
  serving_size?: string
  serving_quantity?: number
  serving_quantity_unit?: string
  nutriments?: {
    // Prefer per-serving values (match product labels)
    'energy-kcal_serving'?: number
    'proteins_serving'?: number
    'carbohydrates_serving'?: number
    'fat_serving'?: number
    'fiber_serving'?: number
    'sugars_serving'?: number
    'sodium_serving'?: number
    // Fallback to per-100g values
    'energy-kcal_100g'?: number
    'proteins_100g'?: number
    'carbohydrates_100g'?: number
    'fat_100g'?: number
    'fiber_100g'?: number
    'sugars_100g'?: number
    'sodium_100g'?: number
  }
}

interface OFFSearchResponse {
  products: OFFProduct[]
  count: number
  page_size: number
}

interface FoodResult {
  id: string
  name: string
  brand: string | null
  source: string
  externalId: string
  servingSize: number | null
  servingUnit: string | null
  servingDescription: string | null
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

// USDA nutrient IDs
const NUTRIENT_IDS = {
  CALORIES: 1008,
  PROTEIN: 1003,
  CARBS: 1005,
  FAT: 1004,
  FIBER: 1079,
  SUGAR: 2000,
  SODIUM: 1093,
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, pageSize = 10 } = await req.json()

    if (!query || query.trim().length < 2) {
      return new Response(
        JSON.stringify({ error: 'Query must be at least 2 characters' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const usdaApiKey = Deno.env.get('USDA_API_KEY')
    if (!usdaApiKey) {
      return new Response(
        JSON.stringify({ error: 'USDA API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Search both APIs in parallel
    const [usdaResults, offResults] = await Promise.allSettled([
      searchUSDA(query.trim(), pageSize, usdaApiKey),
      searchOpenFoodFacts(query.trim(), pageSize),
    ])

    // Collect results from both APIs
    const usdaFoods: FoodResult[] = usdaResults.status === 'fulfilled' ? usdaResults.value : []
    const offFoods: FoodResult[] = offResults.status === 'fulfilled' ? offResults.value : []

    // Log errors but don't fail if one API fails
    if (usdaResults.status === 'rejected') {
      console.error('USDA search failed:', usdaResults.reason)
    }
    if (offResults.status === 'rejected') {
      console.error('Open Food Facts search failed:', offResults.reason)
    }

    // If both failed, return error
    if (usdaFoods.length === 0 && offFoods.length === 0) {
      return new Response(
        JSON.stringify({ error: 'Both food APIs failed to return results' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Merge and sort results intelligently
    const allFoods = [...usdaFoods, ...offFoods]

    // Sort: Foundation Foods first, then SR Legacy, then Survey (FNDDS), then Open Food Facts
    // USDA Branded is excluded from text search — OFF handles packaged products
    const getScore = (food: FoodResult): number => {
      if (food.source === 'usda') {
        return food.externalId.startsWith('Foundation') ? 4 :
               food.externalId.startsWith('SR Legacy') ? 3 :
               food.externalId.startsWith('Survey') ? 2 : 1
      }
      return 2 // openfoodfacts — same tier as Survey (FNDDS)
    }

    const sortedFoods = allFoods.sort((a, b) => {
      const scoreDiff = getScore(b) - getScore(a)
      if (scoreDiff !== 0) return scoreDiff
      // Tie-break: shorter name = more generic (e.g. "Blueberries, raw" vs "Blueberries, raw, organic, brand X")
      return a.name.length - b.name.length
    })

    return new Response(
      JSON.stringify({
        foods: sortedFoods.slice(0, pageSize),
        totalHits: allFoods.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Search foods error:', error)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

async function searchUSDA(query: string, pageSize: number, apiKey: string): Promise<FoodResult[]> {
  const searchUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search'
  const response = await fetch(searchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Api-Key': apiKey,
    },
    body: JSON.stringify({
      query,
      pageSize: pageSize * 3, // Fetch more since Foundation/SR Legacy pool is smaller
      dataType: ['Foundation', 'SR Legacy', 'Survey (FNDDS)'],
    }),
  })

  if (!response.ok) {
    throw new Error(`USDA API error: ${response.status}`)
  }

  const data: USDASearchResponse = await response.json()

  return data.foods.map((food) => {
    // Check if label nutrients (per serving) are available (for Branded foods)
    // labelNutrients contain actual label values from manufacturer
    const hasLabelNutrients = food.labelNutrients && (
      food.labelNutrients.calories !== undefined ||
      food.labelNutrients.protein !== undefined ||
      food.labelNutrients.carbohydrates !== undefined
    )

    let servingSize = 100
    let servingUnit = 'g'
    let nutrients

    if (hasLabelNutrients && food.servingSize) {
      // Use label nutrients (actual label values) with product's serving size.
      // These are per-serving values — stored as-is. scaleNutrients() treats all
      // nutrients as per-serving (qty × nutrients), so no normalization needed.
      servingSize = food.servingSize
      servingUnit = food.servingSizeUnit || 'g'
      nutrients = {
        calories: food.labelNutrients!.calories?.value ?? null,
        protein_g: food.labelNutrients!.protein?.value ?? null,
        carbs_g: food.labelNutrients!.carbohydrates?.value ?? null,
        fat_g: food.labelNutrients!.fat?.value ?? null,
        fiber_g: food.labelNutrients!.fiber?.value ?? null,
        sugar_g: food.labelNutrients!.sugars?.value ?? null,
        sodium_mg: food.labelNutrients!.sodium?.value ?? null,
      }
    } else {
      // No labelNutrients: USDA's per-serving calculations are often wrong
      // Safest to use per-100g values with 100g serving
      // Users can edit if they have the actual label
      nutrients = {
        calories: findNutrient(food.foodNutrients, NUTRIENT_IDS.CALORIES),
        protein_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.PROTEIN),
        carbs_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.CARBS),
        fat_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.FAT),
        fiber_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.FIBER),
        sugar_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.SUGAR),
        sodium_mg: findNutrient(food.foodNutrients, NUTRIENT_IDS.SODIUM),
      }
    }

    return {
      id: `usda-${food.fdcId}`,
      name: food.description,
      brand: food.brandName || null,
      source: 'usda',
      externalId: `${food.dataType}-${food.fdcId}`,
      servingSize,
      servingUnit,
      servingDescription: null, // USDA doesn't provide serving descriptions
      nutrients,
    }
  })
}

async function searchOpenFoodFacts(query: string, pageSize: number): Promise<FoodResult[]> {
  // Check if query is a barcode (8-13 digits, common barcode formats)
  const isBarcode = /^\d{8,13}$/.test(query.trim())

  if (isBarcode) {
    // Direct barcode lookup
    const barcodeUrl = `https://world.openfoodfacts.org/api/v0/product/${query.trim()}.json`
    const response = await fetch(barcodeUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'RecipeVault/1.0',
      },
    })

    if (!response.ok) {
      // Barcode not found, return empty
      return []
    }

    const data = await response.json()

    if (data.status !== 1 || !data.product) {
      return []
    }

    const product = data.product
    const nutriments = product.nutriments || {}

    // Check if per-serving data is available
    const hasServingData = nutriments['energy-kcal_serving'] !== undefined ||
                           nutriments['proteins_serving'] !== undefined ||
                           nutriments['carbohydrates_serving'] !== undefined

    // Determine serving size based on data availability
    let servingSize = 100
    let servingUnit = 'g'

    if (hasServingData) {
      // Prefer serving_quantity (numeric) over parsing serving_size string
      if (product.serving_quantity && product.serving_quantity_unit) {
        servingSize = product.serving_quantity
        servingUnit = product.serving_quantity_unit
      } else if (product.serving_size) {
        // Fallback: parse serving_size string (e.g., "150g")
        const match = product.serving_size.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/)
        if (match) {
          servingSize = parseFloat(match[1])
          servingUnit = match[2]
        }
      }
    }
    // Otherwise keep default 100g to match _100g nutrition data

    return [{
      id: `off-${product.code || query}`,
      name: product.product_name || 'Unknown Product',
      brand: product.brands || null,
      source: 'openfoodfacts',
      externalId: product.code || query,
      servingSize,
      servingUnit,
      servingDescription: hasServingData ? (product.serving_size || null) : null,
      nutrients: {
        calories: nutriments['energy-kcal_serving'] ?? nutriments['energy-kcal_100g'] ?? null,
        protein_g: nutriments['proteins_serving'] ?? nutriments['proteins_100g'] ?? null,
        carbs_g: nutriments['carbohydrates_serving'] ?? nutriments['carbohydrates_100g'] ?? null,
        fat_g: nutriments['fat_serving'] ?? nutriments['fat_100g'] ?? null,
        fiber_g: nutriments['fiber_serving'] ?? nutriments['fiber_100g'] ?? null,
        sugar_g: nutriments['sugars_serving'] ?? nutriments['sugars_100g'] ?? null,
        sodium_mg: nutriments['sodium_serving'] != null ? nutriments['sodium_serving'] * 1000 :
                   nutriments['sodium_100g'] != null ? nutriments['sodium_100g'] * 1000 : null,
      },
    }]
  }

  // Text search for product names
  const searchUrl = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(query)}&page_size=${pageSize}&json=true&fields=product_name,brands,nutriments,code,serving_size,serving_quantity,serving_quantity_unit`

  const response = await fetch(searchUrl, {
    method: 'GET',
    headers: {
      'User-Agent': 'RecipeVault/1.0',
    },
  })

  if (!response.ok) {
    throw new Error(`Open Food Facts API error: ${response.status}`)
  }

  const data: OFFSearchResponse = await response.json()

  return data.products
    .filter((product) => product.product_name && product.code) // Filter out incomplete products
    .map((product) => {
      const nutriments = product.nutriments || {}

      // Check if per-serving data is available
      const hasServingData = nutriments['energy-kcal_serving'] !== undefined ||
                             nutriments['proteins_serving'] !== undefined ||
                             nutriments['carbohydrates_serving'] !== undefined

      // Determine serving size based on data availability
      let servingSize = 100 // Default to 100g
      let servingUnit = 'g'

      if (hasServingData) {
        // Prefer serving_quantity (numeric) over parsing serving_size string
        if (product.serving_quantity && product.serving_quantity_unit) {
          servingSize = product.serving_quantity
          servingUnit = product.serving_quantity_unit
        } else if (product.serving_size) {
          // Fallback: parse serving_size string (e.g., "150g")
          const match = product.serving_size.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)/)
          if (match) {
            servingSize = parseFloat(match[1])
            servingUnit = match[2]
          }
        }
      }
      // Otherwise keep default 100g to match _100g nutrition data

      return {
        id: `off-${product.code}`,
        name: product.product_name || 'Unknown Product',
        brand: product.brands || null,
        source: 'openfoodfacts',
        externalId: product.code,
        servingSize,
        servingUnit,
        servingDescription: hasServingData ? (product.serving_size || null) : null,
        nutrients: {
          calories: nutriments['energy-kcal_serving'] ?? nutriments['energy-kcal_100g'] ?? null,
          protein_g: nutriments['proteins_serving'] ?? nutriments['proteins_100g'] ?? null,
          carbs_g: nutriments['carbohydrates_serving'] ?? nutriments['carbohydrates_100g'] ?? null,
          fat_g: nutriments['fat_serving'] ?? nutriments['fat_100g'] ?? null,
          fiber_g: nutriments['fiber_serving'] ?? nutriments['fiber_100g'] ?? null,
          sugar_g: nutriments['sugars_serving'] ?? nutriments['sugars_100g'] ?? null,
          sodium_mg: nutriments['sodium_serving'] != null ? nutriments['sodium_serving'] * 1000 :
                     nutriments['sodium_100g'] != null ? nutriments['sodium_100g'] * 1000 : null,
        },
      }
    })
}

function findNutrient(nutrients: USDAFood['foodNutrients'], nutrientId: number): number | null {
  const nutrient = nutrients.find((n) => n.nutrientId === nutrientId)
  return nutrient ? nutrient.value : null
}
