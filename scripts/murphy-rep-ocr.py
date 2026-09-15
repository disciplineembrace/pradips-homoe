#!/usr/bin/env python3
"""
Murphy Repertory OCR Pipeline — extracts rubrics with grade detection.

Murphy's Medical Repertory structure (from OCR'd pages):
- Chapter headings: "Abdomen", "Back", "Chest", etc.
- Rubrics: ALL CAPS at start of line, e.g., "CLAWING, pain"
- Sub-rubrics: indented with '-', e.g., "- extending to back - nat-m."
- Remedies with grades:
  - ALL CAPS (BELL.) = Grade 4 (Bold-Capitals)
  - Bold (Calc.) = Grade 3 (Bold)
  - Italics (calc.) = Grade 2 (Bold-Italics)
  - Plain (calc.) = Grade 1 (Plain type)

Due to OCR limitations, we cannot reliably detect bold vs italic vs plain
from text alone. We'll use heuristics:
- ALL CAPS remedies = Grade 4
- Mixed case remedies starting with capital = Grade 3
- Lowercase remedies = Grade 1 (most common in Murphy)

Output: data/murphy_rebuilt.json (Kent framework compatible)
"""
import json
import os
import re
import subprocess
import sys
import glob
from pathlib import Path

OUT_DIR = '/home/z/my-project/data'
PAGES_DIR = '/tmp/murphy-rep-pages'
PDF_PARTS = [
    '/tmp/my-project/upload/Medical_Repertory_Part1-1.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part2.pdf',
    '/tmp/my-project/upload/Medical_Repertory_Part3.pdf',
]

# Murphy repertory chapters (from source)
MURPHY_CHAPTERS = {
    'Abdomen', 'Back', 'Bladder', 'Blood', 'Bones', 'Chest', 'Chill',
    'Clinical', 'Cough', 'Dreams', 'Ear', 'Expectoration', 'Eye',
    'Face', 'Female', 'Fever', 'Food', 'Generals', 'Genitalia',
    'Glands', 'Head', 'Heart', 'Kidneys', 'Larynx', 'Limbs',
    'Liver', 'Lungs', 'Male', 'Mental', 'Mind', 'Mouth', 'Nasal',
    'Neck', 'Nose', 'Perspiration', 'Pregnancy', 'Prostate',
    'Rectum', 'Respiration', 'Skin', 'Sleep', 'Spleen', 'Stomach',
    'Stool', 'Teeth', 'Throat', 'Tongue', 'Urinary', 'Vertigo',
    'Vision', 'Pain', 'Eruptions', 'Nerves', 'Pulse', 'Voice',
    'Female Genitalia', 'Male Genitalia', 'Extremities',
    'Nervous System', 'Circulatory System', 'Digestive System',
    'Respiratory System', 'Urinary System', 'Reproductive System',
    'Skin and Eruptions', 'Glands and Lymphatics',
    'Sensations', 'Modalities', 'Concomitants',
}


def parse_remedy_with_grade(rem_text):
    """Parse a remedy abbreviation and detect its grade.
    
    Murphy grading:
    - ALL CAPS (BELL.) = Grade 4 (Bold-Capitals)
    - Title Case (Calc.) = Grade 3 (Bold)
    - Lowercase (calc.) = Grade 1 (Plain)
    """
    rem = rem_text.strip().rstrip('.').strip()
    if not rem:
        return None
    
    # Grade 4: ALL CAPS (at least 2 chars)
    if rem.isupper() and len(rem) >= 2 and rem.replace('-','').isalpha():
        return {'abbrev': rem.lower(), 'grade': 4}
    
    # Grade 3: Title Case (first letter cap, rest lowercase)
    if rem[0].isupper() and rem[1:].islower() and len(rem) >= 2:
        return {'abbrev': rem.lower(), 'grade': 3}
    
    # Grade 1: lowercase
    if rem.islower() or (rem[0].islower()):
        return {'abbrev': rem.lower(), 'grade': 1}
    
    # Default
    return {'abbrev': rem.lower(), 'grade': 1}


def parse_rubric_line(line, current_chapter):
    """Parse a rubric line from Murphy repertory.
    
    Format: RUBRIC, descriptor - rem1., rem2., REM3., rem4.
    Or:     RUBRIC, descriptor, sub-descriptor - rem1., rem2.
    """
    # Check if this is a rubric line (starts with ALL CAPS)
    # Rubrics are ALL CAPS at the start
    m = re.match(r'^([A-Z][A-Z\s,\'\-]+?)(?:\s*[-–—]\s*(.+))?$', line.strip())
    if not m:
        return None
    
    rubric_text = m.group(1).strip()
    remedies_part = m.group(2)
    
    if not remedies_part:
        return None
    
    # Check if rubric_text looks like a rubric (not a chapter or page number)
    if len(rubric_text) < 3 or rubric_text.isdigit():
        return None
    
    # Parse remedies
    remedies = []
    remediesGraded = []
    
    # Split by comma, but handle abbreviations with periods
    rem_parts = re.split(r'[,\s]+', remedies_part)
    current_abbrev = ''
    
    for part in rem_parts:
        part = part.strip().rstrip('.').strip()
        if not part:
            continue
        # Check if this is a remedy abbreviation
        if re.match(r'^[A-Za-z][a-z-]+$', part) or re.match(r'^[A-Z][A-Z-]+$', part):
            parsed = parse_remedy_with_grade(part)
            if parsed:
                remedies.append(parsed['abbrev'])
                remediesGraded.append(parsed)
                current_abbrev = part
    
    if not remedies:
        return None
    
    return {
        'rubricText': rubric_text,
        'chapter': current_chapter,
        'remedies': remedies,
        'remediesGraded': remediesGraded,
        'remedyCount': len(remedies),
    }


def main():
    print("=" * 60)
    print("Murphy Repertory OCR Pipeline")
    print("=" * 60)
    
    os.makedirs(PAGES_DIR, exist_ok=True)
    
    all_rubrics = []
    rubric_id = 0
    
    for pdf_idx, pdf_path in enumerate(PDF_PARTS):
        if not os.path.exists(pdf_path):
            print(f"\nWARNING: {pdf_path} not found, skipping")
            continue
        
        print(f"\n--- Processing Part {pdf_idx + 1}: {os.path.basename(pdf_path)} ---")
        
        # Get page count
        result = subprocess.run(['pdfinfo', pdf_path], capture_output=True, text=True)
        pages_match = re.search(r'Pages:\s+(\d+)', result.stdout)
        total_pages = int(pages_match.group(1)) if pages_match else 100
        print(f"  Total pages: {total_pages}")
        
        # For now, process a sample (first 50 pages) to verify structure
        # Full processing would take hours
        sample_pages = min(50, total_pages)
        print(f"  Processing first {sample_pages} pages (sample)")
        
        current_chapter = 'UNKNOWN'
        
        for page_num in range(1, sample_pages + 1):
            # Convert page to image
            img_path = f'{PAGES_DIR}/part{pdf_idx+1}_page-{page_num:04d}.png'
            if not os.path.exists(img_path):
                subprocess.run([
                    'pdftoppm', '-png', '-r', '200',
                    '-f', str(page_num), '-l', str(page_num),
                    pdf_path, f'{PAGES_DIR}/part{pdf_idx+1}'
                ], capture_output=True)
                # pdftoppm names files like "part1-001.png"
                generated = f'{PAGES_DIR}/part{pdf_idx+1}-{page_num:04d}.png'
                if os.path.exists(generated) and generated != img_path:
                    os.rename(generated, img_path)
            
            if not os.path.exists(img_path):
                continue
            
            # OCR the page
            result = subprocess.run(
                ['tesseract', img_path, '-'],
                capture_output=True, text=True
            )
            page_text = result.stdout
            
            # Process each line
            for line in page_text.split('\n'):
                line = line.strip()
                if not line:
                    continue
                
                # Check if this is a chapter heading
                if line in MURPHY_CHAPTERS or line.title() in MURPHY_CHAPTERS:
                    current_chapter = line.upper() if line.isupper() else line.title()
                    continue
                
                # Try to parse as rubric
                rubric = parse_rubric_line(line, current_chapter)
                if rubric:
                    rubric_id += 1
                    rec = {
                        'id': f'murphy_{rubric_id}',
                        'repertory': 'Murphy',
                        'chapter': rubric['chapter'],
                        'level': 0,
                        'rubricText': rubric['rubricText'],
                        'fullPath': rubric['chapter'],
                        'fullPathParts': [rubric['chapter']],
                        'entryType': 'rubric',
                        'crossReference': None,
                        'remedies': rubric['remedies'],
                        'remediesGraded': rubric['remediesGraded'],
                        'remedyCount': rubric['remedyCount'],
                        'singleRemedy': rubric['remedyCount'] == 1,
                        'pdfPage': page_num,
                    }
                    all_rubrics.append(rec)
        
        print(f"  Parsed {len(all_rubrics)} rubrics so far")
    
    print(f"\n=== TOTAL: {len(all_rubrics)} Murphy rubrics parsed ===")
    
    if all_rubrics:
        # Show sample
        print(f"\nSample rubric:")
        print(json.dumps(all_rubrics[0], indent=2, ensure_ascii=False)[:500])
        
        # Chapter distribution
        from collections import Counter
        chapters = Counter(r['chapter'] for r in all_rubrics)
        print(f"\nChapters ({len(chapters)}):")
        for c, count in chapters.most_common(10):
            print(f"  {c}: {count}")
    
    # Write output
    out_path = f'{OUT_DIR}/murphy_rebuilt.json'
    with open(out_path, 'w') as f:
        json.dump(all_rubrics, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {out_path} ({os.path.getsize(out_path):,} bytes)")
    
    print(f"\n{'='*60}")
    print("NOTE: This is a SAMPLE (first 50 pages per part).")
    print("Full OCR of 2,443 pages would take several hours.")
    print("The existing 6,169 Murphy rubrics in rubrics.json remain")
    print("available for the Repertory section.")
    print(f"{'='*60}")


if __name__ == '__main__':
    main()
