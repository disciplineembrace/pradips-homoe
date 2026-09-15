#!/usr/bin/env python3
"""
Murphy MM v2 Parser — extracts structured sections from EXISTING data.

Strategy: The existing remedies.json already has 1384 Murphy remedies with
`full` text. The text contains section headings marked as "HEADING - ".
We parse the `full` field to extract structured sections.

Murphy section headings (verified from source):
  PHARMACY - abel. Abelmoschus hibiscus. Musk-seed. ...
  CLINICAL - Addison's disease. Anemia. Asthma. ...
  HERBAL - Abelmoschus is a shrub found in Egypt, ...
  HOMEOPATHIC - Abelmoschus affects the stomach, ...
  MIND - Fears at night. Irrational fear of animals. ...
  Head - Migraine headaches. Heavy feeling in the head, ...
  Eyes - Acute and chronic glaucoma. ...
  Ears - Diminished ability to hear, ...
  Face - Face pale, yellow, itching.
  Mouth - Thick, sticky saliva. ...
  Stomach - Pain in the pit of the stomach.
  Throat - Dysphagia.
  Relations - Compare: (1) Staph., ...
  Dose - Tincture and all potencies.
"""
import json
import os
import re

OUT_DIR = '/home/z/my-project/data/mm-v2'
os.makedirs(OUT_DIR, exist_ok=True)

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'

# Known Murphy section headings — pattern: "HEADING - " or "HEADING- "
# These appear at the start of a line in the `full` text
SECTION_PATTERN = re.compile(
    r'(?:^|\n)\s*'
    r'(PHARMACY|CLINICAL|HERBAL|HOMEOPATHIC|HOMEOPATHIC|MIND|'
    r'Head|Eyes|Ears|Nose|Face|Mouth|Throat|Teeth|'
    r'Stomach|Abdomen|Rectum|Stool|Urinary|Male|Female|'
    r'Respiratory|Chest|Heart|Back|Extremities|Limbs|'
    r'Skin|Sleep|Fever|Modalities|Relations|Dose|'
    r'Vision|Larynx|Trachea|Bronchi|Lungs|Pleura|'
    r'Pericardium|Neck|Liver|Spleen|Kidneys|Bladder|Prostate|'
    r'Bones|Joints|Muscles|Nerves|Blood|Tissues|Glands|'
    r'Lymphatics|Dreams|Perspiration|Chill|Concomitants|Pulse|'
    r'Children|Pregnancy|Nutrition|Constitution|'
    r'Source|Habitat|Preparation|Provings|'
    r'Compare|Antidotes|Complementary|Inimical|Follows|'
    r'Duration|Repetition|Genitals|Food|Thyroid)'
    r'\s*-\s*',
    re.MULTILINE
)

# Map section headings to canonical titles
SECTION_TITLE_MAP = {
    'PHARMACY': 'Pharmacy', 'CLINICAL': 'Clinical',
    'HERBAL': 'Herbal', 'HOMEOPATHIC': 'Homeopathic',
    'MIND': 'Mind', 'Head': 'Head', 'Eyes': 'Eyes',
    'Ears': 'Ears', 'Nose': 'Nose', 'Face': 'Face',
    'Mouth': 'Mouth', 'Throat': 'Throat', 'Teeth': 'Teeth',
    'Stomach': 'Stomach', 'Abdomen': 'Abdomen',
    'Rectum': 'Rectum', 'Stool': 'Stool', 'Urinary': 'Urinary',
    'Male': 'Male', 'Female': 'Female', 'Genitals': 'Genitals',
    'Respiratory': 'Respiratory', 'Chest': 'Chest',
    'Heart': 'Heart', 'Back': 'Back',
    'Extremities': 'Extremities', 'Limbs': 'Limbs',
    'Skin': 'Skin', 'Sleep': 'Sleep', 'Fever': 'Fever',
    'Modalities': 'Modalities', 'Relations': 'Relations',
    'Dose': 'Dose', 'Vision': 'Vision',
    'Larynx': 'Larynx', 'Trachea': 'Trachea',
    'Bronchi': 'Bronchi', 'Lungs': 'Lungs', 'Pleura': 'Pleura',
    'Pericardium': 'Pericardium', 'Neck': 'Neck',
    'Liver': 'Liver', 'Spleen': 'Spleen',
    'Kidneys': 'Kidneys', 'Bladder': 'Bladder',
    'Prostate': 'Prostate', 'Bones': 'Bones',
    'Joints': 'Joints', 'Muscles': 'Muscles',
    'Nerves': 'Nerves', 'Blood': 'Blood',
    'Tissues': 'Tissues', 'Glands': 'Glands',
    'Lymphatics': 'Lymphatics', 'Dreams': 'Dreams',
    'Perspiration': 'Perspiration', 'Chill': 'Chill',
    'Concomitants': 'Concomitants', 'Pulse': 'Pulse',
    'Children': 'Children', 'Pregnancy': 'Pregnancy',
    'Nutrition': 'Nutrition', 'Constitution': 'Constitution',
    'Source': 'Source', 'Habitat': 'Habitat',
    'Preparation': 'Preparation', 'Provings': 'Provings',
    'Compare': 'Compare', 'Antidotes': 'Antidotes',
    'Complementary': 'Complementary', 'Inimical': 'Inimical',
    'Follows': 'Follows', 'Duration': 'Duration',
    'Repetition': 'Repetition', 'Food': 'Food',
    'Thyroid': 'Thyroid',
}


def extract_sections(full_text):
    """Extract structured sections from Murphy full text."""
    if not full_text:
        return []

    # Find all section heading positions
    matches = list(SECTION_PATTERN.finditer(full_text))
    if not matches:
        return []

    sections = []
    for i, m in enumerate(matches):
        heading = m.group(1)
        title = SECTION_TITLE_MAP.get(heading, heading.title())
        # Content starts after the " - " and goes until the next section
        start = m.end()
        end = matches[i+1].start() if i+1 < len(matches) else len(full_text)
        content = full_text[start:end].strip()
        # Clean up content
        content = re.sub(r'\n+', ' ', content)
        content = re.sub(r'\s+', ' ', content).strip()
        if content:
            sections.append({'title': title, 'content': content})

    return sections


def main():
    print("=" * 60)
    print("Murphy MM v2 — Extract sections from existing data")
    print("=" * 60)

    with open(REMEDIES_JSON) as f:
        remedies = json.load(f)

    murphy = [r for r in remedies if r.get('author') == 'Murphy']
    print(f"\nFound {len(murphy)} Murphy remedies in master data")

    parsed = []
    for r in murphy:
        full = r.get('full', '')
        sections = extract_sections(full)

        # Build record
        rec = {
            'id': r['id'],
            'name': r['name'],
            'common': r.get('common', ''),
            'author': 'Murphy',
            'letter': r.get('letter', r['name'][0].upper() if r['name'] else '?'),
            'chapter': 'Lotus Materia Medica',
            'organ': '',
            'modalities': '',
            'constitution': '',
            'relationships': '',
            'dose': '',
            'intro': '',
            'sections': sections,
            'full': full,
            'keynote': '',
            'source_book': 'Lotus Materia Medica (3rd Ed.) — Robin Murphy',
        }

        # Extract fields from sections
        for s in sections:
            t = s['title']
            if t in ('Relations', 'Compare', 'Antidotes', 'Complementary',
                     'Inimical', 'Follows'):
                if rec['relationships']:
                    rec['relationships'] += '\n' + s['content']
                else:
                    rec['relationships'] = s['content']
            elif t == 'Dose':
                rec['dose'] = s['content']
            elif t in ('Modalities', 'Chill', 'Perspiration'):
                if rec['modalities']:
                    rec['modalities'] += '\n' + s['content']
                else:
                    rec['modalities'] = s['content']
            elif t == 'Constitution':
                rec['constitution'] = s['content']

        parsed.append(rec)

    print(f"\nParsed {len(parsed)} Murphy remedies with structured sections")

    # Stats
    has_sections = sum(1 for r in parsed if r['sections'])
    total_sections = sum(len(r['sections']) for r in parsed)
    print(f"  Remedies with sections: {has_sections}/{len(parsed)}")
    print(f"  Total sections: {total_sections}")
    print(f"  Average sections per remedy: {total_sections/len(parsed):.1f}")

    # Show sample
    if parsed:
        print(f"\n=== SAMPLE: {parsed[0]['name']} ===")
        print(f"  sections ({len(parsed[0]['sections'])}):")
        for s in parsed[0]['sections'][:5]:
            print(f"    [{s['title']}] {s['content'][:80]}...")
        print(f"  keynote: '{parsed[0]['keynote']}'")

    with open(f'{OUT_DIR}/murphy-v2.json', 'w') as f:
        json.dump(parsed, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_DIR}/murphy-v2.json")


if __name__ == '__main__':
    main()
