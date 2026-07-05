#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Post-processes boericke_remedies.json to fix truncated headings using
the index pages as a ground-truth lookup table.

Strategy:
1. Parse the PDF's index pages (579-595) to extract ALL canonical remedy names.
2. Add known S-letter remedies that the index lists in Title Case (Sulphur, Sabina, etc.)
3. For each entry in boericke_remedies.json:
   a. If name (case-insensitive) matches an index entry → keep as-is
   b. If prepending "S" makes it match → prepend "S" (heals truncated S-headings)
   c. If removing leading "S" makes it match → remove "S" (undoes wrong S prepends like "Soxalicum")
4. Also heal the common-name field (prepend "S" if it looks truncated).
5. Re-deduplicate by id.
6. Save the fixed JSON.
"""
import json, re
from pathlib import Path
import fitz

PDF = Path("/home/z/my-project/upload/Pocket Manual of Homoeopathic Materia Medica.pdf")
JSON_IN = Path("/home/z/my-project/scripts/boericke_remedies.json")
JSON_OUT = Path("/home/z/my-project/scripts/boericke_remedies.json")

# Hardcoded S-letter remedies known to be in Boericke (from the index, even if Title Case)
KNOWN_S_REMEDIES = {
    'Sabadilla', 'Sabina', 'Sulphur', 'Saccharum Lactis', 'Salivarius',
    'Scilla Maritima', 'Succinum', 'Sulfonalum', 'Sulphuricum Acidum',
    'Sulphurosum Acidum', 'Sulphur Iodatum', 'Sulphur', 'Senega',
    'Sticta Pulmonaria', 'Stillingia Silvatica', 'Spiraea Ulmaria',
    'Sarracenia Purpurea', 'Sarothamnus Scoparius', 'Skookum Chuck Aqua',
    'Stannum Metallicum', 'Stachys Betonica', 'Sempervivum Tectorum',
    'Senna', 'Solidago Virgaurea', 'Solanum Nigrum', 'Sparteinum Sulphuricum',
    'Spermaceti', 'Stigmata Maydis', 'Succinum', 'Sanguinarinum Nitricum',
    'Sanicula Aqua', 'Sarracenia Purpurea', 'Serum Anguillae',
    'Stellaria Media', 'Strontium Carbonicum', 'Strophanthus Hispidus',
    'Strychninum Phosphoricum', 'Strychninum Purum', 'Strychnos Gaultheriana',
    'Silphium Lacinatum', 'Sinapis Nigra', 'Salix Nigra',
    'Spiranthes Autumnalis', 'Spigelia Anthelmia', 'Spongia Tosta',
    'Squilla Maritima', 'Staphysagria', 'Stramonium', 'Sumbulus Moschatus',
    'Symphoricarpus Racemosus', 'Symphytum Officinale', 'Syphilinum',
    'Syzygium Jambolanum', 'Sepia Officinalis', 'Senecio Aureus',
    'Selenium Metallicum', 'Sedum Acre', 'Secale Cornutum',
    'Scutellaria Laterifolia', 'Scrophularia Nodosa', 'Sarsaparilla Officinalis',
    'Santoninum', 'Saponaria Officinalis', 'Sarcolacticum Acidum',
    'Sanguinaria Canadensis', 'Sambucus Nigra', 'Salvia Officinalis',
    'Salicylicum Acidum', 'Saccharum Officinale', 'Sabal Serrulata',
    'Sammonium Muriaticum', 'Skatolum',
}

# Additional known Boericke remedies (non-S) that need trailing-S healing
# but aren't in the index under their Latin name
KNOWN_EXTRA_REMEDIES = {
    'Carbo Animalis', 'Carbo Vegetabilis',
    'Phosphorus',
    'Aethiops Mineralis',
    'Latrodectus Mactans',
    'Anagallis Arvensis',
    'Arbutus Andrachne',
    'Asclepias Cornuti',
    'Crocus Sativus',
    'Cucurbita Citrullus',
    'Fucus Vesiculosus',
    'Galanthus Nivalis',
    'Helianthus Annuus',
    'Helleborus Niger',
    'Hydrangea Arborescens',
    'Lapis Albus',
    'Mephitis Putorius',
    'Pinus Sylvestris',
    'Platanus Occidentalis',
    'Quercus E Glandibus',
    'Rhododendron Ferrugineum',
    'Rhus Glabra',
    'Triticum Repens',
    'Urtica Urens',
    'Verbascum Thapsus',
    'Daphne Indica',
    'Drosera Rotundifolia',
    'Elaterium Officinarum',
    'Equisetum Hyemale',
    'Euphorbium Officinarum',
    'Fuligo Ligni',
    'Hypericum Perforatum',
    'Ictodes Foetida',
    'Inula Helenium',
    'Justicia Adhatoda',
    'Lachnanthes Tinctoria',
    'Origanum Majorana',
    'Ornithogalum Umbellatum',
    'Oxalicum Acidum',
    'Oxydendron Arboreum',
    'Chelone Glabra',
    'Collinsonia Canadensis',
    'Cubeba Officinalis',
    'Euphrasia Officinalis',
    'Gratiola Officinalis',
    'Gymnocladus Canadensis',
    'Hydrastis Canadensis',
    'Melilotus Officinalis',
    'Paeonia Officinalis',
    'Cistus Canadensis',
    'Copaiva Officinalis',
    'Calendula Officinalis',
    'Asparagus Officinalis',
    'China Officinalis',
    'Valeriana Officinalis',
    'Tarentula Cubensis',
    'Tarentula Hispanica',
    'Thuja Occidentalis',
    'Tongo-Dipterix Odorata',
    'Trillium Pendulum',
    'Trifolium Pratense',
    'Tribulus Terrestris',
    'Tilia Europaea',
    'Thlaspi Bursa Pastoris',
    'Veratrum Album', 'Veratrum Viride',
    'Verbena Urticaefolia',
    'Viburnum Opulus',
    'Vinca Minor',
    'Viola Odorata', 'Viola Tricolor',
    'Yucca Filamentosa',
    'Zincum Metallicum', 'Zincum Valerianicum',
    'Zingiber Officinale',
    'Bovista',
    'Tellurium Metallicum',
    'Tuberculinum',
    'Thyroidinum',
    'Thymus Serpyllum',
    'Ustilago Maydis',
    'Vanadium Metallicum',
    'Variolinum',
    'Vaccininum',
    'Theridion Curassavicum',
}

def extract_index_names():
    """Extract ALL uppercase remedy names from index pages, plus Title Case ones."""
    doc = fitz.open(str(PDF))
    names = set()
    # Page numbers we know are index pages
    for p in range(579, 595):
        if p >= len(doc): break
        t = doc[p].get_text()
        # ALL CAPS entries with dotted leader (2+ dots) and page number
        for m in re.finditer(r'(?m)^\s*([A-Z][A-Z \-]{2,50}[A-Z])\s*\.{2,}\s*\d', t):
            names.add(m.group(1).strip().title())
        # Title Case entries with 1+ dots and page number (like "Phosphorus.133")
        # Be conservative: only match if first letter is uppercase, rest mixed
        for m in re.finditer(r'(?m)^\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+)*)\s*\.{1,}\s*\d', t):
            name = m.group(1).strip()
            # Filter out single common words (e.g. "Page", "Index")
            if len(name) > 3:
                names.add(name)
    return names

def make_id(name):
    s = name.lower()
    s = re.sub(r'[^a-z0-9]+', '-', s).strip('-')
    return s

def prepend_s(name):
    """Prepend 'S' to a Title Case name and fix the case properly.
    'Abadilla' → 'Sabadilla' (not 'SAbadilla')
    'Ecale Cornutum' → 'Secale Cornutum' (not 'SEcale Cornutum')
    If name already starts with S (case-insensitive), return as-is.
    """
    if not name:
        return name
    # If already starts with S, no-op
    if name[0].upper() == 'S':
        return name
    # Lowercase the original first char, then prepend 'S'
    return 'S' + name[0].lower() + name[1:]

def append_trailing_s(name):
    """Append 'S' (or 's' if last char is lowercase) to the last word
    if it ends in 'I', 'U', 'A' (case-insensitive).
    'Spiranthes Autumnali' → 'Spiranthes Autumnalis'
    'Sepia Officinali' → 'Sepia Officinalis'
    'Sanguinaria Canadensi' → 'Sanguinaria Canadensis'
    """
    if not name:
        return name
    words = name.split()
    if not words: return name
    last = words[-1]
    if len(last) >= 4 and last[-1].upper() in 'UIA':
        # Match the case of the appended S to the case of the last char
        s_to_add = 'S' if last[-1].isupper() else 's'
        words[-1] = last + s_to_add
    return ' '.join(words)

def remove_s(name):
    """Remove leading 'S' from a name and re-capitalize.
    'Soxalicum Acidum' → 'Oxalicum Acidum'
    """
    if not name or not name.startswith('S'):
        return name
    # Capitalize the new first char (which was lowercase)
    return name[1].upper() + name[2:]

def main():
    # Build the index lookup
    index_names = extract_index_names()
    print(f"Index names extracted: {len(index_names)}")
    # Add hardcoded known S remedies + extra known remedies
    all_known = index_names | KNOWN_S_REMEDIES | KNOWN_EXTRA_REMEDIES
    # Normalize to Title Case for matching
    known_set = {n.title() for n in all_known}
    print(f"Total known names: {len(known_set)}")

    # Load parsed data
    remedies = json.loads(JSON_IN.read_text(encoding='utf-8'))
    print(f"Loaded {len(remedies)} parsed remedies")

    # For each remedy, try multiple fix strategies
    fixed = 0
    for r in remedies:
        original_name = r['name']
        original_common = r.get('common', '')

        # Strategy 0: name is already correct
        if original_name.title() in known_set:
            if original_common and original_common[0].islower():
                r['common'] = 'S' + original_common
            continue

        # Try multiple candidates and see if any matches
        candidates = []
        # Strategy 1: prepend S only
        c1 = prepend_s(original_name)
        candidates.append(('prepend_s', c1))
        # Strategy 2: append trailing S only
        c2 = append_trailing_s(original_name)
        if c2 != original_name:
            candidates.append(('append_s', c2))
        # Strategy 3: both prepend S and append trailing S
        c3 = append_trailing_s(prepend_s(original_name))
        if c3 != c1 and c3 != c2:
            candidates.append(('prepend+append_s', c3))
        # Strategy 4: remove leading S
        if original_name.startswith('S') and len(original_name) > 3:
            c4 = remove_s(original_name)
            candidates.append(('remove_s', c4))

        # Find first match
        matched = None
        for strat, cand in candidates:
            if cand.title() in known_set:
                matched = (strat, cand)
                break

        if matched:
            strat, new_name = matched
            r['name'] = new_name
            # Also fix common-name if it starts lowercase
            if original_common and original_common[0].islower():
                r['common'] = 'S' + original_common
            # For remove_s strategy, also undo wrong S on common
            if strat == 'remove_s' and original_common and original_common.startswith('S') and len(original_common) > 1 and original_common[1].islower():
                r['common'] = original_common[1].upper() + original_common[2:]
            r['id'] = make_id(r['name'])
            fixed += 1
            print(f"  FIXED ({strat:20s}): {original_name!r:35} → {r['name']!r:35} / {r['common']!r}")
            continue

        # Strategy 5: name doesn't match — but common-name might still need S prepend
        if original_common and original_common[0].islower():
            r['common'] = 'S' + original_common
            fixed += 1
            print(f"  FIXED (common only): {original_name!r:35} / {original_common!r:35} → {r['common']!r}")

    print(f"\nTotal fixes: {fixed}")

    # Re-deduplicate by id
    seen = set()
    deduped = []
    for r in remedies:
        if r['id'] in seen:
            i = 2
            while f"{r['id']}-{i}" in seen:
                i += 1
            r['id'] = f"{r['id']}-{i}"
        seen.add(r['id'])
        deduped.append(r)

    print(f"Final remedy count: {len(deduped)}")

    # Save
    JSON_OUT.write_text(json.dumps(deduped, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"✓ Wrote {JSON_OUT} ({JSON_OUT.stat().st_size/1024:.1f} KB)")

    # Stats
    s_remedies = sorted([r for r in deduped if r['name'].startswith('S')], key=lambda r: r['name'])
    print(f"\n=== S-letter remedies after fix: {len(s_remedies)} ===")
    for r in s_remedies:
        print(f"  {r['name']:40s} / {r.get('common','')[:30]}")

if __name__ == "__main__":
    main()
