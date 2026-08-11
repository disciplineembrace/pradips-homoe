#!/usr/bin/env python3
"""
Materia Medica Source Merge — Kent + Phatak
============================================
Merges /data/kent-remedies-fresh.json and /data/phatak-remedies-fresh.json
into /data/remedies.json using a SAFE, source-aware strategy per Phase 18
("do not blindly rerun OCR and overwrite correct content").

MERGE STRATEGY:
- Kent source is NEWER/MORE COMPLETE than production (50 records are
  significantly longer in source; only 2 are longer in prod). Source wins
  for Kent where source is significantly longer (>1.5x prod length).
- Phatak source is OLDER/LESS COMPLETE than production (179 records are
  significantly longer in prod; only 3 are longer in source). Production
  wins for Phatak where prod is significantly longer.

SAFE RULES:
1. NEVER delete an existing production record. Even "extra" records (in
   prod but not in source) are kept — they may be legitimate remedies
   from a different OCR import that the source file doesn't cover.
2. NEVER overwrite production content with shorter source content. Only
   replace when source is significantly longer (>1.5x), indicating
   production was truncated.
3. SKIP source entries with bad names (containing ;, |, or starting with
   punctuation) — these are OCR parsing artifacts, not real remedies.
4. SKIP source entries with names like "X — Y" (range entries) — these
   are range markers, not individual remedies.
5. Backup the original remedies.json before writing.

WHAT THIS SCRIPT DOES NOT DO (per Phase 21):
- Does NOT fabricate medical content
- Does NOT modify any other author's data (Boericke, Murphy, Allen, etc.)
- Does NOT delete duplicates (the 20 Phatak duplicates with different
  content are kept — needs human source review)
- Does NOT auto-correct OCR errors (only flags them)
"""
import json
import re
import shutil
import os
from datetime import datetime
from collections import Counter

DATA_DIR = '/home/z/my-project/data'
PROD_PATH = f'{DATA_DIR}/remedies.json'
KENT_SRC_PATH = f'{DATA_DIR}/kent-remedies-fresh.json'
PHATAK_SRC_PATH = f'{DATA_DIR}/phatak-remedies-fresh.json'
BACKUP_PATH = f'{DATA_DIR}/remedies.json.bak-{datetime.now().strftime("%Y%m%d-%H%M%S")}'

# Threshold: source must be >1.5x longer than prod to justify replacement
REPLACE_THRESHOLD = 1.5

# Bad-name patterns — OCR parsing artifacts
BAD_NAME_PATTERNS = [
    re.compile(r'^[;|]'),       # starts with ; or |
    re.compile(r'[|]\s*$'),     # ends with |
    re.compile(r';\s*$'),       # ends with ;
    re.compile(r'^Nature Cure', re.IGNORECASE),  # OCR garbage
    re.compile(r'^A\.M\.'),     # abbreviation artifact
    # Range entries: "X — Y" or "X - Y" with single-word extremes
    # These are range markers, not individual remedies
    # But we only skip if BOTH sides look like single remedy names
]

def is_bad_name(name: str) -> bool:
    """Return True if the name is an OCR parsing artifact, not a real remedy."""
    if not name or not name.strip():
        return True
    for p in BAD_NAME_PATTERNS:
        if p.search(name):
            return True
    # Range entry: "Word — Word" or "Word - Word" (single words on each side)
    # These are alphabetical range markers in the source book
    if re.match(r'^[A-Z][a-z]+ (—|-) [A-Z][a-z]+(\s[A-Z][a-z]+)?$', name):
        return True
    return False

def main():
    # ===== 1. BACKUP =====
    print(f"[1/6] Backing up {PROD_PATH} -> {BACKUP_PATH}")
    shutil.copy2(PROD_PATH, BACKUP_PATH)
    print(f"      Backup size: {os.path.getsize(BACKUP_PATH):,} bytes")

    # ===== 2. LOAD =====
    print(f"\n[2/6] Loading data files...")
    with open(PROD_PATH) as f:
        prod = json.load(f)
    with open(KENT_SRC_PATH) as f:
        kent_src = json.load(f)
    with open(PHATAK_SRC_PATH) as f:
        phatak_src = json.load(f)
    print(f"      Production: {len(prod)} remedies")
    print(f"      Kent source: {len(kent_src)} remedies")
    print(f"      Phatak source: {len(phatak_src)} remedies")

    prod_by_id = {r['id']: r for r in prod}
    initial_count = len(prod)

    # ===== 3. MERGE KENT =====
    print(f"\n[3/6] Merging Kent source...")
    kent_stats = {
        'added': 0,
        'replaced_source_longer': 0,
        'kept_prod_longer': 0,
        'kept_prod_similar': 0,
        'skipped_bad_name': 0,
        'skipped_short_content': 0,
    }
    for r in kent_src:
        rid = r['id']
        name = r.get('name', '')
        full = r.get('full', '')

        if is_bad_name(name):
            kent_stats['skipped_bad_name'] += 1
            continue
        if len(full.strip()) < 50:
            kent_stats['skipped_short_content'] += 1
            continue

        if rid in prod_by_id:
            # Record exists in both — decide who wins
            prod_full = prod_by_id[rid].get('full', '')
            src_len = len(full)
            prod_len = len(prod_full)
            if src_len > prod_len * REPLACE_THRESHOLD:
                # Source significantly longer — replace
                # Preserve any prod fields not in source (none expected, but safe)
                merged = {**prod_by_id[rid], **r}
                prod_by_id[rid] = merged
                kent_stats['replaced_source_longer'] += 1
            elif prod_len > src_len * REPLACE_THRESHOLD:
                # Prod significantly longer — keep prod
                kent_stats['kept_prod_longer'] += 1
            else:
                # Similar length — keep prod (don't overwrite without clear reason)
                kent_stats['kept_prod_similar'] += 1
        else:
            # Missing from production — add
            prod_by_id[rid] = r
            kent_stats['added'] += 1

    print(f"      Kent stats: {kent_stats}")

    # ===== 4. MERGE PHATAK =====
    print(f"\n[4/6] Merging Phatak source...")
    phatak_stats = {
        'added': 0,
        'replaced_source_longer': 0,
        'kept_prod_longer': 0,
        'kept_prod_similar': 0,
        'skipped_bad_name': 0,
        'skipped_short_content': 0,
    }
    for r in phatak_src:
        rid = r['id']
        name = r.get('name', '')
        full = r.get('full', '')

        if is_bad_name(name):
            phatak_stats['skipped_bad_name'] += 1
            continue
        if len(full.strip()) < 50:
            phatak_stats['skipped_short_content'] += 1
            continue

        if rid in prod_by_id:
            prod_full = prod_by_id[rid].get('full', '')
            src_len = len(full)
            prod_len = len(prod_full)
            if src_len > prod_len * REPLACE_THRESHOLD:
                merged = {**prod_by_id[rid], **r}
                prod_by_id[rid] = merged
                phatak_stats['replaced_source_longer'] += 1
            elif prod_len > src_len * REPLACE_THRESHOLD:
                phatak_stats['kept_prod_longer'] += 1
            else:
                phatak_stats['kept_prod_similar'] += 1
        else:
            prod_by_id[rid] = r
            phatak_stats['added'] += 1

    print(f"      Phatak stats: {phatak_stats}")

    # ===== 5. WRITE MERGED FILE =====
    print(f"\n[5/6] Writing merged remedies.json...")
    # Preserve original order + append new records at the end
    merged_list = []
    seen_ids = set()
    for r in prod:
        if r['id'] in prod_by_id:
            merged_list.append(prod_by_id[r['id']])
            seen_ids.add(r['id'])
    # Append new records (those in prod_by_id but not in original prod order)
    for rid, r in prod_by_id.items():
        if rid not in seen_ids:
            merged_list.append(r)
            seen_ids.add(rid)

    final_count = len(merged_list)
    print(f"      Initial count: {initial_count}")
    print(f"      Final count:   {final_count}")
    print(f"      Net added:     {final_count - initial_count}")

    with open(PROD_PATH, 'w', encoding='utf-8') as f:
        json.dump(merged_list, f, ensure_ascii=False, indent=2)
    print(f"      Wrote {os.path.getsize(PROD_PATH):,} bytes")

    # ===== 6. VERIFY =====
    print(f"\n[6/6] Verifying merged file...")
    with open(PROD_PATH) as f:
        verify = json.load(f)
    author_counts = Counter(r.get('author', 'Unknown') for r in verify)
    print(f"      Total records: {len(verify)}")
    print(f"      Author distribution:")
    for a, n in author_counts.most_common():
        print(f"        {a}: {n}")

    # ===== REPORT =====
    report = {
        'backup_path': BACKUP_PATH,
        'initial_count': initial_count,
        'final_count': final_count,
        'net_added': final_count - initial_count,
        'kent_stats': kent_stats,
        'phatak_stats': phatak_stats,
        'author_distribution_after': dict(author_counts),
    }
    report_path = f'{DATA_DIR}/mm-merge-report.json'
    with open(report_path, 'w') as f:
        json.dump(report, f, indent=2)
    print(f"\n      Report: {report_path}")
    print(f"\n✓ Merge complete. Backup at: {BACKUP_PATH}")

if __name__ == '__main__':
    main()
