#!/usr/bin/env python3
"""
Allen source parser — extracts remedy entries from
'Allen's Key Notes 10th Edition'.

Structure:
- Remedy name in ALL CAPS, centered (15+ spaces indent)
- Common name on next line (Title Case)
- Family name (e.g., Compositae) on next line
- Sections: Constitution, Mental Generals, Physical Generals, etc.
- Bullet points (•) for symptoms
"""
import json, re, os

SRC = '/home/z/my-project/data/sources/extracted/allen.txt'
OUT = '/home/z/my-project/data/allen-source-remedies.json'

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()
    lines = text.split('\n')
    print(f"Loaded {len(lines)} lines from {SRC}")

    # Find where actual remedies start — look for first real remedy after the
    # repertorial index. The repertorial index ends with single-letter section
    # headers (A, B, C...) followed by the first actual remedy "ABROTANUM".
    start_idx = 0
    for i, line in enumerate(lines):
        if re.match(r'^\s{10,}ABROTANUM\s*$', lines[i]):
            start_idx = i
            break

    print(f"Remedies start at line {start_idx+1}")

    REMEDY_TITLE = re.compile(r'^\s{10,}([A-Z][A-Z\s\-\.]{2,50})\s*$')

    SKIP_CAPS = {
        'REPERTORIAL INDEX', 'THE BOWEL NOSODES', 'INTRODUCTION',
        'MIND', 'VERTIGO', 'HEAD', 'EYE', 'VISION', 'EAR', 'HEARING',
        'NOSE', 'FACE', 'MOUTH', 'TEETH', 'THROAT', 'STOMACH',
        'ABDOMEN', 'RECTUM', 'STOOL', 'URINE', 'GENITALIA', 'LARYNX',
        'RESPIRATION', 'COUGH', 'EXPECTORATION', 'CHEST', 'BACK',
        'EXTREMITIES', 'SLEEP', 'CHILL', 'FEVER', 'PERSPIRATION',
        'SKIN', 'GENERALITIES', 'A', 'B', 'C', 'D', 'E', 'F', 'G',
        'H', 'I', 'J', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S',
        'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
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
                current_remedy['keynote'] = full[:500]
                remedies.append(current_remedy)
        current_remedy = None
        current_lines = []

    for i in range(start_idx, len(lines)):
        line = lines[i]
        m = REMEDY_TITLE.match(line)
        if m:
            title = m.group(1).strip()
            words = title.split()
            if len(words) > 5:
                continue
            if title in SKIP_CAPS:
                continue
            if any(w in SKIP_CAPS for w in words):
                continue
            if not any(len(w) >= 3 for w in words):
                continue
            if any(c.islower() for c in title):
                continue

            save_current()

            name = title.title()
            for fix in ['Napellus', 'Nitricum', 'Album', 'Phosphorus', 'Sulphur',
                        'Metallicum', 'Carbonicum', 'Muriaticum', 'Phosphoricum',
                        'Sulphuricum', 'Vegetabilis', 'Animalis', 'Castus',
                        'Virosus', 'Tigrinum', 'Vomica', 'Melifica',
                        'Grisea', 'Montana', 'Occidentale', 'Orientale',
                        'Cynapium', 'Caninum', 'Defloratum', 'Mutus',
                        'Palustre', 'Decandra', 'Biniodatus', 'Corrosivus',
                        'Cyanatus', 'Dulcis', 'Proto-iodatus', 'Solubilis',
                        'Sulphuricus', 'Nigricans', 'Peltatum', 'Hyemale',
                        'Perfoliatum', 'Officinalis', 'Canadensis',
                        'Virginiana', 'Niger', 'Dioica', 'Sulphur',
                        'Canadense', 'Niger', 'Perforatum', 'Amara',
                        'Clavatum', 'Inflata', 'Bromatum', 'Carbonicum',
                        'Bichromicum', 'Latifolia', 'Alba', 'Trifoliata',
                        'Purpurea', 'Acidum', 'Moschata', 'Tripudians',
                        'Carbonicum', 'Muriaticum', 'Sulphuricum',
                        'Acidum', 'Metallicum', 'Peltatum']:
                name = re.sub(r'\b' + re.escape(fix.lower()) + r'\b', fix, name, flags=re.IGNORECASE)
            remedy_id = 'allen-mm-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            current_remedy = {
                'id': remedy_id, 'name': name, 'common': '',
                'author': 'Allen',
                'letter': name[0].upper() if name else '?',
                'chapter': 'Allen Keynotes', 'organ': '',
                'modalities': '', 'constitution': '',
                'relationships': '', 'dose': '',
            }
            current_lines = []
        else:
            if current_remedy:
                s = line.strip()
                # First non-empty line after title = common name
                if not current_lines and s and not s.startswith('•') and len(s) < 60:
                    if not s.endswith('.') and not s.endswith(','):
                        current_remedy['common'] = s
                        continue
                current_lines.append(line)

    save_current()

    print(f"\nParsed {len(remedies)} remedies from Allen source")
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
    prod_allen = [r for r in prod if r.get('author') == 'Allen']
    prod_names = {r['name'].lower() for r in prod_allen}
    src_names = {r['name'].lower() for r in remedies}
    missing = src_names - prod_names
    extra = prod_names - src_names
    print(f"\n=== ALLEN SOURCE vs PRODUCTION ===")
    print(f"Source: {len(remedies)} remedies")
    print(f"Production: {len(prod_allen)} remedies")
    print(f"Missing from production: {len(missing)}")
    if missing:
        print(f"  Sample: {list(missing)[:15]}")
    print(f"Extra in production: {len(extra)}")
    if extra:
        print(f"  Sample: {list(extra)[:15]}")

if __name__ == '__main__':
    main()
