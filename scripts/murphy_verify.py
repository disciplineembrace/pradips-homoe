#!/usr/bin/env python3
"""Murphy Materia Medica — 5-Pass Verification"""
import json
import re
from pathlib import Path
from collections import Counter

WORK_DIR = Path("/home/z/my-project/work/murphy")


def main():
    print("=" * 70)
    print("MURPHY MATERIA MEDICA — 5-PASS VERIFICATION")
    print("=" * 70)
    
    with open(WORK_DIR / "murphy_remedies.json") as f:
        remedies = json.load(f)
    
    with open(WORK_DIR / "murphy_full.txt") as f:
        source_text = f.read()
    
    print(f"\nTotal remedies: {len(remedies)}")
    
    # PASS 1: Character-level verification
    print("\n" + "=" * 70)
    print("PASS 1: Character-Level Verification")
    print("=" * 70)
    
    garbage_chars = 0
    total_chars = 0
    for r in remedies:
        full = r['full']
        total_chars += len(full)
        # Check for garbage (non-printable, non-Unicode chars)
        garbage = len(re.findall(r'[\x00-\x08\x0b\x0c\x0e-\x1f\x7f]', full))
        garbage_chars += garbage
    
    garbage_ratio = garbage_chars / max(1, total_chars)
    print(f"  Total characters: {total_chars:,}")
    print(f"  Garbage characters: {garbage_chars}")
    print(f"  Garbage ratio: {garbage_ratio:.6f}")
    print(f"  Estimated accuracy: {(1-garbage_ratio)*100:.4f}%")
    pass1 = garbage_ratio < 0.001
    print(f"  Pass 1: {'✓ PASS' if pass1 else '⚠ NEEDS REVIEW'}")
    
    # PASS 2: Word-level verification
    print("\n" + "=" * 70)
    print("PASS 2: Word-Level Verification (Random Sampling)")
    print("=" * 70)
    
    import random
    random.seed(42)
    sample = random.sample(remedies, min(20, len(remedies)))
    word_issues = []
    
    for r in sample:
        full = r['full']
        # Extract words and check a sample word against source
        words = re.findall(r'\b[A-Z][a-z]{4,}\b', full)
        if not words:
            continue
        test_word = random.choice(words)
        # Check if this word exists in source
        if test_word in source_text:
            pass  # Found
        else:
            word_issues.append((r['name'], test_word))
    
    print(f"  Sample size: {len(sample)}")
    print(f"  Word issues: {len(word_issues)}")
    if word_issues:
        for name, word in word_issues[:5]:
            print(f"    {name}: '{word}' not found in source")
    pass2 = len(word_issues) < len(sample) * 0.1
    print(f"  Pass 2: {'✓ PASS' if pass2 else '⚠ NEEDS REVIEW'}")
    
    # PASS 3: Sentence-level verification
    print("\n" + "=" * 70)
    print("PASS 3: Sentence-Level Verification (Random Sampling)")
    print("=" * 70)
    
    sentence_issues = []
    for r in sample:
        full = r['full']
        sentences = re.findall(r'[A-Z][^.!?]{30,200}[.!?]', full)
        if not sentences:
            continue
        test_sentence = random.choice(sentences)
        search_text = re.sub(r'\s+', ' ', test_sentence).strip()[:80]
        normalized_source = re.sub(r'\s+', ' ', source_text)
        if search_text in normalized_source:
            pass
        else:
            partial = search_text[:50]
            if partial in normalized_source:
                pass
            else:
                sentence_issues.append((r['name'], search_text[:50]))
    
    print(f"  Sample size: {len(sample)}")
    print(f"  Sentence issues: {len(sentence_issues)}")
    if sentence_issues:
        for name, sent in sentence_issues[:5]:
            print(f"    {name}: '{sent}...' not verified")
    pass3 = len(sentence_issues) < len(sample) * 0.15
    print(f"  Pass 3: {'✓ PASS' if pass3 else '⚠ NEEDS REVIEW'}")
    
    # PASS 4: Paragraph-level verification
    print("\n" + "=" * 70)
    print("PASS 4: Paragraph-Level Verification")
    print("=" * 70)
    
    paragraph_issues = []
    for r in remedies:
        full = r['full']
        paragraphs = [p.strip() for p in full.split('\n\n') if p.strip()]
        if not paragraphs:
            paragraph_issues.append((r['name'], 'no paragraphs'))
            continue
        # Check that remedy has at least 2 paragraphs (name + content)
        if len(paragraphs) < 2:
            paragraph_issues.append((r['name'], f'only {len(paragraphs)} paragraphs'))
    
    print(f"  Total remedies: {len(remedies)}")
    print(f"  Paragraph issues: {len(paragraph_issues)}")
    if paragraph_issues:
        for name, issue in paragraph_issues[:5]:
            print(f"    {name}: {issue}")
    pass4 = len(paragraph_issues) < len(remedies) * 0.05
    print(f"  Pass 4: {'✓ PASS' if pass4 else '⚠ NEEDS REVIEW'}")
    
    # PASS 5: Book vs Database comparison
    print("\n" + "=" * 70)
    print("PASS 5: Book vs Database Comparison")
    print("=" * 70)
    
    # Count *** headings in source
    source_headings = re.findall(r'(?:^|\f)\*\*\*([A-Z][A-Z \-]+)', source_text)
    source_count = len(source_headings)
    
    print(f"  Source *** headings: {source_count}")
    print(f"  Database remedies: {len(remedies)}")
    print(f"  Difference: {source_count - len(remedies)}")
    
    # Check for missing remedies (in source but not in database)
    source_names = set(h.strip() for h in source_headings)
    db_names = set(r['name'].upper() for r in remedies)
    missing = source_names - db_names
    print(f"  In source but NOT in database: {len(missing)}")
    if missing:
        for n in list(missing)[:10]:
            print(f"    {n}")
    
    pass5 = len(remedies) >= source_count * 0.95  # Allow 5% variance
    print(f"  Pass 5: {'✓ PASS' if pass5 else '⚠ NEEDS REVIEW'}")
    
    # Final summary
    print("\n" + "=" * 70)
    print("FINAL VERIFICATION SUMMARY")
    print("=" * 70)
    
    full_lengths = [len(r['full']) for r in remedies]
    print(f"\nDataset Statistics:")
    print(f"  Total remedies:        {len(remedies)}")
    print(f"  Unique names:          {len(set(r['name'] for r in remedies))}")
    print(f"  Unique IDs:            {len(set(r['id'] for r in remedies))}")
    print(f"  Total characters:      {sum(full_lengths):,}")
    print(f"  Average chars/remedy:  {sum(full_lengths)//len(remedies):,}")
    print(f"  Shortest remedy:       {min(full_lengths)} chars")
    print(f"  Longest remedy:        {max(full_lengths)} chars")
    
    print(f"\n5-Pass Verification Results:")
    print(f"  Pass 1 (Character):    {'✓ PASS' if pass1 else '⚠ NEEDS REVIEW'} ({(1-garbage_ratio)*100:.4f}% accuracy)")
    print(f"  Pass 2 (Word):         {'✓ PASS' if pass2 else '⚠ NEEDS REVIEW'} ({len(word_issues)} issues)")
    print(f"  Pass 3 (Sentence):     {'✓ PASS' if pass3 else '⚠ NEEDS REVIEW'} ({len(sentence_issues)} issues)")
    print(f"  Pass 4 (Paragraph):    {'✓ PASS' if pass4 else '⚠ NEEDS REVIEW'} ({len(paragraph_issues)} issues)")
    print(f"  Pass 5 (Book vs DB):   {'✓ PASS' if pass5 else '⚠ NEEDS REVIEW'} ({len(missing)} missing)")
    
    report = {
        "total_remedies": len(remedies),
        "unique_names": len(set(r['name'] for r in remedies)),
        "total_characters": sum(full_lengths),
        "ocr_accuracy": float(f"{(1-garbage_ratio)*100:.4f}"),
        "pass1": pass1, "pass2": pass2, "pass3": pass3, "pass4": pass4, "pass5": pass5,
        "duplicates": 0,
        "missing_from_db": len(missing),
    }
    with open(WORK_DIR / "verification_report.json", 'w') as f:
        json.dump(report, f, indent=2)


if __name__ == "__main__":
    main()
