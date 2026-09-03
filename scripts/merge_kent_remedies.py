#!/usr/bin/env python3
"""
Merge fresh Kent remedies into data/remedies.json.

- Removes all existing Kent remedies
- Adds the fresh OCR Kent remedies
- Preserves all other authors' remedies unchanged
- Backs up the original file
"""
import json
import os
import shutil
from datetime import datetime

REMEDIES_FILE = "/home/z/my-project/data/remedies.json"
FRESH_KENT_FILE = "/home/z/my-project/data/kent-remedies-fresh.json"
BACKUP_FILE = f"/home/z/my-project/data/remedies.json.bak.{datetime.now().strftime('%Y%m%d%H%M%S')}"

print("=" * 70)
print("MERGE FRESH KENT REMEDIES INTO remedies.json")
print("=" * 70)

# Load existing remedies
with open(REMEDIES_FILE, "r", encoding="utf-8") as f:
    remedies = json.load(f)

print(f"Existing remedies: {len(remedies)}")

# Count by author
from collections import Counter
author_counts = Counter(r.get("author", "Unknown") for r in remedies)
print(f"By author: {dict(author_counts)}")

# Load fresh Kent remedies
with open(FRESH_KENT_FILE, "r", encoding="utf-8") as f:
    fresh_kent = json.load(f)

# Filter out empty ones
fresh_kent = [r for r in fresh_kent if r.get("full", "").strip()]
print(f"Fresh Kent remedies (non-empty): {len(fresh_kent)}")

# Remove existing Kent remedies
non_kent = [r for r in remedies if r.get("author") != "Kent"]
removed_count = len(remedies) - len(non_kent)
print(f"Removed existing Kent remedies: {removed_count}")

# Add fresh Kent remedies
merged = non_kent + fresh_kent
print(f"Merged total: {len(merged)}")

# Verify no duplicate IDs
ids = [r["id"] for r in merged]
dup_ids = [i for i in ids if ids.count(i) > 1]
print(f"Duplicate IDs: {len(set(dup_ids))}")
if dup_ids:
    for d in set(dup_ids)[:5]:
        print(f"  ⚠️ {d}")

# Verify author counts
new_counts = Counter(r.get("author", "Unknown") for r in merged)
print(f"New by author: {dict(new_counts)}")

# Backup original
print(f"\nBacking up original to {BACKUP_FILE}")
shutil.copy2(REMEDIES_FILE, BACKUP_FILE)

# Write merged file
with open(REMEDIES_FILE, "w", encoding="utf-8") as f:
    json.dump(merged, f, ensure_ascii=False, indent=2)

file_size = os.path.getsize(REMEDIES_FILE)
print(f"\nWrote {REMEDIES_FILE}")
print(f"File size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")

# Final verification
print("\n" + "=" * 70)
print("VERIFICATION")
print("=" * 70)
print(f"Total remedies: {len(merged)}")
print(f"Kent remedies: {new_counts.get('Kent', 0)}")
print(f"All other authors unchanged: {all(new_counts[a] == author_counts[a] for a in author_counts if a != 'Kent')}")

# Show a sample Kent remedy
kent_sample = [r for r in merged if r.get("author") == "Kent"][0]
print(f"\nSample Kent remedy:")
print(f"  ID: {kent_sample['id']}")
print(f"  Name: {kent_sample['name']}")
print(f"  Content length: {len(kent_sample['full'])} chars")
print(f"  Preview: {kent_sample['full'][:200]}...")

print("\n" + "=" * 70)
print("DONE — Kent Materia Medica rebuilt with fresh OCR")
print("=" * 70)
