#!/usr/bin/env python3
"""
Murphy Materia Medica — Complete Extraction
============================================
Source: Lotus Materia Medica (3rd Ed.) by Robin Murphy (1674 pages)

Structure of each remedy:
  ***REMEDY NAME
  (Common Name)           <- optional
  PHARMACY - content
  CLINICAL - content
  HERBAL - content
  HOMEOPATHIC - content
  MIND - content
  Head - content          <- Title Case body parts
  Eyes - content
  ...
  RELATIONS - content
  REFERENCES - content

Section headings:
  UPPERCASE sections: PHARMACY, CLINICAL, HERBAL, HOMEOPATHIC, MIND, RELATIONS, REFERENCES, COMMENTS
  Title Case sections: Head, Eyes, Ears, Nose, Face, Mouth, Stomach, etc.
"""
import json
import re
import os
from pathlib import Path
from collections import OrderedDict, Counter

# Paths
PDF_PATH = "/home/z/my-project/upload/Lotus Materia Medica (3rd Ed.) - Robin Murphy.pdf"
WORK_DIR = Path("/home/z/my-project/work/murphy")
WORK_DIR.mkdir(parents=True, exist_ok=True)
PAGES_TXT = WORK_DIR / "murphy_full.txt"
REMEDIES_JSON = Path("/home/z/my-project/data/remedies.json")

# UPPERCASE section headings (Murphy style)
UPPERCASE_SECTIONS = {
    'PHARMACY', 'CLINICAL', 'HERBAL', 'HOMEOPATHIC', 'MIND', 'RELATIONS',
    'REFERENCES', 'COMMENTS', 'COMMENTARY',
}

# Title Case body part sections
TITLE_CASE_SECTIONS = {
    'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Teeth', 'Tongue',
    'Throat', 'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Stools',
    'Kidneys', 'Bladder', 'Urine', 'Urinary', 'Female', 'Male',
    'Respiration', 'Lungs', 'Chest', 'Heart', 'Back', 'Limbs',
    'Skin', 'Sleep', 'Dreams', 'Modalities', 'Temperature',
    'Vertigo', 'Food', 'Perspiration', 'Constitutions', 'Causations',
    'Sensations', 'Liver', 'Breasts', 'Vision', 'Cough', 'Neck',
    'Blood', 'Generals', 'Pregnancy', 'Expectoration',
    'Extremities', 'Lower Extremities', 'Upper Extremities',
    'Glands', 'Nails', 'Hair', 'Voice', 'Speech', 'Hearing',
    'Appetite', 'Thirst', 'Vomiting', 'Nausea', 'Constipation',
    'Diarrhea', 'Menses', 'Menstruation', 'Leucorrhea',
    'Children', 'Women', 'Men', 'Spine', 'Larynx', 'Trachea',
    'Bronchi', 'Pulse', 'Chill', 'Fever', 'Heat', 'Sweat',
    'Discharges', 'Ulcers', 'Eruptions', 'Warts', 'Tumors',
    'Cancer', 'Tuberculosis', 'Typhoid', 'Malaria',
    'Desires', 'Aversions', 'Cravings',
}

# All known sections combined
ALL_SECTIONS = UPPERCASE_SECTIONS | TITLE_CASE_SECTIONS


def extract_pages():
    """Extract text from PDF with page boundaries."""
    if not PAGES_TXT.exists():
        import subprocess
        subprocess.run([
            "pdftotext", "-layout", PDF_PATH, str(PAGES_TXT)
        ], check=True)
    with open(PAGES_TXT) as f:
        text = f.read()
    return text


def find_remedy_boundaries(text):
    """
    Find all remedy heading positions.
    Remedy headings are lines starting with *** (after optional form feed).
    Returns list of (start_position, remedy_name).
    """
    # Pattern: *** at start of line (after optional \f), followed by the remedy name
    # The name can contain uppercase letters, spaces, hyphens, periods, commas, and special chars
    # We capture everything after *** until end of line
    pattern = re.compile(r'(?:^|\f)\*\*\*(.+?)(?:\n|\r)', re.MULTILINE)
    
    boundaries = []
    for m in pattern.finditer(text):
        raw_name = m.group(1).strip()
        # Filter out empty or body text lines
        if not raw_name:
            continue
        # Filter out lines that are clearly body text (start with lowercase)
        if raw_name[0].islower():
            continue
        # Filter out lines that are too long (likely body text with *** artifact)
        if len(raw_name) > 100:
            continue
        # Clean the name: extract the main remedy name
        # Some entries have "(Common Name)" or "PHARMACY -" on the same line
        name = raw_name
        # If there's a parenthesis, take the part before it
        paren_idx = name.find('(')
        if paren_idx > 0:
            name = name[:paren_idx].strip()
        # If there's "PHARMACY" on the same line, take the part before it
        pharm_idx = name.find('PHARMACY')
        if pharm_idx > 0:
            name = name[:pharm_idx].strip()
        # If there's a quote mark, take the part before it
        quote_idx = name.find("'")
        if quote_idx > 0:
            name = name[:quote_idx].strip()
        # Remove trailing punctuation
        name = name.rstrip('.,;:!? ')
        # Skip if name is too short or clearly not a remedy
        if len(name) < 2:
            continue
        # Skip if name starts with lowercase after cleaning
        if name[0].islower():
            continue
        # Skip common body text patterns that start with ***
        if name.startswith('***'):
            continue
        # Skip lines that are clearly body text (contain lowercase words mixed in)
        # A remedy name should be mostly uppercase or title case
        # Check if the first word is reasonable
        first_word = name.split()[0] if name.split() else ''
        if not first_word:
            continue
        # Skip body text artifacts
        body_text_indicators = ['Hungry', 'umbilical', 'Limbs', 'Abdomen', 'ery', 'nerves', 
                                'Froth', 'resolving']
        if name in body_text_indicators or any(name.startswith(w) for w in body_text_indicators):
            continue
        
        boundaries.append((m.start(), name, m.end()))
    
    return boundaries


def parse_remedy(name, content_text):
    """
    Parse a single remedy's content into structured fields.
    content_text starts AFTER the *** heading line.
    """
    lines = content_text.split('\n')
    sections = OrderedDict()
    current_heading = "PREAMBLE"
    current_text = []
    common_name = None
    
    # Check if first non-empty line is a common name (in parentheses)
    start_idx = 0
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        # Check if this line is a common name (starts with '(' and ends with ')')
        if stripped.startswith('(') and stripped.endswith(')') and len(stripped) < 80:
            common_name = stripped.strip('()')
            start_idx = i + 1
        break  # Only check the first non-empty line
    
    for line in lines[start_idx:]:
        stripped = line.strip()
        if not stripped:
            if current_text:
                current_text.append('')
            continue
        
        # Check if this line starts with a section heading
        # Pattern: "HEADING - content" or "HEADING- content" or "Heading - content"
        # The heading is at the start of the line
        section_match = re.match(r'^([A-Z][A-Za-z\s]+?)\s*-\s+(.*)$', stripped)
        if section_match:
            heading = section_match.group(1).strip()
            rest = section_match.group(2).strip()
            # Check if it's a known section
            if heading.upper() in UPPERCASE_SECTIONS or heading in TITLE_CASE_SECTIONS:
                # Normalize: UPPERCASE sections stay uppercase, Title Case stay as-is
                if heading.upper() in UPPERCASE_SECTIONS:
                    heading = heading.upper()
                # Save previous section
                if current_heading or current_text:
                    sections[current_heading] = '\n'.join(current_text).strip()
                current_heading = heading
                current_text = [rest] if rest else []
                continue
        
        # Regular content line
        current_text.append(stripped)
    
    # Save last section
    if current_heading or current_text:
        sections[current_heading] = '\n'.join(current_text).strip()
    
    # Remove empty PREAMBLE
    if 'PREAMBLE' in sections and not sections['PREAMBLE']:
        del sections['PREAMBLE']
    
    # Build full text
    full_parts = [name]
    if common_name:
        full_parts.append(f'({common_name})')
    full_parts.append('')
    for heading, text in sections.items():
        if heading == 'PREAMBLE':
            full_parts.append(text)
            full_parts.append('')
        else:
            full_parts.append(f'{heading} - {text}')
            full_parts.append('')
    full_text = '\n'.join(full_parts).strip()
    
    # Build fields
    pharmacy = sections.get('PHARMACY', '').strip()
    clinical = sections.get('CLINICAL', '').strip()
    herbal = sections.get('HERBAL', '').strip()
    homeopathic = sections.get('HOMEOPATHIC', '').strip()
    mind = sections.get('MIND', '').strip()
    relations = sections.get('RELATIONS', '').strip()
    references = sections.get('REFERENCES', '').strip()
    comments = sections.get('COMMENTS', '').strip()
    
    # Constitution = HOMEOPATHIC + HERBAL (main description)
    constitution_parts = []
    if homeopathic:
        constitution_parts.append(homeopathic)
    if herbal:
        constitution_parts.append(herbal)
    constitution = '\n\n'.join(constitution_parts)
    
    # Modalities
    modalities = sections.get('Modalities', '').strip()
    
    # Relationships = RELATIONS + REFERENCES
    rel_parts = []
    if relations:
        rel_parts.append(f'Relations: {relations}')
    if references:
        rel_parts.append(f'References: {references}')
    relationships = '\n'.join(rel_parts)
    
    # Clinical
    clinical_text = clinical
    
    # Organ (determine from sections present)
    organ_sections = ["Head", "Eyes", "Ears", "Nose", "Face", "Mouth", "Teeth",
                      "Tongue", "Throat", "Stomach", "Abdomen", "Rectum", "Stool",
                      "Kidneys", "Bladder", "Urine", "Female", "Male",
                      "Respiration", "Lungs", "Chest", "Heart", "Back", "Limbs",
                      "Skin", "Sleep", "Temperature", "Perspiration"]
    organs = [s for s in organ_sections if s in sections]
    organ_str = ", ".join(organs)
    
    # Dose - extract from PHARMACY section
    dose = None
    if pharmacy:
        dose_match = re.search(r'Historical dose:\s*(.+?)(?:\.|$)', pharmacy)
        if dose_match:
            dose = dose_match.group(1).strip()
    
    # Keynote (short excerpt for card display)
    keynote_lines = [name]
    if common_name:
        keynote_lines.append(f'({common_name})')
    keynote_lines.append('')
    if clinical:
        keynote_lines.append(f'Clinical: {clinical[:200]}')
    elif homeopathic:
        keynote_lines.append(f'Homeopathic: {homeopathic[:200]}')
    keynote = '\n'.join(keynote_lines)
    
    # Determine letter
    letter = name[0].upper() if name else '?'
    
    # Chapter
    chapter = "Mind" if "MIND" in sections else "Generalities"
    
    # Build ID
    slug = name.lower().replace(' ', '-').replace('.', '').replace(',', '')
    slug = re.sub(r'[^a-z0-9\-]', '', slug)
    slug = re.sub(r'-+', '-', slug).strip('-')
    remedy_id = f"murphy-mm-{slug}"
    
    return {
        'id': remedy_id,
        'name': name.title() if name.isupper() else name,
        'common': common_name,
        'author': 'Murphy',
        'letter': letter,
        'chapter': chapter,
        'organ': organ_str,
        'modalities': modalities if modalities else '—',
        'constitution': constitution,
        'relationships': relationships if relationships else '—',
        'dose': dose,
        'keynote': keynote,
        'full': full_text,
    }


def main():
    print("=" * 70)
    print("MURPHY MATERIA MEDICA — COMPLETE EXTRACTION")
    print("=" * 70)
    
    text = extract_pages()
    pages = text.split('\f')
    print(f"Total PDF pages: {len(pages)}")
    
    # Find remedy boundaries
    boundaries = find_remedy_boundaries(text)
    print(f"Detected remedy boundaries: {len(boundaries)}")
    
    # Extract each remedy
    remedies = []
    for i, (start_pos, name, heading_end) in enumerate(boundaries):
        # Content is from end of heading to start of next heading
        if i + 1 < len(boundaries):
            end_pos = boundaries[i + 1][0]
        else:
            end_pos = len(text)
        content_text = text[heading_end:end_pos]
        
        remedy = parse_remedy(name, content_text)
        remedies.append(remedy)
    
    print(f"Total remedies extracted: {len(remedies)}")
    
    # Stats
    full_lengths = [len(r['full']) for r in remedies]
    print(f"\nMin full length: {min(full_lengths)}")
    print(f"Max full length: {max(full_lengths)}")
    print(f"Mean full length: {sum(full_lengths)/len(full_lengths):.0f}")
    print(f"Total chars: {sum(full_lengths):,}")
    
    # Check for short entries
    short_entries = [(r['name'], len(r['full'])) for r in remedies if len(r['full']) < 200]
    print(f"\nShort entries (<200 chars): {len(short_entries)}")
    for name, length in short_entries[:10]:
        print(f"  {name}: {length} chars")
    
    # Check for duplicates
    from collections import Counter
    name_counts = Counter(r['name'] for r in remedies)
    dups = {n: c for n, c in name_counts.items() if c > 1}
    print(f"\nDuplicate names: {len(dups)}")
    for n, c in list(dups.items())[:10]:
        print(f"  {n}: {c}")
    
    id_counts = Counter(r['id'] for r in remedies)
    id_dups = {id: c for id, c in id_counts.items() if c > 1}
    print(f"Duplicate IDs: {len(id_dups)}")
    for id, c in list(id_dups.items())[:10]:
        print(f"  {id}: {c}")
    
    # Show first 5 and last 5
    print("\n--- First 5 remedies ---")
    for r in remedies[:5]:
        print(f"  {r['name']:40s} | id: {r['id']:35s} | full: {len(r['full'])} chars")
    print("\n--- Last 5 remedies ---")
    for r in remedies[-5:]:
        print(f"  {r['name']:40s} | id: {r['id']:35s} | full: {len(r['full'])} chars")
    
    # Save
    output_path = WORK_DIR / "murphy_remedies.json"
    with open(output_path, 'w') as f:
        json.dump(remedies, f, indent=2, ensure_ascii=False)
    print(f"\nSaved to: {output_path}")
    print(f"File size: {output_path.stat().st_size:,} bytes")
    
    # Sample
    print("\n=== Sample: ABELMOSCHUS HIBISCUS ===")
    abel = next((r for r in remedies if 'ABELMOSCHUS' in r['name'].upper()), None)
    if abel:
        print(f"Name: {abel['name']}")
        print(f"Common: {abel.get('common')}")
        print(f"Full length: {len(abel['full'])} chars")
        print(f"First 500 chars:")
        print(abel['full'][:500])
    
    return remedies


if __name__ == "__main__":
    main()
