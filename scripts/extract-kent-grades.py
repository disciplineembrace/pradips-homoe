#!/usr/bin/env python3
"""
Kent Repertory — Typography-Aware Extraction
============================================
Extracts rubric hierarchy + remedy grades from Kent's Repertory PDF.

Kent grading convention (confirmed from typography analysis):
  BOLD remedy   = Grade 3 (HIGH)   → RED
  ITALIC remedy = Grade 2 (LOW)    → GREEN
  ROMAN remedy  = Grade 1 (NORMAL) → BLACK

This script:
1. Reads Kent PDF page by page using PyMuPDF (fitz)
2. Extracts text spans with font/typography metadata
3. Parses rubric hierarchy (indented text)
4. Extracts remedy tokens with their typography (bold/italic/roman)
5. Assigns grades based on source typography
6. Outputs structured JSON with verified grades

NEVER fabricates grades — only uses what the source PDF shows.
"""
import fitz  # PyMuPDF
import json, re, os, sys
from collections import defaultdict

KENT_PDF = "/tmp/my-project/upload/REPERTORY OF THE HOMOEOPATHIC  MATERIA MEDICA _BY J.T.KENT.PDF"
OUTPUT = "/home/z/my-project/data/kent-repertory-graded.json"

# Kent grading convention (confirmed from source typography):
# Bold = Grade 3 (highest), Italic = Grade 2 (middle), Roman = Grade 1 (normal)
def get_grade_from_typography(is_bold, is_italic):
    if is_bold:
        return 3  # HIGH
    elif is_italic:
        return 2  # LOW
    else:
        return 1  # NORMAL

def main():
    print(f"Opening Kent PDF: {KENT_PDF}")
    doc = fitz.open(KENT_PDF)
    total_pages = len(doc)
    print(f"Total pages: {total_pages}")

    # Find where repertory content starts (after preface)
    # Kent repertory chapters: Mind, Vertigo, Head, Eye, Vision, Ear, Hearing,
    # Nose, Face, Mouth, Teeth, Throat, Stomach, Abdomen, Rectum, Stool, etc.
    chapter_names = [
        'MIND', 'VERTIGO', 'HEAD', 'EYE', 'VISION', 'EAR', 'HEARING',
        'NOSE', 'FACE', 'MOUTH', 'TEETH', 'THROAT', 'EXTERNAL THROAT',
        'STOMACH', 'ABDOMEN', 'RECTUM', 'STOOL', 'BLADDER', 'KIDNEYS',
        'PROSTATE GLAND', 'URETHRA', 'URINE', 'URINARY ORGANS',
        'MALE GENITALIA/SEX', 'FEMALE GENITALIA/SEX',
        'MALE AND FEMALE GENITALIA/SEX', 'LARYNX AND TRACHEA',
        'RESPIRATION', 'COUGH', 'EXPECTORATION', 'CHEST', 'BACK',
        'EXTREMITIES', 'SLEEP', 'DREAMS', 'CHILL', 'FEVER',
        'PERSPIRATION', 'SKIN', 'GENERALS'
    ]

    rubrics = []
    current_chapter = ""
    stats = {'pages_processed': 0, 'rubrics_found': 0, 'remedies_with_grades': 0}
    grade_counts = {3: 0, 2: 0, 1: 0}

    # Process pages — start from where repertory begins
    # (skip preface, table of contents)
    for page_num in range(50, total_pages):
        if page_num % 500 == 0:
            print(f"  Processing page {page_num}/{total_pages}... (rubrics: {stats['rubrics_found']})", flush=True)

        page = doc[page_num]
        blocks = page.get_text("dict")["blocks"]

        for block in blocks:
            if "lines" not in block:
                continue

            for line in block["lines"]:
                # Collect spans in this line
                line_spans = []
                for span in line["spans"]:
                    text = span["text"].strip()
                    if not text:
                        continue
                    font = span["font"]
                    flags = span["flags"]
                    is_bold = bool(flags & 2**4)
                    is_italic = bool(flags & 2**1)
                    size = round(span["size"], 1)
                    line_spans.append({
                        'text': text,
                        'font': font,
                        'bold': is_bold,
                        'italic': is_italic,
                        'size': size,
                    })

                if not line_spans:
                    continue

                # Check if this line is a chapter header (all caps, bold)
                full_line = ' '.join(s['text'] for s in line_spans).strip()
                if full_line in chapter_names and any(s['bold'] for s in line_spans):
                    current_chapter = full_line
                    continue

                # Skip page numbers, headers
                if re.match(r'^\d+$', full_line):
                    continue
                if 'Repertory of the Homoeopathic' in full_line:
                    continue

                # Check if this line has remedies (contains ": " pattern with remedy abbreviations)
                # Kent format: "rubric text : Rem1., rem2., rem3."
                if ':' not in full_line:
                    continue

                # Parse rubric + remedies
                parts = full_line.split(':', 1)
                if len(parts) < 2:
                    continue

                rubric_text = parts[0].strip()
                remedies_text = parts[1].strip()

                if not rubric_text or not remedies_text:
                    continue

                # Skip if rubric text is too short or looks like header
                if len(rubric_text) < 3:
                    continue

                # Extract remedies with their typography
                # Walk through spans to find remedy tokens after the ":"
                remedies_with_grades = []
                found_colon = False
                for span in line_spans:
                    if ':' in span['text']:
                        found_colon = True
                        # If colon is in the middle, take text after it
                        after_colon = span['text'].split(':', 1)[-1].strip()
                        if after_colon:
                            grade = get_grade_from_typography(span['bold'], span['italic'])
                            # Split by comma to get individual remedies
                            for rem in after_colon.split(','):
                                rem = rem.strip().rstrip('.')
                                if rem and len(rem) >= 2 and len(rem) <= 15:
                                    remedies_with_grades.append({'remedy': rem, 'grade': grade})
                                    grade_counts[grade] = grade_counts.get(grade, 0) + 1
                        continue

                    if found_colon:
                        grade = get_grade_from_typography(span['bold'], span['italic'])
                        for rem in span['text'].split(','):
                            rem = rem.strip().rstrip('.')
                            if rem and len(rem) >= 2 and len(rem) <= 15:
                                # Filter out non-remedy text
                                if not re.match(r'^[A-Z]', rem):
                                    continue
                                remedies_with_grades.append({'remedy': rem, 'grade': grade})
                                grade_counts[grade] = grade_counts.get(grade, 0) + 1

                if remedies_with_grades:
                    # Build full path: Chapter → Rubric
                    full_path = f"{current_chapter} → {rubric_text}" if current_chapter else rubric_text

                    rubrics.append({
                        'id': f"kent-graded-{stats['rubrics_found']}",
                        'chapter': current_chapter,
                        'rubric': rubric_text,
                        'fullPath': full_path,
                        'author': 'Kent',
                        'pdfPage': page_num + 1,
                        'remedies': [r['remedy'] for r in remedies_with_grades],
                        'remediesGraded': remedies_with_grades,
                    })
                    stats['rubrics_found'] += 1
                    stats['remedies_with_grades'] += len(remedies_with_grades)

        stats['pages_processed'] += 1

    doc.close()

    print(f"\n=== RESULTS ===")
    print(f"Pages processed: {stats['pages_processed']}")
    print(f"Rubrics found: {stats['rubrics_found']}")
    print(f"Remedies with grades: {stats['remedies_with_grades']}")
    print(f"Grade distribution: {grade_counts}")

    # Save
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(rubrics, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUTPUT):,} bytes to {OUTPUT}")

    # Show samples
    print(f"\n=== SAMPLE RUBRICS ===")
    for r in rubrics[:3]:
        print(f"\n  Chapter: {r['chapter']}")
        print(f"  Rubric: {r['rubric']}")
        print(f"  Full Path: {r['fullPath']}")
        print(f"  Remedies: {r['remedies'][:5]}")
        print(f"  Graded: {r['remediesGraded'][:5]}")

if __name__ == '__main__':
    main()
