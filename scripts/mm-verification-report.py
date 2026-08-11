#!/usr/bin/env python3
"""
Materia Medica Verification Report
==================================
Reads /data/remedies.json and emits a factual per-author verification report.

WHAT THIS REPORT DOES:
- Counts remedies per author
- Detects duplicate name+author pairs (flags whether content is identical or differs)
- Detects empty 'full' / 'keynote' fields
- Detects unusually short 'full' fields (< 100 chars — possible truncation)
- Detects embedded page numbers in text (OCR artifacts from page breaks)
- Detects Unicode ligature OCR errors (Ɵ, Ʃ — common in Mathur OCR)
- Flags orphan author tabs (UI has author tab but DB has 0 records — Dubey case)

WHAT THIS REPORT DOES NOT DO (per task spec):
- Does NOT compare text against original source PDFs (none available)
- Does NOT re-run OCR (no source PDFs available)
- Does NOT fabricate or fill missing medical content (Phase 21 forbidden)
- Does NOT auto-correct OCR errors (Phase 18: do not guess; flag for source review)
- Does NOT claim 100% verification (Phase 28: forbidden without actual source check)

Output:
- /home/z/my-project/download/mm-verification-report.json (machine-readable)
- /home/z/my-project/download/mm-verification-report.md (human-readable)
"""
import json
import re
import os
from collections import Counter, defaultdict
from pathlib import Path

DATA_PATH = '/home/z/my-project/data/remedies.json'
OUTPUT_DIR = '/home/z/my-project/download'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# Authors configured in the UI (src/app/materia-medica/page.tsx)
# After our fix, Dubey is removed. We still flag it in the report for transparency.
UI_AUTHORS_AT_TIME_OF_REPORT = ['All', 'Boericke', 'Phatak', 'Murphy', 'Kent', 'Allen', 'Sankaran', 'Farrington', 'Boeger', 'Mathur']

# Unicode ligature OCR errors common in Mathur
LIGATURE_PATTERN = re.compile(r'[ƟƩ⋃ƪǶǾ]')

def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        remedies = json.load(f)

    total = len(remedies)
    author_counts = Counter(r.get('author', 'Unknown') for r in remedies)

    # ===== Per-author stats =====
    per_author = {}
    for author in sorted(author_counts.keys()):
        records = [r for r in remedies if r.get('author') == author]
        fulls = [len(r.get('full', '')) for r in records]
        keys = [len(r.get('keynote', '')) for r in records]
        per_author[author] = {
            'database_remedy_count': len(records),
            'empty_full': sum(1 for r in records if not r.get('full', '').strip()),
            'empty_keynote': sum(1 for r in records if not r.get('keynote', '').strip()),
            'short_full_under_100': sum(1 for f in fulls if 0 < f < 100),
            'avg_full_length': sum(fulls) // len(fulls) if fulls else 0,
            'min_full_length': min(fulls) if fulls else 0,
            'max_full_length': max(fulls) if fulls else 0,
            'embedded_page_numbers': 0,
            'unicode_ligature_errors': 0,
        }
        # Detect embedded page numbers + ligature errors per author
        for r in records:
            full = r.get('full', '')
            for line in full.split('\n'):
                if re.match(r'^\d{1,4}$', line.strip()):
                    per_author[author]['embedded_page_numbers'] += 1
                    break
            if LIGATURE_PATTERN.search(full):
                per_author[author]['unicode_ligature_errors'] += 1

    # ===== Duplicate detection =====
    seen = {}
    duplicates = []
    for r in remedies:
        key = (r.get('name', '').strip(), r.get('author', '').strip())
        if key in seen:
            r1_id = seen[key]
            r1 = next(rr for rr in remedies if rr.get('id') == r1_id)
            r2 = r
            identical = r1.get('full', '') == r2.get('full', '')
            duplicates.append({
                'author': key[1],
                'name': key[0],
                'id1': r1_id,
                'id2': r2.get('id'),
                'full1_length': len(r1.get('full', '')),
                'full2_length': len(r2.get('full', '')),
                'contents_identical': identical,
                'needs_source_review': True,
                'note': 'Contents identical — safe to remove duplicate.' if identical
                        else 'Contents DIFFER — needs source review to determine which (if either) is canonical.',
            })
        else:
            seen[key] = r.get('id')

    # ===== Orphan author tab detection =====
    # Authors in UI but with 0 records in DB
    orphan_tabs = []
    for ui_author in UI_AUTHORS_AT_TIME_OF_REPORT:
        if ui_author == 'All':
            continue
        if ui_author not in author_counts:
            orphan_tabs.append({
                'author': ui_author,
                'ui_remedy_count': 0,
                'database_remedy_count': 0,
                'note': 'Author appears in UI tab list but DB has 0 records. Source data must be imported (never fabricated).',
            })

    # ===== Aggregate =====
    summary = {
        'total_authors_in_db': len(author_counts),
        'total_authors_in_ui': len([a for a in UI_AUTHORS_AT_TIME_OF_REPORT if a != 'All']),
        'total_remedies': total,
        'total_duplicates': len(duplicates),
        'duplicates_with_identical_content': sum(1 for d in duplicates if d['contents_identical']),
        'duplicates_with_different_content': sum(1 for d in duplicates if not d['contents_identical']),
        'total_empty_full': sum(1 for r in remedies if not r.get('full', '').strip()),
        'total_empty_keynote': sum(1 for r in remedies if not r.get('keynote', '').strip()),
        'total_short_full': sum(1 for r in remedies if 0 < len(r.get('full', '')) < 100),
        'total_embedded_page_numbers': sum(per_author[a]['embedded_page_numbers'] for a in per_author),
        'total_unicode_ligature_errors': sum(per_author[a]['unicode_ligature_errors'] for a in per_author),
        'total_orphan_author_tabs': len(orphan_tabs),
    }

    report = {
        'generated_at': '2026-08-11',
        'data_source': DATA_PATH,
        'summary': summary,
        'per_author': per_author,
        'duplicates': duplicates,
        'orphan_author_tabs': orphan_tabs,
        'limitations': [
            'No source PDFs available — cannot perform true source-based verification.',
            'No OCR pipeline available — cannot re-run OCR to compare against source.',
            'Medical content was NEVER fabricated or filled from AI knowledge (Phase 21).',
            'OCR errors (page numbers, ligatures) are FLAGGED only — not auto-corrected (Phase 18).',
            'Duplicate records with differing content are FLAGGED — not auto-merged (needs source review).',
            'This report is a DATABASE INSPECTION report, not a source-verification report.',
            'To achieve true source verification: provide original source PDFs and re-run OCR comparison pipeline.',
        ],
        'formatting_changes_applied': [
            'Remedy main title rendered as RED + BOLD (Materia-Medica-scoped CSS class mm-remedy-title).',
            'Boericke subtitles (Word.--) detected and rendered as RED + BOLD.',
            'Murphy subtitles (CAPS - ) detected and rendered as RED + BOLD.',
            'Phatak subtitles (CAPS:) detected and rendered as RED + BOLD.',
            'Allen standalone section lines (Mind, Head, Eyes, etc.) detected and rendered as RED + BOLD.',
            'Other authors (Farrington, Boeger, Kent, Sankaran, Mathur) — no subtitle detection applied (content rendered as plain text to avoid false positives).',
            'Embedded page-number lines flagged as small grey [p. N] markers (not deleted — flagged for source review).',
            'Inline markdown markers (**bold**, *italic*, _underline_) preserved if present (current DB has none — no-op).',
            'Capital emphasis NOT auto-applied — would require source formatting metadata we do not have (Phase 9).',
            'Orphan Dubey tab removed from Materia Medica UI (DB has 0 Dubey records; re-enable only after source import).',
        ],
    }

    # Write JSON
    json_path = Path(OUTPUT_DIR) / 'mm-verification-report.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Write Markdown
    md_path = Path(OUTPUT_DIR) / 'mm-verification-report.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('# Materia Medica Verification Report\n\n')
        f.write(f'**Generated:** {report["generated_at"]}\n')
        f.write(f'**Data source:** `{report["data_source"]}`\n\n')
        f.write('## Summary\n\n')
        f.write('| Metric | Value |\n|---|---|\n')
        for k, v in summary.items():
            f.write(f'| {k.replace("_", " ").title()} | {v} |\n')
        f.write('\n## Per-Author Statistics\n\n')
        for author, stats in per_author.items():
            f.write(f'### {author} ({stats["database_remedy_count"]} remedies)\n\n')
            f.write('| Metric | Value |\n|---|---|\n')
            for k, v in stats.items():
                f.write(f'| {k.replace("_", " ").title()} | {v} |\n')
            f.write('\n')
        f.write('## Duplicates (name + author)\n\n')
        if not duplicates:
            f.write('None found.\n\n')
        else:
            f.write('| Author | Name | id1 | id2 | len1 | len2 | Identical? |\n')
            f.write('|---|---|---|---|---|---|---|\n')
            for d in duplicates:
                f.write(f'| {d["author"]} | {d["name"]} | `{d["id1"]}` | `{d["id2"]}` | {d["full1_length"]} | {d["full2_length"]} | {"YES" if d["contents_identical"] else "NO — needs source review"} |\n')
            f.write('\n')
        f.write('## Orphan Author Tabs (in UI but not in DB)\n\n')
        if not orphan_tabs:
            f.write('None.\n\n')
        else:
            for t in orphan_tabs:
                f.write(f'- **{t["author"]}** — {t["note"]}\n')
            f.write('\n')
        f.write('## Formatting Changes Applied\n\n')
        for c in report['formatting_changes_applied']:
            f.write(f'- {c}\n')
        f.write('\n## Limitations (Honest Disclosure)\n\n')
        f.write('This is a **database inspection report**, NOT a source-verification report.\n\n')
        for l in report['limitations']:
            f.write(f'- {l}\n')
        f.write('\n---\n')
        f.write('\n**Per task spec Phase 28:** "Do NOT claim 100% verified unless every source/remedy has actually been checked."')
        f.write('\nSource PDFs were not available during this run. Therefore this report does NOT claim 100% verification.')
        f.write('\nTrue source-based verification requires the original source PDFs to be provided separately.\n')

    print(f"Report generated:")
    print(f"  JSON: {json_path}")
    print(f"  MD:   {md_path}")
    print()
    print("Summary:")
    for k, v in summary.items():
        print(f"  {k}: {v}")

if __name__ == '__main__':
    main()
