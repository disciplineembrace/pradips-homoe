#!/bin/bash
# Dubey OCR — simple bash loop, processes pages sequentially.
# Survives any single-page failure. Resumes from where it left off.

PDF="/home/z/my-project/data/sources/S_K_Dubey_7th_Ed_compressed.pdf"
PAGES_DIR="/home/z/my-project/data/sources/dubey_pages"
OCR_DIR="/home/z/my-project/data/sources/dubey_ocr"

mkdir -p "$PAGES_DIR" "$OCR_DIR"

TOTAL=759
DONE=0
for i in $(seq 1 $TOTAL); do
    PAGE_NUM=$(printf "%03d" $i)
    TXT="$OCR_DIR/page-$PAGE_NUM.txt"
    
    if [ -s "$TXT" ]; then
        DONE=$((DONE+1))
        continue
    fi
    
    # Render page as PNG
    PREFIX="$PAGES_DIR/p$(printf '%04d' $i)"
    pdftoppm -r 200 -f $i -l $i -png -singlefile "$PDF" "$PREFIX" 2>/dev/null
    
    if [ ! -f "$PREFIX.png" ]; then
        echo "[$i/$TOTAL] render failed"
        continue
    fi
    
    # OCR
    tesseract "$PREFIX.png" "$OCR_DIR/page-$PAGE_NUM" -l eng --psm 6 2>/dev/null
    
    # Cleanup PNG
    rm -f "$PREFIX.png"
    
    DONE=$((DONE+1))
    
    if [ $((i % 10)) -eq 0 ]; then
        echo "[$i/$TOTAL] done ($DONE total)"
    fi
done

echo "=== OCR COMPLETE: $DONE pages ==="
