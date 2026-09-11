#!/usr/bin/env python3
"""Merge Boger v2 into master remedies.json."""
import json, os, shutil
from datetime import datetime
from collections import Counter

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'
BOGER_V2 = '/home/z/my-project/data/mm-v2/boger-v2.json'

with open(REMEDIES_JSON) as f:
    remedies = json.load(f)
print(f"Loaded {len(remedies):,} remedies")

# Backup
backup = REMEDIES_JSON + f'.backup-pre-boger-v2-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
shutil.copy2(REMEDIES_JSON, backup)
print(f"Backup: {backup}")

# Remove old Boeger entries
before = len(remedies)
remedies = [r for r in remedies if r.get('author') != 'Boeger']
print(f"Removed {before - len(remedies)} old Boeger entries")

# Add new v2 entries
with open(BOGER_V2) as f:
    boger = json.load(f)
for r in boger:
    # Fix author name back to 'Boeger' (parser uses 'Boeger')
    r['author'] = 'Boeger'
    remedies.append(r)
print(f"Added {len(boger)} new Boeger entries")

print(f"\nMaster now: {len(remedies):,} remedies")

# Write back
with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
    json.dump(remedies, f, ensure_ascii=False, indent=2)
print(f"Wrote {os.path.getsize(REMEDIES_JSON):,} bytes")

# Rebuild index
index = []
for r in remedies:
    index.append({
        'id': r.get('id', ''),
        'name': r.get('name', ''),
        'author': r.get('author', ''),
        'letter': r.get('letter', ''),
        'chapter': r.get('chapter', ''),
        'organ': r.get('organ', ''),
        'common': r.get('common', ''),
        'hasIntro': bool(r.get('intro')),
        'sectionsCount': len(r.get('sections', [])),
    })
with open(INDEX_JSON, 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False, indent=2)
print(f"Rebuilt index: {len(index):,} entries")

# Author distribution
authors = Counter(r.get('author', 'Unknown') for r in remedies)
print("\nAuthor distribution:")
for a, c in authors.most_common():
    print(f"  {a}: {c}")

# Sample Boger
print("\n=== Sample: Boger Abrotanum ===")
for r in remedies:
    if r.get('author') == 'Boeger' and 'abrotanum' in r.get('name', '').lower():
        print(f"  name: {r['name']}")
        print(f"  sections: {[(s['title'], s['content'][:40]) for s in r['sections']]}")
        print(f"  keynote: '{r.get('keynote','')}'")
        break
