export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          display_name: string | null
          avatar_url: string | null
          preferred_unit_system: 'metric' | 'imperial'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          display_name?: string | null
          avatar_url?: string | null
          preferred_unit_system?: 'metric' | 'imperial'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          display_name?: string | null
          avatar_url?: string | null
          preferred_unit_system?: 'metric' | 'imperial'
          created_at?: string
          updated_at?: string
        }
      }
      cookbooks: {
        Row: {
          id: string
          user_id: string
          name: string
          description: string | null
          cover_image_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          description?: string | null
          cover_image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          description?: string | null
          cover_image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      foods: {
        Row: {
          id: string
          user_id: string | null
          name: string
          name_normalized: string
          brand: string | null
          source: string | null
          external_id: string | null
          serving_size: number | null
          serving_unit: string | null
          serving_description: string | null
          original_source: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string | null
          name: string
          name_normalized: string
          brand?: string | null
          source?: string | null
          external_id?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          serving_description?: string | null
          original_source?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string | null
          name?: string
          name_normalized?: string
          brand?: string | null
          source?: string | null
          external_id?: string | null
          serving_size?: number | null
          serving_unit?: string | null
          serving_description?: string | null
          original_source?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      food_nutrients: {
        Row: {
          id: string
          food_id: string
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          sugar_g: number | null
          sodium_mg: number | null
          cholesterol_mg: number | null
          saturated_fat_g: number | null
          trans_fat_g: number | null
          vitamin_a_iu: number | null
          vitamin_c_mg: number | null
          calcium_mg: number | null
          iron_mg: number | null
          potassium_mg: number | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          food_id: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          cholesterol_mg?: number | null
          saturated_fat_g?: number | null
          trans_fat_g?: number | null
          vitamin_a_iu?: number | null
          vitamin_c_mg?: number | null
          calcium_mg?: number | null
          iron_mg?: number | null
          potassium_mg?: number | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          food_id?: string
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          cholesterol_mg?: number | null
          saturated_fat_g?: number | null
          trans_fat_g?: number | null
          vitamin_a_iu?: number | null
          vitamin_c_mg?: number | null
          calcium_mg?: number | null
          iron_mg?: number | null
          potassium_mg?: number | null
          created_at?: string
          updated_at?: string
        }
      }
      recipes: {
        Row: {
          id: string
          cookbook_id: string
          user_id: string
          title: string
          description: string | null
          source_type: 'manual' | 'pdf' | 'image' | 'url' | 'social'
          source_url: string | null
          servings: number
          prep_time_minutes: number | null
          cook_time_minutes: number | null
          total_time_minutes: number | null
          difficulty: 'easy' | 'medium' | 'hard' | 'expert'
          raw_ingredients_text: string | null
          raw_procedure_text: string | null
          parsing_status: 'pending' | 'parsing' | 'parsed' | 'review_needed' | 'failed'
          parsing_error: string | null
          cover_image_url: string | null
          is_public: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          cookbook_id: string
          user_id: string
          title: string
          description?: string | null
          source_type?: 'manual' | 'pdf' | 'image' | 'url' | 'social'
          source_url?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          total_time_minutes?: number | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
          raw_ingredients_text?: string | null
          raw_procedure_text?: string | null
          parsing_status?: 'pending' | 'parsing' | 'parsed' | 'review_needed' | 'failed'
          parsing_error?: string | null
          cover_image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          cookbook_id?: string
          user_id?: string
          title?: string
          description?: string | null
          source_type?: 'manual' | 'pdf' | 'image' | 'url' | 'social'
          source_url?: string | null
          servings?: number
          prep_time_minutes?: number | null
          cook_time_minutes?: number | null
          total_time_minutes?: number | null
          difficulty?: 'easy' | 'medium' | 'hard' | 'expert'
          raw_ingredients_text?: string | null
          raw_procedure_text?: string | null
          parsing_status?: 'pending' | 'parsing' | 'parsed' | 'review_needed' | 'failed'
          parsing_error?: string | null
          cover_image_url?: string | null
          is_public?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      recipe_ingredients: {
        Row: {
          id: string
          recipe_id: string
          food_id: string | null
          order_index: number
          quantity: number | null
          unit: string | null
          name: string
          preparation: string | null
          original_text: string | null
          match_status: 'matched' | 'unmatched' | 'user_confirmed' | 'user_created'
          match_confidence: number | null
          match_candidates: Json
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          food_id?: string | null
          order_index?: number
          quantity?: number | null
          unit?: string | null
          name: string
          preparation?: string | null
          original_text?: string | null
          match_status?: 'matched' | 'unmatched' | 'user_confirmed' | 'user_created'
          match_confidence?: number | null
          match_candidates?: Json
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          food_id?: string | null
          order_index?: number
          quantity?: number | null
          unit?: string | null
          name?: string
          preparation?: string | null
          original_text?: string | null
          match_status?: 'matched' | 'unmatched' | 'user_confirmed' | 'user_created'
          match_confidence?: number | null
          match_candidates?: Json
          created_at?: string
          updated_at?: string
        }
      }
      recipe_steps: {
        Row: {
          id: string
          recipe_id: string
          step_number: number
          instruction: string
          duration_minutes: number | null
          duration_label: string | null
          temperature_f: number | null
          original_text: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          step_number: number
          instruction: string
          duration_minutes?: number | null
          duration_label?: string | null
          temperature_f?: number | null
          original_text?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          step_number?: number
          instruction?: string
          duration_minutes?: number | null
          duration_label?: string | null
          temperature_f?: number | null
          original_text?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      recipe_media: {
        Row: {
          id: string
          recipe_id: string
          step_id: string | null
          media_type: string
          url: string
          caption: string | null
          order_index: number
          created_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          step_id?: string | null
          media_type: string
          url: string
          caption?: string | null
          order_index?: number
          created_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          step_id?: string | null
          media_type?: string
          url?: string
          caption?: string | null
          order_index?: number
          created_at?: string
        }
      }
      recipe_nutrition: {
        Row: {
          id: string
          recipe_id: string
          per_serving: boolean
          calories: number | null
          protein_g: number | null
          carbs_g: number | null
          fat_g: number | null
          fiber_g: number | null
          sugar_g: number | null
          sodium_mg: number | null
          is_complete: boolean
          calculated_at: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          recipe_id: string
          per_serving?: boolean
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          is_complete?: boolean
          calculated_at?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          recipe_id?: string
          per_serving?: boolean
          calories?: number | null
          protein_g?: number | null
          carbs_g?: number | null
          fat_g?: number | null
          fiber_g?: number | null
          sugar_g?: number | null
          sodium_mg?: number | null
          is_complete?: boolean
          calculated_at?: string
          created_at?: string
          updated_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      calculate_recipe_nutrition: {
        Args: {
          recipe_uuid: string
        }
        Returns: undefined
      }
    }
    Enums: {
      source_type: 'manual' | 'pdf' | 'image' | 'url' | 'social'
      difficulty: 'easy' | 'medium' | 'hard' | 'expert'
      parsing_status: 'pending' | 'parsing' | 'parsed' | 'review_needed' | 'failed'
      match_status: 'matched' | 'unmatched' | 'user_confirmed' | 'user_created'
      unit_system: 'metric' | 'imperial'
    }
  }
}
