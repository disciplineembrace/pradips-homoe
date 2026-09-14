#!/usr/bin/env python3
"""
Phase 2: Clean up remaining remedy name issues after initial fix.
- Split remaining Phatak merged names (using ~, ~-, ~—, -—, etc.)
- Remove Kent sentence fragments (not remedy names)
- Fix Phatak special character artifacts
"""
import json
import os
import re
import shutil
from datetime import datetime

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'

# Kent sentence fragments to remove (NOT remedy names)
KENT_SENTENCE_FRAGMENTS = {
    'Troubles Brought on in',
    'This State of Excitement',
    'Calcarea That Covers the',
    'These Are All Aggravated',
    'When She Has Great',
    'This Remedy Is Useful',
    'Membranous Formations',
    'Relapsing Intermittents',
    'Heaviness in the',
    'Inflammation of Bronchial',
    'There Is Intense',
    'There Is Much',
    'Hellebore Has A',
    'Phosphorus Has Been',
    'Hydrophobinum Has Cured',
}


def split_merged_name(name):
    """Split merged Phatak names at various separators."""
    # Try various separators: ~, ~-, ~—, -—, ~--, ~~ , etc.
    separators = [
        ' ~— ', ' ~- ', ' ~ ', ' -— ', ' ~~ ', ' . —=_',
        ' ~—', ' ~-', ' ~', ' -—', ' ~~',
    ]
    for sep in separators:
        if sep in name:
            first = name.split(sep)[0].strip()
            return first
    return name


def make_id(author, name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    prefix = {'Allen': 'allen', 'Kent': 'kent-mm', 'Farrington': 'farrington',
              'Boeger': 'boeger', 'Sankaran': 'sankaran', 'Mathur': 'mathur',
              'Dubey': 'dubey-mm', 'Boericke': 'boericke-mm',
              'Phatak': 'phatak', 'Murphy': 'murphy'}.get(author, author.lower())
    return f'{prefix}-{slug}'


def main():
    with open(REMEDIES_JSON) as f:
        remedies = json.load(f)
    print(f"Loaded {len(remedies):,} remedies")

    backup = REMEDIES_JSON + f'.backup-name-fix2-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    shutil.copy2(REMEDIES_JSON, backup)
    print(f"Backup: {backup}")

    fixes = 0
    removed = 0
    seen_ids = set()
    cleaned = []

    for r in remedies:
        name = r.get('name', '')
        author = r.get('author', '')
        original = name

        # Remove Kent sentence fragments
        if author == 'Kent' and name in KENT_SENTENCE_FRAGMENTS:
            print(f"  REMOVED: [{author}] \"{name}\" (sentence fragment)")
            removed += 1
            continue

        # Split Phatak merged names
        if author == 'Phatak':
            new_name = split_merged_name(name)
            if new_name != name:
                print(f"  SPLIT: [{author}] \"{name}\" → \"{new_name}\"")
                name = new_name
                fixes += 1

        # Clean up any remaining special chars in name
        name = name.strip()
        # Remove trailing special chars
        name = re.sub(r'[\s~\-—–=.]+$', '', name)
        name = name.strip()

        if name != original:
            r['name'] = name
            new_id = make_id(author, name)
            r['id'] = new_id
            if name != original and name not in seen_ids:
                pass  # already printed above

        # Handle duplicate IDs
        if r['id'] in seen_ids:
            # Skip duplicate (already have this remedy from the split)
            print(f"  SKIP DUPLICATE: [{author}] \"{name}\" (ID already exists)")
            removed += 1
            continue
        seen_ids.add(r['id'])

        cleaned.append(r)

    print(f"\n=== SUMMARY ===")
    print(f"Total remedies before: {len(remedies)}")
    print(f"Total remedies after: {len(cleaned)}")
    print(f"Names fixed: {fixes}")
    print(f"Removed (sentence fragments + duplicates): {removed}")

    with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(cleaned, f, ensure_ascii=False, indent=2)
    print(f"Wrote {os.path.getsize(REMEDIES_JSON):,} bytes")

    # Rebuild index
    index = []
    for r in cleaned:
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

    from collections import Counter
    authors = Counter(r.get('author', 'Unknown') for r in cleaned)
    print("\nAuthor distribution:")
    for a, c in authors.most_common():
        print(f"  {a}: {c}")


if __name__ == '__main__':
    main()
