#!/usr/bin/env python3
"""
Rebuild data/synthesis/cross_references.json from the source SQLite DB.

ROOT CAUSE OF BUG:
  The existing cross_references.json was built with REVERSED lookup logic.
  It used `WHERE symptom_id = X` (reverse: rubrics that point TO X)
  instead of `WHERE id = X` (forward: rubrics that X points TO).
  
  This caused every rubric to show ITS OWN text as its cross-reference,
  because the `text` field in a reverse-lookup row describes the
  DESTINATION (which is X itself).

FIX:
  - Use FORWARD lookup: WHERE id = X AND symptom_id != X (exclude self-refs)
  - Include the destination rubric ID (symptom_id) so the UI can navigate
  - Include destination path, level, chapter_id from syntree
  - Include destination remedy count from symptom_remedies
  - Filter out orphan destinations (destination not in syntree)
  - Deduplicate by symptom_id
"""
import sqlite3
import json
import os
import sys

SRC_DB = "/home/z/my-project/work/synthesis_202.db"
DEST_JSON = "/home/z/my-project/data/synthesis/cross_references.json"

print("=" * 70)
print("REBUILDING cross_references.json (ROOT CAUSE FIX)")
print("=" * 70)

conn = sqlite3.connect(SRC_DB)
conn.row_factory = sqlite3.Row
cur = conn.cursor()

# Build the corrected cross_references map
# Key: source rubric ID (string)
# Value: list of {id, text, kind, dest_path, dest_level, dest_chapter_id, dest_remedies_count}
result = {}

cur.execute("""
    SELECT
        xr.id           AS src_id,
        xr.symptom_id   AS dest_id,
        xr.text         AS text,
        xr.kind         AS kind,
        dest.path       AS dest_path,
        dest.level      AS dest_level,
        dest.chapter_id AS dest_chapter_id,
        (SELECT COUNT(*) FROM symptom_remedies sr WHERE sr.symptom_id = xr.symptom_id) AS dest_remedies_count
    FROM cross_references xr
    JOIN syntree dest ON dest.id = xr.symptom_id
    WHERE xr.id > 0
      AND xr.symptom_id > 0
      AND xr.symptom_id != xr.id
    ORDER BY xr.id, dest.path
""")

rows = cur.fetchall()
print(f"Total valid cross-reference rows: {len(rows):,}")

seen = set()  # for deduplication
for r in rows:
    src_key = str(r['src_id'])
    dest_id = r['dest_id']
    
    # Skip duplicates (same src → same dest)
    pair = (r['src_id'], dest_id)
    if pair in seen:
        continue
    seen.add(pair)
    
    if src_key not in result:
        result[src_key] = []
    
    result[src_key].append({
        'id': dest_id,                          # destination rubric ID (for click navigation)
        'text': r['dest_path'] or r['text'],    # destination path (correct, not the source!)
        'kind': r['kind'],
        'dest_path': r['dest_path'],
        'dest_level': r['dest_level'],
        'dest_chapter_id': r['dest_chapter_id'],
        'dest_remedies_count': r['dest_remedies_count'],
    })

conn.close()

# Write the corrected JSON
print(f"\nRubrics with cross-references: {len(result):,}")
total_xrefs = sum(len(v) for v in result.values())
print(f"Total cross-references: {total_xrefs:,}")

# Backup the old file
if os.path.exists(DEST_JSON):
    backup = DEST_JSON + '.bak'
    if not os.path.exists(backup):
        os.rename(DEST_JSON, backup)
        print(f"\nBacked up old file to {backup}")
    else:
        os.remove(DEST_JSON)
        print(f"\nRemoved old file (backup already exists)")

with open(DEST_JSON, 'w') as f:
    json.dump(result, f, separators=(',', ':'))

file_size = os.path.getsize(DEST_JSON)
print(f"\nWrote {DEST_JSON}")
print(f"  Size: {file_size:,} bytes ({file_size/1024/1024:.1f} MB)")

# Verify: check MIND - ABANDONED (id=13401767)
print(f"\n{'=' * 70}")
print("VERIFICATION — MIND - ABANDONED (id=13401767)")
print(f"{'=' * 70}")
abandoned = result.get('13401767', [])
print(f"Cross-references: {len(abandoned)}")
for cr in abandoned:
    print(f"  → id={cr['id']}  text=\"{cr['text']}\"  level={cr['dest_level']}  remedies={cr['dest_remedies_count']}")

# Verify: check MIND - HAUGHTY (id=13412961) — should have 77 real xrefs
print(f"\n{'=' * 70}")
print("VERIFICATION — MIND - HAUGHTY (id=13412961)")
print(f"{'=' * 70}")
haughty = result.get('13412961', [])
print(f"Cross-references: {len(haughty)}")
for cr in haughty[:5]:
    print(f"  → id={cr['id']}  text=\"{cr['text']}\"  level={cr['dest_level']}  remedies={cr['dest_remedies_count']}")
if len(haughty) > 5:
    print(f"  ... and {len(haughty) - 5} more")

print(f"\n{'=' * 70}")
print("DONE — cross_references.json rebuilt with CORRECT forward-lookup logic")
print(f"{'=' * 70}")
