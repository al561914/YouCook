# Instagram Recipe Import Scripts

Scripts for extracting and classifying recipes from Instagram saved collections.

## Prerequisites

```bash
pip install anthropic requests python-dotenv supabase
```

## Setup

1. **Create a `.env` file** with your API key:
   ```bash
   # Copy the example file
   cp .env.example .env

   # Or on Windows:
   copy .env.example .env
   ```

2. **Edit `.env`** and add your actual Anthropic API key:
   ```
   ANTHROPIC_API_KEY=sk-ant-your-actual-key-here
   ```

3. **Never commit `.env`** - it's already in `.gitignore`

## Step 1: Extract URLs from Instagram Data Export

If you have a Meta data export with `saved_collections.json`:

```bash
python extract_nutrition.py
```

**Input:** `saved_collections.json` (from Meta data export)
**Output:** `nutrition_collection.csv`

This extracts all URLs from your "Nutrition" collection.

## Step 2: Classify Recipes

Test classification on a sample first:

```bash
python classify_sample.py
```

**Configuration:**
- API key is loaded from `.env` file (see Setup above)
- Adjust `SAMPLE_SIZE` in the script if needed (default: 60)

**Input:** `nutrition_collection.csv`
**Output:**
- `nutrition_sample_classified.csv` - Data with classifications
- `nutrition_sample_review.html` - Visual review page

**Open the HTML file in your browser** to review classifications with thumbnails!

## Classification Categories

- **COMPLETE_RECIPE** - Has ingredients AND instructions (ready to import)
- **PARTIAL_RECIPE** - Has ingredients but instructions in video (needs review)
- **MEAL_SUGGESTION** - Just food photos, no recipe (skip)
- **NOT_FOOD** - Fitness/motivation content (skip)
- **UNCLEAR** - Cannot determine (needs manual review)
- **URL_ERROR** - Post deleted/private (skip)

## Step 3: Bulk Import Complete Recipes

Once you've classified all recipes and reviewed the results, automate the import:

### Setup for Bulk Import

1. **Add Supabase credentials to `.env`:**
   ```
   SUPABASE_URL=https://your-project.supabase.co
   SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
   ```

   ⚠️ **Find your service role key:** Supabase Dashboard → Settings → API → `service_role` key

2. **Get your User ID and Cookbook ID:**
   ```sql
   -- In Supabase SQL Editor:
   SELECT id, email FROM auth.users;  -- Get your user_id
   SELECT id, name FROM cookbooks WHERE user_id = 'your-user-id';  -- Get cookbook_id
   ```

3. **Edit `bulk_import.py`** (lines 255-256):
   ```python
   USER_ID = 'your-actual-user-id'
   COOKBOOK_ID = 'your-actual-cookbook-id'
   ```

### Run Bulk Import

**Test with 10 items first:**
```bash
python bulk_import.py
```

The script defaults to `MAX_ITEMS = 10` for safety.

**Import all complete recipes:**

Edit `bulk_import.py` line 261:
```python
MAX_ITEMS = None  # Import everything
```

Then run:
```bash
python bulk_import.py
```

### Features

- ✅ **Automatic extraction** - Calls Edge Function for each URL
- ✅ **Thumbnail upload** - Downloads and saves Instagram images
- ✅ **Error handling** - Tracks failures and continues
- ✅ **Rate limiting** - 3 second delay between imports (configurable)
- ✅ **Resume capability** - Set `START_FROM` to resume from item N
- ✅ **Progress tracking** - Shows ETA and success rate
- ✅ **Results logging** - Saves detailed JSON report

### Import Settings

In `bulk_import.py`:
- `FILTER_CLASSIFICATION = 'COMPLETE_RECIPE'` - Only import complete recipes
- `DELAY_SECONDS = 3` - Delay between imports (be nice to Instagram)
- `START_FROM = 0` - Resume from item N if previous run failed
- `MAX_ITEMS = 10` - Limit for testing (set to None for all)

### Expected Output

```
[1/38] Importing from @detox_recipes
  Extracting recipe from: https://instagram.com/p/ABC123/
    ✅ Extracted: Green Smoothie Bowl
    ✅ Created recipe: abc-123-def
    📸 Uploading thumbnail...
    ✅ Thumbnail saved
  ✅ Success! (1 imported so far)

...

============================================================
IMPORT COMPLETE
============================================================
Total time: 3.2 minutes
✅ Successful: 36
❌ Failed: 2
============================================================

📄 Results saved to: import_results_20260126_123456.json
```

## Next Steps

After reviewing the sample classification:

1. Check accuracy in the HTML review page
2. Adjust classification prompt if needed
3. Run on full dataset by increasing `SAMPLE_SIZE` to 1000
4. Use bulk import to automatically add complete recipes to RecipeVault

## Files

- `extract_nutrition.py` - Extract URLs from Meta data export
- `classify_sample.py` - Classify recipes with Claude
- `nutrition_collection.csv` - Extracted URLs
- `nutrition_sample_classified.csv` - Classified results
- `nutrition_sample_review.html` - Visual review interface
