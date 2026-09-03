#!/usr/bin/env python3
"""Merge fresh Kent remedies into remedies.json — replace old Kent, preserve all others."""
import json
import os
import re
import shutil
from datetime import datetime
from collections import Counter

REMEDIES_FILE = "/home/z/my-project/data/remedies.json"
FRESH_KENT = "/home/z/my-project/data/kent-remedies-fresh.json"
BACKUP_DIR = "/home/z/my-project/data/backups"

def main():
    print("=" * 70)
    print("MERGE FRESH KENT INTO remedies.json")
    print("=" * 70)

    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        remedies = json.load(f)
    before = Counter(r.get('author', '?') for r in remedies)
    print(f"Before: {len(remedies)} remedies")
    for a, c in sorted(before.items()):
        print(f"  {a}: {c}")

    with open(FRESH_KENT, 'r', encoding='utf-8') as f:
        fresh = json.load(f)
    print(f"\nFresh Kent: {len(fresh)} remedies")

    # Quality check
    ctrl = sum(1 for r in fresh if re.search(r'[\x00-\x08\x0E-\x1F]', r.get('full', '')))
    assert ctrl == 0, f"Control chars: {ctrl}"
    names = [r['name'] for r in fresh]
    assert len(names) == len(set(names)), "Duplicates found"

    # Backup
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copy2(REMEDIES_FILE, os.path.join(BACKUP_DIR, f"remedies-{ts}.json"))

    # Replace Kent
    non_kent = [r for r in remedies if r.get('author') != 'Kent']
    merged = non_kent + fresh
    after = Counter(r.get('author', '?') for r in merged)

    print(f"\nAfter: {len(merged)} remedies")
    for a, c in sorted(after.items()):
        diff = c - before.get(a, 0)
        marker = f" ({'+' if diff > 0 else ''}{diff})" if diff != 0 else ""
        print(f"  {a}: {c}{marker}")

    # Verify no non-Kent author lost data
    for a, c in before.items():
        if a == 'Kent':
            continue
        assert after.get(a, 0) == c, f"{a} changed!"

    with open(REMEDIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(merged, f, ensure_ascii=False, indent=2)
    print(f"\nWritten: {os.path.getsize(REMEDIES_FILE):,} bytes")
    print("✅ MERGE COMPLETE")

if __name__ == '__main__':
    main()
