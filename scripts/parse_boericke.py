"""
Parse Boericke's Pocket Manual of Homoeopathic Materia Medica PDF.
- Extract ALL remedies with 100% content preservation
- Fix OCR errors only (broken words, page breaks, control chars)
- Merge with existing data (preserve existing, add missing info)
- No summarization, no paraphrasing, no deletion
"""
import subprocess, json, re, os

PDF_PATH = '/home/z/my-project/upload/Pocket Manual of Homoeopathic Materia Medica.pdf'
DATA_FILE = '/home/z/my-project/data/remedies.json'

def get_pages(pdf):
    r = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True)
    m = re.search(r'Pages:\s+(\d+)', r.stdout)
    return int(m.group(1)) if m else 0

def extract_all_text(pdf):
    """Extract all text from PDF, preserving structure"""
    r = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True)
    return r.stdout

def fix_ocr(text):
    """Fix OCR errors without changing meaning"""
    # Remove page footers
    text = text.replace('Similibis India', '')
    # Remove standalone page numbers
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
    # Fix ligatures
    text = text.replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff').replace('ﬃ', 'ffi')
    # Fix common OCR errors in homoeopathic texts
    text = text.replace('œ', 'oe').replace('æ', 'ae')
    # Merge broken words across lines: "word-\nword" → "word-word"  
    text = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1-\2', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    # Remove duplicate spaces
    text = re.sub(r' {2,}', ' ', text)
    # Normalize multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

def parse_remedies(text):
    """Parse remedy entries from Boericke's text.
    Remedy names are in UPPERCASE. Each remedy starts with its name."""
    
    lines = text.split('\n')
    remedies = []
    current_name = None
    current_common = None
    current_content = []
    
    # Pattern for remedy name: ALL CAPS, possibly multi-word, no digits
    # e.g., "ACETANILIDUM", "ACONITUM NAPELLUS", "ABIES CANADENSIS"
    remedy_pattern = re.compile(r'^([A-Z][A-Z]{2,}(?:\s+[A-Z][A-Z]+)?)\s*$')
    
    # Pattern for common name (line after remedy name, usually title/mixed case)
    common_pattern = re.compile(r'^([A-Z][a-z]+(?:\s+[A-Za-z]+)*)\s*$')
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        
        if not stripped:
            if current_content:
                current_content.append('')
            continue
        
        # Check if this is a remedy name (ALL CAPS)
        m = remedy_pattern.match(stripped)
        if m and len(stripped) > 3 and not stripped.startswith('PREFACE') and \
           not stripped.startswith('CONTENTS') and not stripped.startswith('INDEX') and \
           not stripped.startswith('MATERIA') and not stripped.startswith('HOMOEOPATHIC'):
            
            # Save previous remedy
            if current_name and current_content:
                content = '\n'.join(current_content).strip()
                content = fix_ocr(content)
                if len(content) > 20:
                    remedies.append({
                        'name': current_name.title(),  # Title case for consistency
                        'common': current_common or '',
                        'content': content,
                    })
            
            current_name = m.group(1)
            current_common = None
            current_content = []
            
            # Check if next line is common name
            if i + 1 < len(lines):
                next_line = lines[i + 1].strip()
                if next_line and common_pattern.match(next_line) and \
                   not remedy_pattern.match(next_line) and \
                   len(next_line) < 50 and not next_line.endswith('.'):
                    current_common = next_line
                    # Skip this line in content
                    continue
        else:
            if current_name:
                current_content.append(stripped)
    
    # Save last remedy
    if current_name and current_content:
        content = '\n'.join(current_content).strip()
        content = fix_ocr(content)
        if len(content) > 20:
            remedies.append({
                'name': current_name.title(),
                'common': current_common or '',
                'content': content,
            })
    
    return remedies

def extract_sections(content):
    """Extract structured sections from remedy content.
    Boericke uses patterns like 'Mind.', 'Head.', 'Eyes.', 'Relationship.', 'Dose.'"""
    
    sections = {
        'keynote': '',
        'modalities': '',
        'relationships': '',
        'dose': '',
        'full': content,  # Full content always preserved
    }
    
    # The first paragraph (before any section heading) is the keynote/overview
    # Section headings in Boericke: "Mind.", "Head.", "Eyes.", etc. followed by "––"
    section_starts = []
    for m in re.finditer(r'\n([A-Z][a-z]+)\.\s*[–—-]', content):
        section_starts.append(m.start())
    
    if section_starts:
        # Keynote is everything before the first section
        sections['keynote'] = content[:section_starts[0]].strip()
    else:
        # No sections found — entire content is keynote
        sections['keynote'] = content[:500].strip()
    
    # Extract Modalities (look for "Modalities" or "Worse"/"Better" patterns)
    mod_match = re.search(r'(?:Modalities|Modalities\.|Worse|Better)[.\s–—-]*(.*?)(?=\n[A-Z][a-z]+\.\s*[–—-]|\nRelationship|\nDose|$)', content, re.DOTALL)
    if mod_match:
        sections['modalities'] = mod_match.group(0).strip()
    
    # Extract Relationships
    rel_match = re.search(r'(Relationship\..*?)(?=\nDose\.|$)', content, re.DOTALL)
    if rel_match:
        sections['relationships'] = rel_match.group(1).strip()
    
    # Extract Dose
    dose_match = re.search(r'(Dose\..*?)$', content, re.DOTALL)
    if dose_match:
        sections['dose'] = dose_match.group(1).strip()
    
    return sections

# === MAIN ===
print("=== Parsing Boericke's Pocket Manual ===")
pages = get_pages(PDF_PATH)
print(f"PDF pages: {pages}")

raw_text = extract_all_text(PDF_PATH)
print(f"Raw text: {len(raw_text):,} chars")

# Parse remedies
remedies_pdf = parse_remedies(raw_text)
print(f"Remedies found in PDF: {len(remedies_pdf)}")

# Load existing data
with open(DATA_FILE) as f:
    existing = json.load(f)
print(f"Existing remedies: {len(existing)}")

# Create lookup
existing_boericke = {}
for r in existing:
    if r.get('author') == 'Boericke':
        existing_boericke[r['name'].lower()] = r

print(f"Existing Boericke remedies: {len(existing_boericke)}")

# Merge: for each PDF remedy, compare with existing
updated = 0
added = 0
unchanged = 0

for pdf_rem in remedies_pdf:
    name_lower = pdf_rem['name'].lower()
    sections = extract_sections(pdf_rem['content'])
    
    existing_rem = existing_boericke.get(name_lower)
    
    if existing_rem:
        # Compare and merge — only update if PDF has richer content
        old_full_len = len(existing_rem.get('full', ''))
        new_full_len = len(pdf_rem['content'])
        
        changed = False
        
        # Update full if PDF content is richer
        if new_full_len > old_full_len:
            existing_rem['full'] = pdf_rem['content']
            changed = True
        
        # Update keynote if existing is short and PDF has better
        old_kn_len = len(existing_rem.get('keynote', ''))
        new_kn_len = len(sections['keynote'])
        if new_kn_len > old_kn_len and new_kn_len > 50:
            existing_rem['keynote'] = sections['keynote']
            changed = True
        
        # Update modalities if existing is empty/short
        old_mod_len = len(existing_rem.get('modalities', ''))
        new_mod_len = len(sections['modalities'])
        if new_mod_len > old_mod_len and new_mod_len > 5:
            existing_rem['modalities'] = sections['modalities']
            changed = True
        
        # Update relationships if existing is empty/short
        old_rel_len = len(existing_rem.get('relationships', ''))
        new_rel_len = len(sections['relationships'])
        if new_rel_len > old_rel_len and new_rel_len > 5:
            existing_rem['relationships'] = sections['relationships']
            changed = True
        
        # Update dose if existing is empty/short
        old_dose_len = len(existing_rem.get('dose', ''))
        new_dose_len = len(sections['dose'])
        if new_dose_len > old_dose_len and new_dose_len > 5:
            existing_rem['dose'] = sections['dose']
            changed = True
        
        # Update common name if missing
        if not existing_rem.get('common') and pdf_rem['common']:
            existing_rem['common'] = pdf_rem['common']
            changed = True
        
        if changed:
            updated += 1
            if updated <= 5:
                print(f"  Updated: {existing_rem['name']} — full: {old_full_len}→{new_full_len} chars")
        else:
            unchanged += 1
    else:
        # Add new remedy
        new_rem = {
            'id': name_lower.replace(' ', '-').replace('.', '')[:60],
            'name': pdf_rem['name'],
            'common': pdf_rem['common'],
            'author': 'Boericke',
            'letter': pdf_rem['name'][0].upper(),
            'chapter': 'Various',
            'organ': '',
            'modalities': sections['modalities'],
            'constitution': '',
            'relationships': sections['relationships'],
            'dose': sections['dose'],
            'keynote': sections['keynote'],
            'full': pdf_rem['content'],
        }
        existing.append(new_rem)
        existing_boericke[name_lower] = new_rem
        added += 1
        if added <= 5:
            print(f"  Added: {pdf_rem['name']} — {len(pdf_rem['content'])} chars")

print(f"\n=== MERGE SUMMARY ===")
print(f"  Updated: {updated}")
print(f"  Added: {added}")
print(f"  Unchanged: {unchanged}")
print(f"  Total: {len(existing)} (was {len(existing) - added})")

# Save
with open(DATA_FILE, 'w') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)
print(f"  File size: {os.path.getsize(DATA_FILE):,} bytes")

# Verify
from collections import Counter
authors = Counter([r.get('author', '?') for r in existing])
print(f"\n  Boericke: {authors['Boericke']}")
print(f"  Total remedies: {len(existing)}")

# Verify no duplicates
boericke_names = [r['name'].lower() for r in existing if r.get('author') == 'Boericke']
dups = {n: c for n, c in Counter(boericke_names).items() if c > 1}
if dups:
    print(f"  ⚠️ {len(dups)} duplicates!")
else:
    print(f"  ✅ No duplicates")

# Verify data quality
boericke = [r for r in existing if r.get('author') == 'Boericke']
avg_full = sum(len(r.get('full', '')) for r in boericke) / len(boericke)
avg_kn = sum(len(r.get('keynote', '')) for r in boericke) / len(boericke)
print(f"  Avg full: {avg_full:.0f} chars")
print(f"  Avg keynote: {avg_kn:.0f} chars")
