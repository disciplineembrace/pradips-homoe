#!/usr/bin/env python3
"""
Build Single Rubrics Single Remedy index with COMPLETE HIERARCHY.

Sources:
1. data/rubrics.json — Kent, Phatak, Murphy, Boericke (path + title structure)
2. data/synthesis/ — Synthesis repertory (tree + remedies chunks)
3. data/boericke-repertory.json — Boericke repertory (chapters + rubrics)

For each source, builds complete hierarchy:
  Repertory → Chapter → Main Rubric → Sub Rubric(s) → Single Remedy

Only includes rubrics where COUNT(DISTINCT remedy) == 1.
NEVER modifies source data — read-only derived index.
"""
import json, os, re
from collections import Counter

DATA_DIR = '/home/z/my-project/data'
OUT = f'{DATA_DIR}/single-rubrics-single-remedy.json'

def build_kent_phatak_murphy():
    """Build from rubrics.json — Kent, Phatak, Murphy, Boericke.
    Structure: path='MIND', title='AVERSION, approached to being — everything, to'
    Hierarchy: chapter (from path) → main_rubric (title before —) → sub_rubric (title after —)
    """
    with open(f'{DATA_DIR}/rubrics.json') as f:
        rubrics = json.load(f)

    results = []
    for r in rubrics:
        remedies = r.get('remedies', [])
        if not isinstance(remedies, list) or len(set(remedies)) != 1:
            continue

        author = r.get('author', 'Unknown')
        path = r.get('path', '')
        title = r.get('title', '')
        rubric_id = r.get('id', '')

        # Determine chapter (path is usually the chapter)
        chapter = path

        # Parse title for hierarchy using — separator
        if '—' in title:
            parts = [p.strip() for p in title.split('—')]
            main_rubric = parts[0]
            sub_rubrics = parts[1:]
        else:
            # No sub-rubric separator — title is the main rubric
            main_rubric = title
            sub_rubrics = []

        # Build full path: Chapter → Main Rubric → Sub Rubric(s)
        full_path_parts = [chapter, main_rubric] + sub_rubrics
        full_path = ' → '.join(full_path_parts)

        # Map author to full repertory name
        repertory_name = {
            'Kent': 'Kent Repertory',
            'Phatak': 'Phatak Repertory',
            'Murphy': 'Murphy Repertory',
            'Boericke': 'William Boericke Repertory',
        }.get(author, author)

        results.append({
            'id': f"sr_{rubric_id}",
            'rubricId': rubric_id,
            'repertory': repertory_name,
            'author': author,
            'chapter': chapter,
            'mainRubric': main_rubric,
            'subRubrics': sub_rubrics,
            'singleRemedy': remedies[0],
            'remedyCount': len(remedies),
            'uniqueRemedyCount': 1,
            'fullPath': full_path,
            'fullPathParts': full_path_parts,
            'rubricPath': full_path,  # for backward compat with search
            'rubricTitle': title,
        })

    return results

def build_synthesis():
    """Build from Synthesis tree + remedies chunks.
    Tree: [node_id, parent_id, name, level, root_id, full_path_string]
    Remedies chunks: {node_id: [[remedy_abbrev, grade], ...]}
    """
    with open(f'{DATA_DIR}/synthesis/tree.json') as f:
        tree = json.load(f)

    # Load all remedy chunks
    all_remedies = {}
    for i in range(8):
        chunk_path = f'{DATA_DIR}/synthesis/remedies_chunk_{i:03d}.json'
        if os.path.exists(chunk_path):
            with open(chunk_path) as f:
                chunk = json.load(f)
            all_remedies.update(chunk)

    # Build node lookup: node_id → node info
    nodes = {}
    for node in tree:
        if len(node) >= 6:
            node_id = node[0]
            parent_id = node[1]
            name = node[2]
            level = node[3]
            root_id = node[4]
            full_path_str = node[5]
            nodes[node_id] = {
                'id': node_id,
                'parent_id': parent_id,
                'name': name,
                'level': level,
                'root_id': root_id,
                'full_path_str': full_path_str,
            }

    # Load chapter names — chapters have {id: int, name: str, path: str}
    with open(f'{DATA_DIR}/synthesis/chapters.json') as f:
        chapters = json.load(f)
    chapter_names = {}
    if isinstance(chapters, list):
        for ch in chapters:
            if isinstance(ch, dict):
                chapter_names[ch.get('id')] = ch.get('name', 'Unknown')
            elif isinstance(ch, str):
                chapter_names[ch] = ch

    results = []
    for node_id, node in nodes.items():
        remedies_data = all_remedies.get(str(node_id), [])
        if not remedies_data:
            continue

        # Get unique remedy names
        remedy_names = list(set(r[0] if isinstance(r, list) else r for r in remedies_data))
        if len(remedy_names) != 1:
            continue

        # Reconstruct hierarchy by walking parents
        hierarchy = []
        current = node
        while current and current['parent_id'] != 0:
            hierarchy.insert(0, current['name'])
            parent = nodes.get(current['parent_id'])
            if not parent:
                break
            current = parent

        # The root node is the chapter
        root_node = nodes.get(node['root_id'])
        chapter_name = root_node['name'] if root_node else 'Unknown'

        # Map chapter to full repertory name
        repertory_name = 'Synthesis Repertory'

        # Build full path
        full_path_parts = [chapter_name] + hierarchy
        full_path = ' → '.join(full_path_parts)

        # Main rubric is the first element after chapter
        main_rubric = hierarchy[0] if hierarchy else chapter_name
        sub_rubrics = hierarchy[1:] if len(hierarchy) > 1 else []

        # Get grade if available
        grade = None
        if remedies_data and isinstance(remedies_data[0], list) and len(remedies_data[0]) > 1:
            grade = remedies_data[0][1]

        results.append({
            'id': f"sr_syn_{node_id}",
            'rubricId': f"syn-{node_id}",
            'repertory': repertory_name,
            'author': 'Synthesis',
            'chapter': chapter_name,
            'mainRubric': main_rubric,
            'subRubrics': sub_rubrics,
            'singleRemedy': remedy_names[0],
            'remedyCount': len(remedies_data),
            'uniqueRemedyCount': 1,
            'grade': grade,
            'fullPath': full_path,
            'fullPathParts': full_path_parts,
            'rubricPath': full_path,
            'rubricTitle': ' → '.join(hierarchy) if hierarchy else chapter_name,
        })

    return results

def build_boericke_repertory():
    """Build from boericke-repertory.json.
    Structure: {chapters: [...], rubrics: [{id, path, title, author, remedies}]}
    """
    with open(f'{DATA_DIR}/boericke-repertory.json') as f:
        data = json.load(f)

    rubrics = data.get('rubrics', [])
    chapters = data.get('chapters', [])

    results = []
    for r in rubrics:
        remedies = r.get('remedies', [])
        if not isinstance(remedies, list) or len(set(remedies)) != 1:
            continue

        path = r.get('path', '')
        title = r.get('title', '')
        rubric_id = r.get('id', '')

        chapter = path
        if '—' in title:
            parts = [p.strip() for p in title.split('—')]
            main_rubric = parts[0]
            sub_rubrics = parts[1:]
        else:
            main_rubric = title
            sub_rubrics = []

        full_path_parts = [chapter, main_rubric] + sub_rubrics
        full_path = ' → '.join(full_path_parts)

        results.append({
            'id': f"sr_br_{rubric_id}",
            'rubricId': rubric_id,
            'repertory': 'William Boericke Repertory',
            'author': 'Boericke',
            'chapter': chapter,
            'mainRubric': main_rubric,
            'subRubrics': sub_rubrics,
            'singleRemedy': remedies[0],
            'remedyCount': len(remedies),
            'uniqueRemedyCount': 1,
            'fullPath': full_path,
            'fullPathParts': full_path_parts,
            'rubricPath': full_path,
            'rubricTitle': title,
        })

    return results

def main():
    print("=== Building Single Rubrics Single Remedy index with complete hierarchy ===\n")

    print("1. Kent/Phatak/Murphy from rubrics.json...")
    kpm = build_kent_phatak_murphy()
    print(f"   {len(kpm)} qualifying rubrics")

    print("2. Synthesis from tree + remedies chunks...")
    syn = build_synthesis()
    print(f"   {len(syn)} qualifying rubrics")

    print("3. Boericke repertory from boericke-repertory.json...")
    boericke_rep = build_boericke_repertory()
    print(f"   {len(boericke_rep)} qualifying rubrics")

    all_results = kpm + syn + boericke_rep
    print(f"\n=== TOTAL: {len(all_results)} single-remedy rubrics ===")

    # Stats
    author_counts = Counter(r['author'] for r in all_results)
    print("\nBy repertory:")
    for a, n in author_counts.most_common():
        print(f"  {a}: {n}")

    remedy_set = set(r['singleRemedy'] for r in all_results)
    chapter_set = set(r['chapter'] for r in all_results)
    print(f"\nUnique remedies: {len(remedy_set)}")
    print(f"Unique chapters: {len(chapter_set)}")

    # Sort by repertory, then full path
    all_results.sort(key=lambda r: (r['repertory'], r['fullPath']))

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(all_results, f, ensure_ascii=False)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

    # Show samples
    print("\n=== SAMPLE RECORDS ===")
    for r in all_results[:3]:
        print(f"\n  Repertory: {r['repertory']}")
        print(f"  Chapter: {r['chapter']}")
        print(f"  Main Rubric: {r['mainRubric']}")
        print(f"  Sub Rubrics: {r['subRubrics']}")
        print(f"  Single Remedy: {r['singleRemedy']}")
        print(f"  Full Path: {r['fullPath']}")

if __name__ == '__main__':
    main()
