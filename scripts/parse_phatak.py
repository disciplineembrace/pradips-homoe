#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Parses Phatak's Concise Repertory PDF into rubric entries.

Output: a JSON array of entries like:
{
  "id": "phatak-arms-1",
  "path": "ARMS",
  "title": "Hanging down, amel",
  "author": "Phatak",
  "remedies": ["Aconitum napellus", "Arnica montana", ...],  # expanded from abbreviations
  "remedies_abbr": ["Aco", "Arn", "Bar-c", ...]  # original abbreviations kept for reference
}

Strategy:
1. Extract text from all pages.
2. Identify main rubric headings: ALL CAPS lines (2+ chars) that look like rubric names.
3. For each rubric, slice body text until next heading.
4. Within body, find sub-rubrics: lines ending with ':' (e.g., "Hanging down:").
5. Extract remedy abbreviations: tokens like "Aco", "Bar-c", "Merc-i-r", "Bell".
6. Expand abbreviations to full names using a curated map (built from Boericke data).
"""
import fitz, re, json
from pathlib import Path

PDF = Path("/home/z/my-project/upload/Phatak repertory.pdf")
OUT_JSON = Path("/home/z/my-project/scripts/phatak_rubrics.json")

# =====================================================================
# ABBREVIATION → FULL NAME MAP
# Built from Boericke's standard abbreviations. We'll also try to
# auto-expand from Boericke data at the end.
# =====================================================================
ABBREV_MAP = {
    'Aco': 'Aconitum Napellus', 'Aeth': 'Aethusa Caryophyllus', 'Aga': 'Agaricus Muscarius',
    'Ail': 'Ailanthus Glandulosa', 'Alin': 'Alumina', 'Alu': 'Alumina', 'Aloe': 'Aloe Socotrina',
    'Alst': 'Alstonia Scholaris', 'Amb': 'Ambra Grisea', 'Am-c': 'Ammonium Carbonicum',
    'Am-m': 'Ammonium Muriaticum', 'Anac': 'Anacardium Orientale', 'Ant-c': 'Antimonium Crudum',
    'Ant-t': 'Antimonium Tartaricum', 'Ap': 'Apis Mellifica', 'Apoc': 'Apocynum Cannabinum',
    'Arg-m': 'Argentum Metallicum', 'Arg-n': 'Argentum Nitricum', 'Arn': 'Arnica Montana',
    'Ars': 'Arsenicum Album', 'Asaf': 'Asafoetida', 'Asar': 'Asarum Europaeum',
    'Aur': 'Aurum Metallicum', 'Bap': 'Baptisia Tinctoria', 'Bar-c': 'Baryta Carbonica',
    'Bar-m': 'Baryta Muriatica', 'Bell': 'Belladonna', 'Benz-ac': 'Benzonicum Acidum',
    'Berb': 'Berberis Vulgaris', 'Bism': 'Bismuthum', 'Bov': 'Bovista',
    'Bro': 'Bromium', 'Bry': 'Bryonia Alba', 'Buf': 'Bufo Rana',
    'Cact': 'Cactus Grandiflorus', 'Cad': 'Cadmium Sulphuratum', 'Cadm': 'Cadmium Sulphuratum',
    'Calad': 'Caladium Seguinum', 'Calc': 'Calcarea Carbonica', 'Calc-ar': 'Calcarea Arsenica',
    'Calc-c': 'Calcarea Carbonica', 'Calc-i': 'Calcarea Iodata', 'Calc-p': 'Calcarea Phosphorica',
    'Calc-s': 'Calcarea Sulphurica', 'Calen': 'Calendula Officinalis', 'Cann': 'Cannabis Indica',
    'Canth': 'Cantharis Vesicatoria', 'Caps': 'Capsicum Annuum', 'Carb-an': 'Carbo Animalis',
    'Carb-s': 'Carbo Sulphuratus', 'Carb-v': 'Carbo Vegetabilis', 'Card-m': 'Carduus Marianus',
    'Caus': 'Causticum', 'Caul': 'Caulophyllum Thalictroides', 'Cedr': 'Cedron',
    'Cep': 'Cepa', 'Cham': 'Chamomilla', 'Chel': 'Chelone Glabra', 'Chin': 'China Officinalis',
    'Chlor': 'Chlorum', 'Chlo-hyd': 'Chloral Hydratum', 'Cic': 'Cicuta Virosa',
    'Cimic': 'Cimicifuga Racemosa', 'Cimi': 'Cimicifuga Racemosa', 'Cina': 'Cina',
    'Cocc': 'Coccus Cacti', 'Coch': 'Cochlearia Armoracia', 'Cod': 'Cod liver oil',
    'Coff': 'Coffea Cruda', 'Colch': 'Colchicum Autumnale', 'Coleo': 'Coleus Aromaticus',
    'Coll': 'Collinsonia Canadensis', 'Coloc': 'Colocynthis', 'Con': 'Conium Maculatum',
    'Conj': 'Conium Maculatum', 'Copaiv': 'Copaiva Officinalis', 'Corn': 'Cornus Circinata',
    'Cort': 'Cortinarius Orellanus', 'Cot': 'Cottonroot', 'Croc': 'Crocus Sativus',
    'Crot-c': 'Crotalus Cascavella', 'Crot-h': 'Crotalus Horridus', 'Crot-t': 'Croton Tiglium',
    'Cup': 'Cuprum Metallicum', 'Cupr': 'Cuprum Metallicum', 'Cycl': 'Cyclamen Europaeum',
    'Dig': 'Digitalis Purpurea', 'Dios': 'Dioscorea Villosa', 'Dros': 'Drosera Rotundifolia',
    'Dul': 'Dulcamara', 'Eupat': 'Eupatorium Perfoliatum', 'Eup-per': 'Eupatorium Perfoliatum',
    'Euphr': 'Euphrasia Officinalis', 'Fago': 'Fagopyrum Esculentum', 'Fer': 'Ferrum Metallicum',
    'Fer-p': 'Ferrum Phosphoricum', 'Flu-ac': 'Fluoricum Acidum', 'Gamb': 'Gambogia',
    'Gels': 'Gelsemium Sempervirens', 'Gent': 'Gentiana Lutea', 'Glon': 'Glonoine',
    'Gnaph': 'Gnaphalium Polycephalum', 'Grap': 'Graphites', 'Grat': 'Gratiola Officinalis',
    'Guaj': 'Guaiacum Officinale', 'Hell': 'Helleborus Niger', 'Hep': 'Hepar Sulphuris Calcareum',
    'Hydr': 'Hydrastis Canadensis', 'Hyds': 'Hydrastis Canadensis', 'Hyos': 'Hyoscyamus Niger',
    'Hyo': 'Hyoscyamus Niger', 'Hyper': 'Hypericum Perforatum', 'Hypr': 'Hypericum Perforatum',
    'Ign': 'Ignatia Amara', 'Iod': 'Iodium', 'Iodof': 'Iodoformum', 'Ip': 'Ipecacuanha',
    'Iris': 'Iris Versicolor', 'Jac': 'Jacaranda Caroba', 'Jug': 'Juglans Cinerea',
    'Jug-r': 'Juglans Regia', 'Kali-ar': 'Kalium Arsenicosum', 'Kali-bi': 'Kalium Bichromicum',
    'Kali-br': 'Kalium Bromatum', 'Kali-c': 'Kalium Carbonicum', 'Kali-chi': 'Kalium Chlortum',
    'Kali-i': 'Kalium Iodatum', 'Kali-io': 'Kalium Iodatum', 'Kali-m': 'Kalium Muriaticum',
    'Kali-n': 'Kalium Nitricum', 'Kali-p': 'Kalium Phosphoricum', 'Kali-s': 'Kalium Sulphuricum',
    'Kalm': 'Kalmia Latifolia', 'Kob': 'Kreosotum', 'Kre': 'Kreosotum',
    'Lac-ac': 'Lac Acidum', 'Lac-c': 'Lac Caninum', 'Lac-d': 'Lac Defloratum',
    'Lach': 'Lachesis Mutus', 'Lapp': 'Lappa Arctium', 'Lath': 'Lathyrus Sativus',
    'Lathy': 'Lathyrus Sativus', 'Laur': 'Laurus Camphora', 'Led': 'Ledum Palustre',
    'Lil-t': 'Lilium Tigrinum', 'Lith': 'Lithium Carbonicum', 'Lob': 'Lobelia Inflata',
    'Lol-t': 'Lolium Temulentum', 'Lyc': 'Lycopodium Clavatum', 'Lye': 'Lycopodium Clavatum',
    'Mag-c': 'Magnesia Carbonica', 'Mag-m': 'Magnesium Muriaticum', 'Mag-p': 'Magnesia Phosphorica',
    'Mang': 'Manganum Aceticum', 'Mar-v': 'Marmor Vulcanicum', 'Med': 'Medorrhinum',
    'Meli': 'Melilotus Officinalis', 'Mere': 'Mercurius Solubilis', 'Merc': 'Mercurius Solubilis',
    'Merc-c': 'Mercurius Corrosivus', 'Merc-i-r': 'Mercurius Iodatus Ruber',
    'Merc-i-f': 'Mercurius Iodatus Flavus', 'Mill': 'Millefolium', 'Mosch': 'Moschus',
    'Mos': 'Moschus', 'Mur-ac': 'Muriaticum Acidum', 'Myg': 'Mygale Lasiodora',
    'Myr': 'Myrica Cerifera', 'Naj': 'Naja Tripudians', 'Nat-ar': 'Natrium Arsenicosum',
    'Nat-c': 'Natrium Carbonicum', 'Nat-m': 'Natrium Muriaticum', 'Nat-p': 'Natrium Phosphoricum',
    'Nat-s': 'Natrium Sulphuricum', 'Nit-ac': 'Nitricum Acidum', 'Nux-m': 'Nux Moschata',
    'Nux-v': 'Nux Vomica', 'Old': 'Oleander', 'Ol-an': 'Oleander', 'Onos': 'Onosmodium Virginianum',
    'Op': 'Opium', 'Osm': 'Osmium', 'Par': 'Paris Quadrifolia', 'Petr': 'Petroleum',
    'Pho': 'Phosphorus', 'Pho-ac': 'Phosphoricum Acidum', 'Phyt': 'Phytolacca Decandra',
    'Pic-ac': 'Picricum Acidum', 'Plat': 'Platina', 'Plb': 'Plumbum Metallicum',
    'Pod': 'Pulsatilla', 'Podo': 'Podophyllum Peltatum', 'Pul': 'Pulsatilla',
    'Pyr': 'Pyrogenium', 'Radm': 'Radium Bromatum', 'Ran-b': 'Ranunculus Bulbosus',
    'Rhus-t': 'Rhus Toxicodendron', 'Rhus-g': 'Rhus Glabra', 'Rum': 'Rumex Crispus',
    'Rut': 'Ruta Graveolens', 'Saba': 'Sabadilla', 'Sabin': 'Sabina',
    'Sang': 'Sanguinaria Canadensis', 'Sanic': 'Sanicula Aqua', 'Sars': 'Sarsaparilla Officinalis',
    'Sec': 'Secale Cornutum', 'Sele': 'Selenium Metallicum', 'Sep': 'Sepia Officinalis',
    'Sil': 'Silicea Terra', 'Spig': 'Spigelia Anthelmia', 'Stan': 'Stannum Metallicum',
    'Stap': 'Staphysagria', 'Staph': 'Staphysagria', 'Stram': 'Stramonium',
    'Strop': 'Strophanthus Hispidus', 'Sul': 'Sulphur', 'Sul-ac': 'Sulphuricum Acidum',
    'Tab': 'Tabacum', 'Tell': 'Tellurium Metallicum', 'Terb': 'Terebinthinae',
    'Thu': 'Thuja Occidentalis', 'Thyr': 'Thyroidinum', 'Tub': 'Tuberculinum',
    'Tuss': 'Tussilago Farfara', 'Uran-n': 'Uranium Nitricum', 'Ust': 'Ustilago Maydis',
    'Val': 'Valeriana Officinalis', 'Ver-a': 'Veratrum Album', 'Ver-v': 'Veratrum Viride',
    'Vib': 'Viburnum Opulus', 'Vio': 'Viola Odorata', 'Vip': 'Vipera Berus',
    'Vise': 'Viscum Album', 'Zin': 'Zincum Metallicum', 'Zing': 'Zingiber Officinale',
    # Common variants with hyphen continuation marks
    'Aco': 'Aconitum Napellus', 'Agar': 'Agaricus Muscarius', 'Ant': 'Antimonium',
    'Bap': 'Baptisia Tinctoria', 'Calc-p': 'Calcarea Phosphorica', 'Cann-s': 'Cannabis Sativa',
    'Cina': 'Cina', 'Clem': 'Clematis Erecta', 'Cupr': 'Cuprum Metallicum',
    'Crot': 'Crotalus Horridus', 'Cycl': 'Cyclamen', 'Gels': 'Gelsemium Sempervirens',
    'Kali': 'Kalium', 'Lac': 'Lac', 'Mez': 'Mezereum', 'Millef': 'Millefolium',
    'Nat': 'Natrium', 'Nat-mur': 'Natrium Muriaticum', 'Petr': 'Petroleum',
    'Phos': 'Phosphorus', 'Puls': 'Pulsatilla', 'Spong': 'Spongia Tosta',
    'Sulph': 'Sulphur', 'Sulph-ac': 'Sulphuricum Acidum', 'Ver': 'Veratrum',
}

# Common single words to skip (not rubric names)
SKIP_WORDS = {
    'page', 'chapter', 'index', 'preface', 'contents', 'part', 'section',
    'see', 'compare', 'synonyms', 'synonym', 'cross', 'reference',
    'a', 'an', 'the', 'and', 'or', 'of', 'with', 'without', 'from', 'to',
    'in', 'on', 'at', 'for', 'by', 'as', 'is', 'are', 'be', 'was', 'were',
    'this', 'that', 'these', 'those', 'his', 'her', 'their', 'our', 'your',
    'similibis', 'india', 'phatak', 'repertory', 'homoeopathic', 'medicines',
    'b', 'jain', 'publishers', 'delhi', 'india', 'edition', 'fourth',
    'revised', 'corrected', 'dr', 'm', 's', 'p', 'ltd',
}

# =====================================================================
# STEP 1: Extract text
# =====================================================================
def extract_text():
    doc = fitz.open(str(PDF))
    full = []
    for page in doc:
        t = page.get_text()
        if t.strip():
            full.append(t)
    return "\n".join(full)

# =====================================================================
# STEP 2: Find main rubric headings
# =====================================================================
def find_rubric_headings(full):
    """Find ALL CAPS rubric headings.
    Heuristics:
    - Starts at beginning of a line (after whitespace)
    - Contains only uppercase letters, spaces, hyphens, commas
    - Length 3-50 chars (excluding punctuation)
    - Not in SKIP_WORDS
    - Followed by either: end of line, comma+lowercase, or a colon
    """
    # Match: ALL CAPS heading at line start, optionally followed by ', word'
    # Examples: "ARMS", "ARMS, fore", "CONSTIPATION", "IMPOTENCY"
    heading_re = re.compile(r'(?m)^\s*([A-Z][A-Z]{2,30}(?:[\s,][a-z]+)*)\s*$', re.MULTILINE)
    
    candidates = []
    for m in heading_re.finditer(full):
        text = m.group(1).strip()
        # Strip trailing lowercase continuation (keep just the CAPS part)
        main_caps = re.match(r'^([A-Z][A-Z\s\-]+[A-Z])', text)
        if not main_caps:
            continue
        main_name = main_caps.group(1).strip()
        # Must have at least 3 chars and be a real word (not skip word)
        if len(main_name) < 3:
            continue
        if main_name.lower() in SKIP_WORDS:
            continue
        # Skip pure numerics
        if main_name.isdigit():
            continue
        candidates.append((m.start(), m.end(), main_name))
    return candidates

# =====================================================================
# STEP 3: Parse sub-rubrics within a body block
# =====================================================================
SUBRUBRIC_RE = re.compile(r'^([\w\s\-/,()]+?):\s*$', re.MULTILINE)

# Remedy abbreviations: 2-7 chars, lowercase letters with optional hyphens
# Examples: "Aco", "Bell", "Kali-bi", "Merc-i-r"
REMEDY_TOKEN_RE = re.compile(r'\b([A-Z][a-z]{1,3}(?:-[a-z]+)*\.?)\b')

def parse_rubric_body(body):
    """Parse the body of a rubric section. Returns list of (subrubric_title, remedies_abbr_list)."""
    # The body is a free-form text. We need to:
    # 1. Find sub-rubric labels (lines ending with `:`)
    # 2. Extract remedy abbreviations after each label
    
    # Clean up the body — replace newlines with spaces but keep line structure
    lines = body.split('\n')
    
    # Group lines into "blocks" where each block is either:
    # - A sub-rubric label (ends with ':')
    # - A continuation of remedy list
    
    entries = []
    current_subrubric = None
    current_remedies = []
    current_full_text_after_colon = ''
    
    def flush():
        nonlocal current_subrubric, current_remedies, current_full_text_after_colon
        if current_subrubric is not None and (current_remedies or current_full_text_after_colon):
            entries.append((current_subrubric, current_remedies[:]))
        current_subrubric = None
        current_remedies = []
        current_full_text_after_colon = ''
    
    # The whole body might be on one line (no sub-rubrics, just remedies after main rubric)
    # OR have many sub-rubrics
    
    # First, check if the body STARTS with remedies (no sub-rubric) — that means
    # the main rubric itself has direct remedies
    body_text = body.strip()
    if not body_text:
        return entries
    
    # Split body by sub-rubric labels (lines that end with `:`)
    # Actually let's parse line by line and accumulate
    for line in lines:
        line = line.strip()
        if not line:
            continue
        # Skip page-header artifacts (ALL CAPS lines that match the rubric)
        if line.isupper() and len(line) < 30:
            continue
        # Skip page numbers
        if line.isdigit():
            continue
        # Skip OCR garbage at line starts
        if line.startswith("'") or line.startswith('·'):
            line = line[1:].strip()
        
        # Check if this line is a sub-rubric label
        # A label typically: "Some text:" at start of line, with maybe some remedy text after
        # Match patterns like:
        #   "Hanging down:"
        #   "Hanging down: Aco; Arn; Bar-c;"
        #   "• Numb: Grap."
        #   "- coition after: Nat-p."
        label_match = re.match(r'^([\w\s\-/,()]+?):\s*(.*)$', line)
        if label_match:
            # Flush previous
            flush()
            label = label_match.group(1).strip().lstrip('•-·').strip()
            after = label_match.group(2).strip()
            current_subrubric = label
            # Extract remedies from "after"
            current_remedies = extract_remedies(after)
            current_full_text_after_colon = after
        else:
            # Continuation of remedy list
            # But this line might also be a NEW sub-rubric without colon (rare)
            # Just extract any remedies
            new_remedies = extract_remedies(line)
            if new_remedies:
                if current_subrubric is None:
                    # Main rubric direct remedies
                    current_subrubric = '(general)'
                current_remedies.extend(new_remedies)
            else:
                # Some non-remedy text — could be a cross-reference ("See WORD")
                # or another sub-rubric without colon. We'll just skip for now.
                pass
    
    flush()
    return entries

def extract_remedies(text):
    """Extract remedy abbreviations from a text fragment.
    A remedy token is: uppercase letter, then 1-3 lowercase letters, optionally followed by
    -lowercase. Examples: "Aco", "Bell", "Bar-c", "Merc-i-r", "Lac-c", "Kali-bi"
    
    Heuristics:
    - Must be followed by ';' or '.' or ',' or end-of-line
    - NOT a regular English word (so we filter common false positives)
    """
    remedies = []
    # Match tokens like: Aco | Bell | Bar-c | Merc-i-r | Lac-c
    # Be greedy with hyphenated suffixes
    for m in re.finditer(r'\b([A-Z][a-z]{1,4}(?:-[a-z]{1,3})*)\b', text):
        token = m.group(1)
        # Strip trailing period
        token_clean = token.rstrip('.')
        # Filter common false positives
        if token_clean in ('The', 'And', 'See', 'For', 'With', 'From', 'This', 'That',
                           'After', 'Before', 'Each', 'Other', 'All', 'But', 'Has',
                           'Have', 'Had', 'Was', 'Were', 'Are', 'Not', 'His', 'Her',
                           'Their', 'Our', 'Your', 'Out', 'Over', 'Under', 'Into',
                           'About', 'Above', 'Below', 'Between', 'Through', 'During',
                           'Like', 'Than', 'Then', 'When', 'Where', 'While', 'Once',
                           'Since', 'Until', 'Although', 'Because', 'However', 'Therefore',
                           'Moreover', 'Nevertheless', 'Otherwise', 'Sometimes', 'Always',
                           'Never', 'Often', 'Seldom', 'Rarely', 'Most', 'Some', 'Many',
                           'Few', 'Both', 'Either', 'Neither', 'Same', 'Different', 'Right',
                           'Left', 'Both', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven',
                           'Eight', 'Nine', 'Ten', 'First', 'Second', 'Third', 'Fourth',
                           'Fifth', 'Sixth', 'Last', 'Next', 'Previous', 'Former', 'Latter',
                           'Old', 'New', 'Young', 'Child', 'Children', 'Adult', 'Adults',
                           'Male', 'Female', 'Man', 'Woman', 'Boy', 'Girl', 'Baby', 'Babies',
                           'Morning', 'Evening', 'Night', 'Afternoon', 'Noon', 'Midnight',
                           'Midday', 'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday',
                           'Friday', 'Saturday', 'January', 'February', 'March', 'April',
                           'May', 'June', 'July', 'August', 'September', 'October',
                           'November', 'December', 'Spring', 'Summer', 'Autumn', 'Winter',
                           'Hot', 'Cold', 'Warm', 'Cool', 'Wet', 'Dry', 'Damp', 'Humid',
                           'Sunny', 'Cloudy', 'Rainy', 'Stormy', 'Windy', 'Snowy', 'Foggy',
                           'Better', 'Worse', 'Best', 'Worst', 'Good', 'Bad', 'Big', 'Small',
                           'Large', 'Little', 'High', 'Low', 'Fast', 'Slow', 'Quick', 'Long',
                           'Short', 'Wide', 'Narrow', 'Deep', 'Shallow', 'Thick', 'Thin',
                           'Heavy', 'Light', 'Strong', 'Weak', 'Hard', 'Soft', 'Rough',
                           'Smooth', 'Sharp', 'Dull', 'Bright', 'Dark', 'Clear', 'Cloudy',
                           'Heavy', 'Sudden', 'Gradual', 'Slow', 'Rapid', 'Quick', 'Frequent',
                           'Constant', 'Periodical', 'Alternating', 'Continuous', 'Intermittent',
                           'Walking', 'Standing', 'Sitting', 'Lying', 'Moving', 'Resting',
                           'Sleeping', 'Waking', 'Eating', 'Drinking', 'Talking', 'Reading',
                           'Writing', 'Working', 'Thinking', 'Hearing', 'Seeing', 'Smelling',
                           'Tasting', 'Touching', 'Feeling', 'Breathing', 'Coughing',
                           'Sneezing', 'Yawning', 'Stretching', 'Bending', 'Lifting',
                           'Carrying', 'Throwing', 'Catching', 'Holding', 'Releasing',
                           'Opening', 'Closing', 'Turning', 'Twisting', 'Bending', 'Straightening',
                           'Rising', 'Falling', 'Ascending', 'Descending', 'Crossing',
                           'Passing', 'Stopping', 'Starting', 'Beginning', 'Ending', 'Continuing',
                           'Repeating', 'Returning', 'Coming', 'Going', 'Arriving', 'Leaving',
                           'Entering', 'Exiting', 'Approaching', 'Retreating', 'Following',
                           'Leading', 'Pushing', 'Pulling', 'Pressing', 'Rubbing', 'Scratching',
                           'Patting', 'Slapping', 'Hitting', 'Kicking', 'Biting', 'Chewing',
                           'Sucking', 'Swallowing', 'Spitting', 'Vomiting', 'Coughing', 'Sneezing',
                           'Breathing', 'Sighing', 'Yawning', 'Burping', 'Passing', 'Urinating',
                           'Defecating', 'Sweating', 'Bleeding', 'Crying', 'Laughing', 'Smiling',
                           'Frowning', 'Blinking', 'Winking', 'Nodding', 'Shaking', 'Trembling',
                           'Shivering', 'Sweating', 'Burning', 'Itching', 'Aching', 'Pain',
                           'Pains', 'Better', 'Worse', 'Amel', 'Agg', 'Agg+', 'Amel+',
                           'Sep', 'Aug', 'Oct', 'Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr',
                           'Jul', 'Phatak', 'B', 'Jain', 'Pvt', 'Ltd', 'ISBN', 'Delhi',
                           'India', 'USA', 'Europe', 'Dr', 'M', 'E', 'S', 'Story', 'Book',
                           'This', 'Concise', 'Homoeopathic', 'Medicines', 'Arranged',
                           'Alphabetically', 'Revised', 'Corrected', 'Edition', 'Impression',
                           'All', 'Rights', 'Reserved', 'Published', 'Printed', 'Copyright',
                           'Late', 'Mr', 'Mrs', 'Miss', 'Ms', 'Dr', 'Prof', 'Sr', 'Jr',
                           'St', 'Ave', 'Blvd', 'Rd', 'Sq', 'Mt', 'Ft', 'No', 'Vol',
                           'Chap', 'Pg', 'Pp', 'Etc', 'Vs', 'Eg', 'Ie', 'Cc', 'Mc',
                           'See', 'Compare', 'Synonyms', 'Cross', 'Reference', 'Note',
                           'Notes', 'Caution', 'Warning', 'Important', 'NB', 'PS',
                           'Hello', 'Hi', 'Dear', 'Yours', 'Sincerely', 'Regards',
                           'Thanks', 'Thank', 'Welcome', 'Please', 'Sorry', 'Excuse',
                           'Pardon', 'Welcome', 'Goodbye', 'Farewell', 'Cheers', 'Bye'):
            continue
        # Must have at least 2 chars total
        if len(token_clean) < 2:
            continue
        # Strip trailing period
        remedies.append(token_clean)
    return remedies

# =====================================================================
# MAIN
# =====================================================================
def main():
    print("Extracting text...")
    full = extract_text()
    print(f"  Total text: {len(full):,} chars")
    
    print("\nFinding rubric headings...")
    headings = find_rubric_headings(full)
    print(f"  Candidates: {len(headings)}")
    
    # Deduplicate consecutive identical headings (page headers repeat)
    # Keep only the FIRST occurrence of each unique rubric name
    seen = set()
    unique_headings = []
    for s, e, name in headings:
        if name in seen:
            continue
        seen.add(name)
        unique_headings.append((s, e, name))
    print(f"  Unique rubric names: {len(unique_headings)}")
    
    # For each heading, slice body until next heading
    print("\nParsing rubric bodies...")
    all_entries = []
    rubric_id_counter = {}
    
    for i, (start, end, name) in enumerate(unique_headings):
        next_start = unique_headings[i+1][0] if i+1 < len(unique_headings) else len(full)
        body = full[end:next_start]
        
        # Parse sub-rubrics
        sub_entries = parse_rubric_body(body)
        
        if not sub_entries:
            continue
        
        # If only one entry with '(general)' label, rename to main rubric
        if len(sub_entries) == 1 and sub_entries[0][0] == '(general)':
            sub_entries = [(name, sub_entries[0][1])]
        
        # Build entries
        for sub_name, remedies_abbr in sub_entries:
            if not remedies_abbr:
                continue
            
            # Expand abbreviations
            remedies_full = []
            for abbr in remedies_abbr:
                full_name = ABBREV_MAP.get(abbr)
                if full_name:
                    remedies_full.append(full_name)
                else:
                    # Try with stripped hyphens or other normalizations
                    alt = abbr.rstrip('.').rstrip('-')
                    full_name = ABBREV_MAP.get(alt)
                    if full_name:
                        remedies_full.append(full_name)
                    # else: skip — abbreviation not in our map
            
            if not remedies_full:
                continue  # skip if we couldn't expand any
            
            # Build entry
            counter_key = name.lower()
            rubric_id_counter[counter_key] = rubric_id_counter.get(counter_key, 0) + 1
            entry_id = f"phatak-{name.lower().replace(' ', '-').replace('/', '-')}-{rubric_id_counter[counter_key]}"
            
            # Build title
            if sub_name == name or sub_name == '(general)':
                title = name
            else:
                title = f"{name} — {sub_name}"
            
            all_entries.append({
                'id': entry_id,
                'path': name,
                'title': title,
                'author': 'Phatak',
                'remedies': remedies_full,
                'remedies_abbr': remedies_abbr,
            })
    
    print(f"\n  Total sub-rubric entries: {len(all_entries)}")
    
    # Stats
    from collections import Counter
    rubric_counts = Counter(e['path'] for e in all_entries)
    print(f"\n  Top 20 main rubrics by sub-rubric count:")
    for name, count in rubric_counts.most_common(20):
        print(f"    {name:30s} {count} sub-rubrics")
    
    # Total remedy count
    total_remedies = sum(len(e['remedies']) for e in all_entries)
    print(f"\n  Total remedy references: {total_remedies:,}")
    
    # Sample entries
    print("\n  Sample entries:")
    for e in all_entries[:5]:
        print(f"    {e['path']:20s} | {e['title'][:50]:50s} | {len(e['remedies'])} remedies")
        print(f"      First 5: {e['remedies'][:5]}")
    
    # Save
    OUT_JSON.write_text(json.dumps(all_entries, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"\n✓ Wrote {OUT_JSON} ({OUT_JSON.stat().st_size/1024:.1f} KB)")

if __name__ == "__main__":
    main()
