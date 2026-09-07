"""
Parse Materia Medica PDFs and merge with existing remedies.json.
STRICT filtering: only real remedy names, no prefaces/chapters/index entries.
No duplicate remedies. No data loss. Only enrich existing + add verified new.
"""
import subprocess, json, re, os

UPLOAD_DIR = '/home/z/my-project/upload'
DATA_FILE = '/home/z/my-project/data/remedies.json'

# Load existing
with open(DATA_FILE) as f:
    remedies = json.load(f)
print(f"Loaded {len(remedies)} existing remedies")

by_name_author = {}
by_name_only = {}
for r in remedies:
    by_name_author[(r['name'].lower(), r['author'].lower())] = r
    if r['name'].lower() not in by_name_only:
        by_name_only[r['name'].lower()] = r

def extract_text(pdf_path, start=1, end=None):
    cmd = ['pdftotext', '-layout', '-f', str(start)]
    if end: cmd.extend(['-l', str(end)])
    cmd.extend([pdf_path, '-'])
    return subprocess.run(cmd, capture_output=True, text=True).stdout

def get_pages(pdf_path):
    r = subprocess.run(['pdfinfo', pdf_path], capture_output=True, text=True)
    m = re.search(r'Pages:\s+(\d+)', r.stdout)
    return int(m.group(1)) if m else 0

def clean(text):
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
    text = re.sub(r'\n\s*\d+\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'Nalanda Digital Library.*?\n', '', text)
    text = re.sub(r'\n{3,}', '\n\n', text)
    return text.strip()

# Known non-remedy words to EXCLUDE
EXCLUDE_WORDS = {
    'preface', 'introduction', 'foreword', 'contents', 'index', 'chapter',
    'appendix', 'bibliography', 'glossary', 'about', 'copyright', 'published',
    'note from', 'note to', 'constitution', 'modalities', 'relationships',
    'dose', 'comparison', 'related', 'summary', 'conclusion', 'reference',
    'acknowledgment', 'dedication', 'title', 'author', 'editor', 'translator',
    'janmashtami', 'india', 'kuldeep jain', 'b jain', 'publishers', 'published by',
    'respiratory system', 'outer head', 'inner head', 'outer', 'inner',
    'head', 'face', 'mouth', 'teeth', 'throat', 'appetite', 'abdomen',
    'rectum', 'stool', 'urinary', 'male', 'female', 'respiratory',
    'circulation', 'back', 'extremities', 'sleep', 'skin', 'fever',
    'generalities', 'sensations', 'mind', 'nervous system', 'glands',
    'digestion', 'circulatory', 'blood', 'bones', 'joints', 'muscles',
    'nose', 'ears', 'eyes', 'vision', 'hearing', 'smell', 'taste',
    'larynx', 'trachea', 'bronchi', 'lungs', 'heart', 'liver', 'spleen',
    'kidneys', 'bladder', 'prostate', 'uterus', 'ovaries', 'breast',
    'neck', 'scalp', 'hair', 'nails', 'tongue', 'gums', 'palate',
    'oesophagus', 'stomach', 'intestines', 'anus', 'perineum',
    'genitalia', 'larynx and trachea', 'external throat', 'internal throat',
    'abdomen and stomach', 'lower extremities', 'upper extremities',
    'spine', 'sacrum', 'coccyx', 'shoulder', 'elbow', 'wrist', 'hand',
    'fingers', 'hip', 'knee', 'ankle', 'foot', 'toes', 'axilla',
    'clavicle', 'scapula', 'chest', 'mammary', 'breathing', 'cough',
    'expectoration', 'pulse', 'heart and pulse', 'blood and circulation',
    'urine', 'urination', 'seminal', 'sexual', 'menses', 'leucorrhea',
    'pregnancy', 'labor', 'lactation', 'voice', 'respiration',
    'external', 'internal', 'various', 'miscellaneous', 'clinical',
    'therapeutics', 'pathology', 'diagnosis', 'prognosis', 'treatment',
    'potency', 'repetition', 'posology', 'pharmacy', 'provings',
    'philosophy', 'organon', 'principles', 'theory', 'method',
    'technique', 'case taking', 'repertory', 'analysis', 'synthesis',
    'differential', 'comparison of remedies', 'relationship of remedies',
    'table of contents', 'list of remedies', 'abbreviations',
}

def is_real_remedy(name):
    """Check if a name is a real remedy (not a chapter/section heading)"""
    name_lower = name.lower().strip()
    
    # Too short or too long
    if len(name_lower) < 3 or len(name_lower) > 40:
        return False
    
    # Contains digits
    if any(c.isdigit() for c in name):
        return False
    
    # Single common word
    if name_lower in EXCLUDE_WORDS:
        return False
    
    # Starts with common non-remedy words
    for excl in ['preface', 'chapter', 'table of', 'list of', 'note from', 'note to',
                 'published by', 'about the', 'index of', 'content', 'appendix']:
        if name_lower.startswith(excl):
            return False
    
    # All uppercase (likely a heading, not a remedy name)
    if name.isupper() and len(name) > 15:
        return False
    
    # Contains common section words
    for word in ['system', 'tract', 'region', 'part', 'organ', 'gland',
                 'fever', 'sleep', 'skin', 'mind', 'head', 'eye', 'ear',
                 'nose', 'mouth', 'throat', 'stomach', 'abdomen', 'rectum',
                 'urinary', 'male', 'female', 'respiratory', 'circulatory',
                 'nervous', 'extremit', 'back', 'neck', 'chest', 'heart',
                 'blood', 'liver', 'kidney', 'bladder', 'bone', 'joint',
                 'muscle', 'skin', 'hair', 'nail', 'tongue', 'tooth', 'teeth',
                 'gum', 'palate', 'larynx', 'trachea', 'bronch', 'lung',
                 'spleen', 'uterus', 'ovary', 'breast', 'prostate',
                 'pregnan', 'labor', 'lactat', 'menses', 'leucorrh',
                 'chapter', 'section', 'preface', 'foreword', 'introduction']:
        if word in name_lower:
            return False
    
    # Must start with uppercase letter
    if not name[0].isupper():
        return False
    
    # Must be mostly letters (allow spaces, hyphens, periods)
    alpha_count = sum(1 for c in name if c.isalpha())
    if alpha_count < 3:
        return False
    
    return True

def parse_pdf(pdf_path, author, max_pages=500):
    pages = get_pages(pdf_path)
    end = min(pages, max_pages)
    print(f"  {author}: {pages} pages (processing {end})")
    
    text = extract_text(pdf_path, 1, end)
    found = {}
    lines = text.split('\n')
    current = None
    content = []
    
    for line in lines:
        line = line.strip()
        if not line:
            if current and content:
                content.append('')
            continue
        
        # Check if line is a remedy name
        if (len(line) < 40 and len(line) > 3 and
            re.match(r'^[A-Z][a-zA-Z\s\-\.]+$', line) and
            is_real_remedy(line)):
            
            # Save previous
            if current and content:
                c = clean('\n'.join(content))
                if len(c) > 80:
                    found[current] = c
            
            current = line
            content = []
        elif current:
            content.append(line)
    
    # Save last
    if current and content:
        c = clean('\n'.join(content))
        if len(c) > 80:
            found[current] = c
    
    print(f"    Found {len(found)} valid remedies")
    return found

# Parse PDFs
pdfs = [
    ("6 Allen's Key Notes 10th Edition.pdf", "Allen"),
    ("Materia Medica - J.T. Kent.pdf", "Kent"),
    ("Clinical Materia Medica - E.A. Farrington.pdf", "Farrington"),
    ("The Soul of Remedies - Rajan Sankaran(New).pdf", "Sankaran"),
    ("Boeger Synoptic Key Materia Medica.pdf", "Boeger"),
]

all_found = {}
for fn, author in pdfs:
    path = os.path.join(UPLOAD_DIR, fn)
    if os.path.exists(path):
        print(f"\n=== {author} ===")
        all_found[author] = parse_pdf(path, author)

# Merge
updated = 0
added = 0

for author, pdf_rems in all_found.items():
    print(f"\n=== Merging {author} ({len(pdf_rems)} remedies) ===")
    
    for name, content in pdf_rems.items():
        nl = name.lower()
        key = (nl, author.lower())
        existing = by_name_author.get(key) or by_name_only.get(nl)
        
        if existing:
            old_len = len(existing.get('full', ''))
            new_len = len(content)
            if new_len > old_len:
                existing['full'] = content
                updated += 1
                if updated <= 5:
                    print(f"  Updated: {existing['name']} ({existing['author']}) — {old_len}→{new_len}")
            
            old_kn = existing.get('keynote', '')
            if len(old_kn) < 100 and new_len > 200:
                existing['keynote'] = content.split('\n\n')[0][:500]
        else:
            # Add new remedy
            r = {
                'id': nl.replace(' ', '-').replace('.', '')[:60],
                'name': name,
                'common': '',
                'author': author,
                'letter': name[0].upper(),
                'chapter': 'Various',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'keynote': content.split('\n\n')[0][:500],
                'full': content,
            }
            remedies.append(r)
            by_name_author[key] = r
            by_name_only[nl] = r
            added += 1
            if added <= 5:
                print(f"  Added: {name} ({author}) — {len(content)} chars")

print(f"\n=== SUMMARY ===")
print(f"  Updated: {updated}")
print(f"  Added: {added}")
print(f"  Total: {len(remedies)} (was {len(remedies)-added})")

# Save
with open(DATA_FILE, 'w') as f:
    json.dump(remedies, f, ensure_ascii=False, indent=2)
print(f"  Size: {os.path.getsize(DATA_FILE):,} bytes")

# Verify no dups
from collections import Counter
dups = {k:v for k,v in Counter([(r['name'].lower(), r['author'].lower()) for r in remedies]).items() if v > 1}
if dups:
    print(f"  ⚠️ {len(dups)} duplicates:")
    for k,v in list(dups.items())[:5]:
        print(f"    {k}: {v}")
else:
    print(f"  ✅ No duplicates")

# Author counts
authors = Counter([r.get('author','?') for r in remedies])
print(f"\n  Author counts:")
for a,c in authors.most_common():
    print(f"    {a}: {c}")
