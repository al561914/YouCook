import { corsHeaders } from '../_shared/cors.ts'

interface RequestBody {
  url: string
  platform: 'instagram'
}

interface InstagramOembedResponse {
  title: string           // Caption (contains recipe)
  author_name: string     // Creator handle
  author_url: string      // Creator profile
  thumbnail_url: string   // Post image
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
  author: string
  thumbnail_url: string | null
  thumbnail_base64: string | null
  thumbnail_mime_type: string | null
}

/**
 * Fetches Instagram oembed data for a post/reel URL
 * Done server-side to avoid CORS issues
 */
async function fetchInstagramOembed(url: string): Promise<InstagramOembedResponse> {
  const oembedUrl = `https://www.instagram.com/api/v1/oembed/?url=${encodeURIComponent(url)}&format=json`

  const response = await fetch(oembedUrl)

  if (!response.ok) {
    if (response.status === 404) {
      throw new Error('Post not found. Make sure the post is public and the URL is correct.')
    }
    if (response.status === 400) {
      throw new Error('Invalid Instagram URL. Please check the URL and try again.')
    }
    throw new Error(`Failed to fetch Instagram data: ${response.statusText}`)
  }

  const data = await response.json()

  if (!data.title) {
    throw new Error('No caption found for this post. The post may be empty or unavailable.')
  }

  return data
}

/**
 * Downloads an image and converts it to base64
 * Done server-side to avoid CORS issues with Instagram CDN
 */
async function downloadThumbnail(thumbnailUrl: string): Promise<{ base64: string; mimeType: string } | null> {
  try {
    console.log('Downloading thumbnail from:', thumbnailUrl)

    const response = await fetch(thumbnailUrl)

    if (!response.ok) {
      console.error('Failed to download thumbnail:', response.statusText)
      return null
    }

    const contentType = response.headers.get('content-type') || 'image/jpeg'
    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)

    // Convert to base64
    let binary = ''
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i])
    }
    const base64 = btoa(binary)

    console.log('Successfully downloaded thumbnail, size:', bytes.length, 'bytes')

    return {
      base64,
      mimeType: contentType,
    }
  } catch (error) {
    console.error('Error downloading thumbnail:', error)
    return null
  }
}

function buildSystemPrompt(platform: string, author: string): string {
  return `You are a recipe extraction assistant. Extract recipe information from social media captions.

The caption is from ${platform} by @${author}.

IMPORTANT INSTRUCTIONS:
1. PRESERVE THE ORIGINAL LANGUAGE - Do NOT translate. If the recipe is in Spanish, French, or any other language, keep it in that language. Only extract and structure the content.

2. Social media recipe captions typically contain:
   - Ingredient lists (sometimes with emoji bullets like - or numbers)
   - Cooking instructions (numbered, bulleted, or prose)
   - Servings and timing info
   - Nutritional information (optional)

3. Extract:
   - Recipe title (create a descriptive one if not explicitly stated, in the same language as the recipe)
   - Brief description (in the same language as the recipe)
   - Servings (default to 4 if not specified)
   - Prep time and cook time in minutes (null if not specified)
   - Ingredients: each on a new line with quantity, unit, and name
   - Instructions: step-by-step, numbered, each on a new line

4. IGNORE and filter out:
   - Hashtags (#recipe #healthy #food etc.)
   - @mentions and promotional content
   - Comments about the post itself ("Link in bio", "Save this!", etc.)
   - Decorative emojis (keep measurement-related ones)
   - Calls to action ("Follow for more", "Double tap", etc.)

5. Assess extraction confidence:
   - HIGH: Clear recipe with complete ingredients and instructions
   - MEDIUM: Recipe present but some details unclear or minimal
   - LOW: Partial recipe, missing ingredients or instructions

6. Add warnings for any issues:
   - "Incomplete ingredient list" if ingredients seem partial
   - "Instructions may be abbreviated" if steps are brief
   - "Measurements not specified" if quantities are missing

Return ONLY valid JSON with this structure:
{
  "title": "Recipe Title",
  "description": "Brief description or null",
  "servings": 4,
  "prep_time_minutes": 15,
  "cook_time_minutes": 30,
  "raw_ingredients_text": "1 cup flour\\n2 eggs\\n...",
  "raw_procedure_text": "1. First step\\n2. Second step\\n...",
  "extraction_confidence": "high",
  "warnings": []
}`
}

async function extractFromCaption(
  caption: string,
  platform: string,
  author: string
): Promise<ExtractionResult> {
  const anthropicApiKey = Deno.env.get('ANTHROPIC_API_KEY')
  if (!anthropicApiKey) {
    throw new Error('ANTHROPIC_API_KEY not configured')
  }

  const systemPrompt = buildSystemPrompt(platform, author)

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
          content: `Extract the recipe from this social media caption:\n\n${caption}`,
        },
      ],
      system: systemPrompt,
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

  console.log('Claude response text:', textContent)

  // Parse JSON response - handle potential markdown code blocks
  let jsonText = textContent.trim()
  if (jsonText.startsWith('```json')) {
    jsonText = jsonText.slice(7)
  } else if (jsonText.startsWith('```')) {
    jsonText = jsonText.slice(3)
  }
  if (jsonText.endsWith('```')) {
    jsonText = jsonText.slice(0, -3)
  }
  jsonText = jsonText.trim()

  console.log('Cleaned JSON text:', jsonText)

  try {
    const result = JSON.parse(jsonText)

    // Validate required fields
    if (!result.title || !result.raw_ingredients_text || !result.raw_procedure_text) {
      console.error('Missing required fields. Result:', JSON.stringify(result))
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
    result.warnings.unshift(`Imported from ${platform} (@${author})`)

    return result
  } catch (parseError) {
    console.error('Failed to parse Claude response. Error:', parseError)
    console.error('JSON text that failed to parse:', jsonText)
    throw new Error(`Failed to parse recipe extraction result: ${parseError instanceof Error ? parseError.message : 'Unknown error'}`)
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { url, platform }: RequestBody = await req.json()

    if (!url) {
      return new Response(
        JSON.stringify({ error: 'Missing URL' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    if (!platform) {
      return new Response(
        JSON.stringify({ error: 'Missing platform' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Fetching oembed data for ${platform} URL: ${url}`)

    // Fetch oembed data server-side (avoids CORS)
    let oembedData: InstagramOembedResponse
    if (platform === 'instagram') {
      oembedData = await fetchInstagramOembed(url)
      console.log('Instagram oembed response:', JSON.stringify(oembedData))
    } else {
      return new Response(
        JSON.stringify({ error: 'Unsupported platform' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      )
    }

    console.log(`Extracting recipe from ${platform} by @${oembedData.author_name}`)

    const result = await extractFromCaption(oembedData.title, platform, oembedData.author_name)

    // Add author and thumbnail to result
    result.author = oembedData.author_name
    result.thumbnail_url = oembedData.thumbnail_url || null

    // Download thumbnail if available (server-side to avoid CORS)
    if (oembedData.thumbnail_url) {
      const thumbnail = await downloadThumbnail(oembedData.thumbnail_url)
      if (thumbnail) {
        result.thumbnail_base64 = thumbnail.base64
        result.thumbnail_mime_type = thumbnail.mimeType
      } else {
        result.thumbnail_base64 = null
        result.thumbnail_mime_type = null
      }
    } else {
      result.thumbnail_base64 = null
      result.thumbnail_mime_type = null
    }

    return new Response(JSON.stringify(result), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (error) {
    console.error('Error in extract-social-recipe:', error)
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
