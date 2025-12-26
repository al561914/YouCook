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
  foodNutrients: Array<{
    nutrientId: number
    nutrientName: string
    value: number
    unitName: string
  }>
}

interface USDASearchResponse {
  foods: USDAFood[]
  totalHits: number
}

interface FoodResult {
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

    // Search USDA FoodData Central
    const searchUrl = 'https://api.nal.usda.gov/fdc/v1/foods/search'
    const response = await fetch(searchUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key': usdaApiKey,
      },
      body: JSON.stringify({
        query: query.trim(),
        pageSize,
        dataType: ['Foundation', 'SR Legacy', 'Branded'],
        sortBy: 'dataType.keyword',
        sortOrder: 'asc',
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('USDA API error:', errorText)
      return new Response(
        JSON.stringify({ error: `USDA API error: ${response.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const data: USDASearchResponse = await response.json()

    // Transform to our format
    const foods: FoodResult[] = data.foods.map((food) => {
      const nutrients = {
        calories: findNutrient(food.foodNutrients, NUTRIENT_IDS.CALORIES),
        protein_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.PROTEIN),
        carbs_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.CARBS),
        fat_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.FAT),
        fiber_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.FIBER),
        sugar_g: findNutrient(food.foodNutrients, NUTRIENT_IDS.SUGAR),
        sodium_mg: findNutrient(food.foodNutrients, NUTRIENT_IDS.SODIUM),
      }

      return {
        id: `usda-${food.fdcId}`,
        name: food.description,
        brand: food.brandName || null,
        source: 'usda',
        externalId: String(food.fdcId),
        nutrients,
      }
    })

    return new Response(
      JSON.stringify({
        foods,
        totalHits: data.totalHits,
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

function findNutrient(nutrients: USDAFood['foodNutrients'], nutrientId: number): number | null {
  const nutrient = nutrients.find((n) => n.nutrientId === nutrientId)
  return nutrient ? nutrient.value : null
}
