#!/usr/bin/env python3
"""
Boericke source parser — extracts remedy entries from the Pocket Manual
of Homoeopathic Materia Medica (William Boericke) text extract.

Source: /data/sources/extracted/boericke.txt (from pdftotext)
Output: /data/boericke-source-remedies.json (structured remedies)

Structure of Boericke entries:
- Remedy name in ALL CAPS, centered (lots of leading whitespace)
- Common name(s) in Title Case on next line(s)
- Body text with section headers like:
  Head.––
  Eyes.––
  Stomach.––
  Modalities.––
  Relationship.––
  Dose.––
- Page numbers and "Similibis India" watermark scattered throughout

This parser:
1. Detects remedy boundaries by ALL-CAPS centered titles
2. Strips page-number lines and watermarks
3. Preserves the section header format (Word.––)
4. Outputs records matching the production remedies.json schema

NEVER fabricates content. NEVER paraphrases. Source text is preserved
exactly as extracted by pdftotext.
"""
import json
import re
import os
from pathlib import Path

SRC = '/home/z/my-project/data/sources/extracted/boericke.txt'
OUT = '/home/z/my-project/data/boericke-source-remedies.json'

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()
    
    lines = text.split('\n')
    print(f"Loaded {len(lines)} lines from {SRC}")
    
    # Step 1: Clean lines — remove watermarks, page numbers, empty lines
    cleaned = []
    for line in lines:
        s = line.rstrip()
        # Skip watermarks
        if s.strip() == 'Similibis India':
            continue
        # Skip page-number-only lines
        if re.match(r'^\s*\d+\s*$', s):
            continue
        cleaned.append(s)
    
    # Step 2: Detect remedy boundaries
    # Boericke remedy titles are ALL CAPS, centered (≥20 spaces of indent),
    # and contain only letters, spaces, and occasionally hyphens
    REMEDY_TITLE = re.compile(r'^\s{15,}([A-Z][A-Z\s\-\.]{2,50})\s*$')
    
    remedies = []
    current_remedy = None
    current_lines = []
    
    def save_current():
        nonlocal current_remedy, current_lines
        if current_remedy and current_lines:
            # Join lines, collapse multiple blanks
            full = '\n'.join(current_lines).strip()
            # Remove leading/trailing blank lines
            full = re.sub(r'\n{3,}', '\n\n', full)
            if len(full) > 30:
                current_remedy['full'] = full
                # Extract keynote (first non-empty line, max 500 chars)
                first_para = full.split('\n\n')[0] if '\n\n' in full else full[:500]
                current_remedy['keynote'] = first_para[:500]
                remedies.append(current_remedy)
        current_remedy = None
        current_lines = []
    
    for i, line in enumerate(cleaned):
        m = REMEDY_TITLE.match(line)
        if m:
            title = m.group(1).strip()
            # Filter out false positives (common section words in caps)
            if title in {'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE',
                'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM',
                'STOOL', 'URINARY', 'GENITALS', 'MALE', 'FEMALE',
                'RESPIRATORY', 'CHEST', 'HEART', 'BACK', 'EXTREMITIES',
                'SKIN', 'SLEEP', 'FEVER', 'MODALITIES', 'RELATIONSHIP',
                'DOSE', 'PREFACE', 'INDEX', 'CHAPTER', 'CONTENTS'}:
                continue
            # Must be at least 3 chars and have at least one alphabetic char
            if len(title) < 3 or not any(c.isalpha() for c in title):
                continue
            # Skip if it's likely a heading (all words are common English)
            words = title.split()
            if len(words) > 5:
                continue
            
            save_current()
            
            # Normalize name to Title Case
            name = title.title()
            # Fix common Latin abbreviations
            name = name.replace('Sulphur', 'Sulphur')
            # Build ID
            remedy_id = 'boericke-mm-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            
            current_remedy = {
                'id': remedy_id,
                'name': name,
                'common': '',
                'author': 'Boericke',
                'letter': name[0].upper() if name else '?',
                'chapter': 'Boericke MM',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
            }
            current_lines = []
        else:
            if current_remedy:
                # If this is the first line after the title, treat as common name
                # (if it's short and Title Case)
                if not current_lines and line.strip():
                    s = line.strip()
                    if (len(s) < 60 and
                        s.istitle() and
                        not s.endswith('.') and
                        not s.endswith(',')):
                        current_remedy['common'] = s
                        continue
                current_lines.append(line)
    
    save_current()
    
    print(f"\nParsed {len(remedies)} remedies from Boericke source")
    if remedies:
        print(f"\nFirst 5 remedies:")
        for r in remedies[:5]:
            print(f"  - {r['name']} (common: {r.get('common', '—')}, full len: {len(r.get('full', ''))})")
        print(f"\nLast 3 remedies:")
        for r in remedies[-3:]:
            print(f"  - {r['name']} (full len: {len(r.get('full', ''))})")
    
    # Write output
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")
    
    # Compare with production
    with open('/home/z/my-project/data/remedies.json') as f:
        prod = json.load(f)
    prod_boericke = [r for r in prod if r.get('author') == 'Boericke']
    prod_names = {r['name'].lower() for r in prod_boericke}
    src_names = {r['name'].lower() for r in remedies}
    
    missing = src_names - prod_names
    extra = prod_names - src_names
    print(f"\n=== BOERICKE SOURCE vs PRODUCTION ===")
    print(f"Source remedies: {len(remedies)}")
    print(f"Production remedies: {len(prod_boericke)}")
    print(f"Missing from production (in source, not in prod): {len(missing)}")
    if missing:
        print(f"  Sample missing: {list(missing)[:10]}")
    print(f"Extra in production (in prod, not in source): {len(extra)}")
    if extra:
        print(f"  Sample extra: {list(extra)[:10]}")

if __name__ == '__main__':
    main()
