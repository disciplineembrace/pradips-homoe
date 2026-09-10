#!/usr/bin/env python3
"""
Import William Boericke's Pocket Manual of Homoeopathic Materia Medica.
Source: 'Pocket Manual of Homoeopathic Materia Medica.pdf' (9th Edition)

ACCURACY FIRST: Every remedy is parsed from the original text with minimal
modification. Only genuine OCR errors are corrected. No paraphrasing.

Structure per remedy (as in the printed book):
  REMEDY NAME (ALL CAPS)
  Common Name
  [Description paragraph]
  Head.–– ...
  Stomach.–– ...
  ...
  Dose.–– ...

Headings are preserved exactly as printed. Only headings that exist in the
book are included — no extra headings created.
"""
import json
import re
import os
from collections import Counter

INPUT = '/tmp/boericke-pocket-raw.txt'
OUTPUT = '/home/z/my-project/data/remedies.json'

# Known section headings in Boericke's book (as printed)
KNOWN_HEADINGS = [
    'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Urinary', 'Male', 'Female',
    'Respiratory', 'Heart', 'Neck and Back', 'Back', 'Extremities',
    'Sleep', 'Fever', 'Skin', 'Modalities', 'Relationship', 'Dose',
    'Chest', 'Larynx', 'Teeth', 'Tongue', 'Female Sexual System',
    'Male Sexual System', 'Urinary Organs', 'Nervous System',
    'Blood', 'Blood Vessels', 'Glands', 'Throat', 'Nose',
    'Sensorium', 'Voice', 'Expectoration', 'Cough', 'Respiration',
]

def clean_text(text):
    """Minimal OCR cleanup — only genuine errors corrected."""
    # Remove form feeds
    text = text.replace('\x0c', '\n')
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0B\x0E-\x1F]', '', text)
    # Fix smart quote artifacts
    text = text.replace('â€œ', '"').replace('â€\x9d', '"')
    text = text.replace('â€™', "'").replace('â€"', '—').replace('â€"', '–')
    # Fix ligatures
    text = text.replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff')
    # Remove "Similibis India" watermark
    text = re.sub(r'^\s*Similibis India\s*$', '', text, flags=re.MULTILINE)
    # Remove standalone page numbers
    text = re.sub(r'^\s*\d{1,3}\s*$', '', text, flags=re.MULTILINE)
    # Merge hyphenated words split across lines
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    # Merge single newlines within paragraphs (preserve paragraph breaks)
    text = re.sub(r'([a-z,;:.!?")\]\'"])\n([a-z("`\[])', r'\1 \2', text)
    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Strip each line
    text = '\n'.join(line.strip() for line in text.split('\n'))
    # Remove random numbers appended to words (protect legitimate)
    text = re.sub(r'\b(\d{1,4})\s*([CxXmM]{1,2})\b', r'§P\1\2§', text)
    text = re.sub(r'\b(\d{1,3})\.\s', r'§D\1.§ ', text)
    text = re.sub(r'\b([a-zA-Z]+)(\d{2,})\b', r'\1', text)
    text = re.sub(r'§P(\d+)([CxXmM]{1,2})§', r'\1\2', text)
    text = re.sub(r'§D(\d{1,3})\.§ ', r'\1. ', text)
    # Remove any remaining OCR garbage patterns
    text = re.sub(r'\b[iI][\^`´][gG]\b', '', text)
    text = re.sub(r'\*{3,}', '', text)
    text = re.sub(r'_{3,}', '', text)
    text = re.sub(r'-{4,}', '', text)
    return text.strip()


def parse_remedies(text):
    """Parse all remedies from the Boericke text.
    
    Each remedy starts with an ALL CAPS name line.
    The text between two ALL CAPS headers is one remedy.
    """
    # Find the start of remedies (first remedy: ABIES CANADENSIS)
    mm_start = text.find('ABIES CANADENSI')
    if mm_start == -1:
        mm_start = text.find('ABIES CANADENSIS')
    if mm_start == -1:
        print("ERROR: Could not find start of remedies")
        return []
    
    # Find the end (Alphabetical Index)
    mm_end = text.find('Alphabetical Index', mm_start)
    if mm_end == -1:
        mm_end = len(text)
    
    mm_text = text[mm_start:mm_end]
    print(f"Materia Medica section: {len(mm_text):,} chars")
    
    lines = mm_text.split('\n')
    
    # Find all remedy headers (ALL CAPS lines that are remedy names)
    # Pattern: line that is mostly uppercase, 4+ chars, no lowercase
    remedy_headers = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped or len(stripped) < 4 or len(stripped) > 60:
            continue
        
        # Must be ALL UPPERCASE (remedy names in Boericke are printed in caps)
        # Allow spaces, hyphens
        if not re.match(r'^[A-Z][A-Z\s\-\.]+$', stripped):
            continue
        
        # Skip non-remedy all-caps lines
        skip_words = ['PREFACE', 'MATERIA MEDICA', 'REPERTORY', 'INDEX',
                       'SIMILIBIS INDIA', 'CHAPTER', 'SECTION', 'ALPHABETICAL']
        if any(stripped.startswith(w) for w in skip_words):
            continue
        
        # Check that this is actually a remedy name (not a heading like "HEAD")
        # Remedy names are usually longer or contain specific patterns
        if stripped in ['HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH', 'THROAT',
                        'STOMACH', 'ABDOMEN', 'RECTUM', 'STOOL', 'URINARY', 'MALE',
                        'FEMALE', 'RESPIRATORY', 'HEART', 'BACK', 'EXTREMITIES',
                        'SLEEP', 'FEVER', 'SKIN', 'MODALITIES', 'RELATIONSHIP',
                        'DOSE', 'CHEST', 'LARYNX', 'TEETH', 'TONGUE', 'MIND',
                        'BLOOD', 'GLANDS', 'NECK', 'SENSORIUM', 'VOICE',
                        'EXPECTORATION', 'COUGH']:
            continue
        
        remedy_headers.append((i, stripped))
    
    print(f"Found {len(remedy_headers)} remedy headers")
    
    # Parse each remedy
    remedies = []
    
    for idx, (line_idx, header) in enumerate(remedy_headers):
        # Get content from this header to the next
        if idx + 1 < len(remedy_headers):
            end_idx = remedy_headers[idx + 1][0]
        else:
            end_idx = len(lines)
        
        content_lines = lines[line_idx:end_idx]
        content = '\n'.join(content_lines).strip()
        
        # Parse the header
        name = header.strip()
        # Some headers have trailing letters cut off (e.g., "ABIES CANADENSI" instead of "ABIES CANADENSIS")
        # Try to fix common truncations
        if name.endswith('CANADENSI'):
            name = 'ABIES CANADENSIS'
        elif name.endswith('NAPELLU'):
            name = 'ACONITUM NAPELLUS'
        elif name.endswith('PRECATORIU'):
            name = 'ABRUS PRECATORIUS'
        elif name.endswith('HIPPOCASTANU'):
            name = 'AESCULUS HIPPOCASTANUM'
        elif name.endswith('CYNAPIU'):
            name = 'AETHUSA CYNAPIUM'
        elif name.endswith('SPICAT'):
            name = 'ACTAEA SPICATA'
        
        # Convert to Title Case for display
        display_name = name.title()
        
        # Find common name (usually on the next line, not all caps)
        common = ''
        if len(content_lines) > 1:
            next_line = content_lines[1].strip()
            if next_line and not next_line.isupper() and len(next_line) < 50:
                common = next_line
        
        # Get the body (skip header and common name lines)
        body_start = 2 if common else 1
        body_lines = content_lines[body_start:]
        body = '\n'.join(body_lines).strip()
        
        # Clean the body
        body = clean_text(body)
        
        if not body or len(body) < 20:
            continue
        
        # The full text includes the remedy name as a heading
        full_text = f"{display_name}\n"
        if common:
            full_text += f"{common}\n"
        full_text += f"\n{body}"
        
        # Keynote = first paragraph (before the first heading like "Head.––")
        keynote = body
        # Find first heading
        heading_match = re.search(r'\n(?:' + '|'.join(KNOWN_HEADINGS) + r')\.', body)
        if heading_match:
            keynote = body[:heading_match.start()].strip()
        else:
            # No headings — use first 500 chars
            keynote = body[:500]
        
        # Extract organs/chapters from headings present in the text
        organs = []
        for heading in KNOWN_HEADINGS:
            if re.search(rf'\b{re.escape(heading)}\.', body):
                organs.append(heading)
        chapter = ', '.join(organs[:5]) if organs else 'Various'
        
        # Create remedy ID
        rid = re.sub(r'[^a-z0-9-]', '', display_name.lower().replace(' ', '-'))
        letter = display_name[0].upper() if display_name else '?'
        
        # Extract dose if present
        dose = ''
        dose_match = re.search(r'Dose\.\s*[–—-]+\s*(.+?)(?:\n\n|\Z)', body, re.DOTALL)
        if dose_match:
            dose = dose_match.group(1).strip()[:200]
        
        # Extract modalities if present
        modalities = ''
        mod_match = re.search(r'Modalities\.\s*[–—-]+\s*(.+?)(?:\n\n|\Z)', body, re.DOTALL)
        if mod_match:
            modalities = mod_match.group(1).strip()[:200]
        
        # Extract relationship if present
        relationships = ''
        rel_match = re.search(r'Relationship\.\s*[–—-]+\s*(.+?)(?:\n\n|\Z)', body, re.DOTALL)
        if rel_match:
            relationships = rel_match.group(1).strip()[:300]
        
        remedies.append({
            'id': f'boericke-{rid}',
            'name': display_name,
            'common': common,
            'author': 'Boericke',
            'letter': letter,
            'chapter': chapter,
            'organ': chapter,
            'modalities': modalities or ' ',
            'constitution': keynote[:300] if keynote else '',
            'relationships': relationships,
            'dose': dose,
            'keynote': keynote,
            'full': full_text,
        })
    
    # Deduplicate by name (keep the one with most content)
    by_name = {}
    for r in remedies:
        key = r['name'].lower()
        if key not in by_name or len(r['full']) > len(by_name[key]['full']):
            by_name[key] = r
    
    return list(by_name.values())


def main():
    print("=== Boericke Pocket Manual — Quality Import ===")
    print()
    
    with open(INPUT, 'r', encoding='utf-8', errors='replace') as f:
        raw = f.read()
    print(f"Raw text: {len(raw):,} chars, {len(raw.split()):,} words")
    
    # Parse remedies
    print("\nParsing remedies...")
    boericke_remedies = parse_remedies(raw)
    print(f"\nParsed {len(boericke_remedies)} Boericke remedies")
    
    # Show samples
    print("\nSample remedies (first 5):")
    for r in boericke_remedies[:5]:
        print(f"  {r['name']} ({r.get('common', '')}): {len(r['full']):,} chars, organs: {r['chapter']}")
    
    # Show last 3
    print("\nLast 3 remedies:")
    for r in boericke_remedies[-3:]:
        print(f"  {r['name']} ({r.get('common', '')}): {len(r['full']):,} chars")
    
    # Load existing non-Boericke remedies
    with open(OUTPUT, 'r', encoding='utf-8') as f:
        existing = json.load(f)
    non_boericke = [r for r in existing if r.get('author') != 'Boericke']
    print(f"\nExisting non-Boericke remedies: {len(non_boericke)}")
    
    # Combine
    combined = non_boericke + boericke_remedies
    
    # Verify
    authors = Counter(r.get('author', '?') for r in combined)
    print(f"\nFinal remedy counts:")
    for a, c in authors.most_common():
        print(f"  {a}: {c}")
    print(f"  TOTAL: {len(combined)}")
    
    # Save
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(combined, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Saved remedies.json ({os.path.getsize(OUTPUT):,} bytes)")
    
    # Verify no OCR garbage in sample
    print("\n=== Quality Check (first 10 remedies) ===")
    import re as re2
    issues = 0
    for r in boericke_remedies[:10]:
        full = r.get('full', '')
        problems = []
        if 'â€' in full: problems.append('smart-quote')
        if 'ﬁ' in full or 'ﬂ' in full: problems.append('ligature')
        if re2.search(r'[a-zA-Z]\d{2,}', full):
            matches = re2.findall(r'[a-zA-Z]\d{2,}', full)
            legit = all(m.endswith('C') or m.endswith('M') or m.endswith('x') for m in matches)
            if not legit: problems.append(f'random-nums: {matches[:3]}')
        if '***' in full or '___' in full: problems.append('triple-symbols')
        if problems:
            print(f"  ⚠ {r['name']}: {problems}")
            issues += 1
        else:
            print(f"  ✅ {r['name']}: clean")
    print(f"\nIssues in first 10: {issues}")


if __name__ == '__main__':
    main()
