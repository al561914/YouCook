import { corsHeaders } from '../_shared/cors.ts'

interface PhotoImage {
  imageBase64: string
  width: number
  height: number
  mimeType: string
}

interface RequestBody {
  image: PhotoImage
  fileName: string
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
}

const SYSTEM_PROMPT = `You are a recipe extraction assistant. Extract recipe information from images.

IMPORTANT INSTRUCTIONS:
1. Extract the recipe title, description, ingredients, and instructions
2. Parse servings and times (prep time, cook time) if available
3. For ingredients: Extract each ingredient on a new line with quantity, unit, and name
4. For instructions: Extract step-by-step directions, numbered if possible
5. Assess extraction confidence:
   - HIGH: Clear, well-formatted recipe with all details visible
   - MEDIUM: Recipe readable but some details unclear or missing
   - LOW: Recipe partially visible, handwritten, or poor image quality
6. Note any warnings (e.g., "Image quality poor", "Ingredients partially visible", "Handwritten recipe")

Return ONLY valid JSON with this structure:
{
  "title": "Recipe Title",
  "description": "Brief description or null",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "raw_ingredients_text": "ingredient 1\\ningredient 2\\n...",
  "raw_procedure_text": "step 1\\nstep 2\\n...",
  "extraction_confidence": "high" | "medium" | "low",
  "warnings": ["warning1", "warning2"]
}`

async function extractFromImage(image: PhotoImage, fileName: string): Promise<ExtractionResult> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  // Call Claude Vision API
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': anthropicApiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-3-5-haiku-20241022',
      max_tokens: 4096,
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: {
                type: 'base64',
                media_type: image.mimeType,
                data: image.imageBase64,
              },
            },
            {
              type: 'text',
              text: 'Extract the recipe from this image following the instructions.',
            },
          ],
        },
      ],
      system: SYSTEM_PROMPT,
    }),
  })

  if (!response.ok) {
    const error = await response.text()
    console.error('Claude API error:', error)
    throw new Error(`Claude API error: ${response.statusText}`)
  }

  const data = await response.json()
  const textContent = data.content.find((c: any) => c.type === 'text')?.text

  if (!textContent) {
    throw new Error('No text content in Claude response')
  }

  // Parse JSON response
  try {
    const result = JSON.parse(textContent)

    // Validate required fields
    if (!result.title || !result.raw_ingredients_text || !result.raw_procedure_text) {
      throw new Error('Missing required recipe fields in extraction')
    }

    // Add default confidence if missing
    if (!result.extraction_confidence) {
      result.extraction_confidence = 'medium'
    }

    // Add default warnings array if missing
    if (!result.warnings) {
      result.warnings = []
    }

    // Add source info to warnings
    result.warnings.unshift(`Extracted from: ${fileName}`)

    return result
  } catch (parseError) {
    console.error('Failed to parse Claude response:', textContent)
    throw new Error('Failed to parse recipe extraction result')
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { image, fileName }: RequestBody = await req.json()

    if (!image || !image.imageBase64) {
      return new Response(
        JSON.stringify({ error: 'Missing image data' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Extracting recipe from photo: ${fileName}`)

    const result = await extractFromImage(image, fileName)

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in extract-photo-recipe:', error)
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
