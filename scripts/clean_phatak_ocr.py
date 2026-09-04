#!/usr/bin/env python3
"""
Clean OCR errors in ALL Phatak remedies.

Fixes:
1. Word breaks: 'dur- ing' → 'during', 'chil- dren' → 'children'
2. Mixed case OCR errors: 'LocaL' → 'local', 'BuRNING' → 'burning'
3. Random ALL CAPS in body text: 'SHOCK' → 'shock' (but keep section headings)
4. Specific word fixes: 'Minn' → 'Mind', 'BLoop' → 'BLOOD'
5. Con- GESTION → congestion (broken across lines)
"""
import json
import re
import os
from datetime import datetime
import shutil

REMEDIES_FILE = "/home/z/my-project/data/remedies.json"

# Legitimate ALL-CAPS section headings (should stay uppercase)
SECTION_HEADINGS = {
    'GENERALITIES', 'MIND', 'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE',
    'MOUTH', 'THROAT', 'STOMACH', 'ABDOMEN', 'RECTUM', 'URINARY',
    'MALE', 'FEMALE', 'RESPIRATORY', 'CHEST', 'HEART', 'BACK',
    'EXTREMITIES', 'SLEEP', 'FEVER', 'SKIN', 'WORSE', 'BETTER',
    'RELATED', 'COMPLEMENTARY', 'CLINICAL', 'KEYNOTES',
    'MODALITIES', 'RELATIONSHIPS', 'DOSE', 'COMPARE',
    'CAUSATION', 'CHARACTERISTICS', 'SUMMARY', 'CAUTION',
    'INTRODUCTION', 'CONSTITUTION', 'NECK', 'SPINE',
    'LARYNX', 'TRACHEA', 'BRONCHI', 'LUNGS',
    'TEETH', 'TONGUE', 'SALIVA', 'VOICE', 'SPEECH',
    'HEARING', 'VISION', 'SMELL', 'TASTE', 'APPETITE',
    'THIRST', 'VOMITING', 'NAUSEA', 'ERUCTATIONS',
    'HICCOUGH', 'FLATULENCE', 'CONSTIPATION', 'STOOL',
    'URINE', 'SEXUAL', 'MENSTRUATION', 'LEUCORRHOEA',
    'PREGNANCY', 'CHILDBIRTH', 'LACTATION', 'CHILDREN',
    'WOMEN', 'MEN', 'PROVING', 'OBSERVATIONS',
    'PALPITATION', 'PULSE', 'SWEAT', 'CHILL', 'HEAT',
    'VERTIGO', 'HEADACHE', 'COUGH', 'EXPECTORATION',
    'CIRCULATION', 'SENSATIONS', 'TISSUES', 'GLANDS',
    'BLOOD', 'LIVER', 'KIDNEYS', 'BLADDER', 'PROSTATE',
    'OVARIES', 'UTERUS', 'VAGINA', 'PERICARDIUM',
    'ARTERIES', 'VEINS', 'NERVES', 'MUSCLES', 'BONES',
    'JOINTS', 'LIMBS', 'HANDS', 'FEET', 'FINGERS', 'TOES',
    'HAIR', 'NAILS', 'DISCHARGES', 'ULCERS', 'ERUPTIONS',
    'WARTS', 'TUMORS', 'CANCER', 'TUBERCULOSIS',
    'DISPOSITION', 'PATHOGENESIS', 'PHYSIOLOGICAL',
    'PREPARATION', 'THERAPEUTICS', 'THERAPEUTIC',
    'BIOCHEMIC', 'GLOSSARY', 'POTENCY', 'MIASMATIC',
    'MIASM', 'COLLATERAL', 'INIMICAL', 'ANTIDOTE',
    'ANTIDOTES', 'COMPLEMENTARY', 'CONCEPTION',
    'PARTURITION', 'PERINEUM', 'ABSORPTION',
    'AFFINITIES', 'ACTION', 'PICTURE', 'DRUG',
    'RANGE', 'SPHERE', 'COUGH',
}

# Specific word fixes (OCR misreads)
WORD_FIXES = {
    'Minn': 'Mind',
    'BLoop': 'BLOOD',
    'Hrap': 'HEAD',
    'CoLp': 'COLD',
    'LarcE': 'LARGE',
    'HarD': 'HARD',
    'DiaTaTIon': 'DILATATION',
    'Batuinac': 'BATHING',
    'ExzErTION': 'EXERTION',
    'Mrxk': 'MILK',
    'CotpNgss': 'COLDNESS',
    'SouR': 'SOUR',
    'SwEAT': 'SWEAT',
    'LocaL': 'local',
    'BuRNING': 'burning',
    'CON-': 'con',
    'PRO-': 'pro',
    'PRE-': 'pre',
    'DIS-': 'dis',
}


def fix_word_breaks(text):
    """Fix hyphenated word breaks from OCR line wrapping."""
    # Pattern: lowercase letter + hyphen + space(s) + lowercase letter
    # e.g., 'dur- ing' → 'during', 'chil- dren' → 'children'
    text = re.sub(r'([a-z])-\s+([a-z])', r'\1\2', text)
    # Pattern: uppercase + hyphen + space + uppercase (CON- GESTION)
    text = re.sub(r'([A-Z]+)-\s+([A-Z]+)', lambda m: m.group(1) + m.group(2) if len(m.group(1)) <= 4 else m.group(0), text)
    return text


def fix_mixed_case(text):
    """Fix mixed-case OCR errors like 'LocaL' → 'local', 'BuRNING' → 'burning'."""
    def fix_word(match):
        word = match.group(0)
        # Don't touch section headings
        if word.upper() in SECTION_HEADINGS:
            return word
        # Don't touch proper nouns (start with capital, rest lowercase)
        if word[0].isupper() and word[1:].islower():
            return word
        # Don't touch all-caps words that are section headings
        if word.isupper() and word in SECTION_HEADINGS:
            return word
        # Fix mixed case: if it has both upper and lower and isn't a proper noun
        if word[0].isupper() and any(c.isupper() for c in word[1:]) and any(c.islower() for c in word):
            # This is likely an OCR error — make it lowercase (it's body text)
            return word.lower()
        return word
    
    # Match words 4+ chars with mixed case
    text = re.sub(r'\b[A-Z][a-zA-Z]{3,}\b', fix_word, text)
    return text


def fix_random_caps(text):
    """
    Fix random ALL CAPS words in body text.
    Keep section headings uppercase, lowercase everything else.
    """
    def fix_caps_word(match):
        word = match.group(0)
        # Keep section headings
        if word in SECTION_HEADINGS:
            return word
        # Keep acronyms (2-3 chars)
        if len(word) <= 3:
            return word
        # Keep known medical abbreviations
        if word in {'BLOOD', 'DNA', 'RNA', 'CNS', 'CSF', 'ECG', 'EEG', 'EMG', 'GI', 'GU', 'ENT', 'OB', 'GYN', 'UTI', 'URI', 'SA', 'AV', 'BP', 'HR', 'RR'}:
            return word
        # If it's a common English word in ALL CAPS, lowercase it
        common_words = {
            'SHOCK', 'FEAR', 'RESTLESSNESS', 'FREQUENT', 'VIOLENT', 'SNEEZING',
            'CEREBRO', 'SPINAL', 'AXIS', 'DRYNESS', 'LARGE', 'SMALL',
            'BURNING', 'THROBBING', 'CONGESTION', 'REDNESS', 'ORIFICES',
            'NUTRITION', 'THIRSTLESSNESS', 'CHILLINESS', 'SHORTNESS',
            'DISCHARGES', 'PROFUSE', 'BLAND', 'CHANGING', 'SHIFTING',
            'MEMBRANES', 'ACUTE', 'CHRONIC', 'PAIN', 'PAINS', 'WEAKNESS',
            'SWELLING', 'INFLAMMATION', 'CONGESTION', 'SECRETION',
            'EXCRETION', 'CIRCULATION', 'DIGESTION', 'ASSIMILATION',
            'FUNCTION', 'FUNCTIONS', 'ORGAN', 'ORGANS', 'SYSTEM',
            'SYSTEMS', 'DISEASE', 'DISEASES', 'SYMPTOM', 'SYMPTOMS',
            'CONDITION', 'CONDITIONS', 'COMPLAINT', 'COMPLAINTS',
            'PATIENT', 'PATIENTS', 'WOMAN', 'WOMEN', 'CHILD', 'CHILDREN',
            'INFANT', 'INFANTS', 'ADULT', 'ADULTS', 'MALE', 'FEMALE',
            'RIGHT', 'LEFT', 'UPPER', 'LOWER', 'INNER', 'OUTER',
            'FRONT', 'BACK', 'SIDE', 'TOP', 'BOTTOM',
            'MORNING', 'EVENING', 'NIGHT', 'AFTERNOON', 'NOON',
            'SUDDEN', 'GRADUAL', 'SLOW', 'RAPID', 'QUICK',
            'SEVERE', 'MILD', 'MODERATE', 'SLIGHT', 'INTENSE',
            'SHARP', 'DULL', 'STITCHING', 'CUTTING', 'TEARING',
            'BORING', 'BURROWING', 'CRAMPING', 'CRAMP',
            'SPREADING', 'RADIATING', 'SHOOTING', 'FLYING',
            'WANDERING', 'SHIFTING', 'MOVING', 'RISING',
            'FALLING', 'DESCENDING', 'ASCENDING',
            'COLD', 'HOT', 'WARM', 'COOL', 'CHILLY',
            'DRY', 'MOIST', 'WET', 'DAMP',
            'HARD', 'SOFT', 'SMOOTH', 'ROUGH',
            'DARK', 'PALE', 'RED', 'BLUE', 'WHITE', 'YELLOW',
            'BLACK', 'GREEN', 'BROWN', 'PURPLE',
            'LOUD', 'NOISY', 'SILENT', 'QUIET',
            'THICK', 'THIN', 'WATERY', 'MUCUS', 'MUCOID',
            'FOUL', 'OFFENSIVE', 'SWEET', 'SOUR', 'BITTER',
            'SALT', 'SALTY', 'INSIPID', 'TASTELESS',
            'OPEN', 'CLOSED', 'TIGHT', 'LOOSE',
            'STRICT', 'CONSTRICTED', 'COMPRESSED',
            'RELAXED', 'LAX', 'FLABBY', 'FIRM',
            'SOLID', 'HOLLOW', 'EMPTY', 'FULL',
            'HEAVY', 'LIGHT', 'WEIGHT',
            'ANXIETY', 'FEAR', 'ANGER', 'IRRITABILITY',
            'SADNESS', 'GRIEF', 'JOY', 'HAPPINESS',
            'CONFUSION', 'DELIRIUM', 'COMA',
            'PARALYSIS', 'TREMOR', 'TREMbling'.upper(),
            'SPASM', 'CONVULSION', 'CONVULSIONS',
            'WEAK', 'STRONG', 'POWERFUL',
            'INCREASED', 'DECREASED', 'DIMINISHED',
            'SUPPRESSED', 'ARRESTED', 'CHECKED',
            'RELIEVED', 'AMELIORATED', 'AGGRAVATED',
            'WORSE', 'BETTER', 'IMPROVED',
            'STANDING', 'SITTING', 'LYING', 'WALKING',
            'MOVING', 'REST', 'MOTION', 'EXERTION',
            'PRESSURE', 'TOUCH', 'RUBBING',
            'HEAT', 'COLD', 'AIR', 'WIND',
            'WET', 'DRY', 'MOIST', 'DAMP',
            'WEATHER', 'CLIMATE', 'SEASON',
            'SUMMER', 'WINTER', 'SPRING', 'AUTUMN',
            'FOOD', 'DRINK', 'WATER', 'MILK',
            'COFFEE', 'TEA', 'ALCOHOL', 'WINE',
            'TOBACCO', 'SMOKING',
            'MENSES', 'MENSTRUATION', 'PREGNANCY',
            'LACTATION', 'CHILDBIRTH', 'PARTURITION',
            'COITION', 'SEXUAL',
            'SLEEP', 'WAKING', 'DREAM',
            'DREAMS', 'NIGHTMARE',
            'APPETITE', 'THIRST', 'HUNGER',
            'NAUSEA', 'VOMITING', 'ERUCTATION',
            'FLATULENCE', 'BLOATING',
            'URINE', 'URINATION', 'MICTURITION',
            'STOOL', 'DIARRHEA', 'DIARRHOEA',
            'CONSTIPATION', 'DYSENTERY',
            'COUGH', 'EXPECTORATION',
            'BREATHING', 'DYSPNEA', 'DYSPNOEA',
            'PERSPIRATION', 'SWEAT',
            'FEVER', 'CHILL', 'HEAT',
            'PULSE', 'PALPITATION',
            'FAINTNESS', 'SYNCOPE',
            'GIDDINESS', 'VERTIGO',
            'HEADACHE', 'PAIN',
            'ERUPTION', 'ERUPTIONS',
            'ITCHING', 'ULCER', 'ULCERS',
            'WART', 'WARTS', 'TUMOR', 'TUMORS',
            'CYST', 'CYSTS', 'POLYP', 'POLYPI',
            'ABSCES', 'ABSCESS',
            'SUPPURATION', 'PUS',
            'HEMORRHAGE', 'BLEEDING',
            'CONGESTION', 'INFLAMMATION',
            'SWELLING', 'EDEMA',
            'INDURATION', 'HARDENING',
            'SOFTENING', 'ATROPHY',
            'HYPERTROPHY', 'ENLARGEMENT',
            'CONTRACTION', 'RELAXATION',
            'DILATATION', 'EXPANSION',
            'COMPRESSION', 'DISTENSION',
            'RETENTION', 'SUPPRESSION',
            'SECRETION', 'EXCRETION',
            'ABSORPTION', 'ELIMINATION',
            'ASSIMILATION', 'DIGESTION',
            'CIRCULATION', 'OXYGENATION',
            'INNERVATION', 'STIMULATION',
            'DEPRESSION', 'EXCITATION',
            'IRRITATION', 'SOOTHING',
            'CONGESTION', 'STASIS',
            'RETENTION', 'ELIMINATION',
            'NUTRITION', 'MALNUTRITION',
            'METABOLISM', 'ANABOLISM', 'CATABOLISM',
        }
        if word in common_words:
            # Check context — if preceded by a section heading + ':', keep as is
            # Otherwise lowercase it
            return word.lower()
        # Keep unknown CAPS words (might be legitimate)
        return word
    
    # Only fix ALL CAPS words 4+ chars that aren't section headings
    text = re.sub(r'\b[A-Z]{4,}\b', fix_caps_word, text)
    return text


def fix_specific_words(text):
    """Apply specific word fixes."""
    for wrong, right in WORD_FIXES.items():
        text = text.replace(wrong, right)
    return text


def clean_remedy_text(text):
    """Apply all OCR fixes to a remedy's full text."""
    if not text:
        return text
    
    # 1. Fix word breaks first
    text = fix_word_breaks(text)
    
    # 2. Fix specific known OCR errors
    text = fix_specific_words(text)
    
    # 3. Fix mixed case
    text = fix_mixed_case(text)
    
    # 4. Fix random ALL CAPS in body text
    text = fix_random_caps(text)
    
    # 5. Clean up multiple spaces
    text = re.sub(r' {3,}', ' ', text)
    
    # 6. Clean up multiple blank lines
    text = re.sub(r'\n{3,}', '\n\n', text)
    
    return text


def main():
    print("=" * 70)
    print("CLEAN ALL PHATAK OCR ERRORS")
    print("=" * 70)
    
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        remedies = json.load(f)
    
    phatak = [r for r in remedies if r.get('author') == 'Phatak']
    print(f"Phatak remedies: {len(phatak)}")
    
    # Backup
    backup_dir = "/home/z/my-project/data/backups"
    os.makedirs(backup_dir, exist_ok=True)
    ts = datetime.now().strftime("%Y%m%d-%H%M%S")
    shutil.copy2(REMEDIES_FILE, os.path.join(backup_dir, f"remedies-{ts}.json"))
    
    # Fix each Phatak remedy
    fixed_count = 0
    for r in remedies:
        if r.get('author') != 'Phatak':
            continue
        
        changed = False
        for field in ['full', 'keynote']:
            if r.get(field):
                original = r[field]
                cleaned = clean_remedy_text(original)
                if cleaned != original:
                    r[field] = cleaned
                    changed = True
        
        if changed:
            fixed_count += 1
    
    print(f"Remedies cleaned: {fixed_count}")
    
    # Write
    with open(REMEDIES_FILE, 'w', encoding='utf-8') as f:
        json.dump(remedies, f, ensure_ascii=False)
    
    size = os.path.getsize(REMEDIES_FILE)
    print(f"Written: {size:,} bytes ({size/1024/1024:.1f} MB)")
    
    # Verify
    with open(REMEDIES_FILE, 'r', encoding='utf-8') as f:
        verify = json.load(f)
    v_phatak = [r for r in verify if r.get('author') == 'Phatak']
    print(f"Verified: {len(v_phatak)} Phatak remedies")
    
    # Show sample
    calc = next((r for r in v_phatak if 'calcarea carb' in r.get('name', '').lower()), None)
    if calc:
        print(f"\n=== Calcarea Carbonica (first 300 chars after cleaning) ===")
        print(calc['full'][:300])
    
    puls = next((r for r in v_phatak if r.get('name') == 'Pulsatilla'), None)
    if puls:
        print(f"\n=== Pulsatilla (first 300 chars after cleaning) ===")
        print(puls['full'][:300])
    
    print("\n" + "=" * 70)
    print("✅ OCR CLEANING COMPLETE")
    print("=" * 70)


if __name__ == '__main__':
    main()
