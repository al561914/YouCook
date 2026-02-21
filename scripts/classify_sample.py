import csv
import json
import time
import os
from anthropic import Anthropic
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Initialize Claude with API key from environment
api_key = os.getenv('ANTHROPIC_API_KEY')
if not api_key:
    raise ValueError("ANTHROPIC_API_KEY not found in .env file. Please copy .env.example to .env and add your API key.")

client = Anthropic(api_key=api_key)

def download_thumbnail_as_base64(thumbnail_url):
    """Download thumbnail and convert to base64 to avoid CORS issues"""
    import requests
    import base64

    if not thumbnail_url:
        return None

    try:
        response = requests.get(thumbnail_url, timeout=10)
        if response.ok:
            # Get content type
            content_type = response.headers.get('content-type', 'image/jpeg')
            # Convert to base64
            image_base64 = base64.b64encode(response.content).decode('utf-8')
            # Return as data URI
            return f"data:{content_type};base64,{image_base64}"
        else:
            return None
    except Exception as e:
        print(f"  ⚠️  Failed to download thumbnail: {e}")
        return None

def fetch_instagram_caption(url):
    """Fetch caption from Instagram oembed API"""
    import requests
    oembed_url = f"https://www.instagram.com/api/v1/oembed/?url={url}"
    try:
        response = requests.get(oembed_url, timeout=10)
        if response.ok:
            data = response.json()
            thumbnail_url = data.get('thumbnail_url', '')

            # Download thumbnail and convert to base64
            thumbnail_base64 = None
            if thumbnail_url:
                print(f"  📸 Downloading thumbnail...")
                thumbnail_base64 = download_thumbnail_as_base64(thumbnail_url)

            return {
                'caption': data.get('title', ''),
                'author': data.get('author_name', ''),
                'thumbnail': thumbnail_base64,  # Now contains base64 data URI
                'thumbnail_url': thumbnail_url,  # Keep original URL for reference
                'error': None
            }
        else:
            return {
                'caption': '',
                'author': '',
                'thumbnail': '',
                'thumbnail_url': '',
                'error': f'HTTP {response.status_code}'
            }
    except Exception as e:
        return {
            'caption': '',
            'author': '',
            'thumbnail': '',
            'thumbnail_url': '',
            'error': str(e)
        }

def classify_recipe(caption, author):
    """Use Claude to classify the recipe caption"""
    if not caption or len(caption) < 20:
        return "ERROR"

    prompt = f"""Analyze this Instagram caption from @{author} and classify it:

Caption:
{caption}

Classify as ONE of these categories:
1. COMPLETE_RECIPE - Has both ingredients list AND cooking instructions
2. PARTIAL_RECIPE - Has ingredients but instructions say "see video" or similar
3. MEAL_SUGGESTION - Just shows food/meals without a recipe
4. NOT_FOOD - Fitness tips, motivation, non-food content
5. UNCLEAR - Cannot determine from caption alone

Return ONLY the category name, nothing else."""

    try:
        message = client.messages.create(
            model="claude-3-5-haiku-20241022",
            max_tokens=50,
            messages=[{"role": "user", "content": prompt}]
        )

        classification = message.content[0].text.strip()
        return classification
    except Exception as e:
        print(f"Classification error: {e}")
        return "ERROR"

def process_sample(input_csv, output_csv, html_output, sample_size=60):
    """Process sample of URLs and add classification"""
    results = []

    with open(input_csv, 'r', encoding='utf-8') as f:
        reader = csv.DictReader(f)
        rows = list(reader)[:sample_size]

    total = len(rows)
    stats = {
        'COMPLETE_RECIPE': 0,
        'PARTIAL_RECIPE': 0,
        'MEAL_SUGGESTION': 0,
        'NOT_FOOD': 0,
        'UNCLEAR': 0,
        'ERROR': 0,
        'URL_ERROR': 0
    }

    print(f"Processing sample of {total} URLs...\n")

    for idx, row in enumerate(rows, 1):
        url = row['url']
        username = row['username']

        print(f"[{idx}/{total}] Processing {url}")

        # Fetch caption
        data = fetch_instagram_caption(url)

        if data['error']:
            classification = 'URL_ERROR'
            caption_preview = f"Error: {data['error']}"
            stats['URL_ERROR'] += 1
            print(f"  ⚠️  URL Error: {data['error']}")
        elif not data['caption']:
            classification = 'ERROR'
            caption_preview = 'No caption found'
            stats['ERROR'] += 1
        else:
            caption = data['caption']
            caption_preview = caption[:150] + '...' if len(caption) > 150 else caption

            # Classify with Claude
            classification = classify_recipe(caption, data['author'])
            stats[classification] = stats.get(classification, 0) + 1

        # Add to results
        results.append({
            'url': url,
            'username': username,
            'date_added': row.get('date_added', ''),
            'classification': classification,
            'caption_preview': caption_preview,
            'caption_full': data.get('caption', ''),
            'thumbnail': data.get('thumbnail', ''),  # Base64 data URI
            'thumbnail_url': data.get('thumbnail_url', ''),  # Original URL
            'author': data.get('author', username),
            'error': data.get('error', '')
        })

        print(f"  → {classification}")

        # Rate limiting
        time.sleep(1)

    # Write results to CSV with UTF-8 BOM for Excel
    with open(output_csv, 'w', newline='', encoding='utf-8-sig') as f:
        fieldnames = ['url', 'username', 'date_added', 'classification',
                      'caption_preview', 'thumbnail', 'author', 'error']
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        for r in results:
            writer.writerow({k: r[k] for k in fieldnames})

    # Generate HTML review page
    generate_html_review(results, html_output)

    # Print statistics
    print(f"\n{'='*60}")
    print("CLASSIFICATION RESULTS (Sample)")
    print(f"{'='*60}")
    for cat, count in sorted(stats.items(), key=lambda x: -x[1]):
        percentage = (count / total) * 100
        print(f"{cat:20s}: {count:4d} ({percentage:.1f}%)")
    print(f"{'='*60}")
    print(f"✅ CSV saved to {output_csv}")
    print(f"🌐 HTML review saved to {html_output}")

    # Show URL errors if any
    url_errors = [r for r in results if r['classification'] == 'URL_ERROR']
    if url_errors:
        print(f"\n⚠️  {len(url_errors)} URLs failed to fetch:")
        for err in url_errors[:5]:
            print(f"  • {err['url']}")
            print(f"    Error: {err['error']}")
        if len(url_errors) > 5:
            print(f"  ... and {len(url_errors) - 5} more")

    return results, stats

def generate_html_review(results, html_output):
    """Generate HTML page for visual review"""

    # Group by classification
    grouped = {}
    for r in results:
        cat = r['classification']
        if cat not in grouped:
            grouped[cat] = []
        grouped[cat].append(r)

    html = """<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Instagram Recipe Classification Review</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif; margin: 20px; background: #f5f5f5; }
        .header { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .stats { display: flex; gap: 15px; flex-wrap: wrap; margin-top: 15px; }
        .stat { background: #f0f0f0; padding: 10px 15px; border-radius: 5px; }
        .stat-label { font-size: 12px; color: #666; }
        .stat-value { font-size: 24px; font-weight: bold; }
        .category { background: white; padding: 20px; border-radius: 8px; margin-bottom: 20px; }
        .category-header { font-size: 20px; font-weight: bold; margin-bottom: 15px; display: flex; align-items: center; gap: 10px; }
        .badge { padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: normal; }
        .badge-complete { background: #d4edda; color: #155724; }
        .badge-partial { background: #fff3cd; color: #856404; }
        .badge-suggestion { background: #cce5ff; color: #004085; }
        .badge-unclear { background: #e2e3e5; color: #383d41; }
        .badge-error { background: #f8d7da; color: #721c24; }
        .items { display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 15px; }
        .item { border: 1px solid #ddd; padding: 15px; border-radius: 5px; background: #fafafa; }
        .item-header { display: flex; gap: 10px; margin-bottom: 10px; }
        .thumbnail { width: 80px; height: 80px; object-fit: cover; border-radius: 5px; }
        .item-info { flex: 1; min-width: 0; }
        .item-username { font-weight: bold; color: #333; font-size: 14px; }
        .item-date { font-size: 12px; color: #666; }
        .caption { font-size: 13px; color: #444; margin-top: 10px; line-height: 1.4; max-height: 100px; overflow-y: auto; }
        .item-url { font-size: 12px; margin-top: 10px; }
        .item-url a { color: #0066cc; text-decoration: none; word-break: break-all; }
        .item-url a:hover { text-decoration: underline; }
        .error-msg { color: #dc3545; font-size: 12px; margin-top: 5px; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Instagram Recipe Classification Review</h1>
        <div class="stats">
"""

    # Add statistics
    total = len(results)
    for cat in ['COMPLETE_RECIPE', 'PARTIAL_RECIPE', 'MEAL_SUGGESTION', 'NOT_FOOD', 'UNCLEAR', 'URL_ERROR', 'ERROR']:
        count = len([r for r in results if r['classification'] == cat])
        if count > 0:
            percentage = (count / total) * 100
            html += f"""
            <div class="stat">
                <div class="stat-label">{cat.replace('_', ' ')}</div>
                <div class="stat-value">{count} <span style="font-size: 14px; color: #666;">({percentage:.0f}%)</span></div>
            </div>
"""

    html += """
        </div>
    </div>
"""

    # Add categories
    category_labels = {
        'COMPLETE_RECIPE': ('Complete Recipe', 'badge-complete'),
        'PARTIAL_RECIPE': ('Partial Recipe', 'badge-partial'),
        'MEAL_SUGGESTION': ('Meal Suggestion', 'badge-suggestion'),
        'NOT_FOOD': ('Not Food', 'badge-suggestion'),
        'UNCLEAR': ('Unclear', 'badge-unclear'),
        'URL_ERROR': ('URL Error', 'badge-error'),
        'ERROR': ('Error', 'badge-error')
    }

    for cat, items in grouped.items():
        if not items:
            continue

        label, badge_class = category_labels.get(cat, (cat, 'badge-unclear'))

        html += f"""
    <div class="category">
        <div class="category-header">
            {label}
            <span class="badge {badge_class}">{len(items)} items</span>
        </div>
        <div class="items">
"""

        for item in items:
            thumbnail_html = f'<img src="{item["thumbnail"]}" class="thumbnail" alt="Thumbnail">' if item['thumbnail'] else '<div class="thumbnail" style="background: #e0e0e0;"></div>'
            caption = item['caption_preview'].replace('<', '&lt;').replace('>', '&gt;')
            error_html = f'<div class="error-msg">⚠️ {item["error"]}</div>' if item['error'] else ''

            html += f"""
            <div class="item">
                <div class="item-header">
                    {thumbnail_html}
                    <div class="item-info">
                        <div class="item-username">@{item['author']}</div>
                        <div class="item-date">{item['date_added']}</div>
                    </div>
                </div>
                <div class="caption">{caption}</div>
                {error_html}
                <div class="item-url"><a href="{item['url']}" target="_blank">{item['url']}</a></div>
            </div>
"""

        html += """
        </div>
    </div>
"""

    html += """
</body>
</html>
"""

    with open(html_output, 'w', encoding='utf-8') as f:
        f.write(html)

if __name__ == "__main__":
    INPUT_CSV = 'nutrition_collection.csv'
    OUTPUT_CSV = 'nutrition_sample_classified.csv'
    HTML_OUTPUT = 'nutrition_sample_review.html'
    SAMPLE_SIZE = 60

    print("🧪 Running classification on sample...")
    print(f"Sample size: {SAMPLE_SIZE}\n")

    results, stats = process_sample(INPUT_CSV, OUTPUT_CSV, HTML_OUTPUT, SAMPLE_SIZE)

    print("\n💡 Next steps:")
    print(f"1. Open '{HTML_OUTPUT}' in your browser for visual review")
    print(f"2. Open '{OUTPUT_CSV}' in Excel to see data (encoding fixed)")
    print("3. Adjust classification prompt if needed")
    print("4. Run on full dataset when satisfied")
