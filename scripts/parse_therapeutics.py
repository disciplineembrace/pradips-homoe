"""Parse Homoeopathic Formulas PDF — v3 smarter parser."""
import subprocess, re, json, os

PDF_PATH = '/home/z/my-project/upload/Homoeopathic Formulas _By Dr. Manoj.pdf'
OUT_PATH = '/home/z/my-project/vercel-deploy/data/therapeutics.json'

print('Extracting text...')
r = subprocess.run(['pdftotext', '-layout', PDF_PATH, '-'], capture_output=True, text=True)
lines = r.stdout.split('\n')

# Find start
start_idx = -1
for i, line in enumerate(lines):
    if line.strip() == 'ABDOMEN' and i > 100:
        start_idx = i
        break

# Helper: detect disease heading
def is_disease_heading(raw):
    """A line that's mostly uppercase, short, may have parenthetical clarifier."""
    if not raw or len(raw) > 80:
        return False
    if any(c.isdigit() for c in raw):
        return False
    # Strip parenthetical clarifiers like "(excess of acid in stomach)"
    cleaned = re.sub(r'\([^)]*\)', '', raw).strip().rstrip('.').strip()
    if not cleaned or len(cleaned) < 3:
        return False
    # Check if it's mostly uppercase
    alpha = [c for c in cleaned if c.isalpha()]
    if not alpha:
        return False
    upper_ratio = sum(1 for c in alpha if c.isupper()) / len(alpha)
    return upper_ratio >= 0.85

# Helper: parse remedy tokens from a line
REMEDY_PATTERNS = [
    # Standard: Name(potency) — e.g., "China(30)", "Calc. carb(30)", "Aur. Met(30-200)"
    re.compile(r"([A-Z][a-zA-Z]{1,15}(?:\.[a-zA-Z]{1,5})?(?:\s[A-Z]?[a-zA-Z]{1,15})?)\s*\((\d+(?:-\d+)?[a-zA-Z\s]*|Q|Mother\s*Tincture)\)"),
    # Inline list: "Alet.f, Cauloph, Calc.fluor" (no potencies, comma-separated remedy abbreviations)
    # Only valid if line starts with "General remedies:" or similar
]

def parse_remedy_list(s):
    """Extract comma-separated remedy abbreviations from a line like 'Alet.f, Cauloph, Calc.fluor'."""
    remedies = []
    # Match remedy abbreviations: word.word or word-word or word
    for tok in re.finditer(r'\b([A-Z][a-z]{1,10}(?:\.[a-z]+)?(?:-[a-z]+)?)\b', s):
        name = tok.group(1).rstrip('.')
        if len(name) < 2 or name.lower() in ['general', 'remedies', 'head', 'from', 'after', 'due', 'with', 'about', 'chronic', 'simple', 'tendency']:
            continue
        remedies.append({'name': name, 'potency': ''})
    return remedies

def parse_remedies_from_line(raw):
    """Parse all remedy entries from a line."""
    remedies = []
    # Pattern 1: Name(potency)
    for m in re.finditer(r"([A-Z][a-zA-Z]{1,15}(?:\.[a-zA-Z]{1,5})?(?:\s[A-Z]?[a-zA-Z]{1,15})?)\s*\((\d+(?:-\d+)?\s*[a-zA-Z]*|Q|Mother\sTincture)\)", raw):
        name = m.group(1).strip().rstrip('.')
        potency = m.group(2).strip()
        if len(name) >= 2:
            remedies.append({'name': name, 'potency': potency})
    
    # Pattern 2: "Name Q" or "Name Mother Tincture" at end of line
    for m in re.finditer(r"([A-Z][a-zA-Z]{1,15}(?:\.[a-zA-Z]{1,5})?(?:\s[a-zA-Z]{1,15})?)\s+(Q|Mother\sTincture)\b", raw):
        name = m.group(1).strip().rstrip('.')
        # Skip if already captured with potency
        if not any(r['name'] == name and r['potency'] == m.group(2) for r in remedies):
            if len(name) >= 2:
                remedies.append({'name': name, 'potency': m.group(2)})
    
    return remedies

def is_subcategory(raw):
    """A line that describes a sub-category (mixed case, may have parenthetical clarifier)."""
    if not raw or len(raw) > 120:
        return False
    # Skip lines that have actual remedy potencies (e.g., "Name(30)")
    # A subcategory with parenthetical like "(obesity)" is OK; "(30)" is not
    if re.search(r'\(\d+', raw):
        return False
    # Skip if mostly uppercase (that's a disease)
    alpha = [c for c in raw if c.isalpha()]
    if not alpha:
        return False
    upper_ratio = sum(1 for c in alpha if c.isupper()) / len(alpha)
    if upper_ratio >= 0.85:
        return False
    # Should start with uppercase letter
    if not raw[0].isupper():
        return False
    return True

# Walk through lines
diseases = []
current_disease = None
current_sub = None
pending_subcat_name = None  # for multi-line subcategory names

for i in range(start_idx, len(lines)):
    raw = lines[i].strip()
    if not raw:
        continue
    # Skip page artifacts
    if raw.isdigit() and len(raw) < 4:
        continue
    if 'saif-ud-din' in raw.lower() or 'encyclopedia of' in raw.lower():
        continue
    if raw in list('ABCDEFGHIJKLMNOPQRSTUVWXYZ'):
        continue
    
    # Try disease heading first
    if is_disease_heading(raw):
        # Extract clean name (strip parenthetical and trailing period)
        name = raw.rstrip('.').strip()
        # If has parenthetical clarifier, keep it as part of name
        # e.g., "ACIDITY (excess of acid in stomach)" → name = "ACIDITY", note = "excess of acid..."
        m = re.match(r"^([A-Z][A-Z\s,&\-/']+)\s*(?:\(([^)]+)\))?\s*\.?\s*$", name)
        if m:
            clean_name = m.group(1).strip()
            note = m.group(2) or ''
        else:
            clean_name = re.sub(r'\s+', ' ', name).strip()
            note = ''
        
        # Skip non-disease uppercase lines
        if clean_name in ['PDF', 'HTTP', 'WWW', 'DR', 'MBBS', 'MPH', 'RMP', 'RHMP', 'NOTE', 'CHAPTER']:
            continue
        # Skip if it's just initials
        if len(clean_name) < 3:
            continue
        
        dis_id = clean_name.lower().replace(' ', '-').replace(',', '').replace("'", '').replace('/', '-').replace('&', 'and').replace('.', '').replace('\\', '').replace('--', '-')[:60]
        current_disease = {
            'id': dis_id,
            'name': clean_name,
            'note': note,
            'subcategories': []
        }
        diseases.append(current_disease)
        current_sub = None
        pending_subcat_name = None
        continue
    
    # Check if this line has remedies
    remedies = parse_remedies_from_line(raw)
    
    # Check if it's a subcategory
    if is_subcategory(raw) and not remedies:
        # Could be a multi-line subcategory; check if next non-empty line is also text
        sub_name = raw.rstrip('.').strip()
        # Skip very long descriptive sentences (paragraphs)
        if len(sub_name) > 100 or '.' in sub_name[10:]:
            # This is a description, not a subcategory
            # Could be a note for the disease
            if current_disease and not current_disease.get('description'):
                current_disease['description'] = sub_name
            continue
        # Skip subcategory names that look like sentences
        if len(sub_name.split()) > 12:
            continue
        # Handle inline remedy lists like "General remedies: Alet.f, Cauloph..."
        if ':' in sub_name and ('remedies' in sub_name.lower() or 'head remedies' in sub_name.lower()):
            # Split: name = part before colon, remedies = part after
            parts = sub_name.split(':', 1)
            sub_name = parts[0].strip()
            inline_remedies = parse_remedy_list(parts[1])
            if inline_remedies:
                current_sub = {'name': sub_name, 'remedies': inline_remedies}
                current_disease['subcategories'].append(current_sub)
                continue
        # Regular subcategory
        if not current_disease:
            continue
        if not current_disease['subcategories'] or current_disease['subcategories'][-1]['name'] != sub_name:
            current_sub = {'name': sub_name, 'remedies': []}
            current_disease['subcategories'].append(current_sub)
        continue
    
    # If we got remedies, add them to current sub
    if remedies and current_disease:
        if not current_sub:
            if not current_disease['subcategories'] or current_disease['subcategories'][-1]['name'] != 'General':
                current_sub = {'name': 'General', 'remedies': []}
                current_disease['subcategories'].append(current_sub)
            else:
                current_sub = current_disease['subcategories'][-1]
        current_sub['remedies'].extend(remedies)
        continue
    
    # If line has inline remedy list (e.g., "aquifol. Q" continuation from previous line)
    if current_sub and raw and raw[0].islower():
        extra = parse_remedies_from_line(raw)
        if extra:
            current_sub['remedies'].extend(extra)

# Cleanup
for d in diseases:
    d['subcategories'] = [s for s in d['subcategories'] if s['remedies']]
    # Deduplicate remedies within a subcategory
    seen = set()
    unique_rems = []
    for r in d.get('subcategories', []) and d['subcategories']:
        pass
    for s in d['subcategories']:
        seen = set()
        unique = []
        for r in s['remedies']:
            key = (r['name'], r['potency'])
            if key not in seen:
                seen.add(key)
                unique.append(r)
        s['remedies'] = unique

diseases = [d for d in diseases if d['subcategories']]

# Stats
total_subs = sum(len(d['subcategories']) for d in diseases)
total_rems = sum(len(s['remedies']) for d in diseases for s in d['subcategories'])
print(f'Diseases: {len(diseases)}')
print(f'Subcategories: {total_subs}')
print(f'Remedy entries: {total_rems}')

# Save
with open(OUT_PATH, 'w') as f:
    json.dump({
        'source': 'Encyclopedia of Homoeopathic Formulas by Dr. Saif-ud-Din Saif',
        'total_diseases': len(diseases),
        'diseases': diseases
    }, f, ensure_ascii=False, indent=2)
print(f'Saved: {os.path.getsize(OUT_PATH):,} bytes')

# Sample
print('\n=== SAMPLE ===')
for d in diseases[:8]:
    print(f'\n{d["name"]}:')
    for s in d['subcategories'][:4]:
        rms = ', '.join(f"{r['name']}({r['potency']})" if r['potency'] else r['name'] for r in s['remedies'][:8])
        print(f'  {s["name"]}: {rms}')
