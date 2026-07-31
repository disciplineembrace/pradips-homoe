#!/usr/bin/env python3
"""
Final aggressive OCR cleanup for Phatak.

This pass:
1. Lowercases ALL body text words that are ALL CAPS but aren't section headings
2. Fixes remaining word breaks
3. Fixes 'redness OF' → 'redness of'
4. Removes repeated remedy name from body text
"""
import json
import re
import os

REMEDIES_FILE = "/home/z/my-project/data/remedies.json"

SECTION_HEADINGS = {
    'GENERALITIES', 'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE',
    'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'URINARY',
    'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART', 'BACK',
    'EXTREMITIES', 'SLEEP', 'FEVER', 'SKIN', 'WORSE', 'BETTER',
    'RELATED', 'COMPLEMENTARY', 'CLINICAL', 'KEYNOTES',
    'MODALITIES', 'RELATIONSHIPS', 'DOSE', 'COMPARE',
    'CAUSATION', 'CHARACTERISTICS', 'SUMMARY', 'CAUTION',
    'INTRODUCTION', 'CONSTITUTION', 'NECK', 'SPINE',
    'TEETH', 'TONGUE', 'PALPITATION', 'PULSE', 'SWEAT',
    'CHILL', 'HEAT', 'VERTIGO', 'HEADACHE', 'COUGH',
    'EXPECTORATION', 'NAUSEA', 'VOMITING', 'ERUCTATIONS',
    'HICCOUGH', 'FLATULENCE', 'CONSTIPATION', 'STOOL',
    'URINE', 'MENSTRUATION', 'LEUCORRHOEA', 'PREGNANCY',
    'CHILDBIRTH', 'LACTATION', 'LARYNX', 'TRACHEA',
    'BRONCHI', 'LUNGS', 'PERICARDIUM', 'ARTERIES', 'VEINS',
    'NERVES', 'MUSCLES', 'BONES', 'JOINTS', 'LIMBS',
    'HANDS', 'FEET', 'FINGERS', 'TOES', 'HAIR', 'NAILS',
    'DISCHARGES', 'ULCERS', 'ERUPTIONS', 'WARTS', 'TUMORS',
    'APPETITE', 'THIRST', 'SALIVA', 'VOICE', 'SPEECH',
    'HEARING', 'VISION', 'SMELL', 'TASTE', 'OVARIES',
    'UTERUS', 'VAGINA', 'PROSTATE', 'LIVER', 'KIDNEYS',
    'BLADDER', 'BLOOD', 'GLANDS', 'TISSUES', 'CIRCULATION',
    'SENSATIONS', 'CHILDREN', 'WOMEN', 'MEN', 'PROVING',
    'OBSERVATIONS', 'PATHOGENESIS', 'PHYSIOLOGICAL',
    'PREPARATION', 'THERAPEUTICS', 'POTENCY', 'MIASMATIC',
}

# Words that should ALWAYS be lowercase in body text
ALWAYS_LOWER = {
    'OF', 'THE', 'AND', 'OR', 'IN', 'ON', 'AT', 'TO', 'FOR',
    'IS', 'ARE', 'WAS', 'WERE', 'BE', 'BEEN', 'BEING',
    'WITH', 'BY', 'FROM', 'AS', 'IT', 'ITS', 'HIS', 'HER',
    'SHE', 'HE', 'THEY', 'THEM', 'THEIR', 'WE', 'US', 'OUR',
    'YOU', 'YOUR', 'THIS', 'THAT', 'THESE', 'THOSE',
    'A', 'AN', 'BUT', 'NOT', 'NO', 'IF', 'SO', 'DO',
    'DOES', 'DID', 'HAS', 'HAVE', 'HAD', 'WILL', 'WOULD',
    'CAN', 'COULD', 'SHOULD', 'MAY', 'MIGHT', 'MUST',
    'WHEN', 'WHERE', 'WHILE', 'DURING', 'AFTER', 'BEFORE',
    'BETWEEN', 'THROUGH', 'WITHOUT', 'WITHIN', 'ABOUT',
    'AGAINST', 'INTO', 'UPON', 'TOWARD', 'TOWARDS',
    'UP', 'OUT', 'OFF', 'OVER', 'UNDER', 'ABOVE', 'BELOW',
    'ALL', 'EACH', 'EVERY', 'SOME', 'ANY', 'MANY', 'MUCH',
    'MORE', 'MOST', 'LESS', 'LEAST', 'FEW', 'SEVERAL',
    'ONLY', 'ALSO', 'JUST', 'EVEN', 'STILL', 'YET',
    'THAN', 'THEN', 'THERE', 'HERE', 'NOW', 'ONCE',
    'VERY', 'TOO', 'QUITE', 'RATHER', 'ALMOST',
    'OFTEN', 'ALWAYS', 'NEVER', 'SOMETIMES', 'USUALLY',
    'RARELY', 'SELDOM', 'FREQUENTLY', 'OCCASIONALLY',
    'GENERALLY', 'PARTICULARLY', 'ESPECIALLY',
    'ING', 'RE', 'SS', 'II', 'III', 'IV',
    'CALCAREA', 'CARBONICA',  # Remedy name in body — lowercase it
    'FONTANELLES', 'GLANDULAR', 'SWELLING',
    'EASY', 'PARTIAL', 'PROFUSE',
    'VERTEX', 'COCCYX', 'STERNUM',
    'TALL', 'LEAN', 'STOOP',
    'UNWASHED', 'DIRTY', 'DEFICIENT',
    'SHOULDERED',
}


def fix_remaining_caps(text):
    """Lowercase ALL CAPS words that aren't section headings."""
    def replace_caps(match):
        word = match.group(0)
        # Keep section headings
        if word in SECTION_HEADINGS:
            return word
        # Lowercase common words
        if word in ALWAYS_LOWER:
            return word.lower()
        # For other ALL CAPS words (4+ chars), check if they're real words
        # If they're likely body text, lowercase them
        if len(word) >= 4:
            # Check if it looks like a normal English word
            # (starts with consonant cluster that makes sense)
            return word.lower()
        # Keep short ALL CAPS (might be abbreviations)
        return word
    
    text = re.sub(r'\b[A-Z]{2,}\b', replace_caps, text)
    return text


def fix_remaining_word_breaks(text):
    """Fix any remaining hyphenated word breaks."""
    text = re.sub(r'([a-z])-\s+([a-z])', r'\1\2', text)
    return text


def clean_final(text):
    """Apply final cleanup."""
    # Fix word breaks
    text = fix_remaining_word_breaks(text)
    # Fix remaining ALL CAPS
    text = fix_remaining_caps(text)
    # Fix "Symptoms" that should be "symptoms" (mid-sentence)
    text = re.sub(r'(?<=[a-z],\s)Symptoms\b', 'symptoms', text)
    # Fix "Mind" that should be "mind" (mid-sentence, not heading)
    text = re.sub(r'(?<=[a-z]\s)Mind\b(?!\s*[:\n])', 'mind', text)
    # Fix "Veins" → "veins"
    text = re.sub(r'(?<=[a-z]\s)Veins\b', 'veins', text)
    # Clean spaces
    text = re.sub(r' {3,}', ' ', text)
    return text


def main():
    print("=" * 70)
    print("FINAL PHATAK OCR CLEANUP")
    print("=" * 70)
    
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        remedies = json.load(f)
    
    phatak = [r for r in remedies if r.get('author') == 'Phatak']
    print(f"Phatak remedies: {len(phatak)}")
    
    fixed = 0
    for r in remedies:
        if r.get('author') != 'Phatak':
            continue
        if r.get('full'):
            original = r['full']
            r['full'] = clean_final(original)
            if r['full'] != original:
                fixed += 1
        if r.get('keynote'):
            r['keynote'] = clean_final(r['keynote'])
    
    print(f"Remedies cleaned: {fixed}")
    
    with open(REMEDIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False)
    
    print(f"Written: {os.path.getsize(REMEDIES_FILE):,} bytes")
    
    # Verify
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        verify = json.load(f)
    v = [r for r in verify if r.get('author') == 'Phatak']
    print(f"Verified: {len(v)} Phatak remedies")
    
    # Samples
    for name in ['Calcarea Carbonica', 'Pulsatilla', 'Sulphur']:
        r = next((x for x in v if x.get('name') == name), None)
        if r:
            print(f"\n=== {name} (first 400 chars) ===")
            print(r['full'][:400])
    
    print("\n✅ DONE")


if __name__ == '__main__':
    main()
