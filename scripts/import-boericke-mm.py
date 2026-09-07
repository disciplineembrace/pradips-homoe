#!/usr/bin/env python3
"""Import Boericke Materia Medica from PDF text."""
import json, re, os

INPUT = '/tmp/boericke-mm-raw.txt'
OUTPUT = '/home/z/my-project/data/remedies.json'

def clean_text(text):
    text = text.replace('\x0c', '\n')
    text = re.sub(r'[\x00-\x08\x0B\x0E-\x1F]', '', text)
    text = text.replace('â€œ', '"').replace('â€\x9d', '"').replace('â€™', "'")
    text = text.replace('â€"', '—').replace('â€"', '–').replace('â€¢', '•')
    text = text.replace('ﬁ', 'fi').replace('ﬂ', 'fl').replace('ﬀ', 'ff')
    text = re.sub(r'(\w)-\n(\w)', r'\1\2', text)
    text = re.sub(r'([a-z,;:.!?")\]\'"])\n([a-z("`\[])', r'\1 \2', text)
    text = re.sub(r'^\s*\d{1,4}\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*being a [Hh]omoeopath\.?\s*\d*\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'^\s*\d*\s*being a [Hh]omoeopath\.?\s*$', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n{3,}', '\n\n', text)
    text = re.sub(r'[ \t]+', ' ', text)
    text = '\n'.join(line.strip() for line in text.split('\n'))
    text = re.sub(r'\b(\d{1,4})\s*([CxXmM]{1,2})\b', r'§P\1\2§', text)
    text = re.sub(r'\b(\d{1,3})\.\s', r'§D\1.§ ', text)
    text = re.sub(r'\b([a-zA-Z]+)(\d{2,})\b', r'\1', text)
    text = re.sub(r'§P(\d+)([CxXmM]{1,2})§', r'\1\2', text)
    text = re.sub(r'§D(\d{1,3})\.§ ', r'\1. ', text)
    return text.strip()

def parse_boericke_mm(text):
    mm_start = text.find('ABIES CANADENSIS')
    if mm_start == -1: return []
    rep_start = text.find('"REPERTORY.', mm_start + 1000)
    if rep_start == -1: rep_start = len(text)
    mm_text = text[mm_start:rep_start]
    print(f"MM section: {len(mm_text):,} chars")
    lines = mm_text.split('\n')
    skip = {'MATERIA MEDICA','REPERTORY','INDEX','CHAPTER','SECTION','CLINICAL',
            'RELATIONSHIP','DOSE','HEAD','STOMACH','FEVER','FEMALE','MALE','SKIN',
            'SLEEP','MIND','EYE','EAR','NOSE','FACE','MOUTH','THROAT','ABDOMEN',
            'RECTUM','URINARY','RESPIRATORY','HEART','BACK','EXTREMITIES',
            'GENERALITIES','MODALITIES','CHEST','TEETH','LARYNX','BLOOD'}
    remedy_starts = []
    for i, line in enumerate(lines):
        s = line.strip()
        if not s or len(s) < 4 or len(s) > 80: continue
        upper = sum(1 for c in s if c.isupper())
        letters = sum(1 for c in s if c.isalpha())
        if letters < 3 or upper / letters < 0.7: continue
        if any(s.startswith(w) for w in skip) and len(s) < 30: continue
        if not re.search(r'[A-Z]{3,}', s): continue
        remedy_starts.append((i, s))
    print(f"Found {len(remedy_starts)} potential headers")
    remedies = []
    for idx, (li, header) in enumerate(remedy_starts):
        end = remedy_starts[idx+1][0] if idx+1 < len(remedy_starts) else len(lines)
        content = '\n'.join(lines[li:end]).strip()
        h = header.strip()
        if '—' in h:
            parts = h.split('—', 1)
            name = parts[0].strip().title()
            common = parts[1].strip() if len(parts) > 1 else ''
        elif re.match(r'^[A-Z][A-Z\s]+$', h):
            name = h.title(); common = ''
        else:
            name = h.title(); common = ''
        if len(name) < 3: continue
        for cl in lines[li+1:li+5]:
            cs = cl.strip()
            if cs.startswith('(') and cs.endswith(')') and not common:
                common = cs[1:-1].strip()
        body = '\n'.join(lines[li+1:end]).strip()
        body = clean_text(body)
        if not body or len(body) < 30: continue
        keynote = body[:500]
        for m in ['\n\n', '. ']:
            ki = keynote.find(m, 200)
            if ki > 0: keynote = keynote[:ki+1].strip(); break
        rid = re.sub(r'[^a-z0-9-]', '', name.lower().replace(' ', '-'))
        letter = name[0].upper() if name else '?'
        organs = []
        for org in ['Head','Stomach','Abdomen','Female','Male','Respiratory',
                     'Heart','Skin','Fever','Sleep','Mind','Eye','Ear','Nose',
                     'Face','Mouth','Throat','Rectum','Back','Extremities']:
            if re.search(rf'\b{org}\b\s*[—–-]', body, re.IGNORECASE):
                organs.append(org)
        chapter = ', '.join(organs[:3]) if organs else 'Various'
        remedies.append({
            'id': f'boericke-{rid}', 'name': name, 'common': common,
            'author': 'Boericke', 'letter': letter, 'chapter': chapter,
            'organ': chapter, 'modalities': ' ', 'constitution': keynote[:300],
            'relationships': '', 'dose': '', 'keynote': keynote, 'full': body,
        })
    by_name = {}
    for r in remedies:
        k = r['name'].lower()
        if k not in by_name or len(r['full']) > len(by_name[k]['full']):
            by_name[k] = r
    return list(by_name.values())

with open(INPUT, 'r', errors='replace') as f:
    raw = f.read()
print(f"Raw: {len(raw):,} chars, {len(raw.split()):,} words")
boericke = parse_boericke_mm(raw)
print(f"\nParsed {len(boericke)} Boericke remedies")
for r in boericke[:5]:
    print(f"  {r['name']} ({r.get('common','')}): {len(r['full']):,} chars")

with open(OUTPUT, 'r') as f:
    existing = json.load(f)
non_boericke = [r for r in existing if r.get('author') != 'Boericke']
combined = non_boericke + boericke
from collections import Counter
authors = Counter(r.get('author','?') for r in combined)
print(f"\nTotal: {len(combined)} remedies")
for a, c in authors.most_common():
    print(f"  {a}: {c}")

with open(OUTPUT, 'w', encoding='utf-8') as f:
    json.dump(combined, f, ensure_ascii=False, indent=2)
print(f"\n✓ Saved ({os.path.getsize(OUTPUT):,} bytes)")
