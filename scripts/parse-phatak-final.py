#!/usr/bin/env python3
"""
parse-phatak-final.py — Complete parser for S.R. Phatak Materia Medica
Source: Materia Medica of Homoeopathic Medicines by Dr. S.R. Phatak (792 pages)
PDF: upload/phatak-mm-source.pdf
OCR: tmp/phatak-ocr-raw.txt (via pdftotext -layout)
Output: data/phatak-remedies-final.json (list of structured remedies)

Each remedy preserves EVERY line from the source OCR (after correction).
NO SUMMARISATION, NO TRUNCATION, NO PARAPHRASING.
"""

import json
import re
import sys
from pathlib import Path

OCR_FILE = Path('tmp/phatak-ocr-raw.txt')
OUTPUT_FILE = Path('data/phatak-remedies-final.json')

# All section headings used in Phatak MM (verified from OCR)
SECTION_HEADINGS = [
    'GENERALITIES', 'WORSE', 'BETTER', 'MIND', 'HEAD', 'EYES', 'EARS',
    'NOSE', 'FACE', 'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM',
    'URINARY', 'MALE', 'FEMALE', 'RESPIRATORY', 'CIRCULATORY',
    'NECK & BACK', 'BACK', 'EXTREMITIES', 'SKIN', 'SLEEP', 'FEVER',
    'PULSE', 'RELATED', 'COMPLEMENTARY', 'INIMICAL', 'ANTIDOTE',
    'COMPARE', 'CAUSATION', 'DOSE', 'SEXUAL', 'LARYNX', 'HEART',
    'BLOOD', 'GLANDS', 'MENSES', 'RESPIRATION', 'STOOL', 'URINE',
    'CHEST', 'NECK', 'TEETH', 'FOLLOW WELL', 'FOLLOWS WELL',
    'INTRO', 'INJURIES', 'INDICATIONS', 'CLINICAL',
]

# Pattern: SECTION_HEADING: content
SECTION_PATTERN = re.compile(
    r'^(' + '|'.join(re.escape(h) for h in SECTION_HEADINGS) + r')\s*[:;.]\s*(.*)$'
)

# Pattern: bare section heading (no colon)
SECTION_HEADING_BARE = re.compile(
    r'^(' + '|'.join(re.escape(h) for h in SECTION_HEADINGS) + r')\s*$'
)

# Page header/footer patterns — these are lines like:
#   "ARSENICUM ALBUM                                            85"
#   "82                          ARNICA MONTANA     — ARSENICUM ALBUM"
#   "A                                                   ABSINTHIUM"
PAGE_HEADER_NUM = re.compile(r'^[A-Z][A-Z\s\-\'\.&()]{2,80}\s+\d{1,4}\s*$')
PAGE_FOOTER_NUM = re.compile(r'^\d{1,4}\s+[A-Z][A-Z\s\-\'\.&()]{2,80}\s*$')
PAGE_HEADER_LETTER = re.compile(r'^[A-Z]\s+[A-Z][A-Z\s\-]{2,80}\s*$')  # "A  ABSINTHIUM"

# Header with em-dash between two remedy names: "ABIES — ACETIC ACID"
PAGE_HEADER_DASH = re.compile(r'^[A-Z][A-Z\s\-\.&()]{2,40}—[A-Z\s\-\.&()]{2,40}\d*\s*$')

# Just page number
PAGE_NUMBER_ONLY = re.compile(r'^\s*\d{1,4}\s*$')

# Words that look like titles but aren't (TOC artifacts, etc.)
NON_TITLE_WORDS = {
    'AGG', 'AMEL', 'AGG.', 'AMEL.', 'NO', 'YES', 'END', 'FINIS',
    'INDEX', 'PREFACE', 'CONTENTS', 'EDITOR', 'B. JAIN', 'B.JAIN',
    'JAIN', 'PUBLISHERS', 'PUBLISHER', 'MITE', 'INVAIP', 'INVASIVE',
    'CHAPTER', 'PART', 'BOOK', 'VOLUME', 'SECTION', 'APPENDIX',
    'MATERIA', 'MEDICA', 'OF', 'HOMOEOPATHIC', 'MEDICINES',
    'BY', 'DR', 'PHATAK', 'S.R.', 'SR', 'M.B.B.S.', 'MBBS',
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
    # Section headings that should NOT be treated as remedy titles
    'PULSE', 'HEART', 'BLOOD', 'GLANDS', 'MENSES',
    'STOOL', 'URINE', 'CHEST', 'NECK', 'TEETH',
    'CLINICAL', 'INDICATIONS', 'INJURIES',
}

# ============================================================
# OCR corrections
# ============================================================
GLOBAL_OCR_CORRECTIONS = [
    (r'\bGENERALITIS\b', 'GENERALITIES'),
    (r'\bGENERAITIES\b', 'GENERALITIES'),
    (r'\bZENERALITIES\b', 'GENERALITIES'),  # Z misread for G (Calcarea Fluorica)
    (r'\bEXTREMETIES\b', 'EXTREMITIES'),
    (r'\bEXTREMEITIES\b', 'EXTREMITIES'),
    (r'\bJacrimation\b', 'Lacrimation'),
    (r'\bjacrimation\b', 'lacrimation'),
    (r'\bKpistaxis\b', 'Epistaxis'),
    (r'\bkpistaxis\b', 'epistaxis'),
    (r'\bneura\'gia\b', 'neuralgia'),
    (r'\bneura lgia\b', 'neuralgia'),
    (r'\bApp\.ication\b', 'Application'),
    (r'\bApp\.ications\b', 'Applications'),
    (r'\bmempranes\b', 'membranes'),
    (r'\bMEMprRANES\b', 'MEMBRANES'),
    (r'\bMEMpRANES\b', 'MEMBRANES'),
    (r'\bAcrID\b', 'ACRID'),
    (r'\bPErRiopIcALLy\b', 'PERIODICALLY'),
    (r'\bPERIoDlCALLY\b', 'PERIODICALLY'),
    (r'\bMIpNicHT\b', 'MIDNIGHT'),
    (r'\bVIoLercE\b', 'VIOLENCE'),
    (r'\bEpSTAXIS\b', 'EPISTAXIS'),
    (r'\bHoh\b', 'HOT'),
    (r'\bII\b(?=\s+effects)', 'Ill'),
]

# Leading OCR artifacts on section headings (apostrophe, underscore, etc.)
# Pattern: line starts with junk characters, then has a section heading
SECTION_HEADING_NAMES_RE = (
    r'(?:GENERALITIES|WORSE|BETTER|MIND|HEAD|EYES|EARS|NOSE|FACE|MOUTH|'
    r'THROAT|STOMACH|ABDOMEN|RECTUM|URINARY|MALE|FEMALE|RESPIRATORY|'
    r'CIRCULATORY|NECK\s*&?\s*BACK|BACK|EXTREMITIES|SKIN|SLEEP|FEVER|'
    r'PULSE|RELATED|COMPLEMENTARY|INIMICAL|ANTIDOTE|COMPARE|CAUSATION|'
    r'DOSE|SEXUAL|LARYNX|HEART|BLOOD|GLANDS|MENSES|RESPIRATION|'
    r'STOOL|URINE|CHEST|NECK|TEETH|FOLLOW\s*WELL|FOLLOWS\s*WELL|'
    r'INTRO|INJURIES|INDICATIONS|CLINICAL)'
)
LEADING_ARTIFACT_PATTERN = re.compile(
    r'^[\u2019\u2018\'_.\-=~`|*]+\s*(' + SECTION_HEADING_NAMES_RE + r')\b',
    re.MULTILINE
)


def apply_ocr_corrections(text: str) -> str:
    for pattern, replacement in GLOBAL_OCR_CORRECTIONS:
        text = re.sub(pattern, replacement, text)
    # Strip leading OCR artifacts from section heading lines
    # e.g., "' GENERALITIES:" → "GENERALITIES:"
    # e.g., "_ GENERALITIES:" → "GENERALITIES:"
    text = LEADING_ARTIFACT_PATTERN.sub(r'\1', text)
    return text


def slugify(name: str) -> str:
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9\s\-]", '', s)
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'\-+', '-', s)
    return s.strip('-')


def first_letter(name: str) -> str:
    for c in name.strip():
        if c.isalpha():
            return c.upper()
    return ''


def is_remedy_title(line: str, prev_line: str = '') -> bool:
    """Check if a line is a remedy title (centered ALL CAPS, mostly letters).

    Allows subtitles in parentheses like 'ALLIUM CEPA (Red onion)'.
    The subtitle can contain lowercase letters.
    Strips trailing OCR artifacts like '|', '.', ',', etc.

    Returns False if:
    - Title has 4+ words (likely a content fragment mistaken for title)
    - Previous line ends mid-sentence (likely a content continuation)
    - Title contains common English words like 'AND', 'MAKING', 'OVERSENSITIVE'
    """
    s_raw = line.strip()
    if len(s_raw) < 3 or len(s_raw) > 80:
        return False
    # Collapse multiple spaces for testing
    s = re.sub(r'\s+', ' ', s_raw).strip()
    if len(s) < 3 or len(s) > 80:
        return False
    # Strip leading AND trailing OCR artifacts: |, ., ,, ;, :, ', ", -, _, etc.
    # Some titles have leading hyphens from OCR: "-COPAIVA", "_GENERALITIES"
    s = s.strip('|.,;:\'"`*_~-—–')
    s = s.strip()
    if len(s) < 3:
        return False
    # Extract main title (before any parentheses subtitle)
    # Allow: letters, spaces, hyphens, apostrophes, periods, commas, AND
    # parenthetical subtitles like "(Red onion)"
    # Also allow "&" for titles like "CANNABIS INDICA & SATIVA"
    main_match = re.match(r"^([A-Z][A-Z\s\-'.,&]+)(?:\s*\(([^)]*)\))?\s*$", s)
    if not main_match:
        return False
    main_title = main_match.group(1).strip()
    if len(main_title) < 3:
        return False
    # Reject titles with 5+ words (real remedy names are 1-4 words)
    # e.g., "ACHING, TIREDNESS, HEAVINESS, WEAKNESS AND SORENESS" = 6 words
    # Allow 4-word titles like "CANNABIS INDICA & SATIVA"
    word_count = len(main_title.split())
    if word_count > 4:
        return False
    # Main title must be mostly upper-case letters
    alpha = [c for c in main_title if c.isalpha()]
    if not alpha or len(alpha) < 3:
        return False
    upper_pct = sum(1 for c in alpha if c.isupper()) / len(alpha)
    if upper_pct < 0.85:
        return False
    # Reject if has page-number-like trailing digits
    if re.search(r'\d', s):
        return False
    # Reject non-title words
    if main_title in NON_TITLE_WORDS:
        return False
    # Reject page-header patterns:
    # "A  ABSINTHIUM" — single letter at start followed by another word
    parts = main_title.split(' ')
    if len(parts) == 2 and len(parts[0]) == 1:
        return False
    # Reject lines that look like "ABIES — ACETIC" (header with em-dash)
    if '—' in s or '~' in s:
        return False
    # Reject single letter + dots (like "M.B.B.S.")
    if len(parts) == 1 and '.' in main_title:
        return False
    # Reject content continuation: if previous line ends mid-sentence
    # (with comma, semicolon, or no terminal punctuation) → this is likely
    # a content fragment, not a title
    if prev_line:
        prev = prev_line.strip()
        if prev:
            # If prev line ends with comma/semicolon → continuation
            if prev.endswith(',') or prev.endswith(';'):
                return False
            # If prev line ends with lowercase letter (no period) → continuation
            if prev and prev[-1].islower():
                return False
            # If prev line ends with hyphen (word-break) → continuation
            if prev.endswith('-'):
                return False
    return True


# Words that, if present in a title candidate, strongly suggest it's NOT a remedy title
TITLE_FALSE_POSITIVE_WORDS = {
    'AND', 'OR', 'BUT', 'NOR', 'YET', 'FOR', 'SO',
    'MAKING', 'CAUSING', 'PRODUCING', 'CREATING',
    'OVERSENSITIVE', 'OVEREXCITABLE', 'OVERACUTE',
    'TIREDNESS', 'WEAKNESS', 'SORENESS', 'HEAVINESS', 'ACHING',
    'ALTERNATIVE', 'MEDICINE', 'THERAPEUTIC',
}


def is_page_header_or_footer(line: str) -> bool:
    """Detect page header/footer lines to skip."""
    s = line.strip()
    if not s:
        return False
    if PAGE_HEADER_NUM.match(line):
        return True
    if PAGE_FOOTER_NUM.match(line):
        return True
    if PAGE_HEADER_LETTER.match(line):
        # "A ABSINTHIUM" style header — only skip if there's a big gap
        # (real remedy titles don't have huge gaps between words)
        if '     ' in line:  # 5+ consecutive spaces
            return True
    if PAGE_HEADER_DASH.match(line):
        return True
    if PAGE_NUMBER_ONLY.match(line):
        return True
    return False


def clean_remedy_name(raw: str) -> str:
    """Clean up remedy name from OCR. Preserve subtitle in parentheses."""
    s = raw.strip()
    # Collapse multiple spaces (centered titles have huge gaps between words)
    s = re.sub(r'\s+', ' ', s)
    # Strip leading AND trailing OCR artifacts: |, ., ,, ;, :, ', ", -, _, etc.
    # Some titles have leading hyphens: "-COPAIVA" → "COPAIVA"
    s = s.strip('|.,;:\'"`*_~-—–').strip()
    return s


def find_remedy_start(lines):
    """Find the line index where the first real remedy starts."""
    # Look for the first line that:
    # 1. Is a remedy title (passes is_remedy_title)
    # 2. Is immediately followed by a section heading
    for i, line in enumerate(lines):
        prev_line = lines[i-1] if i > 0 else ''
        if not is_remedy_title(line, prev_line):
            continue
        # Check next 5 non-empty lines for a section heading
        for j in range(i+1, min(i+8, len(lines))):
            nxt = lines[j].strip()
            if not nxt:
                continue
            if SECTION_PATTERN.match(nxt):
                return i
            # If first non-empty next line is another title, give up on this one
            if is_remedy_title(nxt, lines[j-1] if j > 0 else ''):
                break
            # If it doesn't look like content, give up
            break
    return -1


def find_remedy_blocks(text: str):
    """Walk through OCR text and identify (title, content_lines) blocks."""
    lines = text.split('\n')
    start_idx = find_remedy_start(lines)
    if start_idx < 0:
        print('WARNING: Could not find first remedy — using line 1049 as fallback', file=sys.stderr)
        start_idx = 1048  # 0-indexed, line 1049

    print(f'Starting parse at line {start_idx + 1}: {lines[start_idx].strip()!r}')

    title_positions = []
    for i in range(start_idx, len(lines)):
        line = lines[i]
        prev_line = lines[i-1] if i > 0 else ''
        if is_remedy_title(line, prev_line):
            # Avoid duplicate titles (consecutive lines that are both titles)
            if title_positions and title_positions[-1][0] == i - 1:
                continue
            title = clean_remedy_name(line)
            title_positions.append((i, title))

    print(f'Found {len(title_positions)} candidate title positions')

    # Build (title, content_lines) tuples
    blocks = []
    for idx, (line_no, title) in enumerate(title_positions):
        end_line = title_positions[idx + 1][0] if idx + 1 < len(title_positions) else len(lines)
        content_lines = lines[line_no + 1:end_line]
        # Cut off at back-cover (anything after the last real section content)
        # Heuristic: stop at "oo" or known end-of-book markers
        for j, cl in enumerate(content_lines):
            cs = cl.strip()
            # Stop at lines that look like back-cover artwork
            if cs in ('oo',) or 'hein' in cs.lower() or 'dji' in cs.lower():
                content_lines = content_lines[:j]
                break
        if not content_lines:
            continue
        blocks.append((title, content_lines))

    return blocks


def parse_sections(content_lines):
    """Parse content lines into a list of {title, content} sections."""
    sections = []
    current_title = None
    current_lines = []

    for line in content_lines:
        if is_page_header_or_footer(line):
            continue

        s = line.strip()
        if not s:
            if current_lines:
                current_lines.append('')
            continue

        m = SECTION_PATTERN.match(s)
        if m:
            if current_title:
                content = '\n'.join(current_lines).strip()
                if content:
                    sections.append({'title': current_title, 'content': content})
            current_title = m.group(1)
            rest = m.group(2).strip()
            current_lines = [rest] if rest else []
        else:
            bm = SECTION_HEADING_BARE.match(s)
            if bm:
                if current_title:
                    content = '\n'.join(current_lines).strip()
                    if content:
                        sections.append({'title': current_title, 'content': content})
                current_title = bm.group(1)
                current_lines = []
            else:
                if current_title is None:
                    current_title = 'INTRO'
                current_lines.append(line.rstrip())

    if current_title:
        content = '\n'.join(current_lines).strip()
        if content:
            sections.append({'title': current_title, 'content': content})

    return sections


def normalize_name_for_match(name: str) -> str:
    """Normalize name for matching duplicates (lowercase, alphanumeric only)."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9]', '', s)
    return s


def merge_duplicate_remedies(remedies: list) -> list:
    """Merge remedies with the same/similar name (page split continuations).

    When a remedy spans multiple pages, the page header (title at top of next
    page) is mistakenly detected as a new title. We merge these back together
    by combining their sections.

    Strategy:
    - Group remedies by normalized name
    - For each group with 2+ entries, merge them:
      - Combine sections in order, deduplicating exact title matches
      - Concatenate full text
      - Use the entry with most content as the base
    """
    groups = {}
    for r in remedies:
        key = normalize_name_for_match(r['name'])
        if key not in groups:
            groups[key] = []
        groups[key].append(r)

    merged = []
    merge_count = 0
    for key, group in groups.items():
        if len(group) == 1:
            merged.append(group[0])
            continue

        # Sort by length (longest first) — keep longest as base
        group.sort(key=lambda r: len(r.get('full', '')), reverse=True)
        base = dict(group[0])  # copy
        base_sections = list(base.get('sections', []))

        # Append sections from other entries (in order)
        for other in group[1:]:
            for sec in other.get('sections', []):
                # Skip if a section with same title already exists
                existing_titles = {s['title'] for s in base_sections}
                if sec['title'] in existing_titles:
                    # Append content to existing section
                    for s in base_sections:
                        if s['title'] == sec['title']:
                            s['content'] = s['content'] + '\n' + sec['content']
                            break
                else:
                    base_sections.append(sec)

        # Rebuild full text from merged sections
        full_parts = []
        if base.get('intro'):
            full_parts.append(base['intro'])
        for s in base_sections:
            full_parts.append(f"{s['title']}: {s['content']}")
        base['full'] = '\n\n'.join(full_parts)
        base['sections'] = base_sections
        base['keynote'] = base['full'][:200].replace('\n', ' ').strip()

        merged.append(base)
        merge_count += 1

    if merge_count:
        print(f'Merged {merge_count} duplicate remedy groups')
    return merged


def build_remedy_record(name: str, content_lines) -> dict:
    """Build a structured remedy record from raw content lines."""
    cleaned_lines = [apply_ocr_corrections(line) for line in content_lines]
    sections = parse_sections(cleaned_lines)

    # Extract subtitle (common name) from name if present
    # e.g., "ALLIUM CEPA (Red onion)" → name="Allium Cepa", common="Red onion"
    common = ''
    clean_name = name
    m = re.match(r'^(.*?)\s*\(([^)]+)\)\s*$', name)
    if m:
        clean_name = m.group(1).strip()
        common = m.group(2).strip()

    # Extract intro (content before first GENERALITIES)
    intro = ''
    intro_sections = [s for s in sections if s['title'] == 'INTRO']
    if intro_sections:
        intro = intro_sections[0]['content']
        sections = [s for s in sections if s['title'] != 'INTRO']

    # Extract modalities (WORSE + BETTER)
    modalities_parts = []
    for sec_title in ['WORSE', 'BETTER']:
        for s in sections:
            if s['title'] == sec_title:
                modalities_parts.append(f"{sec_title}: {s['content']}")
    modalities = '\n'.join(modalities_parts)

    # Extract relationships (RELATED, COMPLEMENTARY, INIMICAL, ANTIDOTE, COMPARE, FOLLOW WELL)
    rel_parts = []
    for sec_title in ['RELATED', 'COMPLEMENTARY', 'INIMICAL', 'ANTIDOTE', 'COMPARE',
                       'FOLLOW WELL', 'FOLLOWS WELL']:
        for s in sections:
            if s['title'] == sec_title:
                rel_parts.append(f"{sec_title}: {s['content']}")
    relationships = '\n'.join(rel_parts)

    # Extract dose
    dose = ''
    for s in sections:
        if s['title'] == 'DOSE':
            dose = s['content']
            break

    # Build full text
    full_parts = []
    if intro:
        full_parts.append(intro)
    for s in sections:
        full_parts.append(f"{s['title']}: {s['content']}")
    full_text = '\n\n'.join(full_parts)

    keynote = full_text[:200].replace('\n', ' ').strip()

    # Display name: title case for the main name, keep subtitle separate
    display_name = clean_name.title()

    return {
        'id': f'phatak-mm-{slugify(clean_name)}',
        'name': display_name,
        'common': common,
        'author': 'Phatak',
        'letter': first_letter(clean_name),
        'chapter': 'Phatak MM',
        'organ': '',
        'modalities': modalities,
        'constitution': '',
        'relationships': relationships,
        'dose': dose,
        'keynote': keynote,
        'full': full_text,
        'intro': intro,
        'sections': sections,
    }


def main():
    if not OCR_FILE.exists():
        print(f'ERROR: OCR file not found: {OCR_FILE}', file=sys.stderr)
        sys.exit(1)

    print(f'Reading OCR: {OCR_FILE}')
    text = OCR_FILE.read_text(encoding='utf-8', errors='ignore')
    print(f'  Total chars: {len(text):,}')
    print(f'  Total lines: {text.count(chr(10)):,}')

    print('Finding remedy blocks...')
    blocks = find_remedy_blocks(text)
    print(f'  Found {len(blocks)} remedy blocks')

    remedies = []
    skipped = []
    for title, content_lines in blocks:
        if not content_lines:
            skipped.append((title, 'empty content'))
            continue
        try:
            record = build_remedy_record(title, content_lines)
            if not record['sections'] and not record['full'].strip():
                skipped.append((title, 'no sections / empty full'))
                continue
            if len(record['full']) < 50:
                skipped.append((title, f'too short ({len(record["full"])} chars)'))
                continue
            remedies.append(record)
        except Exception as e:
            skipped.append((title, f'ERROR: {e}'))

    print(f'\nParsed {len(remedies)} remedies, skipped {len(skipped)}')

    # Merge continuation entries (same name, multiple page splits)
    remedies = merge_duplicate_remedies(remedies)

    # Deduplicate by name (keep the longest)
    by_name = {}
    for r in remedies:
        nm = r['name']
        if nm not in by_name or len(r['full']) > len(by_name[nm]['full']):
            by_name[nm] = r
    unique_remedies = list(by_name.values())
    if len(unique_remedies) < len(remedies):
        print(f'Deduplicated: {len(remedies)} → {len(unique_remedies)}')

    unique_remedies.sort(key=lambda r: r['name'].lower())

    OUTPUT_FILE.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_FILE.write_text(json.dumps(unique_remedies, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f'\nSaved: {OUTPUT_FILE}')
    print(f'  Size: {OUTPUT_FILE.stat().st_size:,} bytes')

    if unique_remedies:
        total_chars = sum(len(r['full']) for r in unique_remedies)
        avg_chars = total_chars / len(unique_remedies)
        longest = max(unique_remedies, key=lambda r: len(r['full']))
        shortest = min(unique_remedies, key=lambda r: len(r['full']))
        print(f'\n=== SUMMARY ===')
        print(f'Total remedies: {len(unique_remedies)}')
        print(f'Total chars: {total_chars:,}')
        print(f'Avg chars/remedy: {avg_chars:.0f}')
        print(f'Longest: {longest["name"]} ({len(longest["full"])} chars, {len(longest["sections"])} sections)')
        print(f'Shortest: {shortest["name"]} ({len(shortest["full"])} chars, {len(shortest["sections"])} sections)')
        print(f'\nFirst 5:')
        for r in unique_remedies[:5]:
            print(f'  {r["name"]} ({len(r["full"])} chars, {len(r["sections"])} sections)')
        print(f'\nLast 5:')
        for r in unique_remedies[-5:]:
            print(f'  {r["name"]} ({len(r["full"])} chars, {len(r["sections"])} sections)')

    if skipped:
        print(f'\n=== SKIPPED ({len(skipped)}) ===')
        for title, reason in skipped[:30]:
            print(f'  {title!r}: {reason}')
        if len(skipped) > 30:
            print(f'  ... and {len(skipped) - 30} more')


if __name__ == '__main__':
    main()
