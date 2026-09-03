"""
Extract proper subsections from ALL Materia Medica remedies.
- Parse 'Mind.', 'Head.', 'Stomach.', etc. from full content
- Extract Modalities, Relationships, Dose sections
- Populate keynote (overview before first section)
- Keep full content intact
- 100% data preservation — only RESTRUCTURE, never delete
"""
import json, re, os

DATA_FILE = '/home/z/my-project/data/remedies.json'

with open(DATA_FILE) as f:
    remedies = json.load(f)
print(f"Loaded {len(remedies)} remedies")

# Section heading patterns used in Boericke: "Mind.––", "Head.––", "Stomach.––"
# Section heading patterns used in Kent: "Mind:", "Head:", "Stomach:"
# Section heading patterns used in others: "Mind.", "Head.", etc.

# Known section names in homoeopathic MM
SECTION_NAMES = [
    'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Urinary', 'Urine', 'Male',
    'Female', 'Genitals', 'Respiratory', 'Chest', 'Heart', 'Circulation',
    'Back', 'Extremities', 'Sleep', 'Skin', 'Fever', 'Generalities',
    'Sensations', 'Modalities', 'Relationship', 'Dose', 'Voice',
    'Larynx', 'Trachea', 'Bronchi', 'Lungs', 'Liver', 'Spleen',
    'Kidneys', 'Bladder', 'Prostate', 'Uterus', 'Ovaries', 'Breast',
    'Neck', 'Scalp', 'Hair', 'Nails', 'Teeth', 'Tongue', 'Gums',
    'Palate', 'Oesophagus', 'Intestines', 'Anus', 'Perineum',
    'Vertigo', 'Vision', 'Hearing', 'Smell', 'Taste', 'Cough',
    'Expectoration', 'Pulse', 'Blood', 'Bones', 'Joints', 'Muscles',
    'Glands', 'Child', 'Clinical', 'Various', 'Introduction',
]

def extract_sections(content):
    """Extract structured sections from remedy content.
    Returns: {keynote, sections: {name: content}, modalities, relationships, dose, full}
    """
    if not content or len(content) < 20:
        return {
            'keynote': content or '',
            'modalities': '',
            'relationships': '',
            'dose': '',
            'full': content or '',
        }
    
    # Find all section headings
    # Pattern 1: Boericke style — "Mind.––" or "Head.—" or "Stomach. —"
    # Pattern 2: Kent style — "Mind:" or "Head:" 
    # Pattern 3: General — "Mind." at start of line
    
    section_positions = []  # [(start_pos, section_name)]
    
    for name in SECTION_NAMES:
        # Pattern: section name followed by . or : then dash/colon/em-dash
        for pattern in [
            rf'\b{re.escape(name)}\.\s*[–—\-]',  # Boericke: "Mind.––"
            rf'\b{re.escape(name)}:\s',           # Kent: "Mind: "
            rf'\b{re.escape(name)}\.\s',           # General: "Mind. "
        ]:
            for m in re.finditer(pattern, content):
                section_positions.append((m.start(), name))
                break  # Only take first match per pattern
    
    # Sort by position
    section_positions.sort()
    
    # Remove duplicates (same position)
    seen_pos = set()
    unique_positions = []
    for pos, name in section_positions:
        if pos not in seen_pos:
            unique_positions.append((pos, name))
            seen_pos.add(pos)
    
    if not unique_positions:
        # No sections found — entire content is keynote
        return {
            'keynote': content[:500],
            'modalities': '',
            'relationships': '',
            'dose': '',
            'full': content,
        }
    
    # Keynote = everything before first section
    keynote = content[:unique_positions[0][0]].strip()
    
    # Extract each section's content
    sections = {}
    for i, (pos, name) in enumerate(unique_positions):
        if i + 1 < len(unique_positions):
            section_content = content[pos:unique_positions[i + 1][0]].strip()
        else:
            section_content = content[pos:].strip()
        
        # Clean up section heading from content
        section_content = re.sub(rf'^{re.escape(name)}\.\s*[–—\-]\s*', '', section_content)
        section_content = re.sub(rf'^{re.escape(name)}:\s*', '', section_content)
        section_content = re.sub(rf'^{re.escape(name)}\.\s*', '', section_content)
        
        if name not in sections:
            sections[name] = section_content
    
    # Extract special fields
    modalities = sections.get('Modalities', '')
    relationships = sections.get('Relationship', '')
    dose = sections.get('Dose', '')
    
    # Also look for "Worse:" and "Better:" patterns for modalities
    if not modalities:
        mod_match = re.search(r'(Better.*?worse.*?)(?=\n[A-Z]|\n\n|$)', content, re.DOTALL | re.IGNORECASE)
        if mod_match:
            modalities = mod_match.group(1).strip()
        else:
            worse_match = re.search(r'(Worse.*?)(?=\n[A-Z][a-z]+[.:]|\n\n|$)', content, re.DOTALL | re.IGNORECASE)
            better_match = re.search(r'(Better.*?)(?=\n[A-Z][a-z]+[.:]|\n\n|$)', content, re.DOTALL | re.IGNORECASE)
            if worse_match or better_match:
                modalities = ' '.join(filter(None, [worse_match.group(1) if worse_match else '', better_match.group(1) if better_match else ''])).strip()
    
    # Also look for "Compare:" patterns for relationships
    if not relationships:
        compare_match = re.search(r'(Compare[:\.].*?)(?=\nDose|\n\n[A-Z]|\nModalities|$)', content, re.DOTALL | re.IGNORECASE)
        if compare_match:
            relationships = compare_match.group(1).strip()
    
    # Look for "Dose." pattern
    if not dose:
        dose_match = re.search(r'(Dose[:\.].*?)(?=\n[A-Z][a-z]+[.:]|\n\n|$)', content, re.DOTALL | re.IGNORECASE)
        if dose_match:
            dose = dose_match.group(1).strip()
    
    return {
        'keynote': keynote if len(keynote) > 20 else content[:500],
        'modalities': modalities,
        'relationships': relationships,
        'dose': dose,
        'full': content,  # Full content always preserved
    }

# Process ALL remedies
updated = 0
for r in remedies:
    content = r.get('full', '')
    if not content or len(content) < 50:
        continue
    
    sections = extract_sections(content)
    
    changed = False
    
    # Update modalities if empty or placeholder
    old_mod = r.get('modalities', '').strip()
    new_mod = sections['modalities']
    if new_mod and (len(old_mod) < 5 or old_mod in ['—', '-', 'See full text.', ' ']):
        r['modalities'] = new_mod
        changed = True
    
    # Update relationships if empty or placeholder
    old_rel = r.get('relationships', '').strip()
    new_rel = sections['relationships']
    if new_rel and (len(old_rel) < 5 or old_rel in ['—', '-']):
        r['relationships'] = new_rel
        changed = True
    
    # Update dose if empty
    old_dose = r.get('dose', '').strip()
    new_dose = sections['dose']
    if new_dose and len(old_dose) < 5:
        r['dose'] = new_dose
        changed = True
    
    # Update keynote if existing is very short and we have a better one
    old_kn = r.get('keynote', '').strip()
    new_kn = sections['keynote']
    if len(new_kn) > len(old_kn) and len(new_kn) > 50:
        r['keynote'] = new_kn
        changed = True
    
    if changed:
        updated += 1

print(f"Updated sections in {updated} remedies (out of {len(remedies)})")

# Save
with open(DATA_FILE, 'w') as f:
    json.dump(remedies, f, ensure_ascii=False, indent=2)
print(f"File size: {os.path.getsize(DATA_FILE):,} bytes")

# Verify
from collections import Counter
authors = Counter([r.get('author', '?') for r in remedies])
print(f"\n=== Author counts ===")
for a, c in authors.most_common():
    print(f"  {a}: {c}")

# Check field population
has_mod = sum(1 for r in remedies if len(r.get('modalities', '')) > 10)
has_rel = sum(1 for r in remedies if len(r.get('relationships', '')) > 10)
has_dose = sum(1 for r in remedies if len(r.get('dose', '')) > 10)
has_kn = sum(1 for r in remedies if len(r.get('keynote', '')) > 50)
has_full = sum(1 for r in remedies if len(r.get('full', '')) > 100)
print(f"\n=== Field population ===")
print(f"  With keynote (>50 chars): {has_kn}")
print(f"  With full (>100 chars): {has_full}")
print(f"  With modalities (>10 chars): {has_mod}")
print(f"  With relationships (>10 chars): {has_rel}")
print(f"  With dose (>10 chars): {has_dose}")

# Sample Kent
print(f"\n=== Kent sample ===")
kent = [r for r in remedies if r.get('author') == 'Kent']
for r in kent[:3]:
    print(f"  {r['name']}:")
    print(f"    keynote: {len(r.get('keynote', ''))} chars")
    print(f"    modalities: {len(r.get('modalities', ''))} chars — {repr(r.get('modalities', '')[:80])}")
    print(f"    relationships: {len(r.get('relationships', ''))} chars — {repr(r.get('relationships', '')[:80])}")
    print(f"    dose: {len(r.get('dose', ''))} chars — {repr(r.get('dose', '')[:80])}")
    print(f"    full: {len(r.get('full', ''))} chars")
