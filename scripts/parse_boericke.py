#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parses Boericke's Pocket Manual PDF into per-remedy JSON entries.

Strategy:
1. Extract all text via PyMuPDF.
2. Strip the "Similibis India" watermark line.
3. Find remedy headings — ALL CAPS lines on their own.
4. Heal truncated headings (PDF loses the final letter).
5. Slice body text between consecutive headings.
6. Parse out sections (Mind, Head, Eyes, ..., Modalities, Relationship, Dose).
7. Build a clean REMEDIES list and feed it into the HTML builder.
"""
import fitz, re, json, html
from pathlib import Path

PDF = Path("/home/z/my-project/upload/Pocket Manual of Homoeopathic Materia Medica.pdf")
OUT_JSON = Path("/home/z/my-project/scripts/boericke_remedies.json")
OUT_HTML_FRAG = Path("/home/z/my-project/scripts/boericke_remedies.py")

# Section markers used in Boericke (always followed by ".--")
SECTIONS = [
    'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Urinary', 'Male', 'Female',
    'Respiratory', 'Chest', 'Heart', 'Back', 'Neck', 'Extremities',
    'Sleep', 'Skin', 'Fever', 'Modalities', 'Relationship', 'Dose',
    'Larynx', 'Teeth', 'Tongue', 'Saliva', 'Voice', 'Cough', 'Expectoration',
    'Blood', 'Liver', 'Spleen', 'Kidneys', 'Bladder', 'Prostate',
    'Generals', 'Generalities', 'Worse', 'Better', 'Compare', 'Complementary',
    'Inimical', 'Antidotes', 'Caustic', 'Cautions', 'Pulse'
]

# Build a regex that matches "<Section>.--" or "<Section>.—"
SECTION_RE = re.compile(r'\b(' + '|'.join(SECTIONS) + r')\.(?:––|—|--|—)\s*')

def extract_text():
    doc = fitz.open(str(PDF))
    full = "\n".join(p.get_text() for p in doc if p.get_text().strip())
    # Strip the "Similibis India" watermark line
    full = re.sub(r'(?m)^\s*Similibis India\s*$', '', full, flags=re.MULTILINE)
    # Remove multiple consecutive blank lines
    full = re.sub(r'\n{3,}', '\n\n', full)
    return full

def find_headings(full):
    """Find all candidate remedy heading lines (ALL CAPS on own line)."""
    heading_re = re.compile(r'(?m)^([A-Z][A-Z \-]{2,49})\s*$')
    non_remedies = {
        'MIND','HEAD','EYES','EARS','NOSE','FACE','MOUTH','THROAT','STOMACH','ABDOMEN',
        'RECTUM','STOOL','URINARY','FEMALE','MALE','RESPIRATORY','HEART','BACK','SKIN',
        'EXTREMITIES','SLEEP','MODALITIES','RELATIONSHIP','DOSE','FEVER','CHEST','TEETH',
        'GENITALS','LARYNX','BLOOD','WORSE','BETTER','COMPARE','COMPLEMENTARY','INIMICAL',
        'PREFACE','INTRODUCTION','CONTENTS','INDEX','PART','CHAPTER','APPENDIX',
        'SIMILIBIS INDIA','HOMOEOPATHIC MATERIA MEDICA','PREFACE TO THE NINTH EDITION',
        'PREFACE TO THE FIRST EDITION','ABBREVIATIONS','EXPLANATION OF ABBREVIATIONS',
        'SOME GENERAL PRINCIPLES','THE DOCTRINE OF SIGNATURES','GENERAL INDEX',
        'REMEDIES AND THEIR ABBREVIATIONS'
    }
    candidates = []
    for m in heading_re.finditer(full):
        line = m.group(1).strip()
        if line in non_remedies: continue
        if len(line) < 4: continue
        if line.count(' ') > 4: continue  # too many words → not a remedy name
        candidates.append((m.start(), m.end(), line))
    return candidates

def get_common_name(full, end_pos):
    """Try to extract the common-name line that follows a heading."""
    after = full[end_pos:end_pos+300].lstrip('\n')
    if not after: return ''
    first_line = after.split('\n', 1)[0].strip()
    # Common name heuristics
    if not first_line: return ''
    if len(first_line) > 60: return ''
    # Should have at least one lowercase letter (i.e., not another ALL CAPS line)
    if not any(c.islower() for c in first_line): return ''
    # Should not start with a section marker
    if SECTION_RE.match(first_line): return ''
    # Should not be a sentence ending in period
    if first_line.endswith('.') and len(first_line) > 40: return ''
    return first_line

def heal_heading(heading, common):
    """Try to heal a truncated heading by checking the common-name line.
    Often the common-name line contains the Latin binomial fully spelled out.
    E.g. heading='ABIES CANADENSI' + common='Pinus canadensis' → 'Abies canadensis'
    The common-name line may use a SYNONYM genus (Pinus vs Abies), so we
    can't always match on genus. Instead, we match the LAST word.
    """
    if common:
        # Try Latin binomial pattern: "Genus species"
        m = re.match(r'^([A-Z][a-z]+)\s+([a-z\-]+)', common)
        if m:
            genus = m.group(1)
            species = m.group(2)
            # Case A: heading starts with the uppercase of common's genus
            # (e.g. heading=ACONITUM NAPELLU + common=Aconitum napellus)
            if heading.upper().startswith(genus.upper()):
                return f"{genus} {species}"
            # Case B: heading's last word matches the species prefix
            # (e.g. heading=ABIES CANADENSI + common=Pinus canadensis)
            # We check if the heading's last word matches the species's stem
            words = heading.split()
            if len(words) >= 2:
                # If the heading's last word, when uppercased, is a prefix of species uppercased
                if words[-1].upper() == species.upper()[:len(words[-1])]:
                    # Use the heading's genus (not the common's genus)
                    # Preserve heading's capitalization style (Title Case for genus)
                    heading_genus = words[0].title()
                    return f"{heading_genus} {species}"
        # Try just species name (single word, lowercase, like "jequirity")
        # — not useful for healing
    # PRIORITY 2: Multi-word heading where the LAST word looks truncated.
    words = heading.split()
    if len(words) >= 2 and len(words[-1]) >= 4:
        last = words[-1]
        if last[-1] == 'U':  # NAPELLU → NAPELLUS
            return heading + 'S'
        if last[-1] == 'I' and last[-2] in 'AEIOUY':  # VERNALI → VERNALIS
            return heading + 'S'
    # Single-word headings: leave alone
    return heading

def split_sections(body):
    """Split body text into sections. Returns (intro, sections_dict)."""
    # Find all section markers
    section_starts = []
    for m in SECTION_RE.finditer(body):
        section_starts.append((m.start(), m.group(1)))
    if not section_starts:
        return body.strip(), {}
    # Intro = text before first section
    intro = body[:section_starts[0][0]].strip()
    sections = {}
    for i, (start, name) in enumerate(section_starts):
        end = section_starts[i+1][0] if i+1 < len(section_starts) else len(body)
        # Skip the marker itself
        marker_end = section_starts[i][0] + len(name) + 4  # name + ".--"
        text = body[marker_end:end].strip()
        # Clean trailing dashes
        text = re.sub(r'\s+', ' ', text).strip()
        if name not in sections:
            sections[name] = text
        else:
            sections[name] += ' ' + text
    return intro, sections

def make_id(name):
    """Make a URL-safe id from a remedy name."""
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def main():
    full = extract_text()
    print(f"Full text: {len(full):,} chars")

    candidates = find_headings(full)
    print(f"Candidate headings: {len(candidates)}")

    # Filter out the title-page / preface / index false positives:
    # - Skip candidates whose body text starts with letter/number index patterns
    # - Skip first 3 candidates if they are preface-related
    # Heuristic: a real remedy entry's body should contain at least one section marker
    # OR a long enough descriptive intro.
    # Also: skip the very first 3 candidates (always the title page) by checking name.
    candidates = [(s, e, h) for s, e, h in candidates
                  if h not in ('HOMOEOPATHIC', 'MATERIA MEDICA', 'MATERIA MEDICAS',
                                'PREFACE TO THE NINTH EDITION',
                                'PREFACE TO THE FIRST EDITION',
                                'INTRODUCTION', 'CONTENTS', 'INDEX',
                                'GENERAL INDEX', 'ABBREVIATIONS',
                                'EXPLANATION OF ABBREVIATIONS',
                                'SOME GENERAL PRINCIPLES',
                                'THE DOCTRINE OF SIGNATURES',
                                'REMEDIES AND THEIR ABBREVIATIONS')]
    print(f"After title-page filter: {len(candidates)}")

    # Build entries by slicing between consecutive headings
    remedies = []
    for i, (start, end, heading) in enumerate(candidates):
        common = get_common_name(full, end)
        healed = heal_heading(heading, common)
        # Normalize to Title Case (each word starts uppercase, rest lowercase)
        # EXCEPT keep hyphenated suffixes lowercase
        def title_case(name):
            parts = name.split()
            titled = []
            for p in parts:
                if '-' in p:
                    sub = p.split('-')
                    sub = [sub[0].capitalize()] + [s.lower() if len(s)>3 else s for s in sub[1:]]
                    titled.append('-'.join(sub))
                else:
                    titled.append(p.capitalize())
            return ' '.join(titled)
        healed = title_case(healed)
        # Body = from end of this heading to start of next heading
        next_start = candidates[i+1][0] if i+1 < len(candidates) else len(full)
        # Skip the common-name line (if present) from body
        body_start = end
        if common:
            # Skip the common name line
            after = full[end:end+300].lstrip('\n')
            if after.startswith(common):
                body_start = end + (full[end:end+300].find(common) + len(common))
        body = full[body_start:next_start].strip()
        # Parse sections
        intro, sections = split_sections(body)

        # Skip if entry is too short (likely false positive)
        if len(intro) < 30 and not sections:
            continue

        # Skip index entries — body that looks like a list of names + page numbers
        # Heuristic: if body has many short lines that look like "Remedy name   NN"
        if re.search(r'\b\d{1,4}\b\s*$', body, re.MULTILINE) and body.count('\n') > 20:
            # Looks like an index — check ratio
            index_lines = sum(1 for ln in body.split('\n') if re.search(r'\b\d{1,4}\b\s*$', ln))
            if index_lines > 10:
                continue

        # Determine letter for A-Z index
        letter = healed[0].upper() if healed else 'A'

        # Build a representative keynote: first 200 chars of intro
        keynote = intro[:280].rsplit(' ', 1)[0]
        if len(intro) > 280: keynote += '…'

        # Build "full" text combining intro + all sections
        full_text_parts = []
        if intro:
            full_text_parts.append(intro)
        for sec_name in SECTIONS:
            if sec_name in sections:
                full_text_parts.append(f"{sec_name}.-- {sections[sec_name]}")
        full_text = '\n\n'.join(full_text_parts)

        # Extract modalities & relationships (often the most useful for cross-ref)
        modalities = sections.get('Modalities', sections.get('Worse', '') + ' ' + sections.get('Better', ''))
        relationships = sections.get('Relationship', sections.get('Compare', ''))
        dose = sections.get('Dose', '')

        # Pick a chapter (primary organ system) — heuristic from sections present
        chapter_priority = ['Mind', 'Head', 'Eyes', 'Heart', 'Stomach', 'Respiratory',
                            'Female', 'Male', 'Skin', 'Extremities', 'Sleep', 'Fever',
                            'Generalities', 'Generals']
        chapter = 'Various'
        for c in chapter_priority:
            if c in sections:
                chapter = c
                break

        # Organ = top 2 sections by length
        organ_secs = sorted(((len(v), k) for k, v in sections.items() if k not in ('Modalities','Relationship','Dose')), reverse=True)
        organ = ', '.join(k for _, k in organ_secs[:3]) if organ_secs else '—'

        remedies.append({
            'id': make_id(healed),
            'name': healed,
            'common': common,
            'author': 'Boericke',
            'letter': letter,
            'chapter': chapter,
            'organ': organ,
            'modalities': modalities or '—',
            'constitution': intro[:200] if intro else '—',
            'relationships': relationships or '—',
            'dose': dose or '—',
            'keynote': keynote,
            'full': full_text,
            'sections': sections
        })

    # Deduplicate by id (keep first occurrence)
    seen = set()
    deduped = []
    for r in remedies:
        if r['id'] in seen:
            # Append a number
            i = 2
            while f"{r['id']}-{i}" in seen:
                i += 1
            r['id'] = f"{r['id']}-{i}"
        seen.add(r['id'])
        deduped.append(r)

    print(f"Final remedies: {len(deduped)}")

    # Sanity checks
    print("\nFirst 5:")
    for r in deduped[:5]:
        print(f"  {r['name']:40s} / {r['common']:25s} / {r['chapter']:15s} / body={len(r['full']):5d} chars")
    print("Last 5:")
    for r in deduped[-5:]:
        print(f"  {r['name']:40s} / {r['common']:25s} / {r['chapter']:15s} / body={len(r['full']):5d} chars")

    # Total text size
    total = sum(len(r['full']) for r in deduped)
    print(f"\nTotal remedy body text: {total:,} chars ({total/1024:.0f} KB)")

    # Save JSON
    OUT_JSON.write_text(json.dumps(deduped, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\n✓ Wrote {OUT_JSON} ({OUT_JSON.stat().st_size/1024:.1f} KB)")

    # Also write a Python module with the data inline (for direct import)
    with OUT_HTML_FRAG.open('w', encoding='utf-8') as f:
        f.write("# -*- coding: utf-8 -*-\n")
        f.write("# Auto-generated from Boericke PDF. Do not edit manually.\n")
        f.write("BOERICKE_REMEDIES = ")
        f.write(json.dumps(deduped, ensure_ascii=False, indent=2))
        f.write("\n")
    print(f"✓ Wrote {OUT_HTML_FRAG} ({OUT_HTML_FRAG.stat().st_size/1024:.1f} KB)")

if __name__ == "__main__":
    main()
