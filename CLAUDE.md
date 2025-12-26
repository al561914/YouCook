# RecipeVault - Project Guide

## Overview
RecipeVault is a digital recipe repository with nutritional tracking. Users can organize recipes in cookbooks, parse ingredients with AI, and match ingredients to USDA foods for nutrition data.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS v4
- **State**: Zustand (stores), React Hook Form (forms)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **APIs**: Claude API (recipe parsing), USDA FoodData Central (nutrition)

## Project Structure
```
src/
├── components/
│   ├── ui/           # Reusable UI primitives (button, input, card, dialog, sheet, collapsible, etc.)
│   ├── common/       # Shared components (LoadingSpinner, ErrorBoundary, ConfirmDialog)
│   ├── layout/       # Layout components (Header, Sidebar with cookbook navigation, MainLayout)
│   ├── cookbooks/    # Cookbook-specific components (CookbookCard, CookbookForm)
│   ├── recipes/      # Recipe components (RecipeForm, IngredientList, IngredientReviewModal,
│   │                 #   NutritionSummary, ImageUpload, ImageGallery, ServingAdjuster,
│   │                 #   HeroImage, StepsList)
│   ├── cook-mode/    # Cook Mode components (CookModeHeader, CookModeStep, CookModeNavigation,
│   │                 #   CookModeIngredientDrawer, CookModeIngredientSidebar, CookModeExitDialog)
│   ├── import/       # Import components (ImportModal, PDFImporter, PDFDropzone, PDFPageSelector,
│   │                 #   ImportPreview)
│   └── foods/        # Food search/matching components (FoodSearch)
├── pages/            # Route pages (Dashboard, RecipeView, RecipeNew, RecipeEdit, CookMode,
│                     #   CookbookView, CookbookList)
├── hooks/            # Custom React hooks (useCookbooks, useRecipes, useCookMode)
├── services/         # API/Supabase service functions (recipes, cookbooks, foods, media, parsing)
│   └── import/       # Import services (pdfExtractor for PDF processing with pdfjs-dist)
├── stores/           # Zustand stores (authStore, uiStore, cookModeStore)
├── types/            # TypeScript types and database types
└── lib/              # Utilities, constants, validators, formatQuantity for fractions

supabase/
├── functions/        # Edge Functions (Deno runtime)
│   ├── parse-recipe/        # AI recipe parsing with Claude 3.5 Haiku
│   ├── extract-pdf-recipe/  # PDF recipe extraction with Claude Vision (text + image OCR)
│   └── search-foods/        # USDA food search
└── migrations/       # Database migrations (001_initial_schema, 002_storage_bucket,
                      #   003_add_import_metadata)
```

## Key Patterns

### Services
Services handle all Supabase/API calls. Located in `src/services/`.
```typescript
// Example: src/services/recipes.ts
export async function getRecipe(id: string): Promise<RecipeWithRelations>
export async function createRecipe(data: RecipeInsert): Promise<Recipe>
```

### Hooks
Custom hooks wrap services with React state. Located in `src/hooks/`.
```typescript
// Example: src/hooks/useRecipes.ts
export function useRecipe(id: string) {
  // Returns { recipe, loading, error, refresh }
}
```

### Edge Functions
Supabase Edge Functions run on Deno. Use direct fetch for external APIs (not SDKs).
```typescript
// Use fetch, not SDK imports
const response = await fetch('https://api.anthropic.com/v1/messages', {...})
```

### Database Types
Types are auto-generated in `src/types/database.ts`. Derived types in other files:
```typescript
// src/types/recipe.ts
export type Recipe = Database['public']['Tables']['recipes']['Row']
export interface RecipeWithRelations extends Recipe {
  ingredients?: RecipeIngredient[]
  steps?: RecipeStep[]
}
```

### Components
- UI primitives in `components/ui/` - generic, reusable (shadcn/ui pattern with Radix primitives)
- Feature components export via index.ts barrel files
- Responsive design patterns: mobile (<1024px), desktop (≥1024px) using `lg:` breakpoint
- State management with Zustand for global state, React hooks for local state
- Form handling with React Hook Form

### Key Component Patterns

**Responsive Layouts:**
- RecipeView: Mobile tabs (Ingredients/Steps), Desktop side-by-side (1/3 left, 2/3 right)
- CookMode: Mobile floating drawer, Desktop fixed sidebar
- CookbookView: Responsive controls row (search/filters/sort/view-toggle)

**State Persistence:**
- cookModeStore uses Zustand persist with custom Set serialization
- localStorage for cook mode progress (current step, checked ingredients, serving multiplier)

**Modal Patterns:**
- Dialog for overlays (IngredientReviewModal, CookModeExitDialog)
- Sheet for mobile bottom drawers (CookModeIngredientDrawer)
- Collapsible for expandable sections (RecipeForm sections, Sidebar cookbooks)

**Data Fetching:**
- useCookbooks/useRecipes hooks wrap services
- Loading states with LoadingSpinner component
- Error states with error messages
- Empty states with helpful CTAs

## Database Schema

### Core Tables
- `cookbooks` - Recipe collections (user_id, name, description)
- `recipes` - Recipe data (cookbook_id, title, servings, difficulty, parsing_status, import_metadata)
- `recipe_ingredients` - Parsed ingredients (recipe_id, food_id, name, quantity, unit, match_status)
- `recipe_steps` - Parsed instructions (recipe_id, step_number, instruction)
- `recipe_media` - Photos/images (recipe_id, step_id, url, media_type, order_index)
- `recipe_nutrition` - Saved nutrition totals per recipe
- `foods` - USDA food cache (external_id, name, brand, source)
- `food_nutrients` - Nutrition data per food (calories, protein_g, carbs_g, fat_g, etc.)

### Import Metadata
- `recipes.import_metadata` - JSONB column tracking import source details
  - `method`: "pdf" | "photo" | "url" | "social"
  - `confidence`: "high" | "medium" | "low"
  - `filename`: Original file name
  - `extracted_at`: ISO timestamp
  - `warnings`: Array of extraction warnings

### Storage
- `recipe-media` bucket - Public bucket for recipe images, organized by user_id/recipe_id

### Key Enums
- `parsing_status`: pending, parsing, parsed, review_needed, failed
- `match_status`: matched, unmatched, user_confirmed, user_created
- `difficulty`: easy, medium, hard, expert

## Commands

```bash
# Development
npm run dev              # Start Vite dev server
npm run build            # TypeScript check + production build

# Supabase
npx supabase start       # Start local Supabase
npx supabase functions serve --env-file .env.local  # Run Edge Functions locally
npx supabase db reset    # Reset database with migrations

# Generate types
npx supabase gen types typescript --local > src/types/database.ts
```

## Environment Variables

### .env.local (frontend)
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=...
```

### Edge Functions (.env.local or supabase secrets)
```
ANTHROPIC_API_KEY=...
USDA_API_KEY=...
```

## Conventions

1. **File naming**: PascalCase for components, camelCase for utilities/services
2. **Exports**: Use barrel files (index.ts) for feature folders
3. **Types**: Prefer interfaces for objects, types for unions/primitives
4. **Imports**: Use `@/` path alias for src/ imports
5. **Error handling**: Services throw errors, hooks/components catch and display
6. **Forms**: React Hook Form with Zod validation schemas
7. **Responsive**: Mobile-first approach, use Tailwind `lg:` breakpoint (1024px) for desktop
8. **State persistence**: Use Zustand persist middleware for cross-session state (cook mode progress)
9. **Formatting**: Use formatQuantity() from lib/units.ts for displaying fractions (1.5 → "1 1/2")

## Current Features

### Core Functionality
- [x] User authentication (Supabase Auth)
- [x] Cookbook CRUD with recipe counts
- [x] Recipe creation with raw text input
- [x] Recipe editing with collapsible sections
- [x] AI recipe parsing (Claude 3.5 Haiku) - parses ingredients and instructions from raw text
- [x] Re-parse recipes - can re-run AI parsing with automatic ingredient review modal
- [x] **PDF Import** - Import recipes from PDF files
  - Drag-and-drop PDF upload (max 10MB, 10 pages)
  - Page selection with thumbnail preview
  - Dual extraction: text extraction for searchable PDFs, OCR for scanned PDFs
  - Claude Vision API integration for image-based extraction
  - Confidence scoring (high/medium/low)
  - Import preview before saving
  - Import metadata tracking (method, confidence, filename, warnings)
- [x] USDA food search - search FoodData Central API
- [x] Ingredient-to-food matching - link ingredients to USDA foods
- [x] Ingredient review modal - review AI-parsed ingredients with match suggestions
- [x] Nutrition calculation per serving - calculated from matched ingredients
- [x] Recipe media/images - upload, gallery with lightbox, thumbnails on recipe cards

### UI/UX Features (Completed)
- [x] **Recipe Detail Redesign** - Responsive layout optimized for cooking
  - Mobile: Two-tab layout (Ingredients/Steps) with hero image
  - Desktop: Side-by-side layout (photos/nutrition left, ingredients/steps right)
  - Serving adjuster with real-time ingredient recalculation
  - Checkable ingredients for tracking while cooking
  - Hero image display from recipe media

- [x] **Cook Mode** - Kitchen-optimized step-by-step navigation
  - Large text for easy reading while cooking
  - Step photos display
  - Progress bar with prev/next navigation
  - Mobile: Floating ingredient drawer (bottom sheet)
  - Desktop: Fixed sidebar (350px)
  - Progress persistence with localStorage
  - Ingredient checklist with serving multiplier

- [x] **Recipe Edit Improvements**
  - Collapsible sections (Ingredients, Instructions, Photos, Nutrition)
  - Photo upload/management section
  - Auto-calculated nutrition display
  - Re-parse button with automatic ingredient review
  - Review Ingredients button for manual review

- [x] **Ingredient Review Modal**
  - Status badges (✅ Matched, ⚠️ Needs Review, ❌ Not Found)
  - AI suggestion cards with confidence scores
  - Accept/reject matches with one click
  - Inline food search for manual matching
  - Progress tracking (can't close until all resolved)

- [x] **Recipe List/Cookbook View**
  - Grid/List view toggle
  - Search by title and description
  - Filter by difficulty level
  - Sort options (Recent, A-Z, Difficulty, Cook Time)
  - Enhanced recipe cards with thumbnails
  - Metadata display (difficulty, time, servings)
  - Empty states with helpful actions

- [x] **Cookbook Sidebar**
  - Collapsible cookbook list in main navigation
  - Recipe count badges per cookbook
  - Active cookbook highlighting (blue accent)
  - Quick action: "New Cookbook" button
  - Mobile-responsive with hamburger menu
  - Loading and empty states

### Pending Features

**Import Modes:**
- [ ] Photo/image import - capture recipe from photos with OCR
- [ ] URL import - scrape recipes from websites
- [ ] Social media import - extract recipes from social media posts

**Other Features:**
- [ ] Save/edit nutrition data - persist calculated nutrition to `recipe_nutrition` table
- [ ] Step photos - attach photos to individual instruction steps (column exists)
- [ ] Meal planning
- [ ] Global recipe search
- [ ] Cook Mode Phase 2: timers, swipe gestures, screen wake lock
