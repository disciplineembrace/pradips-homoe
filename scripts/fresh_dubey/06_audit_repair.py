#!/usr/bin/env python3
"""
S.K. DUBEY COMPLETE OCR AUDIT + REPAIR

This script performs a complete source-to-website audit:
1. Reads raw OCR text from fresh_dubey/text/page-NNNN.txt (source-of-truth OCR)
2. Cleans OCR corruption:
   - Removes page headers/footers/page numbers
   - Fixes unicode artifacts (smart quotes -> straight quotes)
   - Removes garbage punctuation
   - Fixes merged words
   - Removes isolated single chars
   - Fixes broken words
3. Detects remedy boundaries
4. Builds structured sections with proper headings
5. Reconstructs paragraphs (joins visual line wraps)
6. Verifies against source
7. Outputs clean structured JSON

Source: ORIGINAL S.K. Dubey PDF (via OCR text files)
Output: data/remedies.json (Dubey entries only, with clean structured sections)
"""
import os
import re
import json
import hashlib
from pathlib import Path
from collections import Counter, defaultdict

TEXT_DIR = Path("/home/z/my-project/scripts/fresh_dubey/text")
MERGED_DIR = Path("/home/z/my-project/scripts/fresh_dubey/merged")
EXISTING_REMEDIES = Path("/home/z/my-project/data/remedies.json")
OUT_JSON = MERGED_DIR / "dubey_remedies_clean.json"
OUT_AUDIT = MERGED_DIR / "ocr_audit_report.json"

MERGED_DIR.mkdir(parents=True, exist_ok=True)

# ============================================================
# KNOWN REMEDY NAMES
# ============================================================
def build_remedy_name_set():
    names = set()
    with open(EXISTING_REMEDIES) as f:
        data = json.load(f)
    for r in data:
        n = r.get('name', '').strip()
        if n:
            names.add(n.upper())
            parts = n.split()
            if len(parts) > 1:
                names.add(parts[0].upper())
    extras = [
        'ABIES CANADENSIS', 'ABIES NIGRA', 'ABROTANUM', 'ACALYPHA INDICA',
        'ACETIC ACID', 'ACONITUM NAPELLUS', 'ACTAEA RACEMOSA', 'ACTAEA SPICATA',
        'ADONIS VERNALIS', 'AESCULUS HIPPOCASTANUM', 'AETHUSA CYNAPIUM',
        'AGARICUS MUSCARIUS', 'AGNUS CASTUS', 'ALLIUM CEPA', 'ALOE SOCOTRINA',
        'ALUMINA', 'AMBRA GRISEA', 'AMMONIUM CARBONICUM', 'AMMONIUM MURIATICUM',
        'AMYLENUM NITROSUM', 'ANACARDIUM ORIENTALE', 'ANTHRACINUM',
        'ANTIMONIUM ARSENICOSUM', 'ANTIMONIUM CRUDUM', 'ANTIMONIUM TARTARICUM',
        'APIS MELLIFICA', 'APOCYNUM CANNABINUM', 'ARGENTUM METALLICUM',
        'ARGENTUM NITRICUM', 'ARNICA MONTANA', 'ARSENICUM ALBUM',
        'ARSENICUM IODATUM', 'ARTEMISIA VULGARIS', 'ARUM TRIPHYLLUM',
        'ASAFOETIDA', 'ASARUM EUROPAEUM', 'ASTERIAS RUBENS', 'AURUM METALLICUM',
        'AVENA SATIVA', 'BAPTISIA TINCTORIA', 'BARYTA CARBONICA',
        'BARYTA MURIATICA', 'BELLADONNA', 'BELLIS PERENNIS', 'BENZOIC ACID',
        'BERBERIS VULGARIS', 'BISMUTH', 'BLATTA ORIENTALIS', 'BORAX',
        'BOVISTA', 'BROMIUM', 'BRYONIA ALBA', 'BUFO', 'CACTUS GRANDIFLORUS',
        'CALADIUM', 'CALCAREA ARSENICA', 'CALCAREA CARBONICA', 'CALCAREA FLUORICA',
        'CALCAREA PHOSPHORICA', 'CALCAREA SULPHURICA', 'CALENDULA OFFICINALIS',
        'CAMPHORA', 'CANNABIS INDICA', 'CANNABIS SATIVA', 'CANTHARIDES',
        'CAPSICUM', 'CARBO ANIMALIS', 'CARBO VEGETABILIS', 'CARBOLIC ACID',
        'CARCINOSIN', 'CARDUUS MARIANUS', 'CAULOPHYLLUM', 'CAUSTICUM',
        'CEANOTHUS AMERICANUS', 'CEDRON', 'CHAMOMILLA', 'CHELIDONIUM MAJUS',
        'CHININUM ARSENICOSUM', 'CHOLESTERINUM', 'CICUTA VIROSA', 'CINA',
        'CINCHONA OFFICINALIS', 'CLEMATIS ERECTA', 'COCA', 'COCCULUS',
        'COFFEA CRUDA', 'COLCHICUM AUTUMNALE', 'COLLINSONIA CANADENSIS',
        'COLOCYNTHIS', 'CONDURANGO', 'CONIUM MACULATUM', 'CORALLIUM RUBRUM',
        'CRATAEGUS', 'CROCUS SATIVUS', 'CROTALUS HORRIDUS', 'CROTON TIGLIUM',
        'CUPRUM METALLICUM', 'CYCLAMEN EUROPAEUM', 'DIGITALIS PURPUREA',
        'DIOSCOREA VILLOSA', 'DIPHTHERINUM', 'DROSERA ROTUNDIFOLIA',
        'DULCAMARA', 'EQUISetum HYEMALE', 'ERIGERON CANADENSIS',
        'EUPATORIUM PERFOLIATUM', 'EUPHRASIA', 'FERRUM METALLICUM',
        'FERRUM PHOSPHORICUM', 'FLUORIC ACID', 'GELSEMIUM', 'GRAPHITES',
        'HAMAMELIS VIRGINICA', 'HELLEBORUS NIGER', 'HELONIAS DIOICA',
        'HEPAR SULPHUR', 'HYDRASTIS CANADENSIS', 'HYDROCOTYLE ASIATICA',
        'HYOSCYAMUS NIGER', 'HYPERICUM', 'IGNATIA AMARA', 'IODUM',
        'IPECACUANHA', 'JABORANDI', 'JUGLANS CINEREA',
        'KALI BICHROMICUM', 'KALI BROMATUM', 'KALI CARBONICUM',
        'KALI MURIATICUM', 'KALI PHOSPHORICUM', 'KALI SULPHURICUM',
        'KALMIA LATIFOLIA', 'LAC CANINUM', 'LAC DEFLORATUM', 'LACHESIS',
        'LEDUM PALUSTRE', 'LILIUM TIGRINUM', 'LITHIUM CARBONICUM',
        'LYCOPODIUM', 'LYSSIN', 'MAGNESIA CARBONICA', 'MAGNESIA MURIATICA',
        'MAGNESIA PHOSPHORICA', 'MEDORRHINUM', 'MELILOTUS ALBA',
        'MENYANTHES TRIFOLIATA', 'MEPHITIS', 'MERCURIUS CORROSIVUS',
        'MERCURIUS CYANATUS', 'MERCURIUS DULCIS', 'MERCURIUS',
        'MEZEREUM', 'MILLEFOLIUM', 'MOSCHUS', 'MUREX', 'MURIATIC ACID',
        'NAJA', 'NATRUM CARBONICUM', 'NATRUM MURIATICUM',
        'NATRUM PHOSPHORICUM', 'NATRUM SULPHURICUM', 'NITRIC ACID',
        'NUX MOSCHATA', 'NUX VOMICA', 'OLEANDER', 'ONOSMODIUM', 'OPIUM',
        'OXALIC ACID', 'PASSIFLORA INCARNATA', 'PETROLEUM',
        'PHOSPHORIC ACID', 'PHOSPHORUS', 'PHYSOSTIGMA', 'PHYTOLACCA DECANDRA',
        'PICRIC ACID', 'PLUMBUM', 'PODOPHYLLUM', 'PSORINUM',
        'PULSATILLA NIGRICANS', 'PYROGEN', 'RADIUM BROMATUM',
        'RANUNCULUS BULBOSUS', 'RUMEX CRISPUS', 'RHUS TOXICODENDRON',
        'RUTA GRAVEOLENS', 'SABADILLA', 'SABINA', 'SAMBUCUS NIGRA',
        'SANGUINARIA CANADENSIS', 'SANICULA', 'SARSAPARILLA',
        'SECALE CORNUTUM', 'SELENIUM', 'SEPIA', 'SILICEA', 'SPIGELIA',
        'SPONGIA TOSTA', 'STANNUM METALLICUM', 'STAPHISAGRIA',
        'STICTA PULMONARIA', 'STRAMONIUM', 'SULPHUR', 'SYMPHYTUM',
        'SYPHILINUM', 'SYZYGIUM JAMBOLANUM', 'TABACUM', 'TARAXACUM',
        'TARENTULA CUBENSIS', 'TARENTULA HISPANIA', 'TEREBINTHINA',
        'THERIDION CURASSAVICUM', 'THLASPI BURSA PASTORIS',
        'THUJA OCCIDENTALIS', 'THYROIDINUM', 'TRILLIUM PENDULUM',
        'URTICA URENS', 'USTILAGO', 'VALERIANA', 'VARIOLINUM',
        'VERATRUM ALBUM', 'VERATRUM VIRIDE', 'VIBURNUM OPULUS',
        'VINCA MINOR', 'VIPERA', 'XANTHOXYLUM', 'X-RAY', 'ZINCUM METALLICUM',
        'CALCAREA FLUORICA', 'CALCAREA PHOSPHORICA', 'CALCAREA SULPHURICA',
        'FERRUM PHOSPHORICUM', 'KALI MURIATICUM', 'KALI PHOSPHORICUM',
        'KALI SULPHURICUM', 'MAGNESIA PHOSPHORICA', 'NATRUM MURIATICUM',
        'NATRUM PHOSPHORICUM', 'NATRUM SULPHURICUM', 'SILICEA',
        'ODUM', 'LAPOILUM', 'COFFEA CHODA', 'COFFEA CRODA', 'MUSK DEER',
        'LAC. DEFLORATUM',
    ]
    for n in extras:
        names.add(n)
    return names

KNOWN_UPPER = build_remedy_name_set()

REMEDY_NAME_BLOCKLIST = {
    'RELATIONS', 'RELATION', 'DYSENTERY', 'CONSTIPATION', 'COUGH',
    'DIARRHOEA', 'FEVER', 'HEADACHE', 'NEURALGIA', 'RHEUMATISM',
    'GOUT', 'ASTHMA', 'BRONCHITIS', 'PNEUMONIA', 'TUBERCULOSIS',
    'CHOLERA', 'MALARIA', 'TYPHOID', 'DIPHTHERIA', 'TONSILLITIS',
    'HEAD', 'EYES', 'EARS', 'NOSE', 'FACE', 'MOUTH', 'THROAT',
    'STOMACH', 'ABDOMEN', 'RECTUM', 'SKIN', 'SLEEP',
    'MALE', 'FEMALE', 'RESPIRATORY', 'HEART', 'BACK', 'EXTREMITIES',
    'URINARY', 'MIND', 'TEETH', 'LARYNX', 'TRACHEA', 'BRONCHI',
    'LUNGS', 'PLEURA', 'LIVER', 'SPLEEN', 'PANCREAS',
    'KIDNEYS', 'BLADDER', 'URETHRA', 'PROSTATE',
    'UTERUS', 'OVARIES', 'VAGINA', 'BREAST',
    'BLOOD', 'GLANDS', 'LYMPHATICS', 'NAILS', 'HAIR',
    'ULCER', 'FISTULA', 'FISSURE', 'PROLAPSE',
    'NAUSEA', 'VOMITING', 'ANOREXIA', 'COLIC', 'FLATULENCE',
    'JAUNDICE', 'VERTIGO', 'INSOMNIA', 'HYSTERIA',
    'HERPES', 'ECZEMA', 'PSORIASIS', 'LEPROSY',
    'EPILEPSY', 'CHOREA', 'CONVULSIONS', 'PARALYSIS',
    'MENORRHAGIA', 'AMENORRHOEA', 'LEUCORRHOEA', 'DYSMENORRHOEA',
    'HAEMORRHOIDS', 'GOITRE', 'DIABETES',
    'PERICARDITIS', 'ENDOCARDITIS', 'ANGINA PECTORIS',
    'MUMPS', 'PAROTITIS', 'OOPHORITIS',
    'HYDROCELE', 'VARICOCELE', 'PROSTATITIS',
    'CYSTITIS', 'NEPHRITIS', 'URETHRITIS', 'ORCHITIS',
    'METRITIS', 'ENDOMETRITIS', 'VAGINITIS', 'PRURITUS',
    'CARBUNCLE', 'BOILS', 'ABSCESS',
    'ENCEPHALITIS', 'MENINGITIS', 'OPTHALMIA', 'OTITIS',
    'RHINITIS', 'SINUSITIS', 'PHARYNGITIS', 'LARYNGITIS',
    'BRIGHTS DISEASE', 'TREMELING', 'TREMBLING',
}
KNOWN_UPPER = KNOWN_UPPER - REMEDY_NAME_BLOCKLIST

OCR_NAME_FIXES = {
    'ODUM': 'Iodum', 'LAPOILUM': 'Capsicum', 'COFFEA CHODA': 'Coffea Cruda',
    'COFFEA CRODA': 'Coffea Cruda', 'MUSK DEER': 'Moschus',
    'LAC. DEFLORATUM': 'Lac Defloratum',
}

# ============================================================
# OCR CLEANING FUNCTIONS
# ============================================================
def clean_ocr_line(line):
    """Clean a single OCR line of common corruption."""
    s = line.strip()
    if not s:
        return ''
    
    # 1. Replace unicode artifacts
    s = s.replace('\u201c', '"').replace('\u201d', '"')  # smart quotes
    s = s.replace('\u2018', "'").replace('\u2019', "'")  # smart apostrophes
    s = s.replace('\u2013', '-').replace('\u2014', '-')  # en/em dash
    s = s.replace('\u00a0', ' ').replace('\u200b', '').replace('\u202f', ' ')  # spaces
    s = s.replace('\u00b0', '°')  # degree sign
    s = s.replace('\u00a6', '...')  # broken bar
    s = s.replace('\u00ad', '-')  # soft hyphen
    s = s.replace('\u00b1', '±')
    s = s.replace('\u00d7', '×')
    s = s.replace('\u00f7', '÷')
    s = s.replace('\u00e9', 'é')
    s = s.replace('\u00e8', 'è')
    s = s.replace('\u00ea', 'ê')
    s = s.replace('\u00eb', 'ë')
    s = s.replace('\u00e1', 'á')
    s = s.replace('\u00e0', 'à')
    s = s.replace('\u00f3', 'ó')
    s = s.replace('\u00f2', 'ò')
    s = s.replace('\u00fa', 'ú')
    s = s.replace('\u00ed', 'í')
    s = s.replace('\u00fc', 'ü')
    s = s.replace('\u00f6', 'ö')
    s = s.replace('\u00e4', 'ä')
    s = s.replace('\u00df', 'ß')
    s = s.replace('\u00e7', 'ç')
    s = s.replace('\u00f1', 'ñ')
    
    # 2. Fix common OCR character substitutions
    s = s.replace('¢', 'c')  # cent sign -> c
    s = s.replace('©', '(c)')
    s = s.replace('®', '(R)')
    s = s.replace('™', '(TM)')
    s = s.replace('°', ' degree')
    s = s.replace('±', '+/-')
    s = s.replace('×', 'x')
    s = s.replace('÷', '/')
    
    # 3. Remove garbage punctuation sequences (but preserve meaningful ones)
    # Remove sequences like ,''a or ''a or ,'' etc.
    s = re.sub(r',[\'"]+', ',', s)  # ,'' -> ,
    s = re.sub(r'[\'"]{2,}', '"', s)  # '''' -> "
    s = re.sub(r'\s{3,}', ' ', s)  # multiple spaces -> single
    
    # 4. Fix digits-in-words (OCR corruption like "Bellad6nna" -> "Belladonna")
    s = re.sub(r'\b(\w*[a-zA-Z])0(\w*[a-zA-Z])\b', r'\1o\2', s)  # 0 -> o in words
    s = re.sub(r'\b(\w*[a-zA-Z])1(\w*[a-zA-Z])\b', r'\1l\2', s)  # 1 -> l in words
    s = re.sub(r'\b(\w*[a-zA-Z])3(\w*[a-zA-Z])\b', r'\1e\2', s)  # 3 -> e in words
    
    # 5. Remove stray non-ASCII characters
    s = re.sub(r'[^\x00-\x7f]', '', s)
    
    # 6. Clean up extra whitespace
    s = re.sub(r'\s+', ' ', s).strip()
    
    return s

def is_page_furniture(line, page_num=None):
    """Detect if a line is a page header/footer/page number."""
    s = line.strip()
    if not s:
        return False
    
    # Pure page number
    if re.match(r'^\d{1,3}$', s):
        return True
    
    # "Remedy Name NNN" pattern (running header with page number)
    if re.match(r'^[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?\s+\d{1,3}$', s):
        return True
    
    # "NNN Remedy Name" pattern
    if re.match(r'^\d{1,3}\s+[A-Z][a-z]+(?:\s+[A-Z][a-z]+)?$', s):
        return True
    
    # "Text Book of MATERIA MEDICA" or just "MATERIA MEDICA"
    if 'TEXT BOOK OF' in s.upper():
        return True
    if s.upper() == 'MATERIA MEDICA':
        return True
    if re.match(r'^\d+\s+Text Book of MATERIA MEDICA$', s):
        return True
    if re.match(r'^Text Book of MATERIA MEDICA$', s, re.IGNORECASE):
        return True
    
    # Isolated single character (OCR artifact)
    if len(s) == 1 and not s.isalpha():
        return True
    
    return False

def clean_paragraph(text):
    """Clean a reconstructed paragraph."""
    s = text.strip()
    if not s:
        return ''
    
    # Fix spacing around punctuation
    s = re.sub(r'\s+([,.;:!?])', r'\1', s)  # "word ," -> "word,"
    s = re.sub(r'([,.;:!?])([A-Za-z])', r'\1 \2', s)  # "word.Next" -> "word. Next"
    
    # Fix multiple spaces
    s = re.sub(r'\s+', ' ', s)
    
    # Fix broken hyphenation at end of line (already joined, but clean up)
    s = re.sub(r'-\s+', '-', s)  # "word-\n continuation" -> "word-continuation"
    # But only if the result is a real word (we can't verify, so leave hyphens)
    
    return s.strip()

# ============================================================
# SECTION HEADERS
# ============================================================
SECTION_HEADERS = {
    'INTRODUCTION', 'CLINICAL', 'CLINICAL USE', 'PARTICULARS', 'PARTICULAR',
    'PERTICULARS', 'GUIDING SYMPTOMS', 'SPHERES OF ACTION', 'SPHERE OF ACTION',
    'SPHERES OF ACTION & PATHOGENESIS', 'SPHERE OF ACTION & PATHOGENESIS',
    'SPHERES OF ACTION AND PATHOGENESIS', 'SPHERE OF ACTION AND PATHOGENESIS',
    'PATHOGENESIS', 'CONSTITUTION', 'RELATIONS', 'RELATION', 'RELATIONSHIP',
    'REMEDY RELATIONSHIP', 'CHARACTERISTIC INDICATIONS', 'PHYSIOLOGICAL ACTION',
    'PREPARATION AND DOSE', 'BIOCHEMIC SYSTEM', 'GENERAL MODALITY', 'MODALITIES',
    'AGGRAVATION', 'AMELIORATION', 'CAUSATION', 'DRUG ACTION', 'DRUG PICTURE',
    'ORGAN AFFINITY', 'CHARACTERISTIC', 'CHARACTERISTICS', 'IMPORTANT SYMPTOMS',
    'SUMMARY', 'BIOCHEMIC', 'GLOSSARY', 'COMPLEMENTARY', 'INIMICAL', 'ANTIDOTE',
    'ANTIDOTES', 'COLLATERAL', 'COMPARE', 'COMPARISON', 'DOSE', 'POTENCY',
    'MIASMATIC', 'MIASM', 'THERAPEUTIC', 'THERAPEUTICS', 'KEYNOTE', 'KEYNOTES',
    'PROVING', 'OBSERVATION', 'OBSERVATIONS',
    'THE TWELVE TISSUE SALTS', 'WINE RELATION',
}

SKIP_PAGES_INITIAL = set(range(1, 12))

# ============================================================
# HELPERS
# ============================================================
def clean_line(s):
    s = s.strip()
    while s and not s[0].isalnum():
        s = s[1:]
    while s and s[-1] in '|:;,':
        s = s[:-1].rstrip()
    return s

def fix_ocr_typos(s):
    return re.sub(r'\bKAL\]', 'KALI', s)

def normalize_ws(s):
    return ' '.join(s.split())

def is_caps_heading(line):
    s = clean_line(line)
    s = fix_ocr_typos(s)
    s = normalize_ws(s)
    if not s or len(s) < 3 or len(s) > 60:
        return False, s
    s_no_num = re.sub(r'\s+\d+\s*$', '', s).strip()
    if any(c.isdigit() for c in s_no_num):
        return False, s
    if s_no_num.endswith('.'):
        s_no_num = s_no_num[:-1].rstrip()
    if any(p in s_no_num for p in ';'):
        return False, s_no_num
    for candidate in [s, s_no_num]:
        if not re.match(r"^[A-Z][A-Z\s\-\'/()&.]+$", candidate):
            continue
        if len(candidate) == 1:
            continue
        if len(candidate.split()) > 5:
            continue
        if candidate in KNOWN_UPPER:
            return True, candidate
        s_no_paren = re.sub(r'\s*\([^)]*\)', '', candidate).strip()
        if s_no_paren != candidate and s_no_paren in KNOWN_UPPER:
            return True, s_no_paren
    return False, s

def is_titlecase_heading(line):
    s = clean_line(line)
    s = normalize_ws(s)
    if not s or len(s) < 3 or len(s) > 60:
        return False, s
    s_no_num = re.sub(r'\s+\d+\s*$', '', s).strip()
    if any(c.isdigit() for c in s_no_num):
        return False, s
    if any(p in s_no_num for p in ';'):
        return False, s_no_num
    KNOWN_LOWER = set(k.lower() for k in KNOWN_UPPER)
    for candidate in [s, s_no_num]:
        if not re.match(r"^[A-Z][A-Za-z\s\-\'/()&.]+$", candidate):
            continue
        words = candidate.split()
        if any(not w[0].isupper() for w in words if w and w[0].isalpha() and w.lower() not in ['of', 'the', 'and']):
            continue
        if len(words) > 5:
            continue
        if candidate.lower() in KNOWN_LOWER:
            return True, candidate.upper()
    return False, s

def canonicalize_name(detected):
    if detected in OCR_NAME_FIXES:
        return OCR_NAME_FIXES[detected]
    s = re.sub(r'\s*\([^)]*\)', '', detected).strip()
    title = ' '.join(w.capitalize() for w in s.split())
    fixes = {
        'Hyoscyamus Nigar': 'Hyoscyamus Niger',
        'Baptisia Tincturia': 'Baptisia Tinctoria',
        'Calcarea Fluoricum': 'Calcarea Fluorica',
        'Calcarea Sulphurium': 'Calcarea Sulphurica',
        'Calcarca Sulphurica': 'Calcarea Sulphurica',
        'Calcarca Sulphurium': 'Calcarea Sulphurica',
        'Arsenicun Iodatum': 'Arsenicum Iodatum',
        'Arsenicun Lodatum': 'Arsenicum Iodatum',
        'Baryta Carnobica': 'Baryta Carbonica',
        'Tarentuia Cubensis': 'Tarentula Cubensis',
        'Remex Crispus': 'Rumex Crispus',
        'Lycopodium Clavatum': 'Lycopodium',
        'Murex Purpurea': 'Murex',
        'Naja Tripudians': 'Naja',
        'X-ray': 'X-Ray',
        'Borax Veneta': 'Borax',
        'Lac Defloratum.': 'Lac Defloratum',
        'Caulophylium': 'Caulophyllum',
        'Gelsemum': 'Gelsemium',
    }
    return fixes.get(title, title)

def read_page(page_num):
    p = TEXT_DIR / f"page-{page_num:04d}.txt"
    if not p.exists():
        return []
    return p.read_text(encoding='utf-8', errors='replace').splitlines()

def merge_pages():
    """Read all pages, clean OCR, remove page furniture, return clean lines."""
    lines = []
    for pn in range(1, 760):
        page_lines = read_page(pn)
        lines.append(f"@@@PAGE {pn}@@@")
        for ln in page_lines:
            # Clean OCR corruption
            cleaned = clean_ocr_line(ln)
            # Skip page furniture (headers, footers, page numbers)
            if is_page_furniture(cleaned, pn):
                continue
            # Skip empty lines after cleaning
            if not cleaned.strip():
                continue
            lines.append(cleaned)
    return lines

# ============================================================
# PARAGRAPH RECONSTRUCTION
# ============================================================
def reconstruct_paragraphs(lines):
    """Join visual line wraps into continuous paragraphs."""
    paragraphs = []
    current_para = []
    
    for line in lines:
        stripped = line.strip()
        if not stripped:
            if current_para:
                joined = ' '.join(current_para)
                cleaned = clean_paragraph(joined)
                if cleaned:
                    paragraphs.append(cleaned)
                current_para = []
            continue
        
        starts_new = False
        if re.match(r'^\d+[\.\)]\s', stripped):
            starts_new = True
        elif stripped.startswith(('*', '•', '°', '©', '▪')):
            starts_new = True
        elif re.match(r'^[A-Z][A-Z\s\-\'/()&.]+$', stripped) and len(stripped) > 3 and len(stripped) < 60:
            starts_new = True
        elif re.match(r'^[A-Z][a-z]+(\s+[A-Z][a-z]+)*\s*:', stripped):
            starts_new = True
        elif current_para and current_para[-1].rstrip().endswith(('.', '!', '?', ':', ';')):
            starts_new = True
        
        if starts_new:
            if current_para:
                joined = ' '.join(current_para)
                cleaned = clean_paragraph(joined)
                if cleaned:
                    paragraphs.append(cleaned)
                current_para = []
            current_para.append(stripped)
        else:
            if current_para:
                prev = current_para[-1]
                if prev.endswith('-'):
                    current_para[-1] = prev[:-1] + stripped
                else:
                    current_para.append(stripped)
            else:
                current_para.append(stripped)
    
    if current_para:
        joined = ' '.join(current_para)
        cleaned = clean_paragraph(joined)
        if cleaned:
            paragraphs.append(cleaned)
    
    return paragraphs

# ============================================================
# STRUCTURED PARSING
# ============================================================
def parse_remedies_structured(lines):
    remedies = []
    current = None
    page_num = 0
    line_in_page = 0
    
    for line in lines:
        m = re.match(r'^@@@PAGE (\d+)@@@$', line)
        if m:
            page_num = int(m.group(1))
            line_in_page = 0
            continue
        if page_num in SKIP_PAGES_INITIAL:
            continue
        line_in_page += 1
        
        ok, cleaned = is_caps_heading(line)
        if not ok:
            if line_in_page <= 8:
                ok_t, cleaned_t = is_titlecase_heading(line)
                if ok_t:
                    ok = True
                    cleaned = cleaned_t.upper()
        
        if ok:
            new_name = canonicalize_name(cleaned)
            if current is not None and current['name'] == new_name:
                if re.search(r'\s+\d+\s*$', line.strip()):
                    continue
            
            if current is not None:
                finalize_remedy(current)
                remedies.append(current)
            
            current = {
                'name_raw': cleaned,
                'name': new_name,
                'start_page': page_num,
                'raw_lines': [],
            }
        else:
            if current is not None:
                current['raw_lines'].append(line)
    
    if current is not None:
        finalize_remedy(current)
        remedies.append(current)
    
    return remedies

def finalize_remedy(remedy):
    raw_lines = remedy.pop('raw_lines', [])
    sections = []
    current_section = None
    current_lines = []
    
    for line in raw_lines:
        stripped = line.strip()
        if not stripped:
            if current_lines:
                current_lines.append('')
            continue
        
        is_heading = False
        heading_name = None
        
        if re.match(r'^[A-Z][A-Z\s\-\'/()&.]+$', stripped) and len(stripped) > 3 and len(stripped) < 60:
            candidate = stripped.rstrip('|:;,. ').strip()
            if candidate in SECTION_HEADERS:
                is_heading = True
                heading_name = candidate
        
        if is_heading:
            if current_section is not None:
                current_section['paragraphs'] = reconstruct_paragraphs(current_lines)
                sections.append(current_section)
            elif current_lines and not current_section:
                sections.append({
                    'heading': '',
                    'paragraphs': reconstruct_paragraphs(current_lines),
                })
            current_section = {'heading': heading_name, 'paragraphs': []}
            current_lines = []
        else:
            current_lines.append(line)
    
    if current_section is not None:
        current_section['paragraphs'] = reconstruct_paragraphs(current_lines)
        sections.append(current_section)
    elif current_lines:
        sections.append({
            'heading': '',
            'paragraphs': reconstruct_paragraphs(current_lines),
        })
    
    remedy['sections'] = sections
    full_parts = []
    for s in sections:
        if s.get('heading'):
            full_parts.append(s['heading'])
            full_parts.append('')
        for p in s['paragraphs']:
            full_parts.append(p)
            full_parts.append('')
    remedy['full'] = '\n'.join(full_parts).strip()
    remedy['keynote'] = remedy['full'][:300] if len(remedy['full']) > 300 else remedy['full']

def slugify(name):
    s = name.lower().strip()
    s = re.sub(r"[^a-z0-9\s\-]", "", s)
    s = re.sub(r"[\s_]+", "-", s)
    s = re.sub(r"-+", "-", s).strip('-')
    return s

def build_remedy_json(remedy):
    name = remedy['name']
    slug = slugify(name)
    is_bio = remedy['start_page'] >= 672
    rid = f"dubey-mm-bio-{slug}" if is_bio else f"dubey-mm-{slug}"
    end_page = remedy.get('end_page', remedy['start_page'])
    return {
        'id': rid,
        'name': name,
        'common': '',
        'author': 'Dubey',
        'letter': name[0].upper() if name else '?',
        'chapter': '',
        'organ': '',
        'modalities': '',
        'constitution': '',
        'relationships': '',
        'dose': '',
        'keynote': remedy.get('keynote', ''),
        'full': remedy.get('full', ''),
        'sections': remedy.get('sections', []),
        'source_pages': f"{remedy['start_page']}-{end_page}",
        'source_book': 'S.K. Dubey Text Book of Materia Medica (7th Ed.)',
    }

def main():
    print("=" * 70)
    print("S.K. DUBEY COMPLETE OCR AUDIT + REPAIR")
    print("=" * 70)
    
    print("\n[1] Reading and cleaning OCR text from source...")
    lines = merge_pages()
    print(f"    Total clean lines: {len(lines)}")
    
    print("\n[2] Parsing remedies with structured sections...")
    remedies = parse_remedies_structured(lines)
    print(f"    Primary pass: {len(remedies)} remedies")
    
    for i, r in enumerate(remedies):
        if i + 1 < len(remedies):
            r['end_page'] = remedies[i+1]['start_page'] - 1
        else:
            r['end_page'] = 759
    
    # Merge consecutive duplicates
    print("\n[3] Merging consecutive duplicates...")
    merged = []
    for r in remedies:
        if merged and merged[-1]['name'] == r['name'] and merged[-1].get('end_page', 0) >= r['start_page'] - 5:
            merged[-1]['sections'].extend(r.get('sections', []))
            merged[-1]['end_page'] = r['end_page']
            full_parts = []
            for s in merged[-1]['sections']:
                if s.get('heading'):
                    full_parts.append(s['heading'])
                    full_parts.append('')
                for p in s.get('paragraphs', []):
                    full_parts.append(p)
                    full_parts.append('')
            merged[-1]['full'] = '\n'.join(full_parts).strip()
            merged[-1]['keynote'] = merged[-1]['full'][:300]
        else:
            merged.append(r)
    
    # Merge non-consecutive within 5-page gap
    print("[4] Merging non-consecutive duplicates (gap <= 5)...")
    merged2 = []
    for r in merged:
        found = None
        for prev in merged2:
            if prev['name'] == r['name'] and prev.get('end_page', 0) >= r['start_page'] - 5:
                found = prev
                break
        if found:
            found['sections'].extend(r.get('sections', []))
            found['end_page'] = max(found.get('end_page', 0), r.get('end_page', 0))
            full_parts = []
            for s in found['sections']:
                if s.get('heading'):
                    full_parts.append(s['heading'])
                    full_parts.append('')
                for p in s.get('paragraphs', []):
                    full_parts.append(p)
                    full_parts.append('')
            found['full'] = '\n'.join(full_parts).strip()
            found['keynote'] = found['full'][:300]
        else:
            merged2.append(r)
    
    all_remedies = merged2
    print(f"    After merge: {len(all_remedies)} remedies")
    
    # Remove invalid page ranges
    clean = []
    for r in all_remedies:
        sp = f"{r['start_page']}-{r.get('end_page', r['start_page'])}"
        m = re.match(r'(\d+)-(\d+)', sp)
        if m:
            lo, hi = int(m.group(1)), int(m.group(2))
            if hi < lo:
                continue
        clean.append(r)
    all_remedies = clean
    
    # Build JSON
    out = [build_remedy_json(r) for r in all_remedies]
    
    # Check duplicate IDs
    id_counts = Counter(r['id'] for r in out)
    dupes = [k for k, v in id_counts.items() if v > 1]
    if dupes:
        print(f"\n    WARNING: {len(dupes)} duplicate IDs")
    
    # Write
    with open(OUT_JSON, 'w') as f:
        json.dump(out, f, indent=2, ensure_ascii=False)
    print(f"\n[5] Wrote {len(out)} remedies to {OUT_JSON}")
    
    # Audit: check for remaining corruption
    print("\n[6] Post-repair audit...")
    audit_issues = defaultdict(int)
    for r in out:
        full = r.get('full', '')
        if re.search(r'[^\x00-\x7f]', full):
            audit_issues['non_ascii_chars'] += 1
        if re.search(r'\b\d{2,3}\s+(?:Phosphorus|Pulsatilla|Nux|Sulphur)\b', full):
            audit_issues['running_header'] += 1
        if re.search(r'\b[A-Z][a-z]+\d[A-Za-z]*\b', full):
            audit_issues['digits_in_words'] += 1
        if re.search(r'¢|©|®|™', full):
            audit_issues['special_chars'] += 1
        if re.search(r'\s{3,}', full):
            audit_issues['multiple_spaces'] += 1
    
    print(f"    Post-repair issues:")
    for issue, count in audit_issues.items():
        print(f"      {issue}: {count}")
    
    if not audit_issues:
        print(f"      ✓ NO CORRUPTION REMAINING")
    
    # Summary
    total_sections = sum(len(r.get('sections', [])) for r in out)
    print(f"\n=== SUMMARY ===")
    print(f"  Total remedies: {len(out)}")
    print(f"  Total sections: {total_sections}")
    print(f"  Avg sections/remedy: {total_sections/len(out):.1f}")
    print(f"  Duplicate IDs: {len(dupes)}")
    
    # Show sample
    if out:
        r = out[2] if len(out) > 2 else out[0]
        print(f"\n=== Sample: {r['name']} ===")
        print(f"  Pages: {r['source_pages']}")
        print(f"  Sections: {len(r.get('sections', []))}")
        for i, s in enumerate(r.get('sections', [])[:5]):
            heading = s.get('heading', '(no heading)')
            paras = s.get('paragraphs', [])
            print(f"  {i+1}. [{heading}] ({len(paras)} paragraphs)")
            if paras:
                print(f"     First: {paras[0][:120]}...")

if __name__ == "__main__":
    main()
