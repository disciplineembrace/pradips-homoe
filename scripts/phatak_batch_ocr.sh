#!/bin/bash
# OCR all pages of Phatak Materia Medica using Tesseract
# Pages 38-792 contain remedy content (pages 1-37 are front matter/TOC)

PDF="upload/Materia Medica of Homoeopathic Medicines - S.R. Phatak.pdf"
OUTDIR="work/phatak-ocr"
mkdir -p "$OUTDIR"

echo "=== Starting batch OCR of Phatak Materia Medica ==="
echo "PDF: $PDF"
echo "Pages: 38-792 (remedy content)"
echo "Output: $OUTDIR/phatak-ocr-raw.txt"
echo ""

# Extract pages 38-792 as images at 300 DPI, then OCR each
# Process in batches to avoid running out of disk space
START_PAGE=38
END_PAGE=792
BATCH_SIZE=20

> "$OUTDIR/phatak-ocr-raw.txt"

for ((i=START_PAGE; i<=END_PAGE; i+=BATCH_SIZE)); do
  END_BATCH=$((i + BATCH_SIZE - 1))
  if [ $END_BATCH -gt $END_PAGE ]; then
    END_BATCH=$END_PAGE
  fi
  
  echo -n "OCR pages $i-$END_BATCH... "
  
  # Extract batch as images
  pdftoppm -f $i -l $END_BATCH -r 300 -png "$PDF" "$OUTDIR/batch" 2>/dev/null
  
  # OCR each page in the batch
  for img in "$OUTDIR"/batch-*.png; do
    if [ -f "$img" ]; then
      # Extract page number from filename
      pagenum=$(basename "$img" .png | sed 's/batch-//')
      # Remove leading zeros
      pagenum=$((10#$pagenum))
      echo "--- PAGE $pagenum ---" >> "$OUTDIR/phatak-ocr-raw.txt"
      tesseract "$img" stdout 2>/dev/null >> "$OUTDIR/phatak-ocr-raw.txt"
      echo "" >> "$OUTDIR/phatak-ocr-raw.txt"
      rm "$img"
    fi
  done
  
  echo "done"
done

echo ""
echo "=== OCR complete ==="
wc -l "$OUTDIR/phatak-ocr-raw.txt"
wc -c "$OUTDIR/phatak-ocr-raw.txt"
