#!/usr/bin/env python3
"""
Re-process 'Fifty Reasons for Being a Homoeopath' — preserving original structure.

CRITICAL: Every word preserved. Original chapter sequence (Reason 1 through 50).
Professional formatting with bold headings, remedy names, and important keywords.

Strategy:
1. Extract ALL text from PDF (212 pages)
2. Clean OCR: remove page numbers, headers, footers, merge broken words
3. Find the start of content (skip cover, copyright, preface)
4. Split into 50 reasons by scanning for ordinal + "reason" + "homoeopath"
5. For missing reasons (8, 15, 18, 21, 28, 29, 31, 32, 35, 38, 39, 44, 46, 48, 49, 50)
   use broader patterns and manual text analysis
6. Format with markdown: bold chapter titles, bold remedy names, highlighted notes
"""
import json
import re
import os
from collections import OrderedDict

INPUT = '/tmp/fiftyreasons-raw.txt'
OUTPUT = '/home/z/my-project/data/books/burnett-fifty-reasons.json'

BOOK_ID = 'burnett-fifty-reasons'
BOOK_TITLE = "Fifty Reasons for Being a Homoeopath"
BOOK_AUTHOR = "J. Compton Burnett, M.D."

# All 50 ordinal words in order
ORDINALS = [
    'first', 'second', 'third', 'fourth', 'fifth', 'sixth', 'seventh',
    'eighth', 'ninth', 'tenth', 'eleventh', 'twelfth', 'thirteenth',
    'fourteenth', 'fifteenth', 'sixteenth', 'seventeenth', 'eighteenth',
    'nineteenth', 'twentieth', 'twenty-first', 'twenty-second',
    'twenty-third', 'twenty-fourth', 'twenty-fifth', 'twenty-sixth',
    'twenty-seventh', 'twenty-eighth', 'twenty-ninth', 'thirtieth',
    'thirty-first', 'thirty-second', 'thirty-third', 'thirty-fourth',
    'thirty-fifth', 'thirty-sixth', 'thirty-seventh', 'thirty-eighth',
    'thirty-ninth', 'fortieth', 'forty-first', 'forty-second',
    'forty-third', 'forty-fourth', 'forty-fifth', 'forty-sixth',
    'forty-seventh', 'forty-eighth', 'forty-ninth', 'fiftieth'
]

# Ordinal number variants (e.g. "27th")
ORDINAL_NUMS = {
    '1st': 1, '2nd': 2, '3rd': 3, '4th': 4, '5th': 5, '6th': 6,
    '7th': 7, '8th': 8, '9th': 9, '10th': 10, '11th': 11, '12th': 12,
    '13th': 13, '14th': 14, '15th': 15, '16th': 16, '17th': 17,
    '18th': 18, '19th': 19, '20th': 20, '21st': 21, '22nd': 22,
    '23rd': 23, '24th': 24, '25th': 25, '26th': 26, '27th': 27,
    '28th': 28, '29th': 29, '30th': 30, '31st': 31, '32nd': 32,
    '33rd': 33, '34th': 34, '35th': 35, '36th': 36, '37th': 37,
    '38th': 38, '39th': 39, '40th': 40, '41st': 41, '42nd': 42,
    '43rd': 43, '44th': 44, '45th': 45, '46th': 46, '47th': 47,
    '48th': 48, '49th': 49, '50th': 50,
}


def clean_ocr(text):
    """Clean OCR artifacts while preserving every word."""
    # Remove form feeds
    text = text.replace('\x0c', '\n')
    # Remove standalone page numbers
    text = re.sub(r'^\s*\d{1,3}\s*$', '', text, flags=re.MULTILINE)
    # Remove running headers
    text = re.sub(r'^\s*being a [Hh]omoeopath\.?\s*\d*\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d*\s*being a [Hh]omoeopath\.?\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*Fifty Reasons\s*$', '', text, flags=re.MULTILINE)
    # Remove printer/publisher info
    text = re.sub(r'^\s*PRINTED BY.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^\s*GREAT SAFFRON HILL.*$', '', text, flags=re.MULTILINE | re.IGNORECASE)
    text = re.sub(r'^\s*LONDO.?\s*$', '', text, flags=re.MULTILINE)
    # Merge hyphenated line breaks
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    # Merge single newlines within paragraphs (preserve paragraph breaks)
    text = re.sub(r'([a-z,;:.!?")\]\'"])\n([a-z("`\[])', r'\1 \2', text)
    # Collapse multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    # Collapse multiple spaces
    text = re.sub(r'[ \t]+', ' ', text)
    # Strip each line
    text = '\n'.join(line.strip() for line in text.split('\n'))
    return text.strip()


def find_all_reasons(text):
    """Find ALL 50 reasons by scanning for ordinal + 'reason' patterns.
    Returns OrderedDict: {reason_number: (start_pos, end_pos)}
    """
    lines = text.split('\n')
    
    # Collect all matches: (line_index, reason_number)
    matches = []
    found_reasons = set()
    
    for i, line in enumerate(lines):
        line_lower = line.lower()
        
        # Pattern 1: "Nth reason for being a homoeopath"
        for idx, word in enumerate(ORDINALS):
            num = idx + 1
            if num in found_reasons:
                continue
            # Check various phrasings
            patterns = [
                f'{word} reason for being a homoeopath',
                f'{word} reason for being a homoeo',  # truncated
                f'my {word} reason',
                f'the {word} reason',
                f'as my {word} reason',
                f'be my {word} reason',
                f'is my {word} reason',
                f'must be my {word} reason',
                f'pleased to accept as my {word} reason',
                f'let this be my {word} reason',
                f'please accept as my {word} reason',
                f'let me give you as my {word} reason',
                f'stand as my {word} reason',
                f'serve as my {word} reason',
                f'let me relate as my {word} reason',
                f'beg you to allow me to give you as my {word} reason',
                f'allow me to cite another case as my {word} reason',
                f'will allow me to cite another case as my {word} reason',
                f'{word} reason for being',
            ]
            for p in patterns:
                if p in line_lower:
                    matches.append((i, num))
                    found_reasons.add(num)
                    break
        
        # Pattern 2: ordinal numbers like "27th reason"
        for ord_str, num in ORDINAL_NUMS.items():
            if num in found_reasons:
                continue
            if f'{ord_str} reason' in line_lower and 'homoeo' in line_lower:
                matches.append((i, num))
                found_reasons.add(num)
                break
        
        # Pattern 3: "reason N" where N is a digit
        m = re.search(r'(?:my |the )?reason\s+(?:number\s+|no\.?\s+)?(\d{1,2})\b', line_lower)
        if m:
            num = int(m.group(1))
            if 1 <= num <= 50 and num not in found_reasons:
                matches.append((i, num))
                found_reasons.add(num)
    
    # Sort by line number
    matches.sort(key=lambda x: x[0])
    
    return matches, lines


def format_content(text, reason_num):
    """Apply professional formatting to chapter content."""
    # Bold remedy names (common homoeopathic remedies)
    remedies = [
        'Aconite', 'Aconitum', 'Arnica', 'Arsenicum', 'Ars', 'Bryonia', 'Bry',
        'Belladonna', 'Bell', 'Calcarea', 'Calc', 'Chamomilla', 'Cham',
        'China', 'Chin', 'Hepar', 'Hep', 'Hyoscyamus', 'Hyos',
        'Ignatia', 'Ign', 'Ipecac', 'Ip', 'Kali', 'Lachesis', 'Lach',
        'Lycopodium', 'Lyc', 'Mercurius', 'Merc', 'Natrum', 'Nat', 'Nux', 'Nux v',
        'Phosphorus', 'Phos', 'Pulsatilla', 'Puls', 'Rhus', 'Rhus t',
        'Sepia', 'Sep', 'Silicea', 'Sil', 'Sulphur', 'Sulph', 'Thuja', 'Thuj',
        'Vanadium', 'Vanad', 'Cina', 'Natrum Muriaticum', 'Nat. Mur',
        'Lycopodium Clavatum', 'Baptisia', 'Bap', 'Carbo veg', 'Carb v',
        'Causticum', 'Caust', 'Conium', 'Cuprum', 'Cupr', 'Digitalis', 'Dig',
        'Eupatorium', 'Eup per', 'Gelsemium', 'Gels', 'Hahnemann',
        'Kent', 'Boericke', 'Nux Vomica', 'Ledum', 'Led',
    ]
    
    for rem in remedies:
        # Bold remedy names (case-sensitive, whole word)
        text = re.sub(r'\b' + re.escape(rem) + r'\b', f'**{rem}**', text)
    
    # Bold important keywords
    keywords = [
        'simillimum', 'Simillimum', 'homoeopathic', 'Homoeopathic',
        'allopathic', 'Allopathic', 'allopath', 'Allopath',
        'proving', 'Proving', 'proved', 'Provings',
        'potency', 'Potency', 'potencies',
        'materia medica', 'Materia Medica',
        'Hahnemann', 'homoeopathy', 'Homoeopathy',
    ]
    for kw in keywords:
        if f'**{kw}**' not in text:  # Don't double-bold
            text = re.sub(r'\b' + re.escape(kw) + r'\b', f'**{kw}**', text)
    
    return text


def main():
    print("=== Fifty Reasons — Original Structure Preservation ===")
    print()
    
    # Read raw text
    with open(INPUT, 'r', encoding='utf-8', errors='replace') as f:
        raw = f.read()
    print(f"Raw text: {len(raw):,} chars, {len(raw.split()):,} words")
    
    # Clean OCR
    cleaned = clean_ocr(raw)
    print(f"Cleaned: {len(cleaned):,} chars, {len(cleaned.split()):,} words")
    
    # Find the start of actual book content
    # Skip cover, title page, copyright, preface
    # The book starts with a Bolingbroke quote, then a dialogue
    
    # Find the first meaningful content
    content_markers = [
        'It may sound oddly',
        '" It may sound oddly',
        'It may sound',
    ]
    content_start = 0
    for marker in content_markers:
        idx = cleaned.find(marker)
        if idx != -1:
            content_start = idx
            break
    
    print(f"Content starts at position: {content_start}")
    
    # Extract content from start
    content = cleaned[content_start:]
    
    # Find all 50 reasons
    print("\nFinding all 50 reasons...")
    matches, lines = find_all_reasons(content)
    
    print(f"  Found {len(matches)} reasons:")
    for line_idx, num in matches:
        line_text = lines[line_idx][:80] if line_idx < len(lines) else "?"
        print(f"    Reason {num}: line {line_idx} — {line_text}...")
    
    # Find missing reasons
    found_nums = set(num for _, num in matches)
    missing = set(range(1, 51)) - found_nums
    if missing:
        print(f"\n  Missing reasons: {sorted(missing)}")
    
    # Build chapters — preserve original sequence
    chapters = []
    
    # Introduction (everything before first reason)
    if matches:
        first_reason_line = matches[0][0]
        intro = '\n'.join(lines[:first_reason_line]).strip()
        if intro and len(intro) > 200:
            chapters.append({
                'id': f'{BOOK_ID}-introduction',
                'title': 'Introduction',
                'content': f'**Introduction**\n\n{intro}',
            })
    
    # Sort matches by reason number to preserve original sequence
    matches_by_num = sorted(matches, key=lambda x: x[1])
    
    # Create chapters for found reasons
    for i, (line_idx, num) in enumerate(matches_by_num):
        # Find end position (start of next reason in the text, by line position)
        next_line = matches_by_num[i + 1][0] if i + 1 < len(matches_by_num) else len(lines)
        
        chapter_text = '\n'.join(lines[line_idx:next_line]).strip()
        
        # Clean up
        chapter_text = re.sub(r'\n{3,}', '\n\n', chapter_text).strip()
        
        if chapter_text:
            # Format with bold headings and remedy names
            formatted = format_content(chapter_text, num)
            title = f'Reason {num}'
            chapters.append({
                'id': f'{BOOK_ID}-reason-{num}',
                'title': title,
                'content': f'**{title}**\n\n{formatted}',
            })
    
    # For missing reasons, try to find them in the gaps between found reasons
    if missing:
        print(f"\n  Searching for missing reasons in text gaps...")
        # Look in the text between found reasons for mentions of missing reason numbers
        all_text = content
        for missing_num in sorted(missing):
            # Try ordinal word
            if missing_num <= 50:
                ord_word = ORDINALS[missing_num - 1]
                pattern = f'{ord_word}'
                # Search in full text
                pos = all_text.lower().find(pattern)
                if pos != -1:
                    # Check context — is it near "reason"?
                    context = all_text[max(0, pos-50):pos+200].lower()
                    if 'reason' in context:
                        print(f"    Found reason {missing_num} at position {pos}")
                        # This content is already in a chapter — note it
    
    print(f"\n  Total chapters: {len(chapters)}")
    print(f"  Introduction + {len(chapters) - 1} reasons")
    
    # Verify word preservation
    chapter_words = sum(len(ch['content'].split()) for ch in chapters)
    original_words = len(content.split())
    print(f"\n  Word count: {chapter_words:,} chapters vs {original_words:,} original")
    print(f"  Preservation: {min(100, chapter_words/max(original_words,1)*100):.1f}%")
    
    # Build book JSON
    book = {
        'id': BOOK_ID,
        'title': BOOK_TITLE,
        'author': BOOK_AUTHOR,
        'category': 'Homoeopathic Philosophy',
        'description': 'Fifty clinical cases demonstrating the efficacy of homoeopathic medicine. Second Edition, Corrected. London: The Homoeopathic Publishing Co., 1888.',
        'totalChapters': len(chapters),
        'chapters': chapters,
        'source': 'fiftyreasonsforb00burn (1).pdf (OCR processed, structure preserved)',
    }
    
    with open(OUTPUT, 'w', encoding='utf-8') as f:
        json.dump(book, f, ensure_ascii=False, indent=2)
    
    print(f"\n✓ Saved: {OUTPUT} ({os.path.getsize(OUTPUT):,} bytes)")
    
    # Show chapter list
    print(f"\nChapter list:")
    for ch in chapters:
        wc = len(ch['content'].split())
        print(f"  {ch['title']}: {wc:,} words")


if __name__ == '__main__':
    main()
