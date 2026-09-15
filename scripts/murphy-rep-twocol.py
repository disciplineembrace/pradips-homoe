#!/usr/bin/env python3
"""
Murphy Repertory — Two-Column OCR Parser

Murphy's Medical Repertory uses a TWO-COLUMN layout per page.
This script:
1. Splits each page image into left and right columns
2. OCRs each column separately
3. Parses rubrics, sub-rubrics, and remedies with grades
4. Builds murphy_rebuilt.json with unique IDs and alphabetical ordering

Grade detection:
  ALL CAPS (BELL.) = Grade 4 (bold-capitals) → RED
  Title Case (Bell.) = Grade 3 (bold) → GREEN
  Lowercase (bell.) = Grade 1 (plain) → BLACK
"""
import json
import os
import re
import subprocess
import glob
from collections import Counter
from PIL import Image

OUT_FILE = '/home/z/my-project/data/murphy_rebuilt.json'
PAGES_DIR = '/tmp/murphy-rep-pages'
PDF_PARTS = [
    '/tmp/my-project/upload/Medical_Repertory_Part1-1.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part2.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part3.pdf',
]

# 74 Murphy chapters
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

# Known remedy abbreviations for validation (common ones)
VALID_REMEDIES = {
    'acon', 'acon-f', 'agar', 'alum', 'am', 'am-m', 'anac', 'ant-c',
    'ant-t', 'apoc', 'apoc-a', 'apis', 'arg', 'arg-n', 'arn', 'ars',
    'ars-s-f', 'asaf', 'bell', 'berb', 'bor', 'bov', 'bry', 'bufo',
    'cact', 'calc', 'calc-p', 'calc-s', 'calc-sil', 'calc-ar', 'calc-i',
    'calc-acet', 'camph', 'cann-i', 'cann-s', 'canth', 'caps', 'carb-v',
    'carb-ac', 'carbn-s', 'carc', 'card-m', 'caust', 'cham', 'chel',
    'chin', 'chin-a', 'chin-ar', 'cocc', 'coc-c', 'colch', 'coloc',
    'con', 'cop', 'crot-c', 'crot-h', 'crot-t', 'cub', 'cupr', 'cupr-s',
    'dig', 'dios', 'dros', 'dulc', 'elat', 'euph', 'eupi', 'eup-per',
    'ferr', 'fl-ac', 'gels', 'glon', 'graph', 'grat', 'hell', 'helon',
    'hep', 'hydr', 'hyos', 'ign', 'iod', 'iris', 'kali-bi', 'kali-c',
    'kali-chl', 'kali-i', 'kali-n', 'kali-p', 'kali-s', 'kali-ar',
    'kali-sil', 'lac-c', 'lach', 'lappa', 'laur', 'lept', 'lil-t',
    'lith-c', 'lyc', 'mag-c', 'mag-m', 'mag-p', 'med', 'merc', 'merc-i-f',
    'mez', 'mosch', 'mur-ac', 'naja', 'nat-m', 'nat-p', 'nat-s',
    'nit-ac', 'nux-v', 'nux-m', 'olnd', 'op', 'oz', 'petr', 'ph-ac',
    'phel', 'phos', 'pic-ac', 'plat', 'plb', 'podo', 'ptel', 'puls',
    'rhod', 'rhus-t', 'rhus-c', 'sec', 'sel', 'sep', 'sil', 'spig',
    'spong', 'stann', 'staph', 'stront-c', 'sul-ac', 'sulph', 'tab',
    'tell', 'ter', 'thuj', 'und', 'valer', 'verat', 'zinc',
    'acon', 'alum', 'arg', 'ars', 'bell', 'bor', 'bry', 'calc',
    'cham', 'chin', 'coloc', 'dig', 'gels', 'graph', 'hep', 'hydr',
    'ign', 'lach', 'lyc', 'merc', 'nat-m', 'nux-v', 'phos', 'puls',
    'rhus-t', 'sep', 'sil', 'sulph', 'verat',
    'androc', 'asaf', 'aster', 'berb', 'bov', 'brom', 'cact', 'calad',
    'cann-i', 'cann-s', 'canth', 'caps', 'carb-v', 'card-m', 'caust',
    'chel', 'chin-a', 'cocc', 'coc-c', 'colch', 'con', 'crot-c', 'crot-h',
    'crot-t', 'cub', 'cupr', 'cupr-s', 'dios', 'dros', 'dulc', 'elat',
    'euph', 'eupi', 'eup-per', 'ferr', 'fl-ac', 'glon', 'grat', 'hell',
    'helon', 'hydr', 'hyos', 'iod', 'iris', 'kali-ar', 'kali-bi',
    'kali-c', 'kali-chl', 'kali-i', 'kali-n', 'kali-p', 'kali-s',
    'kali-sil', 'lac-c', 'lappa', 'laur', 'lept', 'lil-t', 'lith-c',
    'mag-c', 'mag-m', 'mag-p', 'med', 'merc-i-f', 'mez', 'mosch',
    'mur-ac', 'naja', 'nat-p', 'nat-s', 'nit-ac', 'nux-m', 'olnd',
    'oz', 'petr', 'ph-ac', 'phel', 'pic-ac', 'plat', 'plb', 'podo',
    'ptel', 'rhod', 'rhus-c', 'sec', 'sel', 'spig', 'spong', 'stann',
    'staph', 'stront-c', 'sul-ac', 'tab', 'tell', 'ter', 'thuj', 'und',
    'valer', 'zinc',
}


def fix_remedy(rem):
    """Fix common OCR errors in remedy abbreviations."""
    rem = rem.strip().rstrip('.').lower()
    fixes = {
        'bux-v': 'nux-v', 'dux-v': 'nux-v', 'baja': 'naja',
        'pib': 'plb', 'sid': 'sil', 'sxlph': 'sulph',
        'canst': 'caust', 'cash': 'caust', 'coad': 'caust',
        'cast': 'caust', 'meny': 'mend', 'meph': 'merc',
        'mepb': 'merc', 'many': 'mand', 'murr-ac': 'mur-ac',
        'nur-ac': 'mur-ac', 'nuur-ac': 'mur-ac', 'mut-ac': 'mur-ac',
        'muta': 'mur-ac', 'rheam': 'rheum', 'strd-ac': 'sul-ac',
        'hod': 'rhod', 'pib': 'plb', 'zine': 'zinc',
        'ozone': 'oz', 'calc-acet': 'calc-acet',
        'colocin': 'coloc', 'croto-t': 'crot-t',
        'kali-br': 'kali-bi', 'lap-c-b': 'lap-c',
        'nat-sil': 'nat-sil', 'card-tt': 'card-t',
        'calea': 'calc', 'cale': 'calc', 'chamn': 'cham',
        'chix': 'chin', 'chin-a': 'chin-a',
    }
    return fixes.get(rem, rem)


def detect_grade(rem_text):
    """Detect grade from text format."""
    rem = rem_text.strip().rstrip('.')
    if not rem or len(rem) < 2:
        return None
    if rem.isupper() and rem.replace('-', '').isalpha():
        return 4
    if rem[0].isupper() and rem[1:].islower():
        return 3
    return 1


def parse_remedies(text):
    """Parse remedy list."""
    remedies = []
    remediesGraded = []
    seen = set()
    
    parts = re.split(r'[,\s]+', text)
    for part in parts:
        part = part.strip().rstrip('.')
        if not part or len(part) < 2:
            continue
        if not part.replace('-', '').replace('.', '').isalpha():
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


def is_chapter_heading(line, current_chapter):
    """Check if a line contains a chapter heading."""
    stripped = line.strip()
    # Direct match
    if stripped in CHAPTER_SET:
        return stripped
    # Title Case match
    if stripped.title() in CHAPTER_SET:
        return stripped.title()
    # Check if chapter name appears as a standalone word in the line
    for ch in CHAPTER_SET:
        if stripped == ch:
            return ch
    return None


def parse_column(ocr_text, current_chapter):
    """Parse a single column of OCR text into rubrics."""
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
        if stripped.startswith('—_') or stripped.startswith('—_'):
            continue
        
        # Check if chapter heading
        chapter = is_chapter_heading(stripped, current_chapter)
        if chapter:
            current_chapter = chapter
            continue
        
        # Check for rubric (ALL CAPS at start, followed by comma or descriptor)
        # Pattern: "RUBRIC_NAME, descriptor - remedies"
        # Or: "RUBRIC_NAME" followed by remedies on next line
        rubric_match = re.match(
            r'^([A-Z][A-Z,\s\']{2,60}?)(?:,|\s*[-–—]\s*|\s*$)(.*)$',
            stripped
        )
        
        if rubric_match:
            rubric_text = rubric_match.group(1).strip().rstrip(',')
            remaining = rubric_match.group(2).strip()
            
            # Filter false positives
            if len(rubric_text) < 3:
                continue
            if rubric_text in CHAPTER_SET:
                current_chapter = rubric_text
                continue
            
            # Skip if it looks like a remedy continuation (all short words)
            words = rubric_text.replace(',', ' ').split()
            if len(words) > 3 and all(len(w) <= 5 for w in words):
                # Likely remedy continuation
                if current_rubric:
                    rem, rem_gr = parse_remedies(stripped)
                    if current_sub:
                        current_sub['remedies'].extend(rem)
                        current_sub['remediesGraded'].extend(rem_gr)
                        current_sub['remedyCount'] = len(current_sub['remedies'])
                    else:
                        current_rubric['remedies'].extend(rem)
                        current_rubric['remediesGraded'].extend(rem_gr)
                        current_rubric['remedyCount'] = len(current_rubric['remedies'])
                continue
            
            # Parse remedies if present in remaining text
            remedies = []
            remediesGraded = []
            if remaining:
                # Look for " - " separator
                sep_match = re.search(r'[-–—]\s*(.+)$', remaining)
                if sep_match:
                    remedies, remediesGraded = parse_remedies(sep_match.group(1))
                else:
                    remedies, remediesGraded = parse_remedies(remaining)
            
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
        
        # Check for sub-rubric (starts with - or * or lowercase word followed by - )
        if stripped.startswith('-') or stripped.startswith('*'):
            sub_text = stripped.lstrip('-*').strip()
            if current_rubric and sub_text:
                # Try to split sub-rubric name from remedies
                sub_match = re.match(r'^(.+?)\s*[-–—]\s*(.+)$', sub_text)
                if sub_match:
                    sub_name = sub_match.group(1).strip()
                    rem_text = sub_match.group(2)
                    rem, rem_gr = parse_remedies(rem_text)
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
        
        # Continuation of remedy list (lowercase remedy abbreviations)
        if current_rubric and re.match(r'^[a-z]', stripped):
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


def ocr_page_columns(pdf_path, page_num, part_idx):
    """Split page into two columns, OCR each, return combined text."""
    img_prefix = f'{PAGES_DIR}/col_p{part_idx+1}_{page_num:04d}'
    
    # Check for existing image (try different filename patterns)
    img_path = None
    for pattern in [f'{img_prefix}-{page_num:04d}.png', f'{img_prefix}-{page_num:03d}.png',
                    f'{img_prefix}-{page_num}.png']:
        if os.path.exists(pattern):
            img_path = pattern
            break
    
    if not img_path:
        subprocess.run([
            'pdftoppm', '-png', '-r', '200',
            '-f', str(page_num), '-l', str(page_num),
            pdf_path, img_prefix
        ], capture_output=True)
        for pattern in [f'{img_prefix}-{page_num:04d}.png', f'{img_prefix}-{page_num:03d}.png',
                        f'{img_prefix}-{page_num}.png']:
            if os.path.exists(pattern):
                img_path = pattern
                break
    
    if not img_path or not os.path.exists(img_path):
        return '', ''
    
    # Split into left and right columns
    img = Image.open(img_path)
    w, h = img.size
    mid_x = w // 2
    
    left_path = f'{img_prefix}_left.png'
    right_path = f'{img_prefix}_right.png'
    
    if not os.path.exists(left_path):
        left = img.crop((0, 0, mid_x + 30, h))
        left.save(left_path)
    
    if not os.path.exists(right_path):
        right = img.crop((mid_x - 30, 0, w, h))
        right.save(right_path)
    
    # OCR each column
    left_text = subprocess.run(
        ['tesseract', left_path, '-', '--psm', '6'],
        capture_output=True, text=True
    ).stdout
    
    right_text = subprocess.run(
        ['tesseract', right_path, '-', '--psm', '6'],
        capture_output=True, text=True
    ).stdout
    
    return left_text, right_text


def main():
    print("=" * 70)
    print("Murphy Repertory — Two-Column OCR Parser")
    print("74 chapters | Grade detection | Alphabetical ordering")
    print("=" * 70)
    
    os.makedirs(PAGES_DIR, exist_ok=True)
    
    # Phase 1: Chapter index
    print(f"\n=== PHASE 1: Chapter Index ({len(MURPHY_CHAPTERS)} chapters) ===")
    
    # Phase 2: OCR + Parse
    print("\n=== PHASE 2: OCR + Parse (two-column) ===")
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
        
        # Skip front matter in Part 1 (chapters start at page ~14)
        start_page = 14 if part_idx == 0 else 1
        # Process up to 200 pages per part (for time management)
        end_page = min(total_pages + 1, start_page + 200)
        
        for page_num in range(start_page, end_page):
            if page_num % 25 == 0:
                print(f"    Page {page_num}/{total_pages}...")
            
            left_text, right_text = ocr_page_columns(pdf_path, page_num, part_idx + 1)
            
            # Parse left column first, then right
            for col_text in [left_text, right_text]:
                if not col_text:
                    continue
                rubrics, current_chapter = parse_column(col_text, current_chapter)
                
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
        print(f"\n=== Sample Rubrics (first 3) ===")
        for r in all_rubrics[:3]:
            print(json.dumps(r, indent=2, ensure_ascii=False)[:400])
            print()


if __name__ == '__main__':
    main()
