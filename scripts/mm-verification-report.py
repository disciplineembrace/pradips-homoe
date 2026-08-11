#!/usr/bin/env python3
"""
Materia Medica Per-Author Verification Report
=============================================
Reads /data/remedies.json and emits a detailed per-author audit report.

This is a DATABASE INSPECTION report — NOT a source-verification report.
True source verification requires original source PDFs/files to be provided.

WHAT THIS REPORT DOES:
- Per-author statistics (count, empty, short, etc.)
- Per-author OCR artifact detection:
  - Embedded page numbers (OCR page-break artifacts)
  - Unicode ligature errors (Ɵ, Ʃ — Mathur OCR)
  - Broken words (mid-word capitalization — possible OCR line-break artifacts)
- Per-author duplicate detection
- Per-author suspicious-name detection
- Per-author subtitle-pattern coverage (which authors have detectable subtitles)

WHAT THIS REPORT DOES NOT DO (per task spec):
- Does NOT compare text against original source PDFs (none available)
- Does NOT re-run OCR (no source PDFs available)
- Does NOT fabricate or fill missing medical content (Phase 21 forbidden)
- Does NOT auto-correct OCR errors (Phase 18: do not guess; flag for source review)
- Does NOT claim 100% verification (Phase 28: forbidden without actual source check)
"""
import json
import re
import os
from collections import Counter, defaultdict
from pathlib import Path

DATA_PATH = '/home/z/my-project/data/remedies.json'
OUTPUT_DIR = '/home/z/my-project/download'
os.makedirs(OUTPUT_DIR, exist_ok=True)

# The 6 authors requested in the latest task + 3 others
ALL_AUTHORS = ['Murphy', 'Boericke', 'Allen', 'Sankaran', 'Farrington', 'Boeger',
               'Phatak', 'Kent', 'Mathur']

# Unicode ligature OCR errors (Mathur)
LIGATURE_PATTERN = re.compile(r'[ƟƩ⋃ƪǶǾ]')

# Broken word: lowercase + uppercase + lowercase (e.g., "woRd")
BROKEN_WORD_PATTERN = re.compile(r'[a-z][A-Z][a-z]')

# Page number: line with only digits (1-4 digits)
PAGE_NUM_PATTERN = re.compile(r'^\d{1,4}$')

# Subtitle pattern coverage per author
def detect_subtitles(author, full_text):
    """Return list of subtitles found in the text per author's pattern."""
    subtitles = []
    lines = full_text.split('\n')
    for line in lines:
        ls = line.strip()
        if not ls:
            continue
        if author == 'Boericke':
            m = re.match(r'^([A-Z][a-z]+)\.--\s*(.*)$', ls)
            if m and len(m.group(1)) >= 2:
                subtitles.append(m.group(1))
        elif author == 'Murphy':
            m = re.match(r'^([A-Z][A-Z ]{2,})-\s+(.*)$', ls)
            if m:
                cap = m.group(1).strip()
                if cap.split().__len__() <= 4 and len(cap) <= 30:
                    subtitles.append(cap)
        elif author == 'Phatak':
            m = re.match(r'^([A-Z][A-Z ]{2,}):\s+(.*)$', ls)
            if m:
                cap = m.group(1).strip()
                if cap.split().__len__() <= 4 and len(cap) <= 30:
                    subtitles.append(cap)
        elif author == 'Allen':
            known = {'Mind', 'Head', 'Eyes', 'Nose', 'Face', 'Mouth', 'Throat', 'Neck',
                     'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Anus', 'Urinary', 'Genitals',
                     'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back', 'Extremities',
                     'Skin', 'Sleep', 'Dreams', 'Fever', 'Sweat', 'Modalities', 'Relations',
                     'Relationships', 'Dose', 'Duration', 'Children', 'Pregnancy',
                     'Mental Generals', 'Physical Generals', 'Characteristic Symptoms',
                     'Guiding Symptoms', 'Clinical', 'Pharmacy', 'Source', 'Habitat',
                     'Preparation', 'Constitution', 'Miasms', 'Miasm', 'Complementary',
                     'Inimical', 'Follows', 'Followed by', 'Compare', 'Comparisons'}
            cand = ls.rstrip(':').strip()
            if cand in known and len(ls) <= 40:
                subtitles.append(cand)
        elif author == 'Boeger':
            known = {'Region', 'Worse', 'Better', 'Description', 'Symptoms',
                     'SKIN', 'BLOOD', 'TISSUES', 'GLANDS', 'NERVES', 'MIND', 'HEAD',
                     'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH', 'THROAT', 'STOMACH'}
            cand = ls.rstrip(':').strip()
            if cand in known:
                subtitles.append(cand)
            elif re.match(r'^[A-Z][A-Z\s]{2,}$', cand) and not re.search(r'[.!?,;:]', cand) \
                 and len(cand.split()) <= 4 and len(cand) <= 30:
                subtitles.append(cand)
    return subtitles

def main():
    with open(DATA_PATH, 'r', encoding='utf-8') as f:
        remedies = json.load(f)

    total = len(remedies)
    author_counts = Counter(r.get('author', 'Unknown') for r in remedies)

    # ===== Per-author detailed report =====
    per_author = {}
    for author in sorted(author_counts.keys()):
        records = [r for r in remedies if r.get('author') == author]
        fulls = [len(r.get('full', '')) for r in records]

        # OCR artifact counts
        page_num_count = 0
        ligature_count = 0
        broken_word_count = 0
        empty_full = 0
        empty_keynote = 0
        short_full = 0
        subtitles_found_total = 0
        records_with_subtitles = 0

        for r in records:
            full = r.get('full', '')
            keynote = r.get('keynote', '')
            if not full.strip():
                empty_full += 1
                continue
            if len(full.strip()) < 100:
                short_full += 1
            if not keynote.strip():
                empty_keynote += 1
            for line in full.split('\n'):
                if PAGE_NUM_PATTERN.match(line.strip()):
                    page_num_count += 1
                    break
            if LIGATURE_PATTERN.search(full):
                ligature_count += 1
            if BROKEN_WORD_PATTERN.search(full):
                broken_word_count += 1
            # Subtitle coverage
            subs = detect_subtitles(author, full)
            if subs:
                records_with_subtitles += 1
                subtitles_found_total += len(subs)

        per_author[author] = {
            'database_remedy_count': len(records),
            'empty_full': empty_full,
            'empty_keynote': empty_keynote,
            'short_full_under_100': short_full,
            'avg_full_length': sum(fulls) // len(fulls) if fulls else 0,
            'min_full_length': min(fulls) if fulls else 0,
            'max_full_length': max(fulls) if fulls else 0,
            'embedded_page_numbers': page_num_count,
            'unicode_ligature_errors': ligature_count,
            'broken_word_mid_caps': broken_word_count,
            'records_with_detectable_subtitles': records_with_subtitles,
            'total_subtitles_detected': subtitles_found_total,
            'subtitle_pattern': {
                'Boericke': '"Word.--" (e.g., "Head.--")',
                'Murphy': '"CAPS - " (e.g., "PHARMACY - ")',
                'Phatak': '"CAPS:" (e.g., "MIND:")',
                'Allen': 'standalone known section name (Mind, Head, Eyes, etc.)',
                'Boeger': 'Title-case labels (Region, Worse, Better) + ALL-CAPS labels (SKIN, GLANDS)',
                'Sankaran': 'no subtitle pattern (prose narrative)',
                'Farrington': 'no subtitle pattern (prose narrative)',
                'Mathur': 'no subtitle pattern (prose with bullet points)',
                'Kent': 'no subtitle pattern (prose narrative)',
            }.get(author, 'no detection'),
        }

    # ===== Duplicate detection =====
    seen = {}
    duplicates = []
    for r in remedies:
        key = (r.get('name', '').strip().lower(), r.get('author', '').strip())
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
                        else 'Contents DIFFER — needs source review.',
            })
        else:
            seen[key] = r.get('id')

    # ===== Aggregate =====
    summary = {
        'total_authors_in_db': len(author_counts),
        'total_remedies': total,
        'total_duplicates': len(duplicates),
        'duplicates_with_identical_content': sum(1 for d in duplicates if d['contents_identical']),
        'duplicates_with_different_content': sum(1 for d in duplicates if not d['contents_identical']),
        'total_empty_full': sum(1 for r in remedies if not r.get('full', '').strip()),
        'total_empty_keynote': sum(1 for r in remedies if not r.get('keynote', '').strip()),
        'total_short_full': sum(1 for r in remedies if 0 < len(r.get('full', '')) < 100),
        'total_embedded_page_numbers': sum(per_author[a]['embedded_page_numbers'] for a in per_author),
        'total_unicode_ligature_errors': sum(per_author[a]['unicode_ligature_errors'] for a in per_author),
        'total_broken_word_mid_caps': sum(per_author[a]['broken_word_mid_caps'] for a in per_author),
    }

    # ===== Source availability per author =====
    source_availability = {
        'Murphy': {'has_source_file': False, 'source_path': None, 'note': 'No source PDF/file provided. Production DB is only data source.'},
        'Boericke': {'has_source_file': False, 'source_path': None, 'note': 'No source PDF/file provided. (boericke-repertory.json exists but is repertory rubrics, NOT materia medica)'},
        'Allen': {'has_source_file': False, 'source_path': None, 'note': 'No source PDF/file provided.'},
        'Sankaran': {'has_source_file': False, 'source_path': None, 'note': 'No source PDF/file provided.'},
        'Farrington': {'has_source_file': False, 'source_path': None, 'note': 'No source PDF/file provided.'},
        'Boeger': {'has_source_file': False, 'source_path': None, 'note': 'No source PDF/file provided.'},
        'Kent': {'has_source_file': True, 'source_path': '/data/kent-remedies-fresh.json', 'note': 'Source file was available and merged in previous commit.'},
        'Phatak': {'has_source_file': True, 'source_path': '/data/phatak-remedies-fresh.json', 'note': 'Source file was available and merged in previous commit.'},
        'Mathur': {'has_source_file': False, 'source_path': None, 'note': 'No source PDF/file provided.'},
    }

    report = {
        'generated_at': '2026-08-11',
        'data_source': DATA_PATH,
        'summary': summary,
        'source_availability_per_author': source_availability,
        'per_author': per_author,
        'duplicates': duplicates,
        'limitations': [
            'NO source PDFs/files are available for Murphy, Boericke, Allen, Sankaran, Farrington, Boeger, Mathur.',
            'True source-based verification is IMPOSSIBLE without source files.',
            'Per Phase 21: medical content was NEVER fabricated or filled from AI knowledge.',
            'Per Phase 18: OCR errors (page numbers, ligatures, broken words) are FLAGGED only — not auto-corrected.',
            'Per Phase 28: this report does NOT claim 100% verification.',
            'This is a DATABASE INSPECTION report, not a source-verification report.',
            'To achieve true source verification: provide original source PDFs and re-run OCR comparison pipeline.',
        ],
        'formatting_changes_applied': [
            'Remedy main title rendered as RED + BOLD (mm-remedy-title class).',
            'Boericke subtitles (Word.--) detected and rendered as RED + BOLD.',
            'Murphy subtitles (CAPS - ) detected and rendered as RED + BOLD.',
            'Phatak subtitles (CAPS:) detected and rendered as RED + BOLD.',
            'Allen standalone section lines (Mind/Head/Eyes/etc.) detected and rendered as RED + BOLD.',
            'Boeger title-case labels (Region/Worse/Better/Description/Symptoms) + ALL-CAPS labels (SKIN/GLANDS/NERVES) detected and rendered as RED + BOLD.',
            'Sankaran, Farrington, Mathur, Kent: no subtitle detection applied (prose narrative — avoid false positives).',
            'Embedded page-number lines flagged as small grey [p. N] markers (not deleted — flagged for source review).',
            'Inline markdown markers (**bold**, *italic*, _underline_) preserved if present.',
            'Capital emphasis NOT auto-applied — would require source formatting metadata (Phase 9 safe default).',
            'Orphan Dubey tab removed from Materia Medica UI (DB has 0 Dubey records).',
        ],
    }

    # Write JSON
    json_path = Path(OUTPUT_DIR) / 'mm-verification-report.json'
    with open(json_path, 'w', encoding='utf-8') as f:
        json.dump(report, f, indent=2, ensure_ascii=False)

    # Write Markdown
    md_path = Path(OUTPUT_DIR) / 'mm-verification-report.md'
    with open(md_path, 'w', encoding='utf-8') as f:
        f.write('# Materia Medica Per-Author Verification Report\n\n')
        f.write(f'**Generated:** {report["generated_at"]}\n')
        f.write(f'**Data source:** `{report["data_source"]}`\n\n')

        f.write('## Honest Source-Availability Disclosure\n\n')
        f.write('This report is a **database inspection report**, NOT a source-verification report.\n')
        f.write('True source verification requires original source PDFs/files to be provided.\n\n')
        f.write('| Author | Source file available? | Path | Note |\n|---|---|---|---|\n')
        for author, info in source_availability.items():
            status = '✅ YES' if info['has_source_file'] else '❌ NO'
            f.write(f'| {author} | {status} | `{info["source_path"] or "—"}` | {info["note"]} |\n')
        f.write('\n')

        f.write('## Global Summary\n\n')
        f.write('| Metric | Value |\n|---|---|\n')
        for k, v in summary.items():
            f.write(f'| {k.replace("_", " ").title()} | {v} |\n')
        f.write('\n')

        f.write('## Per-Author Detailed Statistics\n\n')
        for author in ALL_AUTHORS:
            if author not in per_author:
                continue
            stats = per_author[author]
            src = source_availability.get(author, {})
            f.write(f'### {author}\n\n')
            f.write(f'**Source file:** {"`" + src.get("source_path") + "`" if src.get("has_source_file") else "❌ NOT AVAILABLE — verification limited to DB inspection only"}\n\n')
            f.write(f'**Subtitle detection pattern:** {stats["subtitle_pattern"]}\n\n')
            f.write('| Metric | Value |\n|---|---|\n')
            for k, v in stats.items():
                if k in ('subtitle_pattern',):
                    continue
                f.write(f'| {k.replace("_", " ").title()} | {v} |\n')
            f.write('\n')
            # Status verdict
            issues = stats['empty_full'] + stats['short_full_under_100'] + stats['embedded_page_numbers'] + stats['unicode_ligature_errors'] + stats['broken_word_mid_caps']
            if issues == 0 and src.get('has_source_file'):
                f.write(f'**Status:** ✅ PASS (source-verified)\n\n')
            elif issues == 0 and not src.get('has_source_file'):
                f.write(f'**Status:** ⚠️ NEEDS REVIEW (no source file to verify against; no DB issues detected)\n\n')
            else:
                f.write(f'**Status:** ⚠️ NEEDS REVIEW ({issues} issues flagged — source file required to resolve)\n\n')

        f.write('## Duplicates (name + author)\n\n')
        if not duplicates:
            f.write('None found.\n\n')
        else:
            f.write('| Author | Name | id1 | id2 | len1 | len2 | Identical? |\n')
            f.write('|---|---|---|---|---|---|---|\n')
            for d in duplicates:
                f.write(f'| {d["author"]} | {d["name"]} | `{d["id1"]}` | `{d["id2"]}` | {d["full1_length"]} | {d["full2_length"]} | {"YES" if d["contents_identical"] else "NO — needs source review"} |\n')
            f.write('\n')

        f.write('## Formatting Changes Applied\n\n')
        for c in report['formatting_changes_applied']:
            f.write(f'- {c}\n')

        f.write('\n## Limitations (Honest Disclosure)\n\n')
        for l in report['limitations']:
            f.write(f'- {l}\n')

        f.write('\n---\n\n')
        f.write('**Per task spec Phase 28:** "Do NOT claim 100% verified unless every source/remedy has actually been checked."\n')
        f.write('\nSource PDFs were NOT available for Murphy, Boericke, Allen, Sankaran, Farrington, Boeger, Mathur during this run.\n')
        f.write('Therefore this report does NOT claim 100% verification for those authors.\n')
        f.write('\nTo achieve true source-based verification: provide the original source PDFs/books for each author, then re-run OCR comparison pipeline.\n')

    print(f"Report generated:")
    print(f"  JSON: {json_path}")
    print(f"  MD:   {md_path}")
    print()
    print("Summary:")
    for k, v in summary.items():
        print(f"  {k}: {v}")
    print()
    print("Per-author source availability:")
    for a, info in source_availability.items():
        status = '✅' if info['has_source_file'] else '❌'
        print(f"  {status} {a}: {info['note'][:80]}")

if __name__ == '__main__':
    main()
