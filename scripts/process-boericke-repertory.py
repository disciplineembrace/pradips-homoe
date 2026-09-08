#!/usr/bin/env python3
"""
Parse Boericke's Repertory from extracted text.
The repertory section spans lines ~30089 to ~44512.

Format:
  CHAPTER NAME (header line)
  RUBRIC—remedies
  RUBRIC—Sub-rubric—remedies
    Indented sub-rubric—remedies
"""
import json, re, os
from collections import Counter

INPUT = '/tmp/boericke-raw.txt'
OUTPUT = '/home/z/my-project/data/boericke-repertory.json'

# Known chapter names in Boericke's repertory
CHAPTERS = [
    'Mind', 'Head', 'Eye', 'Eyes', 'Ear', 'Ears', 'Nose', 'Face', 'Mouth',
    'Throat', 'Stomach', 'Abdomen', 'Rectum', 'Anus', 'Urinary Organs',
    'Urinary', 'Male Sexual System', 'Male', 'Female Sexual System', 'Female',
    'Respiratory System', 'Respiratory', 'Larynx', 'Heart', 'Blood',
    'Blood Vessels', 'Back', 'Extremities', 'Sleep', 'Skin', 'Fever',
    'Generalities', 'Modalities', 'Relationship', 'Nervous System'
]
CHAPTER_SET = set(c.lower() for c in CHAPTERS)

def parse_remedies(text):
    """Parse remedy abbreviations from a string."""
    if not text:
        return []
    # Remove parenthetical notes
    text = re.sub(r'\(See[^)]*\)', '', text)
    text = re.sub(r'\([^)]*remedies[^)]*\)', '', text, flags=re.IGNORECASE)
    # Split by semicolons and commas
    parts = re.split(r'[;,.]', text)
    remedies = []
    seen = set()
    for part in parts:
        part = part.strip().strip('. ').strip()
        if not part or len(part) > 30 or len(part) < 1:
            continue
        # Remedy abbreviations: start with uppercase, may have hyphens/periods
        # e.g., Aeth., Apis, B-v., Nat. m., Nux v., Calc. p.
        if re.match(r'^[A-Z][a-z\-]+(?:\s+[a-z]\.?)?$', part) or \
           re.match(r'^[A-Z][a-z]+\s+[a-z]\.$', part) or \
           re.match(r'^[A-Z]\-[a-z]+$', part) or \
           re.match(r'^[A-Z][a-z]+$', part):
            formatted = part.rstrip('.')
            if formatted and formatted.lower() not in seen:
                seen.add(formatted.lower())
                remedies.append(formatted)
    return remedies

def main():
    with open(INPUT, 'r', encoding='utf-8', errors='replace') as f:
        raw = f.read()
    
    # Find repertory section
    # Look for "REPERTORY" followed by "MIND" or chapter content
    rep_start_markers = [
        raw.find('REPERTORY\n                                    MIND'),
        raw.find('\nMIND\n', raw.find('REPERTORY', 30000)),
    ]
    rep_start = max(m for m in rep_start_markers if m != -1)
    
    # Find the actual MIND chapter start
    mind_match = re.search(r'\nMIND\s*\n', raw[rep_start:rep_start + 5000])
    if mind_match:
        rep_start = rep_start + mind_match.start()
    
    # Find end (INDEX TO THE REPERTORY)
    rep_end = raw.find('INDEX TO THE REPERTORY', rep_start)
    if rep_end == -1:
        rep_end = len(raw)
    
    rep_text = raw[rep_start:rep_end]
    lines = rep_text.split('\n')
    
    print(f"Repertory text: {len(rep_text):,} chars, {len(lines):,} lines")
    
    rubrics = []
    current_chapter = 'Mind'
    current_main_rubric = None
    count = 0
    
    i = 0
    while i < len(lines):
        line = lines[i].strip()
        
        # Skip empty, page numbers, headers
        if not line:
            i += 1; continue
        if re.match(r'^\d+$', line):
            i += 1; continue
        if line.upper() == 'REPERTORY':
            i += 1; continue
        # Skip "Mind 665" type page headers
        if re.match(r'^[A-Z][a-z]+\s+\d+$', line):
            i += 1; continue
        if re.match(r'^\d+\s+[A-Z][a-z]+$', line):
            i += 1; continue
        
        # Check if this is a chapter header
        # Chapters appear as standalone words: Mind, Head, Abdomen, etc.
        if line.lower() in CHAPTER_SET and len(line) < 40:
            current_chapter = line.strip()
            current_main_rubric = None
            i += 1; continue
        
        # Main rubric: UPPERCASE title — remedies
        # e.g., "AWKWARD-Lets things fall from hand—Aeth.; Apis; B-v.; Hell.;"
        main_match = re.match(
            r'^([A-Z][A-Z\s,\-\(\)/\&\'\.]+?)[—–]\s*(.*)',
            line
        )
        
        if main_match:
            rubric_title = main_match.group(1).strip()
            remedies_str = main_match.group(2).strip()
            
            # Skip if title is a chapter name
            if rubric_title.lower() in CHAPTER_SET:
                i += 1; continue
            if len(rubric_title) < 2 or len(rubric_title) > 100:
                i += 1; continue
            
            # Collect continuation lines (remedy lists spanning multiple lines)
            full_remedies = remedies_str
            j = i + 1
            while j < len(lines):
                nl = lines[j].strip()
                if (nl and
                    not re.match(r'^[A-Z][A-Z\s,\-]+[—–]', nl) and
                    nl.lower() not in CHAPTER_SET and
                    not re.match(r'^\d+$', nl) and
                    not nl.upper() == 'REPERTORY' and
                    not re.match(r'^[A-Z][a-z]+\s+\d+$', nl) and
                    not re.match(r'^\d+\s+[A-Z][a-z]+$', nl)):
                    # Check if it looks like a continuation (remedy abbreviations)
                    if (re.search(r'[A-Z][a-z]?\.', nl) or
                        re.match(r'^[a-z]', nl) or
                        nl.startswith('(') or
                        nl.startswith(';') or
                        len(nl) < 80):
                        full_remedies += ' ' + nl
                        j += 1
                        if j - i > 8: break
                    else:
                        break
                else:
                    break
            
            remedies = parse_remedies(full_remedies)
            
            if remedies and len(rubric_title) > 2:
                # Check for sub-rubric in the title (separated by —)
                if '—' in rubric_title or '–' in rubric_title:
                    # Split: "RUBRIC—Sub-rubric" or "RUBRIC—Sub—Sub-sub"
                    parts = re.split(r'[—–]', rubric_title, 1)
                    main_name = parts[0].strip()
                    sub_name = parts[1].strip() if len(parts) > 1 else ''
                    
                    if sub_name:
                        full_title = f'{main_name} — {sub_name}'
                    else:
                        full_title = main_name
                    current_main_rubric = main_name
                else:
                    full_title = rubric_title
                    current_main_rubric = rubric_title
                
                rid = f'boericke-{current_chapter.lower().replace(" ","-")}-{count+1}'
                rubrics.append({
                    'id': rid,
                    'path': current_chapter,
                    'title': full_title,
                    'author': 'Boericke',
                    'remedies': remedies,
                })
                count += 1
            
            i = j
            continue
        
        # Sub-rubric: indented Title Case — remedies
        # e.g., "   Carphologia (picking at bed clothes)—Agar.; Atro.; Bell.;"
        sub_match = re.match(
            r'^([A-Z][a-zA-Z\s,\-\(\)/\&\'\.]+?)[—–]\s*(.*)',
            line
        )
        
        if sub_match and current_main_rubric:
            sub_title = sub_match.group(1).strip()
            remedies_str = sub_match.group(2).strip()
            
            if sub_title.lower() in CHAPTER_SET:
                i += 1; continue
            if len(sub_title) < 2 or len(sub_title) > 100:
                i += 1; continue
            
            full_remedies = remedies_str
            j = i + 1
            while j < len(lines):
                nl = lines[j].strip()
                if (nl and
                    not re.match(r'^[A-Z][A-Z\s,\-]+[—–]', nl) and
                    nl.lower() not in CHAPTER_SET and
                    not re.match(r'^\d+$', nl) and
                    (re.search(r'[A-Z][a-z]?\.', nl) or
                     re.match(r'^[a-z]', nl) or
                     nl.startswith('(') or
                     nl.startswith(';') or
                     len(nl) < 80)):
                    full_remedies += ' ' + nl
                    j += 1
                    if j - i > 8: break
                else:
                    break
            
            remedies = parse_remedies(full_remedies)
            
            if remedies and len(sub_title) > 2:
                full_title = f'{current_main_rubric} — {sub_title}'
                rid = f'boericke-{current_chapter.lower().replace(" ","-")}-{count+1}'
                rubrics.append({
                    'id': rid,
                    'path': current_chapter,
                    'title': full_title,
                    'author': 'Boericke',
                    'remedies': remedies,
                })
                count += 1
            
            i = j
            continue
        
        i += 1
    
    print(f"\nTotal rubrics parsed: {len(rubrics)}")
    
    cc = Counter(r['path'] for r in rubrics)
    print("\nRubrics by chapter:")
    for ch, cnt in cc.most_common():
        print(f"  {ch}: {cnt}")
    
    print("\nSample rubrics:")
    for r in rubrics[:10]:
        print(f"  [{r['path']}] {r['title']}: {', '.join(r['remedies'][:5])}...")
    
    # Save
    output = {
        'source': "Boericke's Materia Medica & Repertory (OCR processed)",
        'author': 'William Boericke',
        'totalRubrics': len(rubrics),
        'chapters': list(cc.keys()),
        'rubrics': rubrics,
    }
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(output, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Saved: {OUTPUT} ({os.path.getsize(OUTPUT):,} bytes)")

if __name__ == '__main__':
    main()
