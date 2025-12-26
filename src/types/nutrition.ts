export interface NutritionData {
  calories?: number
  protein_g?: number
  carbs_g?: number
  fat_g?: number
  fiber_g?: number
  sugar_g?: number
  sodium_mg?: number
  cholesterol_mg?: number
  saturated_fat_g?: number
  trans_fat_g?: number
  vitamin_a_iu?: number
  vitamin_c_mg?: number
  calcium_mg?: number
  iron_mg?: number
  potassium_mg?: number
}

export interface NutritionSummary {
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  fiber_g: number
  is_complete: boolean
  unmatched_count: number
}
