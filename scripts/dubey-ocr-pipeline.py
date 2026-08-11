#!/usr/bin/env python3
"""
Dubey OCR Pipeline — extracts text from S_K_Dubey_7th_Ed_compressed.pdf
and builds a remedies.json-ready dataset.

The Dubey PDF is scanned (no embedded text), so we must:
1. Render each page as a PNG image (pdftoppm at 200 DPI)
2. OCR each image (tesseract)
3. Parse the OCR text to detect remedy boundaries
4. Build remedy records with structure: name + keynote + full text

This is a LONG-RUNNING pipeline — 759 pages × ~2-3s/page OCR = ~30-40 min.
We parallelize with multiprocessing to bring it down to ~5-10 min.

Output:
- /home/z/my-project/data/sources/dubey-ocr-all.txt (raw OCR per page)
- /home/z/my-project/data/dubey-remedies.json (structured remedies)
"""
import os
import re
import sys
import json
import subprocess
import tempfile
import time
from pathlib import Path
from multiprocessing import Pool, cpu_count

PDF_PATH = '/home/z/my-project/data/sources/S_K_Dubey_7th_Ed_compressed.pdf'
PAGES_DIR = '/home/z/my-project/data/sources/dubey_pages'
OCR_DIR = '/home/z/my-project/data/sources/dubey_ocr'
OUTPUT_REMEDIES = '/home/z/my-project/data/dubey-remedies.json'
OUTPUT_RAW = '/home/z/my-project/data/sources/dubey-ocr-all.txt'

TOTAL_PAGES = 759
DPI = 200  # balance speed vs accuracy

os.makedirs(PAGES_DIR, exist_ok=True)
os.makedirs(OCR_DIR, exist_ok=True)

def render_page(page_num):
    """Render a single PDF page as PNG. Returns path to PNG."""
    out_path = f'{PAGES_DIR}/page-{page_num:03d}.png'
    if os.path.exists(out_path) and os.path.getsize(out_path) > 0:
        return out_path
    try:
        subprocess.run([
            'pdftoppm', '-r', str(DPI), '-f', str(page_num), '-l', str(page_num),
            '-png', PDF_PATH, f'{PAGES_DIR}/page'
        ], check=True, capture_output=True, timeout=60)
        # pdftoppm names files like page-NNN.png — rename to our format
        generated = f'{PAGES_DIR}/page-{page_num:03d}.png'
        # Actually pdftoppm uses the format page-NNN.png with -NNN being zero-padded
        # based on total pages. Let me check what it actually generates
        candidates = list(Path(PAGES_DIR).glob(f'page-*{page_num:03d}*.png')) + \
                     list(Path(PAGES_DIR).glob(f'page-{page_num}.png')) + \
                     list(Path(PAGES_DIR).glob(f'page-{page_num:02d}.png'))
        # If still not found, find any new png
        if not os.path.exists(generated):
            # Look for any PNG that was just created
            pngs = sorted(Path(PAGES_DIR).glob('page-*.png'))
            # Take the last one if it doesn't match our naming
            if pngs:
                actual = str(pngs[-1])
                if actual != generated:
                    os.rename(actual, generated)
        return out_path
    except Exception as e:
        print(f"  [!] render page {page_num} failed: {e}", file=sys.stderr)
        return None

def ocr_page(page_num):
    """Render + OCR a single page. Returns (page_num, text)."""
    txt_path = f'{OCR_DIR}/page-{page_num:03d}'
    if os.path.exists(txt_path + '.txt') and os.path.getsize(txt_path + '.txt') > 0:
        with open(txt_path + '.txt', 'r', encoding='utf-8', errors='ignore') as f:
            return (page_num, f.read())
    
    # Render
    try:
        # Use a unique temp prefix to avoid race conditions
        prefix = f'{PAGES_DIR}/p{page_num:04d}'
        subprocess.run([
            'pdftoppm', '-r', str(DPI), '-f', str(page_num), '-l', str(page_num),
            '-png', '-singlefile', PDF_PATH, prefix
        ], check=True, capture_output=True, timeout=60)
        png_path = prefix + '.png'
        if not os.path.exists(png_path):
            return (page_num, '')
        
        # OCR
        subprocess.run([
            'tesseract', png_path, txt_path, '-l', 'eng', '--psm', '6'
        ], capture_output=True, timeout=120)
        
        # Cleanup PNG to save disk
        os.remove(png_path)
        
        if os.path.exists(txt_path + '.txt'):
            with open(txt_path + '.txt', 'r', encoding='utf-8', errors='ignore') as f:
                return (page_num, f.read())
        return (page_num, '')
    except Exception as e:
        print(f"  [!] OCR page {page_num} failed: {e}", file=sys.stderr)
        return (page_num, '')

def main():
    start_time = time.time()
    print(f"=== DUBEY OCR PIPELINE ===")
    print(f"PDF: {PDF_PATH}")
    print(f"Total pages: {TOTAL_PAGES}")
    print(f"DPI: {DPI}")
    print(f"CPU cores available: {cpu_count()}")
    print()

    # Phase 1: OCR all pages in parallel
    print(f"[1/3] OCR-ing all {TOTAL_PAGES} pages (parallel)...")
    workers = min(cpu_count(), 4)  # don't over-parallelize — tesseract is CPU-heavy
    print(f"      Using {workers} workers")
    
    all_texts = {}
    with Pool(workers) as pool:
        # Process in batches of 50 to show progress
        batch_size = 50
        for batch_start in range(1, TOTAL_PAGES + 1, batch_size):
            batch_end = min(batch_start + batch_size, TOTAL_PAGES + 1)
            page_nums = list(range(batch_start, batch_end))
            results = pool.map(ocr_page, page_nums)
            for pn, txt in results:
                all_texts[pn] = txt
            elapsed = time.time() - start_time
            done = batch_end - 1
            rate = done / elapsed if elapsed > 0 else 0
            eta = (TOTAL_PAGES - done) / rate if rate > 0 else 0
            print(f"      Pages {batch_start}-{done}/{TOTAL_PAGES} ({rate:.1f} pg/s, ETA {eta:.0f}s)")
    
    print(f"      OCR complete in {time.time()-start_time:.0f}s")
    
    # Phase 2: Concatenate all OCR text
    print(f"\n[2/3] Concatenating OCR text...")
    with open(OUTPUT_RAW, 'w', encoding='utf-8') as f:
        for pn in sorted(all_texts.keys()):
            f.write(f"\n\n===== PAGE {pn} =====\n\n")
            f.write(all_texts[pn])
    print(f"      Wrote {os.path.getsize(OUTPUT_RAW):,} bytes to {OUTPUT_RAW}")
    
    # Phase 3: Parse remedies from OCR text
    print(f"\n[3/3] Parsing remedies...")
    remedies = parse_dubey_remedies(all_texts)
    print(f"      Parsed {len(remedies)} remedies")
    
    with open(OUTPUT_REMEDIES, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False, indent=2)
    print(f"      Wrote {os.path.getsize(OUTPUT_REMEDIES):,} bytes to {OUTPUT_REMEDIES}")
    
    total_time = time.time() - start_time
    print(f"\n✓ Done in {total_time:.0f}s ({total_time/60:.1f} min)")
    print(f"  Remedies extracted: {len(remedies)}")
    if remedies:
        print(f"  Sample remedy: {remedies[0]['name']}")
        print(f"  Last remedy: {remedies[-1]['name']}")

def parse_dubey_remedies(all_texts):
    """Parse OCR text into structured remedies.
    
    Dubey structure (based on page 50 sample):
    - Remedy title is a heading (often in title case or all caps) on its own
    - Remedy content includes numbered keynotes + PARTiculars section with
      subtitles (Stomach, Diarrhoea, etc.)
    - Pages have running header with remedy name + page number
    
    Strategy:
    1. Walk pages in order
    2. Detect remedy boundaries by looking for short title-only lines
       followed by keynote content
    3. Accumulate content until next remedy boundary
    """
    remedies = []
    current_remedy = None
    current_content = []
    
    # Common remedy name patterns — Dubey uses standard homeopathic names
    # We detect remedy boundaries by:
    # - A short line (1-4 words, <40 chars)
    # - All words capitalized or all-caps
    # - Followed by content that includes numbered points
    REMEDY_TITLE_PATTERN = re.compile(r'^[A-Z][A-Za-z\s\.\-]{2,40}$')
    
    for page_num in sorted(all_texts.keys()):
        text = all_texts[page_num]
        lines = text.split('\n')
        
        for line in lines:
            line = line.strip()
            if not line:
                continue
            
            # Skip page-number-only lines
            if re.match(r'^\d+$', line):
                continue
            
            # Skip running headers like "Alumina 41"
            if re.match(r'^[A-Z][a-z]+ \d+$', line):
                continue
            
            # Check if this looks like a remedy title
            # (short, capitalized, not a sentence)
            looks_like_title = (
                len(line) < 40 and
                not line.endswith('.') and
                not line.endswith(',') and
                not line.endswith(';') and
                REMEDY_TITLE_PATTERN.match(line) and
                # Must have at least one space-separated word
                len(line.split()) <= 4 and
                # Avoid single common words that aren't remedy names
                line.lower() not in {'mind', 'head', 'eyes', 'ears', 'nose', 'face',
                    'mouth', 'throat', 'stomach', 'abdomen', 'rectum', 'stool',
                    'urinary', 'genitals', 'male', 'female', 'respiratory',
                    'chest', 'heart', 'back', 'extremities', 'skin', 'sleep',
                    'fever', 'modalities', 'relationship', 'dose', 'particulars',
                    'generalities', 'introduction', 'chapter', 'page'}
            )
            
            if looks_like_title and len(line.split()) >= 1:
                # Heuristic: title words should look like a remedy name
                # (Latin-ish, capitalized). Common remedy names include
                # "Alumina", "Nux Vomica", "Arsenicum Album", etc.
                words = line.split()
                # All words should start with uppercase or be common suffixes
                valid_words = all(w[0].isupper() or w.lower() in {'vomica', 'album', 'phos', 'mur', 'sulph', 'nit'} for w in words if w)
                if valid_words and len(line) >= 3:
                    # Save previous remedy
                    if current_remedy and current_content:
                        full_text = '\n'.join(current_content).strip()
                        if len(full_text) > 50:  # skip tiny fragments
                            current_remedy['full'] = full_text
                            current_remedy['keynote'] = full_text[:500]
                            remedies.append(current_remedy)
                    
                    # Start new remedy
                    name = line.title()  # normalize capitalization
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
            
            # Accumulate content
            if current_remedy:
                current_content.append(line)
    
    # Save final remedy
    if current_remedy and current_content:
        full_text = '\n'.join(current_content).strip()
        if len(full_text) > 50:
            current_remedy['full'] = full_text
            current_remedy['keynote'] = full_text[:500]
            remedies.append(current_remedy)
    
    return remedies

if __name__ == '__main__':
    main()
