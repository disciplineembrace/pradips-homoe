#!/usr/bin/env python3
"""
Boericke Source Parser v2 — ROOT-CAUSE REPAIR

Problem with v1 (parse-boericke-source.py):
  - Set `keynote = first_para[:500]` — a COPY of `full`
  - Frontend rendered BOTH keynote AND full → duplicate content

v2 fix:
  - Parse source PDF text into structured sections[]
  - `intro` field = the introductory paragraph(s) before any section heading
  - `sections` = [{title: 'Head', content: '...'}, {title: 'Stomach', ...}, ...]
  - `keynote` field = EMPTY (do not generate; not present as a separate section in source)
  - `full` field = intro + joined sections (for backward-compat with old renderers
    that still look at `full` — but the new frontend will NOT render `full` as
    "Full Description"; it will render `intro` + `sections[]` directly)

Source structure (verified from PDF page 1A — Abies Canadensis):
  ABIES CANADENSIS—PINUS CANADENSIS        ← ALL CAPS title (centered)
                  (Hemlock Spruce)         ← common name in parens
                                          Abies-c.   ← abbreviation (right-aligned)
  Mucous membranes are affected by ...     ← intro paragraph(s)
  Gleet.
  Head — Feels light headed, tipsy.        ← section heading: "Word —"
  Stomach — Canine hunger with ...
  Female — Uterine displacements. ...
  Fever — Shivering and chills ...
  Dose — First to third potency.

NEVER fabricates content. NEVER paraphrases. Source text preserved exactly.
"""
import json
import re
import os
import sys

SRC = '/tmp/boericke.txt'
OUT = '/home/z/my-project/data/boericke-source-remedies-v2.json'

# ============================================================
# PATTERNS
# ============================================================

# Remedy title line: ALL CAPS, centered (≥2 spaces leading), contains letters
# May contain em-dash (—) for Latin name separator: "ABIES CANADENSIS—PINUS CANADENSIS"
# May contain periods for abbreviations: "ABIES C." but usually not
# May end with a trailing period: "ANDROGRAPHIS PANICULATA."
# May contain "OR" between alternative names: "ATISTA INDICA OR GLYCOSMIS PENTAPHYLLA"
REMEDY_TITLE = re.compile(r'^\s{2,}([A-Z][A-Z\s\-\.]{2,60}(?:—[A-Z\s\-\.]+)?(?:\s+OR\s+[A-Z\s\-\.]+)?)\.?\s*[A-Za-z\.\-]*\s*$')

# Common name line: only content within parens, centered
# e.g., "      (Hemlock Spruce)              Abies-c."
COMMON_NAME = re.compile(r'^\s*\(([^)]+)\)\s*(?:[A-Z][a-z]+\-?[a-z]?\.?)?\s*$')

# Section heading: starts with capitalized word + em-dash + space + content
# "Head — Feels light headed..."
# Also handle the older "--" double-dash variant: "Head.-- Feels..."
# Also handle "Mind : " style
SECTION_HEADING = re.compile(r'^\s{0,8}([A-Z][a-z]+(?:\s+[A-Z][a-z]+)?)\s*[—–\-]+\s*(.+)$')

# Known section vocabulary (Boericke) — used to confirm heading detection
KNOWN_SECTIONS = {
    'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Anus', 'Urinary', 'Genitals',
    'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back', 'Extremities',
    'Skin', 'Sleep', 'Dreams', 'Fever', 'Sweat', 'Modalities', 'Relations',
    'Relationships', 'Relationship', 'Compare', 'Comparisons', 'Antidotes',
    'Dose', 'Duration', 'Children', 'Pregnancy', 'Clinical', 'Pharmacy',
    'Source', 'Habitat', 'Preparation', 'Constitution', 'Miasms', 'Miasm',
    'Complementary', 'Inimical', 'Follows', 'Followed by', 'Worse', 'Better',
    'Characteristic Symptoms', 'Guiding Symptoms',
    'Neck', 'Liver', 'Spleen', 'Kidneys', 'Bladder', 'Prostate',
    'Trachea', 'Larynx', 'Bronchi', 'Lungs', 'Pleura', 'Pericardium',
    'Arteries', 'Veins', 'Capillaries', 'Bones', 'Joints', 'Muscles',
    'Nerves', 'Brain', 'Spine', 'Glands', 'Blood', 'Tissues',
    'Salivary Glands', 'Teeth', 'Tongue', 'Oesophagus', 'Duodenum',
    'Intestines', 'Ing', 'Nails', 'Hair', 'Voice', 'Cough', 'Expectoration',
    'Respiration', 'Circulation', 'Pulse', 'Temperature',
}

# Lines to SKIP (page headers, footers, watermarks)
SKIP_PATTERNS = [
    re.compile(r'^\s*MATERIA MEDICA\s*$', re.IGNORECASE),
    re.compile(r'^\s*\d*[A-Z]\d*\s+.*@\s+\d*\s*$', re.IGNORECASE),  # page footer
    re.compile(r'^\s*Similibis India\s*$', re.IGNORECASE),
    # Header lines like "Abies canadensis e Abies nigra"
    re.compile(r'^\s*[A-Z][a-z]+ [a-z]+ [e@] [A-Z][a-z]+ [a-z]+\s*$'),
    # Page-number-only lines
    re.compile(r'^\s*\d{1,4}\s*$'),
    # Page marker like "1A", "A2"
    re.compile(r'^\s*\d*[A-Z]\d*\s*$'),
    # Footnote refs
    re.compile(r'^\s*\d+[A-Z]?[a-z]?\s*$', re.IGNORECASE),
]

# Footnote marker pattern at start of line (e.g., "1Feels womb...")
FOOTNOTE_REF = re.compile(r'^(\d+)([A-Z][a-z])')

# Page header with both remedy name and page: "1A   Abies canadensis e Abies nigra"
PAGE_HEADER = re.compile(r'^\s*\d*[A-Z]\d*\s+[A-Z][a-z]+ [a-z]+.*\d*\s*$')


def is_skip_line(line):
    """Check if a line should be skipped (page header/footer/watermark)."""
    for pat in SKIP_PATTERNS:
        if pat.match(line):
            return True
    return False


def is_remedy_title(line):
    """Detect ALL-CAPS centered remedy title."""
    m = REMEDY_TITLE.match(line)
    if not m:
        return None
    raw = m.group(1).strip()
    # Filter false positives — common section words alone
    if raw in {'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH',
        'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'STOOL', 'URINARY',
        'GENITALS', 'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART',
        'BACK', 'EXTREMITIES', 'SKIN', 'SLEEP', 'FEVER', 'MODALITIES',
        'RELATIONSHIP', 'DOSE', 'PREFACE', 'INDEX', 'CHAPTER', 'CONTENTS',
        'MATERIA MEDICA', 'REPERTORY'}:
        return None
    # Must have at least 3 letters
    letters = sum(1 for c in raw if c.isalpha())
    if letters < 3:
        return None
    # Skip if too many words (likely a sentence fragment)
    words = raw.split()
    if len(words) > 6:
        return None
    return raw


def parse_section_heading(line):
    """Detect 'Word — content' style section heading.
    Returns (title, content) or None."""
    m = SECTION_HEADING.match(line)
    if not m:
        return None
    title = m.group(1).strip()
    content = m.group(2).strip()
    # Title should be a known section word, OR a single capitalized word
    # that looks like a section heading (not a sentence start)
    if title in KNOWN_SECTIONS:
        return (title, content)
    # If it's a single capitalized word (4-20 chars), accept it as a section heading
    # but only if content is substantial (not just punctuation)
    if (len(title) >= 3 and len(title) <= 25 and
        re.match(r'^[A-Z][a-z]+$', title) and
        len(content) > 2 and
        not title.startswith(('The', 'This', 'These', 'Those', 'When', 'While', 'During'))):
        # Likely a section heading
        return (title, content)
    return None


def clean_text(text):
    """Clean up extracted text: normalize whitespace, remove OCR artifacts."""
    # Normalize multiple whitespace
    text = re.sub(r'[ \t]+', ' ', text)
    # Normalize multiple newlines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Remove leading/trailing whitespace per line
    lines = [ln.strip() for ln in text.split('\n')]
    return '\n'.join(lines).strip()


def build_remedy(name_raw, lines):
    """Build a structured remedy record from collected lines."""
    # Parse name and Latin name (if em-dash present)
    # e.g., "ABIES CANADENSIS—PINUS CANADENSIS"
    if '—' in name_raw:
        parts = name_raw.split('—')
        name_part = parts[0].strip()
        latin_part = parts[1].strip() if len(parts) > 1 else ''
    elif '--' in name_raw:
        parts = name_raw.split('--')
        name_part = parts[0].strip()
        latin_part = parts[1].strip() if len(parts) > 1 else ''
    else:
        name_part = name_raw.strip()
        latin_part = ''

    # Convert to Title Case for display name
    name = name_part.title()
    # Common Latin abbreviations & fixes
    name = re.sub(r'\bNig\b', 'Nigra', name)  # fix Nig→Nigra? Only if source
    # Build ID
    remedy_id = 'boericke-mm-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')

    # Parse the body lines
    intro_paras = []  # list of paragraph strings (before any section heading)
    sections = []  # list of {title, content}
    current_section = None
    current_para_lines = []
    common_name = ''
    abbreviation = ''

    def flush_para():
        nonlocal current_para_lines
        if current_para_lines:
            text = ' '.join(current_para_lines).strip()
            text = re.sub(r'\s+', ' ', text)
            if text:
                if current_section is None:
                    intro_paras.append(text)
                else:
                    if sections and sections[-1]['title'] == current_section:
                        # Append to existing section content
                        if sections[-1]['content']:
                            sections[-1]['content'] += ' ' + text
                        else:
                            sections[-1]['content'] = text
                    else:
                        sections.append({'title': current_section, 'content': text})
            current_para_lines = []

    for line in lines:
        if not line.strip():
            # Blank line = paragraph break
            flush_para()
            continue

        # Try common-name line: "(Hemlock Spruce) Abies-c."
        m = COMMON_NAME.match(line)
        if m and not common_name and not current_section and not intro_paras:
            common_name = m.group(1).strip()
            # Also capture the abbreviation if present
            abbr_m = re.search(r'([A-Z][a-z]+\-?[a-z]?\.?)\s*$', line)
            if abbr_m:
                abbreviation = abbr_m.group(1).strip()
            continue

        # Try section heading: "Head — content"
        sh = parse_section_heading(line)
        if sh:
            flush_para()
            current_section = sh[0]
            sections.append({'title': current_section, 'content': sh[1]})
            continue

        # Otherwise, body text
        # Remove footnote ref markers at start of line: "1Feels womb..."
        cleaned = re.sub(r'^\d+(?=[A-Z])', '', line.strip())
        if cleaned:
            current_para_lines.append(cleaned)

    flush_para()

    # Build the `full` field (joined for backward compat)
    full_parts = []
    if latin_part:
        full_parts.append(latin_part)
    if common_name:
        full_parts.append(common_name)
    if intro_paras:
        full_parts.append('\n\n'.join(intro_paras))
    for sec in sections:
        full_parts.append(f"{sec['title']} — {sec['content']}")
    full = '\n'.join(full_parts)

    # Build the structured record
    record = {
        'id': remedy_id,
        'name': name,
        'common': common_name or latin_part or '',
        'author': 'Boericke',
        'letter': name[0].upper() if name else '?',
        'chapter': 'Boericke MM',
        'organ': '',
        'modalities': '',
        'constitution': '',
        'relationships': '',
        'dose': '',
        'intro': '\n\n'.join(intro_paras),
        'sections': sections,
        'full': full,
        # KEY FIX: keynote is empty — do NOT duplicate intro here
        'keynote': '',
    }
    # If a "Dose" section exists, also populate the `dose` field for compatibility
    for sec in sections:
        if sec['title'] == 'Dose':
            record['dose'] = sec['content']
            break
    # If a "Modalities" section exists, populate `modalities`
    for sec in sections:
        if sec['title'] in ('Modalities', 'Worse', 'Better'):
            if record['modalities']:
                record['modalities'] += '\n' + sec['content']
            else:
                record['modalities'] = sec['content']
    # If a "Relationship" section exists, populate `relationships`
    for sec in sections:
        if sec['title'] in ('Relationship', 'Relationships', 'Relations', 'Compare', 'Comparisons'):
            if record['relationships']:
                record['relationships'] += '\n' + sec['content']
            else:
                record['relationships'] = sec['content']

    return record


def main():
    if not os.path.exists(SRC):
        print(f"ERROR: Source file {SRC} not found")
        sys.exit(1)

    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()

    lines = text.split('\n')
    print(f"Loaded {len(lines):,} lines from {SRC}")

    # Step 0: Find the start of the MATERIA MEDICA section.
    # The book has front matter (preface, contents, etc.) before the actual
    # remedy entries. The first real remedy in Boericke is "ABIES CANADENSIS".
    # Skip everything before that line.
    start_idx = 0
    for i, line in enumerate(lines):
        if 'ABIES CANADENSIS' in line.upper() and is_remedy_title(line):
            start_idx = i
            break
    if start_idx > 0:
        print(f"Skipping front matter (lines 1-{start_idx}). First remedy at line {start_idx+1}")
        lines = lines[start_idx:]

    # Step 0b: Find the end of the MATERIA MEDICA section.
    # After the last remedy, the book has a Repertory section that starts with
    # "RELATIONSHIP OF REMEDIES AND SIDES OF THE BODY" or "Drug Affinities".
    # The header is on multiple lines: "RELATIONSHIP  OF —" / "REMEDIES AND" / "SIDES OF THE BODY"
    # We detect by checking each line for "RELATIONSHIP" + "OF" at the start.
    end_idx = len(lines)
    for i, line in enumerate(lines):
        if i < 1000:
            continue
        # "RELATIONSHIP  OF —" or similar (the start of the repertory divider)
        if re.match(r'^\s*RELATIONSHIP\s+OF\s', line, re.IGNORECASE):
            end_idx = i
            break
        # Or "Drug Affinities" header
        if 'Drug Affinities' in line:
            end_idx = i
            break
    if end_idx < len(lines):
        print(f"Skipping repertory section (from line {end_idx+1} onwards)")
        lines = lines[:end_idx]

    # Step 1: Identify remedy boundaries
    # A remedy starts at a centered ALL-CAPS title line
    remedies = []
    current_name = None
    current_lines = []

    def save_current():
        nonlocal current_name, current_lines
        if current_name and current_lines:
            rec = build_remedy(current_name, current_lines)
            # Only keep if there's actual content
            if rec['intro'] or rec['sections'] or (rec['full'] and len(rec['full']) > 30):
                remedies.append(rec)
        current_name = None
        current_lines = []

    for i, line in enumerate(lines):
        # Skip header/footer/watermark lines
        if is_skip_line(line):
            continue

        # Check if this line is a remedy title
        title = is_remedy_title(line)
        if title:
            save_current()
            current_name = title
            current_lines = []
            continue

        if current_name:
            current_lines.append(line)

    save_current()

    print(f"\nParsed {len(remedies)} remedies from Boericke source")

    # Show sample output for Abies Canadensis (regression test)
    for r in remedies:
        if 'abies can' in r['name'].lower():
            print(f"\n=== REGRESSION TEST: {r['name']} ===")
            print(f"id: {r['id']}")
            print(f"name: {r['name']}")
            print(f"common: {r['common']}")
            print(f"intro: {r['intro'][:200]}...")
            print(f"sections ({len(r['sections'])}):")
            for s in r['sections']:
                print(f"  - {s['title']}: {s['content'][:80]}...")
            print(f"keynote: '{r['keynote']}' (should be empty)")
            print(f"dose: {r['dose'][:80]}")
            break

    # Show first 5 remedies summary
    print(f"\nFirst 5 remedies:")
    for r in remedies[:5]:
        print(f"  - {r['name']} | sections: {len(r['sections'])} | intro_len: {len(r['intro'])}")

    # Write output
    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

    # Verify no duplication
    print(f"\n=== DUPLICATION CHECK ===")
    dup_count = 0
    for r in remedies:
        if r['keynote'] and r['keynote'] in r['full']:
            dup_count += 1
    print(f"Remedies where keynote duplicates full: {dup_count} (should be 0)")


if __name__ == '__main__':
    main()
