#!/usr/bin/env python3
"""
Merge clean Boericke data (v2) into master remedies.json.

Strategy:
1. Backup remedies.json → remedies.json.backup-pre-boericke-v2
2. Remove all existing Boericke entries (id starts with 'boericke-mm-' or 'abies-' etc)
3. Add new clean Boericke entries from boericke-source-remedies-v2.json
4. Also update remedies-index.json (smaller, used by list endpoints)
5. Print before/after stats

The new entries preserve source structure:
- intro: source introduction paragraph(s)
- sections: [{title, content}] — actual source section headings + content
- keynote: EMPTY (no artificial duplication)
- full: joined intro + sections (for backward compat with old renderers,
  but the new frontend will NOT render `full` as a "Full Description" section)
"""
import json
import os
import shutil
from datetime import datetime

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'
NEW_BOERICKE = '/home/z/my-project/data/boericke-source-remedies-v2.json'
BACKUP_SUFFIX = f'.backup-pre-boericke-v2-{datetime.now().strftime("%Y%m%d-%H%M%S")}'


def main():
    # Load existing master
    with open(REMEDIES_JSON) as f:
        remedies = json.load(f)
    print(f"Loaded {len(remedies):,} remedies from master file")

    # Load new clean Boericke
    with open(NEW_BOERICKE) as f:
        new_boericke = json.load(f)
    print(f"Loaded {len(new_boericke):,} clean Boericke remedies from v2")

    # Backup
    backup_path = REMEDIES_JSON + BACKUP_SUFFIX
    shutil.copy2(REMEDIES_JSON, backup_path)
    print(f"Backed up master to: {backup_path}")

    # Remove existing Boericke entries
    old_count = len(remedies)
    remedies = [r for r in remedies if r.get('author') != 'Boericke']
    removed = old_count - len(remedies)
    print(f"Removed {removed} old Boericke entries (master now: {len(remedies):,})")

    # Add new Boericke entries — but first, ensure the `id` field doesn't
    # collide with non-Boericke entries that might share the same name.
    # Use the prefix 'boericke-mm-' to namespace them.
    existing_ids = {r['id'] for r in remedies}
    added = 0
    skipped_dup_id = 0
    for r in new_boericke:
        # Skip if id already exists (shouldn't happen, but defensive)
        if r['id'] in existing_ids:
            # Append suffix to make unique
            r['id'] = r['id'] + '-b'
        existing_ids.add(r['id'])
        remedies.append(r)
        added += 1

    print(f"Added {added} new Boericke entries (master now: {len(remedies):,})")

    # Write back
    with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"Wrote {os.path.getsize(REMEDIES_JSON):,} bytes to {REMEDIES_JSON}")

    # Rebuild the lightweight index
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
    print(f"Wrote {len(index_entries):,} entries to {INDEX_JSON} ({os.path.getsize(INDEX_JSON):,} bytes)")

    # Author distribution after merge
    from collections import Counter
    authors = Counter(r.get('author', 'Unknown') for r in remedies)
    print("\nAuthor distribution after merge:")
    for a, c in authors.most_common():
        print(f"  {a}: {c}")
    print(f"Total: {len(remedies):,}")

    # Verify Boericke Abies Canadensis
    print("\n=== REGRESSION CHECK: Boericke Abies Canadensis ===")
    for r in remedies:
        if r.get('author') == 'Boericke' and 'abies can' in r.get('name', '').lower():
            print(f"  id: {r['id']}")
            print(f"  name: {r['name']}")
            print(f"  common: {r.get('common', '')}")
            print(f"  intro (first 100 chars): {r.get('intro', '')[:100]}...")
            print(f"  sections ({len(r.get('sections', []))}):")
            for s in r.get('sections', []):
                print(f"    - {s['title']}: {s['content'][:60]}...")
            print(f"  keynote (should be empty): '{r.get('keynote', '')}'")
            print(f"  full length: {len(r.get('full', ''))}")
            break

    # Verify no duplication
    print("\n=== GLOBAL DUPLICATION CHECK ===")
    dup_count = 0
    for r in remedies:
        kn = r.get('keynote', '')
        full = r.get('full', '')
        if kn and full and kn in full and len(kn) > 30:
            dup_count += 1
    print(f"  Remedies with keynote ⊂ full (duplication): {dup_count}")


if __name__ == '__main__':
    main()
