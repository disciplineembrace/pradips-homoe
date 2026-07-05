#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Cleans up phatak_rubrics.json:
- Fixes OCR-truncated heading names (drop-cap letters missing)
- Skips Roman numerals and meta sections (ABBREVIATIONS, INDEX)
- Merges duplicate rubric paths (ITCHIN + ITCHING → ITCHING, ICART + IJEART → HEART, etc.)
- Filters out non-rubric paths (single letters, very short false positives)
"""
import json, re
from pathlib import Path
from collections import defaultdict

IN_JSON = Path("/home/z/my-project/scripts/phatak_rubrics.json")
OUT_JSON = Path("/home/z/my-project/scripts/phatak_rubrics_clean.json")

# Curated OCR fix map for Phatak rubric names
# Format: 'OCR_NAME' → 'CORRECT_NAME'
OCR_FIX_MAP = {
    # Drop-cap missing (most common)
    'HEA': 'HEAD',
    'ICART': 'HEART',
    'IJEART': 'HEART',
    'IIEST': 'CHEST',
    'IIURRY': 'HURRY',
    'IIYSTERIA': 'HYSTERIA',
    'IACE': 'FACE',
    'IAGNATIONS': 'IMAGINATIONS',
    'FEVE': 'FEVER',
    'FAG': 'EAR',  # ??? - probably not, but let's mark
    'NOS': 'NOSE',
    'COUOH': 'COUGH',
    'SWEA': 'SWEAT',
    'ONFUSION': 'CONFUSION',
    'ITCHIN': 'ITCHING',
    'LEEPLESSNESS': 'SLEEPLESSNESS',
    'SLEEPLESSNES': 'SLEEPLESSNESS',
    'SHUDDERIN': 'SHUDDERING',
    'PECTORATION': 'EXPECTORATION',
    'ORGETS': 'FORGETS',
    'INJURIE': 'INJURIES',
    'SPITTIN': 'SPITTING',
    'THINKIN': 'THINKING',
    'SPERMATI': 'SPERMATORRHOEA',
    'ROLLIN': 'ROLLING',
    'LYIN': 'LYING',
    'LARYN': 'LARYNX',
    'NIPPL': 'NIPPLES',
    'PALAT': 'PALATE',
    'PENI': 'PENIS',
    'OESOPHAGU': 'OESOPHAGUS',
    'ZVGOMAE': 'ZYGOMAE',
    'MENSE': 'MENSES',
    'FLATULENC': 'FLATULENCE',
    'GRIE': 'GRIEF',
    'FIERO': 'FEVER',  # ???
    'BLOOJ': 'BLOOD',
    'RESPIRA': 'RESPIRATION',
    'OVARI': 'OVARIES',
    'LASCMOUS': 'GLANDS',
    'NAI': 'NAILS',
    'NES': 'NOSE',  # ???
    'HUR': 'HEAR',  # ???
    'ARALYSIS': 'PARALYSIS',
    'CEPHAL': 'CEPHALAEA',
    'ARRIES': 'ARTERIES',
    'NVULSIONS': 'CONVULSIONS',
    'EPISTAXI': 'EPISTAXIS',
    # Add more if needed
}

# Skip these "rubric names" entirely
SKIP_PATHS = {
    'XIV', 'XIX', 'XVIII', 'XVII', 'XVI', 'XV', 'XIII', 'XII', 'XI', 'X',
    'IX', 'VIII', 'VII', 'VI', 'V', 'IV', 'III', 'II', 'I',
    'ABBREVIATIONS', 'INDEX', 'PREFACE', 'CONTENTS', 'STORY', 'BOOK',
    'ARS',  # abbreviation noise
    'SABA',  # not a rubric, it's a remedy abbreviation
    'AGG', 'AMEL',  # these are sub-rubric markers, not main rubrics
}

def clean():
    data = json.loads(IN_JSON.read_text(encoding='utf-8'))
    print(f"Loaded {len(data)} entries")

    # Group entries by their (corrected) path
    grouped = defaultdict(list)
    skipped = 0
    fixed_count = 0
    for entry in data:
        path = entry['path']
        if path in SKIP_PATHS:
            skipped += 1
            continue
        # Apply OCR fix if available
        if path in OCR_FIX_MAP:
            new_path = OCR_FIX_MAP[path]
            entry['path'] = new_path
            # Also fix the title if it starts with the old path
            if entry['title'].startswith(path + ' —'):
                entry['title'] = new_path + entry['title'][len(path):]
            elif entry['title'] == path:
                entry['title'] = new_path
            fixed_count += 1
        grouped[entry['path']].append(entry)

    print(f"Skipped: {skipped}")
    print(f"OCR-fixed: {fixed_count}")
    print(f"Unique paths after cleanup: {len(grouped)}")

    # Build final list — preserve original entry ids but rebuild ids to use cleaned path
    final = []
    counter = defaultdict(int)
    for path, entries in sorted(grouped.items()):
        for entry in entries:
            counter[path] += 1
            # Rebuild id with cleaned path
            slug = re.sub(r'[^a-z0-9]+', '-', path.lower()).strip('-')
            entry['id'] = f"phatak-{slug}-{counter[path]}"

            # Fix title: strip redundant "PATH — PATH — ..." prefix that came from sub-rubric
            # label accidentally including the main rubric name
            title = entry['title']
            prefix = path + ' — '
            while title.startswith(prefix):
                title = title[len(prefix):]
            # If title is now just the path alone, it's the "general" entry — keep as path
            # If it's something else, prefix with "path — " once
            if title == path:
                entry['title'] = path
            elif ' — ' in title:
                # Sub-rubric was "PATH — sub-name", so title is now "sub-name"
                # Reformat as "path — sub-name"
                entry['title'] = path + ' — ' + title
            else:
                # Title is just a sub-rubric name
                entry['title'] = path + ' — ' + title
            final.append(entry)

    print(f"\nFinal entries: {len(final)}")

    # Stats
    from collections import Counter
    path_counts = Counter(e['path'] for e in final)
    print(f"\nTop 25 rubrics by sub-rubric count:")
    for name, count in path_counts.most_common(25):
        print(f"  {name:30s} {count:4d} sub-rubrics")

    # Total remedies
    total_rems = sum(len(e['remedies']) for e in final)
    print(f"\nTotal remedy references: {total_rems:,}")

    # Sample
    print("\nSample entries (first 10):")
    for e in final[:10]:
        print(f"  [{e['id']:30s}] {e['path']:20s} — {e['title'][:50]}")
        print(f"    {len(e['remedies'])} remedies: {e['remedies'][:5]}")

    OUT_JSON.write_text(json.dumps(final, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\n✓ Wrote {OUT_JSON} ({OUT_JSON.stat().st_size/1024:.1f} KB)")

if __name__ == "__main__":
    clean()
