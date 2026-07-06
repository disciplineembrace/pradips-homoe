#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parses Phatak's Materia Medica PDF into per-remedy JSON entries.

Format observed:
- Each remedy has its name in ALL CAPS at the top of a page (and possibly repeated
  on continuation pages as a running header).
- Sections are ALL CAPS followed by `:` (e.g., GENERALITIES:, RESPIRATORY:, MALE:,
  FEMALE:, MIND:, HEAD:, THROAT:, etc.)
- The body of each section is descriptive prose.
- Page numbers (1, 2, 3, ...) and running headers like "ACONITE — ACONITE" or
  "ABSINTHIUM — ACETIC ACID" appear in the text and need to be filtered out.
- Some headings span multiple lines (e.g., "ACTEA" / "SPICATA" on separate lines
  for "ACTAEA SPICATA"). We need to merge such multi-line headings.

Output: a JSON array of entries:
{
  "id": "phatak-mm-abies-canadensis",
  "name": "Abies Canadensis",
  "common": "",
  "author": "Phatak",
  "letter": "A",
  "chapter": "Generalities",
  "organ": "...",
  "modalities": "WORSE: ... BETTER: ...",
  "constitution": "GENERALITIES: ...",
  "relationships": "Antidotes: ...",
  "keynote": "First 280 chars",
  "full": "GENERALITIES: ... RESPIRATORY: ..."
}
"""
import fitz, re, json
from pathlib import Path

PDF = Path("/home/z/my-project/upload/Materia Medica of Homoeopathic Medicines - S.R. Phatak.pdf")
OUT_JSON = Path("/home/z/my-project/scripts/phatak_mm_remedies.json")

# Known section names (Phatak uses these)
SECTIONS = [
    'GENERALITIES', 'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH',
    'TEETH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'STOOL', 'URINE',
    'URINARY', 'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART', 'NECK',
    'NECK & BACK', 'BACK', 'EXTREMITIES', 'SLEEP', 'SKIN', 'FEVER',
    'WORSE', 'BETTER', 'RELATIONSHIPS', 'DOSE', 'COMPLEMENTARY',
    'INIMICAL', 'ANTIDOTES', 'COMPARE', 'CAUSATION', 'CAUSATIONS',
    'LARYNX', 'LIVER', 'SPLEEN', 'KIDNEYS', 'BLADDER', 'PROSTATE',
    'GENERALS', 'VOICE', 'COUGH', 'EXPECTORATION', 'BLOOD',
    'TEMPERATURE', 'PULSE', 'SWEAT', 'TONGUE', 'SALIVA',
    'GENITO-URINARY', 'GENITALS',
]
# Build a regex that matches a section name followed by `:`
SECTION_RE = re.compile(r'\b(' + '|'.join(SECTIONS) + r'):\s*')

# Common false-positive "headings" (page headers, footers, etc.)
NON_HEADING_LINES = {
    'INDEX', 'CONTENTS', 'PREFACE', 'CHAPTER', 'PART', 'APPENDIX',
    'HINTS FOR THE BEGINNERS', 'PREFACE TO THE SECOND EDITION',
    'PREFACE TO THE THIRD EDITION', 'PREFACE TO THE FOURTH EDITION',
    'MATERIA MEDICA', 'OF', 'HOMOEOPATHIC MEDICINES',
}

# Single-letter or short ALL-CAPS lines that aren't remedies
NON_REMEDY_SHORT = {
    'A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M',
    'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'V', 'W', 'X', 'Y', 'Z',
    'I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII', 'IX', 'X',
    'XI', 'XII', 'XIII', 'XIV', 'XV', 'XVI', 'XVII', 'XVIII', 'XIX', 'XX',
}

# =====================================================================
# Step 1: Extract all text
# =====================================================================
def extract_text():
    """Extract text from all pages, but skip the front-matter pages (1-36)
    which are cover, title, preface, contents, and index pages.
    Real remedy entries start on page 37 (ABIES CANADENSIS).
    """
    doc = fitz.open(str(PDF))
    full = []
    # Skip pages 1-36 (0-indexed: 0-35) — front matter
    for i, page in enumerate(doc):
        if i < 36:  # skip first 36 pages
            continue
        t = page.get_text()
        if t.strip():
            full.append(t)
    return "\n".join(full)

# =====================================================================
# Step 2: Find remedy headings
# =====================================================================
# Common English words that appear in ALL CAPS within body text (not remedy names)
# These are emphatic caps used by Phatak in body text, not remedy headings
NON_REMEDY_WORDS = {
    'SECRETIONS', 'SENSE', 'STOOLS', 'SHS', 'SUFI', 'STOOL', 'SKIN',
    'BLOOD', 'HEART', 'LUNGS', 'BONES', 'GLANDS', 'NERVES', 'MUCOUS',
    'FEVER', 'SWEAT', 'URINE', 'PULSE', 'BREATH', 'VOICE', 'COUGH',
    'PAIN', 'PAINS', 'BURNING', 'ITCHING', 'SWELLING', 'WEAKNESS',
    'BLEEDING', 'DISCHARGE', 'DISCHARGES', 'ERUPTIONS', 'ULCERS',
    'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH', 'TONGUE',
    'TEETH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'BLADDER',
    'KIDNEYS', 'LIVER', 'SPLEEN', 'CHEST', 'BACK', 'NECK',
    'EXTREMITIES', 'SLEEP', 'MIND', 'GENERALS', 'GENERALITIES',
    'WORSE', 'BETTER', 'DOSE', 'COMPARE', 'RELATED', 'COMPLEMENTARY',
    'INIMICAL', 'ANTIDOTES', 'CAUSATION', 'CAUSATIONS',
    'TERROR', 'FEAR', 'ANXIETY', 'ANGER', 'GRIEF', 'SADNESS',
    'DELIRIUM', 'INSANITY', 'HYSTERIA', 'CONVULSIONS', 'SPASMS',
    'CRAMPS', 'PARALYSIS', 'NUMBNESS', 'TINGLING', 'FORMICATION',
    'HEAT', 'COLD', 'CHILLINESS', 'SHIVERING', 'TREMOR',
    'WALKING', 'STANDING', 'SITTING', 'LYING', 'MOVEMENT',
    'NIGHT', 'MORNING', 'EVENING', 'NOON', 'AFTERNOON',
    'WINTER', 'SUMMER', 'SPRING', 'AUTUMN', 'MOON', 'SUN',
    'WIND', 'RAIN', 'SNOW', 'FOG', 'DAMP', 'DRY',
    'LEFT', 'RIGHT', 'BOTH', 'UPPER', 'LOWER',
    'ANTE', 'POST', 'SUPRA', 'SUB', 'INFRA',
    'ACUTE', 'CHRONIC', 'PERIODICAL', 'ALTERNATING',
    'CHAPTER', 'SECTION', 'PART', 'INDEX', 'PREFACE',
    'CONTENTS', 'APPENDIX', 'INTRODUCTION',
    'THEREFORE', 'HOWEVER', 'MOREOVER', 'NEVERTHELESS',
    'ALWAYS', 'NEVER', 'OFTEN', 'SOMETIMES', 'USUALLY',
    'HENCE', 'THUS', 'WHILE', 'WHEN', 'WHERE', 'WHY',
    'NOTE', 'NOTES', 'SEE', 'COMPARE', 'ANTIDOTE',
    'CAUTION', 'WARNING',
    # OCR garbage
    'BUROPABUM', 'PALUSTRE', 'THLA', 'MAGNETIS', 'AUSTRALIS',
    'ARALIAVRACEMOSA', 'ARANERDIADEMAY',
}

def find_remedy_headings(full):
    """Find ALL CAPS remedy heading lines.
    A heading line is:
    - All uppercase letters, spaces, hyphens (no digits, no punctuation)
    - Length 3-50 chars
    - Not a section name (MIND, HEAD, GENERALITIES, etc.)
    - Not a page header / footer / non-remedy phrase
    - At line start
    - MUST be followed by a body that contains at least one section marker
      (to filter out index/TOC pages where multiple remedy names appear
      in a list with no real body text)
    - If single-word heading, the next non-empty line must NOT be a running-header
      fragment (i.e., not ALL CAPS containing '—' or a continuation of the heading)
    - Heading must NOT be a common English word used in body text (SECRETIONS, SENSE, etc.)
    """
    heading_re = re.compile(r'(?m)^\s*([A-Z][A-Z &\-]{2,49}[A-Z])\s*$', re.MULTILINE)

    candidates = []
    for m in heading_re.finditer(full):
        line = m.group(1).strip()
        # Skip multi-word phrases that look like chapter titles
        if line in NON_HEADING_LINES:
            continue
        # Skip very short
        if len(line) < 3:
            continue
        if line in NON_REMEDY_SHORT:
            continue
        # Skip section names
        if line in SECTIONS:
            continue
        # Skip common English words that appear in ALL CAPS in body text
        if line in NON_REMEDY_WORDS:
            continue
        # Skip lines with " — " (page running headers like "ACONITE — ACONITE")
        if '—' in line or ' - ' in line:
            continue
        # Skip "OF", "AND", etc.
        words = line.split()
        if len(words) > 4:
            continue  # too many words for a remedy name
        # Skip lines that are mostly the same word repeated
        if len(set(words)) == 1 and len(words) > 1:
            continue

        # Check the line immediately after this heading
        # If it's a running-header fragment like "VERNALIS — AESCULUS HIPPOCASTANUM"
        # then this heading is actually a split running header — skip it
        after_text = full[m.end():m.end()+200]
        after_lines = [l.strip() for l in after_text.split('\n') if l.strip()]
        if after_lines:
            first_after = after_lines[0]
            # If first line after heading is ALL CAPS and contains "—", it's a running header fragment
            if '—' in first_after and first_after.replace(' — ', '').replace(' ', '').replace('—', '').isupper():
                continue

        # Check that the line that follows (within ~2000 chars) contains a section marker
        # — this filters out TOC/index entries where multiple remedy names appear in a list
        following_text = full[m.end():m.end()+3000]
        if not SECTION_RE.search(following_text):
            continue

        candidates.append((m.start(), m.end(), line))
    return candidates

# =====================================================================
# Step 3: Merge consecutive headings (multi-line headings like ACTAEA / SPICATA)
# =====================================================================
def merge_consecutive_headings(candidates, full):
    """Merge headings that appear on consecutive lines (e.g., 'ACTEA' + 'SPICATA' = 'ACTAEA SPICATA').
    A merge is allowed ONLY if:
    - The two headings are on truly consecutive lines (only whitespace between)
    - The combined result is 2-4 words total
    - The combined word count makes sense for a Latin binomial
    - The text AFTER the second heading contains a section marker (within 2000 chars)
    """
    if not candidates:
        return candidates
    merged = []
    i = 0
    while i < len(candidates):
        s, e, name = candidates[i]
        # Try to merge with next candidate(s)
        combined = name
        last_end = e
        j = i + 1
        while j < len(candidates):
            ns, ne, nname = candidates[j]
            # Check what's between e and ns
            between = full[last_end:ns]
            # Should be only whitespace/newlines (no real text)
            if between.strip():
                break
            # Try combining
            trial = combined + ' ' + nname
            trial_words = trial.split()
            # Limit to 4 words total
            if len(trial_words) > 4:
                break
            # Check that the text AFTER nname contains a section marker
            # (otherwise we might be merging two unrelated index entries)
            following = full[ne:ne+3000]
            if not SECTION_RE.search(following):
                break
            # Also check that there's no other text between this heading and the next
            # that would suggest these are separate entries
            # (e.g., the next heading might be a new remedy itself)
            combined = trial
            last_end = ne
            j += 1
        merged.append((s, last_end, combined))
        i = j
    return merged

# =====================================================================
# Step 4: Parse body into sections
# =====================================================================
def parse_sections(body):
    """Find section markers (SECTION_NAME:) and slice body into sections.
    Returns: (intro_text, {section_name: section_text})
    """
    section_starts = []
    for m in SECTION_RE.finditer(body):
        section_starts.append((m.start(), m.group(1)))
    if not section_starts:
        return body.strip(), {}
    intro = body[:section_starts[0][0]].strip()
    sections = {}
    for i, (start, name) in enumerate(section_starts):
        end = section_starts[i+1][0] if i+1 < len(section_starts) else len(body)
        # Skip the marker itself (section_name + ':')
        marker_end = start + len(name) + 1
        text = body[marker_end:end].strip()
        # Clean trailing dashes
        text = re.sub(r'\s+', ' ', text).strip()
        if name not in sections:
            sections[name] = text
        else:
            sections[name] += ' ' + text
    return intro, sections

# =====================================================================
# Step 5: Clean body — strip page numbers and running headers
# =====================================================================
def clean_body(body):
    """Remove page numbers (single digits/short numbers on their own line)
    and running headers like 'REMEDIYNAME — OTHERREMEDIY' or 'REMEDIYNAME' alone.
    Also removes standalone headings that are running-header artifacts (e.g., 'ADONIS' alone
    at top of a page when the real heading was 'ADONIS VERNALIS' on the previous page).
    """
    lines = body.split('\n')
    cleaned = []
    for line in lines:
        s = line.strip()
        # Skip pure page numbers
        if s.isdigit():
            continue
        # Skip running headers like "ACONITE — ACONITE" or "ABSINTHIUM — ACETIC ACID"
        if ' — ' in s and s.replace(' — ', '').replace(' ', '').isupper():
            continue
        # Skip single-word ALL CAPS lines that look like running headers
        # (e.g., "ADONIS" alone on a page when the real heading was "ADONIS VERNALIS")
        # Heuristic: if it's ALL CAPS, single word, AND we've already seen real content
        # (i.e., we're past the first section), skip it
        # But keep the FIRST all-caps line (which might be the remedy name itself)
        if (len(cleaned) > 0 and  # we've already seen content
            s.isupper() and
            len(s.split()) == 1 and
            len(s) >= 3 and
            s.replace(' ', '').isalpha() and
            # Don't skip if it's a section name (we want to keep those)
            s not in SECTIONS):
            # Check if it's likely a running header — look at what's around it
            # If the next line is also a heading or section name, skip
            continue
        cleaned.append(line)
    return '\n'.join(cleaned)

# =====================================================================
# Step 6: Make id and title-case
# =====================================================================
def make_id(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return 'phatak-mm-' + s

def title_case(name):
    """Convert 'ABIES CANADENSIS' to 'Abies Canadensis'.
    Preserve hyphens (e.g., 'MAGNESIA MUR' → 'Magnesia Mur')."""
    parts = name.split()
    titled = []
    for p in parts:
        if '-' in p:
            sub = p.split('-')
            sub = [s.capitalize() for s in sub]
            titled.append('-'.join(sub))
        else:
            titled.append(p.capitalize())
    return ' '.join(titled)

# =====================================================================
# MAIN
# =====================================================================
def main():
    print("Extracting text...")
    full = extract_text()
    print(f"  Total text: {len(full):,} chars")

    print("\nFinding remedy headings...")
    candidates = find_remedy_headings(full)
    print(f"  Raw candidates: {len(candidates)}")

    merged = merge_consecutive_headings(candidates, full)
    print(f"  After merging multi-line: {len(merged)}")

    # Deduplicate: keep only the first occurrence of each unique name
    seen = set()
    unique = []
    for s, e, name in merged:
        key = name.upper()
        if key in seen:
            continue
        seen.add(key)
        unique.append((s, e, name))
    print(f"  Unique remedy names: {len(unique)}")

    # For each heading, slice body until next heading
    print("\nParsing bodies...")
    remedies = []
    for i, (start, end, name) in enumerate(unique):
        next_start = unique[i+1][0] if i+1 < len(unique) else len(full)
        body = full[end:next_start]
        # Clean: remove page numbers and running headers
        body = clean_body(body)
        # Parse sections
        intro, sections = parse_sections(body)

        # Skip if body is too short (likely a false positive)
        if len(body) < 100 and not sections:
            continue

        # Skip false-positive "remedies" — headings that are too short or look like OCR garbage
        # A real remedy name has at least 3 chars per word (e.g., "Aco" would be too short)
        name_words = name.split()
        is_valid = True
        for w in name_words:
            # Filter very short words (< 3 chars) that aren't proper abbreviations
            if len(w) < 3:
                is_valid = False
                break
            # Filter words with non-letter chars (numbers, special chars)
            if not re.match(r'^[A-Z]+$', w):
                is_valid = False
                break
        # Also require: name has 1-4 words
        if not is_valid or len(name_words) > 4:
            continue

        # Skip if name has a word repeated (e.g., "ABIES NIGRA ABIES NIGRA" — page header artifact)
        if len(name_words) > 1:
            lower_words = [w.lower() for w in name_words]
            if len(set(lower_words)) != len(lower_words):
                # Repeated word — keep only the unique portion
                seen_w = []
                for w in name_words:
                    if w not in seen_w:
                        seen_w.append(w)
                name = ' '.join(seen_w)
                name_words = name.split()

        # Skip if ANY word in the name is OCR garbage or a known non-remedy word
        # (re-check after merge in case the merged form has a bad word)
        bad_word = False
        for w in name_words:
            if w in NON_REMEDY_WORDS:
                bad_word = True
                break
        if bad_word:
            continue

        # Build full text
        full_text_parts = []
        if intro:
            full_text_parts.append(intro)
        for sec_name in SECTIONS:
            if sec_name in sections:
                full_text_parts.append(f"{sec_name}: {sections[sec_name]}")
        full_text = '\n\n'.join(full_text_parts)

        if not full_text or len(full_text) < 100:
            continue

        # Determine letter for A-Z index
        letter = name[0].upper() if name else 'A'

        # Build keynote: first 280 chars of full text
        keynote = full_text[:280].rsplit(' ', 1)[0]
        if len(full_text) > 280:
            keynote += '…'

        # Modalities (WORSE / BETTER)
        modalities = ''
        if 'WORSE' in sections:
            modalities += 'WORSE: ' + sections['WORSE'] + '. '
        if 'BETTER' in sections:
            modalities += 'BETTER: ' + sections['BETTER'] + '.'
        modalities = modalities.strip() or '—'

        # Relationships
        relationships = ''
        for rkey in ['RELATIONSHIPS', 'COMPARE', 'COMPLEMENTARY', 'INIMICAL', 'ANTIDOTES']:
            if rkey in sections:
                relationships += rkey + ': ' + sections[rkey] + '. '
        relationships = relationships.strip() or '—'

        # Constitution (use GENERALITIES)
        constitution = sections.get('GENERALITIES', intro[:200] if intro else '—')
        if len(constitution) > 300:
            constitution = constitution[:300] + '…'

        # Dose
        dose = sections.get('DOSE', '')

        # Chapter (primary organ system) — heuristic from sections present
        chapter_priority = ['MIND', 'HEAD', 'EYES', 'HEART', 'STOMACH', 'RESPIRATORY',
                            'FEMALE', 'MALE', 'SKIN', 'EXTREMITIES', 'SLEEP', 'FEVER',
                            'GENERALITIES', 'GENERALS']
        chapter = 'Generalities'
        for c in chapter_priority:
            if c in sections:
                chapter = c.capitalize()
                break

        # Organ = top sections by length
        organ_secs = sorted(((len(v), k) for k, v in sections.items()
                             if k not in ('WORSE', 'BETTER', 'RELATIONSHIPS',
                                          'COMPARE', 'COMPLEMENTARY', 'INIMICAL',
                                          'ANTIDOTES', 'DOSE')), reverse=True)
        organ = ', '.join(k for _, k in organ_secs[:3]) if organ_secs else '—'

        # Title-case the name
        name_titled = title_case(name)

        remedies.append({
            'id': make_id(name_titled),
            'name': name_titled,
            'common': '',  # Phatak's MM doesn't typically have common names on headings
            'author': 'Phatak',
            'letter': letter,
            'chapter': chapter,
            'organ': organ,
            'modalities': modalities,
            'constitution': constitution,
            'relationships': relationships,
            'dose': dose,
            'keynote': keynote,
            'full': full_text,
        })

    # Deduplicate by id (append -2 etc. for clashes)
    seen_ids = set()
    deduped = []
    for r in remedies:
        rid = r['id']
        if rid in seen_ids:
            i = 2
            while f"{rid}-{i}" in seen_ids:
                i += 1
            r['id'] = f"{rid}-{i}"
            rid = r['id']
        seen_ids.add(rid)
        deduped.append(r)

    print(f"\nFinal remedy count: {len(deduped)}")
    print(f"\nFirst 10 remedies:")
    for r in deduped[:10]:
        print(f"  {r['name']:30s} letter={r['letter']} chapter={r['chapter']:15s} body={len(r['full']):5d} chars")
    print(f"\nLast 5 remedies:")
    for r in deduped[-5:]:
        print(f"  {r['name']:30s} letter={r['letter']} chapter={r['chapter']:15s} body={len(r['full']):5d} chars")

    # Letter distribution
    from collections import Counter
    letter_dist = Counter(r['letter'] for r in deduped)
    print(f"\nLetter distribution:")
    for L in 'ABCDEFGHIJKLMNOPQRSTUVWXYZ':
        print(f"  {L}: {letter_dist.get(L, 0)}")

    # Total chars
    total = sum(len(r['full']) for r in deduped)
    print(f"\nTotal body text: {total:,} chars ({total/1024:.0f} KB)")

    # Check key remedies
    key_remedies = ['Aconite', 'Belladonna', 'Arnica', 'Bryonia', 'Calcarea Phosphorica',
                    'Calcarea Carbonica', 'Chamomilla', 'Ignatia', 'Lycopodium', 'Nux Vomica',
                    'Phosphorus', 'Pulsatilla', 'Rhus Toxicodendron', 'Sepia', 'Silicea',
                    'Sulphur', 'Thuja', 'Zincum Metallicum', 'Natrum Muriaticum',
                    'Carbo Vegetabilis', 'Antimonium Crudum', 'Antimonium Tartaricum']
    print("\nKey remedy check:")
    for k in key_remedies:
        found = [r for r in deduped if k.lower() in r['name'].lower()]
        if found:
            print(f"  ✓ {k:30s} → {found[0]['name']}")
        else:
            print(f"  ✗ {k} MISSING")

    OUT_JSON.write_text(json.dumps(deduped, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\n✓ Wrote {OUT_JSON} ({OUT_JSON.stat().st_size/1024:.1f} KB)")

if __name__ == "__main__":
    main()
