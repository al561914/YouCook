import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const ANTHROPIC_API_KEY = Deno.env.get('ANTHROPIC_API_KEY')

interface PDFPageImage {
  pageNumber: number
  imageBase64: string
  width: number
  height: number
}

interface ExtractionRequest {
  pages?: PDFPageImage[]
  textContent?: string
}

interface ExtractionResult {
  title: string
  description: string | null
  servings: number
  prep_time_minutes: number | null
  cook_time_minutes: number | null
  raw_ingredients_text: string
  raw_procedure_text: string
  extraction_confidence: 'high' | 'medium' | 'low'
  warnings: string[]
  tags: string[]
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { pages, textContent }: ExtractionRequest = await req.json()

    if (!ANTHROPIC_API_KEY) {
      throw new Error('ANTHROPIC_API_KEY not configured')
    }

    // Determine extraction strategy
    const useTextExtraction = textContent && textContent.length > 100
    const useVisionExtraction = pages && pages.length > 0

    if (!useTextExtraction && !useVisionExtraction) {
      throw new Error('No valid extraction source provided (need pages or textContent)')
    }

    let extractedRecipe: ExtractionResult

    if (useTextExtraction && textContent) {
      // Text-based extraction
      extractedRecipe = await extractFromText(textContent)
    } else if (useVisionExtraction && pages) {
      // Vision-based extraction from page images
      extractedRecipe = await extractFromImages(pages)
    } else {
      throw new Error('Unable to determine extraction method')
    }

    return new Response(JSON.stringify(extractedRecipe), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('PDF extraction error:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})

async function extractFromText(text: string): Promise<ExtractionResult> {
  const prompt = `You are analyzing text extracted from a PDF recipe document. Extract the recipe information and return it in the specified JSON format.

Text Content:
${text}

Extract and return:
1. title - recipe name
2. description - brief description (optional)
3. servings - number of servings (default to 4 if not specified)
4. prep_time_minutes - preparation time in minutes (null if not specified)
5. cook_time_minutes - cooking time in minutes (null if not specified)
6. raw_ingredients_text - all ingredients as a newline-separated list, preserving quantities and measurements
7. raw_procedure_text - all instructions, preserving step numbers and formatting
8. extraction_confidence - "high", "medium", or "low" based on clarity
9. warnings - array of any issues or ambiguities found
10. tags - classify using these options (pick 2-6 that apply):
    Meal type: breakfast, lunch, dinner, snack, dessert
    Dish type: salad, soup, smoothie, bowl, pasta, rice, sandwich, stew, sauce, baked-goods
    Protein: chicken, beef, pork, fish, seafood, eggs
    Diet: vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein
    Style: quick, meal-prep, one-pot, slow-cooker, air-fryer, grilling
    Only use tags from this list.

Return ONLY valid JSON matching this structure:
{
  "title": "Recipe Name",
  "description": "Brief description or null",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "raw_ingredients_text": "2 cups flour\\n1 tsp salt\\n...",
  "raw_procedure_text": "1. Step one\\n2. Step two\\n...",
  "extraction_confidence": "high",
  "warnings": [],
  "tags": ["dinner", "chicken"]
}

If no recipe is found, return:
{
  "title": "No Recipe Found",
  "description": null,
  "servings": 4,
  "prep_time_minutes": null,
  "cook_time_minutes": null,
  "raw_ingredients_text": "",
  "raw_procedure_text": "",
  "extraction_confidence": "low",
  "warnings": ["No recipe content detected in the provided text"],
  "tags": []
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: prompt,
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse JSON response
  try {
    const result = JSON.parse(content)
    if (!result.tags) result.tags = []
    return result
  } catch (e) {
    throw new Error('Failed to parse Claude response as JSON')
  }
}

async function extractFromImages(pages: PDFPageImage[]): Promise<ExtractionResult> {
  // Build content array with page images
  const imageContent = pages.map((page) => ({
    type: 'image',
    source: {
      type: 'base64',
      media_type: 'image/png',
      data: page.imageBase64,
    },
  }))

  const prompt = `You are analyzing images from a PDF recipe document. Extract the recipe information from the provided page images.

Look for:
- Recipe title
- Description
- Servings/yield
- Prep time and cook time
- Ingredients list (preserve quantities, units, and names)
- Cooking instructions (preserve step numbers)

Handle multi-column layouts and decorative formatting appropriately.

Return ONLY valid JSON matching this structure:
{
  "title": "Recipe Name",
  "description": "Brief description or null",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "raw_ingredients_text": "2 cups flour\\n1 tsp salt\\n...",
  "raw_procedure_text": "1. Step one\\n2. Step two\\n...",
  "extraction_confidence": "high",
  "warnings": [],
  "tags": ["dinner", "chicken"]
}

Confidence levels:
- "high" - Clear, complete recipe with all sections
- "medium" - Recipe found but some sections unclear or missing
- "low" - Unclear or incomplete recipe

Add warnings for any issues like:
- Missing sections
- Unclear measurements
- Poor image quality
- Multiple recipes on same page

For tags, classify using these options (pick 2-6 that apply):
Meal type: breakfast, lunch, dinner, snack, dessert
Dish type: salad, soup, smoothie, bowl, pasta, rice, sandwich, stew, sauce, baked-goods
Protein: chicken, beef, pork, fish, seafood, eggs
Diet: vegetarian, vegan, gluten-free, dairy-free, low-carb, high-protein
Style: quick, meal-prep, one-pot, slow-cooker, air-fryer, grilling
Only use tags from this list.

If no recipe is found, return:
{
  "title": "No Recipe Found",
  "description": null,
  "servings": 4,
  "prep_time_minutes": null,
  "cook_time_minutes": null,
  "raw_ingredients_text": "",
  "raw_procedure_text": "",
  "extraction_confidence": "low",
  "warnings": ["No recipe content detected in the images"],
  "tags": []
}`

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 2000,
      messages: [
        {
          role: 'user',
          content: [
            ...imageContent,
            {
              type: 'text',
              text: prompt,
            },
          ],
        },
      ],
    }),
  })

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const content = data.content[0].text

  // Parse JSON response
  try {
    const result = JSON.parse(content)
    if (!result.tags) result.tags = []
    return result
  } catch (e) {
    throw new Error('Failed to parse Claude response as JSON')
  }
}
