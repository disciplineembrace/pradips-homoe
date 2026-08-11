#!/usr/bin/env python3
"""
Dubey OCR Parser — parses OCR'd text from S_K_Dubey_7th_Ed_compressed.pdf
into structured remedy records.

Reads all page text files from /data/sources/dubey_ocr/page-NNN.txt
and detects remedy boundaries based on Dubey's structure:
- Remedy titles are short capitalized lines (1-4 words)
- Followed by numbered keynotes (1., 2., 3., etc.)
- PARTiculars section with subtitles (Stomach, Diarrhoea, etc.)

Output: /data/dubey-remedies.json
"""
import json, re, os, glob

OCR_DIR = '/home/z/my-project/data/sources/dubey_ocr'
OUT = '/home/z/my-project/data/dubey-remedies.json'

def main():
    # Load all OCR'd pages in order
    page_files = sorted(glob.glob(f'{OCR_DIR}/page-*.txt'))
    print(f"Found {len(page_files)} OCR'd pages")

    if len(page_files) < 100:
        print(f"WARNING: Only {len(page_files)} pages OCR'd. Need 759 for complete parsing.")
        print("Parsing what we have...")

    all_text = []
    for pf in page_files:
        with open(pf, 'r', encoding='utf-8', errors='ignore') as f:
            page_num = int(re.search(r'page-(\d+)', pf).group(1))
            all_text.append((page_num, f.read()))

    # Sort by page number
    all_text.sort(key=lambda x: x[0])

    # Parse remedies
    remedies = []
    current_remedy = None
    current_content = []

    SECTION_WORDS = {
        'mind', 'head', 'eyes', 'ears', 'nose', 'face', 'mouth', 'throat',
        'stomach', 'abdomen', 'rectum', 'stool', 'urinary', 'genitals',
        'male', 'female', 'respiratory', 'chest', 'heart', 'back',
        'extremities', 'skin', 'sleep', 'fever', 'modalities',
        'relationship', 'dose', 'particulars', 'generalities',
        'introduction', 'chapter', 'page', 'diarrhoea', 'constipation',
        'cough', 'headache', 'gastrointestinal', 'circulatory', 'nervous',
        'blood', 'glands', 'tissues', 'region', 'worse', 'better',
        'description', 'symptoms', 'characteristics', 'guiding',
        'clinical', 'pharmacy', 'source', 'habitat', 'preparation',
        'constitution', 'complementary', 'inimical', 'follows', 'compare',
        'mental', 'physical', 'general', 'particular', 'keynote',
        'keynotes', 'important', 'notes', 'observation', 'observations',
        'anthracinum', 'pyrogen', 'psorinum', 'medorrhinum',
        'text', 'book', 'materia', 'medica', 'contents', 'preface',
        'index', 'appendix', 'bibliography', 'reference', 'references',
    }

    REMEDY_TITLE = re.compile(r'^[A-Z][A-Za-z\s\.\-]{2,40}$')

    for page_num, text in all_text:
        lines = text.split('\n')
        for line in lines:
            line = line.strip()
            if not line:
                continue
            # Skip page numbers
            if re.match(r'^\d+$', line):
                continue
            # Skip running headers
            if re.match(r'^[A-Z][a-z]+ \d+$', line):
                continue

            # Check if this looks like a remedy title
            looks_like_title = (
                len(line) < 40 and
                not line.endswith('.') and
                not line.endswith(',') and
                not line.endswith(';') and
                not line.endswith(':') and
                REMEDY_TITLE.match(line) and
                len(line.split()) <= 4 and
                line.lower() not in SECTION_WORDS
            )

            if looks_like_title and len(line) >= 3:
                words = line.split()
                valid_words = all(
                    w[0].isupper() or w.lower() in {
                        'vomica', 'album', 'phos', 'mur', 'sulph', 'nit',
                        'carb', 'sulphuricum', 'muriaticum', 'phosphoricum',
                        'carbonicum', 'metallicum', 'vegetabilis', 'animalis',
                        'castus', 'virosus', 'tigrinum', 'iodatum', 'bromatum',
                        'nigrum', 'aurea', 'viola', 'officinalis',
                    }
                    for w in words if w
                )
                if valid_words:
                    # Save previous remedy
                    if current_remedy and current_content:
                        full_text = '\n'.join(current_content).strip()
                        if len(full_text) > 50:
                            current_remedy['full'] = full_text
                            current_remedy['keynote'] = full_text[:500]
                            remedies.append(current_remedy)

                    name = line.title()
                    remedy_id = 'dubey-mm-' + re.sub(r'[^a-z0-9]+', '-', name.lower()).strip('-')
                    current_remedy = {
                        'id': remedy_id,
                        'name': name,
                        'common': '',
                        'author': 'Dubey',
                        'letter': name[0].upper() if name else '?',
                        'chapter': 'Dubey MM',
                        'organ': '',
                        'modalities': '',
                        'constitution': '',
                        'relationships': '',
                        'dose': '',
                    }
                    current_content = []
                    continue

            if current_remedy:
                current_content.append(line)

    # Save final remedy
    if current_remedy and current_content:
        full_text = '\n'.join(current_content).strip()
        if len(full_text) > 50:
            current_remedy['full'] = full_text
            current_remedy['keynote'] = full_text[:500]
            remedies.append(current_remedy)

    print(f"\nParsed {len(remedies)} remedies from Dubey OCR")
    if remedies:
        print(f"\nFirst 5:")
        for r in remedies[:5]:
            print(f"  - {r['name']} (full len: {len(r.get('full', ''))})")
        print(f"\nLast 3:")
        for r in remedies[-3:]:
            print(f"  - {r['name']} (full len: {len(r.get('full', ''))})")

    with open(OUT, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"\nWrote {os.path.getsize(OUT):,} bytes to {OUT}")

if __name__ == '__main__':
    main()
