#!/usr/bin/env python3
"""Merge fresh Kent data into remedies.json — replace Kent entries only."""
import json
import os

REMEDIES_JSON = "/home/z/my-project/data/remedies.json"
KENT_FINAL = "/home/z/my-project/data/kent-remedies-final.json"
BACKUP = "/home/z/my-project/data/remedies.json.bak"

print("=== Merge fresh Kent data into remedies.json ===")

# Load
with open(REMEDIES_JSON, 'r', encoding='utf-8') as f:
    all_remedies = json.load(f)
with open(KENT_FINAL, 'r', encoding='utf-8') as f:
    kent_final = json.load(f)

print(f"  Total remedies: {len(all_remedies)}")
print(f"  Fresh Kent remedies: {len(kent_final)}")

# Build lookup of fresh Kent by ID
kent_by_id = {r['id']: r for r in kent_final}

# Replace Kent entries
replaced = 0
kept = 0
for i, remedy in enumerate(all_remedies):
    if remedy.get('author') == 'Kent':
        fresh = kent_by_id.get(remedy['id'])
        if fresh:
            all_remedies[i] = fresh
            replaced += 1
        else:
            kept += 1

print(f"  Replaced: {replaced}")
print(f"  Kept (no fresh data): {kept}")

# Backup original
if not os.path.exists(BACKUP):
    import shutil
    shutil.copy2(REMEDIES_JSON, BACKUP)
    print(f"  Backed up original to {BACKUP}")

# Save
with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
    json.dump(all_remedies, f, ensure_ascii=False, separators=(',', ':'))

size = os.path.getsize(REMEDIES_JSON)
print(f"  Saved: {size:,} bytes ({size/1024/1024:.1f} MB)")

# Verify
with open(REMEDIES_JSON, 'r', encoding='utf-8') as f:
    verify = json.load(f)
kent_count = sum(1 for r in verify if r.get('author') == 'Kent')
total = len(verify)
print(f"  Verification: {total} total remedies, {kent_count} Kent")
print("=== DONE ===")
