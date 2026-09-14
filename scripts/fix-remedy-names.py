#!/usr/bin/env python3
"""
Materia Medica Remedy Name Cleanup — Fix spelling errors, OCR artifacts,
mixed-up names, and non-remedy entries across ALL authors.

Issues found:
1. Kent: lowercase second words (e.g., "Agnus castus" → "Agnus Castus")
2. Phatak: merged two remedies with "—" separator
   (e.g., "Adonis Vernalis — Aesculus Hippocastanum")
3. Murphy: "Abies Canadensis References" has extra word
4. Boericke: "Preface To The Ninth Edition" is not a remedy
5. Dubey: "Only Efficacious Remedy For" is not a remedy name
6. Farrington: false positives like "Arachnida", "Blood", "Fainting",
   "Impetigo", "Periostitis", "Waxy Liver", "Gastro Enteric Symptoms"

Fixes:
- Capitalize all words in Latin remedy names
- Split merged Phatak names at "—" separator
- Remove non-remedy entries
- Fix known OCR artifacts
- Update remedy IDs to match corrected names
"""
import json
import os
import re
import shutil
from datetime import datetime

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'

# Non-remedy entries to REMOVE (false positives from parsing)
NON_REMEDY_NAMES = {
    # Boericke
    'Preface To The Ninth Edition',
    'New        Manual',
    'Homoeopathic',
    'Ninth Edition',
    'Note From The Publishers',
    'Drug Affinities',
    'Remedies And',
    'Relationship                         Of Remedies',
    'Cham.',
    'Staph.',
    'Verat.',
    'Acon.',
    # Murphy
    'Abies Canadensis References',
    'Rescue Remedy',
    # Dubey
    'Only Efficacious Remedy For',
    'sci hi re',
    # Farrington false positives (not remedy names)
    'Arachnida',
    'Blood',
    'Organs',
    'Hymenoptera',
    'Nosodes',
    'Mammalia',
    'Vertebrata',
    'Reptilia',
    'Fishes',
    'Aves',
    'Insecta',
    'Mollusca',
    'Crustacea',
    'Fainting',
    'Gastro Enteric Symptoms',
    'Impetigo',
    'Periostitis',
    'Waxy Liver',
    'Lymph and its vessels',
    'Serous and synovial membranes',
    'Blood and bloodvessels',
    'The Ophidia',
    'Animal Kingdom',
    'Vegetable Kingdom',
    'Mineral Kingdom',
    'Introductory',
    # Kent false positives
    'Materia',
    'Troublesome             hemorrhoids',
}

# Known OCR corrections for remedy names
OCR_CORRECTIONS = {
    'Thkridion Curassavicum': 'Theridion Curassavicum',
    'Tarentuea Cubensis': 'Tarentula Cubensis',
    'Chedidonium Majus': 'Chelidonium Majus',
    'Pothos Fcetida': 'Pothos Foetida',
    'Berberis Vuegaris': 'Berberis Vulgaris',
    'Linaria Vulgaris': 'Linaria Vulgaris',  # already correct
    'Actea Racemosa': 'Actaea Racemosa',  # standardize to Actaea
    'Actea Spicata': 'Actaea Spicata',  # standardize to Actaea
}


def capitalize_name(name):
    """Capitalize each word in a Latin remedy name."""
    # Don't capitalize common connector words
    CONNECTORS = {'of', 'the', 'and', 'or', 'to', 'for', 'in', 'on', 'with'}
    words = name.split()
    result = []
    for i, w in enumerate(words):
        if w.lower() in CONNECTORS and i > 0:
            result.append(w.lower())
        else:
            # Capitalize first letter, keep rest lowercase
            if w:
                result.append(w[0].upper() + w[1:].lower() if w[0].isalpha() else w)
    return ' '.join(result)


def is_valid_remedy_name(name):
    """Check if a name is a valid remedy name (not a false positive)."""
    if name in NON_REMEDY_NAMES:
        return False
    # Check for non-alpha characters at start
    if name and not name[0].isalpha():
        return False
    # Check for very short names
    if len(name) < 3:
        return False
    # Check for names that are just common English words
    if name.lower() in {'blood', 'organs', 'fainting', 'impetigo', 'periostitis',
                         'waxy liver', 'references', 'remedy', 'chapter',
                         'section', 'index', 'page', 'preface'}:
        return False
    return True


def fix_phatak_merged_names(name):
    """Split merged Phatak names at '—' separator.
    Returns the FIRST remedy name (the second is a separate remedy)."""
    if ' — ' in name:
        # Take the first part
        first = name.split(' — ')[0].strip()
        # Clean up trailing characters
        first = first.rstrip('»°~')
        return first
    return name


def make_id(author, name):
    """Build a stable remedy ID from author and name."""
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

    # Backup
    backup = REMEDIES_JSON + f'.backup-name-fix-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    shutil.copy2(REMEDIES_JSON, backup)
    print(f"Backup: {backup}")

    fixes_applied = 0
    removed = 0
    seen_ids = set()
    cleaned_remedies = []

    for r in remedies:
        name = r.get('name', '')
        author = r.get('author', '')
        original_name = name

        # Step 1: Remove non-remedy entries
        if not is_valid_remedy_name(name):
            print(f"  REMOVED: [{author}] \"{name}\"")
            removed += 1
            continue

        # Step 2: Fix Phatak merged names
        if author == 'Phatak':
            name = fix_phatak_merged_names(name)

        # Step 3: Apply OCR corrections
        if name in OCR_CORRECTIONS:
            name = OCR_CORRECTIONS[name]

        # Step 4: Capitalize properly (especially Kent lowercase words)
        if author == 'Kent':
            name = capitalize_name(name)

        # Step 5: Clean up trailing/leading whitespace
        name = name.strip()

        # Step 6: Update the remedy record if name changed
        if name != original_name:
            print(f"  FIXED: [{author}] \"{original_name}\" → \"{name}\"")
            fixes_applied += 1
            r['name'] = name
            # Update the ID to match the new name
            new_id = make_id(author, name)
            if new_id != r.get('id'):
                r['id'] = new_id

        # Step 7: Handle duplicate IDs (after name fixes)
        if r['id'] in seen_ids:
            # Append a suffix to make unique
            r['id'] = r['id'] + '-2'
        seen_ids.add(r['id'])

        cleaned_remedies.append(r)

    print(f"\n=== SUMMARY ===")
    print(f"Total remedies before: {len(remedies)}")
    print(f"Total remedies after: {len(cleaned_remedies)}")
    print(f"Names fixed: {fixes_applied}")
    print(f"Non-remedy entries removed: {removed}")

    # Write back
    with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(cleaned_remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(REMEDIES_JSON):,} bytes to {REMEDIES_JSON}")

    # Rebuild index
    print("\nRebuilding remedies-index.json...")
    index = []
    for r in cleaned_remedies:
        index.append({
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
        json.dump(index, f, ensure_ascii=False, indent=2)
    print(f"Wrote {len(index):,} entries to {INDEX_JSON}")

    # Author distribution after cleanup
    from collections import Counter
    authors = Counter(r.get('author', 'Unknown') for r in cleaned_remedies)
    print("\nAuthor distribution after cleanup:")
    for a, c in authors.most_common():
        print(f"  {a}: {c}")


if __name__ == '__main__':
    main()
