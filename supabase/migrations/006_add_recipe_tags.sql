-- Add tags array column to recipes table for recipe classification
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS tags TEXT[] DEFAULT '{}';

-- GIN index for efficient array containment queries (e.g. WHERE 'breakfast' = ANY(tags))
CREATE INDEX IF NOT EXISTS idx_recipes_tags ON public.recipes USING GIN(tags);

COMMENT ON COLUMN public.recipes.tags IS
'Array of classification tags (e.g. breakfast, soup, vegan, quick). Used for filtering and discovery.';
