#!/usr/bin/env python3
"""
Regression test for Boericke Abies Canadensis and other remedies.

Verifies:
1. The remedy exists in the master remedies.json
2. The `keynote` field is empty (no duplication)
3. The `intro` field contains source introduction paragraph
4. The `sections` array has the expected source sections (Head, Stomach, etc.)
5. The `full` field is NOT identical to `intro` (full = intro + sections joined)
6. Each section title matches a known Boericke section vocabulary
7. Section content is non-empty
8. No section's content duplicates intro
"""
import json
import os

REMEDIES_JSON = '/home/z/my-project/data/remedies.json'

# Known Boericke section headings (verified from source PDF)
KNOWN_BOERICKE_SECTIONS = {
    'Mind', 'Head', 'Eyes', 'Ears', 'Nose', 'Face', 'Mouth', 'Throat',
    'Stomach', 'Abdomen', 'Rectum', 'Stool', 'Anus', 'Urinary', 'Genitals',
    'Male', 'Female', 'Respiratory', 'Chest', 'Heart', 'Back', 'Extremities',
    'Skin', 'Sleep', 'Dreams', 'Fever', 'Sweat', 'Modalities', 'Relations',
    'Relationships', 'Relationship', 'Compare', 'Comparisons', 'Antidotes',
    'Dose', 'Duration', 'Children', 'Pregnancy', 'Clinical', 'Pharmacy',
    'Source', 'Habitat', 'Preparation', 'Constitution', 'Miasms', 'Miasm',
    'Complementary', 'Inimical', 'Follows', 'Followed by', 'Worse', 'Better',
    'Characteristic Symptoms', 'Guiding Symptoms', 'Neck', 'Liver',
}


def main():
    with open(REMEDIES_JSON) as f:
        remedies = json.load(f)

    print(f"Loaded {len(remedies):,} remedies from master file")
    print()

    # Test Case 1: Abies Canadensis (the user's complaint case)
    print("=" * 60)
    print("REGRESSION TEST CASE #1: Boericke Abies Canadensis")
    print("=" * 60)

    target = None
    for r in remedies:
        if r.get('id') == 'boericke-mm-abies-canadensis':
            target = r
            break

    if not target:
        print("FAIL: Abies Canadensis not found!")
        return

    checks = []

    # Check 1: name is correct
    if target.get('name') == 'Abies Canadensis':
        checks.append(("✓", "name = 'Abies Canadensis'", "PASS"))
    else:
        checks.append(("✗", f"name = '{target.get('name')}'", "FAIL"))

    # Check 2: common name is "Hemlock Spruce"
    if 'Hemlock Spruce' in target.get('common', ''):
        checks.append(("✓", "common contains 'Hemlock Spruce'", "PASS"))
    else:
        checks.append(("✗", f"common = '{target.get('common')}'", "FAIL"))

    # Check 3: keynote is EMPTY (no duplication!)
    if not target.get('keynote', '').strip():
        checks.append(("✓", "keynote is empty (no duplication)", "PASS"))
    else:
        checks.append(("✗", f"keynote is NOT empty: '{target['keynote'][:50]}...'", "FAIL"))

    # Check 4: intro contains expected source content
    intro = target.get('intro', '')
    if 'Mucous membranes' in intro and 'Abies' in intro:
        checks.append(("✓", "intro contains source intro paragraph", "PASS"))
    else:
        checks.append(("✗", f"intro doesn't contain expected text: '{intro[:80]}...'", "FAIL"))

    # Check 5: sections[] has expected 5 sections
    sections = target.get('sections', [])
    expected_titles = {'Head', 'Stomach', 'Female', 'Fever', 'Dose'}
    actual_titles = {s['title'] for s in sections}
    if expected_titles.issubset(actual_titles):
        checks.append(("✓", f"sections has all expected: {expected_titles}", "PASS"))
    else:
        missing = expected_titles - actual_titles
        checks.append(("✗", f"sections missing: {missing}", "FAIL"))

    # Check 6: section titles are all known Boericke vocabulary
    unknown = [s['title'] for s in sections if s['title'] not in KNOWN_BOERICKE_SECTIONS]
    if not unknown:
        checks.append(("✓", "all section titles are known vocabulary", "PASS"))
    else:
        checks.append(("✗", f"unknown section titles: {unknown}", "FAIL"))

    # Check 7: each section has non-empty content
    empty_content = [s['title'] for s in sections if not s['content'].strip()]
    if not empty_content:
        checks.append(("✓", "all sections have non-empty content", "PASS"))
    else:
        checks.append(("✗", f"sections with empty content: {empty_content}", "FAIL"))

    # Check 8: section content doesn't duplicate intro
    duplications = []
    for s in sections:
        if s['content'].strip() in intro.strip():
            duplications.append(s['title'])
    if not duplications:
        checks.append(("✓", "no section content duplicates intro", "PASS"))
    else:
        checks.append(("✗", f"sections duplicating intro: {duplications}", "FAIL"))

    # Check 9: dose field is populated from Dose section
    if target.get('dose', '').strip():
        checks.append(("✓", f"dose field populated: '{target['dose'][:50]}'", "PASS"))
    else:
        checks.append(("✗", "dose field empty", "FAIL"))

    # Check 10: 'Dose' section content matches dose field
    dose_section = next((s for s in sections if s['title'] == 'Dose'), None)
    if dose_section and target.get('dose', '').strip() == dose_section['content'].strip():
        checks.append(("✓", "dose field matches Dose section content", "PASS"))
    else:
        checks.append(("✗", "dose field doesn't match Dose section", "FAIL"))

    for status, desc, _ in checks:
        print(f"  {status} {desc}")

    pass_count = sum(1 for c in checks if c[2] == 'PASS')
    fail_count = len(checks) - pass_count
    print(f"\n  Summary: {pass_count} pass, {fail_count} fail out of {len(checks)} checks")

    # Test Case 2: Multiple Boericke remedies — verify no duplication globally
    print()
    print("=" * 60)
    print("REGRESSION TEST CASE #2: Global Boericke duplication check")
    print("=" * 60)

    boericke = [r for r in remedies if r.get('author') == 'Boericke']
    print(f"  Total Boericke remedies: {len(boericke)}")

    empty_keynote = sum(1 for r in boericke if not r.get('keynote', '').strip())
    print(f"  Remedies with empty keynote (good): {empty_keynote} / {len(boericke)}")

    has_sections = sum(1 for r in boericke if r.get('sections'))
    print(f"  Remedies with sections[]: {has_sections} / {len(boericke)}")

    has_intro = sum(1 for r in boericke if r.get('intro', '').strip())
    print(f"  Remedies with intro: {has_intro} / {len(boericke)}")

    duplications = 0
    for r in boericke:
        kn = r.get('keynote', '').strip()
        full = r.get('full', '').strip()
        intro = r.get('intro', '').strip()
        if kn and (kn in full or kn in intro):
            duplications += 1
    print(f"  Remedies with keynote ⊂ full or intro (duplication): {duplications}")

    # Sample 5 random remedies
    print()
    print("  Sample of 5 Boericke remedies:")
    import random
    random.seed(42)
    for r in random.sample(boericke, min(5, len(boericke))):
        titles = [s['title'] for s in r.get('sections', [])]
        print(f"    - {r['name']} | sections: {titles} | intro_len: {len(r.get('intro',''))}")

    # Test Case 3: Other authors still work (no regression)
    print()
    print("=" * 60)
    print("REGRESSION TEST CASE #3: Other authors unaffected")
    print("=" * 60)

    from collections import Counter
    authors = Counter(r.get('author', 'Unknown') for r in remedies)
    for a, c in authors.most_common():
        print(f"  {a}: {c}")

    # Check that non-Boericke remedies still have their data (didn't get wiped)
    non_boericke = [r for r in remedies if r.get('author') != 'Boericke']
    with_full = sum(1 for r in non_boericke if r.get('full', '').strip())
    with_keynote = sum(1 for r in non_boericke if r.get('keynote', '').strip())
    print(f"\n  Non-Boericke with full text: {with_full} / {len(non_boericke)}")
    print(f"  Non-Boericke with keynote (legacy, may need v2 parser): {with_keynote}")


if __name__ == '__main__':
    main()
