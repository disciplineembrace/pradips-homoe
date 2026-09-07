#!/usr/bin/env python3
"""
Complete OCR + Parse pipeline for Phatak Biochemic Repertory.
Runs OCR on all 394 pages in parallel, then parses rubrics.
"""
import os, json, re, subprocess, sys
from concurrent.futures import ProcessPoolExecutor, as_completed
from collections import Counter

PAGES_DIR = '/tmp/phatak-biochem-pages'
OCR_DIR = '/tmp/phatak-biochem-ocr'
CACHE_FILE = '/tmp/phatak-biochem-ocr-all.txt'
OUTPUT_JSON = '/home/z/my-project/data/phatak-biochem-repertory.json'

REMEDY_MAP = {
    'CF': 'Calcarea Fluor', 'CP': 'Calcarea Phos', 'CS': 'Calcarea Sulph',
    'FP': 'Ferrum Phos', 'KM': 'Kali Mur', 'KP': 'Kali Phos',
    'KS': 'Kali Sulph', 'MP': 'Magnesia Phos', 'NM': 'Nat Mur',
    'NP': 'Nat Phos', 'NS': 'Nat Sulph', 'SIL': 'Silicea',
}
REMEDY_RE = re.compile(r'\b(CF|CP|CS|FP|KM|KP|KS|MP|NM|NP|NS|SIL)\b', re.I)

def ocr_page(page_file):
    page_path = os.path.join(PAGES_DIR, page_file)
    page_num = page_file.replace('page-', '').replace('.png', '')
    out_path = os.path.join(OCR_DIR, f'page-{page_num}.txt')
    if os.path.exists(out_path) and os.path.getsize(out_path) > 10:
        return page_num, True
    try:
        result = subprocess.run(['tesseract', page_path, '-', '--psm', '6'],
            capture_output=True, text=True, timeout=30)
        with open(out_path, 'w') as f:
            f.write(result.stdout)
        return page_num, True
    except:
        return page_num, False

def parse_remedies(text):
    if not text: return []
    text = re.sub(r'\(See[^)]*\)', '', text)
    remedies, seen = [], set()
    for m in REMEDY_RE.finditer(text):
        abbrev = m.group(1).upper()
        if abbrev == 'SIL': abbrev = 'SIL'
        if abbrev in REMEDY_MAP and abbrev not in seen:
            seen.add(abbrev)
            remedies.append({'abbrev': abbrev, 'fullName': REMEDY_MAP[abbrev], 'grade': 3})
    return remedies

def parse_repertory(text):
    rubrics = []
    # Find repertory start
    rep_start = text.find('ABDOMEN')
    if rep_start == -1:
        rep_start = text.find('--- PAGE 11 ---')
        if rep_start == -1: rep_start = 0
    rep_end = text.find('INDEX', rep_start + 10000)
    if rep_end == -1: rep_end = len(text)
    
    rep_text = text[rep_start:rep_end]
    lines = rep_text.split('\n')
    
    current_chapter = 'Mind'
    current_main = None
    count = 0
    chapter_re = re.compile(r'^[A-Z][A-Z\s]{2,30}$')
    rubric_re = re.compile(r'^([A-Z][a-zA-Z\s,\-\(\)/\&\']+?):\s*(.*)$')
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        if not line or line.startswith('--- PAGE'):
            i += 1; continue
        
        # Chapter header
        if chapter_re.match(line) and len(line) < 30 and line.upper() == line:
            if not REMEDY_RE.match(line):
                current_chapter = line.strip()
                current_main = None
                i += 1; continue
        
        # Rubric with colon
        m = rubric_re.match(line)
        if m and current_chapter:
            name = m.group(1).strip()
            rem_str = m.group(2).strip()
            if len(name) < 3 or len(name) > 100 or name.upper() in REMEDY_MAP:
                i += 1; continue
            
            # Collect continuation
            full = rem_str
            j = i + 1
            while j < len(lines):
                nl = lines[j].strip()
                if (nl and not nl.startswith('--- PAGE') and not chapter_re.match(nl)
                    and not rubric_re.match(nl) and (REMEDY_RE.search(nl) or nl.startswith(';') or nl.startswith(','))):
                    full += ' ' + nl; j += 1
                    if j - i > 5: break
                else: break
            
            remedies = parse_remedies(full)
            if remedies and len(name) > 3:
                rid = f'phatak-biochem-{current_chapter.lower().replace(" ","-")}-{count+1}'
                rubrics.append({
                    'id': rid, 'path': current_chapter, 'title': name,
                    'author': 'Phatak Biochemic', 'remedies': [r['abbrev'] for r in remedies],
                    'remedyDetails': remedies, 'chapter': current_chapter,
                })
                current_main = name; count += 1
            i = j; continue
        i += 1
    return rubrics

def main():
    os.makedirs(OCR_DIR, exist_ok=True)
    
    # Check cache
    if os.path.exists(CACHE_FILE) and os.path.getsize(CACHE_FILE) > 1000:
        print("Using cached OCR text")
        with open(CACHE_FILE) as f:
            all_text = f.read()
    else:
        pages = sorted(f for f in os.listdir(PAGES_DIR) if f.endswith('.png'))
        print(f"OCR: {len(pages)} pages, 4 workers...")
        done = sum(1 for f in pages if os.path.exists(os.path.join(OCR_DIR, f.replace('.png','.txt'))) and os.path.getsize(os.path.join(OCR_DIR, f.replace('.png','.txt'))) > 10)
        todo = [f for f in pages if f not in [p.replace('.txt','.png') for p in os.listdir(OCR_DIR) if os.path.getsize(os.path.join(OCR_DIR, p)) > 10]]
        print(f"  Already done: {done}, Remaining: {len(todo)}")
        
        if todo:
            with ProcessPoolExecutor(max_workers=4) as executor:
                futures = {executor.submit(ocr_page, p): p for p in todo}
                for i, future in enumerate(as_completed(futures)):
                    future.result()
                    if (i+1) % 50 == 0:
                        print(f"    {i+1}/{len(todo)} pages OCR'd")
        
        # Combine
        print("Combining OCR text...")
        all_text = ''
        for i in range(1, 395):
            p = f'{i:03d}'
            path = os.path.join(OCR_DIR, f'page-{p}.txt')
            if os.path.exists(path):
                with open(path) as f:
                    all_text += f'\n--- PAGE {i} ---\n' + f.read()
        with open(CACHE_FILE, 'w') as f:
            f.write(all_text)
        print(f"  Total: {len(all_text):,} chars")
    
    # Parse
    print("Parsing rubrics...")
    rubrics = parse_repertory(all_text)
    print(f"  Total rubrics: {len(rubrics)}")
    
    cc = Counter(r['path'] for r in rubrics)
    print("  By chapter:")
    for ch, cnt in cc.most_common():
        print(f"    {ch}: {cnt}")
    
    print("\n  Samples:")
    for r in rubrics[:5]:
        print(f"    [{r['path']}] {r['title']}: {', '.join(r['remedies'][:5])}")
    
    # Save
    output = {
        'source': 'Phatak bio-chemic repertory.pdf (OCR processed)',
        'author': 'Dr. S. R. Phatak',
        'title': "Phatak's Repertory of the Biochemic Remedies",
        'remedyAbbreviations': REMEDY_MAP,
        'totalRubrics': len(rubrics),
        'chapters': list(cc.keys()),
        'rubrics': rubrics,
    }
    os.makedirs(os.path.dirname(OUTPUT_JSON), exist_ok=True)
    with open(OUTPUT_JSON, 'w') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    print(f"\n✓ Saved: {OUTPUT_JSON} ({os.path.getsize(OUTPUT_JSON):,} bytes)")

if __name__ == '__main__':
    main()
