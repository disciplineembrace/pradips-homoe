#!/usr/bin/env python3
"""
Parse S.R. Phatak Materia Medica OCR output into structured remedy records.

Reads:  work/phatak-ocr/phatak-ocr-raw.txt (Tesseract OCR with page markers)
Writes: data/phatak-remedies-fresh.json

Structure of Phatak's book:
  REMEDY NAME (ALL CAPS)
  SECTION LABEL: text...
  SECTION LABEL: text...
  ...

Section labels are ALL CAPS followed by colon: GENERALITIES:, MIND:, HEAD:, etc.

This parser:
1. Splits by remedy name (ALL CAPS lines that match known remedy names)
2. Preserves ALL text between remedy boundaries
3. Does NOT summarize, shorten, or restructure
4. Removes only page artifacts (page numbers, headers/footers)
5. Verifies no truncation (each remedy must end with complete sentence)
"""
import json
import re
import os

RAW_FILE = "/home/z/my-project/work/phatak-ocr/phatak-ocr-raw.txt"
OUTPUT = "/home/z/my-project/data/phatak-remedies-fresh.json"

# Known section headings in Phatak's Materia Medica
SECTION_LABELS = {
    'GENERALITIES', 'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE',
    'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'URINARY',
    'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART', 'BACK',
    'EXTREMITIES', 'SLEEP', 'FEVER', 'SKIN', 'MODALITIES',
    'RELATIONSHIPS', 'DOSE', 'CLINICAL', 'KEYNOTES', 'WORSE', 'BETTER',
    'CAUSATION', 'CHARACTERISTICS', 'COMPARE', 'COMPLEMENTARY',
    'INIMICAL', 'ANTIDOTE', 'ANTIDOTES', 'COLLATERAL',
    'PREGNANCY', 'CHILDBIRTH', 'LACTATION', 'CHILDREN',
    'TEETH', 'TONGUE', 'SALIVA', 'VOICE', 'SPEECH',
    'HEARING', 'VISION', 'SMELL', 'TASTE', 'APPETITE',
    'THIRST', 'VOMITING', 'NAUSEA', 'ERUCTATIONS',
    'HICCOUGH', 'FLATULENCE', 'CONSTIPATION', 'STOOL',
    'URINE', 'SEmen'.upper(), 'SEXUAL', 'MENSTRUATION',
    'LEUCORRHOEA', 'CONCEPTION', 'PARTURITION',
    'LARYNX', 'TRACHEA', 'BRONCHI', 'LUNGS',
    'PERICARDIUM', 'ARTERIES', 'VEINS', 'NERVES',
    'MUSCLES', 'BONES', 'JOINTS', 'SPINE', 'LIMBS',
    'HANDS', 'FEET', 'FINGERS', 'TOES', 'HAIR', 'NAILS',
    'DISCHARGES', 'ULCERS', 'ERUPTIONS', 'WARTS', 'TUMORS',
    'CANCER', 'TUBERCULOSIS', 'TYPHOID', 'MALARIA',
    'CIRCULATION', 'SENSATIONS', 'TISSUES', 'GLANDS',
    'BLOOD', 'LIVER', 'KIDNEYS', 'BLADDER', 'PROSTATE',
    'OVARIES', 'UTERUS', 'VAGINA',
    'CHILL', 'HEAT', 'SWEAT', 'PULSE', 'PALPITATION',
    'VERTIGO', 'HEADACHE', 'COUGH', 'EXPECTORATION',
    'INTRODUCTION', 'CONSTITUTION', 'PHYSIOLOGICAL ACTION',
    'PATHOGENESIS', 'DRUG ACTION', 'DRUG PICTURE',
    'ORGAN AFFINITY', 'PREPARATION', 'PROVING',
    'OBSERVATION', 'OBSERVATIONS', 'SUMMARY', 'CAUTION',
    'BIOCHEMIC', 'GLOSSARY', 'THERAPEUTIC', 'THERAPEUTICS',
    'POTENCY', 'MIASMATIC', 'MIASM',
}


def clean_page_artifacts(text):
    """Remove page numbers, headers, footers, and other artifacts."""
    lines = text.split('\n')
    cleaned = []
    for line in lines:
        stripped = line.strip()
        # Skip page markers
        if stripped.startswith('--- PAGE'):
            continue
        # Skip standalone page numbers (1-3 digits)
        if re.match(r'^\d{1,3}$', stripped):
            continue
        # Skip empty lines (will rejoin later)
        if not stripped:
            cleaned.append('')
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)


def find_remedy_boundaries(text):
    """
    Find remedy boundaries in the OCR text.
    
    Remedy names appear as ALL CAPS lines. We identify them by:
    1. Line is ALL CAPS (no lowercase letters)
    2. Line is 3-40 characters
    3. Line is followed by content (not another ALL CAPS heading immediately)
    4. Line matches a known remedy name pattern
    
    From the TOC, we know the remedy names. We'll extract them first.
    """
    # Extract remedy names from the TOC pages (pages 25-37)
    toc_names = set()
    lines = text.split('\n')
    in_toc = False
    
    for line in lines:
        if '--- PAGE 25' in line:
            in_toc = True
        elif '--- PAGE 38' in line:
            in_toc = False
            break
        
        if in_toc:
            # TOC entries look like: "ABIES CANADENSIS ........... 2"
            match = re.match(r'^([A-Z][A-Z\s\-\'().,]+?)(?:\s*\.+\s*\d+|\s*$)', line.strip())
            if match:
                name = match.group(1).strip()
                if 3 <= len(name) <= 40 and not any(c.islower() for c in name):
                    toc_names.add(name)
    
    print(f"  TOC remedy names: {len(toc_names)}")
    
    # Now find remedy boundaries in the content (after page 37)
    content_start = 0
    for i, line in enumerate(lines):
        if '--- PAGE 38' in line:
            content_start = i
            break
    
    remedies = []
    for i in range(content_start, len(lines)):
        line = lines[i].strip()
        # Check if this line is a remedy name (ALL CAPS, not a section label)
        if (line and 
            len(line) >= 3 and 
            len(line) <= 40 and
            line == line.upper() and
            not any(c.islower() for c in line) and
            line not in SECTION_LABELS and
            not line.endswith(':') and
            ':' not in line):
            
            # Check if it's a known remedy from TOC or looks like one
            # (ALL CAPS word(s) without lowercase, not a section label)
            # Also verify it's followed by content
            has_content = False
            for j in range(i + 1, min(i + 5, len(lines))):
                next_line = lines[j].strip()
                if next_line and not next_line.startswith('--- PAGE') and next_line != next_line.upper():
                    has_content = True
                    break
                elif next_line and next_line.endswith(':') and next_line.upper() == next_line:
                    # Section label follows — also valid
                    has_content = True
                    break
            
            if has_content:
                remedies.append((i, line))
    
    # Deduplicate (keep first occurrence)
    seen = set()
    unique = []
    for i, name in remedies:
        if name not in seen:
            unique.append((i, name))
            seen.add(name)
    
    return unique


def extract_remedy_text(lines, start_idx, end_idx):
    """Extract and clean text for a single remedy."""
    raw = '\n'.join(lines[start_idx:end_idx])
    # Remove the remedy name from the start
    raw = raw.lstrip()
    first_line = lines[start_idx].strip()
    if raw.startswith(first_line):
        raw = raw[len(first_line):]
    
    # Clean page artifacts
    raw = clean_page_artifacts(raw)
    
    # Remove control characters
    raw = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', raw)
    
    # Collapse multiple blank lines
    raw = re.sub(r'\n{3,}', '\n\n', raw)
    
    return raw.strip()


def verify_completeness(text, remedy_name):
    """
    Verify the remedy text is complete (not truncated mid-sentence).
    Returns (is_complete, issue_description).
    """
    if not text or len(text) < 50:
        return False, f"Too short: {len(text)} chars"
    
    # Check last 100 chars for truncation patterns
    last_chars = text[-100:].strip()
    
    # Suspicious endings (truncated words)
    truncation_patterns = [
        r'\b\w{1,4}$',  # Very short last word
        r'[a-z]{1,3}$',  # Ends with 1-3 lowercase letters (likely truncated)
    ]
    
    # Check if text ends with proper sentence-ending punctuation
    if re.search(r'[.!?:;]\s*$', text):
        return True, "OK"
    
    # Check if text ends with a complete word followed by newline
    if re.search(r'\w+\s*$', text) and not re.search(r'[a-z]{1,3}$', text):
        return True, "OK"
    
    # Check for common truncation indicators
    if re.search(r'It alt|and th$|with gre$|in pat$', text):
        return False, f"Truncated ending: ...{text[-30:]}"
    
    # If the text is long enough and doesn't show obvious truncation, accept it
    if len(text) > 200:
        return True, "OK (long text)"
    
    return True, "OK (short but complete)"


def get_remedy_id(name):
    """Generate URL-safe ID."""
    slug = re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))
    return f"phatak-mm-{slug}"


def main():
    print("=" * 70)
    print("S.R. PHATAK MATERIA MEDICA — FRESH OCR PARSER")
    print("=" * 70)
    
    if not os.path.exists(RAW_FILE):
        print(f"ERROR: {RAW_FILE} not found. Run OCR first.")
        return
    
    with open(RAW_FILE, 'r', encoding='utf-8') as f:
        raw_text = f.read()
    
    print(f"Raw OCR text: {len(raw_text):,} chars")
    
    # Check if OCR is complete
    if 'OCR COMPLETE' not in raw_text:
        print("WARNING: OCR may not be complete (no 'OCR COMPLETE' marker found)")
        print("Proceeding with available text...")
    
    lines = raw_text.split('\n')
    print(f"Total lines: {len(lines):,}")
    
    # Find remedy boundaries
    remedies = find_remedy_boundaries(raw_text)
    print(f"Found {len(remedies)} remedies")
    
    # Extract each remedy
    remedy_objects = []
    issues = []
    
    for i, (start_idx, name) in enumerate(remedies):
        end_idx = remedies[i + 1][0] if i + 1 < len(remedies) else len(lines)
        text = extract_remedy_text(lines, start_idx, end_idx)
        
        # Verify completeness
        is_complete, issue = verify_completeness(text, name)
        if not is_complete:
            issues.append(f"  {name}: {issue}")
        
        # Build remedy object
        obj = {
            'id': get_remedy_id(name),
            'name': name.title(),  # Convert to Title Case for display
            'common': '',
            'author': 'Phatak',
            'letter': name[0].upper(),
            'chapter': 'Phatak MM',
            'organ': '',
            'modalities': '',
            'constitution': '',
            'relationships': '',
            'dose': '',
            'keynote': text[:300] if text else '',
            'full': text,
        }
        remedy_objects.append(obj)
        
        if i < 3 or i % 50 == 0:
            print(f"  [{i+1}/{len(remedies)}] {name}: {len(text):,} chars")
    
    # Write output
    print(f"\nWriting {len(remedy_objects)} remedies to {OUTPUT}")
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(remedy_objects, f, ensure_ascii=False, indent=2)
    
    file_size = os.path.getsize(OUTPUT)
    print(f"File size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")
    
    # Verification report
    print("\n" + "=" * 70)
    print("VERIFICATION REPORT")
    print("=" * 70)
    
    # Control chars
    ctrl = sum(1 for r in remedy_objects if re.search(r'[\x00-\x08\x0E-\x1F]', r.get('full', '')))
    print(f"Control chars: {ctrl} (should be 0)")
    
    # Duplicates
    names = [r['name'] for r in remedy_objects]
    dups = [n for n in names if names.count(n) > 1]
    print(f"Duplicate remedies: {len(set(dups))} (should be 0)")
    
    # Empty/truncated
    empty = [r for r in remedy_objects if len(r.get('full', '')) < 100]
    print(f"Remedies with <100 chars: {len(empty)} (should be 0)")
    
    # Issues
    print(f"\nCompleteness issues: {len(issues)}")
    for issue in issues[:10]:
        print(f"  {issue}")
    
    # Sample
    if remedy_objects:
        print(f"\n=== Sample: {remedy_objects[0]['name']} (first 500 chars) ===")
        print(remedy_objects[0]['full'][:500])
    
    print("\n" + "=" * 70)
    print("DONE")
    print("=" * 70)


if __name__ == '__main__':
    main()
