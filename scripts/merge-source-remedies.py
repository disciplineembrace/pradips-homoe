#!/usr/bin/env python3
"""
Merge parsed source remedies into production remedies.json.
SAFE strategy: only ADD missing remedies, never overwrite or delete existing.
Per Phase 18: never overwrite better data without comparison.
"""
import json, re, os, shutil
from datetime import datetime

DATA_DIR = '/home/z/my-project/data'
PROD_PATH = f'{DATA_DIR}/remedies.json'
BACKUP_PATH = f'{DATA_DIR}/remedies.json.bak-{datetime.now().strftime("%Y%m%d-%H%M%S")}'

SOURCES = [
    ('boericke-source-remedies.json', 'Boericke'),
    ('murphy-source-remedies.json', 'Murphy'),
    ('sankaran-source-remedies.json', 'Sankaran'),
]

def is_bad_name(name):
    """Filter OCR parsing artifacts."""
    if not name or not name.strip():
        return True
    if '|' in name or name.endswith(';') or name.endswith('|'):
        return True
    # Skip section words
    section_words = {'preface', 'introduction', 'index', 'contents', 'chapter',
        'about the writer', 'acknowledgement', 'mind', 'head', 'eyes', 'ears',
        'nose', 'face', 'mouth', 'throat', 'stomach', 'abdomen', 'rectum',
        'stool', 'urinary', 'genitals', 'male', 'female', 'respiratory',
        'chest', 'heart', 'back', 'extremities', 'skin', 'sleep', 'fever',
        'modalities', 'relationship', 'dose', 'particulars', 'generalities'}
    if name.lower().strip() in section_words:
        return True
    return False

def main():
    # Backup
    print(f"[1/4] Backup: {PROD_PATH} -> {BACKUP_PATH}")
    shutil.copy2(PROD_PATH, BACKUP_PATH)

    print(f"[2/4] Loading production remedies...")
    with open(PROD_PATH) as f:
        prod = json.load(f)
    prod_by_id = {r['id']: r for r in prod}
    initial_count = len(prod)
    print(f"  {initial_count} remedies in production")

    stats = {}
    for src_file, author in SOURCES:
        src_path = f'{DATA_DIR}/{src_file}'
        if not os.path.exists(src_path):
            print(f"\n[3/4] Skipping {author} — {src_file} not found")
            continue

        with open(src_path) as f:
            src_remedies = json.load(f)

        print(f"\n[3/4] Merging {author} source ({len(src_remedies)} remedies)...")
        added = 0
        skipped_bad = 0
        skipped_exists = 0
        skipped_short = 0

        for r in src_remedies:
            name = r.get('name', '')
            if is_bad_name(name):
                skipped_bad += 1
                continue
            full = r.get('full', '')
            if len(full.strip()) < 50:
                skipped_short += 1
                continue

            rid = r['id']
            if rid in prod_by_id:
                skipped_exists += 1
                continue

            # Check by name+author too (case-insensitive)
            name_lower = name.lower().strip()
            existing = any(
                existing_r.get('name', '').lower().strip() == name_lower
                and existing_r.get('author') == author
                for existing_r in prod_by_id.values()
            )
            if existing:
                skipped_exists += 1
                continue

            # Add missing remedy
            prod_by_id[rid] = r
            prod.append(r)
            added += 1

        stats[author] = {
            'source_count': len(src_remedies),
            'added': added,
            'skipped_bad_name': skipped_bad,
            'skipped_already_exists': skipped_exists,
            'skipped_short_content': skipped_short,
        }
        print(f"  Added: {added}, Skipped (exists): {skipped_exists}, Skipped (bad): {skipped_bad}, Skipped (short): {skipped_short}")

    # Write merged
    print(f"\n[4/4] Writing merged remedies.json...")
    final_count = len(prod)
    print(f"  Initial: {initial_count}")
    print(f"  Final:   {final_count}")
    print(f"  Net added: {final_count - initial_count}")

    with open(PROD_PATH, 'w', encoding='utf-8') as f:
        json.dump(prod, f, ensure_ascii=False, indent=2)
    print(f"  Wrote {os.path.getsize(PROD_PATH):,} bytes")

    # Rebuild indexes
    print(f"\nRebuilding indexes...")
    os.system(f'python3 /home/z/my-project/scripts/build-remedy-index.py')

    # Author distribution
    from collections import Counter
    with open(PROD_PATH) as f:
        verify = json.load(f)
    counts = Counter(r.get('author', '?') for r in verify)
    print(f"\nFinal author distribution:")
    for a, n in counts.most_common():
        print(f"  {a}: {n}")

    # Save merge report
    report = {
        'backup_path': BACKUP_PATH,
        'initial_count': initial_count,
        'final_count': final_count,
        'net_added': final_count - initial_count,
        'per_source': stats,
    }
    with open(f'{DATA_DIR}/mm-source-merge-report.json', 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\n✓ Merge complete. Backup: {BACKUP_PATH}")

if __name__ == '__main__':
    main()
