-- Add import_metadata column to recipes table
ALTER TABLE public.recipes
ADD COLUMN IF NOT EXISTS import_metadata JSONB DEFAULT NULL;

COMMENT ON COLUMN public.recipes.import_metadata IS
'Stores import source details: extraction_method, confidence, original_filename, etc.';

-- Example import_metadata structure:
-- {
--   "method": "pdf" | "photo" | "url" | "social",
--   "confidence": "high" | "medium" | "low",
--   "filename": "original_file.pdf",
--   "extracted_at": "2025-12-25T12:00:00Z",
--   "warnings": ["warning1", "warning2"]
-- }
