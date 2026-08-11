# 10-Pass Source Verification Audit Report

**Generated:** 2026-08-12
**Total remedies:** 4104

## Global Summary

- Total authors: 8
- VERIFIED: 0
- PARTIALLY VERIFIED: 0
- NEEDS REVIEW: 8
- Total remedies: 4104

## Per-Author 10-Pass Results

### Boericke

- Production: 855 remedies
- Source: 684 remedies
- Source file: `/home/z/my-project/data/boericke-source-remedies.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | PASS | 0 source remedies missing from production, 171 extra in production |
| 2 | Complete Text Sequence | NEEDS_REVIEW | 2 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | 673 production remedies have detectable subtitles |
| 4 | Missing Paragraphs/Sentences | NEEDS_REVIEW | 3 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 120 OCR artifacts flagged (page nums: 111, ligatures: 0, broken: 9) |
| 6 | Duplicates | PASS | 0 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 0/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | NEEDS_REVIEW | 854/855 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | PASS | 100.0% of source remedies found in production |

### Murphy

- Production: 1384 remedies
- Source: 1308 remedies
- Source file: `/home/z/my-project/data/murphy-source-remedies.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | PASS | 0 source remedies missing from production, 76 extra in production |
| 2 | Complete Text Sequence | NEEDS_REVIEW | 61 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | 1384 production remedies have detectable subtitles |
| 4 | Missing Paragraphs/Sentences | NEEDS_REVIEW | 52 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 115 OCR artifacts flagged (page nums: 0, ligatures: 0, broken: 115) |
| 6 | Duplicates | PASS | 0 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 72/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | PASS | 1384/1384 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | PASS | 100.0% of source remedies found in production |

### Sankaran

- Production: 104 remedies
- Source: 97 remedies
- Source file: `/home/z/my-project/data/sankaran-source-remedies.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | NEEDS_REVIEW | 2 source remedies missing from production, 9 extra in production |
| 2 | Complete Text Sequence | NEEDS_REVIEW | 7 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | No subtitle pattern defined for this author |
| 4 | Missing Paragraphs/Sentences | NEEDS_REVIEW | 8 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 1 OCR artifacts flagged (page nums: 1, ligatures: 0, broken: 0) |
| 6 | Duplicates | PASS | 0 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 0/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | PASS | 104/104 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | PASS | 97.9% of source remedies found in production |

### Allen

- Production: 186 remedies
- Source: 289 remedies
- Source file: `/home/z/my-project/data/allen-source-remedies.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | NEEDS_REVIEW | 102 source remedies missing from production, 3 extra in production |
| 2 | Complete Text Sequence | PASS | 0 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | 166 production remedies have detectable subtitles |
| 4 | Missing Paragraphs/Sentences | PASS | 0 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 3 OCR artifacts flagged (page nums: 1, ligatures: 0, broken: 2) |
| 6 | Duplicates | PASS | 0 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 1/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | PASS | 186/186 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | NEEDS_REVIEW | 64.2% of source remedies found in production |

### Boeger

- Production: 308 remedies
- Source: 470 remedies
- Source file: `/home/z/my-project/data/boeger-source-remedies.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | NEEDS_REVIEW | 155 source remedies missing from production, 174 extra in production |
| 2 | Complete Text Sequence | NEEDS_REVIEW | 4 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | 0 production remedies have detectable subtitles |
| 4 | Missing Paragraphs/Sentences | NEEDS_REVIEW | 4 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 306 OCR artifacts flagged (page nums: 306, ligatures: 0, broken: 0) |
| 6 | Duplicates | PASS | 0 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 59/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | PASS | 308/308 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | NEEDS_REVIEW | 46.4% of source remedies found in production |

### Dubey

- Production: 197 remedies
- Source: 461 remedies
- Source file: `/home/z/my-project/data/dubey-remedies.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | PASS | 0 source remedies missing from production, 0 extra in production |
| 2 | Complete Text Sequence | NEEDS_REVIEW | 6 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | No subtitle pattern defined for this author |
| 4 | Missing Paragraphs/Sentences | NEEDS_REVIEW | 6 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 51 OCR artifacts flagged (page nums: 0, ligatures: 0, broken: 51) |
| 6 | Duplicates | PASS | 0 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 38/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | PASS | 197/197 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | PASS | 100.0% of source remedies found in production |

### Kent

- Production: 184 remedies
- Source: 177 remedies
- Source file: `/home/z/my-project/data/kent-remedies-fresh.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | PASS | 0 source remedies missing from production, 7 extra in production |
| 2 | Complete Text Sequence | PASS | 0 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | No subtitle pattern defined for this author |
| 4 | Missing Paragraphs/Sentences | PASS | 0 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 3 OCR artifacts flagged (page nums: 0, ligatures: 0, broken: 3) |
| 6 | Duplicates | PASS | 0 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 3/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | PASS | 184/184 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | PASS | 100.0% of source remedies found in production |

### Phatak

- Production: 569 remedies
- Source: 543 remedies
- Source file: `/home/z/my-project/data/phatak-remedies-fresh.json`
- **Overall: NEEDS_REVIEW**

| Pass | Name | Status | Detail |
|---|---|---|---|
| 1 | Title & Boundaries | NEEDS_REVIEW | 73 source remedies missing from production, 79 extra in production |
| 2 | Complete Text Sequence | PASS | 0 remedies appear truncated in production (source >1.5x longer) |
| 3 | Headings/Subheadings | PASS | 566 production remedies have detectable subtitles |
| 4 | Missing Paragraphs/Sentences | NEEDS_REVIEW | 1 remedies may have missing paragraphs |
| 5 | OCR Errors | NEEDS_REVIEW | 77 OCR artifacts flagged (page nums: 0, ligatures: 0, broken: 77) |
| 6 | Duplicates | NEEDS_REVIEW | 20 duplicate name+author pairs found |
| 7 | CAPITAL/Italic/Emphasis | PASS | 77/100 sampled remedies have 5+ ALL-CAPS words (potential source emphasis) |
| 8 | Keynote/Characteristic Expressions | PASS | 569/569 remedies have keynote text |
| 9 | UI Rendering | MANUAL | Requires manual visual verification. Remedy titles render RED+BOLD. Subtitles render RED+BOLD per mm-formatter. System highlights (yellow/green/pink) applied via parseInlineMarkers heuristics. |
| 10 | Final Source Comparison | PASS | 86.6% of source remedies found in production |

## Feature Implementation Status

| Feature | Status |
|---|---|
| Remedy title RED+BOLD | ✅ Implemented (mm-remedy-title class) |
| Subtitles RED+BOLD | ✅ Implemented (mm-subtitle class, author-aware detection) |
| System Yellow highlight (keynote) | ✅ Implemented (sentence-level heuristic) |
| System Green highlight (clinical) | ✅ Implemented (parenthetical comparison detection) |
| System Pink highlight (modalities) | ✅ Implemented (worse/better detection) |
| User Yellow highlight | ✅ Implemented (floating toolbar) |
| User Green highlight | ✅ Implemented |
| User Pink highlight | ✅ Implemented |
| Note feature | ✅ Implemented (inline note on highlight) |
| Copy selection | ✅ Implemented |
| Bookmark remedy | ✅ Implemented (delegates to reader features) |
| User highlights persisted | ✅ Implemented (localStorage) |
| System vs User separation | ✅ Implemented (separate storage) |
| Italic preservation | ✅ Implemented (markdown * markers) |
| Bold preservation | ✅ Implemented (markdown ** markers) |
| Underline preservation | ✅ Implemented (markdown _ markers) |
| Page-number flagging | ✅ Implemented ([p. N] markers) |
| Mobile responsive | ✅ Implemented (toolbar auto-positions) |

## Limitations

- System highlights use sentence-level heuristics (not source formatting metadata)
- OCR artifacts are FLAGGED but not auto-corrected (per spec Phase 18)
- Some false positives in source parsing (Allen/Boeger parsers need refinement)
- True source verification requires human review of flagged items
