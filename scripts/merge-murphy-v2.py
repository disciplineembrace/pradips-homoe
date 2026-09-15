#!/usr/bin/env python3
"""Merge Murphy v2 into master remedies.json."""
import json, os, shutil
from datetime import datetime
from collections import Counter

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'
V2_FILE = '/home/z/my-project/data/mm-v2/murphy-v2.json'

with open(REMEDIES_JSON) as f:
    remedies = json.load(f)
print(f"Loaded {len(remedies):,} remedies")

backup = REMEDIES_JSON + f'.backup-pre-murphy-v2-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
shutil.copy2(REMEDIES_JSON, backup)
print(f"Backup: {backup}")

before = len(remedies)
remedies = [r for r in remedies if r.get('author') != 'Murphy']
print(f"Removed {before - len(remedies)} old Murphy entries")

with open(V2_FILE) as f:
    new_data = json.load(f)
for r in new_data:
    remedies.append(r)
print(f"Added {len(new_data)} new Murphy v2 entries (with sections)")

print(f"\nMaster now: {len(remedies):,} remedies")

with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
    json.dump(remedies, f, ensure_ascii=False, indent=2)
print(f"Wrote {os.path.getsize(REMEDIES_JSON):,} bytes")

index = []
for r in remedies:
    index.append({
        'id': r.get('id', ''), 'name': r.get('name', ''),
        'author': r.get('author', ''), 'letter': r.get('letter', ''),
        'chapter': r.get('chapter', ''), 'organ': r.get('organ', ''),
        'common': r.get('common', ''),
        'hasIntro': bool(r.get('intro')),
        'sectionsCount': len(r.get('sections', [])),
    })
with open(INDEX_JSON, 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, indent=2)
print(f"Rebuilt index: {len(index):,} entries")

authors = Counter(r.get('author', 'Unknown') for r in remedies)
print("\nAuthor distribution:")
for a, c in authors.most_common():
    print(f"  {a}: {c}")

print("\n=== REGRESSION: Murphy Abelmoschus Hibiscus ===")
for r in remedies:
    if r.get('author') == 'Murphy' and 'abel' in r.get('name', '').lower():
        print(f"  name: {r['name']}")
        print(f"  sections ({len(r['sections'])}):")
        for s in r['sections']:
            print(f"    [{s['title']}] {s['content'][:60]}...")
        print(f"  keynote: '{r.get('keynote','')}'")
        break
