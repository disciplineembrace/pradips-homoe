#!/usr/bin/env python3
"""
Boeger (Boger) source parser — extracts remedy entries from
'Boeger Synoptic Key Materia Medica' by C.M. Boger.

Structure:
- Remedy name in Title Case on its own line (e.g., "Abrotanum")
- Optional ALL-CAPS common name on next line (e.g., "ACONITE")
- Sections: Region, Worse, Better, Description, Symptoms, Related
- Page numbers scattered throughout (standalone numbers)
- "Materia medica" header appears periodically

NEVER fabricates content. Source text preserved as-is.
"""
import json, re, os

SRC = '/home/z/my-project/data/sources/extracted/boeger.txt'
OUT = '/home/z/my-project/data/boeger-source-remedies.json'

def main():
    with open(SRC, 'r', encoding='utf-8') as f:
        text = f.read()
    lines = text.split('\n')
    print(f"Loaded {len(lines)} lines from {SRC}")

    # Skip the table of contents (first ~640 lines have "Remedy... NN" entries)
    # Find where the first actual remedy entry starts
    start_idx = 0
    for i, line in enumerate(lines):
        # The first actual entry is "Abrotanum" followed by "Region" on next non-blank line
        if line.strip() == 'Abrotanum' and i + 1 < len(lines):
            # Check if "Region" appears within the next 5 lines
            for j in range(i+1, min(i+6, len(lines))):
                if lines[j].strip() == 'Region':
                    start_idx = i
                    break
            if start_idx:
                break

    print(f"Remedies start at line {start_idx+1}")

    # Known section labels that appear as standalone lines in Boeger
    SECTION_LABELS = {'Region', 'Worse', 'Better', 'Description', 'Symptoms', 'Related'}

    # Common non-remedy Title-Case lines to skip
    SKIP_NAMES = {'Materia medica', 'Materia Medica', 'Index', 'Contents',
                  'Preface', 'Introduction', 'Chapter'}

    remedies = []
    current_remedy = None
    current_lines = []

    def save_current():
        nonlocal current_remedy, current_lines
        if current_remedy and current_lines:
            full = '\n'.join(current_lines).strip()
            full = re.sub(r'\n{3,}', '\n\n', full)
            # Remove standalone page-number lines
            full = re.sub(r'\n\s*\d{1,4}\s*\n', '\n', full)
            if len(full) > 50:
                current_remedy['full'] = full
                current_remedy['keynote'] = full[:500]
                remedies.append(current_remedy)
        current_remedy = None
        current_lines = []

    for i in range(start_idx, len(lines)):
        line = lines[i]
        stripped = line.strip()

        # Skip empty lines (but track for context)
        if not stripped:
            if current_remedy:
                current_lines.append('')
            continue

        # Skip standalone page numbers
        if re.match(r'^\d{1,4}$', stripped):
            continue

        # Skip "Materia medica" header
        if stripped in SKIP_NAMES:
            continue

        # Check if this looks like a remedy title:
        # - Title Case (first letter uppercase, rest lowercase)
        # - 1-4 words
        # - No trailing punctuation
        # - NOT a known section label
        # - Followed by either an ALL-CAPS common name or a section label
        is_title = (
            stripped not in SECTION_LABELS and
            stripped not in SKIP_NAMES and
            len(stripped) < 50 and
            not stripped.endswith('.') and
            not stripped.endswith(',') and
            not stripped.endswith(';') and
            not stripped.startswith('•') and
            not stripped.startswith('-') and
            stripped[0].isupper() and
            len(stripped.split()) <= 4
        )

        # Additional check: the line should look like a Latin remedy name
        # (not a common English phrase)
        if is_title:
            # Check if next non-blank line is a section label or ALL-CAPS name
            next_meaningful = None
            for j in range(i+1, min(i+5, len(lines))):
                ns = lines[j].strip()
                if ns:
                    next_meaningful = ns
                    break

            if next_meaningful:
                # It's a remedy title if next line is:
                # - A section label (Region, Worse, etc.)
                # - An ALL-CAPS common name (e.g., "ACONITE")
                # - Another Title-Case word (part of the name)
                is_section = next_meaningful in SECTION_LABELS
                is_allcaps = (next_meaningful.isupper() and
                             len(next_meaningful) > 2 and
                             next_meaningful.isalpha())
                # If next line is a section label, this is definitely a remedy title
                if is_section:
                    pass  # is_title stays True
                elif is_allcaps:
                    pass  # ALL-CAPS common name follows
                else:
                    # If next line is neither, it might be body text — skip
                    # unless the current line really looks like a remedy name
                    # (single word, Latin-ish)
                    if not (len(stripped.split()) == 1 and len(stripped) > 3):
                        is_title = False

        if is_title:
            save_current()

            name = stripped
            # Check if next line is ALL-CAPS common name
            common_name = ''
            for j in range(i+1, min(i+5, len(lines))):
                ns = lines[j].strip()
                if ns:
                    if ns.isupper() and ns.isalpha() and len(ns) > 2:
                        common_name = ns.title()
                    break

            remedy_id = 'boeger-mm-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
            current_remedy = {
                'id': remedy_id, 'name': name, 'common': common_name,
                'author': 'Boeger',
                'letter': name[0].upper() if name else '?',
                'chapter': 'Boeger Synoptic Key', 'organ': '',
                'modalities': '', 'constitution': '',
                'relationships': '', 'dose': '',
            }
            current_lines = []
        else:
            if current_remedy:
                current_lines.append(line)

    save_current()

    print(f"\nParsed {len(remedies)} remedies from Boeger source")
    if remedies:
        print(f"\nFirst 5:")
        for r in remedies[:5]:
            print(f"  - {r['name']} (common: {r.get('common', '—')}, full len: {len(r.get('full', ''))})")
        print(f"\nLast 3:")
        for r in remedies[-3:]:
            print(f"  - {r['name']} (full len: {len(r.get('full', ''))})")

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

    # Compare with production
    with open('/home/z/my-project/data/remedies.json') as f:
        prod = json.load(f)
    prod_boeger = [r for r in prod if r.get('author') == 'Boeger']
    prod_names = {r['name'].lower() for r in prod_boeger}
    src_names = {r['name'].lower() for r in remedies}
    missing = src_names - prod_names
    extra = prod_names - src_names
    print(f"\n=== BOEGER SOURCE vs PRODUCTION ===")
    print(f"Source: {len(remedies)} remedies")
    print(f"Production: {len(prod_boeger)} remedies")
    print(f"Missing from production: {len(missing)}")
    if missing:
        print(f"  Sample: {list(missing)[:15]}")
    print(f"Extra in production: {len(extra)}")
    if extra:
        print(f"  Sample: {list(extra)[:15]}")

if __name__ == '__main__':
    main()
