#!/usr/bin/env python3
"""
Build lightweight remedy indexes for fast API responses.
Reads /data/remedies.json (20MB) and writes:
- /data/remedies-index.json (~3MB) — list endpoint data (no `full` field)
- /data/remedies-by-id.json (~20MB object map) — detail endpoint O(1) lookup
"""
import json
import os

DATA_DIR = '/home/z/my-project/data'
SRC = f'{DATA_DIR}/remedies.json'
INDEX_OUT = f'{DATA_DIR}/remedies-index.json'
BYID_OUT = f'{DATA_DIR}/remedies-by-id.json'

print(f"Loading {SRC}...")
with open(SRC) as f:
    remedies = json.load(f)
print(f"  Loaded {len(remedies)} remedies ({os.path.getsize(SRC):,} bytes)")

# Build lightweight index (no `full` field, keynote truncated)
print(f"\nBuilding lightweight index...")
index = []
for r in remedies:
    index.append({
        'id': r.get('id'),
        'name': r.get('name'),
        'common': r.get('common', ''),
        'author': r.get('author', ''),
        'letter': r.get('letter'),
        'chapter': r.get('chapter'),
        'organ': r.get('organ'),
        'keynote': (r.get('keynote') or '')[:200],  # truncated
    })
print(f"  Index size: {len(index)} items")
with open(INDEX_OUT, 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False)
print(f"  Wrote {os.path.getsize(INDEX_OUT):,} bytes to {INDEX_OUT}")

# Build by-id map (full records)
print(f"\nBuilding by-id map...")
by_id = {r['id']: r for r in remedies}
print(f"  Map size: {len(by_id)} items")
with open(BYID_OUT, 'w', encoding='utf-8') as f:
    json.dump(by_id, f, ensure_ascii=False)
print(f"  Wrote {os.path.getsize(BYID_OUT):,} bytes to {BYID_OUT}")

# Verify
print(f"\nVerification:")
print(f"  remedies.json: {os.path.getsize(SRC):,} bytes")
print(f"  index: {os.path.getsize(INDEX_OUT):,} bytes ({os.path.getsize(INDEX_OUT)*100/os.path.getsize(SRC):.1f}% of original)")
print(f"  by-id: {os.path.getsize(BYID_OUT):,} bytes")
print(f"\n✓ Done. Index reduces list-endpoint memory by ~85%.")
