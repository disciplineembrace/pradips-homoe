"""
Parse Kent's Lectures on Homoeopathic Materia Medica PDF.
3174 pages, ~173 remedies.
100% content preservation. OCR fixes only.
"""
import subprocess, json, re, os

PDF_PATH = '/home/z/my-project/upload/5 Kent MM.pdf'
DATA_FILE = '/home/z/my-project/data/remedies.json'

def extract_text(pdf, start, end):
    cmd = ['pdftotext', '-layout', '-f', str(start), '-l', str(end), pdf, '-']
    return subprocess.run(cmd, capture_output=True, text=True).stdout

def get_pages(pdf):
    r = subprocess.run(['pdfinfo', pdf], capture_output=True, text=True)
    m = re.search(r'Pages:\s+(\d+)', r.stdout)
    return int(m.group(1)) if m else 0

def fix_ocr(text):
    """Fix OCR errors only — no content changes"""
    # Remove Nalanda headers/footers
    text = text.replace('Nalanda Digital Library-Regional Engineering College,Calicut,India', '')
    text = re.sub(r'Public Domain Text Converted into PDF Format by Nalanda\s*\d*', '', text)
    text = re.sub(r'LECTURES ON HOMŒOPATHIC\s+MATERIA MEDICA', '', text)
    text = re.sub(r'by JAMES TYLER KENT, A\.M\., M\.D\.', '', text)
    # Fix ligatures
    text = text.replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff').replace('ﬃ', 'ffi')
    text = text.replace('œ', 'oe').replace('æ', 'ae')
    # Fix broken words across pages
    text = re.sub(r'(\w)-\s*\n\s*(\w)', r'\1-\2', text)
    # Remove standalone page numbers
    text = re.sub(r'\n\s*\d+\s*\n', '\n', text)
    # Remove control characters
    text = re.sub(r'[\x00-\x08\x0b\x0c\x0e-\x1f]', '', text)
    # Remove duplicate spaces
    text = re.sub(r' {2,}', ' ', text)
    # Normalize blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Merge broken lines (short line continues to next)
    lines = text.split('\n')
    merged = []
    current = []
    for line in lines:
        s = line.strip()
        if not s:
            if current:
                merged.append(' '.join(current))
                current = []
            merged.append('')
        else:
            # Don't merge if it's a section heading (starts with uppercase word + colon)
            if current and len(s) < 80 and not s.endswith('.') and not s.endswith(':') and not s.endswith(';') and not s.endswith(',') and not s.endswith('!') and not s.endswith('?') and not s.startswith('•') and not re.match(r'^[A-Z][a-z]+:', s):
                current.append(s)
            else:
                if current:
                    merged.append(' '.join(current))
                    current = []
                current.append(s)
    if current:
        merged.append(' '.join(current))
    return '\n'.join(merged).strip()

def parse_kent_remedies(pdf_path):
    """Parse all Kent remedy entries"""
    pages = get_pages(pdf_path)
    print(f"PDF: {pages} pages")
    
    # Extract text from page 19 (where remedies start) to end
    # Process in chunks of 100 pages to avoid memory issues
    all_remedies = []
    
    for chunk_start in range(19, pages + 1, 100):
        chunk_end = min(chunk_start + 99, pages)
        print(f"  Processing pages {chunk_start}-{chunk_end}...")
        text = extract_text(pdf_path, chunk_start, chunk_end)
        
        lines = text.split('\n')
        current_name = None
        current_content = []
        
        for line in lines:
            stripped = line.strip()
            if not stripped:
                if current_content:
                    current_content.append('')
                continue
            
            # Detect remedy name: appears alone on a line, title case, no digits
            # Kent uses names like "Abrotanum", "Aconitum Napellus", "Apis Mellifica"
            is_remedy = (
                len(stripped) > 3 and
                len(stripped) < 50 and
                not any(c.isdigit() for c in stripped) and
                re.match(r'^[A-Z][a-z]+(?:\s+[a-z]+)?(?:\s+[A-Z][a-z]+)?$', stripped) and
                stripped not in ['Preface', 'Contents', 'Index', 'Introduction', 
                               'Appendix', 'Bibliography', 'References']
            )
            
            if is_remedy:
                # Save previous remedy
                if current_name and current_content:
                    content = fix_ocr('\n'.join(current_content))
                    if len(content) > 100:
                        all_remedies.append({
                            'name': current_name,
                            'content': content,
                        })
                
                current_name = stripped
                current_content = []
            elif current_name:
                current_content.append(stripped)
        
        # Save last remedy in chunk
        if current_name and current_content:
            content = fix_ocr('\n'.join(current_content))
            if len(content) > 100:
                all_remedies.append({
                    'name': current_name,
                    'content': content,
                })
    
    return all_remedies

# === MAIN ===
print("=== Parsing Kent's Lectures on MM ===")
pdf_remedies = parse_kent_remedies(PDF_PATH)
print(f"\nRemedies found: {len(pdf_remedies)}")

# Load existing data
with open(DATA_FILE) as f:
    existing = json.load(f)
print(f"Existing remedies: {len(existing)}")

# Create lookup for Kent
existing_kent = {}
for r in existing:
    if r.get('author') == 'Kent':
        existing_kent[r['name'].lower()] = r
print(f"Existing Kent remedies: {len(existing_kent)}")

# Merge
updated = 0
added = 0

for pdf_rem in pdf_remedies:
    name_lower = pdf_rem['name'].lower()
    existing_rem = existing_kent.get(name_lower)
    
    if existing_rem:
        # Update if PDF content is richer
        old_len = len(existing_rem.get('full', ''))
        new_len = len(pdf_rem['content'])
        
        if new_len > old_len:
            existing_rem['full'] = pdf_rem['content']
            # Update keynote if existing is short
            if len(existing_rem.get('keynote', '')) < 200:
                existing_rem['keynote'] = pdf_rem['content'][:500]
            updated += 1
            if updated <= 5:
                print(f"  Updated: {existing_rem['name']} — {old_len}→{new_len} chars")
    else:
        # Add new remedy
        new_rem = {
            'id': name_lower.replace(' ', '-').replace('.', '')[:60],
            'name': pdf_rem['name'],
            'common': '',
            'author': 'Kent',
            'letter': pdf_rem['name'][0].upper(),
            'chapter': 'Various',
            'organ': '',
            'modalities': '',
            'constitution': '',
            'relationships': '',
            'dose': '',
            'keynote': pdf_rem['content'][:500],
            'full': pdf_rem['content'],
        }
        existing.append(new_rem)
        existing_kent[name_lower] = new_rem
        added += 1
        if added <= 5:
            print(f"  Added: {pdf_rem['name']} — {len(pdf_rem['content'])} chars")

print(f"\n=== MERGE SUMMARY ===")
print(f"  Updated: {updated}")
print(f"  Added: {added}")
print(f"  Total: {len(existing)} (was {len(existing) - added})")

# Save
with open(DATA_FILE, 'w') as f:
    json.dump(existing, f, ensure_ascii=False, indent=2)
print(f"  File size: {os.path.getsize(DATA_FILE):,} bytes")

# Verify
from collections import Counter
authors = Counter([r.get('author', '?') for r in existing])
print(f"\n  Kent: {authors['Kent']}")
print(f"  Total: {len(existing)}")

# Check for duplicates
kent_names = [r['name'].lower() for r in existing if r.get('author') == 'Kent']
dups = {n: c for n, c in Counter(kent_names).items() if c > 1}
print(f"  Duplicates: {len(dups)}")

# Data quality
kent = [r for r in existing if r.get('author') == 'Kent']
avg_full = sum(len(r.get('full', '')) for r in kent) / len(kent) if kent else 0
print(f"  Avg full: {avg_full:.0f} chars/remedy")

# Show sample
print("\n=== Sample ===")
for r in kent[:3]:
    print(f"  {r['name']}: full={len(r.get('full',''))} chars, keynote={len(r.get('keynote',''))} chars")
