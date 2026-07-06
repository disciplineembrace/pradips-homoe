#!/bin/bash
# OCR Murphy Repertory — efficient batch processing
# Usage: bash ocr_efficient.sh PART_NUM [BATCH_SIZE]
PART=$1
BATCH=${2:-10}
case $PART in
    1) PDF="/home/z/my-project/upload/Medical_Repertory_Part1-1.pdf"; TOTAL=814 ;;
    2) PDF="/home/z/my-project/upload/Medical_Repertory_Part2.pdf"; TOTAL=814 ;;
    3) PDF="/home/z/my-project/upload/Medical_Repertory_Part3.pdf"; TOTAL=815 ;;
esac
CACHE="/home/z/my-project/scripts/murphy_ocr_cache_part${PART}"
mkdir -p "$CACHE"

# Find next uncached page
START=1
for ((i=1; i<=TOTAL; i++)); do
    IDX=$(printf "%04d" $i)
    [ ! -f "$CACHE/page_${IDX}.txt" ] && START=$i && break
    [ $i -eq $TOTAL ] && echo "ALL $TOTAL DONE" && exit 0
done

END=$((START + BATCH - 1))
[ $END -gt $TOTAL ] && END=$TOTAL

echo "Part $PART: OCR pages $START-$END"

for ((i=START; i<=END; i++)); do
    IDX=$(printf "%04d" $i)
    FILE="$CACHE/page_${IDX}.txt"
    [ -f "$FILE" ] && continue
    pdftoppm -f $i -l $i -r 120 -png "$PDF" "/tmp/m${PART}_${i}" 2>/dev/null
    PNG=$(ls /tmp/m${PART}_${i}* 2>/dev/null | head -1)
    [ -z "$PNG" ] && echo "" > "$FILE" && continue
    tesseract "$PNG" - --psm 6 2>/dev/null > "$FILE"
    rm -f "$PNG"
done

DONE=$(ls "$CACHE"/*.txt 2>/dev/null | wc -l)
echo "Part $PART: $DONE/$TOTAL"
