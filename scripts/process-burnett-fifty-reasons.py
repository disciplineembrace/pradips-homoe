#!/usr/bin/env python3
"""
Process 'fiftyreasonsforb00burn (1).pdf' — complete book import.

"Fifty Reasons for Being a Homoeopath" by J. Compton Burnett, M.D. (1888)

OCR text is already extractable via pdftotext. This script:
1. Cleans OCR artifacts (page numbers, headers, footers, broken words)
2. Identifies the 50 "reasons" as chapters
3. Formats with bold headings and proper hierarchy
4. Saves as data/books/burnett-fifty-reasons.json
5. Registers in books-data.ts

CRITICAL: Every word preserved. No summarization. No skipping.
"""
import json
import re
import os

INPUT = '/tmp/fiftyreasons-raw.txt'
OUTPUT = '/home/z/my-project/data/books/burnett-fifty-reasons.json'
BOOKS_DATA = '/home/z/my-project/src/lib/books-data.ts'

BOOK_ID = 'burnett-fifty-reasons'
BOOK_TITLE = "Fifty Reasons for Being a Homoeopath"
BOOK_AUTHOR = "J. Compton Burnett, M.D."

# Number words for chapter detection
NUMBER_WORDS = {
    'first': 1, 'second': 2, 'third': 3, 'fourth': 4, 'fifth': 5,
    'sixth': 6, 'seventh': 7, 'eighth': 8, 'ninth': 9, 'tenth': 10,
    'eleventh': 11, 'twelfth': 12, 'thirteenth': 13, 'fourteenth': 14,
    'fifteenth': 15, 'sixteenth': 16, 'seventeenth': 17, 'eighteenth': 18,
    'nineteenth': 19, 'twentieth': 20, 'twenty-first': 21, 'twenty-second': 22,
    'twenty-third': 23, 'twenty-fourth': 24, 'twenty-fifth': 25,
    'twenty-sixth': 26, 'twenty-seventh': 27, 'twenty-eighth': 28,
    'twenty-ninth': 29, 'thirtieth': 30, 'thirty-first': 31, 'thirty-second': 32,
    'thirty-third': 33, 'thirty-fourth': 34, 'thirty-fifth': 35,
    'thirty-sixth': 36, 'thirty-seventh': 37, 'thirty-eighth': 38,
    'thirty-ninth': 39, 'fortieth': 40, 'forty-first': 41, 'forty-second': 42,
    'forty-third': 43, 'forty-fourth': 44, 'forty-fifth': 45,
    'forty-sixth': 46, 'forty-seventh': 47, 'forty-eighth': 48,
    'forty-ninth': 49, 'fiftieth': 50,
    '27th': 27, '40th': 40, '42nd': 42, '43rd': 43, '45th': 45,
}


def clean_ocr(text):
    """Clean OCR artifacts."""
    # Remove form feed characters
    text = text.replace('\x0c', '\n')
    # Remove page numbers (standalone numbers on their own line)
    text = re.sub(r'^\s*\d{1,3}\s*$', '', text, flags=re.MULTILINE)
    # Remove running headers like "being a Homoeopath." or "being a homoeopath." 
    # These appear at top/bottom of pages
    text = re.sub(r'^\s*being a [Hh]omoeopath\.?\s*\d*\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d*\s*being a [Hh]omoeopath\.?\s*$', '', text, flags=re.MULTILINE)
    # Remove "Fifty Reasons" running headers
    text = re.sub(r'^\s*Fifty Reasons\s*$', '', text, flags=re.MULTILINE)
    # Remove printer info
    text = re.sub(r'^\s*PRINTED BY.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^\s*GREAT SAFFRON HILL.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^\s*LONDON\s*$', '', text, flags=re.MULTILINE)
    # Remove "LONDOi^" OCR artifact
    text = re.sub(r'^\s*LONDO.\s*$', '', text, flags=re.MULTILINE)
    # Merge hyphenated line breaks: "know-\nledge" → "knowledge"
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    # Merge single-newline within paragraphs (but keep paragraph breaks)
    text = re.sub(r'([a-z,;:.!?")\]])\n([a-z("])', r'\1 \2', text)
    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Strip each line
    text = '\n'.join(line.strip() for line in text.split('\n'))
    return text.strip()


def find_reasons(text):
    """Find all 50 reasons in the text and split into chapters."""
    lines = text.split('\n')
    
    # Find positions where reasons are mentioned
    reason_positions = []
    
    for i, line in enumerate(lines):
        line_lower = line.lower().strip()
        
        # Look for patterns like:
        # "first reason for being a homoeopath"
        # "as my tenth reason for being a homoeopath"
        # "my twenty-second reason for being"
        # "Must be my 27th reason"
        for word, num in NUMBER_WORDS.items():
            pattern = f'{word} reason for being a homoeopath'
            if pattern in line_lower:
                reason_positions.append((i, num, line.strip()))
                break
            # Also check "reason for being a homoeo" (truncated in OCR)
            pattern2 = f'{word} reason for being a homoeo'
            if pattern2 in line_lower:
                reason_positions.append((i, num, line.strip()))
                break
    
    # Also look for "My Nth reason" at start of paragraphs
    for i, line in enumerate(lines):
        line_stripped = line.strip()
        for word, num in NUMBER_WORDS.items():
            if line_stripped.lower().startswith(f'my {word} reason'):
                # Check if not already found
                if num not in [r[1] for r in reason_positions]:
                    reason_positions.append((i, num, line_stripped))
                    break
    
    # Sort by line number
    reason_positions.sort(key=lambda x: x[0])
    
    # Deduplicate by reason number (keep first occurrence)
    seen_nums = set()
    unique_positions = []
    for pos, num, text in reason_positions:
        if num not in seen_nums and 1 <= num <= 50:
            seen_nums.add(num)
            unique_positions.append((pos, num, text))
    
    return unique_positions, lines


def main():
    print("=== Fifty Reasons for Being a Homoeopath — Book Import ===")
    print()
    
    # Read raw text
    with open(INPUT, 'r', encoding='utf-8', errors='replace') as f:
        raw = f.read()
    print(f"Raw text: {len(raw):,} chars, {len(raw.split()):,} words")
    
    # Clean OCR
    print("\nCleaning OCR artifacts...")
    cleaned = clean_ocr(raw)
    print(f"Cleaned text: {len(cleaned):,} chars, {len(cleaned.split()):,} words")
    
    # Find the start of actual content (skip cover, title, copyright, preface)
    # Look for the first "reason" mention
    first_reason_idx = cleaned.lower().find('first reason for being a homoeopath')
    if first_reason_idx == -1:
        first_reason_idx = cleaned.lower().find('first reason')
    
    # Also find the preface/introduction start
    # The book starts with a dialogue, then goes into reasons
    # Let's find where the actual content starts
    content_start = cleaned.find('Fifty Reasons\n                             FOR BEING')
    if content_start == -1:
        content_start = 0
    
    print(f"Content starts at position: {content_start}")
    
    # Find all 50 reasons
    print("\nFinding 50 reasons...")
    reasons, lines = find_reasons(cleaned)
    print(f"  Found {len(reasons)} reasons:")
    for pos, num, text in reasons:
        print(f"    Reason {num}: line {pos} — {text[:80]}...")
    
    # Build chapters
    chapters = []
    
    # If we found reasons, split by them
    if reasons:
        # Add introduction (everything before first reason)
        intro_end = reasons[0][0]
        intro_content = '\n'.join(lines[:intro_end]).strip()
        if intro_content and len(intro_content) > 200:
            chapters.append({
                'id': f'{BOOK_ID}-intro',
                'title': 'Introduction',
                'content': f'**Introduction**\n\n{intro_content}',
            })
        
        # Split by reasons
        for i, (pos, num, _) in enumerate(reasons):
            if i + 1 < len(reasons):
                end_pos = reasons[i + 1][0]
            else:
                end_pos = len(lines)
            
            chapter_content = '\n'.join(lines[pos:end_pos]).strip()
            
            # Create chapter title
            if num <= 50:
                # Convert number to word
                num_word = [k for k, v in NUMBER_WORDS.items() if v == num and len(k) > 2]
                title = f'Reason {num}'
            else:
                title = f'Reason {num}'
            
            chapters.append({
                'id': f'{BOOK_ID}-reason-{num}',
                'title': title,
                'content': f'**{title}**\n\n{chapter_content}',
            })
    else:
        # Fallback: treat entire text as one chapter
        chapters.append({
            'id': f'{BOOK_ID}-full',
            'title': 'Complete Text',
            'content': f'**{BOOK_TITLE}**\n\n{cleaned}',
        })
    
    print(f"\n  Total chapters: {len(chapters)}")
    
    # Build book JSON
    book = {
        'id': BOOK_ID,
        'title': BOOK_TITLE,
        'author': BOOK_AUTHOR,
        'category': 'Homoeopathic Philosophy',
        'description': 'Fifty clinical cases demonstrating the efficacy of homoeopathic medicine, by J. Compton Burnett, M.D. (1888, Second Edition).',
        'totalChapters': len(chapters),
        'chapters': chapters,
        'source': 'fiftyreasonsforb00burn (1).pdf (OCR processed)',
    }
    
    # Save
    os.makedirs(os.path.dirname(OUTPUT), exist_ok=True)
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(book, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Saved: {OUTPUT}")
    print(f"  File size: {os.path.getsize(OUTPUT):,} bytes")
    print(f"  Chapters: {len(chapters)}")
    print(f"  Total words: {len(cleaned.split()):,}")
    
    # Show sample chapter
    if chapters:
        print(f"\n  Sample chapter ({chapters[0]['title']}):")
        print(f"    {chapters[0]['content'][:300]}...")
    
    # Register in books-data.ts
    print(f"\nRegistering in books-data.ts...")
    with open(BOOKS_DATA, 'r') as f:
        content = f.read()
    
    if BOOK_ID not in content:
        # Add to bookIds array
        old_line = "    'organon-bk-sarkar',\n  ];"
        new_line = f"    'organon-bk-sarkar',\n    '{BOOK_ID}',\n  ];"
        content = content.replace(old_line, new_line)
        with open(BOOKS_DATA, 'w') as f:
            f.write(content)
        print(f"  ✓ Added '{BOOK_ID}' to books-data.ts")
    else:
        print(f"  ✓ Already registered in books-data.ts")
    
    print(f"\n✓ Complete! Book imported successfully.")


if __name__ == '__main__':
    main()
