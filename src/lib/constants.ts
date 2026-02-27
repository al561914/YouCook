export const APP_NAME = import.meta.env.VITE_APP_NAME || 'RecipeVault'
export const APP_URL = import.meta.env.VITE_APP_URL || 'http://localhost:5173'

export const DIFFICULTY_LABELS = {
  easy: 'Easy',
  medium: 'Medium',
  hard: 'Hard',
  expert: 'Expert',
} as const

export const SOURCE_TYPE_LABELS = {
  manual: 'Manual Entry',
  pdf: 'PDF Import',
  image: 'Image/Photo',
  url: 'URL Import',
  social: 'Social Media',
} as const

export const PARSING_STATUS_LABELS = {
  pending: 'Pending',
  parsing: 'Parsing...',
  parsed: 'Parsed',
  review_needed: 'Review Needed',
  failed: 'Failed',
} as const

export const RECIPE_TAGS = [
  // Meal type
  'breakfast', 'lunch', 'dinner', 'snack', 'dessert',
  // Dish type
  'salad', 'soup', 'smoothie', 'bowl', 'pasta', 'rice', 'sandwich', 'stew', 'sauce', 'baked-goods',
  // Protein
  'chicken', 'beef', 'pork', 'fish', 'seafood', 'eggs',
  // Diet
  'vegetarian', 'vegan', 'gluten-free', 'dairy-free', 'low-carb', 'high-protein',
  // Style
  'quick', 'meal-prep', 'one-pot', 'slow-cooker', 'air-fryer', 'grilling',
] as const

export type RecipeTag = typeof RECIPE_TAGS[number]

export const MEAL_NAMES = [
  'Breakfast', 'AM Snack', 'Lunch', 'PM Snack', 'Dinner', 'Workout', 'Bedtime',
] as const
export type MealName = typeof MEAL_NAMES[number]

export const STANDARD_UNITS = [
  'cup',
  'tbsp',
  'tsp',
  'oz',
  'lb',
  'g',
  'kg',
  'ml',
  'L',
  'piece',
  'whole',
  'pinch',
  'dash',
  'to_taste',
] as const

export type StandardUnit = typeof STANDARD_UNITS[number]
