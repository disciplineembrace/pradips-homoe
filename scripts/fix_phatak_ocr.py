#!/usr/bin/env python3
"""
Fix OCR errors in existing Phatak Materia Medica data.

The existing data has 420 complete remedies, but some have OCR character
recognition errors from the original Tesseract OCR:
  - BLoop → BLOOD
  - Hrap → HEAD
  - CoLp → COLD
  - LarcE → LARGE
  - etc.

This script fixes these errors without changing the content structure.
"""
import json
import re
import os
from datetime import datetime
import shutil

REMEDIES_FILE = "/home/z/my-project/data/remedies.json"
BACKUP_DIR = "/home/z/my-project/data/backups"

# OCR error patterns — (pattern, replacement)
# These are specific errors found in the Phatak OCR output
OCR_FIXES = [
    # Capital letter OCR errors (common in Tesseract with small caps)
    (r'\bBLoop\b', 'BLOOD'),
    (r'\bHrap\b', 'HEAD'),
    (r'\bCoLp\b', 'COLD'),
    (r'\bLarcE\b', 'LARGE'),
    (r'\bHarD\b', 'HARD'),
    (r'\bDiaTaTIon\b', 'DILATATION'),
    (r'\bBatuinac\b', 'BATHING'),
    (r'\bExzErTION\b', 'EXERTION'),
    (r'\bMrxk\b', 'MILK'),
    (r'\bCotpNgss\b', 'COLDNESS'),
    (r'\bCo tp\b', 'COLD'),
    (r'\bSouR\b', 'SOUR'),
    (r'\bSwEAT\b', 'SWEAT'),
    (r'\bINg\b', 'ING'),  # Only if standalone
    
    # Word-break artifacts from OCR (hyphenated across lines)
    (r'chil-\s+dren', 'children'),
    (r'Dur-\s+ing', 'During'),
    (r'indiges-\s+tible', 'indigestible'),
    (r'appe-\s+tite', 'appetite'),
    (r'pal-\s+pitation', 'palpitation'),
    (r'cas-\s+es', 'cases'),
    (r'frec-\s+quently', 'frequently'),
    (r'symp-\s+toms', 'symptoms'),
    
    # Fix "It alt" → "It alters" (truncated word)
    (r'It alt\b(?!ers)', 'It alters'),
]


def fix_ocr_errors(text):
    """Apply all OCR fixes to a text string."""
    if not text:
        return text
    fixed = text
    for pattern, replacement in OCR_FIXES:
        fixed = re.sub(pattern, replacement, fixed)
    return fixed


def main():
    print("=" * 70)
    print("FIX OCR ERRORS IN PHATAK MATERIA MEDICA")
    print("=" * 70)

    # Load remedies
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        remedies = json.load(f)
    
    # Count Phatak remedies
    phatak = [r for r in remedies if r.get('author') == 'Phatak']
    print(f"Phatak remedies: {len(phatak)}")
    
    # Backup
    os.makedirs(BACKUP_DIR, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    backup = os.path.join(BACKUP_DIR, f"remedies-{ts}.json")
    shutil.copy2(REMEDIES_FILE, backup)
    print(f"Backed up to: {backup}")
    
    # Fix OCR errors
    fixed_count = 0
    for r in remedies:
        if r.get('author') != 'Phatak':
            continue
        
        changed = False
        for field in ['full', 'keynote', 'common', 'modalities', 'constitution',
                       'relationships', 'dose']:
            if r.get(field):
                original = r[field]
                fixed = fix_ocr_errors(original)
                if fixed != original:
                    r[field] = fixed
                    changed = True
        
        if changed:
            fixed_count += 1
    
    print(f"Remedies with OCR errors fixed: {fixed_count}")
    
    # Write fixed data
    with open(REMEDIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    
    file_size = os.path.getsize(REMEDIES_FILE)
    print(f"Written: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")
    
    # Verify
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        verify = json.load(f)
    verify_phatak = [r for r in verify if r.get('author') == 'Phatak']
    print(f"\nVerification: {len(verify_phatak)} Phatak remedies loaded")
    print(f"Total remedies: {len(verify)}")
    
    # Check specific fixes
    calc = next((r for r in verify_phatak if 'calcarea carb' in r.get('name', '').lower()), None)
    if calc:
        has_bloop = 'BLoop' in calc.get('full', '')
        has_blood = 'BLOOD' in calc.get('full', '')
        print(f"\nCalcarea Carbonica:")
        print(f"  'BLoop' present: {has_bloop} (should be False)")
        print(f"  'BLOOD' present: {has_blood} (should be True)")
        if has_blood:
            idx = calc['full'].index('BLOOD')
            print(f"  Context: ...{calc['full'][max(0,idx-30):idx+40]}...")
    
    print("\n" + "=" * 70)
    print("✅ OCR ERRORS FIXED")
    print("=" * 70)


if __name__ == '__main__':
    main()
