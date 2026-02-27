import { supabase } from './supabase'
import type {
  NutritionLogEntry,
  NutritionLogEntryInsert,
  NutritionTargets,
} from '@/types/nutritionLog'

export async function getLogEntries(
  userId: string,
  date: string
): Promise<NutritionLogEntry[]> {
  const { data, error } = await supabase
    .from('nutrition_log')
    .select('*')
    .eq('user_id', userId)
    .eq('date', date)
    .order('meal_name')
    .order('order_index')

  if (error) throw error
  return data as NutritionLogEntry[]
}

export async function createLogEntry(
  entry: NutritionLogEntryInsert
): Promise<NutritionLogEntry> {
  const { data, error } = await supabase
    .from('nutrition_log')
    .insert(entry as never)
    .select()
    .single()

  if (error) throw error
  return data as NutritionLogEntry
}

export async function updateLogEntry(
  id: string,
  updates: Partial<Pick<NutritionLogEntry, 'quantity' | 'unit' | 'calories' | 'protein_g' | 'carbs_g' | 'fat_g'>>
): Promise<NutritionLogEntry> {
  const { data, error } = await supabase
    .from('nutrition_log')
    .update(updates as never)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as NutritionLogEntry
}

export async function deleteLogEntry(id: string): Promise<void> {
  const { error } = await supabase
    .from('nutrition_log')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getTargets(userId: string): Promise<NutritionTargets | null> {
  const { data, error } = await supabase
    .from('user_nutrition_targets')
    .select('calorie_target, protein_g_target, carbs_g_target, fat_g_target')
    .eq('user_id', userId)
    .maybeSingle()

  if (error) throw error
  return data as NutritionTargets | null
}

export async function upsertTargets(
  userId: string,
  targets: NutritionTargets
): Promise<void> {
  const { error } = await supabase
    .from('user_nutrition_targets')
    .upsert(
      { user_id: userId, ...targets, updated_at: new Date().toISOString() } as never,
      { onConflict: 'user_id' }
    )

  if (error) throw error
}
