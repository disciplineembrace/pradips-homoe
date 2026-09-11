#!/usr/bin/env python3
"""
MERGE MM-v2 data into master remedies.json

Strategy:
1. Backup master remedies.json
2. Remove old entries for authors being replaced
3. Add new v2 entries
4. Rebuild remedies-index.json
5. Print stats

Currently replaces:
- Allen (337 new from v2 parser)
- Sankaran (97 new from v2 parser)
- Dubey (237 new from v2 parser)

Keeps Boericke v2 (already merged previously).
Other authors (Phatak, Kent, Boeger, Farrington, Mathur, Murphy) remain unchanged
for now — they'll be replaced when their parsers are refined.
"""
import json
import os
import shutil
from datetime import datetime

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'
V2_DIR = '/home/z/my-project/data/mm-v2'

# Authors to replace with v2 data
REPLACE_AUTHORS = ['Allen', 'Sankaran', 'Dubey']


def main():
    with open(REMEDIES_JSON) as f:
        remedies = json.load(f)
    print(f"Loaded {len(remedies):,} remedies from master")

    # Backup
    backup_path = REMEDIES_JSON + f'.backup-pre-v2-merge-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    shutil.copy2(REMEDIES_JSON, backup_path)
    print(f"Backed up to: {backup_path}")

    # Remove old entries for authors being replaced
    before = len(remedies)
    remedies = [r for r in remedies if r.get('author') not in REPLACE_AUTHORS]
    removed = before - len(remedies)
    print(f"Removed {removed} old entries for {REPLACE_AUTHORS}")

    # Add new v2 entries
    added = 0
    for author in REPLACE_AUTHORS:
        v2_path = f'{V2_DIR}/{author.lower()}-v2.json'
        if not os.path.exists(v2_path):
            print(f"  WARNING: {v2_path} not found, skipping {author}")
            continue
        with open(v2_path) as f:
            new_data = json.load(f)
        for r in new_data:
            remedies.append(r)
            added += 1
        print(f"  Added {len(new_data)} {author} entries")

    print(f"\nTotal: removed {removed}, added {added}")
    print(f"Master now: {len(remedies):,} remedies (was {before:,})")

    # Write back
    with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(REMEDIES_JSON):,} bytes to {REMEDIES_JSON}")

    # Rebuild index
    print("\nRebuilding remedies-index.json...")
    index_entries = []
    for r in remedies:
        index_entries.append({
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
        json.dump(index_entries, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(index_entries):,} entries to {INDEX_JSON}")

    # Author distribution
    from collections import Counter
    authors = Counter(r.get('author', 'Unknown') for r in remedies)
    print("\nAuthor distribution after merge:")
    for a, c in authors.most_common():
        print(f"  {a}: {c}")

    # Verification — check Allen Vaccininum
    print("\n=== REGRESSION: Allen Vaccininum ===")
    for r in remedies:
        if r.get('author') == 'Allen' and 'vaccininum' == r.get('name', '').lower():
            print(f"  id: {r['id']}")
            print(f"  name: {r['name']}")
            print(f"  common: {r['common']}")
            print(f"  sections ({len(r['sections'])}):")
            for s in r['sections'][:5]:
                print(f"    [{s['title']}] {s['content'][:50]}...")
            print(f"  keynote (should be empty): '{r.get('keynote', '')}'")
            break

    # Verification — check Dubey Abies Canadensis
    print("\n=== REGRESSION: Dubey Abies Canadensis ===")
    for r in remedies:
        if r.get('author') == 'Dubey' and 'abies can' in r.get('name', '').lower():
            print(f"  id: {r['id']}")
            print(f"  name: {r['name']}")
            print(f"  sections ({len(r['sections'])}):")
            for s in r['sections']:
                print(f"    [{s['title']}] {s['content'][:50]}...")
            print(f"  keynote (should be empty): '{r.get('keynote', '')}'")
            break


if __name__ == '__main__':
    main()
