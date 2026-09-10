#!/usr/bin/env python3
"""
Parse fresh Phatak OCR into structured remedy records — v2 (refined).

Improvements:
- Filter out entries with page numbers (e.g., "2 ABIES NIGRA", "ABROTANUM 3")
- Filter out entries with no real content (<50 chars)
- Filter out entries that are clearly page headers/footers
- Extract remedy name from mixed lines (e.g., "106 - BAPTISIA TINCTORIA" → "BAPTISIA TINCTORIA")
- Merge duplicate remedies (keep longest text)
"""
import json
import re
import os

RAW_FILE = "/home/z/my-project/work/phatak-ocr/phatak-ocr-raw.txt"
OUTPUT = "/home/z/my-project/data/phatak-remedies-fresh.json"

SECTION_LABELS = {
    'GENERALITIES', 'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE',
    'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'URINARY',
    'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART', 'BACK',
    'EXTREMITIES', 'SLEEP', 'FEVER', 'SKIN', 'WORSE', 'BETTER',
    'RELATED', 'COMPLEMENTARY', 'CLINICAL', 'KEYNOTES',
    'MODALITIES', 'RELATIONSHIPS', 'DOSE', 'COMPARE',
    'CAUSATION', 'CHARACTERISTICS', 'SUMMARY', 'CAUTION',
    'INTRODUCTION', 'CONSTITUTION', 'NECK', 'SPINE',
    'TEETH', 'TONGUE', 'PALPITATION', 'PULSE', 'SWEAT',
    'CHILL', 'HEAT', 'VERTIGO', 'HEADACHE', 'COUGH',
    'EXPECTORATION', 'NAUSEA', 'VOMITING', 'ERUCTATIONS',
    'HICCOUGH', 'FLATULENCE', 'CONSTIPATION', 'STOOL',
    'URINE', 'MENSTRUATION', 'LEUCORRHOEA', 'PREGNANCY',
    'CHILDBIRTH', 'LACTATION', 'LARYNX', 'TRACHEA',
    'BRONCHI', 'LUNGS', 'PERICARDIUM', 'ARTERIES', 'VEINS',
    'NERVES', 'MUSCLES', 'BONES', 'JOINTS', 'LIMBS',
    'HANDS', 'FEET', 'FINGERS', 'TOES', 'HAIR', 'NAILS',
    'DISCHARGES', 'ULCERS', 'ERUPTIONS', 'WARTS', 'TUMORS',
    'APPETITE', 'THIRST', 'SALIVA', 'VOICE', 'SPEECH',
    'HEARING', 'VISION', 'SMELL', 'TASTE', 'OVARIES',
    'UTERUS', 'VAGINA', 'PROSTATE', 'LIVER', 'KIDNEYS',
    'BLADDER', 'BLOOD', 'GLANDS', 'TISSUES', 'CIRCULATION',
    'SENSATIONS', 'CHILDREN', 'WOMEN', 'MEN', 'PROVING',
    'OBSERVATIONS', 'PATHOGENESIS',
}

FALSE_POSITIVES = {
    'PAGE', 'CHAPTER', 'CONTENTS', 'INDEX', 'MATERIA', 'MEDICA',
    'PREFACE', 'INTRODUCTION', 'PHATAK', 'HOMOEOPATHIC',
    'S.R.', 'DR.', 'J.T.', 'KENT', 'BOERICKE',
}


def clean_ocr_text(text):
    """Clean OCR artifacts."""
    text = re.sub(r'^--- PAGE \d+ ---$', '', text, flags=re.MULTILINE)
    text = re.sub(r'[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]', '', text)
    text = re.sub(r'([a-z])-\s+([a-z])', r'\1\2', text)
    text = re.sub(r'([A-Z]{2,})-\s+([A-Z]{2,})', r'\1\2', text)
    text = re.sub(r'^\s*\d{1,3}\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r' {3,}', ' ', text)
    return text.strip()


def extract_remedy_name(line):
    """
    Extract clean remedy name from a line that might have page numbers.
    e.g., "2 ABIES NIGRA" → "ABIES NIGRA"
          "106 - BAPTISIA TINCTORIA" → "BAPTISIA TINCTORIA"
          "ABROTANUM 3" → "ABROTANUM"
          "440 LYCOPODIUM" → "LYCOPODIUM"
    """
    stripped = line.strip()
    # Remove leading page numbers: "2 ABIES NIGRA" → "ABIES NIGRA"
    stripped = re.sub(r'^\d+\s*', '', stripped)
    # Remove leading "N - " or "N. " patterns
    stripped = re.sub(r'^\d+\s*[-.]\s*', '', stripped)
    # Remove trailing page numbers: "ABROTANUM 3" → "ABROTANUM"
    stripped = re.sub(r'\s+\d+$', '', stripped)
    # Remove trailing ": NNN" patterns: "TUBERCULINUM : 719" → "TUBERCULINUM"
    stripped = re.sub(r'\s*:\s*\d+$', '', stripped)
    # Remove trailing page references: "SULPHUR 679" → "SULPHUR"
    stripped = re.sub(r'\s+\d{1,4}$', '', stripped)
    return stripped.strip()


def is_valid_remedy_name(name):
    """Check if a name is a valid remedy name (not a false positive)."""
    if not name or len(name) < 3 or len(name) > 50:
        return False
    if name in FALSE_POSITIVES:
        return False
    if name in SECTION_LABELS:
        return False
    # Must be ALL CAPS
    if name != name.upper():
        return False
    if any(c.islower() for c in name):
        return False
    # Must contain at least one letter
    if not any(c.isalpha() for c in name):
        return False
    # Skip if it's just numbers
    if name.isdigit():
        return False
    return True


def find_remedies(text):
    """Find remedy boundaries with improved filtering."""
    lines = text.split('\n')
    remedies = []
    
    for i, line in enumerate(lines):
        stripped = line.strip()
        if not stripped:
            continue
        
        # Must be ALL CAPS
        if stripped != stripped.upper():
            continue
        if any(c.islower() for c in stripped):
            continue
        
        # Extract clean name
        name = extract_remedy_name(stripped)
        
        if not is_valid_remedy_name(name):
            continue
        
        # Skip section labels
        if name.rstrip(':') in SECTION_LABELS:
            continue
        
        # Check if followed by content (at least 50 chars of body text)
        has_content = False
        content_chars = 0
        for j in range(i + 1, min(i + 20, len(lines))):
            next_line = lines[j].strip()
            if next_line and not next_line.startswith('--- PAGE') and not next_line.isdigit():
                content_chars += len(next_line)
                if content_chars >= 50:
                    has_content = True
                    break
        
        if has_content:
            remedies.append((i, name))
    
    # Deduplicate: if same name appears multiple times, keep all (will merge later)
    return remedies


def extract_text(lines, start_idx, end_idx):
    """Extract and clean text for a remedy."""
    raw = '\n'.join(lines[start_idx:end_idx])
    # Remove the remedy name line from the start
    first_line = lines[start_idx].strip()
    raw = raw.lstrip()
    if raw.startswith(first_line):
        raw = raw[len(first_line):]
    return clean_ocr_text(raw)


def get_remedy_id(name):
    slug = re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))
    return f"phatak-mm-{slug}"


def main():
    print("=" * 70)
    print("PARSE FRESH PHATAK OCR — v2 (refined)")
    print("=" * 70)
    
    with open(RAW_FILE, 'r', encoding='utf-8') as f:
        raw_text = f.read()
    print(f"Raw OCR: {len(raw_text):,} chars")
    
    cleaned = clean_ocr_text(raw_text)
    lines = cleaned.split('\n')
    print(f"Cleaned: {len(lines):,} lines")
    
    remedies = find_remedies(cleaned)
    print(f"Found {len(remedies)} remedy candidates")
    
    # Extract text for each
    remedy_map = {}  # name → {text, start_idx}
    for i, (start_idx, name) in enumerate(remedies):
        end_idx = remedies[i + 1][0] if i + 1 < len(remedies) else len(lines)
        text = extract_text(lines, start_idx, end_idx)
        
        # Only keep if text has real content
        if len(text) < 50:
            continue
        
        # If we've seen this remedy before, keep the longer version
        if name in remedy_map:
            if len(text) > len(remedy_map[name]['text']):
                remedy_map[name] = {'text': text, 'start_idx': start_idx}
        else:
            remedy_map[name] = {'text': text, 'start_idx': start_idx}
    
    # Build remedy objects
    remedy_objects = []
    for name in sorted(remedy_map.keys(), key=lambda n: remedy_map[n]['start_idx']):
        text = remedy_map[name]['text']
        
        # Keynote = first non-heading paragraph
        keynote = ''
        for line in text.split('\n'):
            line = line.strip()
            if line and not line.endswith(':') and len(line) > 20:
                keynote = line[:300]
                break
        
        obj = {
            'id': get_remedy_id(name),
            'name': name.title(),
            'common': '',
            'author': 'Phatak',
            'letter': name[0].upper(),
            'chapter': 'Phatak MM',
            'organ': '',
            'modalities': '',
            'constitution': '',
            'relationships': '',
            'dose': '',
            'keynote': keynote,
            'full': text,
        }
        remedy_objects.append(obj)
    
    print(f"\nValid remedies: {len(remedy_objects)}")
    
    # Write
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(remedy_objects, f, ensure_ascii=False, indent=2)
    
    size = os.path.getsize(OUTPUT)
    print(f"Written: {size:,} bytes ({size/1024/1024:.1f} MB)")
    
    # Verify
    print("\n=== VERIFICATION ===")
    ctrl = sum(1 for r in remedy_objects if re.search(r'[\x00-\x08\x0E-\x1F]', r.get('full', '')))
    print(f"Control chars: {ctrl}")
    
    names = [r['name'] for r in remedy_objects]
    dups = [n for n in names if names.count(n) > 1]
    print(f"Duplicates: {len(set(dups))}")
    
    empty = [r for r in remedy_objects if len(r.get('full', '')) < 100]
    print(f"Short (<100 chars): {len(empty)}")
    if empty:
        for e in empty[:5]:
            print(f"  {e['name']}: {len(e['full'])} chars")
    
    # Sample
    for name in ['Abies Nigra', 'Aconite', 'Pulsatilla', 'Sulphur', 'Calcarea Carbonica']:
        r = next((x for x in remedy_objects if x['name'] == name), None)
        if r:
            print(f"\n=== {name} ({len(r['full']):,} chars) ===")
            print(r['full'][:300])
    
    print("\n✅ DONE")


if __name__ == '__main__':
    main()
