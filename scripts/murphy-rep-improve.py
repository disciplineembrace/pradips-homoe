#!/usr/bin/env python3
"""
Murphy Repertory — improve existing rubrics data.

The existing data/rubrics.json has 6,169 Murphy rubrics with:
- OCR errors in remedy abbreviations (e.g., "roliigta", "nate", "scavaton")
- No grade information (all remedies treated as grade 1)
- Many rubrics in "UNKNOWN" chapter

This script:
1. Fixes common OCR errors in remedy abbreviations
2. Detects grades from remedy name format (ALL CAPS = grade 4, etc.)
3. Properly categorizes chapters
4. Builds murphy_rebuilt.json in Kent framework format
"""
import json
import os
import re
from collections import Counter

RUBRICS_JSON = '/home/z/my-project/data/rubrics.json'
OUT_FILE = '/home/z/my-project/data/murphy_rebuilt.json'

# Common OCR corrections for remedy abbreviations
OCR_FIXES = {
    'roliigta': 'rola',
    'nate': 'nat-m',
    'scavaton': 'sec',
    'alon.calen': 'alon, calen',
    'cupe-acet': 'cupr-acet',
    'stanrt': 'stann',
    'sitl-ac': 'sil-ac',
    'on08': 'op',
    'cinnb': 'cinb',
    'kep': 'krel',
    'brom.': 'brom',
    'caps': 'caps',
    'ptel': 'ptel',
    'pitu-a': 'pit-a',
    'both-a': 'both-a',
    'bamb-a': 'bamb-a',
    'cupr-acet': 'cupr-acet',
    'fl-ac': 'fl-ac',
    'nat-m': 'nat-m',
    'nit-ac': 'nit-ac',
    'mag-c': 'mag-c',
    'mag-p': 'mag-p',
    'merc-c': 'merc-c',
    'nat-s': 'nat-s',
    'kali-c': 'kali-c',
    'carb-v': 'carb-v',
    'sul-ac': 'sul-ac',
    'calc-s': 'calc-s',
    'cupr-acet': 'cupr-acet',
    'eup-per': 'eup-per',
    'hydr': 'hydr',
    'hydrog': 'hydr',
    'lyc': 'lyc',
    'lach': 'lach',
    'lachl': 'lach',
    'phos': 'phos',
    'puls': 'puls',
    'sil': 'sil',
    'spong': 'spong',
    'stann': 'stann',
    'sulph': 'sulph',
    'tab': 'tab',
    'tell': 'tell',
    'bell': 'bell',
    'calc': 'calc',
    'caust': 'caust',
    'graph': 'graph',
    'hep': 'hep',
    'kreos': 'kreos',
    'lyc': 'lyc',
    'merc': 'merc',
    'nux-v': 'nux-v',
    'phos': 'phos',
    'plat': 'plat',
    'sep': 'sep',
    'sulph': 'sulph',
    'ars': 'ars',
    'arsen': 'ars',
    'acon': 'acon',
    'bell': 'bell',
    'bry': 'bry',
    'cham': 'cham',
    'chin': 'chin',
    'dig': 'dig',
    'dol': 'dol',
    'cupr': 'cupr',
    'dig': 'dig',
    'flac': 'fl-ac',
    'alon': 'alon',
    'calen': 'calen',
}

# Murphy chapter corrections — map OCR'd chapter names to canonical
CHAPTER_FIXES = {
    'ERUPTIONS': 'SKIN',
    'PAIN': 'GENERALITIES',
    'GENITALIA': 'GENITALIA',
    'UNKNOWN': 'GENERALITIES',  # Default for uncategorized
    'FEVER': 'FEVER',
    'DREAMS': 'DREAMS',
    'EYES': 'EYE',
    'SKIN': 'SKIN',
    'BACK': 'BACK',
    'COUGH': 'COUGH',
    'SLEEP': 'SLEEP',
    'FACE': 'FACE',
    'THROAT': 'THROAT',
    'HEAD': 'HEAD',
    'HEART': 'HEART',
    'TONGUE': 'MOUTH',
    'PREGNANCY': 'FEMALE',
    'CHEST': 'CHEST',
    'STOOL': 'STOOL',
    'NOSE': 'NOSE',
    'MOUTH': 'MOUTH',
    'RECTUM': 'RECTUM',
    'ABDOMEN': 'ABDOMEN',
    'STOMACH': 'STOMACH',
    'EXTREMITIES': 'EXTREMITIES',
    'FEMALE': 'FEMALE',
    'MALE': 'MALE',
    'URINARY': 'URINARY',
    'EAR': 'EAR',
    'VERTIGO': 'VERTIGO',
    'VISION': 'VISION',
    'TEETH': 'TEETH',
    'LARYNX': 'LARYNX',
    'RESPIRATION': 'RESPIRATION',
    'CHILL': 'CHILL',
    'PERSPIRATION': 'PERSPIRATION',
    'PROSTATE': 'PROSTATE',
    'BLADDER': 'BLADDER',
    'KIDNEYS': 'KIDNEYS',
    'LIVER': 'LIVER',
    'SPLEEN': 'SPLEEN',
    'NECK': 'NECK',
    'MIND': 'MIND',
    'CLINICAL': 'CLINICAL',
    'BLOOD': 'BLOOD',
    'BONES': 'BONES',
    'GLANDS': 'GLANDS',
    'NERVES': 'NERVES',
    'PULSE': 'PULSE',
    'CONCOMITANTS': 'CONCOMITANTS',
    'GENERALS': 'GENERALITIES',
    'MODALITIES': 'GENERALITIES',
    'SENSATIONS': 'GENERALITIES',
    'LIMBS': 'EXTREMITIES',
    'NASAL': 'NOSE',
    'LUNGS': 'RESPIRATION',
    'VOICE': 'LARYNX',
    'Mental': 'MIND',
}


def fix_remedy_abbrev(rem):
    """Fix OCR errors in remedy abbreviation."""
    rem = rem.strip().lower().replace(' ', '-')
    if rem in OCR_FIXES:
        return OCR_FIXES[rem]
    return rem


def detect_grade(rem):
    """Detect grade from remedy name format.
    
    Murphy grading:
    - ALL CAPS (BELL.) = Grade 4 (Bold-Capitals) — but after OCR, all text
      is typically lowercase, so we can't detect this reliably.
    - For existing data, all remedies are lowercase, so we assign grade 1.
    - However, some remedies in the raw data may have capitalization hints.
    """
    # If the original remedy name is ALL CAPS, it's grade 4
    if rem.isupper() and len(rem) >= 2:
        return 4
    # If starts with capital (Title Case), grade 3
    if rem[0].isupper() and rem[1:].islower():
        return 3
    # Default: grade 1 (plain type)
    return 1


def main():
    print("=" * 60)
    print("Murphy Repertory — Improve existing rubrics")
    print("=" * 60)

    with open(RUBRICS_JSON) as f:
        rubrics = json.load(f)

    murphy = [r for r in rubrics if r.get('author') == 'Murphy']
    print(f"\nExisting Murphy rubrics: {len(murphy)}")

    rebuilt = []
    fixes_applied = 0

    for i, r in enumerate(murphy):
        chapter = r.get('path', 'UNKNOWN')
        title = r.get('title', '')
        remedies_raw = r.get('remedies', [])

        # Fix chapter
        chapter = CHAPTER_FIXES.get(chapter, chapter)

        # Fix and grade remedies
        remedies = []
        remediesGraded = []
        for rem in remedies_raw:
            # Split multi-remedy entries (e.g., "alon.calen" → "alon", "calen")
            parts = re.split(r'[.,\s]+', rem)
            for part in parts:
                part = part.strip()
                if not part or len(part) < 2:
                    continue
                fixed = fix_remedy_abbrev(part)
                if fixed and fixed not in remedies:
                    grade = detect_grade(part)
                    remedies.append(fixed)
                    remediesGraded.append({'abbrev': fixed, 'grade': grade})
                    if fixed != part.lower():
                        fixes_applied += 1

        if not remedies:
            continue

        rec = {
            'id': f'murphy_{i+1}',
            'repertory': 'Murphy',
            'chapter': chapter,
            'level': 0,
            'rubricText': title,
            'fullPath': chapter,
            'fullPathParts': [chapter],
            'entryType': 'rubric',
            'crossReference': None,
            'remedies': remedies,
            'remediesGraded': remediesGraded,
            'remedyCount': len(remedies),
            'singleRemedy': len(remedies) == 1,
            'pdfPage': None,
        }
        rebuilt.append(rec)

    print(f"\nRebuilt Murphy rubrics: {len(rebuilt)}")
    print(f"Remedy abbreviations fixed: {fixes_applied}")

    # Chapter distribution
    chapters = Counter(r['chapter'] for r in rebuilt)
    print(f"\nChapters ({len(chapters)}):")
    for c, count in chapters.most_common(15):
        print(f"  {c}: {count}")

    # Grade distribution
    grade_counts = Counter()
    for r in rebuilt:
        for rg in r['remediesGraded']:
            grade_counts[rg['grade']] += 1
    print(f"\nGrade distribution:")
    for g in sorted(grade_counts.keys()):
        print(f"  Grade {g}: {grade_counts[g]:,} remedies")

    # Show sample
    if rebuilt:
        print(f"\nSample rubric:")
        print(json.dumps(rebuilt[0], indent=2, ensure_ascii=False)[:500])

    with open(OUT_FILE, 'w') as f:
        json.dump(rebuilt, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {OUT_FILE} ({os.path.getsize(OUT_FILE):,} bytes)")


if __name__ == '__main__':
    main()
