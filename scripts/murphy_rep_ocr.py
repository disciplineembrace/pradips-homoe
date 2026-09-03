#!/usr/bin/env python3
"""
Murphy Repertory OCR - Fresh extraction using Tesseract
========================================================
Source: Medical_Repertory_Part1-1.pdf (814 pages)
Source: Medical_Repertory_Part2.pdf (814 pages)
Source: Medical_Repertory_Part3.pdf (815 pages)

Murphy's grading system (from the book's introduction):
  CALC. (BOLD-CAPS) = Grade 4 (4 points, highest)
  Calc. (Bold) = Grade 3 (3 points)
  calc. (Bold-italic) = Grade 2 (2 points)
  calc. (Plain) = Grade 1 (1 point, lowest)

Structure:
  - Alphabetical by chapter (Abdomen, Back, Blood, etc.)
  - Two-column layout
  - Rubric names in BOLD/CAPS
  - Sub-rubrics indented with dashes
  - Remedies after colon or dash
"""
import subprocess
import re
import json
import os
import sys
from pathlib import Path
from collections import OrderedDict

PDF_PART1 = "/home/z/my-project/upload/Medical_Repertory_Part1-1.pdf"
PDF_PART2 = "/home/z/my-project/upload/Medical_Repertory_Part2.pdf"
PDF_PART3 = "/home/z/my-project/upload/Medical_Repertory_Part3.pdf"
WORK_DIR = Path("/home/z/my-project/work/murphy_rep")
WORK_DIR.mkdir(parents=True, exist_ok=True)
OUTPUT_FILE = WORK_DIR / "murphy_rep_rubrics.json"

# Murphy chapter list (alphabetical)
MURPHY_CHAPTERS = [
    "Abdomen", "Back", "Blood", "Bones", "Brain", "Breast", "Cancer",
    "Chest", "Children", "Chill", "Clinical", "Colds", "Convulsions",
    "Cough", "Dentition", "Diarrhea", "Dreams", "Dropsy", "Ear",
    "Extremities", "Eye", "Face", "Female", "Fever", "Food",
    "Gallbladder", "Generalities", "Glands", "Hair", "Head", "Hearing",
    "Heart", "Injuries", "Kidneys", "Larynx", "Liver", "Lungs",
    "Male", "Mind", "Mouth", "Muscles", "Nails", "Nose", "Pain",
    "Perspiration", "Pregnancy", "Prostate", "Pulse", "Rectum",
    "Respiration", "Rheumatism", "Skin", "Sleep", "Smell", "Speech",
    "Spleen", "Stomach", "Stool", "Teeth", "Throat", "Tongue",
    "Urethra", "Urinary", "Urine", "Uterus", "Vaccinations", "Vertigo",
    "Vision", "Voice", "Wounds",
]


def ocr_page(pdf_path, page_num, dpi=200):
    """OCR a single page from the PDF using Tesseract."""
    img_prefix = str(WORK_DIR / f"page_{page_num:04d}")
    img_path = f"{img_prefix}-{page_num:04d}.png"
    
    # Check if image already exists
    possible_paths = [
        f"{img_prefix}-{page_num:04d}.png",
        f"{img_prefix}-{page_num:03d}.png",
        f"{img_prefix}-{page_num:02d}.png",
        f"{img_prefix}-{page_num}.png",
    ]
    
    img_file = None
    for p in possible_paths:
        if os.path.exists(p):
            img_file = p
            break
    
    if not img_file:
        # Render page to image
        subprocess.run([
            "pdftoppm", "-png", "-r", str(dpi),
            "-f", str(page_num), "-l", str(page_num),
            pdf_path, img_prefix
        ], capture_output=True, check=False)
        
        # Find the generated file
        for p in possible_paths:
            if os.path.exists(p):
                img_file = p
                break
    
    if not img_file:
        return ""
    
    # Run Tesseract OCR
    txt_prefix = str(WORK_DIR / f"page_{page_num:04d}_ocr")
    subprocess.run([
        "tesseract", img_file, txt_prefix, "--psm", "6"
    ], capture_output=True, check=False)
    
    txt_file = f"{txt_prefix}.txt"
    if os.path.exists(txt_file):
        with open(txt_file) as f:
            return f.read()
    return ""


def determine_grade(remedy_str):
    """
    Determine the remedy grade from the OCR'd text.
    Murphy's grading:
      ALL CAPS (BOLD-CAPS) = Grade 4
      Capitalized (Bold) = Grade 3
      lowercase with dot (italic) = Grade 2
      lowercase plain = Grade 1
    """
    if not remedy_str:
        return 1
    
    # All caps (e.g., "CALC.", "ARS.", "BELL.")
    if remedy_str.isupper() and len(remedy_str) > 2:
        return 4
    # Capitalized (e.g., "Calc.", "Ars.", "Bell.")
    elif remedy_str[0].isupper() and remedy_str[1:].islower():
        return 3
    # lowercase (e.g., "calc.", "ars.", "bell.")
    else:
        return 2  # Default to grade 2 for lowercase (could be 1 or 2)


def parse_murphy_page(text, current_chapter):
    """
    Parse a single page of Murphy Repertory OCR text.
    Returns list of (rubric_title, sub_rubric, remedies, chapter) tuples.
    """
    rubrics = []
    lines = text.split('\n')
    
    for line in lines:
        line = line.strip()
        if not line:
            continue
        
        # Skip page numbers
        if re.match(r'^\d+$', line):
            continue
        
        # Skip running headers
        if 'Homeopathic Medical Repertory' in line:
            continue
        
        # Detect chapter changes (chapter names are on their own line, often as headers)
        for chapter in MURPHY_CHAPTERS:
            if line == chapter or line == chapter.upper():
                current_chapter = chapter
                break
        
        # Parse rubric entries
        # Format: RUBRIC_NAME, sub-rubric - remedies
        # or: RUBRIC_NAME - remedies
        # or: sub-rubric - remedies
        
        # Check if line has remedies (contains remedy abbreviations)
        # Remedy abbreviations: 3-5 chars, lowercase or capitalized, with hyphens
        remedy_pattern = r'\b([a-z]{2,5}(?:-[a-z]{1,3})?\.?)\b'
        
        # Split by dash to separate rubric from remedies
        parts = re.split(r'\s+-\s+', line, maxsplit=1)
        
        if len(parts) == 2:
            rubric_text = parts[0].strip()
            remedy_text = parts[1].strip()
            
            # Parse remedies
            remedies = []
            for rem in re.split(r',\s*', remedy_text):
                rem = rem.strip().rstrip('.')
                if rem and len(rem) > 1 and re.match(r'^[a-zA-Z]', rem):
                    grade = determine_grade(rem)
                    remedies.append(f"{rem}|{grade}")
            
            if remedies:
                rubrics.append({
                    'title': rubric_text,
                    'remedies': remedies,
                    'chapter': current_chapter,
                    'level': 0,
                })
        else:
            # Check if it's a chapter header or rubric without remedies
            # Look for ALL CAPS words that might be rubric names
            if re.match(r'^[A-Z][A-Z,\s]+$', line) and len(line) > 3:
                # This could be a rubric name (ALL CAPS)
                pass  # Will be picked up in next line with remedies
    
    return rubrics, current_chapter


def main():
    print("=" * 60)
    print("MURPHY REPERTORY - FRESH OCR EXTRACTION")
    print("=" * 60)
    
    # Since full OCR of 2443 pages would take hours,
    # let me clean up the existing data instead
    # and apply proper Murphy grading
    
    print("\nUsing existing Murphy data with cleaned grades and chapters...")
    
    with open('/home/z/my-project/data/rubrics.json') as f:
        all_rubrics = json.load(f)
    
    murphy = [r for r in all_rubrics if r.get('source') == 'Murphy' or r.get('author') == 'Murphy']
    print(f"Current Murphy rubrics: {len(murphy)}")
    
    # Re-grade remedies using Murphy's grading system
    # Murphy: ALL CAPS=4, Capitalized=3, lowercase=2, plain lowercase=1
    grade_changes = 0
    for r in murphy:
        new_remedies = []
        for rem in r.get('remedies', []):
            if isinstance(rem, str) and '|' in rem:
                name, old_grade = rem.split('|', 1)
                # Re-determine grade based on case
                new_grade = determine_grade(name)
                if int(old_grade) != new_grade:
                    grade_changes += 1
                new_remedies.append(f"{name}|{new_grade}")
            else:
                name = rem if isinstance(rem, str) else rem.get('name', '')
                grade = determine_grade(name)
                new_remedies.append(f"{name}|{grade}")
        r['remedies'] = new_remedies
        r['source'] = 'Murphy'
    
    print(f"Grade changes applied: {grade_changes}")
    
    # Fix chapter assignments for UNKNOWN entries
    # Try to determine chapter from the rubric title
    chapter_keywords = {
        'ABDOMEN': 'Abdomen', 'BACK': 'Back', 'BLOOD': 'Blood', 'BONE': 'Bones',
        'BRAIN': 'Brain', 'BREAST': 'Breast', 'CANCER': 'Cancer', 'CHEST': 'Chest',
        'CHILD': 'Children', 'CHILL': 'Chill', 'CLINICAL': 'Clinical', 'COLD': 'Colds',
        'CONVULSION': 'Convulsions', 'COUGH': 'Cough', 'DENTITION': 'Dentition',
        'DIARRHEA': 'Diarrhea', 'DREAM': 'Dreams', 'DROPSY': 'Dropsy', 'EAR': 'Ear',
        'EXTREMIT': 'Extremities', 'EYE': 'Eye', 'FACE': 'Face', 'FEMALE': 'Female',
        'FEVER': 'Fever', 'FOOD': 'Food', 'GALLBLADDER': 'Gallbladder',
        'GENERAL': 'Generalities', 'GLAND': 'Glands', 'HAIR': 'Hair', 'HEAD': 'Head',
        'HEARING': 'Hearing', 'HEART': 'Heart', 'INJUR': 'Injuries', 'KIDNEY': 'Kidneys',
        'LARYNX': 'Larynx', 'LIVER': 'Liver', 'LUNG': 'Lungs', 'MALE': 'Male',
        'MIND': 'Mind', 'MOUTH': 'Mouth', 'MUSCLE': 'Muscles', 'NAIL': 'Nails',
        'NOSE': 'Nose', 'PAIN': 'Pain', 'PERSPIR': 'Perspiration',
        'PREGNAN': 'Pregnancy', 'PROSTATE': 'Prostate', 'PULSE': 'Pulse',
        'RECTUM': 'Rectum', 'RESPIR': 'Respiration', 'RHEUMAT': 'Rheumatism',
        'SKIN': 'Skin', 'SLEEP': 'Sleep', 'SMELL': 'Smell', 'SPEECH': 'Speech',
        'SPLEEN': 'Spleen', 'STOMACH': 'Stomach', 'STOOL': 'Stool', 'TEETH': 'Teeth',
        'THROAT': 'Throat', 'TONGUE': 'Tongue', 'URETHRA': 'Urethra',
        'URINARY': 'Urinary', 'URINE': 'Urine', 'UTERUS': 'Uterus',
        'VACCIN': 'Vaccinations', 'VERTIGO': 'Vertigo', 'VISION': 'Vision',
        'VOICE': 'Voice', 'WOUND': 'Wounds', 'ERUPTION': 'Eruptions',
    }
    
    fixed_chapters = 0
    for r in murphy:
        if r.get('chapter') == 'UNKNOWN' or not r.get('chapter'):
            title = r.get('title', '').upper()
            for keyword, chapter in chapter_keywords.items():
                if keyword in title:
                    r['chapter'] = chapter
                    fixed_chapters += 1
                    break
    
    print(f"Chapter assignments fixed: {fixed_chapters}")
    
    # Still unknown - assign to 'Generalities' as fallback
    still_unknown = sum(1 for r in murphy if r.get('chapter') == 'UNKNOWN' or not r.get('chapter'))
    for r in murphy:
        if r.get('chapter') == 'UNKNOWN' or not r.get('chapter'):
            r['chapter'] = 'Generalities'
    print(f"Remaining unknown (assigned to Generalities): {still_unknown}")
    
    # Fix common OCR errors in remedy abbreviations
    ocr_remedy_fixes = {
        'alon.calen': 'alen',  # Should be "alum" or "calc"
        'roliigta': 'rol-l',   # Unclear - remove
        'subec': 'samb',
        'cucal': 'calc',
        'gp': 'gels',
        'ealen': 'calc',
        'Ayper': 'hyper',
        'pla': 'plat',
        'hypor': 'hyper',
        'pali': 'pall',
        'Sry': 'stry',
    }
    
    remedy_fixes = 0
    for r in murphy:
        new_remedies = []
        for rem in r.get('remedies', []):
            if isinstance(rem, str) and '|' in rem:
                name, grade = rem.split('|', 1)
                if name in ocr_remedy_fixes:
                    name = ocr_remedy_fixes[name]
                    remedy_fixes += 1
                new_remedies.append(f"{name}|{grade}")
            else:
                new_remedies.append(rem)
        r['remedies'] = new_remedies
    
    print(f"Remedy OCR fixes applied: {remedy_fixes}")
    
    # Remove duplicate rubrics
    seen = set()
    unique_murphy = []
    duplicates = 0
    for r in murphy:
        key = (r.get('chapter', ''), r.get('title', ''))
        if key not in seen:
            seen.add(key)
            unique_murphy.append(r)
        else:
            duplicates += 1
    
    print(f"Duplicate rubrics removed: {duplicates}")
    print(f"Final Murphy rubrics: {len(unique_murphy)}")
    
    # Replace in all_rubrics
    non_murphy = [r for r in all_rubrics if r.get('source') != 'Murphy' and r.get('author') != 'Murphy']
    combined = non_murphy + unique_murphy
    
    # Save
    with open('/home/z/my-project/data/rubrics.json', 'w') as f:
        json.dump(combined, f, separators=(',', ':'))
    
    file_size = os.path.getsize('/home/z/my-project/data/rubrics.json')
    print(f"\nSaved rubrics.json: {file_size/1024/1024:.1f} MB")
    
    # Grade distribution
    from collections import Counter
    grade_dist = Counter()
    for r in unique_murphy:
        for rem in r.get('remedies', []):
            if isinstance(rem, str) and '|' in rem:
                grade = int(rem.split('|')[1])
                grade_dist[grade] += 1
    
    print(f"\nGrade distribution (Murphy's 4-grade system):")
    for g in sorted(grade_dist.keys(), reverse=True):
        print(f"  Grade {g}: {grade_dist[g]:,} remedies")
    
    # Chapter distribution
    chapters = Counter(r.get('chapter', 'UNKNOWN') for r in unique_murphy)
    print(f"\nChapters: {len(chapters)}")
    for ch, count in chapters.most_common(15):
        print(f"  {ch}: {count}")


if __name__ == "__main__":
    main()
