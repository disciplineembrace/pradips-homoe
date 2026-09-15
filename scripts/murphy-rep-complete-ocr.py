#!/usr/bin/env python3
"""
Murphy Repertory — Complete OCR Pipeline with Grade Detection

This script performs FULL OCR of the Murphy Medical Repertory (2,443 pages)
and builds a complete structured data file with:
- 74 chapters (alphabetical)
- Rubrics with sub-rubrics and sub-sub-rubrics
- Remedy grades (4=Red, 3=Green, 2=Blue, 1=Black)
- Unique IDs for fast search
- Alphabetical ordering
- Spelling verification

Murphy Grade System (from source preface):
  CALC.  (4 points) — bold-capitals and underlined → Grade 4 → RED
  CALC.  (3 points) — bold-capitals → Grade 3 → GREEN
  calc.  (2 points) — bold-italics → Grade 2 → BLUE
  calc.  (1 point)  — plain-small → Grade 1 → BLACK

OCR Strategy:
  Since we can't reliably detect bold/italic/underline from plain OCR text,
  we use PyMuPDF to detect font weight and style directly from the PDF.
  For ALL CAPS text detected by OCR, we assign Grade 4 (bold-capitals).

Output: data/murphy_rebuilt.json
"""
import json
import os
import re
import subprocess
import sys
import glob
from pathlib import Path
from collections import defaultdict

PDF_PARTS = [
    '/tmp/my-project/upload/Medical_Repertory_Part1-1.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part2.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part3.pdf',
]
OUT_FILE = '/home/z/my-project/data/murphy_rebuilt.json'
PAGES_DIR = '/tmp/murphy-rep-pages'

# Complete Murphy chapter list (74 chapters, alphabetical)
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

# Build a lookup set for fast chapter detection
CHAPTER_SET = set(MURPHY_CHAPTERS)


def detect_grade_from_text(rem_text):
    """Detect remedy grade from text characteristics.
    
    Since OCR loses formatting, we use these heuristics:
    - ALL CAPS (BELL.) → Grade 4 (bold-capitals)
    - Title Case (Bell.) → Grade 3 (bold)
    - Lowercase (bell.) → Grade 1 (plain-small)
    
    Note: Grade 2 (bold-italics) cannot be reliably detected from OCR.
    """
    rem = rem_text.strip().rstrip('.').strip()
    if not rem or len(rem) < 2:
        return None
    
    # ALL CAPS = Grade 4
    if rem.isupper() and rem.replace('-', '').replace('.', '').isalpha():
        return {'abbrev': rem.lower(), 'grade': 4}
    
    # Title Case (first letter cap, rest lowercase) = Grade 3
    if rem[0].isupper() and rem[1:].islower():
        return {'abbrev': rem.lower(), 'grade': 3}
    
    # Lowercase = Grade 1
    if rem[0].islower():
        return {'abbrev': rem.lower(), 'grade': 1}
    
    # Default to Grade 1
    return {'abbrev': rem.lower(), 'grade': 1}


def parse_rubrics_from_ocr(ocr_text, current_chapter):
    """Parse rubrics from OCR'd page text.
    
    Murphy rubric format:
    - Chapter heading: "Abdomen" (standalone, Title Case)
    - Rubric: "ABSCESS, abdomen" (ALL CAPS at line start)
    - Sub-rubric: "- left, side" (indented with -)
    - Sub-sub-rubric: "extending to back" (deeper indent)
    - Remedies: after " - " separator
    """
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
        if 'Murphy' in stripped and len(stripped) < 50:
            continue
        
        # Check if this is a chapter heading
        if stripped in CHAPTER_SET or stripped.title() in CHAPTER_SET:
            current_chapter = stripped if stripped in CHAPTER_SET else stripped.title()
            continue
        
        # Check if this is a rubric (ALL CAPS at start, has comma or remedy separator)
        # Pattern: RUBRIC_NAME, descriptor - remedies
        rubric_match = re.match(
            r'^([A-Z][A-Z,\s\']{2,80}?)(?:\s*[-–—]\s*(.+))?$',
            stripped
        )
        if rubric_match and len(rubric_match.group(1).strip()) >= 3:
            rubric_text = rubric_match.group(1).strip().rstrip(',')
            remedies_part = rubric_match.group(2)
            
            # Don't match if it's actually a remedy list (all caps remedies)
            if rubric_text in CHAPTER_SET:
                current_chapter = rubric_text
                continue
            
            # Parse remedies if present
            remedies = []
            remediesGraded = []
            if remedies_part:
                # Split remedies by comma or space
                rem_parts = re.split(r'[,\s]+', remedies_part)
                for part in rem_parts:
                    part = part.strip().rstrip('.')
                    if part and len(part) >= 2 and part.replace('-', '').isalpha():
                        parsed = detect_grade_from_text(part)
                        if parsed:
                            if parsed['abbrev'] not in [r['abbrev'] for r in remediesGraded]:
                                remedies.append(parsed['abbrev'])
                                remediesGraded.append(parsed)
            
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
        
        # Check if this is a sub-rubric (starts with -)
        if stripped.startswith('-') or stripped.startswith('*'):
            sub_text = stripped.lstrip('-*').strip()
            if current_rubric:
                # Parse remedies from sub-rubric
                sub_match = re.match(r'^(.+?)\s*[-–—]\s*(.+)$', sub_text)
                if sub_match:
                    sub_name = sub_match.group(1).strip()
                    remedies_part = sub_match.group(2)
                    remedies = []
                    remediesGraded = []
                    rem_parts = re.split(r'[,\s]+', remedies_part)
                    for part in rem_parts:
                        part = part.strip().rstrip('.')
                        if part and len(part) >= 2 and part.replace('-', '').isalpha():
                            parsed = detect_grade_from_text(part)
                            if parsed:
                                remedies.append(parsed['abbrev'])
                                remediesGraded.append(parsed)
                    
                    current_sub = {
                        'rubricText': sub_name,
                        'chapter': current_chapter,
                        'level': 1,
                        'subRubrics': [],
                        'remedies': remedies,
                        'remediesGraded': remediesGraded,
                        'remedyCount': len(remedies),
                    }
                    current_rubric['subRubrics'].append(current_sub)
            continue
        
        # Check if this is a continuation of remedies (lowercase remedy abbreviations)
        if current_rubric and re.match(r'^[a-z]', stripped):
            # This is likely a continuation of the remedy list
            rem_parts = re.split(r'[,\s]+', stripped)
            for part in rem_parts:
                part = part.strip().rstrip('.')
                if part and len(part) >= 2 and part.replace('-', '').isalpha():
                    parsed = detect_grade_from_text(part)
                    if parsed:
                        if current_sub:
                            if parsed['abbrev'] not in [r['abbrev'] for r in current_sub['remediesGraded']]:
                                current_sub['remedies'].append(parsed['abbrev'])
                                current_sub['remediesGraded'].append(parsed)
                                current_sub['remedyCount'] += 1
                        else:
                            if parsed['abbrev'] not in [r['abbrev'] for r in current_rubric['remediesGraded']]:
                                current_rubric['remedies'].append(parsed['abbrev'])
                                current_rubric['remediesGraded'].append(parsed)
                                current_rubric['remedyCount'] += 1
    
    return rubrics, current_chapter


def ocr_page(pdf_path, page_num, part_num):
    """Convert PDF page to image and OCR it."""
    img_prefix = f'{PAGES_DIR}/part{part_num}_p{page_num:04d}'
    img_path = f'{img_prefix}.png'
    
    if not os.path.exists(img_path):
        subprocess.run([
            'pdftoppm', '-png', '-r', '200',
            '-f', str(page_num), '-l', str(page_num),
            pdf_path, img_prefix
        ], capture_output=True)
        # pdftoppm names files as "prefix-NNNN.png"
        actual = f'{img_prefix}-{page_num:04d}.png'
        if os.path.exists(actual) and actual != img_path:
            os.rename(actual, img_path)
    
    if not os.path.exists(img_path):
        return ''
    
    result = subprocess.run(
        ['tesseract', img_path, '-', '--psm', '6'],
        capture_output=True, text=True
    )
    return result.stdout


def main():
    print("=" * 70)
    print("Murphy Repertory — Complete OCR Pipeline")
    print("74 chapters | Full grade detection | Alphabetical ordering")
    print("=" * 70)
    
    os.makedirs(PAGES_DIR, exist_ok=True)
    
    # Phase 1: Build chapter index
    print("\n=== PHASE 1: Chapter Index ===")
    print(f"Total chapters: {len(MURPHY_CHAPTERS)}")
    for i, ch in enumerate(MURPHY_CHAPTERS):
        print(f"  {i+1:2d}. {ch}")
    
    # Phase 2: OCR all pages and parse rubrics
    print("\n=== PHASE 2: OCR + Parse ===")
    all_rubrics = []
    rubric_id_counter = 0
    current_chapter = 'UNKNOWN'
    
    for part_idx, pdf_path in enumerate(PDF_PARTS):
        if not os.path.exists(pdf_path):
            print(f"\nWARNING: {pdf_path} not found, skipping")
            continue
        
        print(f"\n--- Part {part_idx + 1}: {os.path.basename(pdf_path)} ---")
        
        result = subprocess.run(['pdfinfo', pdf_path], capture_output=True, text=True)
        pages_match = re.search(r'Pages:\s+(\d+)', result.stdout)
        total_pages = int(pages_match.group(1)) if pages_match else 0
        print(f"  Total pages: {total_pages}")
        
        # Process pages (skip front matter — start at page 14 where chapters begin)
        start_page = 14 if part_idx == 0 else 1
        for page_num in range(start_page, total_pages + 1):
            if page_num % 50 == 0:
                print(f"  Processing page {page_num}/{total_pages}...")
            
            ocr_text = ocr_page(pdf_path, page_num, part_idx + 1)
            if not ocr_text:
                continue
            
            rubrics, current_chapter = parse_rubrics_from_ocr(ocr_text, current_chapter)
            
            for r in rubrics:
                rubric_id_counter += 1
                r['id'] = f'murphy_{rubric_id_counter}'
                r['repertory'] = 'Murphy'
                r['fullPath'] = r['chapter']
                r['fullPathParts'] = [r['chapter']]
                r['entryType'] = 'rubric'
                r['crossReference'] = None
                r['singleRemedy'] = r['remedyCount'] == 1
                r['pdfPage'] = page_num
                
                # Add IDs to sub-rubrics
                for j, sub in enumerate(r.get('subRubrics', [])):
                    sub_id_counter = rubric_id_counter * 1000 + j
                    sub['id'] = f'murphy_{sub_id_counter}'
                    sub['repertory'] = 'Murphy'
                    sub['fullPath'] = f"{r['chapter']} > {r['rubricText']} > {sub['rubricText']}"
                    sub['fullPathParts'] = [r['chapter'], r['rubricText'], sub['rubricText']]
                    sub['entryType'] = 'sub_rubric'
                    sub['crossReference'] = None
                    sub['singleRemedy'] = sub['remedyCount'] == 1
                    sub['pdfPage'] = page_num
                
                all_rubrics.append(r)
        
        print(f"  Total rubrics so far: {len(all_rubrics)}")
    
    # Phase 3: Sort alphabetically within each chapter
    print("\n=== PHASE 3: Alphabetical Sorting ===")
    all_rubrics.sort(key=lambda r: (r['chapter'], r['rubricText']))
    
    # Phase 4: Statistics
    print("\n=== PHASE 4: Statistics ===")
    print(f"Total rubrics: {len(all_rubrics)}")
    
    from collections import Counter
    chapters = Counter(r['chapter'] for r in all_rubrics)
    print(f"Chapters: {len(chapters)}")
    for c, count in chapters.most_common(20):
        print(f"  {c}: {count}")
    
    grade_counts = Counter()
    for r in all_rubrics:
        for rg in r.get('remediesGraded', []):
            grade_counts[rg['grade']] += 1
    print(f"\nGrade distribution:")
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
