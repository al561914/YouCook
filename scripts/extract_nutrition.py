import json
import csv
from datetime import datetime

# Read the JSON file
with open('saved_collections.json', 'r', encoding='utf-8') as f:
    data = json.load(f)

# Get the saved collections array
collections = data['saved_saved_collections']

# Find the "Nutrition" collection and extract its items
nutrition_items = []
current_collection = None
in_nutrition_collection = False

for item in collections:
    # Check if this is a collection header
    if item.get('title') == 'Collection':
        collection_name = item['string_map_data']['Name']['value']
        current_collection = collection_name

        # Check if we're entering or leaving the Nutrition collection
        if collection_name == 'Nutrition':
            in_nutrition_collection = True
            print(f"Found 'Nutrition' collection!")
        else:
            if in_nutrition_collection:
                # We've hit the next collection, stop collecting
                print(f"Reached end of 'Nutrition' collection (next collection: {collection_name})")
                break

    # If we're in the Nutrition collection and this is an item (not a header)
    elif in_nutrition_collection:
        name_data = item['string_map_data']['Name']
        added_time_data = item['string_map_data']['Added Time']

        # Extract data
        url = name_data.get('href', '')
        username = name_data.get('value', '')
        timestamp = added_time_data['timestamp']

        # Convert timestamp to readable date
        date_added = datetime.fromtimestamp(timestamp).strftime('%Y-%m-%d %H:%M:%S')

        nutrition_items.append({
            'url': url,
            'username': username,
            'timestamp': timestamp,
            'date_added': date_added
        })

# Write to CSV
csv_filename = 'nutrition_collection.csv'
with open(csv_filename, 'w', newline='', encoding='utf-8') as csvfile:
    fieldnames = ['url', 'username', 'timestamp', 'date_added']
    writer = csv.DictWriter(csvfile, fieldnames=fieldnames)

    writer.writeheader()
    for item in nutrition_items:
        writer.writerow(item)

print(f"\n✅ Exported {len(nutrition_items)} items from 'Nutrition' collection to {csv_filename}")
print(f"\nFirst few items:")
for item in nutrition_items[:5]:
    print(f"  - {item['url']} (@{item['username']}) - Added: {item['date_added']}")
