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
