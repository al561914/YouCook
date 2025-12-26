import { z } from 'zod'

export const recipeFormSchema = z.object({
  title: z.string().min(1, 'Title is required').max(200, 'Title is too long'),
  description: z.string().max(1000, 'Description is too long').optional(),
  cookbookId: z.string().uuid('Please select a cookbook'),
  servings: z.coerce.number().int().min(1).max(100).default(4),
  prepTimeMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  cookTimeMinutes: z.coerce.number().int().min(0).max(1440).optional(),
  difficulty: z.enum(['easy', 'medium', 'hard', 'expert']).default('medium'),
  rawIngredientsText: z.string().min(1, 'Ingredients are required'),
  rawProcedureText: z.string().min(1, 'Instructions are required'),
})

export type RecipeFormData = z.infer<typeof recipeFormSchema>

export const cookbookFormSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  isPublic: z.boolean().default(false),
})

export type CookbookFormData = z.infer<typeof cookbookFormSchema>

export const customFoodSchema = z.object({
  name: z.string().min(1, 'Name is required').max(200, 'Name is too long'),
  brand: z.string().max(100).optional(),
  servingSize: z.coerce.number().positive('Serving size must be positive'),
  servingUnit: z.string().min(1, 'Serving unit is required'),
  calories: z.coerce.number().min(0).optional(),
  proteinG: z.coerce.number().min(0).optional(),
  carbsG: z.coerce.number().min(0).optional(),
  fatG: z.coerce.number().min(0).optional(),
  fiberG: z.coerce.number().min(0).optional(),
  sugarG: z.coerce.number().min(0).optional(),
  sodiumMg: z.coerce.number().min(0).optional(),
})

export type CustomFoodFormData = z.infer<typeof customFoodSchema>
