#!/usr/bin/env python3
"""
Murphy Repertory — Complete Parser from OCR'd pages.

Parses OCR text into structured rubrics with:
- Chapter detection (74 chapters)
- Rubric detection (ALL CAPS headings)
- Sub-rubric detection (indented with - or *)
- Remedy parsing with grade detection
- Unique IDs for fast search
- Alphabetical ordering

Murphy's format (from source):
  Chapter heading: "Abdomen" (centered, Title Case)
  Rubric: "ABSCESS, abdomen" (ALL CAPS)
  Sub-rubric: "left, side - croc." (indented)
  Sub-sub-rubric: deeper indent
  Remedies after " - " separator

Grade detection:
  ALL CAPS (BELL.) = Grade 4 (bold-capitals) → RED
  Title Case (Bell.) = Grade 3 (bold) → GREEN
  Lowercase (bell.) = Grade 1 (plain) → BLACK
"""
import json
import os
import re
import glob
import subprocess
from collections import Counter

OUT_FILE = '/home/z/my-project/data/murphy_rebuilt.json'
PAGES_DIR = '/tmp/murphy-rep-pages'
PDF_PARTS = [
    '/tmp/my-project/upload/Medical_Repertory_Part1-1.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part2.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part3.pdf',
]

# Complete 74 Murphy chapters
MURPHY_CHAPTERS = [
    'Abdomen', 'Ankles', 'Arms', 'Back', 'Bladder', 'Blood', 'Bones',
    'Brain', 'Breasts', 'Breathing', 'Chest', 'Children', 'Chills',
    'Clinical', 'Constitutions', 'Coughing', 'Delusions', 'Diseases',
    'Dreams', 'Ears', 'Elbows', 'Environment', 'Eyes', 'Face',
    'Feet', 'Female', 'Fevers', 'Food', 'Generals', 'Glands',
    'Hands', 'Head', 'Headaches', 'Hearing', 'Heart', 'Hips',
    'Intestines', 'Joints', 'Kidneys', 'Knees', 'Larynx', 'Limbs',
    'Liver', 'Lungs', 'Male', 'Memory', 'Mind', 'Mouth', 'Muscle',
    'Nape', 'Navel', 'Nose', 'Pain', 'Perspiration', 'Pregnancy',
    'Prostate', 'Pulse', 'Rectum', 'Respiration', 'Scalp', 'Shoulders',
    'Skin', 'Sleep', 'Smell', 'Speech', 'Stomach', 'Stool', 'Sweat',
    'Taste', 'Teeth', 'Thighs', 'Throat', 'Thyroid', 'Tongue',
    'Urinary', 'Vertigo', 'Vision', 'Vomiting', 'Walking', 'Weakness',
    'Weight', 'Wounds',
]
CHAPTER_SET = set(MURPHY_CHAPTERS)

# Common OCR errors in remedy abbreviations — fix map
REMEDY_OCR_FIXES = {
    'croc': 'croc',  # ok
    'hod': 'rhod',   # OCR error
    'Baja': 'naja',  # OCR error
    'nur-ac': 'mur-ac',
    'nuur-ac': 'mur-ac',
    'murr-ac': 'mur-ac',
    'myric': 'myric',
    'pib': 'plb',
    'hod': 'rhod',
    'hod': 'rhod',
    'BUX-V': 'nux-v',
    'bux-v': 'nux-v',
    'sulph': 'sulph',
    'sid': 'sil',
    'sxlph': 'sulph',
    'canst': 'caust',
    'Coad': 'caust',
    'Cash': 'caust',
    'Cast': 'caust',
    'cist': 'calc-s',
    'card-m': 'card-m',
    'card-n': 'card-n',
    'card-tt': 'card-t',
    'card-t': 'card-t',
    'meny': 'mend',
    'meph': 'merc',
    'mepb': 'merc',
    'many': 'mand',
    'nur-ac': 'mur-ac',
    'pib': 'plb',
    'puls': 'puls',
    'rheam': 'rheum',
    'rheum': 'rheum',
    'sang': 'sang',
    'sars': 'sars',
    'seneg': 'seneg',
    'spig': 'spig',
    'staph': 'staph',
    'stann': 'stann',
    'strd-ac': 'sul-ac',
    'stront-c': 'stront-c',
    'sumb': 'sumb',
    'tarax': 'tarax',
    'tell': 'tell',
    'ter': 'ter',
    'thuj': 'thuj',
    'upa': 'und',
    'verat': 'verat',
    'zine': 'zinc',
    'calc-acet': 'calc-acet',
    'calc-ar': 'calc-ar',
    'calc-i': 'calc-i',
    'calc-p': 'calc-p',
    'calc-s': 'calc-s',
    'calc-sil': 'calc-sil',
    'carbn-s': 'carbn-s',
    'cann-i': 'cann-i',
    'cann-s': 'cann-s',
    'carc': 'carc',
    'chin-ar': 'chin-ar',
    'colocin': 'coloc',
    'croto-t': 'crot-t',
    'cupr-s': 'cupr-s',
    'fl-ac': 'fl-ac',
    'fl-ac': 'fl-ac',
    'kali-ar': 'kali-ar',
    'kali-br': 'kali-bi',
    'kali-chl': 'kali-chl',
    'kali-i': 'kali-i',
    'kali-n': 'kali-n',
    'kali-ox': 'kali-ox',
    'kali-p': 'kali-p',
    'kali-s': 'kali-s',
    'kali-sil': 'kali-sil',
    'lap-c-b': 'lap-c',
    'lil-t': 'lil-t',
    'lith-c': 'lith-c',
    'mag-m': 'mag-m',
    'nat-sil': 'nat-sil',
    'mut-ac': 'mur-ac',
    'muta': 'mur-ac',
    'ox-ac': 'ox-ac',
    'pic-ac': 'pic-ac',
    'pic-oc': 'pic-oc',
    'ptel': 'ptel',
    'rhod': 'rhod',
    'rhus-t': 'rhus-t',
    'rhus-c': 'rhus-c',
    'sul-ac': 'sul-ac',
    'calc': 'calc',
    'calc': 'calc',
    'grat': 'grat',
    'hep': 'hep',
    'hydr': 'hydr',
    'kali-c': 'kali-c',
    'lach': 'lach',
    'lec': 'lec',
    'lyc': 'lyc',
    'mag-c': 'mag-c',
    'mag-p': 'mag-p',
    'med': 'med',
    'merc': 'merc',
    'merc-i-f': 'merc-i-f',
    'mez': 'mez',
    'mosch': 'mosch',
    'naja': 'naja',
    'nat-m': 'nat-m',
    'nat-p': 'nat-p',
    'nux-v': 'nux-v',
    'nux-m': 'nux-m',
    'olnd': 'olnd',
    'ozone': 'oz',
    'petr': 'petr',
    'ph-ac': 'ph-ac',
    'phel': 'phel',
    'phos': 'phos',
    'plat': 'plat',
    'plb': 'plb',
    'podo': 'podo',
    'rhod': 'rhod',
    'rhus-t': 'rhus-t',
    'sec': 'sec',
    'sel': 'sel',
    'sep': 'sep',
    'sil': 'sil',
    'spig': 'spig',
    'spong': 'spong',
    'stann': 'stann',
    'staph': 'staph',
    'stront-c': 'stront-c',
    'sulph': 'sulph',
    'tab': 'tab',
    'tell': 'tell',
    'ter': 'ter',
    'thuj': 'thuj',
    'und': 'und',
    'verat': 'verat',
    'zinc': 'zinc',
    'acon': 'acon',
    'acon-f': 'acon-f',
    'agar': 'agar',
    'alum': 'alum',
    'am': 'am',
    'am-m': 'am-m',
    'ang': 'ang',
    'ant-c': 'ant-c',
    'apoc': 'apoc',
    'apoc-a': 'apoc-a',
    'aral-h': 'aral-h',
    'arg': 'arg',
    'arg-n': 'arg-n',
    'ars': 'ars',
    'ars-s-f': 'ars-s-f',
    'asaf': 'asaf',
    'asc-c': 'asc-c',
    'aster': 'aster',
    'aur': 'aur',
    'aur-m': 'aur-m',
    'aur-mt': 'aur-m',
    'aur-s': 'aur-s',
    'bell': 'bell',
    'berb': 'berb',
    'bor': 'bor',
    'bov': 'bov',
    'bry': 'bry',
    'bufo': 'bufo',
    'cact': 'cact',
    'calad': 'calad',
    'camph': 'camph',
    'caps': 'caps',
    'carb-v': 'carb-v',
    'carb-ac': 'carb-ac',
    'cham': 'cham',
    'chel': 'chel',
    'chin': 'chin',
    'chin-a': 'chin-a',
    'cocc': 'cocc',
    'coc-c': 'coc-c',
    'colch': 'colch',
    'coloc': 'coloc',
    'con': 'con',
    'cop': 'cop',
    'crot-c': 'crot-c',
    'crot-h': 'crot-h',
    'crot-t': 'crot-t',
    'cub': 'cub',
    'cupr': 'cupr',
    'dig': 'dig',
    'dios': 'dios',
    'dros': 'dros',
    'dulc': 'dulc',
    'elat': 'elat',
    'euph': 'euph',
    'eup-per': 'eup-per',
    'eupi': 'eupi',
    'ferr': 'ferr',
    'gels': 'gels',
    'glon': 'glon',
    'graph': 'graph',
    'hell': 'hell',
    'helon': 'helon',
    'hydr-ac': 'hydr-ac',
    'hyos': 'hyos',
    'ign': 'ign',
    'iod': 'iod',
    'iris': 'iris',
    'kali-bi': 'kali-bi',
    'lac-c': 'lac-c',
    'lappa': 'lappa',
    'laur': 'laur',
    'lept': 'lept',
    'lyc': 'lyc',
    'mend': 'mend',
    'nat-m': 'nat-m',
    'phos': 'phos',
    'pic-ac': 'pic-ac',
    'plat': 'plat',
    'puls': 'puls',
    'rheum': 'rheum',
    'sep': 'sep',
    'sil': 'sil',
    'spong': 'spong',
    'sulph': 'sulph',
    'tarax': 'tarax',
    'valer': 'valer',
}


def fix_remedy(rem):
    """Fix OCR errors in remedy abbreviation."""
    rem = rem.strip().rstrip('.').lower()
    if rem in REMEDY_OCR_FIXES:
        return REMEDY_OCR_FIXES[rem]
    return rem


def detect_grade(rem_orig):
    """Detect grade from remedy text format."""
    rem = rem_orig.strip().rstrip('.')
    if not rem or len(rem) < 2:
        return None
    # ALL CAPS = Grade 4
    if rem.isupper() and rem.replace('-', '').isalpha():
        return 4
    # Title Case = Grade 3
    if rem[0].isupper() and rem[1:].islower():
        return 3
    # Lowercase = Grade 1
    return 1


def parse_remedies(text):
    """Parse remedy list from text like 'calc., BELL., nux-v., phos.'"""
    remedies = []
    remediesGraded = []
    seen = set()
    
    parts = re.split(r'[,\s]+', text)
    for part in parts:
        part = part.strip().rstrip('.')
        if not part or len(part) < 2:
            continue
        # Must be alphabetic (possibly with hyphens)
        if not part.replace('-', '').isalpha():
            continue
        
        grade = detect_grade(part)
        if grade is None:
            continue
        
        abbrev = fix_remedy(part)
        if abbrev not in seen:
            seen.add(abbrev)
            remedies.append(abbrev)
            remediesGraded.append({'abbrev': abbrev, 'grade': grade})
    
    return remedies, remediesGraded


def parse_page(ocr_text, current_chapter):
    """Parse one OCR'd page into rubrics."""
    rubrics = []
    lines = ocr_text.split('\n')
    
    current_rubric = None
    current_sub = None
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            continue
        
        # Skip page headers/footers
        if re.match(r'^\d+$', stripped):
            continue
        if 'Homeopathic Medical Repertory' in stripped:
            continue
        if stripped.startswith('Introduction:') or stripped.startswith('Preface'):
            continue
        
        # Check if this is a chapter heading
        # Murphy chapter headings appear on pages as centered text
        # They're Title Case, standalone
        if stripped in CHAPTER_SET:
            current_chapter = stripped
            continue
        if stripped.title() in CHAPTER_SET:
            current_chapter = stripped.title()
            continue
        
        # Check if this is a rubric (ALL CAPS at start)
        # Rubric format: "RUBRIC_NAME, descriptor - remedies"
        # OR: "RUBRIC_NAME, descriptor" (remedies on next line)
        rubric_match = re.match(
            r'^([A-Z][A-Z,\s\'\-]{2,80}?)(?:\s*[-–—]\s*(.+))?$',
            stripped
        )
        if rubric_match:
            rubric_text = rubric_match.group(1).strip().rstrip(',')
            remedies_part = rubric_match.group(2)
            
            # Filter out false positives (single words that aren't rubrics)
            if len(rubric_text) < 3:
                continue
            # Skip if it's a chapter name
            if rubric_text in CHAPTER_SET:
                current_chapter = rubric_text
                continue
            # Skip if it's all remedy abbreviations (continuation of previous line)
            words = rubric_text.split()
            if all(w.replace('.', '').replace('-', '').isalpha() and len(w) <= 5 for w in words) and len(words) > 3:
                # This is likely a remedy continuation, not a new rubric
                if current_rubric:
                    rem, rem_gr = parse_remedies(stripped)
                    current_rubric['remedies'].extend(rem)
                    current_rubric['remediesGraded'].extend(rem_gr)
                    current_rubric['remedyCount'] = len(current_rubric['remedies'])
                continue
            
            # Parse remedies
            remedies = []
            remediesGraded = []
            if remedies_part:
                remedies, remediesGraded = parse_remedies(remedies_part)
            
            current_rubric = {
                'rubricText': rubric_text,
                'chapter': current_chapter,
                'level': 0,
                'subRubrics': [],
                'remedies': remedies,
                'remediesGraded': remediesGraded,
                'remedyCount': len(remedies),
            }
            rubrics.append(current_rubric)
            current_sub = None
            continue
        
        # Check if this is a sub-rubric (starts with - or *)
        if stripped.startswith('-') or stripped.startswith('*'):
            sub_text = stripped.lstrip('-*').strip()
            if current_rubric and sub_text:
                sub_match = re.match(r'^(.+?)\s*[-–—]\s*(.+)$', sub_text)
                if sub_match:
                    sub_name = sub_match.group(1).strip()
                    remedies_part = sub_match.group(2)
                    rem, rem_gr = parse_remedies(remedies_part)
                    current_sub = {
                        'rubricText': sub_name,
                        'chapter': current_chapter,
                        'level': 1,
                        'subRubrics': [],
                        'remedies': rem,
                        'remediesGraded': rem_gr,
                        'remedyCount': len(rem),
                    }
                    current_rubric['subRubrics'].append(current_sub)
                else:
                    # Sub-rubric without remedies separator
                    current_sub = {
                        'rubricText': sub_text,
                        'chapter': current_chapter,
                        'level': 1,
                        'subRubrics': [],
                        'remedies': [],
                        'remediesGraded': [],
                        'remedyCount': 0,
                    }
                    current_rubric['subRubrics'].append(current_sub)
            continue
        
        # Continuation line — could be more remedies for current rubric/sub
        if current_rubric:
            rem, rem_gr = parse_remedies(stripped)
            if rem:
                if current_sub:
                    current_sub['remedies'].extend(rem)
                    current_sub['remediesGraded'].extend(rem_gr)
                    current_sub['remedyCount'] = len(current_sub['remedies'])
                else:
                    current_rubric['remedies'].extend(rem)
                    current_rubric['remediesGraded'].extend(rem_gr)
                    current_rubric['remedyCount'] = len(current_rubric['remedies'])
    
    return rubrics, current_chapter


def main():
    print("=" * 70)
    print("Murphy Repertory — Complete OCR + Parse Pipeline")
    print("=" * 70)
    
    os.makedirs(PAGES_DIR, exist_ok=True)
    
    # Phase 1: Chapter Index
    print("\n=== PHASE 1: Chapter Index (74 chapters) ===")
    for i, ch in enumerate(MURPHY_CHAPTERS):
        print(f"  {i+1:2d}. {ch}")
    
    # Phase 2: OCR + Parse all pages
    print("\n=== PHASE 2: OCR + Parse ===")
    all_rubrics = []
    rubric_id = 0
    current_chapter = 'UNKNOWN'
    
    for part_idx, pdf_path in enumerate(PDF_PARTS):
        if not os.path.exists(pdf_path):
            print(f"\n  WARNING: {pdf_path} not found, skipping")
            continue
        
        print(f"\n  Part {part_idx + 1}: {os.path.basename(pdf_path)}")
        
        result = subprocess.run(['pdfinfo', pdf_path], capture_output=True, text=True)
        pages_match = re.search(r'Pages:\s+(\d+)', result.stdout)
        total_pages = int(pages_match.group(1)) if pages_match else 0
        print(f"  Pages: {total_pages}")
        
        # Process pages (skip front matter in Part 1)
        start_page = 14 if part_idx == 0 else 1
        
        for page_num in range(start_page, min(total_pages + 1, start_page + 200)):
            if page_num % 50 == 0:
                print(f"    Page {page_num}...")
            
            # Generate image
            img_prefix = f'{PAGES_DIR}/p{part_idx+1}_{page_num:04d}'
            # pdftoppm generates: prefix-NNN.png (zero-padded based on total pages)
            # For 814-page PDF, it uses 3-digit padding (e.g., prefix-014.png, prefix-100.png)
            # Check multiple possible filename patterns
            img_path = None
            possible_paths = [
                f'{img_prefix}-{page_num:04d}.png',  # 4-digit (prefix-0014.png)
                f'{img_prefix}-{page_num:03d}.png',  # 3-digit (prefix-014.png)
                f'{img_prefix}-{page_num}.png',      # no padding (prefix-14.png)
            ]
            for p in possible_paths:
                if os.path.exists(p):
                    img_path = p
                    break
            
            if not img_path:
                subprocess.run([
                    'pdftoppm', '-png', '-r', '200',
                    '-f', str(page_num), '-l', str(page_num),
                    pdf_path, img_prefix
                ], capture_output=True)
                # Check again after generation
                for p in possible_paths:
                    if os.path.exists(p):
                        img_path = p
                        break
            
            if not img_path:
                continue
            
            # OCR
            result = subprocess.run(
                ['tesseract', img_path, '-', '--psm', '6'],
                capture_output=True, text=True
            )
            
            # Parse
            rubrics, current_chapter = parse_page(result.stdout, current_chapter)
            
            for r in rubrics:
                rubric_id += 1
                r['id'] = f'murphy_{rubric_id}'
                r['repertory'] = 'Murphy'
                r['fullPath'] = r['chapter']
                r['fullPathParts'] = [r['chapter']]
                r['entryType'] = 'rubric'
                r['crossReference'] = None
                r['singleRemedy'] = r['remedyCount'] == 1
                r['pdfPage'] = page_num
                
                # Add IDs to sub-rubrics
                for j, sub in enumerate(r.get('subRubrics', [])):
                    sub['id'] = f'murphy_{rubric_id}_{j+1}'
                    sub['repertory'] = 'Murphy'
                    sub['fullPath'] = f"{r['chapter']} > {r['rubricText']} > {sub['rubricText']}"
                    sub['fullPathParts'] = [r['chapter'], r['rubricText'], sub['rubricText']]
                    sub['entryType'] = 'sub_rubric'
                    sub['crossReference'] = None
                    sub['singleRemedy'] = sub['remedyCount'] == 1
                    sub['pdfPage'] = page_num
                
                all_rubrics.append(r)
        
        print(f"  Rubrics so far: {len(all_rubrics)}")
    
    # Phase 3: Sort alphabetically within each chapter
    print("\n=== PHASE 3: Alphabetical Sorting ===")
    all_rubrics.sort(key=lambda r: (r['chapter'], r['rubricText']))
    
    # Reassign IDs after sorting
    for i, r in enumerate(all_rubrics):
        r['id'] = f'murphy_{i+1}'
        for j, sub in enumerate(r.get('subRubrics', [])):
            sub['id'] = f'murphy_{i+1}_{j+1}'
    
    # Phase 4: Statistics
    print("\n=== PHASE 4: Statistics ===")
    print(f"Total rubrics: {len(all_rubrics)}")
    
    chapters = Counter(r['chapter'] for r in all_rubrics)
    print(f"Chapters: {len(chapters)}")
    for c, count in chapters.most_common(20):
        print(f"  {c}: {count}")
    
    grade_counts = Counter()
    total_subs = 0
    for r in all_rubrics:
        for rg in r.get('remediesGraded', []):
            grade_counts[rg['grade']] += 1
        total_subs += len(r.get('subRubrics', []))
    
    print(f"\nSub-rubrics: {total_subs}")
    print(f"Grade distribution:")
    for g in sorted(grade_counts.keys()):
        print(f"  Grade {g}: {grade_counts[g]:,} remedies")
    
    # Phase 5: Write output
    print(f"\n=== PHASE 5: Writing output ===")
    with open(OUT_FILE, 'w') as f:
        json.dump(all_rubrics, f, ensure_ascii=False, indent=2)
    print(f"Wrote {OUT_FILE} ({os.path.getsize(OUT_FILE):,} bytes)")
    
    # Show sample
    if all_rubrics:
        print(f"\n=== Sample Rubric ===")
        print(json.dumps(all_rubrics[0], indent=2, ensure_ascii=False)[:800])


if __name__ == '__main__':
    main()
