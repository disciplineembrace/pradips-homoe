#!/usr/bin/env python3
"""
Replace ALL Boericke data in remedies.json with data from unified dataset.

This script:
1. Parses ALL 829 Boericke files from the unified dataset (homoeoint.org)
2. Extracts remedy name, common name, and full content from each file
3. Removes ALL old Boericke entries from remedies.json
4. Adds ALL new Boericke entries from the unified dataset
5. Rebuilds remedies-index.json

Source files:
- books/boericmm/ (718 files, English Materia Medica by William Boericke)
- books/boericke/ (111 files, Norwegian translation)

The English version (boericmm) is the primary source.
The Norwegian version (boericke) supplements remedies not in the English set.
"""
import json
import os
import re
import shutil
from datetime import datetime

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'
INDEX_JSON = '/home/z/my-project/data/remedies-index.json'

BASE_MM = '/home/z/my-project/upload/unified_dataset/books/boericmm'
BASE_KE = '/home/z/my-project/upload/unified_dataset/books/boericke'


def parse_remedy_name(content):
    """Extract remedy name from Boericke file content.
    
    English format: 'ABROTANUM - HOMOEOPATHIC MATERIA MEDICA - By William BOERICKE'
    Also: 'ABIES CANADENSIS - PINUS CANADENSIS - HOMOEOPATHIC'
    Norwegian: 'ABROTANUM Boerickes Materia Medica...'
    """
    # Try pattern: everything before ' - HOM' (simple, matches all variants)
    m = re.match(r'^(.+?)\s+-\s+HOM', content)
    if m:
        name = m.group(1).strip()
        # Handle 'ABIES CANADENSIS - PINUS CANADENSIS' → take first part
        if ' - ' in name:
            parts = name.split(' - ')
            # If second part is also ALL CAPS (Latin name), take first part only
            if len(parts) == 2 and parts[1].replace('-','').isupper():
                name = parts[0].strip()
            # If it's 'ABRUS PRECATORIUS -- JEQUIRITY', take first part
            elif len(parts) == 2 and (parts[1].startswith('--') or parts[1].replace('-','').isupper()):
                name = parts[0].strip()
        return name
    
    # Try Norwegian pattern
    lines = content.strip().split('\n')
    for line in lines[:5]:
        line = line.strip()
        if not line:
            continue
        m = re.match(r'^([A-Z][A-Z\s\-]+?)\s+Boeric', line)
        if m:
            return m.group(1).strip().rstrip('-').strip()
    
    return None


def parse_common_name(content):
    """Extract common name from content."""
    lines = content.strip().split('\n')
    for line in lines[:5]:
        line = line.strip()
        if not line:
            continue
        
        # After the remedy name, look for common name
        # English: 'ABROTANUM Southernwood' → common = 'Southernwood'
        m = re.match(r'^[A-Z][A-Z\s\-]+?\s+([A-Z][a-z][\w\s\-]+)', line)
        if m:
            common = m.group(1).strip()
            # Don't capture 'Boericke', 'Home', 'HOM' as common name
            if any(x in common for x in ['Boeric', 'Home', 'HOM', 'Present', 'Materia']):
                return ''
            # Common names are usually 1-3 words
            if len(common.split()) <= 4 and len(common) <= 50:
                return common
        
        # English: after name + ' - HOMŒOPATHIC MATERIA MEDICA - By William BOERICKE Home HOMŒOPATHIC MATERIA MEDICA by William BOERICKE, M.D. Presented by Médi-T NAME CommonName'
        # Look for the second occurrence of the remedy name followed by common name
        m = re.search(r'Presented by Médi-T\s+([A-Z][A-Z\s\-]+?)\s+([A-Z][a-z][\w\s\-]+)', line)
        if m:
            common = m.group(2).strip()
            if len(common.split()) <= 4 and len(common) <= 50:
                return common
    
    return ''


def parse_boericke_file(filepath):
    """Parse a single Boericke file into a remedy record."""
    with open(filepath, 'r', encoding='utf-8', errors='replace') as f:
        content = f.read()
    
    if not content.strip():
        return None
    
    name = parse_remedy_name(content)
    if not name:
        return None
    
    # Clean up name
    name = name.strip().rstrip('-').strip()
    
    # Convert to Title Case (preserve hyphens)
    name_parts = name.split()
    title_name = ' '.join(
        '-'.join(w.capitalize() if w.isupper() else w for w in part.split('-'))
        for part in name_parts
    )
    
    # Skip non-remedy entries (index pages, preface, etc.)
    SKIP_NAMES_LOWER = {
        'aaa', 'bbb', 'ccc', 'ddd', 'eee', 'fff', 'ggg', 'hhh',
        'iii', 'jjj', 'kkk', 'lll', 'mmm', 'nnn', 'ooo', 'ppp',
        'qqq', 'rrr', 'sss', 'ttt', 'uuu', 'vvv', 'www', 'xxx',
        'yyy', 'zzz',
        'remedies and their abbreviations', 'home homœopathic',
        'home homoeopathic', 'index', 'preface', 'contents',
        'materia medica', 'boericke', 'home',
        'preface to ninth edition',
        'homœopathic materia medica - b',
        'homoeopathic materia medica - b',
        'homéopathe international',
    }
    if title_name.lower() in SKIP_NAMES_LOWER:
        return None
    # Skip 3-letter repeated patterns (AAA, BBB, etc.)
    if len(title_name) == 3 and title_name[0].upper() == title_name[1].upper() == title_name[2].upper():
        return None
    # Skip names starting with 'Preface' or 'Remedies'
    if title_name.lower().startswith(('preface', 'remedies and', 'home hom')):
        return None
    
    # Build slug
    slug = re.sub(r'[^a-z0-9]+', '-', title_name.lower()).strip('-')
    remedy_id = f'boericke-mm-{slug}'
    
    # Get common name
    common = parse_common_name(content)
    
    return {
        'id': remedy_id,
        'name': title_name,
        'common': common,
        'full': content.strip(),
        'source_file': os.path.relpath(filepath, '/home/z/my-project/upload/unified_dataset'),
    }


def main():
    print("=" * 70)
    print("Replace ALL Boericke data with unified dataset")
    print("=" * 70)
    
    # Step 1: Parse ALL Boericke files
    print("\n=== STEP 1: Parse ALL Boericke files ===")
    
    all_remedies = []
    seen_ids = set()
    seen_names = set()
    
    # Parse books/boericmm/ (English — primary source)
    for root, dirs, files in os.walk(BASE_MM):
        for f in sorted(files):
            if not f.endswith('.txt'):
                continue
            
            filepath = os.path.join(root, f)
            rec = parse_boericke_file(filepath)
            if rec is None:
                continue
            
            # Skip duplicates (same name or ID)
            key = rec['name'].lower()
            if key in seen_names or rec['id'] in seen_ids:
                continue
            
            seen_names.add(key)
            seen_ids.add(rec['id'])
            all_remedies.append(rec)
    
    print(f"  Parsed from books/boericmm/ (English): {len(all_remedies)} remedies")
    
    # Parse books/boericke/ (Norwegian — supplement, only add NEW remedies)
    norwegian_count = 0
    for root, dirs, files in os.walk(BASE_KE):
        for f in sorted(files):
            if not f.endswith('.txt'):
                continue
            
            filepath = os.path.join(root, f)
            rec = parse_boericke_file(filepath)
            if rec is None:
                continue
            
            key = rec['name'].lower()
            if key in seen_names or rec['id'] in seen_ids:
                continue
            
            seen_names.add(key)
            seen_ids.add(rec['id'])
            all_remedies.append(rec)
            norwegian_count += 1
    
    print(f"  Parsed from books/boericke/ (Norwegian, additional): {norwegian_count} remedies")
    print(f"  Total unique remedies: {len(all_remedies)}")
    
    # Step 2: Build proper records
    print("\n=== STEP 2: Build remedy records ===")
    new_records = []
    for r in all_remedies:
        rec = {
            'id': r['id'],
            'name': r['name'],
            'common': r['common'],
            'author': 'Boericke',
            'letter': r['name'][0].upper() if r['name'] else '?',
            'chapter': 'Boericke MM',
            'organ': '',
            'modalities': '',
            'constitution': '',
            'relationships': '',
            'dose': '',
            'keynote': '',
            'full': r['full'],
            'intro': '',
            'sections': [],
            'source_book': 'Boericke Materia Medica (homoeoint.org)',
        }
        new_records.append(rec)
    
    print(f"  Built {len(new_records)} remedy records")
    
    # Step 3: Load existing data, remove old Boericke, add new
    print("\n=== STEP 3: Replace old Boericke data ===")
    with open(REMEDIES_JSON) as f:
        remedies = json.load(f)
    print(f"  Loaded {len(remedies):,} total remedies")
    
    before_boericke = sum(1 for r in remedies if r.get('author') == 'Boericke')
    print(f"  Existing Boericke remedies: {before_boericke}")
    
    # Remove ALL old Boericke entries
    remedies = [r for r in remedies if r.get('author') != 'Boericke']
    print(f"  Removed {before_boericke} old Boericke entries")
    
    # Add ALL new Boericke entries
    for rec in new_records:
        remedies.append(rec)
    print(f"  Added {len(new_records)} new Boericke entries")
    
    print(f"  Total remedies now: {len(remedies):,}")
    
    # Step 4: Backup and write
    backup_path = REMEDIES_JSON + f'.backup-boericke-replace-{datetime.now().strftime("%Y%m%d-%H%M%S")}'
    shutil.copy2(REMEDIES_JSON, backup_path)
    print(f"\n  Backup: {backup_path}")
    
    with open(REMEDIES_JSON, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"  Wrote {os.path.getsize(REMEDIES_JSON):,} bytes")
    
    # Step 5: Rebuild index
    print("\n=== STEP 5: Rebuild index ===")
    index = []
    for r in remedies:
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
    print(f"  Rebuilt index: {len(index):,} entries")
    
    # Step 6: Verification
    print("\n=== STEP 6: Verification ===")
    boericke_final = [r for r in remedies if r.get('author') == 'Boericke']
    print(f"  Boericke remedies before: {before_boericke}")
    print(f"  Boericke remedies after: {len(boericke_final)}")
    print(f"  Total all remedies: {len(remedies):,}")
    
    # Check for empty keynote (no duplication)
    empty_kn = sum(1 for r in boericke_final if not r.get('keynote', '').strip())
    print(f"  Empty keynote (no duplication): {empty_kn}/{len(boericke_final)}")
    
    # Show first 10 names
    print(f"\n  First 10 Boericke remedies:")
    for r in boericke_final[:10]:
        print(f"    - {r['name']} (id: {r['id']})")
    
    # Show last 5
    print(f"\n  Last 5 Boericke remedies:")
    for r in boericke_final[-5:]:
        print(f"    - {r['name']} (id: {r['id']})")
    
    print(f"\n{'='*70}")
    print(f"COMPLETE: {before_boericke} old → {len(boericke_final)} new Boericke remedies")
    print(f"{'='*70}")


if __name__ == '__main__':
    main()
