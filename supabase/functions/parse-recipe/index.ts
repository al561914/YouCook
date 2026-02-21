import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface ParsedIngredient {
  name: string
  quantity: number | string | null
  unit: string | null
  preparation: string | null
  order_index: number
}

interface ParsedStep {
  step_number: number
  instruction: string
  duration_minutes: number | null
}

interface ParseResult {
  ingredients: ParsedIngredient[]
  steps: ParsedStep[]
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { recipeId } = await req.json()

    if (!recipeId) {
      return new Response(
        JSON.stringify({ error: 'recipeId is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get auth header for Supabase client
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: 'Authorization header required' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Initialize Supabase client with user's auth
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    )

    // Fetch the recipe
    const { data: recipe, error: fetchError } = await supabase
      .from('recipes')
      .select('id, raw_ingredients_text, raw_procedure_text, parsing_status')
      .eq('id', recipeId)
      .single()

    if (fetchError || !recipe) {
      return new Response(
        JSON.stringify({ error: 'Recipe not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Check if there's text to parse
    if (!recipe.raw_ingredients_text && !recipe.raw_procedure_text) {
      return new Response(
        JSON.stringify({ error: 'No raw text to parse' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Update status to parsing
    await supabase
      .from('recipes')
      .update({ parsing_status: 'parsing', parsing_error: null })
      .eq('id', recipeId)

    // Initialize Anthropic client
    const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
    if (!anthropicApiKey) {
      await supabase
        .from('recipes')
        .update({ parsing_status: 'failed', parsing_error: 'API key not configured' })
        .eq('id', recipeId)

      return new Response(
        JSON.stringify({ error: 'Anthropic API key not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Build the prompt
    const prompt = buildParsingPrompt(recipe.raw_ingredients_text, recipe.raw_procedure_text)

    // Call Claude API directly via fetch
    const anthropicResponse = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': anthropicApiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 4096,
        messages: [{ role: 'user', content: prompt }],
      }),
    })

    if (!anthropicResponse.ok) {
      const errorText = await anthropicResponse.text()
      console.error('Anthropic API error:', errorText)
      await supabase
        .from('recipes')
        .update({ parsing_status: 'failed', parsing_error: `API error: ${anthropicResponse.status}` })
        .eq('id', recipeId)

      return new Response(
        JSON.stringify({ error: `Anthropic API error: ${anthropicResponse.status}` }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    const message = await anthropicResponse.json()

    // Extract JSON from response
    const responseText = message.content?.[0]?.type === 'text' ? message.content[0].text : ''
    const parseResult = extractJsonFromResponse(responseText)

    if (!parseResult) {
      await supabase
        .from('recipes')
        .update({ parsing_status: 'failed', parsing_error: 'Failed to parse AI response' })
        .eq('id', recipeId)

      return new Response(
        JSON.stringify({ error: 'Failed to parse AI response' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Delete existing ingredients and steps
    await supabase.from('recipe_ingredients').delete().eq('recipe_id', recipeId)
    await supabase.from('recipe_steps').delete().eq('recipe_id', recipeId)

    // Insert parsed ingredients
    if (parseResult.ingredients.length > 0) {
      const ingredientsToInsert = parseResult.ingredients.map((ing) => ({
        recipe_id: recipeId,
        name: ing.name,
        quantity: parseQuantity(ing.quantity),
        unit: ing.unit,
        preparation: ing.preparation,
        order_index: ing.order_index,
      }))

      const { error: ingError } = await supabase
        .from('recipe_ingredients')
        .insert(ingredientsToInsert)

      if (ingError) {
        console.error('Error inserting ingredients:', ingError)
      }
    }

    // Insert parsed steps
    if (parseResult.steps.length > 0) {
      const stepsToInsert = parseResult.steps.map((step) => ({
        recipe_id: recipeId,
        step_number: step.step_number,
        instruction: step.instruction,
        duration_minutes: step.duration_minutes,
      }))

      const { error: stepError } = await supabase
        .from('recipe_steps')
        .insert(stepsToInsert)

      if (stepError) {
        console.error('Error inserting steps:', stepError)
      }
    }

    // Update recipe status to parsed
    await supabase
      .from('recipes')
      .update({ parsing_status: 'parsed', parsing_error: null })
      .eq('id', recipeId)

    return new Response(
      JSON.stringify({
        success: true,
        ingredientsCount: parseResult.ingredients.length,
        stepsCount: parseResult.steps.length,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Parse recipe error:', error)
    console.error('Error stack:', error.stack)
    return new Response(
      JSON.stringify({ error: error.message || 'Internal server error', stack: error.stack }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})

function buildParsingPrompt(rawIngredients: string | null, rawProcedure: string | null): string {
  return `You are a recipe parsing assistant. Parse the following recipe text into structured JSON format.

${rawIngredients ? `INGREDIENTS TEXT:
${rawIngredients}` : 'No ingredients provided.'}

${rawProcedure ? `INSTRUCTIONS TEXT:
${rawProcedure}` : 'No instructions provided.'}

Parse this into the following JSON structure. Be precise and extract all information:

{
  "ingredients": [
    {
      "name": "ingredient name (e.g., 'all-purpose flour', 'butter')",
      "quantity": 2.5,
      "unit": "unit of measurement or null (e.g., 'cups', 'tbsp', 'oz', 'lb')",
      "preparation": "preparation method or null (e.g., 'diced', 'melted', 'softened')",
      "order_index": 0
    }
  ],
  "steps": [
    {
      "step_number": 1,
      "instruction": "Clear instruction text for this step",
      "duration_minutes": null or number if mentioned
    }
  ]
}

Important parsing rules:
1. Split compound ingredients (e.g., "salt and pepper" becomes two entries)
2. Extract preparation from the ingredient name (e.g., "1 cup butter, melted" -> name: "butter", preparation: "melted")
3. Normalize units (e.g., "tablespoon" -> "tbsp", "teaspoon" -> "tsp")
4. IMPORTANT: quantity must be a decimal NUMBER or null, never a string. Convert fractions to decimals:
   - "1/2" -> 0.5
   - "1/4" -> 0.25
   - "3/4" -> 0.75
   - "1/3" -> 0.33
   - "2/3" -> 0.67
   - "2 1/2" -> 2.5
   - "1 1/4" -> 1.25
5. If no quantity is specified, set quantity to null
6. Number steps sequentially starting from 1
7. Extract timing from instructions if mentioned (e.g., "bake for 30 minutes")
8. Keep each step focused on one main action when possible

Respond ONLY with the JSON object, no other text.`
}

function extractJsonFromResponse(text: string): ParseResult | null {
  try {
    // Try to parse the entire response as JSON first
    return JSON.parse(text) as ParseResult
  } catch {
    // Try to find JSON in the response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]) as ParseResult
      } catch {
        return null
      }
    }
    return null
  }
}

// Convert fraction strings to decimal numbers
function parseQuantity(quantity: number | string | null): number | null {
  if (quantity === null || quantity === undefined) return null
  if (typeof quantity === 'number') return quantity

  const str = String(quantity).trim()
  if (!str) return null

  // Handle mixed fractions like "2 1/2"
  const mixedMatch = str.match(/^(\d+)\s+(\d+)\/(\d+)$/)
  if (mixedMatch) {
    const whole = parseInt(mixedMatch[1], 10)
    const num = parseInt(mixedMatch[2], 10)
    const denom = parseInt(mixedMatch[3], 10)
    return whole + (num / denom)
  }

  // Handle simple fractions like "1/2"
  const fractionMatch = str.match(/^(\d+)\/(\d+)$/)
  if (fractionMatch) {
    const num = parseInt(fractionMatch[1], 10)
    const denom = parseInt(fractionMatch[2], 10)
    return num / denom
  }

  // Try parsing as a regular number
  const parsed = parseFloat(str)
  return isNaN(parsed) ? null : parsed
}
