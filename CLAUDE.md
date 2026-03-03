# RecipeVault - Project Guide

## Overview
RecipeVault is a digital recipe repository with nutritional tracking. Users can organize recipes in cookbooks, parse ingredients with AI, and match ingredients to USDA foods for nutrition data.

## Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **Styling**: TailwindCSS v4
- **State**: Zustand (stores), React Hook Form (forms)
- **Backend**: Supabase (PostgreSQL, Auth, Edge Functions, Storage)
- **APIs**: Claude API (recipe parsing), USDA FoodData Central (nutrition), Open Food Facts (packaged foods)

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
│   │                 #   HeroImage, StepsList, TagBadge, TagEditor)
│   ├── cook-mode/    # Cook Mode components (CookModeHeader, CookModeStep, CookModeNavigation,
│   │                 #   CookModeIngredientDrawer, CookModeIngredientSidebar, CookModeExitDialog)
│   ├── import/       # Import components (ImportModal, PDFImporter, PDFDropzone, PDFPageSelector,
│   │                 #   PhotoImporter, PhotoDropzone, SocialImporter, SocialInput, ImportPreview)
│   └── foods/        # Food search/matching components (FoodSearch, BarcodeScanner, FoodCard,
│                     #   FoodList, CustomFoodForm)
├── pages/            # Route pages (Dashboard, RecipeView, RecipeNew, RecipeEdit, CookMode,
│                     #   CookbookView, CookbookList, FoodDatabase)
├── hooks/            # Custom React hooks (useCookbooks, useRecipes, useCookMode)
├── services/         # API/Supabase service functions (recipes, cookbooks, foods, media, parsing)
│   └── import/       # Import services (pdfExtractor, photoExtractor, socialExtractor)
├── stores/           # Zustand stores (authStore, uiStore, cookModeStore)
├── types/            # TypeScript types and database types
└── lib/              # Utilities, constants, validators, formatQuantity for fractions

supabase/
├── functions/        # Edge Functions (Deno runtime)
│   ├── _shared/             # Shared utilities (CORS headers)
│   ├── parse-recipe/        # AI recipe parsing with claude-haiku-4-5-20251001
│   ├── extract-pdf-recipe/  # PDF recipe extraction with Claude Vision (text + image OCR)
│   ├── extract-photo-recipe/ # Photo/image recipe extraction with Claude Vision OCR
│   ├── extract-social-recipe/ # Social media caption extraction (Instagram posts/reels)
│   └── search-foods/        # Food search (USDA FoodData Central + Open Food Facts in parallel)
└── migrations/       # Database migrations
    ├── 001_initial_schema.sql
    ├── 002_storage_bucket.sql
    ├── 003_add_import_metadata.sql
    ├── 004_add_original_source.sql
    ├── 005_add_serving_description.sql
    └── 006_add_recipe_tags.sql

scripts/              # Python bulk import scripts (run outside the app)
├── bulk_import.py        # Bulk import from Instagram CSV (classified by classify_instagram.py)
├── pdf_bulk_import.py    # Bulk import from a multi-recipe PDF (one recipe per page)
├── tiktok_classify.py    # Step 1: Parse TikTok JSON export and classify videos
└── tiktok_bulk_import.py # Step 2: Bulk import classified TikTok recipes
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

All Edge Functions use model `claude-haiku-4-5-20251001`.

### Food Search System
Food search uses a multi-source strategy with intelligent prioritization:

**Search Flow:**
1. Search local database first (user-created foods + cached API results)
2. If insufficient results, query USDA and Open Food Facts **in parallel**
3. Merge and deduplicate results
4. Sort by source quality and relevance

**Barcode Search:**
- Camera scanning with html5-qrcode library (mobile-friendly)
- Manual entry option: 8-13 digit barcode for exact product match
- Supports EAN-13, UPC-A, EAN-8, UPC-E, Code 128, Code 39 formats
- Direct API lookup via Open Food Facts for instant results
- Perfect for scanning packaged products

**Source Prioritization (highest to lowest):**
1. USDA Foundation Foods (most accurate, unprocessed foods)
2. USDA SR Legacy (standard reference, generic foods)
3. Open Food Facts (good for packaged/branded products)
4. USDA Branded Foods (manufacturer data, less standardized)

**API Details:**
- **USDA FoodData Central**: Requires API key, excellent for raw ingredients
- **Open Food Facts**: No API key needed, excellent for packaged products with barcodes

### Database Types
Types are auto-generated in `src/types/database.ts`. Derived types in other files:
```typescript
// src/types/recipe.ts
export type Recipe = Database['public']['Tables']['recipes']['Row']
export interface RecipeWithRelations extends Recipe {
  ingredients?: RecipeIngredient[]
  steps?: RecipeStep[]
  tags?: string[]
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
- `recipes` - Recipe data (cookbook_id, title, servings, difficulty, parsing_status, source_type, source_url, import_metadata, tags)
- `recipe_ingredients` - Parsed ingredients (recipe_id, food_id, name, quantity, unit, match_status)
- `recipe_steps` - Parsed instructions (recipe_id, step_number, instruction)
- `recipe_media` - Photos/images (recipe_id, step_id, url, media_type, order_index)
- `recipe_nutrition` - Saved nutrition totals per recipe
- `foods` - USDA food cache (external_id, name, brand, source)
- `food_nutrients` - Nutrition data per food (calories, protein_g, carbs_g, fat_g, etc.)

### Tags
- `recipes.tags` - TEXT[] array column with GIN index (migration 006)
- Predefined taxonomy in `src/lib/constants.ts` → `RECIPE_TAGS`
- Categories: meal type, dish type, protein, diet, cooking style
- Auto-generated by all import Edge Functions (social, PDF, photo)
- Editable via TagEditor component in RecipeForm
- Displayed as chips on RecipeView and recipe cards in CookbookView
- Tag filter dropdown in CookbookView

### Import Metadata
- `recipes.import_metadata` - JSONB column tracking import source details
  - `method`: "pdf" | "photo" | "url" | "social"
  - `platform`: "instagram" | "tiktok" (for social imports)
  - `confidence`: "high" | "medium" | "low"
  - `author`: Creator handle (social imports)
  - `filename`: Original file name (PDF/photo imports)
  - `page_number`: Page number (PDF bulk imports)
  - `extracted_at`: ISO timestamp
  - `warnings`: Array of extraction warnings
  - `bulk_import`: true (set by bulk import scripts)

### Deduplication
- `recipes.source_url` used to detect already-imported content
  - Instagram: `https://www.instagram.com/reel/...`
  - TikTok: canonical `https://www.tiktok.com/@user/video/...`
  - PDF pages: `pdf://filename.pdf#page=N`

### Storage
- `recipe-media` bucket - Public bucket for recipe images, organized by user_id/recipe_id

### Key Enums
- `parsing_status`: pending, parsing, parsed, review_needed, failed
- `source_type`: manual, pdf, image, url, social
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

# Bulk import scripts (run from scripts/ directory)
python bulk_import.py           # Instagram bulk import
python pdf_bulk_import.py       # PDF cookbook bulk import
python tiktok_classify.py       # TikTok: classify favorites from JSON export
python tiktok_bulk_import.py    # TikTok: import classified recipes
```

## Environment Variables

### .env.local (frontend)
```
VITE_SUPABASE_URL=http://127.0.0.1:54321
VITE_SUPABASE_ANON_KEY=...
```

### Edge Functions (.env.local or supabase secrets)
```
ANTHROPIC_API_KEY=...     # Required for recipe parsing
USDA_API_KEY=...          # Required for USDA FoodData Central
                          # Open Food Facts requires no API key
```

### Bulk import scripts (.env in scripts/)
```
SUPABASE_URL=...
SUPABASE_SERVICE_ROLE_KEY=...   # Service role key (bypasses RLS)
ANTHROPIC_API_KEY=...
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
10. **Tags on columns not in generated types**: Access via `(recipe as any).tags` pattern

## Current Features

### Core Functionality
- [x] User authentication (Supabase Auth)
- [x] Cookbook CRUD with recipe counts
- [x] Recipe creation with raw text input
- [x] Recipe editing with collapsible sections
- [x] AI recipe parsing (claude-haiku-4-5-20251001) - parses ingredients and instructions from raw text
- [x] Re-parse recipes - can re-run AI parsing with automatic ingredient review modal
- [x] **Recipe Tags** - classify and filter recipes by predefined taxonomy
  - Predefined tags: meal type, dish type, protein, diet, cooking style (30+ tags)
  - TagEditor component with toggle grid and filter input
  - TagBadge component for display with optional remove button
  - Auto-generated by all import methods (social, PDF, photo)
  - Filter by tag in CookbookView dropdown
  - Tags shown on recipe cards (grid: up to 3, list: up to 4) and RecipeView
- [x] **PDF Import** - Import recipes from PDF files
  - Drag-and-drop PDF upload (max 10MB, 10 pages)
  - Page selection with thumbnail preview (all pages selected by default)
  - Dual extraction: text extraction for searchable PDFs, OCR for scanned PDFs
  - Claude Vision API integration for image-based extraction
  - Confidence scoring (high/medium/low)
  - Import preview before saving
  - Import metadata tracking (method, confidence, filename, warnings)
  - Tags auto-generated during extraction
- [x] **Photo Import** - Import recipes from images with OCR
  - Drag-and-drop image upload (max 10MB)
  - Support for JPG, PNG, WebP, HEIC formats
  - Image preview before extraction
  - Claude Vision API OCR for handwritten or printed recipes
  - Confidence scoring with quality warnings
  - Tags auto-generated during extraction
- [x] **Instagram Import** - Import recipes from Instagram posts and reels
  - Paste URL to Instagram post or reel
  - Uses Instagram oembed API to fetch caption (no auth required)
  - Claude AI extracts recipe from caption text
  - **Language preservation** - recipes stay in original language (Spanish, French, etc.)
  - Filters hashtags, @mentions, and promotional content
  - **Automatic thumbnail download** - downloads and saves post image as recipe photo
  - Server-side download bypasses CORS restrictions
  - **Source attribution** - displays clickable Instagram link with author in recipe view
  - Stores source_url and import_metadata with platform/author info
  - Confidence scoring and extraction warnings
  - Preview before saving with thumbnail and source link
  - Tags auto-generated during extraction
- [x] **Food Database** - Search and manage foods for nutrition tracking
  - Dual-API search: USDA FoodData Central + Open Food Facts in parallel
  - Intelligent source prioritization (Foundation > SR Legacy > OFF > Branded)
  - Local database search with caching
  - Create custom foods with manual nutrition entry
  - Edit and delete user-created foods
  - Source badges (USDA, Open Food Facts, Custom)
  - **Camera barcode scanning** (mobile-friendly, uses html5-qrcode)
  - Manual barcode entry fallback option
- [x] Ingredient-to-food matching - link ingredients to foods from multiple sources
- [x] Ingredient review modal - review AI-parsed ingredients with match suggestions
- [x] Nutrition calculation per serving - calculated from matched ingredients
- [x] Recipe media/images - upload, gallery with lightbox, thumbnails on recipe cards

### Bulk Import Scripts (scripts/)
- [x] **Instagram bulk import** (`bulk_import.py`)
  - Reads classified CSV (from separate classify script)
  - Deduplication via source_url
  - Uploads thumbnails to Supabase Storage
  - Stores tags, import_metadata, source attribution
  - Resume support (START_FROM), progress checkpoints, results JSON
- [x] **PDF cookbook bulk import** (`pdf_bulk_import.py`)
  - One recipe per page assumption
  - pdfplumber for text extraction
  - Claude API called directly (not via Edge Function)
  - Skips non-recipe pages automatically
  - Deduplication via `pdf://filename.pdf#page=N` source_url
  - Resume support (START_FROM_PAGE)
- [x] **TikTok bulk import** (`tiktok_classify.py` + `tiktok_bulk_import.py`)
  - Reads TikTok data export JSON (`Likes and Favorites > Favorite Videos > FavoriteVideoList`)
  - Uses yt-dlp (`python -m yt_dlp`) for metadata — TikTok oembed API is unreliable
  - Classifies each video: RECIPE_IN_CAPTION / RECIPE_IN_VIDEO / NOT_A_RECIPE
  - RECIPE_IN_CAPTION: extracts from caption text via Claude
  - RECIPE_IN_VIDEO: extracts auto-subtitles via yt-dlp, then Claude
  - Deduplication via canonical TikTok source_url
  - Thumbnail download and storage

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
  - Collapsible sections (Ingredients, Instructions, Photos, Nutrition, Tags)
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
  - Filter by tag
  - Sort options (Recent, A-Z, Difficulty, Cook Time)
  - Enhanced recipe cards with thumbnails and tag chips
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
- [ ] URL import - scrape recipes from websites
- [ ] TikTok UI import - manual single-video import via UI (bulk script exists)
- [ ] TikTok RECIPE_IN_VIDEO - video subtitle extraction working, needs testing at scale

**Recipe Features:**
- [ ] Custom tags - allow users to type free-form tags in addition to predefined ones
- [ ] Save/edit nutrition data - persist calculated nutrition to `recipe_nutrition` table
- [ ] Step photos - attach photos to individual instruction steps (column exists)

**Other Features:**
- [ ] Meal planning
- [ ] Global recipe search
- [ ] Cook Mode Phase 2: timers, swipe gestures, screen wake lock
