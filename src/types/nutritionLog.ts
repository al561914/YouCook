export interface NutritionLogEntry {
  id: string
  user_id: string
  date: string
  meal_name: string
  food_id: string | null
  display_name: string
  quantity: number
  unit: string
  calories: number | null
  protein_g: number | null
  carbs_g: number | null
  fat_g: number | null
  order_index: number
  created_at: string
}

export interface NutritionLogEntryInsert {
  user_id: string
  date: string
  meal_name: string
  food_id?: string | null
  display_name: string
  quantity: number
  unit: string
  calories?: number | null
  protein_g?: number | null
  carbs_g?: number | null
  fat_g?: number | null
  order_index?: number
}

export interface NutritionTargets {
  calorie_target: number | null
  protein_g_target: number | null
  carbs_g_target: number | null
  fat_g_target: number | null
}

export interface DailyMacroSummary {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
}
