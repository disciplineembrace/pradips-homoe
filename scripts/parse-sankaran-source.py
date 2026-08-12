#!/usr/bin/env python3
"""
Sankaran source parser — extracts remedy entries from
'The Soul of Remedies' by Rajan Sankaran.

Source: /data/sources/extracted/sankaran.txt (from pdftotext)
Output: /data/sankaran-source-remedies.json

Structure:
- Remedy name in ALL CAPS, centered (3-6 spaces of indent)
- Quoted "sensation" line immediately after (in italics in source, plain here)
- Body paragraphs describing the remedy
- 'Rubrics' section with bullet points
- Page footer: "The Soul of Remedies NN"

NEVER fabricates content. Source text preserved as-is.
"""
import json
import re
import os

SRC = '/home/z/my-project/data/sources/extracted/sankaran.txt'
OUT = '/home/z/my-project/data/sankaran-source-remedies.json'

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()
    lines = text.split('\n')
    print(f"Loaded {len(lines)} lines from {SRC}")

    # Clean: remove page-number footers and "The Soul of Remedies" footers
    cleaned = []
    for line in lines:
        s = line.rstrip()
        # Skip "The Soul of Remedies NN" footer
        if re.match(r'^\s*\d+\s+The Soul of Remedies\s*$', s):
            continue
        if re.match(r'^\s*The Soul of Remedies\s+\d+\s*$', s):
            continue
        # Skip standalone page numbers
        if re.match(r'^\s*\d{1,3}\s*$', s):
            continue
        cleaned.append(s)

    # Detect remedy boundaries: ALL-CAPS centered title
    # Sankaran titles are like "ACONITUM NAPELLUS", "ARGENTUM NITRICUM", etc.
    # They appear with 3-15 spaces of indent, ALL CAPS, 1-3 words
    REMEDY_TITLE = re.compile(r'^\s{2,20}([A-Z][A-Z\s\-\.]{3,50})\s*$')

    # Common non-remedy ALL-CAPS headings to skip
    SKIP_CAPS = {
        'INTRODUCTION', 'ABOUT THE WRITER', 'RUBRICS', 'CONTENTS',
        'INDEX', 'PREFACE', 'CHAPTER', 'MIND', 'HEAD', 'EYES',
        'PHATAK', 'KENT', 'BOERICKE', 'SYNTHESIS',
    }

    remedies = []
    current_remedy = None
    current_lines = []

    def save_current():
        nonlocal current_remedy, current_lines
        if current_remedy and current_lines:
            full = '\n'.join(current_lines).strip()
            full = re.sub(r'\n{3,}', '\n\n', full)
            if len(full) > 30:
                current_remedy['full'] = full
                # Keynote: first paragraph (the quoted sensation)
                first_para = full.split('\n')[0]
                current_remedy['keynote'] = first_para[:500]
                remedies.append(current_remedy)
        current_remedy = None
        current_lines = []

    for line in cleaned:
        m = REMEDY_TITLE.match(line)
        if m:
            title = m.group(1).strip()
            # Filter false positives
            words = title.split()
            if len(words) > 5:
                continue
            # Skip if any word is a common English word (not Latin remedy name)
            if any(w in SKIP_CAPS for w in words):
                continue
            # Must have at least one long word (4+ chars) — remedy names are long
            if not any(len(w) >= 4 for w in words):
                continue
            # Skip if it contains lowercase
            if any(c.islower() for c in title):
                continue

            save_current()

            name = title.title()
            # Fix common Latin words
            for fix in ['Napellus', 'Nitricum', 'Album', 'Phosphorus', 'Sulphur',
                        'Metallicum', 'Carbonicum', 'Muriaticum', 'Phosphoricum',
                        'Sulphuricum', 'Vegetabilis', 'Animalis', 'Castus',
                        'Virosus', 'Tigrinum', 'Carb', 'Vomica']:
                name = re.sub(r'\b' + fix.lower() + r'\b', fix, name, flags=re.IGNORECASE)
            remedy_id = 'sankaran-mm-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            current_remedy = {
                'id': remedy_id,
                'name': name,
                'common': '',
                'author': 'Sankaran',
                'letter': name[0].upper() if name else '?',
                'chapter': 'Sankaran Soul of Remedies',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
            }
            current_lines = []
        else:
            if current_remedy:
                current_lines.append(line)

    save_current()

    print(f"\nParsed {len(remedies)} remedies from Sankaran source")
    if remedies:
        print(f"\nFirst 5:")
        for r in remedies[:5]:
            print(f"  - {r['name']} (full len: {len(r.get('full', ''))})")
        print(f"\nLast 3:")
        for r in remedies[-3:]:
            print(f"  - {r['name']} (full len: {len(r.get('full', ''))})")

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

    # Compare with production
    with open('/home/z/my-project/data/remedies.json') as f:
        prod = json.load(f)
    prod_sank = [r for r in prod if r.get('author') == 'Sankaran']
    prod_names = {r['name'].lower() for r in prod_sank}
    src_names = {r['name'].lower() for r in remedies}
    missing = src_names - prod_names
    extra = prod_names - src_names
    print(f"\n=== SANKARAN SOURCE vs PRODUCTION ===")
    print(f"Source: {len(remedies)} remedies")
    print(f"Production: {len(prod_sank)} remedies")
    print(f"Missing from production: {len(missing)}")
    if missing:
        print(f"  Sample: {list(missing)[:10]}")
    print(f"Extra in production: {len(extra)}")
    if extra:
        print(f"  Sample: {list(extra)[:10]}")

if __name__ == '__main__':
    main()
