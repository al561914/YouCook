import csv
import json
import sys
import time
import os
from datetime import datetime

# Increase CSV field size limit for large fields (e.g. base64 thumbnails)
csv.field_size_limit(sys.maxsize)
from supabase import create_client, Client
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize Supabase client
supabase_url = os.getenv('SUPABASE_URL')
supabase_key = os.getenv('SUPABASE_SERVICE_ROLE_KEY')  # Need service role for bulk operations

if not supabase_url or not supabase_key:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in .env file")

supabase: Client = create_client(supabase_url, supabase_key)

def upload_thumbnail_to_storage(user_id, recipe_id, thumbnail_base64, thumbnail_mime_type):
    """Upload thumbnail from base64 to Supabase storage"""
    import base64

    if not thumbnail_base64:
        return None

    try:
        # Convert base64 to bytes
        image_bytes = base64.b64decode(thumbnail_base64)

        # Determine file extension from mime type
        ext = thumbnail_mime_type.split('/')[-1].split(';')[0] if thumbnail_mime_type else 'jpg'

        # Generate unique filename
        filename = f"{int(time.time())}-instagram.{ext}"
        path = f"{user_id}/{recipe_id}/{filename}"

        # Upload to storage
        result = supabase.storage.from_('recipe-media').upload(
            path=path,
            file=image_bytes,
            file_options={
                'content-type': thumbnail_mime_type or 'image/jpeg',
                'cache-control': '3600',
                'upsert': 'false'
            }
        )

        # Get public URL
        public_url = supabase.storage.from_('recipe-media').get_public_url(path)

        return {
            'url': public_url,
            'path': path
        }
    except Exception as e:
        print(f"    ⚠️  Failed to upload thumbnail: {e}")
        return None

def create_recipe_media(recipe_id, url, caption="Imported from Instagram"):
    """Create recipe_media record"""
    try:
        result = supabase.table('recipe_media').insert({
            'recipe_id': recipe_id,
            'url': url,
            'media_type': 'image',
            'caption': caption,
            'order_index': 0
        }).execute()

        return result.data[0] if result.data else None
    except Exception as e:
        print(f"    ⚠️  Failed to create media record: {e}")
        return None

def is_already_imported(url, user_id):
    """Check if a recipe with this source_url already exists for this user"""
    result = supabase.table('recipes').select('id, title').eq('source_url', url).eq('user_id', user_id).execute()
    if result.data:
        return result.data[0]
    return None


def import_recipe(url, user_id, cookbook_id, original_username, date_added):
    """Import a single recipe from Instagram URL"""

    print(f"\n  Extracting recipe from: {url}")

    try:
        # Step 0: Check for duplicate
        existing = is_already_imported(url, user_id)
        if existing:
            print(f"    ⏭️  Already imported: \"{existing['title']}\" ({existing['id']})")
            return {
                'success': False,
                'error': 'Already imported',
                'skipped': True,
                'url': url
            }

        # Step 1: Call Edge Function to extract recipe
        result = supabase.functions.invoke(
            'extract-social-recipe',
            invoke_options={
                'body': {
                    'url': url,
                    'platform': 'instagram'
                }
            }
        )

        extraction_data = json.loads(result.data)

        print(f"    ✅ Extracted: {extraction_data.get('title', 'Untitled')}")

        # Step 2: Create recipe in database
        recipe_insert = {
            'user_id': user_id,
            'cookbook_id': cookbook_id,
            'title': extraction_data['title'],
            'description': extraction_data.get('description'),
            'servings': extraction_data.get('servings', 4),
            'prep_time_minutes': extraction_data.get('prep_time_minutes'),
            'cook_time_minutes': extraction_data.get('cook_time_minutes'),
            'difficulty': 'medium',
            'raw_ingredients_text': extraction_data['raw_ingredients_text'],
            'raw_procedure_text': extraction_data['raw_procedure_text'],
            'parsing_status': 'pending',
            'source_type': 'social',
            'source_url': url,
            'import_metadata': {
                'method': 'social',
                'platform': 'instagram',
                'author': extraction_data.get('author', original_username),
                'extracted_at': datetime.now().isoformat(),
                'confidence': extraction_data.get('extraction_confidence', 'medium'),
                'warnings': extraction_data.get('warnings', []),
                'bulk_import': True,
                'original_saved_date': date_added
            }
        }

        recipe_result = supabase.table('recipes').insert(recipe_insert).execute()

        if not recipe_result.data:
            print(f"    ❌ Failed to create recipe in database")
            return {
                'success': False,
                'error': 'Failed to insert recipe',
                'url': url
            }

        recipe = recipe_result.data[0]
        recipe_id = recipe['id']

        print(f"    ✅ Created recipe: {recipe_id}")

        # Step 3: Upload thumbnail if available
        if extraction_data.get('thumbnail_base64'):
            print(f"    📸 Uploading thumbnail...")

            storage_result = upload_thumbnail_to_storage(
                user_id=user_id,
                recipe_id=recipe_id,
                thumbnail_base64=extraction_data['thumbnail_base64'],
                thumbnail_mime_type=extraction_data.get('thumbnail_mime_type', 'image/jpeg')
            )

            if storage_result:
                media_result = create_recipe_media(
                    recipe_id=recipe_id,
                    url=storage_result['url'],
                    caption=f"Imported from Instagram (@{extraction_data.get('author', original_username)})"
                )

                if media_result:
                    print(f"    ✅ Thumbnail saved")

        return {
            'success': True,
            'recipe_id': recipe_id,
            'title': extraction_data['title'],
            'url': url
        }

    except Exception as e:
        print(f"    ❌ Import failed: {str(e)}")
        return {
            'success': False,
            'error': str(e),
            'url': url
        }

def bulk_import_recipes(
    input_csv,
    user_id,
    cookbook_id,
    filter_classification='COMPLETE_RECIPE',
    delay_seconds=3,
    start_from=0,
    max_items=None
):
    """
    Bulk import recipes from classified CSV

    Args:
        input_csv: Path to classified CSV file
        user_id: Supabase user ID to assign recipes to
        cookbook_id: Cookbook ID to add recipes to
        filter_classification: Only import this classification (default: COMPLETE_RECIPE)
        delay_seconds: Delay between imports to avoid rate limiting
        start_from: Skip first N items (useful for resuming)
        max_items: Maximum number to import (None = all)
    """

    # Read CSV
    with open(input_csv, 'r', encoding='utf-8-sig') as f:
        reader = csv.DictReader(f)
        rows = [r for r in reader if r['classification'] == filter_classification]

    total = len(rows)

    if start_from > 0:
        rows = rows[start_from:]
        print(f"⏭️  Skipping first {start_from} items")

    if max_items:
        rows = rows[:max_items]
        print(f"🔢 Limiting to {max_items} items")

    print(f"\n{'='*60}")
    print(f"BULK IMPORT: {filter_classification}")
    print(f"{'='*60}")
    print(f"Total items to import: {len(rows)}")
    print(f"User ID: {user_id}")
    print(f"Cookbook ID: {cookbook_id}")
    print(f"Delay between imports: {delay_seconds}s")
    print(f"{'='*60}\n")

    results = {
        'success': [],
        'failed': [],
        'skipped': []
    }

    start_time = time.time()

    for idx, row in enumerate(rows, 1):
        actual_idx = start_from + idx
        url = row['url']
        username = row.get('username', row.get('author', 'unknown'))
        date_added = row.get('date_added', '')

        print(f"[{actual_idx}/{total}] Importing from @{username}")

        result = import_recipe(
            url=url,
            user_id=user_id,
            cookbook_id=cookbook_id,
            original_username=username,
            date_added=date_added
        )

        if result['success']:
            results['success'].append(result)
            print(f"  ✅ Success! ({len(results['success'])} imported so far)")
        elif result.get('skipped'):
            results['skipped'].append(result)
        else:
            results['failed'].append(result)
            print(f"  ❌ Failed ({len(results['failed'])} failures so far)")

        # Progress checkpoint every 10 items
        if idx % 10 == 0:
            elapsed = time.time() - start_time
            rate = idx / elapsed
            remaining = len(rows) - idx
            eta = remaining / rate if rate > 0 else 0

            print(f"\n{'='*60}")
            print(f"PROGRESS: {idx}/{len(rows)} ({idx/len(rows)*100:.1f}%)")
            print(f"Success: {len(results['success'])} | Skipped: {len(results['skipped'])} | Failed: {len(results['failed'])}")
            print(f"Rate: {rate:.2f} items/sec | ETA: {eta/60:.1f} minutes")
            print(f"{'='*60}\n")

        # Rate limiting - skip delay for already-imported items
        if idx < len(rows) and not result.get('skipped'):
            time.sleep(delay_seconds)

    # Final report
    elapsed = time.time() - start_time

    print(f"\n{'='*60}")
    print("IMPORT COMPLETE")
    print(f"{'='*60}")
    print(f"Total time: {elapsed/60:.1f} minutes")
    print(f"✅ Successful: {len(results['success'])}")
    print(f"⏭️  Skipped (already imported): {len(results['skipped'])}")
    print(f"❌ Failed: {len(results['failed'])}")
    print(f"{'='*60}\n")

    # Save results to file
    timestamp = datetime.now().strftime('%Y%m%d_%H%M%S')
    results_file = f'import_results_{timestamp}.json'

    with open(results_file, 'w', encoding='utf-8') as f:
        json.dump(results, f, indent=2, ensure_ascii=False)

    print(f"📄 Results saved to: {results_file}\n")

    # Show failed items
    if results['failed']:
        print("Failed imports:")
        for item in results['failed']:
            print(f"  • {item['url']}")
            print(f"    Error: {item['error']}")

    return results

if __name__ == "__main__":
    # Configuration
    INPUT_CSV = 'nutrition_sample_classified.csv'
    USER_ID = '62a66677-62ee-428f-894d-4db2dd3ed6de'  # Get from Supabase Auth
    COOKBOOK_ID = '379d74e7-386c-4352-a0a2-756c35def135'  # Get from your cookbooks table

    # Import settings
    FILTER_CLASSIFICATION = 'COMPLETE_RECIPE'  # Only import complete recipes
    DELAY_SECONDS = 3  # Delay between imports (be nice to Instagram)
    START_FROM = 0  # Set to N to resume from item N
    MAX_ITEMS = 10  # Set to None to import all, or limit for testing

    print("🚀 Starting bulk import...")
    print(f"⚠️  Make sure USER_ID and COOKBOOK_ID are set correctly!\n")

    # Confirm before proceeding
    if USER_ID == 'YOUR_USER_ID_HERE' or COOKBOOK_ID == 'YOUR_COOKBOOK_ID_HERE':
        print("❌ ERROR: Please set USER_ID and COOKBOOK_ID in the script")
        exit(1)

    input("Press Enter to continue or Ctrl+C to cancel...")

    results = bulk_import_recipes(
        input_csv=INPUT_CSV,
        user_id=USER_ID,
        cookbook_id=COOKBOOK_ID,
        filter_classification=FILTER_CLASSIFICATION,
        delay_seconds=DELAY_SECONDS,
        start_from=START_FROM,
        max_items=MAX_ITEMS
    )

    print("\n✅ Bulk import finished!")
