#!/usr/bin/env python3
"""
Combined Rebuild: Phatak + Sankaran Materia Medica
====================================================
Rebuilds both Phatak (from clean digital PDF) and Sankaran (Soul of Remedies)
in a single pass, then replaces them in remedies.json.
"""
import json
import re
import os
import subprocess
from pathlib import Path
from collections import OrderedDict, Counter

# Paths
PROJECT = Path("/home/z/my-project")
PHATAK_PDF = "/home/z/my-project/upload/Phatak's Materia Medica.pdf"
SANKARAN_PDF = "/home/z/my-project/upload/The Soul of Remedies - Rajan Sankaran(New).pdf"
WORK = PROJECT / "work"
WORK_PHATAK = WORK / "phatak"
WORK_SANKARAN = WORK / "sankaran"
WORK_PHATAK.mkdir(parents=True, exist_ok=True)
WORK_SANKARAN.mkdir(parents=True, exist_ok=True)
REMEDIES_JSON = PROJECT / "data" / "remedies.json"


# ============================================================================
# PHATAK EXTRACTION
# ============================================================================

PHATAK_SECTIONS = {
    "Generalities", "General", "Mind", "Head", "Eyes", "Ears", "Nose", "Face",
    "Mouth", "Teeth", "Tongue", "Throat", "Stomach", "Abdomen", "Rectum",
    "Stool", "Urinary", "Urine", "Female", "Females", "Male", "Males",
    "Respiration", "Respiratory", "Chest", "Heart", "Neck", "Back",
    "Extremities", "Lower Extremities", "Upper Extremities", "Skin", "Sleep",
    "Dreams", "Fever", "Worse", "Better", "Clinical", "Relationship",
    "Relationships", "Related", "Causation", "Causations", "Complementary",
    "Antidote", "Antidotes", "Inimical", "Compare", "Comparisons", "Dose",
    "Uses", "Use", "Notes", "Note", "Peculiar", "Peculiarities",
    "Introduction", "Particulars", "Particular", "Observation",
    "Observations", "Sensations", "Modalities", "Concomitants",
    "Follows Well", "Male Sexual", "Female Sexual", "Generals",
}


def phatak_is_remedy_heading(line):
    """Detect 'Remedy Name [Abbrev]' heading."""
    stripped = line.strip()
    if not stripped or len(stripped) < 5:
        return None, None
    m = re.match(r'^([A-Z][a-zA-Z\s\-\.]+?)\s+\[([A-Za-z\u2010\-]+)\]\s*$', stripped)
    if m:
        name = m.group(1).strip()
        abbrev = m.group(2).strip()
        if len(name) < 3:
            return None, None
        alpha = [c for c in name if c.isalpha()]
        if len(alpha) < 3:
            return None, None
        return name, abbrev
    return None, None


def phatak_is_section(line):
    """Detect section heading (Title Case, possibly with trailing colon/period)."""
    stripped = line.strip()
    if not stripped:
        return None
    cleaned = re.sub(r'[:\.\s]+$', '', stripped).strip()
    if cleaned in PHATAK_SECTIONS:
        return cleaned
    # Handle "General symptoms" / "General Symptoms" variants
    if cleaned in ('General symptoms', 'General Symptoms'):
        return 'Generalities'
    return None


def extract_phatak():
    """Extract all Phatak remedies from the clean digital PDF."""
    print("\n=== PHATAK EXTRACTION ===")
    pages_txt = WORK_PHATAK / "phatak_pages.txt"
    if not pages_txt.exists():
        subprocess.run([
            "pdftotext", "-layout", PHATAK_PDF, str(pages_txt)
        ], check=True)
    with open(pages_txt) as f:
        text = f.read()
    pages = text.split('\f')
    print(f"  Total PDF pages: {len(pages)}")
    
    # Parse pages into flat line list (skip front matter pages 1-14)
    flat_lines = []
    for pdf_idx, page_text in enumerate(pages):
        if pdf_idx < 14 or pdf_idx >= len(pages) - 1:
            continue
        for line in page_text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            if stripped == 'Back to Index':
                continue
            if re.match(r'^\d{1,3}$', stripped):
                continue
            if stripped == 'Contents':
                continue
            flat_lines.append((pdf_idx, stripped))
    
    # Find remedy boundaries
    boundaries = []
    for i, (pdf_idx, line) in enumerate(flat_lines):
        name, abbrev = phatak_is_remedy_heading(line)
        if name:
            boundaries.append((i, name, abbrev))
    print(f"  Detected boundaries: {len(boundaries)}")
    
    # Deduplicate (keep first occurrence of each name+abbrev)
    seen = set()
    dedup = []
    for idx, name, abbrev in boundaries:
        key = (name.lower(), abbrev.lower())
        if key not in seen:
            seen.add(key)
            dedup.append((idx, name, abbrev))
    boundaries = dedup
    print(f"  Unique boundaries: {len(boundaries)}")
    
    # Extract each remedy
    remedies = []
    for i, (start_idx, name, abbrev) in enumerate(boundaries):
        end_idx = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(flat_lines)
        content = flat_lines[start_idx:end_idx]
        
        sections = OrderedDict()
        current_heading = "PREAMBLE"
        current_text = []
        pdf_pages = set()
        
        for pdf_idx, line in content[1:]:  # skip heading line
            pdf_pages.add(pdf_idx)
            heading = phatak_is_section(line)
            if heading is not None:
                if current_heading or current_text:
                    sections[current_heading] = '\n'.join(current_text).strip()
                current_heading = heading
                current_text = []
            else:
                # Check "Heading: content" pattern
                stripped = line.strip()
                m = re.match(r'^([A-Z][a-zA-Z]+(?:\s+[A-Za-z]+)?)\s*[:.]\s*(.+)$', stripped)
                if m:
                    pot_heading = m.group(1).strip()
                    rest = m.group(2).strip()
                    valid_variants = {'General symptoms', 'General Symptoms', 'General'}
                    if pot_heading in PHATAK_SECTIONS or pot_heading in valid_variants:
                        if pot_heading in valid_variants:
                            pot_heading = 'Generalities'
                        if current_heading or current_text:
                            sections[current_heading] = '\n'.join(current_text).strip()
                        current_heading = pot_heading
                        current_text = [rest] if rest else []
                        continue
                current_text.append(line)
        
        if current_heading or current_text:
            sections[current_heading] = '\n'.join(current_text).strip()
        
        if 'PREAMBLE' in sections and not sections['PREAMBLE']:
            del sections['PREAMBLE']
        
        # Build full text
        full_parts = [f"{name} [{abbrev}]" if abbrev else name, ""]
        for heading, text in sections.items():
            if heading == 'PREAMBLE':
                full_parts.append(text)
            else:
                full_parts.append(heading)
                if text:
                    full_parts.append(text)
            full_parts.append("")
        full_text = '\n'.join(full_parts).strip()
        
        # Build fields
        constitution = sections.get('Generalities', '').strip()
        worse = sections.get('Worse', '').strip()
        better = sections.get('Better', '').strip()
        modalities = ""
        if worse or better:
            parts = []
            if worse:
                parts.append(f"Worse: {worse}")
            if better:
                parts.append(f"Better: {better}")
            modalities = " | ".join(parts)
        
        organ_sections = ["Head", "Eyes", "Ears", "Nose", "Face", "Mouth", "Teeth",
                          "Tongue", "Throat", "Stomach", "Abdomen", "Rectum", "Stool",
                          "Urinary", "Urine", "Female", "Females", "Male", "Males",
                          "Respiration", "Respiratory", "Chest", "Heart", "Neck", "Back",
                          "Extremities", "Skin", "Sleep", "Fever"]
        organs = []
        seen_o = set()
        for o in organ_sections:
            if o in sections:
                n = 'Female' if o == 'Females' else ('Male' if o == 'Males' else
                      ('Respiration' if o == 'Respiratory' else o))
                if n not in seen_o:
                    seen_o.add(n)
                    organs.append(n)
        organ_str = ", ".join(organs)
        
        rel_parts = []
        for k in ["Relationship", "Relationships", "Related", "Complementary",
                  "Antidote", "Antidotes", "Inimical", "Compare", "Comparisons",
                  "Follows Well"]:
            if k in sections and sections[k].strip():
                rel_parts.append(f"{k}: {sections[k].strip()}")
        relationships = "\n".join(rel_parts)
        
        dose = sections.get('Dose', '').strip()
        chapter = "Mind" if "Mind" in sections else "Generalities"
        
        # Keynote
        keynote_lines = [f"{name} [{abbrev}]" if abbrev else name, ""]
        if constitution:
            keynote_lines.append(f"Generalities: {constitution[:250]}")
        keynote = '\n'.join(keynote_lines)
        
        slug = name.lower().replace(' ', '-').replace('.', '').replace('\u2010', '-')
        remedy_id = f"phatak-mm-{slug}"
        
        remedies.append({
            'id': remedy_id,
            'name': name,
            'common': f"[{abbrev}]" if abbrev else None,
            'author': 'Phatak',
            'letter': name[0].upper(),
            'chapter': chapter,
            'organ': organ_str,
            'modalities': modalities if modalities else '—',
            'constitution': constitution,
            'relationships': relationships if relationships else '—',
            'dose': dose if dose else None,
            'keynote': keynote,
            'full': full_text,
        })
    
    print(f"  Extracted remedies: {len(remedies)}")
    full_lengths = [len(r['full']) for r in remedies]
    print(f"  Total chars: {sum(full_lengths):,}")
    print(f"  Mean: {sum(full_lengths)//len(remedies)} chars/remedy")
    
    return remedies


# ============================================================================
# SANKARAN EXTRACTION
# ============================================================================


def sankaran_is_remedy_heading(line):
    """Detect all-caps remedy heading."""
    stripped = line.strip()
    if not stripped or len(stripped) < 5:
        return None
    if not re.match(r'^[A-Z][A-Z\s]+$', stripped):
        return None
    skip = {'INDEX', 'CONTENTS', 'INTRODUCTION', 'ABOUT THE WRITER',
            'BIBLIOGRAPHY', 'APPENDIX', 'CHAPTER', 'PART', 'BOOK',
            'MATERIA MEDICA', 'TABLE OF', 'FOREWORD', 'PREFACE',
            'ACKNOWLEDGMENTS', 'REFERENCES', 'THE SOUL OF REMEDIES',
            'THE SOUL OF', 'SOUL OF REMEDIES', 'PHYSICAL CONCOMITANTS',
            'RUBRICS', 'PHATAK'}
    if stripped in skip:
        return None
    alpha_runs = re.findall(r'[A-Z]+', stripped)
    if not alpha_runs:
        return None
    longest = max(len(r) for r in alpha_runs)
    if longest < 4:
        return None
    if len(stripped.split()) > 5:
        return None
    return re.sub(r'\s+', ' ', stripped).strip()


def sankaran_is_section_marker(line):
    """Detect section markers."""
    stripped = line.strip()
    if not stripped:
        return None
    cleaned = stripped.rstrip(':.').strip()
    if cleaned in ('Physical concomitants are', 'Physical concomitants'):
        return 'Physical concomitants'
    if cleaned == 'Rubrics':
        return 'Rubrics'
    if cleaned == 'Phatak':
        return 'Phatak Rubrics'
    return None


def extract_sankaran():
    """Extract all Sankaran remedies."""
    print("\n=== SANKARAN EXTRACTION ===")
    pages_txt = WORK_SANKARAN / "sankaran_pages.txt"
    if not pages_txt.exists():
        subprocess.run([
            "pdftotext", "-layout", SANKARAN_PDF, str(pages_txt)
        ], check=True)
    with open(pages_txt) as f:
        text = f.read()
    pages = text.split('\f')
    print(f"  Total PDF pages: {len(pages)}")
    
    # Parse pages (skip front matter 1-12)
    flat_lines = []
    for pdf_idx, page_text in enumerate(pages):
        if pdf_idx < 12:
            continue
        for line in page_text.split('\n'):
            stripped = line.strip()
            if not stripped:
                continue
            if stripped == 'The Soul of Remedies':
                continue
            if re.match(r'^The Soul of Remedies\s+\d+$', stripped):
                continue
            if re.match(r'^\d+\s+The Soul of Remedies\s*$', stripped):
                continue
            if re.match(r'^\d{1,3}$', stripped):
                continue
            flat_lines.append((pdf_idx, line))
    
    # Find remedy boundaries
    boundaries = []
    for i, (pdf_idx, line) in enumerate(flat_lines):
        name = sankaran_is_remedy_heading(line)
        if name:
            boundaries.append((i, name))
    print(f"  Detected boundaries: {len(boundaries)}")
    
    # Extract each remedy
    remedies = []
    for i, (start_idx, name) in enumerate(boundaries):
        end_idx = boundaries[i + 1][0] if i + 1 < len(boundaries) else len(flat_lines)
        content = flat_lines[start_idx:end_idx]
        
        sections = OrderedDict()
        current_section = "PREAMBLE"
        current_text = []
        pdf_pages = set()
        quote = None
        
        for pdf_idx, line in content[1:]:  # skip heading
            pdf_pages.add(pdf_idx)
            section = sankaran_is_section_marker(line)
            if section is not None:
                if current_section or current_text:
                    sections[current_section] = '\n'.join(current_text).strip()
                current_section = section
                current_text = []
            else:
                current_text.append(line)
        
        if current_section or current_text:
            sections[current_section] = '\n'.join(current_text).strip()
        
        # Extract quote (multi-line, wrapped in curly quotes)
        preamble = sections.get('PREAMBLE', '')
        if preamble:
            lines = preamble.split('\n')
            quote_lines = []
            in_quote = False
            quote_end_idx = -1
            for j, line in enumerate(lines):
                stripped = line.strip()
                if not stripped:
                    if in_quote:
                        quote_lines.append(line)
                    continue
                if not in_quote and (stripped.startswith('"') or stripped.startswith('“')):
                    in_quote = True
                    quote_lines.append(stripped)
                    if (stripped.endswith('"') or stripped.endswith('”')) and len(stripped) > 1:
                        quote_end_idx = j
                        break
                elif in_quote:
                    quote_lines.append(stripped)
                    if stripped.endswith('"') or stripped.endswith('”'):
                        quote_end_idx = j
                        break
            if quote_lines:
                quote = re.sub(r'\s+', ' ', ' '.join(quote_lines)).strip()
                if quote_end_idx >= 0:
                    sections['PREAMBLE'] = '\n'.join(lines[quote_end_idx+1:]).strip()
                else:
                    sections['PREAMBLE'] = ''
        
        if 'PREAMBLE' in sections and not sections['PREAMBLE']:
            del sections['PREAMBLE']
        
        # Clean OCR artifacts from sections
        for sec, text_val in sections.items():
            sections[sec] = re.sub(r'[\uf0a7\uf043\uf0b7\uf0d8\uf0a3]', '•', text_val)
            sections[sec] = re.sub(r'[\ue000-\uf8ff]', '', sections[sec])
        
        # Build full text
        full_parts = [name]
        if quote:
            full_parts.extend(['', quote])
        full_parts.append('')
        for sec, text in sections.items():
            if sec == 'PREAMBLE':
                full_parts.append(text)
                full_parts.append('')
            else:
                full_parts.append(sec)
                full_parts.append('')
                if text:
                    full_parts.append(text)
                full_parts.append('')
        full_text = '\n'.join(full_parts).strip()
        
        constitution = sections.get('PREAMBLE', '').strip()
        rubrics = sections.get('Rubrics', '').strip()
        phatak_rubrics = sections.get('Phatak Rubrics', '').strip()
        physical = sections.get('Physical concomitants', '').strip()
        
        rel_parts = []
        if rubrics:
            rel_parts.append(f"Rubrics:\n{rubrics}")
        if phatak_rubrics:
            rel_parts.append(f"Phatak Rubrics:\n{phatak_rubrics}")
        relationships = '\n\n'.join(rel_parts)
        
        slug = name.lower().replace(' ', '-')
        remedy_id = f"sankaran-mm-{slug}"
        
        keynote_lines = [name]
        if quote:
            keynote_lines.extend(['', quote])
        elif constitution:
            keynote_lines.extend(['', constitution[:200]])
        keynote = '\n'.join(keynote_lines)
        
        remedies.append({
            'id': remedy_id,
            'name': name.title() if name.isupper() else name,
            'common': None,
            'author': 'Sankaran',
            'letter': name[0].upper(),
            'chapter': 'Mind',
            'organ': '',
            'modalities': physical if physical else '—',
            'constitution': constitution,
            'relationships': relationships if relationships else '—',
            'dose': None,
            'keynote': keynote,
            'full': full_text,
        })
    
    print(f"  Extracted remedies: {len(remedies)}")
    full_lengths = [len(r['full']) for r in remedies]
    print(f"  Total chars: {sum(full_lengths):,}")
    print(f"  Mean: {sum(full_lengths)//len(remedies)} chars/remedy")
    with_quote = sum(1 for r in remedies if r['keynote'] != r['name'])
    print(f"  With quote: {with_quote}/{len(remedies)}")
    
    return remedies


# ============================================================================
# REPLACE IN REMEDIES.JSON
# ============================================================================


def replace_in_remedies_json(phatak_remedies, sankaran_remedies):
    """Replace Phatak and Sankaran entries in remedies.json."""
    print("\n=== REPLACING IN remedies.json ===")
    
    # Backup
    backup = PROJECT / "data" / "remedies_backup_pre_rebuild.json"
    with open(REMEDIES_JSON) as f:
        all_remedies = json.load(f)
    print(f"  Loaded {len(all_remedies)} total remedies")
    
    if not backup.exists():
        with open(backup, 'w') as f:
            json.dump(all_remedies, f, indent=2, ensure_ascii=False)
        print(f"  Backed up to: {backup}")
    
    # Remove existing Phatak and Sankaran
    others = [r for r in all_remedies if r.get('author') not in ('Phatak', 'Sankaran')]
    print(f"  Non-Phatak/Sankaran kept: {len(others)}")
    
    # Combine
    combined = others + phatak_remedies + sankaran_remedies
    
    # Sort
    author_order = {'Allen': 1, 'Boericke': 2, 'Kent': 3, 'Phatak': 4, 'Dubey': 5,
                    'Murphy': 6, 'Boeger': 7, 'Farrington': 8, 'Mathur': 9, 'Sankaran': 10}
    combined.sort(key=lambda r: (author_order.get(r.get('author', 'ZZZ'), 99),
                                  r.get('name', '').lower()))
    
    with open(REMEDIES_JSON, 'w') as f:
        json.dump(combined, f, indent=2, ensure_ascii=False)
    
    file_size = REMEDIES_JSON.stat().st_size
    print(f"  Saved {len(combined)} remedies ({file_size/1024/1024:.1f} MB)")
    
    # Verify
    with open(REMEDIES_JSON) as f:
        verify = json.load(f)
    authors = Counter(r.get('author') for r in verify)
    print(f"\n  Final author counts:")
    for a, c in authors.most_common():
        print(f"    {a}: {c}")
    
    return combined


def main():
    print("=" * 70)
    print("COMBINED REBUILD: PHATAK + SANKARAN MATERIA MEDICA")
    print("=" * 70)
    
    # Extract Phatak
    phatak = extract_phatak()
    
    # Extract Sankaran
    sankaran = extract_sankaran()
    
    # Replace in remedies.json
    combined = replace_in_remedies_json(phatak, sankaran)
    
    # Save extracted data for reference
    with open(WORK_PHATAK / "phatak_extracted.json", 'w') as f:
        json.dump(phatak, f, indent=2, ensure_ascii=False)
    with open(WORK_SANKARAN / "sankaran_extracted.json", 'w') as f:
        json.dump(sankaran, f, indent=2, ensure_ascii=False)
    
    print("\n" + "=" * 70)
    print("REBUILD COMPLETE")
    print("=" * 70)
    print(f"  Phatak: {len(phatak)} remedies")
    print(f"  Sankaran: {len(sankaran)} remedies")
    print(f"  Total in database: {len(combined)} remedies")


if __name__ == "__main__":
    main()
