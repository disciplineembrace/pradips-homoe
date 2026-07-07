#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parse 5 new Materia Medica PDFs into remedy entries:
1. Allen's Key Notes (552 pages) — bullet-point keynotes per remedy
2. Boeger Synoptic Key (1372 pages) — synoptic format with rubric-style entries
3. Clinical Materia Medica - Farrington (837 pages) — lecture-style
4. K.N. Mathur Systematic MM (735 pages) — systematic with indications
5. Soul of Remedies - Sankaran (416 pages) — soul/essence style

Each book has a different format, so we use a generic approach:
- Find remedy headings (bold/all-caps or title-case names)
- Extract body text between headings
- Store as remedy entries with author = book name
"""
import fitz, re, json
from pathlib import Path

UPLOAD = Path("/home/z/my-project/upload")
OUT_DIR = Path("/home/z/my-project/scripts")

def extract_text(pdf_path):
    doc = fitz.open(str(pdf_path))
    full = "\n".join(p.get_text() for p in doc if p.get_text().strip())
    return doc, full

def make_id(name, prefix):
    s = re.sub(r'[^a-z0-9]+','-', name.lower()).strip('-')
    return f"{prefix}-{s}"

def title_case(name):
    parts = name.split()
    return ' '.join(p.capitalize() for p in parts)

# =====================================================================
# 1. ALLEN'S KEY NOTES
# =====================================================================
def parse_allen():
    PDF = UPLOAD / "6 Allen's Key Notes 10th Edition.pdf"
    doc, full = extract_text(PDF)
    print(f"\n=== Allen's Key Notes: {len(doc)} pages, {len(full):,} chars ===")
    
    # Allen's format: remedy name as heading (Title Case or ALL CAPS on its own line)
    # followed by bullet points with symptoms
    # Headings are typically short remedy names like "Arnica montana", "Belladonna"
    
    # Find headings — lines that are a remedy name (1-3 words, Title Case, short)
    # Skip first 20 pages (TOC/intro)
    lines = full.split('\n')
    headings = []  # (line_index, name)
    
    # Known section names to skip
    SKIP = {'Constitution', 'Modalities', 'Relationships', 'Fever', 'Mind', 'Head', 
            'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat', 'Stomach', 'Abdomen',
            'Rectum', 'Stool', 'Urine', 'Male', 'Female', 'Respiratory', 'Chest',
            'Heart', 'Back', 'Extremities', 'Sleep', 'Skin', 'Worse', 'Better',
            'Compare', 'Dose', 'Antidote', 'Complementary', 'Caution'}
    
    for i, line in enumerate(lines):
        s = line.strip()
        if not s or len(s) < 4 or len(s) > 50:
            continue
        # Check if it looks like a remedy name (Title Case, 1-3 words)
        words = s.split()
        if len(words) > 3: continue
        # All words should start with uppercase
        if not all(w[0].isupper() for w in words if w): continue
        # Skip known section names
        if s in SKIP: continue
        # Skip if contains digits or special chars
        if re.search(r'[\d\(\)\[\]\{\}]', s): continue
        # Skip common English words
        if s.lower() in {'the','and','for','with','from','this','that','page','chapter','notes','key'}: continue
        # Must be on its own line (surrounded by empty lines or start/end)
        prev_empty = i == 0 or not lines[i-1].strip()
        next_empty = i == len(lines)-1 or not lines[i+1].strip() or lines[i+1].strip().startswith('•')
        if prev_empty and (next_empty or (i+1 < len(lines) and lines[i+1].strip().startswith('•'))):
            headings.append((i, s))
    
    # Deduplicate
    seen = set()
    unique = []
    for idx, name in headings:
        key = name.lower()
        if key in seen: continue
        seen.add(key)
        unique.append((idx, name))
    
    print(f"  Headings found: {len(unique)}")
    
    # Extract bodies
    remedies = []
    for i, (line_idx, name) in enumerate(unique):
        next_idx = unique[i+1][0] if i+1 < len(unique) else len(lines)
        body = '\n'.join(lines[line_idx+1:next_idx]).strip()
        if len(body) < 50: continue
        
        name_t = title_case(name)
        letter = name_t[0].upper()
        keynote = body[:280].rsplit(' ',1)[0] + ('…' if len(body)>280 else '')
        
        remedies.append({
            'id': make_id(name_t, 'allen'), 'name': name_t, 'common': '', 'author': 'Allen',
            'letter': letter, 'chapter': 'Key Notes', 'organ': '—',
            'modalities': 'See full text.', 'constitution': body[:300],
            'relationships': '—', 'dose': '', 'keynote': keynote, 'full': body
        })
    
    print(f"  Remedies: {len(remedies)}")
    if remedies:
        json.dump(remedies, open(OUT_DIR / 'allen_mm_remedies.json', 'w'), ensure_ascii=False, indent=2)
        print(f"  First 5: {[r['name'] for r in remedies[:5]]}")
    return remedies

# =====================================================================
# 2. BOEGER SYNOPTIC KEY
# =====================================================================
def parse_boeger():
    PDF = UPLOAD / "Boeger Synoptic Key Materia Medica.pdf"
    doc, full = extract_text(PDF)
    print(f"\n=== Boeger Synoptic Key: {len(doc)} pages, {len(full):,} chars ===")
    
    # Boeger's format: remedy name in Title Case at start of section
    # Skip first 20 pages (TOC)
    lines = full.split('\n')
    
    # Find remedy headings — short Title Case names followed by page-like content
    headings = []
    SKIP = {'Constitution', 'Modalities', 'Description', 'Symptoms', 'CLIMACTERIC',
            'SLIGHT CAUSES', 'Emotions', 'Heat', 'Close Room'}
    
    for i, line in enumerate(lines):
        s = line.strip()
        if not s or len(s) < 4 or len(s) > 60: continue
        # Boeger uses Title Case remedy names
        words = s.split()
        if len(words) > 4: continue
        if not all(w[0].isupper() or w[0].isdigit() for w in words if w): continue
        if s in SKIP: continue
        if re.search(r'[\(\)\[\]\{\}]', s): continue
        # Check it's not a section heading (which tend to be ALL CAPS)
        if s.isupper() and len(s) > 10: continue
        # Check surrounding context
        if i > 0 and lines[i-1].strip() and not lines[i-1].strip().isdigit(): continue
        if i == 0 or not lines[i-1].strip() or lines[i-1].strip().isdigit():
            headings.append((i, s))
    
    seen = set()
    unique = []
    for idx, name in headings:
        key = name.lower()
        if key in seen: continue
        seen.add(key)
        unique.append((idx, name))
    
    print(f"  Headings found: {len(unique)}")
    
    remedies = []
    for i, (line_idx, name) in enumerate(unique):
        next_idx = unique[i+1][0] if i+1 < len(unique) else len(lines)
        body = '\n'.join(lines[line_idx+1:next_idx]).strip()
        if len(body) < 100: continue
        
        name_t = title_case(name)
        letter = name_t[0].upper()
        keynote = body[:280].rsplit(' ',1)[0] + ('…' if len(body)>280 else '')
        
        remedies.append({
            'id': make_id(name_t, 'boeger'), 'name': name_t, 'common': '', 'author': 'Boeger',
            'letter': letter, 'chapter': 'Synoptic Key', 'organ': '—',
            'modalities': 'See full text.', 'constitution': body[:300],
            'relationships': '—', 'dose': '', 'keynote': keynote, 'full': body
        })
    
    print(f"  Remedies: {len(remedies)}")
    if remedies:
        json.dump(remedies, open(OUT_DIR / 'boeger_mm_remedies.json', 'w'), ensure_ascii=False, indent=2)
        print(f"  First 5: {[r['name'] for r in remedies[:5]]}")
    return remedies

# =====================================================================
# 3. FARRINGTON CLINICAL MM
# =====================================================================
def parse_farrington():
    PDF = UPLOAD / "Clinical Materia Medica - E.A. Farrington.pdf"
    doc, full = extract_text(PDF)
    print(f"\n=== Farrington Clinical MM: {len(doc)} pages, {len(full):,} chars ===")
    
    # Farrington's format: remedy names as ALL CAPS headings in lecture style
    # Skip first 20 pages (preface/intro)
    # Find ALL CAPS headings that are remedy names
    heading_re = re.compile(r'(?m)^\s*([A-Z][A-Z\s\-]{3,40}[A-Z])\s*$', re.MULTILINE)
    
    # Search only after page 20
    start_idx = 0
    for i in range(20, len(doc)):
        t = doc[i].get_text()
        if 'INTRODUCTORY' in t or 'PREFACE' in t:
            continue
        start_idx = sum(len(doc[j].get_text()) + 1 for j in range(i))
        break
    
    search_text = full[start_idx:]
    headings = []
    for m in heading_re.finditer(search_text):
        name = m.group(1).strip()
        if len(name) < 4 or len(name) > 50: continue
        # Skip non-remedy ALL CAPS (section names, etc.)
        SKIP = {'PREFACE','INTRODUCTORY','CONTENTS','INDEX','CHAPTER','PART',
                'MIND','HEAD','EYES','CHEST','STOMACH','SKIN','FEVER','SLEEP',
                'HYMENOPTERA','SERPENTES','SPIDER','SNAKE','FUNGI','LILIACEAE',
                'RANUNCULACEAE','LOGANIACEAE','NATURAL ORDER','NOSODES'}
        if name in SKIP: continue
        # Must have 1-4 words
        if len(name.split()) > 4: continue
        headings.append((start_idx + m.start(), start_idx + m.end(), name))
    
    # Deduplicate
    seen = set()
    unique = []
    for s, e, n in headings:
        k = n.upper()
        if k in seen: continue
        seen.add(k)
        unique.append((s, e, n))
    
    print(f"  Headings found: {len(unique)}")
    
    remedies = []
    for i, (start, end, name) in enumerate(unique):
        next_start = unique[i+1][0] if i+1 < len(unique) else len(full)
        body = full[end:next_start].strip()
        if len(body) < 200: continue
        
        name_t = title_case(name)
        letter = name_t[0].upper()
        keynote = body[:280].rsplit(' ',1)[0] + ('…' if len(body)>280 else '')
        
        remedies.append({
            'id': make_id(name_t, 'farrington'), 'name': name_t, 'common': '', 'author': 'Farrington',
            'letter': letter, 'chapter': 'Clinical MM', 'organ': '—',
            'modalities': 'See full text.', 'constitution': body[:300],
            'relationships': '—', 'dose': '', 'keynote': keynote, 'full': body
        })
    
    print(f"  Remedies: {len(remedies)}")
    if remedies:
        json.dump(remedies, open(OUT_DIR / 'farrington_mm_remedies.json', 'w'), ensure_ascii=False, indent=2)
        print(f"  First 5: {[r['name'] for r in remedies[:5]]}")
    return remedies

# =====================================================================
# 4. K.N. MATHUR SYSTEMATIC MM
# =====================================================================
def parse_mathur():
    PDF = UPLOAD / "K N mathur..... materia medica.pdf"
    doc, full = extract_text(PDF)
    print(f"\n=== Mathur Systematic MM: {len(doc)} pages, {len(full):,} chars ===")
    
    # Mathur's format: remedy names in Title Case as headings
    # Skip first 20 pages
    lines = full.split('\n')
    
    headings = []
    SKIP = {'Indications', 'Affinities', 'Complaints', 'Characteristics',
            'Constitution', 'Modalities', 'Relationships', 'Mind', 'Head'}
    
    for i, line in enumerate(lines):
        s = line.strip()
        if not s or len(s) < 4 or len(s) > 50: continue
        words = s.split()
        if len(words) > 4: continue
        if not all(w[0].isupper() or w[0].isdigit() for w in words if w): continue
        if s in SKIP: continue
        if re.search(r'[\(\)\[\]\{\}\d]', s): continue
        if s.lower() in {'foreword','preface','contents','chapter','introduction'}: continue
        # Check if previous line is empty or a page number
        if i > 0:
            prev = lines[i-1].strip()
            if prev and not prev.isdigit(): continue
        headings.append((i, s))
    
    seen = set()
    unique = []
    for idx, name in headings:
        key = name.lower()
        if key in seen: continue
        seen.add(key)
        unique.append((idx, name))
    
    print(f"  Headings found: {len(unique)}")
    
    remedies = []
    for i, (line_idx, name) in enumerate(unique):
        next_idx = unique[i+1][0] if i+1 < len(unique) else len(lines)
        body = '\n'.join(lines[line_idx+1:next_idx]).strip()
        if len(body) < 100: continue
        
        name_t = title_case(name)
        letter = name_t[0].upper()
        keynote = body[:280].rsplit(' ',1)[0] + ('…' if len(body)>280 else '')
        
        remedies.append({
            'id': make_id(name_t, 'mathur'), 'name': name_t, 'common': '', 'author': 'Mathur',
            'letter': letter, 'chapter': 'Systematic MM', 'organ': '—',
            'modalities': 'See full text.', 'constitution': body[:300],
            'relationships': '—', 'dose': '', 'keynote': keynote, 'full': body
        })
    
    print(f"  Remedies: {len(remedies)}")
    if remedies:
        json.dump(remedies, open(OUT_DIR / 'mathur_mm_remedies.json', 'w'), ensure_ascii=False, indent=2)
        print(f"  First 5: {[r['name'] for r in remedies[:5]]}")
    return remedies

# =====================================================================
# 5. SANKARAN SOUL OF REMEDIES
# =====================================================================
def parse_sankaran():
    PDF = UPLOAD / "The Soul of Remedies - Rajan Sankaran(New).pdf"
    doc, full = extract_text(PDF)
    print(f"\n=== Sankaran Soul of Remedies: {len(doc)} pages, {len(full):,} chars ===")
    
    # Sankaran's format: remedy name as heading, followed by essence/soul description
    # Headings appear as Title Case names
    lines = full.split('\n')
    
    headings = []
    for i, line in enumerate(lines):
        s = line.strip()
        if not s or len(s) < 3 or len(s) > 40: continue
        words = s.split()
        if len(words) > 3: continue
        # Title Case check
        if not all(w[0].isupper() for w in words if w): continue
        if re.search(r'[\d\(\)\[\]\{\}]', s): continue
        # Skip common words
        if s.lower() in {'the','soul','remedies','about','writer','page','chapter',
                         'foreword','preface','contents','introduction','mind','head'}: continue
        # Must be preceded by empty line or page number
        if i > 0:
            prev = lines[i-1].strip()
            if prev and not prev.isdigit() and 'Soul of Remedies' not in prev: continue
        # Must be followed by content (not another heading)
        if i+1 < len(lines) and lines[i+1].strip() and len(lines[i+1].strip()) > 10:
            headings.append((i, s))
    
    seen = set()
    unique = []
    for idx, name in headings:
        key = name.lower()
        if key in seen: continue
        seen.add(key)
        unique.append((idx, name))
    
    print(f"  Headings found: {len(unique)}")
    
    remedies = []
    for i, (line_idx, name) in enumerate(unique):
        next_idx = unique[i+1][0] if i+1 < len(unique) else len(lines)
        body = '\n'.join(lines[line_idx+1:next_idx]).strip()
        # Remove "The Soul of Remedies" page headers
        body = re.sub(r'The Soul of Remedies\s+\d+\s*', '', body)
        if len(body) < 100: continue
        
        name_t = title_case(name)
        letter = name_t[0].upper()
        keynote = body[:280].rsplit(' ',1)[0] + ('…' if len(body)>280 else '')
        
        remedies.append({
            'id': make_id(name_t, 'sankaran'), 'name': name_t, 'common': '', 'author': 'Sankaran',
            'letter': letter, 'chapter': 'Soul of Remedies', 'organ': '—',
            'modalities': 'See full text.', 'constitution': body[:300],
            'relationships': '—', 'dose': '', 'keynote': keynote, 'full': body
        })
    
    print(f"  Remedies: {len(remedies)}")
    if remedies:
        json.dump(remedies, open(OUT_DIR / 'sankaran_mm_remedies.json', 'w'), ensure_ascii=False, indent=2)
        print(f"  First 5: {[r['name'] for r in remedies[:5]]}")
    return remedies

# =====================================================================
# MAIN
# =====================================================================
if __name__ == "__main__":
    allen = parse_allen()
    boeger = parse_boeger()
    farrington = parse_farrington()
    mathur = parse_mathur()
    sankaran = parse_sankaran()
    
    total = len(allen) + len(boeger) + len(farrington) + len(mathur) + len(sankaran)
    print(f"\n{'='*50}")
    print(f"TOTAL new remedies from 5 books: {total}")
    print(f"  Allen:       {len(allen)}")
    print(f"  Boeger:      {len(boeger)}")
    print(f"  Farrington:  {len(farrington)}")
    print(f"  Mathur:      {len(mathur)}")
    print(f"  Sankaran:    {len(sankaran)}")
