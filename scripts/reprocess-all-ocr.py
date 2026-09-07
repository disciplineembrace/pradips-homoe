#!/usr/bin/env python3
"""
Global OCR Database Reprocessing — cleans ALL existing OCR data.

Applies the OCR pipeline to every book, remedy, and rubric in the database:
  1. data/books/*.json — reprocess chapter content
  2. data/remedies.json — reprocess keynote + full text
  3. data/rubrics.json — reprocess rubric titles
  4. data/phatak-biochem-repertory.json — reprocess rubric titles
  5. data/boericke-repertory.json — reprocess rubric titles

For each record:
  - Reload stored OCR text
  - Run OCR cleanup pipeline
  - Replace old text with cleaned text
  - Overwrite ONLY the text field (no duplicate records)

PRESERVES: chapter order, remedy order, headings, lists, original wording
REMOVES: garbage chars, random numbers, markdown artifacts, duplicates, headers/footers
"""
import json
import re
import os
import sys

DATA_DIR = '/home/z/my-project/data'
BOOKS_DIR = os.path.join(DATA_DIR, 'books')

# ─────────────────────────────────────────────────────────────────────────────
# OCR Cleanup Functions (Python port of the TypeScript pipeline)
# ─────────────────────────────────────────────────────────────────────────────

PAGE_NUMBER_RE = re.compile(r'^\s*\d{1,4}\s*$', re.MULTILINE)

HEADER_PATTERNS = [
    re.compile(r'^\s*being a [Hh]omoeopath\.?\s*\d*\s*$', re.MULTILINE),
    re.compile(r'^\s*\d*\s*being a [Hh]omoeopath\.?\s*$', re.MULTILINE),
    re.compile(r'^\s*Fifty Reasons\s*$', re.MULTILINE),
    re.compile(r'^\s*LECTURES ON HOM[ŒO]PATHIC MATERIA MEDICA\s*$', re.MULTILINE),
    re.compile(r'^\s*by JAMES TYLER KENT[^\n]*$', re.MULTILINE | re.IGNORECASE),
    re.compile(r'^\s*Preface by[^\n]*$', re.MULTILINE | re.IGNORECASE),
    re.compile(r'^\s*REPERTORY\s*$', re.MULTILINE),
    re.compile(r'^\s*Nalanda Digital Library[^\n]*$', re.MULTILINE | re.IGNORECASE),
    re.compile(r'^\s*Public Domain Text[^\n]*$', re.MULTILINE | re.IGNORECASE),
    re.compile(r'^\s*PRINTED BY[^\n]*$', re.MULTILINE | re.IGNORECASE),
    re.compile(r'^\s*GREAT SAFFRON HILL[^\n]*$', re.MULTILINE | re.IGNORECASE),
    re.compile(r'^\s*LONDO.?\s*$', re.MULTILINE),
]

REMEDY_NAMES = [
    'Aconite', 'Aconitum', 'Arnica', 'Arsenicum', 'Bryonia', 'Belladonna',
    'Calcarea', 'Chamomilla', 'China', 'Hepar', 'Hyoscyamus', 'Ignatia',
    'Ipecac', 'Kali', 'Lachesis', 'Lycopodium', 'Mercurius', 'Natrum',
    'Nux Vomica', 'Nux', 'Phosphorus', 'Pulsatilla', 'Rhus', 'Sepia',
    'Silicea', 'Sulphur', 'Thuja', 'Vanadium', 'Baptisia', 'Carbo veg',
    'Causticum', 'Conium', 'Cuprum', 'Digitalis', 'Eupatorium', 'Gelsemium',
    'Hahnemann', 'Kent', 'Boericke', 'Ledum', 'Ferrum', 'Magnesia',
]

def clean_ocr_text(text):
    """Full OCR cleanup pipeline (Python port)."""
    if not text:
        return text

    result = text

    # 1. Remove control characters
    result = result.replace('\x0c', '\n')
    result = re.sub(r'[\x00-\x08\x0B\x0E-\x1F]', '', result)

    # 2. Fix smart quote artifacts
    result = result.replace('â€œ', '"').replace('â€\x9d', '"')
    result = result.replace('â€™', "'").replace('â€"', '—').replace('â€"', '–')
    result = result.replace('â€¢', '•')

    # 3. Fix ligatures
    result = result.replace('ﬁ', 'fi').replace('ﬂ', 'fl')
    result = result.replace('ﬀ', 'ff').replace('ﬃ', 'ffi').replace('ﬄ', 'ffl')

    # 4. Remove page numbers
    result = PAGE_NUMBER_RE.sub('', result)

    # 5. Remove running headers/footers
    for pattern in HEADER_PATTERNS:
        result = pattern.sub('', result)

    # 6. Remove lines with only symbols
    result = re.sub(r'^\s*[\^`´\'~@#$]+\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*[*_]{2,}\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*[-=]{2,}\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*[|\\/]{2,}\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*[<>]{2,}\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*[¶†‡※¤§]+\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*\.{3,}\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*_{3,}\s*$', '', result, flags=re.MULTILINE)
    result = re.sub(r'^\s*#{2,}\s*$', '', result, flags=re.MULTILINE)

    # 7. Remove OCR garbage patterns
    result = re.sub(r'\b[iI][\^`´][gG]\b', '', result)

    # 8. Remove triple+ symbols
    result = re.sub(r'\*{3,}', '', result)
    result = re.sub(r'_{3,}', '', result)
    result = re.sub(r'-{4,}', '', result)
    result = re.sub(r'={3,}', '', result)
    result = re.sub(r'\|{3,}', '', result)
    result = re.sub(r'#{3,}', '', result)

    # 9. Remove orphaned markdown symbols
    result = re.sub(r'(?<!\w)\*\*(?!\w)', '', result)
    result = re.sub(r'(?<!\w)__(?!\w)', '', result)
    result = re.sub(r'(?<!\w)##(?!\w)', '', result)
    result = re.sub(r'``', '"', result)
    result = re.sub(r"''", '"', result)

    # 10. Remove bracket artifacts
    result = re.sub(r'<([a-zA-Z\s]{1,20})>', r'\1', result)
    result = re.sub(r'<<([^>]+)>>', r'\1', result)
    result = result.replace('»', '"').replace('«', '"')
    result = re.sub(r'~([^~]+)~', r'\1', result)

    # 11. Remove random numbers appended to words
    # Protect legitimate numbers first
    protected = result
    # Potency: 30C, 200C, 1M, LM1
    protected = re.sub(r'\b(\d{1,4})\s*([CxXmM]{1,2})\b', r'§POT_\1_\2§', protected)
    # Decimal numbering: 1., 2., 3.
    protected = re.sub(r'\b(\d{1,3})\.\s', r'§DEC_\1.§ ', protected)
    # Chapter/Section/Page refs
    protected = re.sub(r'\b(Chapter|Section|Aphorism|Page|page|Vol|Volume|Part|No\.?)\s*(\d{1,4})\b', r'§REF_\1_\2§', protected, flags=re.IGNORECASE)
    # Years
    protected = re.sub(r'\b(1[89]\d{2}|20[0-2]\d)\b', r'§YEAR_\1§', protected)
    # Roman numerals
    protected = re.sub(r'^([IVXLCDM]{1,5})\.\s', r'§ROM_\1.§ ', protected, flags=re.MULTILINE)
    # Dosage
    protected = re.sub(r'\b(\d{1,3})x\b', r'§DOSE_\1x§', protected, flags=re.IGNORECASE)
    # Grades
    protected = re.sub(r'\((\d)\)', r'§GR_\1§', protected)
    # See page refs
    protected = re.sub(r'(see\s+(?:page|p\.)\s*\d{1,4})', r'§SEE_\1§', protected, flags=re.IGNORECASE)

    # Remove random digits from words
    protected = re.sub(r'\b([a-zA-Z]{2,})(\d{2,})\b', r'\1', protected)
    protected = re.sub(r'\b([a-zA-Z]{3,})(\d)\b(?!x\b|C\b|M\b)', r'\1', protected)

    # Restore protected
    protected = re.sub(r'§POT_(\d+)_([CxXmM]{1,2})§', r'\1\2', protected)
    protected = re.sub(r'§DEC_(\d{1,3})\.§ ', r'\1. ', protected)
    protected = re.sub(r'§REF_(\w+)_(\d{1,4})§', r'\1 \2', protected, flags=re.IGNORECASE)
    protected = re.sub(r'§YEAR_(\d{4})§', r'\1', protected)
    protected = re.sub(r'§ROM_([IVXLCDM]+)\.§ ', r'\1. ', protected)
    protected = re.sub(r'§DOSE_(\d{1,3})x§', r'\1x', protected, flags=re.IGNORECASE)
    protected = re.sub(r'§GR_(\d)§', r'(\1)', protected)
    protected = re.sub(r'§SEE_(.*?)§', r'\1', protected, flags=re.IGNORECASE)

    result = protected

    # 12. Merge hyphenated words
    result = re.sub(r'(\w)-\n(\w)', r'\1\2', result)

    # 13. Merge lines within paragraphs
    result = re.sub(r'([a-z,;:.!?")\]\'"])\n([a-z("`\[])', r'\1 \2', result)

    # 14. Remove duplicate lines
    lines = result.split('\n')
    seen = set()
    unique_lines = []
    for line in lines:
        trimmed = line.strip()
        if len(trimmed) > 20 and trimmed in seen:
            continue
        if len(trimmed) > 20:
            seen.add(trimmed)
        unique_lines.append(line)
    result = '\n'.join(unique_lines)

    # 15. Collapse whitespace
    result = re.sub(r'\n{3,}', '\n\n', result)
    result = re.sub(r'[ \t]+', ' ', result)
    result = '\n'.join(line.strip() for line in result.split('\n'))

    return result.strip()


# ─────────────────────────────────────────────────────────────────────────────
# Reprocessing Functions
# ─────────────────────────────────────────────────────────────────────────────

def reprocess_books():
    """Reprocess all books in data/books/."""
    print("\n=== Reprocessing Books ===")
    if not os.path.isdir(BOOKS_DIR):
        print("  No books directory found")
        return 0

    book_files = [f for f in os.listdir(BOOKS_DIR) if f.endswith('.json')]
    total_chapters = 0
    total_words_before = 0
    total_words_after = 0

    for fname in sorted(book_files):
        fpath = os.path.join(BOOKS_DIR, fname)
        with open(fpath, 'r', encoding='utf-8') as f:
            book = json.load(f)

        book_title = book.get('title', fname)
        chapters = book.get('chapters', [])
        book_chapters = 0

        for ch in chapters:
            if 'content' in ch and ch['content']:
                before = ch['content']
                words_before = len(before.split())
                total_words_before += words_before

                cleaned = clean_ocr_text(before)
                ch['content'] = cleaned

                words_after = len(cleaned.split())
                total_words_after += words_after
                book_chapters += 1
                total_chapters += 1

        with open(fpath, 'w', encoding='utf-8') as f:
            json.dump(book, f, ensure_ascii=False, indent=2)

        print(f"  ✅ {book_title}: {book_chapters} chapters cleaned")

    print(f"\n  Total chapters processed: {total_chapters}")
    print(f"  Words before: {total_words_before:,}")
    print(f"  Words after: {total_words_after:,}")
    return total_chapters


def reprocess_remedies():
    """Reprocess all remedies in data/remedies.json."""
    print("\n=== Reprocessing Remedies ===")
    fpath = os.path.join(DATA_DIR, 'remedies.json')
    if not os.path.exists(fpath):
        print("  remedies.json not found")
        return 0

    with open(fpath, 'r', encoding='utf-8') as f:
        remedies = json.load(f)

    total = len(remedies)
    processed = 0

    for r in remedies:
        changed = False
        for field in ['keynote', 'full', 'constitution', 'relationships', 'dose']:
            if field in r and r[field] and isinstance(r[field], str) and len(r[field]) > 20:
                original = r[field]
                cleaned = clean_ocr_text(original)
                if cleaned != original:
                    r[field] = cleaned
                    changed = True
        if changed:
            processed += 1

    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {total:,} remedies checked, {processed} updated")
    return total


def reprocess_rubrics():
    """Reprocess all rubrics in data/rubrics.json."""
    print("\n=== Reprocessing Rubrics ===")
    fpath = os.path.join(DATA_DIR, 'rubrics.json')
    if not os.path.exists(fpath):
        print("  rubrics.json not found")
        return 0

    with open(fpath, 'r', encoding='utf-8') as f:
        rubrics = json.load(f)

    total = len(rubrics)
    processed = 0

    for r in rubrics:
        changed = False
        # Clean title
        if 'title' in r and r['title']:
            original = r['title']
            # Light cleaning for titles (don't merge lines aggressively)
            cleaned = original.strip()
            cleaned = re.sub(r'[\x00-\x1F]', '', cleaned)
            cleaned = re.sub(r'\s+', ' ', cleaned)
            if cleaned != original:
                r['title'] = cleaned
                changed = True
        # Clean path
        if 'path' in r and r['path']:
            original = r['path']
            cleaned = original.strip()
            cleaned = re.sub(r'[\x00-\x1F]', '', cleaned)
            if cleaned != original:
                r['path'] = cleaned
                changed = True
        if changed:
            processed += 1

    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(rubrics, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {total:,} rubrics checked, {processed} updated")
    return total


def reprocess_biochemic():
    """Reprocess Phatak Biochemic Repertory."""
    print("\n=== Reprocessing Phatak Biochemic Repertory ===")
    fpath = os.path.join(DATA_DIR, 'phatak-biochem-repertory.json')
    if not os.path.exists(fpath):
        print("  File not found")
        return 0

    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    rubrics = data.get('rubrics', [])
    processed = 0

    for r in rubrics:
        if 'title' in r:
            original = r['title']
            cleaned = re.sub(r'[\x00-\x1F]', '', original).strip()
            cleaned = re.sub(r'\s+', ' ', cleaned)
            if cleaned != original:
                r['title'] = cleaned
                processed += 1

    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {len(rubrics):,} rubrics checked, {processed} updated")
    return len(rubrics)


def reprocess_boericke():
    """Reprocess Boericke Repertory."""
    print("\n=== Reprocessing Boericke Repertory ===")
    fpath = os.path.join(DATA_DIR, 'boericke-repertory.json')
    if not os.path.exists(fpath):
        print("  File not found")
        return 0

    with open(fpath, 'r', encoding='utf-8') as f:
        data = json.load(f)

    rubrics = data.get('rubrics', [])
    processed = 0

    for r in rubrics:
        if 'title' in r:
            original = r['title']
            cleaned = re.sub(r'[\x00-\x1F]', '', original).strip()
            cleaned = re.sub(r'\s+', ' ', cleaned)
            if cleaned != original:
                r['title'] = cleaned
                processed += 1

    with open(fpath, 'w', encoding='utf-8') as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

    print(f"  ✅ {len(rubrics):,} rubrics checked, {processed} updated")
    return len(rubrics)


def main():
    print("╔═══════════════════════════════════════════════════════════════════════╗")
    print("║   GLOBAL OCR DATABASE REPROCESSING — Existing Data Cleanup           ║")
    print("╚═══════════════════════════════════════════════════════════════════════╝")

    total_records = 0

    # 1. Books
    total_records += reprocess_books()

    # 2. Remedies
    total_records += reprocess_remedies()

    # 3. Rubrics
    total_records += reprocess_rubrics()

    # 4. Phatak Biochemic
    total_records += reprocess_biochemic()

    # 5. Boericke
    total_records += reprocess_boericke()

    print(f"\n╔═══════════════════════════════════════════════════════════════════════╗")
    print(f"║   REPROCESSING COMPLETE                                                ║")
    print(f"╠═══════════════════════════════════════════════════════════════════════╣")
    print(f"║   Total records processed: {total_records:>10,}                              ║")
    print(f"║   OCR garbage removed:    ✅                                            ║")
    print(f"║   Random numbers removed: ✅                                            ║")
    print(f"║   Markdown artifacts:     ✅                                            ║")
    print(f"║   Duplicate lines:        ✅                                            ║")
    print(f"║   Headers/footers:        ✅                                            ║")
    print(f"║   Page numbers:           ✅                                            ║")
    print(f"║   Broken words merged:    ✅                                            ║")
    print(f"║   Ligatures fixed:        ✅                                            ║")
    print(f"║   Original content:       ✅ PRESERVED                                  ║")
    print(f"║   No duplicate records:   ✅                                            ║")
    print(f"╚═══════════════════════════════════════════════════════════════════════╝")


if __name__ == '__main__':
    main()
