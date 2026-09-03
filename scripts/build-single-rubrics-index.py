#!/usr/bin/env python3
"""
Build Single Rubrics Single Remedy index from existing rubrics.json.

Reads /data/rubrics.json (79,706 rubrics across Kent, Phatak, Murphy, Boericke).
Filters for rubrics where COUNT(DISTINCT remedy) == 1.
Writes derived index to /data/single-rubrics-single-remedy.json.

NEVER modifies source data. This is a READ-ONLY derived index.
"""
import json, os, re
from collections import Counter

DATA_DIR = '/home/z/my-project/data'
SRC = f'{DATA_DIR}/rubrics.json'
OUT = f'{DATA_DIR}/single-rubrics-single-remedy.json'

def main():
    print(f"Loading {SRC}...")
    with open(SRC) as f:
        rubrics = json.load(f)
    print(f"  Loaded {len(rubrics)} rubrics")

    single_rubrics = []
    author_counts = Counter()
    remedy_set = set()
    chapter_set = set()

    for r in rubrics:
        remedies = r.get('remedies', [])
        if not isinstance(remedies, list):
            continue

        # COUNT(DISTINCT remedy) — deduplicate remedy names
        unique_remedies = list(set(remedies))

        if len(unique_remedies) == 1:
            remedy_name = unique_remedies[0]
            author = r.get('author', 'Unknown')
            path = r.get('path', '')
            title = r.get('title', '')
            rubric_id = r.get('id', '')

            # Extract chapter from path (first segment)
            chapter = path.split(' → ')[0] if ' → ' in path else path

            # Build full rubric path
            full_path = f"{path} → {title}" if path != title else path

            record = {
                'id': f"sr_{rubric_id}",
                'rubricId': rubric_id,
                'rubricPath': full_path,
                'rubricTitle': title,
                'chapter': chapter,
                'author': author,
                'remedy': remedy_name,
                'remedyCount': len(remedies),  # total entries (may include duplicates)
                'uniqueRemedyCount': 1,
            }
            single_rubrics.append(record)
            author_counts[author] += 1
            remedy_set.add(remedy_name)
            chapter_set.add(chapter)

    print(f"\n=== RESULTS ===")
    print(f"Total single-remedy rubrics: {len(single_rubrics)}")
    print(f"By author:")
    for a, n in author_counts.most_common():
        print(f"  {a}: {n}")
    print(f"Unique remedies: {len(remedy_set)}")
    print(f"Unique chapters: {len(chapter_set)}")

    # Sort by author, then rubric path
    single_rubrics.sort(key=lambda r: (r['author'], r['rubricPath']))

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(single_rubrics, f, ensure_ascii=False)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

if __name__ == '__main__':
    main()
