#!/usr/bin/env python3
"""
verify-phatak-5pass.py — 5-pass verification for Phatak Materia Medica data

Pass 1: Page-level OCR check (page count, content per page)
Pass 2: Remedy completeness check (sections, content)
Pass 3: Sentence-by-sentence check (length distribution, broken sentences)
Pass 4: Medical terminology check (common terms preserved)
Pass 5: Final source-to-database comparison (totals, integrity)

Outputs:
  tmp/phatak-verification-report.json — detailed report
  tmp/phatak-verification-report.md — human-readable summary
"""

import json
import re
import sys
from pathlib import Path
from collections import Counter, defaultdict

OCR_FILE = Path('tmp/phatak-ocr-raw.txt')
PARSED_FILE = Path('data/phatak-remedies-final.json')
REPORT_JSON = Path('tmp/phatak-verification-report.json')
REPORT_MD = Path('tmp/phatak-verification-report.md')

# Expected section headings (canonical Phatak MM sections)
EXPECTED_SECTIONS = {
    'GENERALITIES', 'WORSE', 'BETTER', 'MIND', 'HEAD', 'EYES', 'EARS',
    'NOSE', 'FACE', 'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM',
    'URINARY', 'MALE', 'FEMALE', 'RESPIRATORY', 'CIRCULATORY',
    'NECK & BACK', 'BACK', 'EXTREMITIES', 'SKIN', 'SLEEP', 'FEVER',
    'PULSE', 'RELATED', 'COMPLEMENTARY', 'INIMICAL', 'ANTIDOTE',
    'COMPARE', 'CAUSATION', 'DOSE', 'SEXUAL', 'LARYNX', 'HEART',
    'BLOOD', 'GLANDS', 'MENSES', 'RESPIRATION', 'STOOL', 'URINE',
    'CHEST', 'NECK', 'TEETH', 'FOLLOW WELL', 'FOLLOWS WELL',
    'INTRO', 'INJURIES', 'INDICATIONS', 'CLINICAL',
}

# Critical medical terms that should be preserved
CRITICAL_TERMS = [
    'AGG.', 'AMEL.', 'GENERALITIES', 'WORSE', 'BETTER', 'MIND',
    'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH', 'THROAT',
    'STOMACH', 'ABDOMEN', 'URINARY', 'MALE', 'FEMALE', 'PREGNANCY',
    'CHILDREN', 'FEVER', 'SKIN', 'SLEEP', 'PULSE', 'RELATED',
    'COMPLEMENTARY', 'ANTIDOTE', 'INIMICAL', 'COMPARE', 'CAUSATION',
    'DOSE', 'NEURALGIA', 'NEURITIS', 'EPISTAXIS', 'LACRIMATION',
    'CATARRH', 'CORYZA', 'DYSENTERY', 'DIARRHEA', 'CONSTIPATION',
    'HEADACHE', 'VERTIGO', 'PALPITATION', 'HYPERTROPHY', 'ATROPHY',
    'ULCER', 'CARBUNCLE', 'GANGRENE', 'CANCER', 'TUMOR', 'CYST',
    'MENSTRUATION', 'AMENORRHEA', 'MENORRHAGIA', 'LEUCORRHEA',
    'PREGNANCY', 'ABORTION', 'LABOR', 'LACTATION',
    'BRONCHITIS', 'PNEUMONIA', 'PLEURISY', 'ASTHMA', 'COUGH',
    'RHEUMATISM', 'GOUT', 'ARTHRITIS', 'OSTEOMYELITIS',
    'HEMORRHAGE', 'ANEMIA', 'LEUKEMIA', 'PURPURA',
    'PARALYSIS', 'EPILEPSY', 'CHOREA', 'CONVULSION', 'TREMOR',
    'DELIRIUM', 'INSANITY', 'MELANCHOLIA', 'HYSTERIA',
]

# Common OCR errors to check for
KNOWN_OCR_ERRORS = [
    (r'\bGENERALITIS\b', 'GENERALITIES'),
    (r'\bEXTREMETIES\b', 'EXTREMITIES'),
    (r'\bMEMprRANES\b', 'MEMBRANES'),
    (r'\bAcrID\b', 'ACRID'),
    (r'\bPErRiopIcALLy\b', 'PERIODICALLY'),
    (r'\bMIpNicHT\b', 'MIDNIGHT'),
    (r'\bVIoLercE\b', 'VIOLENCE'),
    (r'\bJacrimation\b', 'Lacrimation'),
    (r'\bKpistaxis\b', 'Epistaxis'),
    (r'\bneura\'gia\b', 'neuralgia'),
]


def pass1_page_level_check(ocr_text: str, remedies: list) -> dict:
    """Pass 1: Verify page count, content distribution."""
    pages = ocr_text.split('\f')
    total_pages = len(pages)

    # Find which pages contain remedy content
    remedy_pages = set()
    for r in remedies:
        # Find first occurrence of remedy name in OCR
        name_upper = r['name'].upper()
        for i, page in enumerate(pages):
            if name_upper in page.upper():
                # Verify it's the title (look for GENERALITIES nearby)
                idx = page.upper().find(name_upper)
                rest = page[idx + len(name_upper):][:500]
                if 'GENERALITIES' in rest.upper() or 'WORSE' in rest.upper():
                    remedy_pages.add(i)
                    break

    # Calculate content per page
    page_chars = [len(p) for p in pages]
    avg_chars = sum(page_chars) / len(page_chars) if page_chars else 0

    # Check for empty/sparse pages (potential OCR failures)
    sparse_pages = [i+1 for i, c in enumerate(page_chars) if 0 < c < 100]

    # Calculate total OCR text vs total parsed text
    total_ocr_chars = len(ocr_text)
    total_parsed_chars = sum(len(r['full']) for r in remedies)
    coverage_pct = (total_parsed_chars / total_ocr_chars * 100) if total_ocr_chars else 0

    return {
        'pass': 1,
        'name': 'Page-level OCR check',
        'status': 'PASS' if len(sparse_pages) < 20 and coverage_pct > 50 else 'WARN',
        'metrics': {
            'total_pdf_pages': total_pages,
            'pages_with_remedies': len(remedy_pages),
            'avg_chars_per_page': round(avg_chars, 1),
            'sparse_pages_count': len(sparse_pages),
            'sparse_pages_sample': sparse_pages[:10],
            'total_ocr_chars': total_ocr_chars,
            'total_parsed_chars': total_parsed_chars,
            'text_coverage_pct': round(coverage_pct, 1),
        },
        'notes': [
            f'PDF has {total_pages} pages (front matter + 700+ remedy pages)',
            f'OCR captured {total_ocr_chars:,} chars total',
            f'Parser captured {total_parsed_chars:,} chars ({coverage_pct:.1f}% of OCR)',
            f'{len(sparse_pages)} pages with <100 chars (likely blank or TOC fragments)',
        ],
    }


def pass2_remedy_completeness(remedies: list) -> dict:
    """Pass 2: Verify each remedy has expected sections and content."""
    issues = []
    section_counts = Counter()
    remedies_with_issues = []

    for r in remedies:
        sec_titles = [s['title'] for s in r.get('sections', [])]
        for t in sec_titles:
            section_counts[t] += 1

        # Check minimum requirements
        if not r.get('full') or len(r['full']) < 50:
            issues.append(f"{r['name']}: full text too short ({len(r.get('full',''))} chars)")
            remedies_with_issues.append(r['name'])

        # Check for missing key sections
        # (not all remedies have all sections, but should have at least GENERALITIES)
        # Skip this check for very short remedies (< 1000 chars) — some
        # remedies like Alfalfa are intentionally short and don't have a
        # GENERALITIES heading in the source.
        if 'GENERALITIES' not in sec_titles and len(r['full']) > 1000:
            issues.append(f"{r['name']}: missing GENERALITIES section")
            remedies_with_issues.append(r['name'])

        # Check for empty sections
        for s in r.get('sections', []):
            if not s['content'].strip():
                issues.append(f"{r['name']}: section {s['title']} is empty")

    # Stats
    sections_per_remedy = [len(r.get('sections', [])) for r in remedies]
    avg_sections = sum(sections_per_remedy) / len(sections_per_remedy) if sections_per_remedy else 0

    return {
        'pass': 2,
        'name': 'Remedy completeness check',
        'status': 'PASS' if len(remedies_with_issues) < 10 else 'WARN',
        'metrics': {
            'total_remedies': len(remedies),
            'remedies_with_issues': len(remedies_with_issues),
            'avg_sections_per_remedy': round(avg_sections, 1),
            'max_sections': max(sections_per_remedy) if sections_per_remedy else 0,
            'min_sections': min(sections_per_remedy) if sections_per_remedy else 0,
            'section_frequency': dict(section_counts.most_common(20)),
        },
        'issues_sample': issues[:20],
        'remedies_with_issues_sample': remedies_with_issues[:20],
    }


def pass3_sentence_check(remedies: list) -> dict:
    """Pass 3: Check sentence-level integrity."""
    issues = []
    total_sentences = 0
    broken_sentences = 0
    very_short_paragraphs = 0

    for r in remedies:
        full = r.get('full', '')
        # Split into sentences
        sentences = re.split(r'(?<=[.!?])\s+', full)
        sentences = [s.strip() for s in sentences if s.strip()]
        total_sentences += len(sentences)

        for s in sentences:
            # Sentence too short (likely broken)
            if len(s) < 10 and not s.endswith('.'):
                broken_sentences += 1
                if len(issues) < 20:
                    issues.append(f"{r['name']}: very short fragment: {s!r}")

        # Check for very short paragraphs
        paragraphs = [p.strip() for p in full.split('\n\n') if p.strip()]
        for p in paragraphs:
            if len(p) < 20:
                very_short_paragraphs += 1

    broken_pct = (broken_sentences / total_sentences * 100) if total_sentences else 0

    return {
        'pass': 3,
        'name': 'Sentence-by-sentence check',
        'status': 'PASS' if broken_pct < 5 else 'WARN',
        'metrics': {
            'total_sentences': total_sentences,
            'broken_or_short_sentences': broken_sentences,
            'broken_pct': round(broken_pct, 2),
            'very_short_paragraphs': very_short_paragraphs,
        },
        'issues_sample': issues[:20],
    }


def pass4_medical_terminology(remedies: list) -> dict:
    """Pass 4: Verify medical terminology is preserved."""
    # Combine all text
    all_text = ' '.join(r.get('full', '') for r in remedies)
    all_text_upper = all_text.upper()

    # Check critical terms
    terms_found = {}
    terms_missing = []
    for term in CRITICAL_TERMS:
        count = all_text_upper.count(term.upper())
        terms_found[term] = count
        if count == 0:
            terms_missing.append(term)

    # Check for known OCR errors that should have been corrected
    ocr_errors_remaining = []
    for pattern, expected in KNOWN_OCR_ERRORS:
        matches = re.findall(pattern, all_text)
        if matches:
            ocr_errors_remaining.append({
                'pattern': pattern,
                'expected': expected,
                'occurrences': len(matches),
            })

    # Calculate preservation rate
    preserved = sum(1 for t in CRITICAL_TERMS if terms_found[t] > 0)
    preservation_pct = preserved / len(CRITICAL_TERMS) * 100

    return {
        'pass': 4,
        'name': 'Medical terminology check',
        'status': 'PASS' if preservation_pct > 90 and not ocr_errors_remaining else 'WARN',
        'metrics': {
            'critical_terms_total': len(CRITICAL_TERMS),
            'critical_terms_found': preserved,
            'preservation_pct': round(preservation_pct, 1),
            'terms_missing': terms_missing,
            'ocr_errors_remaining': ocr_errors_remaining,
            'top_terms_by_frequency': dict(sorted(terms_found.items(),
                                              key=lambda x: -x[1])[:15]),
        },
    }


def pass5_final_comparison(ocr_text: str, remedies: list) -> dict:
    """Pass 5: Final source-to-database comparison."""
    # Sample some remedies and verify their content exists in source
    import random
    random.seed(42)
    sample_size = min(20, len(remedies))
    sample = random.sample(remedies, sample_size)

    verified = 0
    mismatches = []

    for r in sample:
        # Take a unique snippet from the remedy
        full = r.get('full', '')
        if len(full) < 100:
            continue
        # Use a middle chunk for verification
        snippet = full[100:300].strip()
        # Clean for search (collapse whitespace)
        snippet_clean = re.sub(r'\s+', ' ', snippet)
        # Take first 80 chars of snippet for searching
        search_snippet = snippet_clean[:80]

        # Search in OCR (also cleaned)
        ocr_clean = re.sub(r'\s+', ' ', ocr_text)
        if search_snippet in ocr_clean:
            verified += 1
        else:
            mismatches.append({
                'remedy': r['name'],
                'snippet': search_snippet,
            })

    verification_pct = (verified / sample_size * 100) if sample_size else 0

    # Calculate data integrity
    total_remedies = len(remedies)
    total_chars = sum(len(r.get('full', '')) for r in remedies)
    total_sections = sum(len(r.get('sections', [])) for r in remedies)
    avg_chars = total_chars / total_remedies if total_remedies else 0

    # Check letter coverage
    letters = set(r.get('letter', '') for r in remedies if r.get('letter'))

    return {
        'pass': 5,
        'name': 'Final source-to-database comparison',
        'status': 'PASS' if verification_pct > 90 else 'WARN',
        'metrics': {
            'sample_size': sample_size,
            'verified_against_ocr': verified,
            'verification_pct': round(verification_pct, 1),
            'mismatches': mismatches[:10],
            'total_remedies_in_db': total_remedies,
            'total_chars_in_db': total_chars,
            'total_sections_in_db': total_sections,
            'avg_chars_per_remedy': round(avg_chars, 0),
            'letter_coverage': sorted(letters),
            'missing_letters': sorted(set('ABCDEFGHIJKLMNOPQRSTUVWXYZ') - letters),
        },
    }


def main():
    if not OCR_FILE.exists() or not PARSED_FILE.exists():
        print('ERROR: Required files not found', file=sys.stderr)
        sys.exit(1)

    print(f'Reading OCR: {OCR_FILE}')
    ocr_text = OCR_FILE.read_text(encoding='utf-8', errors='ignore')

    print(f'Reading parsed remedies: {PARSED_FILE}')
    remedies = json.loads(PARSED_FILE.read_text(encoding='utf-8'))
    print(f'  {len(remedies)} remedies')

    print('\n=== PASS 1: Page-level OCR check ===')
    pass1 = pass1_page_level_check(ocr_text, remedies)
    print(f"  Status: {pass1['status']}")
    for k, v in pass1['metrics'].items():
        print(f"  {k}: {v}")

    print('\n=== PASS 2: Remedy completeness check ===')
    pass2 = pass2_remedy_completeness(remedies)
    print(f"  Status: {pass2['status']}")
    print(f"  Remedies with issues: {pass2['metrics']['remedies_with_issues']}")
    print(f"  Avg sections/remedy: {pass2['metrics']['avg_sections_per_remedy']}")
    if pass2['issues_sample']:
        print(f"  Sample issues:")
        for issue in pass2['issues_sample'][:10]:
            print(f"    - {issue}")

    print('\n=== PASS 3: Sentence-by-sentence check ===')
    pass3 = pass3_sentence_check(remedies)
    print(f"  Status: {pass3['status']}")
    for k, v in pass3['metrics'].items():
        print(f"  {k}: {v}")

    print('\n=== PASS 4: Medical terminology check ===')
    pass4 = pass4_medical_terminology(remedies)
    print(f"  Status: {pass4['status']}")
    print(f"  Critical terms preserved: {pass4['metrics']['critical_terms_found']}/{pass4['metrics']['critical_terms_total']}")
    print(f"  Preservation %: {pass4['metrics']['preservation_pct']}%")
    if pass4['metrics']['ocr_errors_remaining']:
        print(f"  OCR errors remaining:")
        for e in pass4['metrics']['ocr_errors_remaining']:
            print(f"    - {e['pattern']} → {e['expected']} ({e['occurrences']} occurrences)")
    if pass4['metrics']['terms_missing']:
        print(f"  Missing terms: {pass4['metrics']['terms_missing']}")

    print('\n=== PASS 5: Final source-to-database comparison ===')
    pass5 = pass5_final_comparison(ocr_text, remedies)
    print(f"  Status: {pass5['status']}")
    print(f"  Sample verified: {pass5['metrics']['verified_against_ocr']}/{pass5['metrics']['sample_size']}")
    print(f"  Verification %: {pass5['metrics']['verification_pct']}%")
    print(f"  Total remedies: {pass5['metrics']['total_remedies_in_db']}")
    print(f"  Total chars: {pass5['metrics']['total_chars_in_db']:,}")
    print(f"  Total sections: {pass5['metrics']['total_sections_in_db']}")
    print(f"  Letter coverage: {len(pass5['metrics']['letter_coverage'])}/26")
    print(f"  Missing letters: {pass5['metrics']['missing_letters']}")

    # Save JSON report
    report = {
        'timestamp': '2026-09-19',
        'source': 'Materia Medica of Homoeopathic Medicines by Dr. S.R. Phatak',
        'passes': [pass1, pass2, pass3, pass4, pass5],
    }
    REPORT_JSON.write_text(json.dumps(report, indent=2, ensure_ascii=False), encoding='utf-8')

    # Save MD report
    md = f"""# Phatak Materia Medica — 5-Pass Verification Report

**Source:** Materia Medica of Homoeopathic Medicines by Dr. S.R. Phatak (792 pages)
**PDF:** upload/phatak-mm-source.pdf
**OCR file:** tmp/phatak-ocr-raw.txt ({len(ocr_text):,} chars)
**Parsed file:** data/phatak-remedies-final.json ({len(remedies)} remedies)

## Pass 1: Page-Level OCR Check — {pass1['status']}
- Total PDF pages: {pass1['metrics']['total_pdf_pages']}
- Pages with remedy content: {pass1['metrics']['pages_with_remedies']}
- Avg chars per page: {pass1['metrics']['avg_chars_per_page']}
- Sparse pages (<100 chars): {pass1['metrics']['sparse_pages_count']}
- Text coverage: {pass1['metrics']['text_coverage_pct']}%

## Pass 2: Remedy Completeness — {pass2['status']}
- Total remedies: {pass2['metrics']['total_remedies']}
- Remedies with issues: {pass2['metrics']['remedies_with_issues']}
- Avg sections per remedy: {pass2['metrics']['avg_sections_per_remedy']}
- Max sections: {pass2['metrics']['max_sections']}
- Min sections: {pass2['metrics']['min_sections']}

## Pass 3: Sentence-Level Check — {pass3['status']}
- Total sentences: {pass3['metrics']['total_sentences']:,}
- Broken/short sentences: {pass3['metrics']['broken_or_short_sentences']}
- Broken %: {pass3['metrics']['broken_pct']}%
- Very short paragraphs: {pass3['metrics']['very_short_paragraphs']}

## Pass 4: Medical Terminology — {pass4['status']}
- Critical terms preserved: {pass4['metrics']['critical_terms_found']}/{pass4['metrics']['critical_terms_total']}
- Preservation %: {pass4['metrics']['preservation_pct']}%

## Pass 5: Final Source-to-Database — {pass5['status']}
- Sample verified: {pass5['metrics']['verified_against_ocr']}/{pass5['metrics']['sample_size']}
- Verification %: {pass5['metrics']['verification_pct']}%
- Total remedies in DB: {pass5['metrics']['total_remedies_in_db']}
- Total chars: {pass5['metrics']['total_chars_in_db']:,}
- Total sections: {pass5['metrics']['total_sections_in_db']}
- Avg chars/remedy: {pass5['metrics']['avg_chars_per_remedy']}
- Letter coverage: {len(pass5['metrics']['letter_coverage'])}/26 (missing: {', '.join(pass5['metrics']['missing_letters']) or 'none'})

## Final Status
{'✅ ALL CHECKS PASSED' if all(p['status'] == 'PASS' for p in [pass1, pass2, pass3, pass4, pass5]) else '⚠️  Some checks have warnings — review report'}
"""
    REPORT_MD.write_text(md, encoding='utf-8')
    print(f'\nReports saved:')
    print(f'  {REPORT_JSON}')
    print(f'  {REPORT_MD}')


if __name__ == '__main__':
    main()
