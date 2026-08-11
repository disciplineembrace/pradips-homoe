# Materia Medica Per-Author Verification Report

**Generated:** 2026-08-11
**Data source:** `/home/z/my-project/data/remedies.json`

## Honest Source-Availability Disclosure

This report is a **database inspection report**, NOT a source-verification report.
True source verification requires original source PDFs/files to be provided.

| Author | Source file available? | Path | Note |
|---|---|---|---|
| Murphy | ❌ NO | `—` | No source PDF/file provided. Production DB is only data source. |
| Boericke | ❌ NO | `—` | No source PDF/file provided. (boericke-repertory.json exists but is repertory rubrics, NOT materia medica) |
| Allen | ❌ NO | `—` | No source PDF/file provided. |
| Sankaran | ❌ NO | `—` | No source PDF/file provided. |
| Farrington | ❌ NO | `—` | No source PDF/file provided. |
| Boeger | ❌ NO | `—` | No source PDF/file provided. |
| Kent | ✅ YES | `/data/kent-remedies-fresh.json` | Source file was available and merged in previous commit. |
| Phatak | ✅ YES | `/data/phatak-remedies-fresh.json` | Source file was available and merged in previous commit. |
| Mathur | ❌ NO | `—` | No source PDF/file provided. |

## Global Summary

| Metric | Value |
|---|---|
| Total Authors In Db | 9 |
| Total Remedies | 3734 |
| Total Duplicates | 20 |
| Duplicates With Identical Content | 0 |
| Duplicates With Different Content | 20 |
| Total Empty Full | 0 |
| Total Empty Keynote | 1 |
| Total Short Full | 6 |
| Total Embedded Page Numbers | 509 |
| Total Unicode Ligature Errors | 180 |
| Total Broken Word Mid Caps | 218 |

## Per-Author Detailed Statistics

### Murphy

**Source file:** ❌ NOT AVAILABLE — verification limited to DB inspection only

**Subtitle detection pattern:** "CAPS - " (e.g., "PHARMACY - ")

| Metric | Value |
|---|---|
| Database Remedy Count | 1383 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 0 |
| Avg Full Length | 5565 |
| Min Full Length | 192 |
| Max Full Length | 41171 |
| Embedded Page Numbers | 0 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 115 |
| Records With Detectable Subtitles | 1383 |
| Total Subtitles Detected | 4395 |

**Status:** ⚠️ NEEDS REVIEW (115 issues flagged — source file required to resolve)

### Boericke

**Source file:** ❌ NOT AVAILABLE — verification limited to DB inspection only

**Subtitle detection pattern:** "Word.--" (e.g., "Head.--")

| Metric | Value |
|---|---|
| Database Remedy Count | 688 |
| Empty Full | 0 |
| Empty Keynote | 1 |
| Short Full Under 100 | 2 |
| Avg Full Length | 1842 |
| Min Full Length | 50 |
| Max Full Length | 10547 |
| Embedded Page Numbers | 111 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 7 |
| Records With Detectable Subtitles | 673 |
| Total Subtitles Detected | 5612 |

**Status:** ⚠️ NEEDS REVIEW (120 issues flagged — source file required to resolve)

### Allen

**Source file:** ❌ NOT AVAILABLE — verification limited to DB inspection only

**Subtitle detection pattern:** standalone known section name (Mind, Head, Eyes, etc.)

| Metric | Value |
|---|---|
| Database Remedy Count | 186 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 0 |
| Avg Full Length | 3438 |
| Min Full Length | 444 |
| Max Full Length | 124484 |
| Embedded Page Numbers | 1 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 2 |
| Records With Detectable Subtitles | 184 |
| Total Subtitles Detected | 1130 |

**Status:** ⚠️ NEEDS REVIEW (3 issues flagged — source file required to resolve)

### Sankaran

**Source file:** ❌ NOT AVAILABLE — verification limited to DB inspection only

**Subtitle detection pattern:** no subtitle pattern (prose narrative)

| Metric | Value |
|---|---|
| Database Remedy Count | 99 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 0 |
| Avg Full Length | 4222 |
| Min Full Length | 420 |
| Max Full Length | 12952 |
| Embedded Page Numbers | 1 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 0 |
| Records With Detectable Subtitles | 0 |
| Total Subtitles Detected | 0 |

**Status:** ⚠️ NEEDS REVIEW (1 issues flagged — source file required to resolve)

### Farrington

**Source file:** ❌ NOT AVAILABLE — verification limited to DB inspection only

**Subtitle detection pattern:** no subtitle pattern (prose narrative)

| Metric | Value |
|---|---|
| Database Remedy Count | 137 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 0 |
| Avg Full Length | 9522 |
| Min Full Length | 104 |
| Max Full Length | 68838 |
| Embedded Page Numbers | 90 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 13 |
| Records With Detectable Subtitles | 0 |
| Total Subtitles Detected | 0 |

**Status:** ⚠️ NEEDS REVIEW (103 issues flagged — source file required to resolve)

### Boeger

**Source file:** ❌ NOT AVAILABLE — verification limited to DB inspection only

**Subtitle detection pattern:** Title-case labels (Region, Worse, Better) + ALL-CAPS labels (SKIN, GLANDS)

| Metric | Value |
|---|---|
| Database Remedy Count | 308 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 0 |
| Avg Full Length | 1412 |
| Min Full Length | 102 |
| Max Full Length | 8517 |
| Embedded Page Numbers | 306 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 0 |
| Records With Detectable Subtitles | 306 |
| Total Subtitles Detected | 1765 |

**Status:** ⚠️ NEEDS REVIEW (306 issues flagged — source file required to resolve)

### Phatak

**Source file:** `/data/phatak-remedies-fresh.json`

**Subtitle detection pattern:** "CAPS:" (e.g., "MIND:")

| Metric | Value |
|---|---|
| Database Remedy Count | 569 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 4 |
| Avg Full Length | 2206 |
| Min Full Length | 54 |
| Max Full Length | 13470 |
| Embedded Page Numbers | 0 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 77 |
| Records With Detectable Subtitles | 566 |
| Total Subtitles Detected | 6216 |

**Status:** ⚠️ NEEDS REVIEW (81 issues flagged — source file required to resolve)

### Kent

**Source file:** `/data/kent-remedies-fresh.json`

**Subtitle detection pattern:** no subtitle pattern (prose narrative)

| Metric | Value |
|---|---|
| Database Remedy Count | 184 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 0 |
| Avg Full Length | 14275 |
| Min Full Length | 372 |
| Max Full Length | 84024 |
| Embedded Page Numbers | 0 |
| Unicode Ligature Errors | 0 |
| Broken Word Mid Caps | 3 |
| Records With Detectable Subtitles | 0 |
| Total Subtitles Detected | 0 |

**Status:** ⚠️ NEEDS REVIEW (3 issues flagged — source file required to resolve)

### Mathur

**Source file:** ❌ NOT AVAILABLE — verification limited to DB inspection only

**Subtitle detection pattern:** no subtitle pattern (prose with bullet points)

| Metric | Value |
|---|---|
| Database Remedy Count | 180 |
| Empty Full | 0 |
| Empty Keynote | 0 |
| Short Full Under 100 | 0 |
| Avg Full Length | 6102 |
| Min Full Length | 2891 |
| Max Full Length | 27487 |
| Embedded Page Numbers | 0 |
| Unicode Ligature Errors | 180 |
| Broken Word Mid Caps | 1 |
| Records With Detectable Subtitles | 0 |
| Total Subtitles Detected | 0 |

**Status:** ⚠️ NEEDS REVIEW (181 issues flagged — source file required to resolve)

## Duplicates (name + author)

| Author | Name | id1 | id2 | len1 | len2 | Identical? |
|---|---|---|---|---|---|---|
| Phatak | agaricus muscarius | `phatak-mm-agaricus-muscarius` | `phatak-mm-agaricus-muscarius-2` | 1708 | 5147 | NO — needs source review |
| Phatak | antimonium tartaricum | `phatak-mm-antimonium-tartaricum` | `phatak-mm-antimonium-tartaricum-2` | 1653 | 4580 | NO — needs source review |
| Phatak | baryta carbonica | `phatak-mm-baryta-carbonica` | `phatak-mm-baryta-carbonica-2` | 1770 | 4487 | NO — needs source review |
| Phatak | bromium | `phatak-mm-bromium` | `phatak-mm-bromium-2` | 1543 | 2330 | NO — needs source review |
| Phatak | cactus grandiflorus | `phatak-mm-cactus-grandiflorus` | `phatak-mm-cactus-grandiflorus-2` | 1573 | 2611 | NO — needs source review |
| Phatak | caladium seguinum | `phatak-mm-caladium-seguinum` | `phatak-mm-caladium-seguinum-2` | 1503 | 1224 | NO — needs source review |
| Phatak | chelidonium | `phatak-mm-chelidonium` | `phatak-mm-chelidonium-2` | 1666 | 3456 | NO — needs source review |
| Phatak | coffea cruda | `phatak-mm-coffea-cruda` | `phatak-mm-coffea-cruda-2` | 1616 | 1408 | NO — needs source review |
| Phatak | cuprum metallicum | `phatak-mm-cuprum-metallicum` | `phatak-mm-cuprum-metallicum-2` | 1802 | 4719 | NO — needs source review |
| Phatak | digitalis | `phatak-mm-digitalis` | `phatak-mm-digitalis-2` | 1621 | 3567 | NO — needs source review |
| Phatak | graphites | `phatak-mm-graphites` | `phatak-mm-graphites-2` | 1834 | 7763 | NO — needs source review |
| Phatak | lilium tigrinum | `phatak-mm-lilium-tigrinum` | `phatak-mm-lilium-tigrinum-2` | 1716 | 3654 | NO — needs source review |
| Phatak | mercurius corrosivus | `phatak-mm-mercurius-corrosivus` | `phatak-mm-mercurius-corrosivus-2` | 1475 | 2577 | NO — needs source review |
| Phatak | natrum muriaticum | `phatak-mm-natrum-muriaticum` | `phatak-mm-natrum-muriaticum-2` | 1753 | 7930 | NO — needs source review |
| Phatak | nitricum acidum | `phatak-mm-nitricum-acidum` | `phatak-mm-nitricum-acidum-2` | 1753 | 6491 | NO — needs source review |
| Phatak | plumbum metallicum | `phatak-mm-plumbum-metallicum` | `phatak-mm-plumbum-metallicum-2` | 1818 | 3735 | NO — needs source review |
| Phatak | radium | `phatak-mm-radium` | `phatak-mm-radium-2` | 1481 | 1808 | NO — needs source review |
| Phatak | tarentula hispania | `phatak-mm-tarentula-hispania` | `phatak-mm-tarentula-hispania-2` | 1686 | 4264 | NO — needs source review |
| Phatak | theridion | `phatak-mm-theridion` | `phatak-mm-theridion-2` | 1625 | 1821 | NO — needs source review |
| Phatak | valeriana | `phatak-mm-valeriana` | `phatak-mm-valeriana-2` | 1626 | 1833 | NO — needs source review |

## Formatting Changes Applied

- Remedy main title rendered as RED + BOLD (mm-remedy-title class).
- Boericke subtitles (Word.--) detected and rendered as RED + BOLD.
- Murphy subtitles (CAPS - ) detected and rendered as RED + BOLD.
- Phatak subtitles (CAPS:) detected and rendered as RED + BOLD.
- Allen standalone section lines (Mind/Head/Eyes/etc.) detected and rendered as RED + BOLD.
- Boeger title-case labels (Region/Worse/Better/Description/Symptoms) + ALL-CAPS labels (SKIN/GLANDS/NERVES) detected and rendered as RED + BOLD.
- Sankaran, Farrington, Mathur, Kent: no subtitle detection applied (prose narrative — avoid false positives).
- Embedded page-number lines flagged as small grey [p. N] markers (not deleted — flagged for source review).
- Inline markdown markers (**bold**, *italic*, _underline_) preserved if present.
- Capital emphasis NOT auto-applied — would require source formatting metadata (Phase 9 safe default).
- Orphan Dubey tab removed from Materia Medica UI (DB has 0 Dubey records).

## Limitations (Honest Disclosure)

- NO source PDFs/files are available for Murphy, Boericke, Allen, Sankaran, Farrington, Boeger, Mathur.
- True source-based verification is IMPOSSIBLE without source files.
- Per Phase 21: medical content was NEVER fabricated or filled from AI knowledge.
- Per Phase 18: OCR errors (page numbers, ligatures, broken words) are FLAGGED only — not auto-corrected.
- Per Phase 28: this report does NOT claim 100% verification.
- This is a DATABASE INSPECTION report, not a source-verification report.
- To achieve true source verification: provide original source PDFs and re-run OCR comparison pipeline.

---

**Per task spec Phase 28:** "Do NOT claim 100% verified unless every source/remedy has actually been checked."

Source PDFs were NOT available for Murphy, Boericke, Allen, Sankaran, Farrington, Boeger, Mathur during this run.
Therefore this report does NOT claim 100% verification for those authors.

To achieve true source-based verification: provide the original source PDFs/books for each author, then re-run OCR comparison pipeline.
