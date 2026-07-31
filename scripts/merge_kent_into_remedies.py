#!/usr/bin/env python3
"""
Merge fresh Kent remedies into remedies.json.

- Removes ALL existing Kent remedies (old OCR data)
- Adds fresh Kent remedies from kent-remedies-fresh.json
- Preserves ALL other authors (Allen, Boericke, Dubey, Phatak, etc.)
- Updates the search index automatically (it reads from remedies.json)

Safety:
  - Backs up remedies.json before modifying
  - Verifies no data loss for other authors
  - Verifies fresh Kent data has no control chars / duplicates
"""
import json
import os
import re
import shutil
from datetime import datetime

REMEDIES_FILE = "/home/z/my-project/data/remedies.json"
FRESH_KENT_FILE = "/home/z/my-project/data/kent-remedies-fresh.json"
BACKUP_DIR = "/home/z/my-project/data/backups"

def main():
    print("=" * 70)
    print("MERGE FRESH KENT REMEDIES INTO remedies.json")
    print("=" * 70)

    # Load existing remedies
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        remedies = json.load(f)
    print(f"Existing remedies: {len(remedies):,}")

    # Count by author (before)
    from collections import Counter
    before_authors = Counter(r.get('author', 'Unknown') for r in remedies)
    print(f"\nAuthors (before):")
    for author, count in sorted(before_authors.items()):
        print(f"  {author}: {count}")

    # Load fresh Kent data
    with open(FRESH_KENT_FILE, 'r', encoding='utf-8') as f:
        fresh_kent = json.load(f)
    print(f"\nFresh Kent remedies: {len(fresh_kent)}")

    # Verify fresh Kent data quality
    ctrl_count = sum(1 for r in fresh_kent if re.search(r'[\x00-\x08\x0E-\x1F]', r.get('full', '')))
    print(f"  Control chars: {ctrl_count} (must be 0)")
    if ctrl_count > 0:
        print("  ❌ ABORT: Fresh data has control chars")
        return False

    names = [r['name'] for r in fresh_kent]
    dups = [n for n in names if names.count(n) > 1]
    print(f"  Duplicates: {len(set(dups))} (must be 0)")
    if dups:
        print("  ❌ ABORT: Fresh data has duplicates")
        return False

    empty = [r for r in fresh_kent if len(r.get('full', '')) < 100]
    print(f"  Empty/truncated: {len(empty)} (must be 0)")
    if empty:
        print("  ❌ ABORT: Fresh data has empty remedies")
        return False

    # Backup existing file
    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"remedies-{timestamp}.json")
    shutil.copy2(REMEDIES_FILE, backup_path)
    print(f"\n  Backed up to: {backup_path}")

    # Remove ALL existing Kent remedies
    non_kent = [r for r in remedies if r.get('author') != 'Kent']
    old_kent_count = len(remedies) - len(non_kent)
    print(f"\n  Removed {old_kent_count} old Kent remedies")
    print(f"  Preserved {len(non_kent)} non-Kent remedies")

    # Add fresh Kent remedies
    merged = non_kent + fresh_kent
    print(f"\n  Merged total: {len(merged)} remedies")

    # Count by author (after)
    after_authors = Counter(r.get('author', 'Unknown') for r in merged)
    print(f"\nAuthors (after):")
    for author, count in sorted(after_authors.items()):
        before_count = before_authors.get(author, 0)
        diff = count - before_count
        sign = '+' if diff > 0 else ''
        marker = ' ← CHANGED' if diff != 0 else ''
        print(f"  {author}: {count} (was {before_count}, {sign}{diff}){marker}")

    # Verify no non-Kent author lost remedies
    for author, count in before_authors.items():
        if author == 'Kent':
            continue
        if after_authors.get(author, 0) != count:
            print(f"\n  ❌ ERROR: {author} changed from {count} to {after_authors.get(author, 0)}!")
            return False

    # Write merged file
    with open(REMEDIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)

    file_size = os.path.getsize(REMEDIES_FILE)
    print(f"\n  Written: {REMEDIES_FILE}")
    print(f"  Size: {file_size:,} bytes ({file_size / 1024 / 1024:.1f} MB)")

    # Final verification
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        verify = json.load(f)
    print(f"\n  Verification: {len(verify)} remedies loaded successfully")

    # Sample a Kent remedy
    kent_sample = next((r for r in verify if r.get('author') == 'Kent'), None)
    if kent_sample:
        print(f"\n  Sample Kent remedy: {kent_sample['name']}")
        print(f"    ID: {kent_sample['id']}")
        print(f"    Full text length: {len(kent_sample['full']):,} chars")
        print(f"    First 150 chars: {kent_sample['full'][:150]}")

    # Sample a non-Kent remedy (verify unchanged)
    allen_sample = next((r for r in verify if r.get('author') == 'Allen'), None)
    if allen_sample:
        print(f"\n  Sample Allen remedy (unchanged): {allen_sample['name']}")
        print(f"    Full text length: {len(allen_sample['full']):,} chars")

    print("\n" + "=" * 70)
    print("✅ MERGE COMPLETE — Kent data replaced, all other authors preserved")
    print("=" * 70)
    return True

if __name__ == '__main__':
    success = main()
    exit(0 if success else 1)
