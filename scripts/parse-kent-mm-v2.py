#!/usr/bin/env python3
"""
Kent MM v2 Parser — narrative prose with ALL CAPS symptom labels.

Kent's structure:
- Remedy name in Title Case (e.g., "Aconitum Napellus")
- "Introduction:" label + narrative prose
- ALL CAPS symptom section headers (e.g., "MIND;", "HEAD;")
  followed by symptom descriptions in prose
- Watermarks to filter: "Public Domain Text Converted into PDF Format by Nalanda"
  and "Nalanda Digital Library-Regional Engineering College,Calicut,India"

Strategy:
- Detect remedy boundaries by Title Case remedy names (standalone lines)
- Capture "Introduction:" as intro
- Detect ALL CAPS section labels as section headings
- Filter watermarks and page artifacts
"""
import json
import os
import re

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)


def make_id(name):
    slug = re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
    return f'kent-mm-{slug}'


# Watermarks and page artifacts to skip
SKIP_PATTERNS = [
    re.compile(r'Public Domain Text Converted into PDF Format by Nalanda', re.IGNORECASE),
    re.compile(r'Nalanda Digital Library', re.IGNORECASE),
    re.compile(r'Regional Engineering College', re.IGNORECASE),
    re.compile(r'^\s*\d+\s*$'),                    # page numbers
    re.compile(r'^\s*LECTURES ON', re.IGNORECASE),
    re.compile(r'^\s*MATERIA MEDICA\s*$', re.IGNORECASE),
    re.compile(r'^\s*J\.?\s*T\.?\s*Kent', re.IGNORECASE),
    re.compile(r'^\s*Contents\s*$', re.IGNORECASE),
    re.compile(r'^\s*PREFACE', re.IGNORECASE),
    re.compile(r'^\s*INTRODUCTION\s*$', re.IGNORECASE),
]


def is_skip_line(line):
    for pat in SKIP_PATTERNS:
        if pat.search(line):
            return True
    return False


def parse_kent(text):
    """Parse Kent MM — narrative + ALL CAPS labels."""
    lines = text.split('\n')

    # Remedy names: Title Case, standalone (1-3 words), no punctuation
    # Examples: "Aconitum Napellus", "Belladonna", "Calcarea carbonica"
    REMEDY_TITLE = re.compile(r'^([A-Z][a-z]+(?:\s+[a-z]+){0,3})\s*$')

    # ALL CAPS section labels (e.g., "MIND;", "HEAD;", "ERUPTIONS; crusts;")
    # These appear at start of line, contain semicolons, and are mostly uppercase
    SECTION_LABEL = re.compile(r'^([A-Z][A-Z;,\s]{3,80}[A-Z;])\s*$')

    remedies = []
    current_name = None
    current_intro = []
    current_sections = []
    current_section = None
    current_para = []
    started = False

    def flush_para():
        nonlocal current_para
        if current_para:
            text = ' '.join(current_para).strip()
            text = re.sub(r'\s+', ' ', text)
            if text:
                if current_section is None:
                    current_intro.append(text)
                else:
                    current_section['parts'].append(text)
            current_para = []

    def save_current():
        nonlocal current_name, current_intro, current_sections, current_section
        flush_para()
        if current_name:
            intro = ' '.join(current_intro).strip()
            intro = re.sub(r'\s+', ' ', intro)
            secs = []
            for s in current_sections:
                content = ' '.join(s['parts']).strip()
                content = re.sub(r'\s+', ' ', content)
                if content:
                    secs.append({'title': s['title'], 'content': content})
            full_parts = []
            if intro:
                full_parts.append(intro)
            for s in secs:
                full_parts.append(f"{s['title']}: {s['content']}")
            full = '\n'.join(full_parts)
            rec = {
                'id': make_id(current_name),
                'name': current_name,
                'common': '',
                'author': 'Kent',
                'letter': current_name[0].upper() if current_name else '?',
                'chapter': 'Lectures on Homoeopathic Materia Medica',
                'organ': '',
                'modalities': '',
                'constitution': '',
                'relationships': '',
                'dose': '',
                'intro': intro,
                'sections': secs,
                'full': full,
                'keynote': '',
                'source_book': 'Materia Medica — J.T. Kent',
            }
            remedies.append(rec)
        current_name = None
        current_intro = []
        current_sections = []
        current_section = None

    for line in lines:
        if is_skip_line(line):
            continue

        ln = line.rstrip()
        stripped = ln.strip()
        if not stripped:
            flush_para()
            continue

        # Check if remedy title (Title Case, standalone)
        m = REMEDY_TITLE.match(stripped)
        if m:
            title = m.group(1).strip()
            words = title.split()
            # Filter false positives
            if title.lower() in {'contents', 'preface', 'introduction', 'index',
                                  'bibliography', 'materia medica', 'chapter',
                                  'appendix', 'part', 'section'}:
                continue
            # Must be 1-4 words, first word 4+ chars
            if len(words) > 4:
                continue
            first = words[0]
            if len(first) < 4:
                continue
            if not first[0].isupper():
                continue

            # Start once we see first remedy
            if not started:
                # Kent's first remedy — check if it looks like a real remedy
                # (not a section heading or chapter title)
                if title in ('Aconitum', 'Abies', 'Abrotanum', 'Absinthium',
                             'Aconitum Napellus', 'Aceticum acidum',
                             'Actaea Racemosa', 'Aesculus', 'Aethusa',
                             'Agaricus', 'Agnus', 'Ailanthus', 'Aletris',
                             'Allium', 'Aloe', 'Alumina', 'Ambra',
                             'Ammonium', 'Anacardium', 'Antimonium',
                             'Apocynum', 'Argentum', 'Arnica', 'Arsenicum',
                             'Arum', 'Asarum', 'Asclepias', 'Aurum',
                             'Baptisia', 'Baryta', 'Belladonna', 'Bellis',
                             'Benzoicum', 'Beryllium', 'Bismuthum',
                             'Borax', 'Bovista', 'Bromium', 'Bryonia',
                             'Bufo', 'Cactus', 'Cadmium', 'Caladium',
                             'Calcarea', 'Calendula', 'Camphora',
                             'Cannabis', 'Cantharis', 'Capsicum',
                             'Carbo', 'Castoreum', 'Causticum',
                             'Cedron', 'Chamomilla', 'Chelidonium',
                             'China', 'Cimicifuga', 'Cina', 'Cocculus',
                             'Coffea', 'Colchicum', 'Collinsonia',
                             'Colocynthis', 'Conium', 'Cuprum'):
                    started = True
                else:
                    continue

            save_current()
            current_name = title
            continue

        if not started or not current_name:
            continue

        # Check if "Introduction:" label
        if stripped.lower().startswith('introduction:') or stripped.lower() == 'introduction':
            # Capture as intro start
            intro_text = stripped.split(':', 1)[1].strip() if ':' in stripped else ''
            if intro_text:
                current_intro.append(intro_text)
            current_section = None
            continue

        # Check if ALL CAPS section label
        # (must be mostly uppercase, contain semicolons or be a known section)
        if SECTION_LABEL.match(stripped):
            # Clean up the label — take first word before semicolon
            label = stripped.split(';')[0].strip().rstrip(';')
            # Only accept if it's a known section vocabulary
            KNOWN_LABELS = {
                'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH',
                'TEETH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'STOOL',
                'URINARY', 'GENITALS', 'MALE', 'FEMALE', 'RESPIRATORY',
                'CHEST', 'HEART', 'BACK', 'EXTREMITIES', 'SKIN', 'SLEEP',
                'FEVER', 'MODALITIES', 'RELATIONSHIP', 'COMPARE',
                'ANTIDOTES', 'DOSE', 'CLINICAL', 'VERTIGO', 'NECK',
                'LIVER', 'SPLEEN', 'KIDNEYS', 'BLADDER', 'PROSTATE',
                'TRACHEA', 'LARYNX', 'BRONCHI', 'LUNGS', 'PLEURA',
                'PERICARDIUM', 'ARTERIES', 'VEINS', 'CAPILLARIES',
                'BONES', 'JOINTS', 'MUSCLES', 'NERVES', 'BRAIN', 'SPINE',
                'GLANDS', 'BLOOD', 'TISSUES', 'DREAMS', 'SWEAT',
                'SENSORIUM', 'DISCHARGES', 'CHILDREN', 'PREGNANCY',
            }
            if label in KNOWN_LABELS:
                flush_para()
                current_section = {'title': label.capitalize(), 'parts': []}
                current_sections.append(current_section)
                continue

        # Plain text — accumulate into paragraph
        current_para.append(stripped)

    save_current()
    return remedies


def main():
    print("=" * 60)
    print("Kent MM v2 Parser — narrative + ALL CAPS labels")
    print("=" * 60)

    with open('/tmp/kent-mm.txt') as f:
        text = f.read()

    remedies = parse_kent(text)
    print(f"\nParsed {len(remedies)} Kent remedies")

    if remedies:
        print(f"\nFirst 5 remedies:")
        for r in remedies[:5]:
            titles = [s['title'] for s in r['sections']]
            print(f"  - {r['name']} | intro_len: {len(r['intro'])} | sections: {titles[:5]}")

        print(f"\n=== Sample: {remedies[0]['name']} ===")
        print(f"  id: {remedies[0]['id']}")
        print(f"  intro (first 200): {remedies[0]['intro'][:200]}...")
        print(f"  sections ({len(remedies[0]['sections'])}):")
        for s in remedies[0]['sections'][:3]:
            print(f"    [{s['title']}] {s['content'][:60]}...")
        print(f"  keynote (should be empty): '{remedies[0]['keynote']}'")

    with open(f'{OUT_DIR}/kent-mm-v2.json', 'w') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_DIR}/kent-mm-v2.json")


if __name__ == '__main__':
    main()
