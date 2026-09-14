#!/usr/bin/env python3
"""Merge Dubey v3 into master remedies.json."""
import json, os, shutil
from datetime import datetime
from collections import Counter

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'
V3_FILE = '/home/z/my-project/data/mm-v2/dubey-v3.json'

with open(REMEDIES_JSON) as f:
    remedies = json.load(f)
print(f"Loaded {len(remedies):,} remedies")

backup = REMEDIES_JSON + f'.backup-pre-dubey-v3-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
shutil.copy2(REMEDIES_JSON, backup)
print(f"Backup: {backup}")

before = len(remedies)
remedies = [r for r in remedies if r.get('author') != 'Dubey']
print(f"Removed {before - len(remedies)} old Dubey entries")

with open(V3_FILE) as f:
    new_data = json.load(f)
for r in new_data:
    remedies.append(r)
print(f"Added {len(new_data)} new Dubey v3 entries (with subsections)")

print(f"\nMaster now: {len(remedies):,} remedies")

with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
    json.dump(remedies, f, ensure_ascii=False, indent=2)
print(f"Wrote {os.path.getsize(REMEDIES_JSON):,} bytes")

# Rebuild index
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

# Verify Dubey Abies Canadensis
print("\n=== REGRESSION: Dubey Abies Canadensis ===")
for r in remedies:
    if r.get('author') == 'Dubey' and 'abies can' in r.get('name', '').lower():
        print(f"  name: {r['name']}")
        print(f"  sections ({len(r['sections'])}):")
        for s in r['sections']:
            print(f"    [{s['title']}]")
            if s.get('subsections'):
                print(f"      subsections ({len(s['subsections'])}):")
                for sub in s['subsections']:
                    print(f"        - {sub['heading']}: {sub['content'][:50]}...")
            content_preview = s['content'][:150].replace('\n', ' | ')
            print(f"      content: {content_preview}...")
        break
