-- Add serving_description column to foods table
-- This stores the text description like "1 container", "1 cup", etc. from product labels

ALTER TABLE foods ADD COLUMN IF NOT EXISTS serving_description TEXT;

COMMENT ON COLUMN foods.serving_description IS 'Text description of serving size from product label (e.g., "1 container", "1 cup"). Used alongside serving_size/serving_unit to show "Per 1 container (150g)".';
