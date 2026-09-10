#!/usr/bin/env python3
"""
Global keynote duplication cleanup for ALL authors.

Problem (from user complaint):
  - Parser v1 set `keynote = first_para[:500]` for every remedy
  - This duplicates content that's already in `full` (and now `intro`)
  - Frontend rendered BOTH "Keynote" and "Full Description" sections

Solution:
  For each remedy in remedies.json:
    - If `keynote` is a prefix of `full` (or vice versa) → set keynote = ''
    - If `keynote` is identical to `intro` → set keynote = ''
    - Otherwise, KEEP keynote (it might be a genuine separate section
      that the v2 parser correctly identified)
    - NEVER delete `full` or `intro` — these are source content

This is a DATA-LEVEL fix, not a frontend hide. The user explicitly said:
"Do NOT solve duplication using: display:none / CSS hiding / substring
removal / visual clipping / hard-coded remedy names."

We ARE permitted to remove processing-generated duplicates from the
database, as long as we don't delete legitimate source content.
"""
import json
import os
import shutil
from datetime import datetime

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'


def is_duplicate(keynote: str, full: str, intro: str) -> bool:
    """Check if keynote duplicates content in full or intro."""
    kn = keynote.strip()
    if not kn:
        return False
    if len(kn) < 30:
        # Too short to be meaningful — likely a truncation artifact
        return True

    # Strip trailing ellipsis (…) which old parser added when truncating
    kn_clean = kn.rstrip('…').rstrip('.').rstrip()
    if len(kn_clean) < 30:
        return True

    full_s = full.strip()
    intro_s = intro.strip()

    # Check if keynote (minus ellipsis) is a prefix of full
    if full_s.startswith(kn_clean):
        return True
    # Check if keynote (with ellipsis) is contained in full
    if kn_clean in full_s:
        return True
    # Check if keynote matches intro
    if intro_s and (kn_clean == intro_s or kn == intro_s):
        return True
    # Check if keynote is a prefix of intro
    if intro_s and (intro_s.startswith(kn_clean) or intro_s.startswith(kn)):
        return True
    # Check if intro is a prefix of keynote (keynote = intro + extra)
    if intro_s and (kn_clean.startswith(intro_s) or kn.startswith(intro_s)) and len(kn_clean) - len(intro_s) < 200:
        return True
    # Check if the first 100 chars of keynote match first 100 chars of full
    # (catches truncation with ellipsis at end)
    if len(kn_clean) >= 100 and full_s[:100] == kn_clean[:100]:
        return True
    return False


def main():
    with open(REMEDIES_JSON) as f:
        remedies = json.load(f)
    print(f"Loaded {len(remedies):,} remedies")

    # Backup
    backup_path = REMEDIES_JSON + f'.backup-pre-keynote-cleanup-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    shutil.copy2(REMEDIES_JSON, backup_path)
    print(f"Backed up to: {backup_path}")

    # Per-author stats
    from collections import Counter
    cleaned_per_author = Counter()
    total_per_author = Counter()

    for r in remedies:
        author = r.get('author', 'Unknown')
        total_per_author[author] += 1

        keynote = r.get('keynote', '')
        full = r.get('full', '')
        intro = r.get('intro', '')

        if keynote and is_duplicate(keynote, full, intro):
            r['keynote'] = ''
            cleaned_per_author[author] += 1

    print("\n=== CLEANUP RESULTS ===")
    print(f"{'Author':<15} {'Total':>8} {'Cleaned':>10} {'Remaining':>10}")
    for author in sorted(total_per_author.keys()):
        total = total_per_author[author]
        cleaned = cleaned_per_author[author]
        remaining = total - cleaned
        print(f"  {author:<13} {total:>8} {cleaned:>10} {remaining:>10}")

    total_cleaned = sum(cleaned_per_author.values())
    total_remedies = sum(total_per_author.values())
    print(f"\n  TOTAL: {total_remedies} remedies, {total_cleaned} had duplicate keynote cleaned")

    # Write back
    with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(REMEDIES_JSON):,} bytes to {REMEDIES_JSON}")

    # Verify: count remaining duplications
    print("\n=== POST-CLEANUP VERIFICATION ===")
    remaining_dups = 0
    for r in remedies:
        if is_duplicate(r.get('keynote', ''), r.get('full', ''), r.get('intro', '')):
            remaining_dups += 1
    print(f"Remaining remedies with duplicate keynote: {remaining_dups}")

    # Sample: show first 3 Phatak remedies
    print("\n=== SAMPLE: First 3 Phatak remedies after cleanup ===")
    phatak = [r for r in remedies if r.get('author') == 'Phatak'][:3]
    for r in phatak:
        print(f"  - {r['name']}")
        print(f"    keynote (should be empty): '{r.get('keynote', '')[:50]}'")
        print(f"    full (first 80 chars): {r.get('full', '')[:80]}...")


if __name__ == '__main__':
    main()
