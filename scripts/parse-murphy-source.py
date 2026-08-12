#!/usr/bin/env python3
"""
Murphy source parser — extracts remedy entries from
'Lotus Materia Medica (3rd Ed.)' by Robin Murphy.

Source: /data/sources/extracted/murphy.txt (from pdftotext)
Output: /data/murphy-source-remedies.json

Structure:
- Each remedy starts with '***REMEDY NAME' (asterisks mark entry start)
- (Common Name) in parentheses on next line
- Sections: PHARMACY - , CLINICAL - , HOMEOPATHIC - , MIND - , etc.
- Sections end with 'REFERENCES - ...' and a blank line before next ***

NEVER fabricates content. Source text preserved as-is.
"""
import json
import re
import os

SRC = '/home/z/my-project/data/sources/extracted/murphy.txt'
OUT = '/home/z/my-project/data/murphy-source-remedies.json'

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()
    lines = text.split('\n')
    print(f"Loaded {len(lines)} lines from {SRC}")

    # Find all *** remedy markers
    remedies = []
    current_remedy = None
    current_lines = []
    in_index = True  # skip the initial INDEX OF REMEDIES section

    REMEDY_MARKER = re.compile(r'^\*\*\*([A-Z][A-Z\s\-\.\(\)]{2,60})\s*$')

    def save_current():
        nonlocal current_remedy, current_lines
        if current_remedy and current_lines:
            full = '\n'.join(current_lines).strip()
            full = re.sub(r'\n{3,}', '\n\n', full)
            if len(full) > 50:
                current_remedy['full'] = full
                # Keynote: first non-empty paragraph
                first_para = full.split('\n\n')[0] if '\n\n' in full else full[:500]
                current_remedy['keynote'] = first_para[:500]
                remedies.append(current_remedy)
        current_remedy = None
        current_lines = []

    for i, line in enumerate(lines):
        m = REMEDY_MARKER.match(line)
        if m:
            title = m.group(1).strip()
            # Filter false positives
            if len(title) < 3:
                continue
            # Skip if it's clearly not a remedy (common English phrase)
            words = title.split()
            if len(words) > 6:
                continue

            # First marker — we're past the index
            if in_index:
                in_index = False

            save_current()

            name = title.title()
            # Fix common Latin words
            for fix in ['Napellus', 'Nitricum', 'Album', 'Phosphorus', 'Sulphur',
                        'Metallicum', 'Carbonicum', 'Muriaticum', 'Phosphoricum',
                        'Sulphuricum', 'Vegetabilis', 'Animalis', 'Castus',
                        'Virosus', 'Tigrinum', 'Carb', 'Vomica', 'Melifica',
                        'Grisea', 'Montana', 'Occidentale', 'Orientale']:
                name = re.sub(r'\b' + fix.lower() + r'\b', fix, name, flags=re.IGNORECASE)
            remedy_id = 'murphy-mm-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            current_remedy = {
                'id': remedy_id,
                'name': name,
                'common': '',
                'author': 'Murphy',
                'letter': name[0].upper() if name else '?',
                'chapter': 'Murphy Lotus MM',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
            }
            current_lines = []
        else:
            if in_index:
                continue
            if current_remedy:
                # First non-empty line after title may be (common name)
                if not current_lines and line.strip():
                    s = line.strip()
                    if s.startswith('(') and s.endswith(')'):
                        current_remedy['common'] = s[1:-1]
                        continue
                current_lines.append(line)

    save_current()

    print(f"\nParsed {len(remedies)} remedies from Murphy source")
    if remedies:
        print(f"\nFirst 5:")
        for r in remedies[:5]:
            print(f"  - {r['name']} (common: {r.get('common', '—')}, full len: {len(r.get('full', ''))})")
        print(f"\nLast 3:")
        for r in remedies[-3:]:
            print(f"  - {r['name']} (full len: {len(r.get('full', ''))})")

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

    # Compare with production
    with open('/home/z/my-project/data/remedies.json') as f:
        prod = json.load(f)
    prod_murphy = [r for r in prod if r.get('author') == 'Murphy']
    prod_names = {r['name'].lower() for r in prod_murphy}
    src_names = {r['name'].lower() for r in remedies}
    missing = src_names - prod_names
    extra = prod_names - src_names
    print(f"\n=== MURPHY SOURCE vs PRODUCTION ===")
    print(f"Source: {len(remedies)} remedies")
    print(f"Production: {len(prod_murphy)} remedies")
    print(f"Missing from production: {len(missing)}")
    if missing:
        print(f"  Sample: {list(missing)[:15]}")
    print(f"Extra in production: {len(extra)}")
    if extra:
        print(f"  Sample: {list(extra)[:15]}")

if __name__ == '__main__':
    main()
