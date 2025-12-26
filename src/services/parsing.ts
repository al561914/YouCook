import { supabase } from './supabase'

interface ParseResult {
  success: boolean
  ingredientsCount: number
  stepsCount: number
}

export async function parseRecipe(recipeId: string): Promise<ParseResult> {
  const { data, error } = await supabase.functions.invoke('parse-recipe', {
    body: { recipeId },
  })

  if (error) {
    throw new Error(error.message || 'Failed to parse recipe')
  }

  if (data.error) {
    throw new Error(data.error)
  }

  return data as ParseResult
}

export async function getParsingStatus(recipeId: string): Promise<{
  status: string
  error: string | null
}> {
  const { data, error } = await supabase
    .from('recipes')
    .select('parsing_status, parsing_error')
    .eq('id', recipeId)
    .single()

  if (error) throw error

  const result = data as { parsing_status: string; parsing_error: string | null }

  return {
    status: result.parsing_status,
    error: result.parsing_error,
  }
}
