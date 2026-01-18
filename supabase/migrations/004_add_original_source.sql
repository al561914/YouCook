-- Add original_source column to foods table to track API origin
-- This allows users to edit API foods while preserving their lineage

ALTER TABLE foods ADD COLUMN IF NOT EXISTS original_source TEXT;

COMMENT ON COLUMN foods.original_source IS 'Tracks the original API source if a user customizes an API food (e.g., usda, openfoodfacts). NULL for purely user-created foods.';
