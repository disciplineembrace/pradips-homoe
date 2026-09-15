#!/usr/bin/env python3
"""
Murphy Repertory — Clean parser with improved rubric/remedy detection.

Key improvements:
1. Better chapter detection — chapters appear in OCR text as centered words
2. Rubric detection — only ALL CAPS phrases with commas (e.g., "ABSCESS, abdomen")
3. Remedy filtering — only valid abbreviations (2-8 chars, known patterns)
4. Proper sub-rubric detection (indented lines starting with lowercase)
5. Grade detection: ALL CAPS=4, Title Case=3, lowercase=1
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

# Valid remedy pattern: 2-8 lowercase letters with optional hyphens and periods
# Examples: calc, bell, nux-v, kali-c, ph-ac
REMEDY_PATTERN = re.compile(r'^[a-z][a-z\-]{1,8}\.?$')


def is_valid_remedy(rem):
    """Check if a token looks like a valid remedy abbreviation."""
    rem = rem.strip().rstrip('.').lower()
    if len(rem) < 2 or len(rem) > 12:
        return False
    # Must be alphabetic with optional hyphens
    if not rem.replace('-', '').isalpha():
        return False
    # Common false positives to exclude
    EXCLUDE = {
        'the', 'and', 'for', 'with', 'from', 'after', 'before',
        'side', 'left', 'right', 'region', 'area', 'morning',
        'night', 'evening', 'worse', 'better', 'extending',
        'ascending', 'descending', 'pressure', 'touch', 'motion',
        'walking', 'standing', 'sitting', 'lying', 'eating',
        'drinking', 'menses', 'pregnancy', 'stool', 'urine',
        'sleep', 'wake', 'cold', 'heat', 'wet', 'dry',
        'like', 'sensation', 'pain', 'burning', 'itching',
        'skin', 'face', 'head', 'eyes', 'ears', 'nose',
        'mouth', 'throat', 'chest', 'heart', 'stomach',
        'abdomen', 'back', 'limbs', 'hands', 'feet',
    }
    if rem in EXCLUDE:
        return False
    return True


def fix_remedy(rem):
    """Fix common OCR errors."""
    rem = rem.strip().rstrip('.').lower()
    fixes = {
        'bux-v': 'nux-v', 'dux-v': 'nux-v', 'baja': 'naja',
        'pib': 'plb', 'sid': 'sil', 'sxlph': 'sulph', 'suiph': 'sulph',
        'canst': 'caust', 'cash': 'caust', 'coad': 'caust',
        'cast': 'caust', 'meny': 'mend', 'meph': 'merc',
        'mepb': 'merc', 'murr-ac': 'mur-ac', 'nur-ac': 'mur-ac',
        'nuur-ac': 'mur-ac', 'mut-ac': 'mur-ac', 'muta': 'mur-ac',
        'rheam': 'rheum', 'strd-ac': 'sul-ac', 'hod': 'rhod',
        'zine': 'zinc', 'ozone': 'oz', 'colocin': 'coloc',
        'croto-t': 'crot-t', 'kali-br': 'kali-bi', 'lap-c-b': 'lap-c',
        'nat-sil': 'nat-sil', 'card-tt': 'card-t', 'calea': 'calc',
        'cale': 'calc', 'chamn': 'cham', 'chix': 'chin',
        'eyc': 'lyc', 'ferrflac': 'ferr', 'eap-put': 'eup-per',
        'eap-pur': 'eup-per', 'f-ac': 'fl-ac', 'lac': 'lac-c',
    }
    return fixes.get(rem, rem)


def detect_grade(rem_text):
    """Detect grade from text format."""
    rem = rem_text.strip().rstrip('.')
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
    """Parse remedy list — only valid abbreviations."""
    remedies = []
    remediesGraded = []
    seen = set()
    
    parts = re.split(r'[,\s]+', text)
    for part in parts:
        part = part.strip().rstrip('.')
        if not part or len(part) < 2:
            continue
        
        # Check if it looks like a remedy
        if not is_valid_remedy(part):
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


def parse_column(ocr_text, current_chapter):
    """Parse a single column of OCR text."""
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
        if stripped.startswith('—_') or stripped.startswith('—_') or stripped.startswith('SSS'):
            continue
        if len(stripped) < 3:
            continue
        
        # Check for chapter heading
        # In two-column OCR, chapter names appear as standalone words
        if stripped in CHAPTER_SET:
            current_chapter = stripped
            continue
        if stripped.title() in CHAPTER_SET and len(stripped) < 20:
            current_chapter = stripped.title()
            continue
        
        # Check for rubric (ALL CAPS, has comma, at least 3 chars)
        # Murphy rubrics: "ABSCESS, abdomen", "ACHING, pain", "ANXIETY, abdomen"
        # Pattern: WORD, descriptor - remedies
        # Must have comma OR be followed by remedies after a dash
        rubric_match = re.match(r'^([A-Z][A-Z]{2,}(?:,\s*[a-z]+)*)\s*[-–—]?\s*(.*)$', stripped)
        
        if rubric_match:
            rubric_text = rubric_match.group(1).strip()
            remaining = rubric_match.group(2).strip()
            
            # Must have at least 3 chars in rubric
            if len(rubric_text) < 3:
                continue
            # Skip if it's a chapter name
            if rubric_text in CHAPTER_SET:
                current_chapter = rubric_text
                continue
            # Skip if it's too many words (likely remedy continuation)
            words = rubric_text.replace(',', ' ').split()
            if len(words) > 4:
                continue
            
            # Parse remedies from remaining text
            remedies = []
            remediesGraded = []
            if remaining:
                # Look for " - " separator in remaining text
                if ' - ' in remaining or ' — ' in remaining or ' – ' in remaining:
                    rem_part = re.split(r'\s*[-–—]\s*', remaining)[-1]
                    remedies, remediesGraded = parse_remedies(rem_part)
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
        
        # Check for sub-rubric (starts with - or lowercase word)
        if stripped.startswith('-') or stripped.startswith('*'):
            sub_text = stripped.lstrip('-*').strip()
            if current_rubric and sub_text:
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
    """Split page into two columns and OCR each."""
    img_prefix = f'{PAGES_DIR}/col_p{part_idx+1}_{page_num:04d}'
    
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
    print("Murphy Repertory — Clean Two-Column OCR Parser")
    print("=" * 70)
    
    os.makedirs(PAGES_DIR, exist_ok=True)
    
    all_rubrics = []
    rubric_id = 0
    current_chapter = 'Abdomen'  # First chapter
    
    for part_idx, pdf_path in enumerate(PDF_PARTS):
        if not os.path.exists(pdf_path):
            continue
        
        print(f"\n  Part {part_idx + 1}: {os.path.basename(pdf_path)}")
        
        result = subprocess.run(['pdfinfo', pdf_path], capture_output=True, text=True)
        pages_match = re.search(r'Pages:\s+(\d+)', result.stdout)
        total_pages = int(pages_match.group(1)) if pages_match else 0
        
        start_page = 14 if part_idx == 0 else 1
        end_page = min(total_pages + 1, start_page + 200)
        
        for page_num in range(start_page, end_page):
            if page_num % 25 == 0:
                print(f"    Page {page_num}/{total_pages}...")
            
            left_text, right_text = ocr_page_columns(pdf_path, page_num, part_idx + 1)
            
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
    
    # Sort alphabetically
    all_rubrics.sort(key=lambda r: (r['chapter'], r['rubricText']))
    for i, r in enumerate(all_rubrics):
        r['id'] = f'murphy_{i+1}'
        for j, sub in enumerate(r.get('subRubrics', [])):
            sub['id'] = f'murphy_{i+1}_{j+1}'
    
    # Statistics
    print(f"\n=== RESULTS ===")
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
    for g in sorted(grade_counts.keys()):
        print(f"  Grade {g}: {grade_counts[g]:,}")
    
    with open(OUT_FILE, 'w') as f:
        json.dump(all_rubrics, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_FILE} ({os.path.getsize(OUT_FILE):,} bytes)")
    
    if all_rubrics:
        print(f"\n=== Sample ===")
        print(json.dumps(all_rubrics[0], indent=2, ensure_ascii=False)[:500])


if __name__ == '__main__':
    main()
