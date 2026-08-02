# Synthesis Repertory → Structured Data (Website) — Complete Extraction Prompt & Pipeline

Tamara `Synthesis_Repertory.pdf` (355 pages, scanned/image-based inside a Word-exported PDF) ma thi **badhi rubric, sub-rubric, ane remedies** (with grade) — koi pan data loss, missing word, ke missing rubric vagar — extract karva mate ni complete system niche aapi chhe.

Aa ek **page-by-page AI-vision prompt** che (Claude/GPT-4V jevo koi vision model vaparva mate), sathe safar (pipeline) commands je tamne actually run karva pade.

---

## 1. Overall Strategy

Because the PDF pages are scanned images (not real text), plain OCR (Tesseract) will make mistakes with the repertory's typographic grading system (bold / italic / plain text = remedy grade 3/2/1). So the recommended approach is:

1. Render every page to a high-resolution image (300 DPI).
2. Feed each page image to a vision-capable LLM with the prompt below — one page at a time (or 2-3 pages at a time max), so nothing gets truncated or skipped.
3. Get back **strict JSON** per page.
4. Merge all page JSON files into one master dataset.
5. Run the validation checklist (Section 4) to catch any loss before it goes on your website.

---

## 2. THE PROMPT (use this exactly, per page image)

```
You are an expert data-entry assistant specializing in the Synthesis Repertory
of homeopathy. You will be shown ONE scanned page image from the book.

Your job: transcribe EVERY rubric, sub-rubric, sub-sub-rubric, and remedy on
this page into strict JSON. Zero data loss is mandatory — every word, every
remedy abbreviation, every grade mark, and every cross-reference must appear
in the output.

RULES:
1. Preserve the FULL hierarchy path for every rubric using indentation levels
   visible on the page. Example path: ["MIND", "ANXIETY", "evening", "in bed"].
2. For every remedy listed under a rubric, capture:
   - "name": the remedy abbreviation exactly as printed (do not expand or
     "correct" it — copy exactly, e.g. "ars.", "Nat-m.", "PULS.")
   - "grade": 3 if BOLD CAPITALS (or bold), 2 if italic, 1 if plain/regular
     text. Base this purely on the typographic style you see, not guesswork.
3. Keep remedies in the exact left-to-right / comma order they appear.
4. If a rubric continues from a previous page or continues onto the next
   page, still transcribe what's visible on THIS page and set
   "continues_from_previous": true / "continues_to_next": true accordingly.
5. Capture any cross-references exactly as written (e.g. "see also ANGER").
6. Capture the printed page number if visible.
7. If any word or remedy is unclear/illegible, do NOT guess or silently
   drop it — output it inside "uncertain": ["..."] with your best reading
   marked with a "?" so a human can review it. NEVER omit an unclear item.
8. Do not summarize, merge, or skip anything — this is a literal transcription
   task, not a paraphrase.
9. Output ONLY valid JSON. No commentary, no markdown fences, no preamble.

OUTPUT SCHEMA (repeat "rubrics" array for every rubric found on the page):
{
  "page_number": <int or null>,
  "chapter": "<chapter/section name, e.g. MIND, HEAD, EXTREMITIES>",
  "rubrics": [
    {
      "path": ["<top rubric>", "<sub-rubric>", "<sub-sub-rubric>", ...],
      "continues_from_previous": false,
      "continues_to_next": false,
      "remedies": [
        {"name": "<abbrev exactly as printed>", "grade": 1|2|3}
      ],
      "cross_references": ["<text exactly as printed>"],
      "uncertain": ["<illegible item>?"]
    }
  ]
}
```

---

## 3. Pipeline Commands (to render pages + run the prompt in bulk)

```bash
# 1. Render every page to a 300 DPI image (do this in batches of ~50 pages
#    so you don't run out of disk/RAM on a 355-page book)
pdftoppm -f 1   -l 50  -r 300 -jpeg Synthesis_Repertory.pdf pages/page
pdftoppm -f 51  -l 100 -r 300 -jpeg Synthesis_Repertory.pdf pages/page
# ...continue in batches of 50 until page 355

# 2. For each page image, send it + the PROMPT above to your vision model
#    (Claude API example — repeat per image, save output as page-XXX.json)
#    Model: claude-sonnet-4-6 (or latest vision-capable model)
#    Attach the image as base64, plus the prompt text, temperature = 0

# 3. Merge all page-XXX.json files into one array, in page order:
jq -s '.' pages_json/page-*.json > synthesis_repertory_full.json

# 4. Stitch rubrics that "continues_to_next" == true with the next page's
#    matching "continues_from_previous" == true rubric with the SAME path,
#    concatenating their remedies arrays in order.
```

---

## 4. Zero-Data-Loss Validation Checklist (run before publishing to website)

- [ ] Page count check: number of page JSON files == 355 (no page skipped)
- [ ] Every page JSON has at least one rubric OR is confirmed blank/index page
- [ ] No `"uncertain"` arrays left non-empty without human review
- [ ] Spot-check 10 random pages against the original scan side-by-side
- [ ] Rubric hierarchy paths are consistent chapter-to-chapter (no orphaned sub-rubrics without a parent)
- [ ] Remedy grade counts roughly match known repertory statistics for that chapter (sanity check only, not exact)
- [ ] Run a duplicate-detection pass — merged "continues_to_next" rubrics should not be double-counted

---

## 5. Suggested Website Data Model (JSON → DB)

```
Rubric {
  id, chapter, path (array/string), page_number
}
RubricRemedy {
  rubric_id, remedy_name, grade (1-3), source_page
}
CrossReference {
  rubric_id, reference_text
}
```

This lets your website support: search by symptom (rubric), filter by remedy, filter by grade (bold/italic/plain), and "jump to page" for verification.

---

**Nondh (Note):** Aa entire 355-page book ne AI thi extract karvu (vision model dwara, page-by-page) e sauthi accurate rasto chhe kem ke plain OCR (Tesseract) bold/italic grade distinguish nathi kari sakto — je Synthesis Repertory ma remedy ni potency dashave chhe. Jo tame ichho to hu ek batch (dakhla tarike pehla 20-30 pages) process kari ne sample JSON output pan bataavi shaku, taaki tame quality check kari shako aa entire book par lagavta pehla.
