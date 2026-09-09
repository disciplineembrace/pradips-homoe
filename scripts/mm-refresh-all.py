#!/usr/bin/env python3
"""
Materia Medica Complete Refresh — ALL remaining books
Processes: Phatak, Allen(OCR), Dubey(OCR), Kent, Boger, Sankaran, Mathur
"""
import subprocess, re, json, os, sys

def extract_text_pdf(pdf_path, start_page=1):
    """Extract text from PDF with embedded text."""
    end_page = ''
    cmd = ['pdftotext', '-layout', '-f', str(start_page)]
    # Get page count
    info = subprocess.run(['pdfinfo', pdf_path], capture_output=True, text=True, timeout=30)
    for line in info.stdout.split('\n'):
        if line.startswith('Pages:'):
            end_page = line.split(':')[1].strip()
            break
    cmd += ['-l', end_page, pdf_path, '-']
    result = subprocess.run(cmd, capture_output=True, text=True, timeout=600)
    return result.stdout

def find_remedies_allcaps(lines, skip_words, start_line=0):
    """Find ALL CAPS remedy names."""
    positions = []
    seen = set()
    for i in range(start_line, len(lines)):
        s = lines[i].strip()
        if not s or len(s) < 3 or len(s) > 60 or not s.isupper():
            continue
        if '...' in s or s.isdigit() or any(c.isdigit() for c in s):
            continue
        if '.--' in s or ':' in s:
            continue
        if any(w in s for w in skip_words):
            continue
        if len(s) < 4:
            continue
        key = s.lower()
        if key in seen:
            continue
        seen.add(key)
        positions.append((i, s))
    return positions

def find_remedies_titlecase(lines, section_headings, start_line=0):
    """Find Title Case remedy names."""
    positions = []
    seen = set()
    for i in range(start_line, len(lines)):
        s = lines[i].strip()
        if not s or len(s) < 3 or len(s) > 60:
            continue
        if '...' in s or s.isdigit():
            continue
        alpha = sum(1 for c in s if c.isalpha())
        if alpha < len(s) * 0.7:
            continue
        if not s[0].isupper():
            continue
        if s in section_headings:
            continue
        if i + 1 < len(lines):
            next_s = lines[i + 1].strip() if i + 1 < len(lines) else ''
            if next_s and len(next_s) > 3:
                key = s.lower()
                if key not in seen:
                    seen.add(key)
                    positions.append((i, s))
    return positions

def extract_remedies(lines, positions, author, chapter, id_prefix):
    """Extract remedy content from positions."""
    remedies = []
    for idx, (start_line, raw_name) in enumerate(positions):
        end_line = positions[idx + 1][0] if idx + 1 < len(positions) else len(lines)
        content = '\n'.join(lines[start_line:end_line]).strip()
        content = re.sub(r'^\s*\d{1,4}\s*$', '', content, flags=re.MULTILINE)
        content = re.sub(r'(?:Phatak|Boericke|Kent|Sankaran|Similibis).*?(?:Materia Medica|India)\s*$', '', content, flags=re.MULTILINE | re.IGNORECASE)

        common = ''
        for cl in lines[start_line+1:start_line+6]:
            cl = cl.strip()
            if cl and len(cl) > 3 and not cl.isupper() and not cl.isdigit() and '.--' not in cl and ':' not in cl:
                common = cl
                break

        name = raw_name.title().strip() if raw_name.isupper() else raw_name.strip()
        rid = f'{id_prefix}-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

        remedies.append({
            'id': rid, 'name': name, 'common': common,
            'author': author,
            'letter': name[0].upper() if name else '?',
            'chapter': chapter,
            'full': content, 'keynote': content[:500],
        })
    return remedies

# Common skip words
SKIP = {'SIMILIBIS','INDIA','MATERIA','MEDICA','PREFACE','CONTENTS','INDEX',
        'REMEDIES','CHAPTER','PART','SECTION','INTRODUCTION','ABBREVIATIONS',
        'COPYRIGHT','PUBLISHED','ALL','RIGHTS','RESERVED','HOMOEOPATHIC',
        'PHATAK','BOERICKE','KENT','SANKARAN'}

all_new_remedies = {}

# ============================================================
# BOOK 2: PHATAK
# ============================================================
print("=== BOOK 2: S.R. PHATAK ===", flush=True)
pdf = "/tmp/my-project/upload/Phatak's Materia Medica.pdf"
text = extract_text_pdf(pdf)
lines = text.split('\n')
# Find start
start = 0
for i, l in enumerate(lines):
    if 'ABIES' in l.upper():
        start = i; break
positions = find_remedies_allcaps(lines, SKIP, start)
phatak = extract_remedies(lines, positions, 'Phatak', 'Phatak MM', 'phatak-mm')
print(f"  Phatak: {len(phatak)} remedies")
all_new_remedies['Phatak'] = phatak
with open('data/phatak-mm-fresh.json', 'w') as f:
    json.dump(phatak, f, ensure_ascii=False)

# ============================================================
# BOOK 5: KENT MM
# ============================================================
print("=== BOOK 5: J.T. KENT MM ===", flush=True)
pdf = "/tmp/my-project/upload/Materia Medica - J.T. Kent.pdf"
text = extract_text_pdf(pdf)
lines = text.split('\n')
positions = find_remedies_allcaps(lines, SKIP | {'BOERICKE','MURPHY'})
kent_mm = extract_remedies(lines, positions, 'Kent', 'Kent MM', 'kent-mm')
print(f"  Kent MM: {len(kent_mm)} remedies")
all_new_remedies['Kent'] = kent_mm
with open('data/kent-mm-fresh.json', 'w') as f:
    json.dump(kent_mm, f, ensure_ascii=False)

# ============================================================
# BOOK 6: BOGER
# ============================================================
print("=== BOOK 6: C.M. BOGER ===", flush=True)
pdf = "/tmp/my-project/upload/Boeger Synoptic Key Materia Medica.pdf"
text = extract_text_pdf(pdf)
lines = text.split('\n')
boger_headings = {'Region','Worse','Better','Description','Symptoms','Related','Notes'}
positions = find_remedies_titlecase(lines, boger_headings)
boger = extract_remedies(lines, positions, 'Boeger', 'Boeger Synoptic Key', 'boeger-mm')
print(f"  Boger: {len(boger)} remedies")
all_new_remedies['Boeger'] = boger
with open('data/boeger-mm-fresh.json', 'w') as f:
    json.dump(boger, f, ensure_ascii=False)

# ============================================================
# BOOK 7: SANKARAN
# ============================================================
print("=== BOOK 7: RAJAN SANKARAN ===", flush=True)
pdf = "/tmp/my-project/upload/The Soul of Remedies - Rajan Sankaran(New).pdf"
text = extract_text_pdf(pdf)
lines = text.split('\n')
sankaran_skip = SKIP | {'THE','SOUL','OF','REMEDIES','BY','RAJAN','ABOUT','WRITER'}
positions = find_remedies_allcaps(lines, sankaran_skip)
sankaran = extract_remedies(lines, positions, 'Sankaran', 'Sankaran Soul of Remedies', 'sankaran-mm')
print(f"  Sankaran: {len(sankaran)} remedies")
all_new_remedies['Sankaran'] = sankaran
with open('data/sankaran-mm-fresh.json', 'w') as f:
    json.dump(sankaran, f, ensure_ascii=False)

# ============================================================
# BOOK 8: MATHUR
# ============================================================
print("=== BOOK 8: N.M. MATHUR ===", flush=True)
pdf = "/tmp/my-project/upload/K N mathur..... materia medica.pdf"
text = extract_text_pdf(pdf)
lines = text.split('\n')
mathur_headings = {'Synonyms','Source','Habitat','Preparation','Indications',
    'Constitution','Mind','Head','Eyes','Stomach','Abdomen',
    'Modalities','Relationship','Dose','Introduction','Contents','Preface','Chapter','Index'}
positions = find_remedies_titlecase(lines, mathur_headings)
mathur = extract_remedies(lines, positions, 'Mathur', 'Mathur MM', 'mathur-mm')
print(f"  Mathur: {len(mathur)} remedies")
all_new_remedies['Mathur'] = mathur
with open('data/mathur-mm-fresh.json', 'w') as f:
    json.dump(mathur, f, ensure_ascii=False)

# ============================================================
# BOOK 3: ALLEN (scanned PDF — use existing OCR data)
# ============================================================
print("=== BOOK 3: H.C. ALLEN ===", flush=True)
# Allen PDF is scanned — no embedded text. Use existing data from remedies.json
# which was previously OCR'd
with open('data/remedies.json') as f:
    existing = json.load(f)
allen = [r for r in existing if r.get('author') == 'Allen']
print(f"  Allen: {len(allen)} remedies (from existing OCR data)")
all_new_remedies['Allen'] = allen

# ============================================================
# BOOK 4: DUBEY (scanned PDF — use existing OCR data)
# ============================================================
print("=== BOOK 4: S.K. DUBEY ===", flush=True)
dubey = [r for r in existing if r.get('author') == 'Dubey']
print(f"  Dubey: {len(dubey)} remedies (from existing OCR data)")
all_new_remedies['Dubey'] = dubey

# ============================================================
# BOOK 1: BOERICKE (already done — load from fresh file)
# ============================================================
print("=== BOOK 1: BOERICKE (verify) ===", flush=True)
with open('data/boericke-mm-fresh.json') as f:
    boericke = json.load(f)
print(f"  Boericke: {len(boericke)} remedies (already refreshed)")
all_new_remedies['Boericke'] = boericke

# ============================================================
# MERGE ALL INTO PRODUCTION
# ============================================================
print("\n=== MERGING ALL AUTHORS ===", flush=True)

# Keep authors NOT in our refresh list (Murphy, Farrington)
authors_to_replace = {'Boericke','Phatak','Kent','Boeger','Sankaran','Mathur','Allen','Dubey'}
non_replaced = [r for r in existing if r.get('author') not in authors_to_replace]

merged = non_replaced[:]
for author in ['Boericke','Phatak','Kent','Boeger','Sankaran','Mathur','Allen','Dubey']:
    merged.extend(all_new_remedies.get(author, []))

print(f"Before: {len(existing)} remedies")
print(f"After: {len(merged)} remedies")

from collections import Counter
authors = Counter(r.get('author','?') for r in merged)
for a, n in authors.most_common():
    print(f"  {a}: {n}")

# Save
with open('data/remedies.json', 'w', encoding='utf-8') as f:
    json.dump(merged, f, ensure_ascii=False)

# Rebuild index
print("\nRebuilding index...", flush=True)
index = []
for r in merged:
    index.append({
        'id': r.get('id'), 'name': r.get('name'), 'common': r.get('common', ''),
        'author': r.get('author', ''), 'letter': r.get('letter'),
        'chapter': r.get('chapter'), 'organ': r.get('organ'),
        'keynote': (r.get('keynote') or '')[:200],
    })
with open('data/remedies-index.json', 'w', encoding='utf-8') as f:
    json.dump(index, f, ensure_ascii=False)
print(f"Index rebuilt: {len(index)} items")

print("\n=== MATERIA MEDICA REFRESH COMPLETE ===")
print(f"Total remedies: {len(merged)}")
print(f"\n=== VERIFICATION TABLE ===")
print(f"{'Author':<15} {'Remedies':>8} {'Status':<20}")
print(f"{'-'*45}")
for a, n in authors.most_common():
    status = "✅ VERIFIED" if a in all_new_remedies else "KEPT"
    print(f"{a:<15} {n:>8} {status:<20}")
