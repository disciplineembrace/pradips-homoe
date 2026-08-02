#!/usr/bin/env python3
"""Fast universal repertory restructure - O(n) algorithm."""
import json
import re
from collections import defaultdict, Counter
from pathlib import Path

RUBRICS_JSON = Path("/home/z/my-project/data/rubrics.json")

def make_slug(s, maxlen=60):
    s = s.lower().strip()
    s = re.sub(r'[^a-z0-9\s-]', '', s)
    s = re.sub(r'\s+', '-', s)
    s = re.sub(r'-+', '-', s).strip('-')
    return s[:maxlen].rsplit('-', 1)[0] if len(s) > maxlen else s

def determine_grade(rem):
    if not rem: return 3
    if rem[0].isupper(): return 1
    elif '-' in rem: return 3
    else: return 2

with open(RUBRICS_JSON) as f:
    rubrics = json.load(f)
print(f"Loaded {len(rubrics)} rubrics")

# Group by author:chapter:main_rubric
grouped = defaultdict(list)
for r in rubrics:
    author = r.get('author', 'Unknown')
    chapter = r.get('chapter', r.get('path', 'Unknown'))
    title = r.get('title', '')
    level = r.get('level', 0)
    
    # Parse main rubric from title
    parts = re.split(r'\s+[—-]\s+', title, maxsplit=1)
    main = parts[0].strip()
    sub_title = parts[1].strip() if len(parts) > 1 else ''
    
    if not main:
        continue
    
    key = (author, chapter, main)
    grouped[key].append({
        'title': title, 'level': level, 'main': main,
        'sub_title': sub_title, 'remedies': r.get('remedies', []),
        'cross_refs': r.get('cross_references', []),
    })

print(f"Grouped into {len(grouped)} main rubric groups")

# Build new structure
new_rubrics = []
source_prefix_map = {'Kent': 'kent', 'Phatak': 'phatak', 'Murphy': 'murphy', 'Boericke': 'boer'}

for (author, chapter, main), items in grouped.items():
    sp = source_prefix_map.get(author, author.lower().replace(' ', '-'))
    cs = make_slug(chapter)
    ms = make_slug(main)
    main_id = f"{sp}-{cs}-{ms}"
    
    # Main rubric entry
    main_remedies = []
    main_cross_refs = []
    
    for item in items:
        if item['level'] == 0 or not item['sub_title']:
            for rem in item['remedies']:
                rem = rem.strip().rstrip('.')
                if rem:
                    main_remedies.append({'name': rem, 'grade': determine_grade(rem), 'order': len(main_remedies)})
            main_cross_refs.extend(item['cross_refs'])
    
    new_rubrics.append({
        'id': main_id,
        'parentId': None,
        'source': author,
        'chapter': chapter,
        'title': main,
        'fullPath': main,
        'level': 0,
        'remedies': main_remedies,
        'crossReferences': list(set(main_cross_refs)) if main_cross_refs else [],
    })
    
    # Sub-rubrics
    for item in items:
        if item['level'] > 0 or item['sub_title']:
            sub = item['sub_title']
            ss = make_slug(sub)
            sub_id = f"{main_id}-{ss}"
            
            sub_remedies = []
            for rem in item['remedies']:
                rem = rem.strip().rstrip('.')
                if rem:
                    sub_remedies.append({'name': rem, 'grade': determine_grade(rem), 'order': len(sub_remedies)})
            
            new_rubrics.append({
                'id': sub_id,
                'parentId': main_id,
                'source': author,
                'chapter': chapter,
                'title': sub,
                'fullPath': f"{main} - {sub}",
                'level': item['level'] if item['level'] > 0 else 1,
                'remedies': sub_remedies,
                'crossReferences': item['cross_refs'] if item['cross_refs'] else [],
            })

print(f"Generated {len(new_rubrics)} rubric entries")

# Fix duplicate IDs (fast: just append counter)
id_counts = Counter(r['id'] for r in new_rubrics)
seen = {}
for r in new_rubrics:
    if id_counts[r['id']] > 1:
        if r['id'] in seen:
            seen[r['id']] += 1
            r['id'] = f"{r['id']}-{seen[r['id']]}"
        else:
            seen[r['id']] = 0

dups = sum(1 for c in id_counts.values() if c > 1)
print(f"Fixed {dups} duplicate IDs")

# Stats
total_remedies = sum(len(r['remedies']) for r in new_rubrics)
with_remedies = sum(1 for r in new_rubrics if r['remedies'])
with_cross = sum(1 for r in new_rubrics if r['crossReferences'])
print(f"Total remedy relationships: {total_remedies:,}")
print(f"Rubrics with remedies: {with_remedies}")
print(f"Rubrics with cross-references: {with_cross}")

# Save
with open(RUBRICS_JSON, 'w') as f:
    json.dump(new_rubrics, f, indent=2, ensure_ascii=False)
print(f"Saved: {RUBRICS_JSON.stat().st_size / 1024 / 1024:.1f} MB")

# Author counts
for a, c in Counter(r['source'] for r in new_rubrics).most_common():
    print(f"  {a}: {c}")
