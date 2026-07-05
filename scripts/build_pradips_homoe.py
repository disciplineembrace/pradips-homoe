#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
Builds /home/z/my-project/download/pradips-homoe.html
A single-file personal digital homeopathic library with ALL features:
Home dashboard, Materia Medica, Repertory, Universal Search,
Favorites, Notes, History, Settings, Reader (themes + controls + highlights +
cross-reference), PWA, reading stats, daily quote.

All remedy text is paraphrased / written from scratch in plain clinical
language to stay clear of any copyrighted edition. Replace with your own
licensed book text for production use.
"""
import json
from pathlib import Path

OUT = Path("/home/z/my-project/download/pradips-homoe.html")
OUT.parent.mkdir(parents=True, exist_ok=True)

# =====================================================================
# DATA — REMEDIES (paraphrased keynotes, copyright-safe placeholders)
# =====================================================================
REMEDIES = [
    # ---- A ----
    {"id":"aconite","name":"Aconitum napellus","common":"Aconite / Monkshood","author":"Boericke","letter":"A","chapter":"Mind & Fever",
     "organ":"Heart, nerves, respiratory","modalities":"Worse: cold dry wind, night, fear. Better: open air, rest.",
     "constitution":"Tense, fearful, restless, predicts death.",
     "relationships":"Follows well: Arnica after trauma. Complementary: Sulphur in chronic fear states.",
     "keynote":"Sudden onset after fright or cold dry wind; intense fear, restlessness; may predict time of death.",
     "full":"Aconite is the first-aid remedy for complaints that come on suddenly after a shock, fright, or exposure to a cold dry wind. The picture is one of alarm: high fever, bright red face, dry hot skin, great restlessness, and a fear that something terrible will happen. The person may even predict the hour of death. It is most useful in the first 24 hours of an acute complaint; if symptoms have settled into a deeper pattern, another remedy will be needed."},
    {"id":"arnica","name":"Arnica montana","common":"Arnica / Leopard's Bane","author":"Boericke","letter":"A","chapter":"Trauma & Muscles",
     "organ":"Muscles, blood vessels, brain","modalities":"Worse: touch, motion, damp cold. Better: lying down, head low.",
     "constitution":"Denies illness; dreads being touched or approached.",
     "relationships":"Compare: Bellis perennis, Hypericum, Rhus-t. Follows well after surgery.",
     "keynote":"The remedy of bruises and shock. Says nothing is wrong even when clearly hurt; dreads being touched; bed feels too hard.",
     "full":"Arnica is the classic first-thought remedy after any physical trauma — a fall, a blow, overexertion, dental work, or surgery. The soreness is described as 'bruised' or 'beaten', and the bed feels hard and uncomfortable. Mentally, the person insists they are fine and refuses to be touched or approached, yet is fearful when alone. It is also invaluable for the lingering soreness after strokes or for cerebral shock."},
    {"id":"arg-nit","name":"Argentum nitricum","common":"Argentum nit / Silver Nitrate","author":"Phatak","letter":"A","chapter":"Mind & Nerves",
     "organ":"Nerves, stomach, eyes","modalities":"Worse: warmth, sweets, mental exertion. Better: open air, cold, pressure.",
     "constitution":"Impulsive, hurried, anxious, craves sweets.",
     "relationships":"Compare: Gelsemium (anticipatory anxiety), Lycopodium.",
     "keynote":"Hurried, anxious, anticipatory worry; splinter-like pains; craving for sweets; flatulence and diarrhea from nerves.",
     "full":"Argentum nitricum suits people who are impulsive, hurried, and worn down by anticipation — dreading an upcoming event, with diarrhea, dizziness, or palpitations. They crave sweets and strong food, but sweets bring on gastric complaints. Pains have a splinter-like quality. The person feels better in open air and from firm pressure, worse in a warm room and from mental exertion."},
    {"id":"ars-alb","name":"Arsenicum album","common":"Arsenicum / White Arsenic","author":"Boericke","letter":"A","chapter":"Digestion & Fever",
     "organ":"Stomach, intestines, lungs, skin","modalities":"Worse: midnight-3am, cold, cold drinks. Better: warmth, hot drinks, head elevated.",
     "constitution":"Anxious, fastidious, restless, fears death, chilly.",
     "relationships":"Compare: Carbo veg, Phosphorus. Complementary: Allium cepa for colds.",
     "keynote":"Anxious, restless, chilly; burning pains better from heat; fastidious; worse after midnight; thirst for sips.",
     "full":"Arsenicum covers a deep, restless anxiety — the person cannot settle, moves from bed to chair and back, fears death, and wants company. Burning pains are characteristic but are oddly better from heat. Digestive complaints — food poisoning, traveler's diarrhea, gastroenteritis — feature vomiting and diarrhea together, with weakness out of proportion. The patient is chilly, thirsty for frequent small sips, and worse between midnight and 3 am."},
    {"id":"ascaris","name":"Ascaris lumbricoides","common":"Ascaris / Roundworm","author":"Murphy","letter":"A","chapter":"Children & Parasites",
     "organ":"Intestines, lungs","modalities":"Worse: at night, full moon. Better: scratching.",
     "constitution":"Irritable child, picks nose, grinds teeth.",
     "relationships":"Compare: Cina, Teucrium, Spigelia.",
     "keynote":"Worm-based picture in children — grinding teeth at night, picking nose, itchy anus, irritability.",
     "full":"Used in Murphy-style clinical repertory for the child with classic worm picture: pale face with dark circles, picking at the nose, grinding teeth at night, restless sleep, occasional convulsions, and itchy anus. Symptoms often worsen around the full moon. Compare closely with Cina, which has a more pronounced tantrum picture."},
    # ---- B ----
    {"id":"belladonna","name":"Belladonna","common":"Belladonna / Deadly Nightshade","author":"Boericke","letter":"B","chapter":"Fever & Head",
     "organ":"Brain, throat, skin","modalities":"Worse: jarring, light, noise, draft, lying down. Better: semi-erect, rest, warm room.",
     "constitution":"Violent, sudden, throbbing; hot, red, dry.",
     "relationships":"Compare: Aconite (early stage), Stramonium. Complementary: Calcarea carb.",
     "keynote":"Sudden, violent, throbbing complaints with heat and redness. Worse from jarring, light, noise; pupils often dilated.",
     "full":"Belladonna is the remedy of sudden, violent complaints — high fever with burning heat, throbbing headache, flushed face, glassy eyes, dilated pupils. Onset is abrupt and intense; the person is drowsy yet restless, or briefly delirious. Symptoms come and go quickly and are aggravated by the slightest jar, draft, light, or noise. Useful in fevers, sore throats with bright red appearance, and headaches that throb with each heartbeat."},
    {"id":"bryonia","name":"Bryonia alba","common":"Bryonia / Wild Hops","author":"Boericke","letter":"B","chapter":"Chest & Digestion",
     "organ":"Lungs, liver, joints, intestines","modalities":"Worse: motion, warmth, eating. Better: rest, pressure, lying on painful side.",
     "constitution":"Irritable, wants to be left alone, thirsty for large quantities.",
     "relationships":"Compare: Nux vomica, Rhus-t. Complementary: Aconite, Phosphorus.",
     "keynote":"Worse from any motion; dryness of mucous membranes; thirst for large quantities at long intervals; irritable, wants to be left alone.",
     "full":"Bryonia is dominated by the general modality 'worse from motion' and 'better from rest and pressure'. The patient is dry — dry lips, dry stool, dry cough — and thirsty for large amounts of cold water at long intervals. Mentally irritable, wants to be left alone, doesn't want to be disturbed or even spoken to. Pains are stitching and improve with hard pressure and lying on the painful side. Pneumonia, constipation, headaches, and joint pains all fit when the modalities match."},
    {"id":"baryta-c","name":"Baryta carbonica","common":"Baryta carb / Barium Carbonate","author":"Murphy","letter":"B","chapter":"Mind & Glands",
     "organ":"Glands, brain","modalities":"Worse: cold, damp, thinking. Better: walking in open air.",
     "constitution":"Shy, childish, delayed development, glandular swelling.",
     "relationships":"Compare: Calcarea, Carcinosinum. Complementary: Lycopodium in elderly.",
     "keynote":"Shy, lacks confidence, hides behind mother; chronic enlarged glands; delayed milestones in children; senile dementia in elderly.",
     "full":"Baryta carb has two poles — the child who is slow to develop, shy, and chronically swollen tonsils or adenoids; and the elderly person who regresses into childishness, with memory loss, enlarged prostate, and recurrent sore throats. The person is hypersensitive to cold and damp, worse from thinking, and feels better walking in open air."},
    # ---- C ----
    {"id":"calcarea","name":"Calcarea carbonica","common":"Calcarea / Calcium Carbonate","author":"Boericke","letter":"C","chapter":"Constitution & Bones",
     "organ":"Bones, glands, digestion","modalities":"Worse: cold, damp, exertion, milk. Better: dry, warm, lying down.",
     "constitution":"Chilly, flabby, sweaty head, craves eggs, anxious when overworked.",
     "relationships":"Compare: Baryta carb, Lycopodium, Phosphorus. Complementary: Belladonna, Nitric acid.",
     "keynote":"Chilly, flabby, sweaty head in children; craves eggs and indigestible things; slow developers; anxious and overworked.",
     "full":"Calcarea carb is a major constitutional remedy for the slow, flabby, chilly type — often a fair, fat, flabby person who sweats on the head at night (in children, the pillow is wet), craves eggs and odd things like chalk or pencils, and is easily tired by exertion. Mind: anxious when things go wrong, fears losing reason, dreads going insane. Useful in infancy issues (delayed teething, slow walking), and in chronic conditions where there is a 'never well since' foundation."},
    {"id":"carcinosin","name":"Carcinosinum","common":"Carcinosin / Carcinosine","author":"Murphy","letter":"C","chapter":"Constitution & Mind",
     "organ":"Mind, endocrine, immune","modalities":"Worse: suppression, grief, reproach. Better: walking in nature, music, sea.",
     "constitution":"Sensitive, perfectionist, history of suppression, loves travel.",
     "relationships":"Compare: Natrum mur, Phosphorus, Staphysagria.",
     "keynote":"Sensitive, fastidious, suppressed emotions; history of prolonged grief or abuse; loves travel, music, animals; sleeplessness.",
     "full":"Carcinosinum suits people who are deeply responsible, perfectionist, and have often suppressed their own needs for others. There is frequently a history of prolonged grief, abuse, or illness in childhood. They love travel, music, thunderstorms, and animals, and may have sleep problems and a strong desire for fatty food. Useful when well-selected remedies fail to act or only partially help."},
    {"id":"chamomilla","name":"Chamomilla","common":"Chamomilla / German Chamomile","author":"Phatak","letter":"C","chapter":"Children & Pain",
     "organ":"Nerves, teeth, digestion","modalities":"Worse: heat, anger, night. Better: being carried, warm wet weather.",
     "constitution":"Extremely irritable, snappish, nothing pleases, demands then rejects.",
     "relationships":"Compare: Cina, Nux vomica, Staphysagria.",
     "keynote":"Extreme irritability, especially teething children; one cheek red, the other pale; demands things then pushes them away; pain seems unbearable.",
     "full":"Chamomilla is the remedy of unbearable pain and unmanageable irritability, especially in teething infants. The child is only calm when carried — the moment they are put down they scream. One cheek is red, the other pale. They demand a toy or food, then throw it away the moment it is given. Adults who need Chamomilla are snappish, insensitive to others' suffering, and intolerant of being spoken to. Pains feel intolerable, often with hot sweat on the face."},
    {"id":"china","name":"Cinchona officinalis","common":"China / Peruvian Bark","author":"Boericke","letter":"C","chapter":"Debility & Digestion",
     "organ":"Blood, spleen, nerves","modalities":"Worse: touch, draft, loss of fluids. Better: hard pressure, bending double, open air.",
     "constitution":"Ailments from loss of blood or vital fluids; bloated but not relieved by belching.",
     "relationships":"Compare: Carbo veg, Natrum mur, Ferrum met.",
     "keynote":"Ailments from loss of vital fluids (hemorrhage, diarrhea, lactation); bloating not relieved by belching; sensitive to touch yet better from hard pressure.",
     "full":"China is the great remedy for states of exhaustion following loss of vital fluids — heavy bleeding, prolonged diarrhea, lactation, or repeated sweat baths. The abdomen is bloated and tympanitic, and belching does not relieve. The patient is hypersensitive to touch, yet pains are better from hard pressure and bending double. Periodic neuralgias returning every other day also suggest China."},
    {"id":"cina","name":"Cina","common":"Cina / Wormseed","author":"Murphy","letter":"C","chapter":"Children & Parasites",
     "organ":"Intestines, nerves","modalities":"Worse: touch, night. Better: lying on abdomen.",
     "constitution":"Irritable, kicks and screams, grinds teeth, picks nose.",
     "relationships":"Compare: Chamomilla, Ascaris, Teucrium.",
     "keynote":"Worm picture in children — extreme irritability, grinding teeth, picking nose, jerking during sleep, hunger but food is refused.",
     "full":"Cina is the children's worm remedy par excellence. The child is cross, contrary, and violent — kicks and screams, will not be touched or even looked at. They grind their teeth in sleep, pick their nose, have a variable appetite (hungry then refuse food), and suffer from itching at the anus and jerking of limbs. Face is pale with dark circles under the eyes; the pupil may be dilated."},
    {"id":"colocynth","name":"Colocynthis","common":"Colocynth / Bitter Cucumber","author":"Phatak","letter":"C","chapter":"Abdomen & Nerves",
     "organ":"Intestines, nerves (face, sciatic)","modalities":"Worse: anger, indignation, eating. Better: hard pressure, bending double, warmth.",
     "constitution":"Ill after anger or indignation; craves relief from doubling up.",
     "relationships":"Compare: Staphysagria (anger), Magnesium phos (cramping).",
     "keynote":"Agonizing abdominal cramps forcing the person to bend double or press hard; pains often follow anger or indignation.",
     "full":"Colocynth is one of the great abdominal cramp remedies — the pain is agonizing, forcing the patient to bend double, press something hard into the abdomen, or lie on the stomach. Warmth and hard pressure relieve. The pain commonly follows a fit of anger or indignation. It also covers sciatica of the same character — better from bending the leg, warmth, and hard pressure."},
    # ---- G ----
    {"id":"gels","name":"Gelsemium sempervirens","common":"Gelsemium / Yellow Jasmine","author":"Boericke","letter":"G","chapter":"Nerves & Fever",
     "organ":"Nerves, muscles, heart","modalities":"Worse: anticipation, damp weather, bad news. Better: open air, motion, stimulants.",
     "constitution":"Dull, drowsy, trembling; anticipation anxiety.",
     "relationships":"Compare: Argentum nit, Conium, Phosphoric acid.",
     "keynote":"Heavy, drowsy, trembling; anticipation anxiety; dull headache in occiput; wants to be held; no thirst.",
     "full":"Gelsemium is the remedy of anticipatory anxiety and weakness — the body feels heavy, drowsy, trembling, and reluctant to move. There is typically no thirst even with fever. Headache begins in the neck or occiput and spreads over the head. The person feels better in open air and from urination. Stage fright, exam nerves, and flu with heaviness and chills up and down the spine all fit Gelsemium."},
    # ---- I ----
    {"id":"ignatia","name":"Ignatia amara","common":"Ignatia / St. Ignatius Bean","author":"Boericke","letter":"I","chapter":"Mind & Grief",
     "organ":"Nerves, digestion","modalities":"Worse: grief, coffee, tobacco. Better: eating, walking, pressure.",
     "constitution":"Sensitive, idealistic, sighs, holds grief in, paradoxical symptoms.",
     "relationships":"Compare: Natrum mur, Phosphoric acid, Pulsatilla.",
     "keynote":"Grief and disappointment held in — sighing, lump-in-throat sensation, contradictory and paradoxical symptoms.",
     "full":"Ignatia is the classic remedy for acute grief, especially silent or suppressed grief following loss, disappointment in love, or reprimand. Symptoms are contradictory — the sore throat better from swallowing solids, the cough better from eating, the nausea better from eating. Frequent sighing, a sensation of a lump in the throat, and rapid alternation of laughing and crying all point to Ignatia. The person is intensely sensitive to contradiction and reproach."},
    {"id":"iodum","name":"Iodum","common":"Iodum / Iodine","author":"Murphy","letter":"I","chapter":"Glands & Metabolism",
     "organ":"Thyroid, glands, heart","modalities":"Worse: warmth, rest. Better: open air, motion, eating.",
     "constitution":"Hot, restless, anxious, eats ravenously yet loses weight.",
     "relationships":"Compare: Lycopus, Spongia, Bromium.",
     "keynote":"Hot, restless, must move; eats enormously yet loses weight; enlarged glands; anxious if alone.",
     "full":"Iodum suits the hyperthyroid picture — the person is hot, restless, and must keep moving; eating huge amounts yet losing weight. Glands enlarge but become hard. The patient is anxious, fears being alone, and feels better in open air and from eating. The picture contrasts sharply with cold, sluggish remedies."},
    # ---- L ----
    {"id":"lachesis","name":"Lachesis mutus","common":"Lachesis / Bushmaster Venom","author":"Murphy","letter":"L","chapter":"Mind & Circulation",
     "organ":"Blood, heart, throat, ovaries","modalities":"Worse: on waking, tight clothing, heat, menopause. Better: open air, warm drinks, appearance of discharges.",
     "constitution":"Jealous, talkative, suspicious, loquacious; left-sided; worse on waking.",
     "relationships":"Compare: Crotalus horridus, Naja, Pulsatilla (right-sided).",
     "keynote":"Jealous, suspicious, talkative; left-sided complaints; worse on waking and from tight clothing around waist or neck; purple discoloration.",
     "full":"Lachesis is one of the great climacteric remedies. The person is intense — jealous, suspicious, loquacious, often religious or grandiose. Symptoms are predominantly left-sided, worse on waking (the person dreads sleep and feels worse the moment they wake), and worse from anything tight around the waist or throat. Hot flushes, purple discoloration of skin, and bleeding that is dark and non-coagulating are characteristic."},
    {"id":"lyco","name":"Lycopodium clavatum","common":"Lycopodium / Club Moss","author":"Murphy","letter":"L","chapter":"Digestion & Mind",
     "organ":"Liver, digestion, urinary, right side","modalities":"Worse: 4-8pm, warm room, tight clothing. Better: warm food, motion, uncovering.",
     "constitution":"Authoritative yet insecure, fears failure, right-sided, bloating.",
     "relationships":"Compare: Pulsatilla, Nux vomica, Sulphur. Complementary: Iodium.",
     "keynote":"Bloating that builds through the day, worse 4-8pm; bluff confidence hiding self-doubt; right-sided complaints.",
     "full":"Lycopodium's digestive sphere is dominated by bloating that builds through the day, fullness after small meals, rumbling, and intolerance of tight clothing at the waist. Cravings for sweets and warm food are common. Mentally, the Lycopodium type appears authoritative, even bossy, in public, yet is privately anxious about failure, illness, or being alone. Right-sided complaints are typical; symptoms worsen between 4 and 8 pm."},
    # ---- N ----
    {"id":"nat-mur","name":"Natrum muriaticum","common":"Natrum mur / Sodium Chloride","author":"Phatak","letter":"N","chapter":"Mind & Headache",
     "organ":"Nerves, blood, skin","modalities":"Worse: sun, heat, consolation, 10-11am. Better: open air, rest, sweating.",
     "constitution":"Reserved, holds grief in, hates consolation, craves salt.",
     "relationships":"Compare: Ignatia, Phosphoric acid, Sepia.",
     "keynote":"Grief held in — averse to consolation; migraine with throbbing; craving for salt; mapped tongue; herpes on lips.",
     "full":"Natrum mur is the great unwept grief remedy. The person is reserved, hates being consoled (and feels worse from it), dwells on past unpleasant events, and may be deeply romantic yet defensive. Physically: blinding migraines, craving for salt, aversion to bread, mapped tongue, cold sores on the lips, and recurrent cold sores after sun exposure. Worse around 10-11 am and from sun."},
    {"id":"nux-vom","name":"Nux vomica","common":"Nux vomica / Poison Nut","author":"Boericke","letter":"N","chapter":"Digestion & Mind",
     "organ":"Liver, digestion, nerves","modalities":"Worse: morning, eating, cold, stimulants. Better: nap, warmth, stool.",
     "constitution":"Driven, irritable, over-indulgent, chilly, competitive.",
     "relationships":"Compare: Bryonia, Chamomilla, Lycopodium.",
     "keynote":"Over-worked, over-indulged, chilly and irritable; digestive upset after rich food, coffee, or alcohol.",
     "full":"Nux vomica fits the driven, competitive personality who pushes through with stimulants — coffee, alcohol, rich food, work — and then pays for it with heartburn, constipation with ineffectual urging, irritability at the smallest noise or interruption, and chilliness. They are impatient, scolding, and hypersensitive to external impressions. Worse in the morning, after eating, in cold air; better from a short nap and warmth."},
    # ---- P ----
    {"id":"phos","name":"Phosphorus","common":"Phosphorus / White Phosphorus","author":"Murphy","letter":"P","chapter":"Chest & Nerves",
     "organ":"Lungs, nerves, blood, stomach","modalities":"Worse: lying on left side, evening, thunderstorms. Better: sleep, eating, company.",
     "constitution":"Sensitive, affectionate, artistic, impressionable, fears being alone.",
     "relationships":"Compare: Tuberculinum, Arsenicum, Carcinosinum.",
     "keynote":"Sensitive, sympathetic, craves company and reassurance; bleeds easily; sensitive to external impressions.",
     "full":"Phosphorus suits the affectionate, artistic, easily-startled type who absorbs the moods of people around them and craves company. Physically: tendency to nosebleeds or easy bruising, burning pains, great thirst for cold drinks (which are vomited once they warm in the stomach). Worse from lying on the left side, in the evening, and in thundery weather; better from sleep and eating. Pneumonia, gastritis, and bleeding disorders all fit when the modalities match."},
    {"id":"phatak-phatak","name":"Phatak's Materia Medica","common":"Phatak Concordance","author":"Phatak","letter":"P","chapter":"Reference",
     "organ":"—","modalities":"—","constitution":"—","relationships":"—",
     "keynote":"Author of the Concordance-style Materia Medica used here for cross-references.",
     "full":"S. R. Phatak's concordance materia medica is widely used for its rubric-style arrangement of symptoms. We use it here as a placeholder reference card — remove this entry if you do not want a 'book card' as a remedy entry."},
    {"id":"puls","name":"Pulsatilla nigricans","common":"Pulsatilla / Windflower","author":"Phatak","letter":"P","chapter":"Mind & Discharges",
     "organ":"Mucous membranes, ovaries, eyes","modalities":"Worse: warm room, rich food, twilight, beginning of motion. Better: open air, cold applications, gentle motion.",
     "constitution":"Mild, weepy, craves sympathy, changeable, thirstless.",
     "relationships":"Compare: Ignatia, Sepia, Lycopodium.",
     "keynote":"Mild, weepy, craves company and sympathy; symptoms constantly shift; worse in a warm room, better in open air.",
     "full":"Pulsatilla is the 'changeable' remedy — thirstlessness, changeable moods, discharges that are bland and yellow-green. The person wants a window open, wants company nearby, cries easily and feels better for consolation. Complaints often follow suppressed grief or getting chilled after being overheated. Worse in a warm stuffy room and at twilight; better in open air and from cold applications."},
    # ---- R ----
    {"id":"rhus-t","name":"Rhus toxicodendron","common":"Rhus tox / Poison Ivy","author":"Phatak","letter":"R","chapter":"Joints & Skin",
     "organ":"Joints, muscles, skin","modalities":"Worse: first motion, rest, damp cold. Better: continued motion, warmth, stretching.",
     "constitution":"Restless, anxious at night, constantly shifts position.",
     "relationships":"Compare: Bryonia (opposite modality), Calcarea phos.",
     "keynote":"Rusty-gate stiffness — worse on first motion, better on continued motion; worse damp cold, better warm and dry.",
     "full":"Rhus tox is the rusty-gate remedy — joints and muscles feel stiff and painful on starting to move but loosen with continued gentle motion, only to ache again after prolonged exertion. The person is restless, constantly changing position seeking a comfortable one. The skin has red, itchy eruptions that burn and are better from hot water. Aggravated by cold, damp, or getting wet; better from warmth and continued motion."},
    # ---- S ----
    {"id":"sepia","name":"Sepia officinalis","common":"Sepia / Cuttlefish Ink","author":"Murphy","letter":"S","chapter":"Mind & Female",
     "organ":"Uterus, liver, skin","modalities":"Worse: cold air, before thunderstorm, morning, pregnancy. Better: vigorous exercise, warmth, hot food.",
     "constitution":"Worn out, indifferent to loved ones, wants to be alone, dragging pelvic sensation.",
     "relationships":"Compare: Lycopodium, Pulsatilla, Lachesis.",
     "keynote":"Worn out — indifferent to loved ones, wants to be alone; dragging pelvic sensation; better from vigorous exercise.",
     "full":"Sepia is the great remedy for the over-stretched mother — worn out, dragged down, indifferent even to her own family, and wanting only to be left alone. There is a characteristic bearing-down sensation as if the pelvic organs would escape, often with constipation and a yellow saddle across the nose. She feels remarkably better from vigorous exercise (the more exhausted she is, the more she needs to move), warmth, and hot food."},
    {"id":"silicea","name":"Silicea","common":"Silicea / Silica","author":"Boericke","letter":"S","chapter":"Skin & Immunity",
     "organ":"Skin, bones, glands, nerves","modalities":"Worse: cold, damp, suppression of sweat. Better: warmth, wrapping up.",
     "constitution":"Refined, intellectual, lacks 'grit', chilly, sweaty feet.",
     "relationships":"Compare: Calcarea, Hepar sulph, Pulsatilla.",
     "keynote":"Lacks 'grit' — refined but fragile; sweaty offensive feet; suppurations; foreign body expulsion; chilly, wants to wrap up.",
     "full":"Silicea is the remedy for the refined, fragile type who lacks 'grit' — both mentally and physically. They are chilly, want to be wrapped up, have sweaty offensive feet yet cannot bear to have them uncovered. The remedy promotes suppuration — ripens abscesses, expels foreign bodies, and helps chronic fistulas. Mentally there is anxiety about small things, fear of pointed objects (needles, knives), and a yield-yielding but obstinate streak."},
    {"id":"staph","name":"Staphysagria","common":"Staphysagria / Delphinium","author":"Murphy","letter":"S","chapter":"Mind & Urinary",
     "organ":"Urinary tract, teeth, nerves","modalities":"Worse: anger, indignation, grief, sexual excess. Better: warmth, rest, breakfast.",
     "constitution":"Suppressed anger, dignified, sensitive to rudeness, sexual preoccupation.",
     "relationships":"Compare: Colocynth, Ignatia, Natrum mur.",
     "keynote":"Ailments from suppressed anger or indignation; dignified yet hypersensitive to rudeness; cystitis after sex; teeth decay.",
     "full":"Staphysagria covers complaints following suppressed anger, indignation, or sexual excess. The person is dignified and refined yet hypersensitive to rudeness — even slight offenses are brooded over. Cystitis and urinary complaints after sexual intercourse, post-surgical wounds, and teeth that decay early or turn black are characteristic. There is a strong sexual preoccupation in many cases."},
    {"id":"sulph","name":"Sulphur","common":"Sulphur / Sulfur","author":"Boericke","letter":"S","chapter":"Constitution & Skin",
     "organ":"Skin, digestion, circulation","modalities":"Worse: warmth of bed, bathing, 11am, standing. Better: dry, warm, open air.",
     "constitution":"Hot-blooded, untidy, philosophical, theorizes, lazy.",
     "relationships":"Compare: Calcarea, Lycopodium, Psorinum. Often 'opens the case' before deeper remedy.",
     "keynote":"Untidy philosopher — hot-blooded, theorizing, skin complaints that itch and burn; worse from bathing and heat of bed.",
     "full":"Sulphur is the great unraveller of chronic cases. The Sulphur type is hot-blooded, untidy, intellectually active but lazy in execution, given to theorizing. Skin complaints — itching, burning, scratching until bleeding or raw — are worse from the warmth of the bed and from bathing. There is a characteristic 11 am aggravation, aversion to washing, and standing-worse modality. Often used to 'open' a stuck case before the deeper constitutional remedy."},
    # ---- T ----
    {"id":"thuja","name":"Thuja occidentalis","common":"Thuja / Arbor Vitae","author":"Boericke","letter":"T","chapter":"Constitution & Skin",
     "organ":"Skin, urinary, nerves","modalities":"Worse: cold damp, vaccination, tea. Better: warmth, motion, left side.",
     "constitution":"Secretive, feels 'ugly' or 'unacceptable', fixed ideas, oily skin.",
     "relationships":"Compare: Medorrhinum, Nitric acid, Silicea.",
     "keynote":"Secretive, hidden side; fixed ideas (feels fragile glass, pregnant when not); oily skin; warts; ailments after vaccines.",
     "full":"Thuja is the great sycotic remedy. The person has a hidden side, feels 'ugly' or 'unacceptable', and may have fixed ideas — believes they are made of glass, or that a person beside them is present when they are not. Skin is oily with warts (especially on face or genitals), and there are complaints after vaccination (especially smallpox). Urinary tract and respiratory catarrhs are common. Better from warmth and motion; worse from cold damp and tea."},
    {"id":"tub","name":"Tuberculinum bovinum","common":"Tuberculinum / TB Nosode","author":"Murphy","letter":"T","chapter":"Constitution & Respiratory",
     "organ":"Lungs, glands, mind","modalities":"Worse: damp, cold, morning. Better: open air, motion, music.",
     "constitution":"Romantic, restless, longs for travel, recurrent colds, weak lungs.",
     "relationships":"Compare: Phosphorus, Calcarea phos, Carcinosinum.",
     "keynote":"Romantic, restless; longs to travel; recurrent respiratory infections; family history of TB; needs constant change.",
     "full":"Tuberculinum suits people who are romantic, restless, and long to travel — they need constant change of scene. Physically, there is a tendency to recurrent colds that go to the chest, weak lungs, and a family history of tuberculosis. Children who need it grow rapidly, are tall and thin, and catch cold easily. Often used as an intercurrent when well-selected remedies stop working."},
    # ---- Extra entries to round out library ----
    {"id":"ant-tart","name":"Antimonium tartaricum","common":"Antim tart / Tartar Emetic","author":"Boericke","letter":"A","chapter":"Chest & Cough",
     "organ":"Lungs, bronchi","modalities":"Worse: lying down, damp cold. Better: sitting up, expectoration.",
     "constitution":"Drowsy, weak, rattling cough.",
     "relationships":"Compare: Ipecac, Bryonia.",
     "keynote":"Rattling cough with weakness — chest full of mucus but cannot raise it; drowsy, sweaty; child wants to be carried.",
     "full":"Antim tart has the picture of a chest full of mucus that the patient is too weak to raise — a coarse rattling on auscultation yet little expectoration. The patient is drowsy, irritable, and sweaty. Children who need it want to be carried and do not want to be touched or looked at. Cough is worse lying down and after eating; better from sitting up and from expectoration."},
    {"id":"apismel","name":"Apis mellifica","common":"Apis / Honeybee","author":"Phatak","letter":"A","chapter":"Skin & Allergy",
     "organ":"Skin, mucous membranes, kidneys","modalities":"Worse: warmth, touch, afternoon, right side. Better: cold, open air, uncovering.",
     "constitution":"Busy, restless, awkward, jealous.",
     "relationships":"Compare: Belladonna, Urtica urens.",
     "keynote":"Sudden swelling, edema, rosy-pink; stinging, burning pains; worse from heat, better from cold applications.",
     "full":"Apis has edema and swelling as its central theme — sudden, rosy-pink, puffy swelling, especially of eyelids, face, or throat. Pains are stinging and burning, worse from heat and touch, better from cold applications and uncovering. The patient is restless, awkward, and may be jealous or suspicious. Useful for allergic reactions, hives, and acute edematous complaints."},
    {"id":"baptisia","name":"Baptisia tinctoria","common":"Baptisia / Wild Indigo","author":"Murphy","letter":"B","chapter":"Fever & Septic",
     "organ":"Blood, intestines","modalities":"Worse: humid heat, fog, indoors. Better: open air, stimulants.",
     "constitution":"Confused, sleepy, falls asleep mid-sentence.",
     "relationships":"Compare: Arsenicum, Pyrogen, Echinacea.",
     "keynote":"Septic fever with stupor; face dark red; confused — tries to assemble scattered limbs; offensiveness.",
     "full":"Baptisia is a major septic fever remedy. The patient is profoundly drowsy and confused — falls asleep while being spoken to, or in the middle of a sentence. There is a sensation of being scattered in pieces, with the patient trying to gather their limbs together. Face is dark red, discharges are offensive, and the tongue is coated brownish. Useful in typhoid states and severe septic fevers."},
    {"id":"calendula","name":"Calendula officinalis","common":"Calendula / Marigold","author":"Boericke","letter":"C","chapter":"Wounds & Skin",
     "organ":"Skin, mucous membranes","modalities":"Worse: open air on wound, damp. Better: warmth, resting the part.",
     "constitution":"—","relationships":"Compare: Hypericum, Symphytum.",
     "keynote":"Wound-healing remedy — ragged lacerations, slow-to-heal cuts, suppurating wounds; excessive pain out of proportion.",
     "full":"Calendula is the great wound-healing remedy, especially for ragged lacerations and slow-to-heal cuts. Pain is excessive and out of proportion to the wound. Useful as a topical (dilute tincture) and internally for promoting healthy granulation and preventing suppuration. Also useful after dental work or surgical incisions."},
    {"id":"eup-per","name":"Eupatorium perfoliatum","common":"Eupatorium / Boneset","author":"Boericke","letter":"E","chapter":"Fever & Bones",
     "organ":"Bones, muscles, liver","modalities":"Worse: cold air, periodicity, morning. Better: sweating, getting on hands and knees.",
     "constitution":"Sad, restless, groans with pain.",
     "relationships":"Compare: Bryonia, Rhus-t, Gelsemium.",
     "keynote":"Bone-breaking pain — as if bones were broken; chill between 7-9 am; groaning with bone pain; bilious vomiting.",
     "full":"Eupatorium perfoliatum is the bone-breaking fever remedy. The characteristic pain feels as if the bones were broken — severe aching in the bones, with the patient groaning and wanting to lie on the painful part. The chill typically comes between 7 and 9 am, preceded by thirst. There is bilious vomiting, aching in the limbs, and great soreness. Dengue and influenza often present this picture."},
    {"id":"hypericum","name":"Hypericum perforatum","common":"Hypericum / St. John's Wort","author":"Boericke","letter":"H","chapter":"Nerves & Trauma",
     "organ":"Nerves, spine, brain","modalities":"Worse: touch, jarring, damp fog. Better: bending head backward.",
     "constitution":"—","relationships":"Compare: Arnica, Ledum, Rhus-t.",
     "keynote":"Injury to nerves or nerve-rich parts — fingers, toes, spine; shooting pains along nerve; concussion.",
     "full":"Hypericum is the remedy for injuries to nerves or nerve-rich parts — fingers, toes, spine, tailbone, teeth. Shooting, tearing pains follow the nerve distribution. It is the first remedy to think of after concussion or any crush injury to fingertips or toes. Pains are worse from touch, jarring, and damp fog; better from bending the head backward."},
    {"id":"hepar","name":"Hepar sulphuris calcareum","common":"Hepar sulph / Calcium Sulphide","author":"Phatak","letter":"H","chapter":"Skin & Throat",
     "organ":"Skin, mucous membranes, glands","modalities":"Worse: cold, dry cold wind, touch, draft. Better: warmth, wrapping up, damp weather.",
     "constitution":"Chilly, hypersensitive to pain, irritable, impulsive.",
     "relationships":"Compare: Silicea, Calcarea, Mercurius.",
     "keynote":"Hypersensitive to pain — slightest pain feels unbearable; cold, draft causes illness; craves sour foods; suppurations.",
     "full":"Hepar sulph is one of the most chilly, hypersensitive remedies. The slightest pain feels unbearable; the patient screams at the prospect of being touched. They are irritable, impulsive, and may regret their outbursts. Skin suppurations are common — abscesses, boils, and acne that splinter and bleed easily. Cravings for sour and pungent foods. Better from warmth, wrapping up, and damp weather; worse from cold and draft."},
    {"id":"ipacec","name":"Ipecacuanha","common":"Ipecac / Ipecac Root","author":"Murphy","letter":"I","chapter":"Nausea & Chest",
     "organ":"Stomach, intestines, chest","modalities":"Worse: periodicity, lying. Better: open air, rest.",
     "constitution":"—","relationships":"Compare: Antim tart, Arsenicum, Nux vomica.",
     "keynote":"Persistent nausea not relieved by vomiting; clean tongue; chest rattling; bright red hemorrhage.",
     "full":"Ipecac is dominated by persistent nausea that is not relieved by vomiting. The tongue is clean (not coated), there is profuse salivation, and the cough is dry and rattling. Asthma with chest full of mucus, nausea with stomach complaints, and bright red hemorrhage (nosebleeds, hemoptysis, menses) all fit. Better in open air and from rest; worse from periodicity and lying down."},
    {"id":"ledum","name":"Ledum palustre","common":"Ledum / Marsh Tea","author":"Boericke","letter":"L","chapter":"Wounds & Joints",
     "organ":"Skin, joints, eyes","modalities":"Worse: warmth, night, motion. Better: cold, cold applications, putting feet in cold water.",
     "constitution":"—","relationships":"Compare: Apis, Hypericum, Rhus-t.",
     "keynote":"Punctures, insect bites, animal bites; cold to touch yet better from cold applications; rheumatism travels upward.",
     "full":"Ledum is the remedy for puncture wounds — nails, needles, insect stings, animal bites — and for rheumatic complaints that begin in the feet and travel upward. The affected part is cold to touch, yet cold applications and cold water relieve (the foot in cold water is a keynote). Useful for black eyes (after Arnica) and for the local effects of insect bites."},
    {"id":"mag-phos","name":"Magnesia phosphorica","common":"Mag phos / Magnesium Phosphate","author":"Phatak","letter":"M","chapter":"Nerves & Pain",
     "organ":"Nerves, muscles","modalities":"Worse: cold, night, right side. Better: heat, pressure, bending double.",
     "constitution":"—","relationships":"Compare: Colocynth, Nux vomica.",
     "keynote":"Spasmodic cramping pains relieved by heat and hard pressure; dysmenorrhea with bending double.",
     "full":"Mag phos is the antispasmodic for cramping, shooting, lightning-like pains, especially in nerves and muscles. The pains force the patient to bend double and are relieved by hard pressure and warmth. Dysmenorrhea, writer's cramp, and hiccups all fit. Worse from cold and at night; better from heat, pressure, and bending double."},
    {"id":"merc","name":"Mercurius solubilis","common":"Merc sol / Mercury","author":"Boericke","letter":"M","chapter":"Throat & Glands",
     "organ":"Glands, mucous membranes, mouth","modalities":"Worse: night, damp, warmth of bed, sweating. Better: moderate temperature.",
     "constitution":"Slow, hesitant, anxious, restless at night.",
     "relationships":"Compare: Hepar, Silicea, Lachesis.",
     "keynote":"Both hot and cold extremes aggravate; profuse sweating without relief; offensive discharges; trembling; salivation.",
     "full":"Mercurius is the great glandular and mucous membrane remedy. The patient is sensitive to both heat and cold — worse from either extreme. Profuse sweating does not relieve, discharges are offensive, the tongue is flabby with imprints of teeth, and there is excessive salivation — drooling on the pillow at night. Sore throats with swelling, ulcers, and night aggravation fit. Trembling and a slow, hesitant manner are common."},
    {"id":"nit-ac","name":"Nitricum acidum","common":"Nitric acid / HNO3","author":"Murphy","letter":"N","chapter":"Skin & Mind",
     "organ":"Skin, mucous membranes, stomach","modalities":"Worse: cold, damp, contact, milk. Better: riding in carriage.",
     "constitution":"Anxious, irritable, despairing, fears death.",
     "relationships":"Compare: Thuja, Mercurius, Hepar.",
     "keynote":"Splinter-like pains; fissures at muco-cutaneous junctions; warts; offensive discharges; affects of abandoned grief.",
     "full":"Nitric acid has splinter-like pains — as of a fishbone stuck in the throat — and fissures at the muco-cutaneous junctions (corners of mouth, anus, nostrils). Warts are large, jagged, and bleed easily. Discharges are offensive — urine smells like horse's urine. The person is anxious, irritable, and despairing, often with the feeling of being abandoned or unloved."},
    {"id":"nux-mos","name":"Nux moschata","common":"Nux mosch / Nutmeg","author":"Murphy","letter":"N","chapter":"Mind & Digestion",
     "organ":"Nerves, digestion, mind","modalities":"Worse: cold, damp. Better: warmth, rest.",
     "constitution":"Dreamy, changeable, drowsy, faints easily.",
     "relationships":"Compare: Pulsatilla, Lycopodium, Nux vomica.",
     "keynote":"Extreme drowsiness after eating; changeable mood; dry mucous membranes yet no thirst; faintness.",
     "full":"Nux moschata produces extreme drowsiness, especially after eating — the person falls asleep mid-meal. The mood is changeable, the mucous membranes are dry, yet there is no thirst. There is a tendency to faint, especially in crowded rooms. Useful for hysteria, fainting, and complaints with dryness without thirst."},
    {"id":"psorinum","name":"Psorinum","common":"Psorinum / Psora Nosode","author":"Boericke","letter":"P","chapter":"Constitution & Skin",
     "organ":"Skin, immune, mind","modalities":"Worse: cold, open air, full moon. Better: warmth, lying with head high, eating.",
     "constitution":"Chilly, dirty, despairing, fears poverty, anxious.",
     "relationships":"Compare: Sulphur, Thuja, Carcinosinum.",
     "keynote":"Cold, dirty, despairing; skin complaints suppressed return as asthma; fears poverty; extraordinarily sensitive to cold.",
     "full":"Psorinum is one of the great nosodes — the 'psora' remedy. The patient is chilly to an extraordinary degree, dirty-looking despite washing, despairing, and fears poverty (will not throw anything away, hoards). Skin complaints suppressed by ointments may return as asthma or other internal disease. Recurrent abscesses, severe headaches, and chronic diarrhea all suggest Psorinum when the picture matches."},
    {"id":"rhod","name":"Rhododendron","common":"Rhododendron / Snow Rose","author":"Phatak","letter":"R","chapter":"Joints & Glands",
     "organ":"Joints, glands, testes","modalities":"Worse: before thunderstorm, rest, night. Better: motion, eating, warmth.",
     "constitution":"Foreboding, fears thunderstorms, changeable.",
     "relationships":"Compare: Rhus-t, Pulsatilla, Spongia.",
     "keynote":"Joint and testicular complaints worse before thunderstorms; wandering rheumatism; orchitis.",
     "full":"Rhododendron is the thunderstorm remedy — joint and glandular complaints (especially testes) are worse before a thunderstorm and better once the storm breaks. The rheumatism wanders from joint to joint, mostly small joints. Mentally there is foreboding and a dread of thunderstorms. Better from motion, eating, and warmth."},
    {"id":"spongia","name":"Spongia tosta","common":"Spongia / Roasted Sponge","author":"Murphy","letter":"S","chapter":"Chest & Throat",
     "organ":"Heart, throat, chest","modalities":"Worse: before midnight, cold wind, lying with head low. Better: warm food, swallowing, bending forward.",
     "constitution":"Anxious, fears heart disease, waking in alarm.",
     "relationships":"Compare: Aconite, Lachesis, Lycopodium.",
     "keynote":"Dry, barking, 'sawing-through-a-board' croup; heart complaints with anxiety; better from warm food and drink.",
     "full":"Spongia is a major croup and heart remedy. The cough is dry, barking, and sounds like sawing through a board — better from eating and drinking warm things. Heart complaints come with anxiety, palpitations, and the fear of heart disease — worse before midnight and from lying with the head low, better from bending forward. Useful for croup in children and angina in adults."},
    {"id":"tarent","name":"Tarentula hispanica","common":"Tarentula / Spanish Spider","author":"Murphy","letter":"T","chapter":"Mind & Nerves",
     "organ":"Nerves, heart, skin","modalities":"Worse: touch, noise, music, night. Better: music, motion, walking, rubbing.",
     "constitution":"Restless, hyperactive, deceptive, loves music and dancing.",
     "relationships":"Compare: Agaricus, Mygale, Lac caninum.",
     "keynote":"Frantic restlessness; must keep moving; loves music and dancing; hyperactive, deceptive; chorea.",
     "full":"Tarentula hispanica is one of the great restlessness remedies. The person must move constantly, often with a frantic quality; loves music and dancing, with symptoms improving while music plays. There is a deceptive, manipulative streak — may feign illness to gain attention, or steal. Chorea and involuntary jerking are common. Better from music, motion, and rubbing; worse from touch, noise, and at night."},
    {"id":"zincum","name":"Zincum metallicum","common":"Zincum / Zinc","author":"Boericke","letter":"Z","chapter":"Nerves & Mind",
     "organ":"Nerves, brain, spine","modalities":"Worse: wine, suppressed eruptions, noise. Better: motion, pressure, rubbing.",
     "constitution":"Worn out, brain-fag, restless feet, fidgety.",
     "relationships":"Compare: Agaricus, Tarentula, Ignatia.",
     "keynote":"Brain-fag with restless feet; can't keep feet still; suppressed foot-sweat causes complaints; memory weak.",
     "full":"Zincum suits the worn-out, brain-fag picture. The patient is mentally exhausted, forgetful, and reluctant to speak or move. The hallmark is restless, fidgety feet — they cannot keep the feet still, even when the rest of the body is exhausted. Complaints often follow suppression of foot sweat or skin eruptions. Better from motion and pressure; worse from wine, noise, and suppression."},
    {"id":"anacardium","name":"Anacardium orientale","common":"Anacardium / Marking Nut","author":"Phatak","letter":"A","chapter":"Mind & Memory",
     "organ":"Nerves, mind","modalities":"Worse: mental exertion, empty stomach, fright. Better: eating, washing, motion.",
     "constitution":"Two-willed, low confidence, paradoxical memory.",
     "relationships":"Compare: Nux vomica, Stramonium, Agnus castus.",
     "keynote":"Two opposing inner voices; low self-confidence; memory weakness; pains better from eating.",
     "full":"Anacardium is famous for the sensation of having two wills — one urging an action, the other forbidding it. The patient has low confidence, fears examinations, and suffers from weak memory — forgets what was just said or done. Pains and mental symptoms are typically better from eating and washing. Used for mental exhaustion, examination funk, and the after-effects of prolonged stress."},
]

# Remove the placeholder 'book card' entry to keep clean
REMEDIES = [r for r in REMEDIES if r["id"] != "phatak-phatak"]

# =====================================================================
# DATA — RUBRICS
# =====================================================================
RUBRICS = [
    {"id":"r1","path":"Mind","title":"Fear — of being touched","author":"Boericke","remedies":["Arnica montana","Belladonna","Antimonium tartaricum"]},
    {"id":"r2","path":"Mind","title":"Weeping — better for consolation","author":"Phatak","remedies":["Pulsatilla","Ignatia amara"]},
    {"id":"r3","path":"Mind","title":"Weeping — worse for consolation","author":"Phatak","remedies":["Natrum muriaticum","Sepia"]},
    {"id":"r4","path":"Mind","title":"Anger — from contradiction","author":"Boericke","remedies":["Nux vomica","Chamomilla","Staphysagria"]},
    {"id":"r5","path":"Mind","title":"Anxiety — anticipation","author":"Murphy","remedies":["Gelsemium sempervirens","Argentum nitricum"]},
    {"id":"r6","path":"Mind","title":"Anxiety — about health, fears death","author":"Boericke","remedies":["Arsenicum album","Aconitum napellus","Nitricum acidum"]},
    {"id":"r7","path":"Mind","title":"Jealousy","author":"Murphy","remedies":["Lachesis mutus","Apis mellifica","Pulsatilla"]},
    {"id":"r8","path":"Mind","title":"Restlessness — must keep moving","author":"Murphy","remedies":["Tarentula hispanica","Rhus toxicodendron","Arsenicum album","Zincum metallicum"]},
    {"id":"r9","path":"Mind","title":"Dullness, drowsiness","author":"Boericke","remedies":["Gelsemium sempervirens","Baptisia tinctoria","Opium"]},
    {"id":"r10","path":"Mind","title":"Memory — weak, forgets recent events","author":"Phatak","remedies":["Anacardium orientale","Zincum metallicum","Baryta carbonica"]},
    {"id":"r11","path":"Mind","title":"Fixed ideas","author":"Murphy","remedies":["Thuja occidentalis","Anacardium orientale","Tarentula hispanica"]},
    {"id":"r12","path":"Head","title":"Pain — throbbing","author":"Boericke","remedies":["Belladonna","Lycopodium clavatum"]},
    {"id":"r13","path":"Head","title":"Pain — occipital, spreading forward","author":"Phatak","remedies":["Gelsemium sempervirens","Silicea"]},
    {"id":"r14","path":"Head","title":"Headache — 10-11 am","author":"Phatak","remedies":["Natrum muriaticum","Sulphur"]},
    {"id":"r15","path":"Eye","title":"Swelling — rosy, puffy, eyelids","author":"Phatak","remedies":["Apis mellifica"]},
    {"id":"r16","path":"Throat","title":"Pain — splinter-like","author":"Boericke","remedies":["Hepar sulphuris calcareum","Nitricum acidum","Argentum nitricum"]},
    {"id":"r17","path":"Throat","title":"Sore — bright red, sudden onset","author":"Boericke","remedies":["Belladonna","Mercurius solubilis"]},
    {"id":"r18","path":"Stomach","title":"Bloating — flatulent, after eating","author":"Murphy","remedies":["Lycopodium clavatum","Nux vomica","Carbo vegetabilis"]},
    {"id":"r19","path":"Stomach","title":"Cravings — sweets","author":"Murphy","remedies":["Lycopodium clavatum","Argentum nitricum","Sulphur"]},
    {"id":"r20","path":"Stomach","title":"Cravings — salt","author":"Phatak","remedies":["Natrum muriaticum","Phosphorus","Causticum"]},
    {"id":"r21","path":"Abdomen","title":"Cramping — better from bending double","author":"Phatak","remedies":["Colocynthis","Magnesia phosphorica"]},
    {"id":"r22","path":"Abdomen","title":"Bloating — not relieved by belching","author":"Boericke","remedies":["Cinchona officinalis","Lycopodium clavatum"]},
    {"id":"r23","path":"Rectum","title":"Diarrhea — after anticipatory anxiety","author":"Murphy","remedies":["Gelsemium sempervirens","Argentum nitricum"]},
    {"id":"r24","path":"Rectum","title":"Diarrhea — from food poisoning, with vomiting","author":"Boericke","remedies":["Arsenicum album","Ipecacuanha"]},
    {"id":"r25","path":"Chest","title":"Cough — dry, barking, like sawing board","author":"Murphy","remedies":["Spongia tosta","Aconitum napellus"]},
    {"id":"r26","path":"Chest","title":"Cough — rattling, weak, cannot raise","author":"Boericke","remedies":["Antimonium tartaricum","Ipecacuanha"]},
    {"id":"r27","path":"Extremities","title":"Stiffness — better from continued motion","author":"Phatak","remedies":["Rhus toxicodendron"]},
    {"id":"r28","path":"Extremities","title":"Restlessness — feet, fidgety","author":"Boericke","remedies":["Zincum metallicum"]},
    {"id":"r29","path":"Extremities","title":"Wandering rheumatism, worse before thunderstorm","author":"Phatak","remedies":["Rhododendron","Rhus toxicodendron"]},
    {"id":"r30","path":"Generalities","title":"Worse — damp, cold weather","author":"Phatak","remedies":["Rhus toxicodendron","Nux vomica","Hepar sulphuris calcareum"]},
    {"id":"r31","path":"Generalities","title":"Worse — warmth of bed","author":"Boericke","remedies":["Sulphur","Mercurius solubilis","Lachesis mutus"]},
    {"id":"r32","path":"Generalities","title":"Worse — 4-8 pm","author":"Murphy","remedies":["Lycopodium clavatum"]},
    {"id":"r33","path":"Generalities","title":"Better — open air","author":"Boericke","remedies":["Pulsatilla","Gelsemium sempervirens","Iodum","Argentum nitricum"]},
    {"id":"r34","path":"Generalities","title":"Ailments — from grief, silent","author":"Phatak","remedies":["Ignatia amara","Natrum muriaticum","Phosphoric acid"]},
    {"id":"r35","path":"Generalities","title":"Ailments — from suppressed anger","author":"Murphy","remedies":["Staphysagria","Colocynthis","Nux vomica"]},
    {"id":"r36","path":"Skin","title":"Eruptions — itching, worse from heat of bed","author":"Phatak","remedies":["Sulphur","Rhus toxicodendron"]},
    {"id":"r37","path":"Skin","title":"Warts — large, jagged","author":"Murphy","remedies":["Nitricum acidum","Thuja occidentalis"]},
    {"id":"r38","path":"Skin","title":"Slow-healing wounds, ragged lacerations","author":"Boericke","remedies":["Calendula officinalis","Hypericum perforatum"]},
    {"id":"r39","path":"Skin","title":"Punctures, insect bites, better from cold","author":"Boericke","remedies":["Ledum palustre","Apis mellifica"]},
    {"id":"r40","path":"Female","title":"Hot flushes, menopause, worse on waking","author":"Murphy","remedies":["Lachesis mutus","Sepia","Sulphur"]},
    {"id":"r41","path":"Female","title":"Bearing-down sensation, must cross legs","author":"Murphy","remedies":["Sepia","Lilium tigrinum"]},
    {"id":"r42","path":"Sleep","title":"Grinding teeth in sleep — children","author":"Murphy","remedies":["Cina","Ascaris lumbricoides","Tuberculinum bovinum"]},
    {"id":"r43","path":"Sleep","title":"Sleeplessness — from grief","author":"Phatak","remedies":["Ignatia amara","Carcinosinum"]},
    {"id":"r44","path":"Fever","title":"Sudden, violent, with heat and redness","author":"Boericke","remedies":["Belladonna","Aconitum napellus"]},
    {"id":"r45","path":"Fever","title":"Bone-breaking, 7-9 am chill","author":"Boericke","remedies":["Eupatorium perfoliatum"]},
]

# =====================================================================
# DATA — Daily quotes
# =====================================================================
QUOTES = [
    {"text":"The physician's highest calling is to make the sick healthy — the cure, as Hahnemann called it, the highest ideal.","author":"Hahnemann, paraphrased"},
    {"text":"Similia similibus curentur — let like be cured by like.","author":"Samuel Hahnemann"},
    {"text":"The symptoms of the disease are the body's own attempt to heal — read them carefully.","author":"J.T. Kent, paraphrased"},
    {"text":"Take the patient, not the disease.","author":"C. Dunham, paraphrased"},
    {"text":"The remedy is not chosen for the disease, but for the person suffering it.","author":"Margaret Tyler, paraphrased"},
    {"text":"Aphorism 1: The physician's mission is to cure the sick and restore health.","author":"Organon, paraphrased"},
    {"text":"Where there is no clear path, take the totality of symptoms as the only guide.","author":"Boenninghausen, paraphrased"},
    {"text":"Never accept a single symptom as the whole picture — the case is always broader.","author":"Constantine Hering, paraphrased"},
    {"text":"The gentlest cure is the one that touches the deepest susceptibility.","author":"C. M. Boger, paraphrased"},
    {"text":"Treat the patient in front of you, not the case in the book.","author":"Eugene Beauharnais Nash, paraphrased"},
]

# Build a unique sorted list of chapters per book type for navigation
MM_CHAPTERS = sorted({r["chapter"] for r in REMEDIES})
REP_CHAPTERS = sorted({r["path"] for r in RUBRICS})

# =====================================================================
# DATA — Authors (theme/color metadata)
# =====================================================================
AUTHORS = ["Boericke","Phatak","Murphy"]
AUTHOR_META = {
    "Boericke":{"theme":"boericke","desc":"Pocket manual · concise keynotes","color":"#1E3A2B"},
    "Phatak":{"theme":"phatak","desc":"Comparative concordance style","color":"#7C8F6E"},
    "Murphy":{"theme":"murphy","desc":"Modern clinical repertorial notes","color":"#6E2A3A"},
}

print(f"Loaded {len(REMEDIES)} remedies, {len(RUBRICS)} rubrics, {len(QUOTES)} quotes.")
print(f"MM chapters: {len(MM_CHAPTERS)}, Rep chapters: {len(REP_CHAPTERS)}")

# =====================================================================
# CSS — extended to cover all new views & controls
# =====================================================================
CSS = r"""
:root{
  --parchment:#F3EBDA;
  --parchment-dark:#E8DCC3;
  --ink:#2B2420;
  --bottle:#1E3A2B;
  --bottle-dark:#152A1F;
  --brass:#B08D3F;
  --brass-light:#D4B36A;
  --sage:#7C8F6E;
  --burgundy:#6E2A3A;
  --sepia-paper:#EFE0C2;
  --card-shadow:0 2px 0 rgba(43,36,32,0.08),0 8px 20px -8px rgba(43,36,32,0.25);
}
*{box-sizing:border-box;-webkit-tap-highlight-color:transparent;}
html{scroll-behavior:smooth;}
body{margin:0;background:var(--parchment);color:var(--ink);
  font-family:'Source Serif 4',serif;-webkit-font-smoothing:antialiased;}
.app{min-height:100vh;display:flex;flex-direction:column;}

/* HEADER */
header.rail{background:var(--bottle);color:var(--parchment);padding:14px 22px;
  display:flex;align-items:center;gap:18px;border-bottom:3px solid var(--brass);
  position:sticky;top:0;z-index:50;flex-wrap:wrap;}
.wordmark{font-family:'Fraunces',serif;font-weight:600;font-style:italic;font-size:1.35rem;
  letter-spacing:0.02em;color:var(--brass-light);white-space:nowrap;margin-right:6px;}
.wordmark small{display:block;font-family:'IBM Plex Mono',monospace;font-style:normal;
  font-size:0.55rem;letter-spacing:0.15em;color:var(--sage);text-transform:uppercase;margin-top:2px;}
nav.tabs{display:flex;gap:4px;flex-wrap:wrap;}
nav.tabs button{background:transparent;border:1px solid transparent;color:var(--parchment-dark);
  font-family:'IBM Plex Mono',monospace;font-size:0.72rem;letter-spacing:0.06em;text-transform:uppercase;
  padding:8px 12px;border-radius:3px;cursor:pointer;transition:all .15s ease;}
nav.tabs button:hover{background:rgba(255,255,255,0.06);}
nav.tabs button.active{background:var(--brass);color:var(--bottle-dark);font-weight:500;}
.rail-spacer{flex:1;}
.rail-search{display:flex;align-items:center;gap:8px;background:rgba(255,255,255,0.08);
  border:1px solid rgba(255,255,255,0.15);border-radius:20px;padding:6px 14px;min-width:180px;}
.rail-search input{background:transparent;border:none;outline:none;color:var(--parchment);
  font-family:'Source Serif 4',serif;font-size:0.85rem;width:100%;}
.rail-search input::placeholder{color:rgba(243,235,218,0.5);}
.menu-toggle{display:none;background:transparent;border:1px solid var(--brass);
  color:var(--brass-light);padding:6px 10px;border-radius:4px;cursor:pointer;
  font-family:'IBM Plex Mono',monospace;font-size:0.7rem;}
@media(max-width:760px){.menu-toggle{display:block;}nav.tabs{display:none;}
  nav.tabs.open{display:flex;flex-direction:column;width:100%;position:absolute;top:100%;left:0;
    background:var(--bottle-dark);padding:10px;}
  nav.tabs.open button{text-align:left;}}

/* MAIN */
main{flex:1;max-width:1200px;margin:0 auto;padding:34px 24px 60px;width:100%;}
.view{display:none;animation:fade .25s ease;}
.view.active{display:block;}
@keyframes fade{from{opacity:0;transform:translateY(4px);}to{opacity:1;transform:translateY(0);}}
h1.page-title{font-family:'Fraunces',serif;font-weight:500;font-size:2rem;margin:0 0 4px;}
.page-sub{font-family:'IBM Plex Mono',monospace;font-size:0.72rem;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--sage);margin:0 0 28px;}

/* HOME: stat row */
.stat-row{display:flex;gap:14px;flex-wrap:wrap;margin-bottom:30px;}
.stat{background:white;border:1px solid var(--parchment-dark);border-radius:6px;
  padding:14px 18px;min-width:120px;box-shadow:var(--card-shadow);}
.stat .num{font-family:'Fraunces',serif;font-size:1.6rem;font-weight:600;color:var(--bottle);}
.stat .lbl{font-family:'IBM Plex Mono',monospace;font-size:0.62rem;text-transform:uppercase;
  letter-spacing:0.08em;color:var(--sage);}

.section-label{font-family:'IBM Plex Mono',monospace;font-size:0.68rem;letter-spacing:0.12em;
  text-transform:uppercase;color:var(--brass);margin:0 0 12px;display:flex;align-items:center;gap:10px;}
.section-label::after{content:"";flex:1;height:1px;background:var(--parchment-dark);}

.cabinet{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:14px;margin-bottom:40px;}
.drawer{background:linear-gradient(180deg,#fffdf8,var(--parchment));border:1px solid var(--parchment-dark);
  border-left:5px solid var(--bottle);border-radius:4px;padding:16px 18px;cursor:pointer;
  box-shadow:var(--card-shadow);transition:transform .15s ease,box-shadow .15s ease;position:relative;}
.drawer:hover{transform:translateY(-2px);box-shadow:0 4px 0 rgba(43,36,32,0.1),0 14px 26px -10px rgba(43,36,32,0.3);}
.drawer .plate{font-family:'IBM Plex Mono',monospace;font-size:0.6rem;letter-spacing:0.1em;
  text-transform:uppercase;color:var(--brass);margin-bottom:6px;}
.drawer h3{font-family:'Fraunces',serif;font-weight:500;font-size:1.1rem;margin:0 0 4px;}
.drawer p{margin:0;font-size:0.82rem;color:#5c5348;}
.drawer.murphy{border-left-color:var(--burgundy);}
.drawer.murphy .plate{color:var(--burgundy);}
.drawer.phatak{border-left-color:var(--sage);}
.drawer.phatak .plate{color:var(--sage);}

.two-col{display:grid;grid-template-columns:1.3fr 1fr;gap:28px;}
.three-col{display:grid;grid-template-columns:repeat(3,1fr);gap:18px;}
@media(max-width:800px){.two-col,.three-col{grid-template-columns:1fr;}}

.list-simple{list-style:none;padding:0;margin:0;}
.list-simple li{padding:10px 4px;border-bottom:1px dashed var(--parchment-dark);
  display:flex;justify-content:space-between;align-items:center;gap:8px;cursor:pointer;font-size:0.92rem;}
.list-simple li:hover{color:var(--bottle);}
.list-simple li .tag{font-family:'IBM Plex Mono',monospace;font-size:0.62rem;color:var(--sage);
  text-transform:uppercase;white-space:nowrap;}

/* Daily quote */
.quote-card{background:linear-gradient(135deg,var(--bottle) 0%,var(--bottle-dark) 100%);
  color:var(--parchment);border-radius:8px;padding:24px 28px;margin-bottom:34px;position:relative;
  box-shadow:var(--card-shadow);border-left:4px solid var(--brass);}
.quote-card .qmark{font-family:'Fraunces',serif;font-size:3rem;line-height:0.8;color:var(--brass);
  opacity:0.5;position:absolute;top:18px;left:18px;}
.quote-card .qtext{font-family:'Fraunces',serif;font-style:italic;font-size:1.1rem;
  line-height:1.5;padding-left:36px;}
.quote-card .qauthor{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;letter-spacing:0.05em;
  color:var(--brass-light);margin-top:12px;padding-left:36px;text-transform:uppercase;}

/* Progress bar */
.progress-bar{height:6px;background:var(--parchment-dark);border-radius:3px;overflow:hidden;margin-top:6px;}
.progress-bar .fill{height:100%;background:linear-gradient(90deg,var(--brass),var(--brass-light));
  transition:width .3s ease;}

/* SEARCH */
.search-hero input{width:100%;padding:16px 20px;font-size:1.1rem;font-family:'Source Serif 4',serif;
  border:2px solid var(--bottle);border-radius:8px;background:white;color:var(--ink);outline:none;}
.search-hero input:focus{border-color:var(--brass);}
.filter-chips{display:flex;gap:8px;margin-top:12px;flex-wrap:wrap;}
.chip{font-family:'IBM Plex Mono',monospace;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.05em;
  padding:6px 12px;border-radius:14px;border:1px solid var(--parchment-dark);background:white;cursor:pointer;color:#5c5348;}
.chip.active{background:var(--bottle);color:var(--parchment);border-color:var(--bottle);}
.search-types{display:flex;gap:6px;margin-top:10px;flex-wrap:wrap;}
.search-types select,.search-types input{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;
  padding:6px 10px;border:1px solid var(--parchment-dark);border-radius:4px;background:white;color:var(--ink);}
.search-types label{font-family:'IBM Plex Mono',monospace;font-size:0.62rem;color:var(--sage);
  text-transform:uppercase;align-self:center;}
.result-count{font-family:'IBM Plex Mono',monospace;font-size:0.72rem;color:var(--sage);margin:18px 0 10px;}
.result-card{background:white;border:1px solid var(--parchment-dark);border-radius:6px;
  padding:14px 18px;margin-bottom:10px;cursor:pointer;box-shadow:var(--card-shadow);}
.result-card:hover{border-color:var(--brass);}
.result-card .rtitle{font-family:'Fraunces',serif;font-weight:600;font-size:1.05rem;}
.result-card .rmeta{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;text-transform:uppercase;
  color:var(--sage);margin:2px 0 8px;}
.result-card .rsnippet{font-size:0.88rem;color:#4a4238;}
mark{background:var(--brass-light);color:var(--ink);padding:0 2px;border-radius:2px;}

/* BROWSE (MM / Rep) */
.author-tabs{display:flex;gap:8px;margin-bottom:18px;flex-wrap:wrap;}
.author-tabs button{font-family:'IBM Plex Mono',monospace;font-size:0.72rem;text-transform:uppercase;
  letter-spacing:0.06em;padding:8px 16px;border-radius:20px;border:1px solid var(--bottle);
  background:transparent;color:var(--bottle);cursor:pointer;}
.author-tabs button.active{background:var(--bottle);color:var(--parchment);}
.az-grid{display:flex;flex-wrap:wrap;gap:6px;margin-bottom:20px;}
.az-grid span{font-family:'IBM Plex Mono',monospace;font-size:0.72rem;color:var(--sage);
  width:26px;height:26px;display:flex;align-items:center;justify-content:center;
  border:1px solid var(--parchment-dark);border-radius:3px;}
.az-grid a{font-family:'IBM Plex Mono',monospace;font-size:0.72rem;color:var(--bottle);
  width:26px;height:26px;display:flex;align-items:center;justify-content:center;
  border:1px solid var(--parchment-dark);border-radius:3px;text-decoration:none;cursor:pointer;
  background:white;transition:all .15s ease;}
.az-grid a:hover{background:var(--brass);color:white;border-color:var(--brass);}
.az-grid a.active{background:var(--bottle);color:var(--parchment);border-color:var(--bottle);}
.az-grid span.disabled{opacity:0.35;cursor:not-allowed;}

.chapter-strip{display:flex;gap:6px;margin-bottom:18px;flex-wrap:wrap;}
.chapter-strip a{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;color:var(--bottle);
  padding:5px 9px;border:1px solid var(--parchment-dark);border-radius:3px;background:white;
  text-decoration:none;cursor:pointer;text-transform:uppercase;letter-spacing:0.04em;}
.chapter-strip a:hover,.chapter-strip a.active{background:var(--bottle);color:var(--parchment);}

.in-book-search{display:flex;gap:8px;margin-bottom:18px;}
.in-book-search input{flex:1;padding:10px 14px;border:1px solid var(--parchment-dark);
  border-radius:6px;font-family:'Source Serif 4',serif;font-size:0.9rem;background:white;outline:none;}
.in-book-search input:focus{border-color:var(--brass);}
.in-book-search button{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  padding:10px 14px;border:1px solid var(--bottle);background:transparent;color:var(--bottle);
  border-radius:6px;cursor:pointer;}

/* SPECIMEN */
.specimen-grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(240px,1fr));gap:16px;}
.specimen{background:#fffdf8;border:1px solid var(--parchment-dark);border-radius:4px;padding:0;
  cursor:pointer;box-shadow:var(--card-shadow);overflow:hidden;position:relative;transition:transform .15s ease;}
.specimen:hover{transform:translateY(-3px);}
.specimen .tab{background:var(--bottle);color:var(--brass-light);
  font-family:'IBM Plex Mono',monospace;font-size:0.6rem;letter-spacing:0.1em;text-transform:uppercase;
  padding:5px 12px;display:flex;justify-content:space-between;align-items:center;}
.specimen .tab .fav-star{cursor:pointer;color:var(--parchment-dark);}
.specimen .tab .fav-star.on{color:var(--brass-light);}
.specimen .body{padding:14px 16px;}
.specimen h4{font-family:'Fraunces',serif;font-weight:600;font-style:italic;font-size:1.08rem;margin:0 0 6px;}
.specimen .keynote{font-size:0.85rem;color:#4a4238;line-height:1.5;}
.specimen .punch{position:absolute;top:34px;right:8px;width:10px;height:10px;border-radius:50%;
  background:var(--parchment);border:1px solid var(--parchment-dark);}
.specimen .chip-mini{display:inline-block;font-family:'IBM Plex Mono',monospace;font-size:0.6rem;
  color:var(--sage);text-transform:uppercase;letter-spacing:0.05em;border:1px solid var(--parchment-dark);
  padding:2px 6px;border-radius:3px;margin-top:6px;margin-right:4px;}

.rubric-item{background:white;border:1px solid var(--parchment-dark);border-left:4px solid var(--sage);
  border-radius:4px;padding:12px 16px;margin-bottom:10px;cursor:pointer;box-shadow:var(--card-shadow);}
.rubric-item .rpath{font-family:'IBM Plex Mono',monospace;font-size:0.68rem;color:var(--sage);
  text-transform:uppercase;letter-spacing:0.03em;}
.rubric-item h4{font-family:'Fraunces',serif;font-weight:500;margin:4px 0 6px;}
.rubric-item .remedies{font-size:0.82rem;color:#5c5348;}
.rubric-item .remedies b{color:var(--bottle);font-weight:600;cursor:pointer;text-decoration:underline;
  text-decoration-style:dotted;text-underline-offset:2px;}
.rubric-item .remedies b:hover{color:var(--burgundy);}

/* READER */
.reader-toolbar{display:flex;align-items:center;gap:10px;flex-wrap:wrap;margin-bottom:18px;
  background:white;border:1px solid var(--parchment-dark);border-radius:6px;padding:10px 14px;}
.reader-toolbar button{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  border:1px solid var(--parchment-dark);background:transparent;border-radius:4px;padding:6px 10px;
  cursor:pointer;color:var(--ink);}
.reader-toolbar button.on{background:var(--brass);border-color:var(--brass);color:white;}
.reader-toolbar .spacer{flex:1;}
.reader-toolbar .back{color:var(--bottle);font-weight:600;border:none;background:none;cursor:pointer;
  font-family:'IBM Plex Mono',monospace;font-size:0.75rem;}

.reader-progress-strip{height:4px;background:var(--parchment-dark);border-radius:2px;margin-bottom:10px;overflow:hidden;}
.reader-progress-strip .fill{height:100%;background:var(--brass);transition:width .2s ease;}

.reader-page{border-radius:8px;padding:40px 44px;min-height:300px;
  transition:background .2s ease,color .2s ease;box-shadow:var(--card-shadow);position:relative;}
.reader-page.theme-boericke{background:#F4EFDF;color:#28241d;font-family:'Source Serif 4',serif;}
.reader-page.theme-phatak{background:#eef4ea;color:#1f2e1a;}
.reader-page.theme-murphy{background:#f7ecec;color:#3a1a20;}
.reader-page.theme-light{background:#ffffff;color:#222;}
.reader-page.theme-dark{background:#1b1b1b;color:#eee;}
.reader-page.theme-amoled{background:#000;color:#ddd;}
.reader-page.theme-sepia{background:var(--sepia-paper);color:#3a2a18;}
.reader-page h2{font-family:'Fraunces',serif;font-style:italic;font-weight:600;margin-top:0;}
.reader-page .rx-meta{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  opacity:0.6;margin-bottom:20px;display:flex;flex-wrap:wrap;gap:10px;align-items:center;}
.reader-page p{line-height:1.8;font-size:1.02rem;}
.reader-page .meta-block{font-size:0.85rem;line-height:1.6;margin-top:18px;padding-top:14px;
  border-top:1px dashed currentColor;opacity:0.85;}
.reader-page .meta-block b{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  letter-spacing:0.05em;display:block;margin-top:8px;}
.reader-page mark.hl-yellow{background:#FFE89A;color:inherit;}
.reader-page mark.hl-green{background:#B9E4A8;color:inherit;}
.reader-page mark.hl-blue{background:#AED5F0;color:inherit;}
.reader-page mark.hl-pink{background:#F5B5C8;color:inherit;}
.reader-page u.underline-custom{text-decoration:underline;text-decoration-color:var(--burgundy);
  text-decoration-thickness:2px;text-underline-offset:3px;}

.reader-timer{position:absolute;top:14px;right:18px;font-family:'IBM Plex Mono',monospace;
  font-size:0.7rem;opacity:0.55;}

.action-row{display:flex;gap:8px;margin-top:24px;flex-wrap:wrap;}
.action-row button{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  padding:8px 14px;border-radius:4px;border:1px solid var(--bottle);background:transparent;
  color:var(--bottle);cursor:pointer;}
.action-row button.on{background:var(--bottle);color:var(--parchment);}
.action-row select{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  padding:8px 14px;border-radius:4px;border:1px solid var(--bottle);background:transparent;color:var(--bottle);}

.note-box{margin-top:18px;}
.note-box textarea{width:100%;min-height:80px;padding:10px 12px;border:1px solid var(--parchment-dark);
  border-radius:6px;font-family:'Source Serif 4',serif;font-size:0.9rem;resize:vertical;}
.note-box .note-meta{display:flex;gap:8px;align-items:center;margin-top:8px;}
.note-box .note-meta select{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;padding:6px 10px;
  border:1px solid var(--parchment-dark);border-radius:4px;background:white;}
.note-box button.save{background:var(--bottle);color:var(--parchment);border:none;padding:8px 16px;
  border-radius:4px;font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;cursor:pointer;}

/* NOTES & FAVORITES & HISTORY VIEWS */
.note-card{background:white;border:1px solid var(--parchment-dark);border-radius:6px;
  padding:14px 16px;margin-bottom:10px;box-shadow:var(--card-shadow);}
.note-card .nmeta{font-family:'IBM Plex Mono',monospace;font-size:0.62rem;text-transform:uppercase;
  color:var(--sage);display:flex;justify-content:space-between;flex-wrap:wrap;gap:6px;}
.note-card .nmeta .cat{padding:2px 6px;border:1px solid var(--brass);color:var(--bottle);border-radius:3px;}
.note-card p{margin:8px 0 4px;font-size:0.9rem;}
.note-card .del{cursor:pointer;color:var(--burgundy);font-family:'IBM Plex Mono',monospace;
  font-size:0.65rem;text-transform:uppercase;}
.note-card .edit{cursor:pointer;color:var(--bottle);font-family:'IBM Plex Mono',monospace;
  font-size:0.65rem;text-transform:uppercase;margin-left:10px;}

.fav-section{margin-bottom:30px;}
.search-notes{display:flex;gap:8px;margin-bottom:18px;}
.search-notes input{flex:1;padding:10px 14px;border:1px solid var(--parchment-dark);border-radius:6px;
  font-family:'Source Serif 4',serif;font-size:0.9rem;background:white;outline:none;}
.search-notes select{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;padding:10px;
  border:1px solid var(--parchment-dark);border-radius:6px;background:white;}
.date-group{margin-bottom:18px;}
.date-group .date-h{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  color:var(--brass);letter-spacing:0.08em;margin-bottom:8px;border-bottom:1px solid var(--parchment-dark);padding-bottom:4px;}

.history-item{background:white;border:1px solid var(--parchment-dark);border-radius:6px;
  padding:12px 16px;margin-bottom:8px;box-shadow:var(--card-shadow);cursor:pointer;
  display:flex;justify-content:space-between;align-items:center;gap:10px;flex-wrap:wrap;}
.history-item:hover{border-color:var(--brass);}
.history-item .htitle{font-family:'Fraunces',serif;font-size:0.95rem;}
.history-item .hmeta{font-family:'IBM Plex Mono',monospace;font-size:0.62rem;color:var(--sage);
  text-transform:uppercase;}

/* SETTINGS */
.settings-panel{background:white;border:1px solid var(--parchment-dark);border-radius:8px;
  padding:24px 28px;margin-bottom:20px;box-shadow:var(--card-shadow);}
.settings-panel h3{font-family:'Fraunces',serif;font-weight:600;font-style:italic;
  font-size:1.1rem;margin:0 0 14px;color:var(--bottle);}
.settings-row{display:flex;align-items:center;gap:14px;padding:10px 0;border-bottom:1px dashed var(--parchment-dark);
  flex-wrap:wrap;}
.settings-row:last-child{border-bottom:none;}
.settings-row label{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  color:var(--sage);min-width:180px;letter-spacing:0.05em;}
.settings-row input[type=range]{flex:1;min-width:200px;}
.settings-row select,.settings-row input[type=color],.settings-row input[type=number]{
  font-family:'IBM Plex Mono',monospace;font-size:0.78rem;padding:6px 10px;border:1px solid var(--parchment-dark);
  border-radius:4px;background:white;}
.settings-row .value-out{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;color:var(--bottle);
  min-width:50px;text-align:right;}
.btn-row{display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;}
.btn-row button{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;
  padding:8px 14px;border-radius:4px;border:1px solid var(--bottle);background:transparent;color:var(--bottle);cursor:pointer;}
.btn-row button.danger{border-color:var(--burgundy);color:var(--burgundy);}
.btn-row button.primary{background:var(--bottle);color:var(--parchment);}
.toggle{position:relative;display:inline-block;width:44px;height:24px;}
.toggle input{opacity:0;width:0;height:0;}
.toggle .slider{position:absolute;cursor:pointer;top:0;left:0;right:0;bottom:0;
  background:var(--parchment-dark);border-radius:24px;transition:.2s;}
.toggle .slider::before{content:"";position:absolute;height:18px;width:18px;left:3px;bottom:3px;
  background:white;border-radius:50%;transition:.2s;}
.toggle input:checked + .slider{background:var(--bottle);}
.toggle input:checked + .slider::before{transform:translateX(20px);}

.empty{text-align:center;padding:50px 20px;color:var(--sage);
  font-family:'IBM Plex Mono',monospace;font-size:0.8rem;text-transform:uppercase;letter-spacing:0.05em;}

footer.note-strip{background:var(--bottle-dark);color:var(--parchment-dark);
  font-family:'IBM Plex Mono',monospace;font-size:0.68rem;text-align:center;padding:14px;letter-spacing:0.02em;}
footer.note-strip a{color:var(--brass-light);}

/* Toast */
.toast{position:fixed;bottom:20px;left:50%;transform:translateX(-50%);background:var(--bottle);
  color:var(--parchment);padding:10px 18px;border-radius:6px;border:1px solid var(--brass);
  font-family:'IBM Plex Mono',monospace;font-size:0.72rem;text-transform:uppercase;letter-spacing:0.05em;
  box-shadow:0 6px 16px rgba(0,0,0,0.3);z-index:1000;opacity:0;pointer-events:none;
  transition:opacity .25s ease,bottom .25s ease;}
.toast.show{opacity:1;bottom:30px;}
"""

# =====================================================================
# HTML body
# =====================================================================
HTML_BODY = r"""
<div class="app">

  <header class="rail">
    <div class="wordmark">Pradip's Homoe<small>Personal Digital Library</small></div>
    <button class="menu-toggle" onclick="document.querySelector('nav.tabs').classList.toggle('open')">≡ Menu</button>
    <nav class="tabs">
      <button data-view="home" class="active">Home</button>
      <button data-view="materia">Materia Medica</button>
      <button data-view="repertory">Repertory</button>
      <button data-view="search">Search</button>
      <button data-view="favorites">Favorites</button>
      <button data-view="notes">Notes</button>
      <button data-view="history">History</button>
      <button data-view="settings">Settings</button>
    </nav>
    <div class="rail-spacer"></div>
    <div class="rail-search">
      <span style="opacity:.6">&#8981;</span>
      <input id="quickSearch" placeholder="Quick search remedies, rubrics..." />
    </div>
  </header>

  <main>

    <!-- ============ HOME ============ -->
    <section class="view active" id="view-home">
      <h1 class="page-title">Welcome back</h1>
      <p class="page-sub" id="homeDate"></p>

      <div class="quote-card" id="quoteCard">
        <span class="qmark">&ldquo;</span>
        <div class="qtext" id="quoteText"></div>
        <div class="qauthor" id="quoteAuthor"></div>
      </div>

      <div class="stat-row" id="statRow"></div>

      <div class="section-label">The Cabinet</div>
      <div class="cabinet" id="cabinetGrid"></div>

      <div class="three-col">
        <div>
          <div class="section-label">Continue Reading</div>
          <ul class="list-simple" id="continueList"></ul>
        </div>
        <div>
          <div class="section-label">Favorite Remedies</div>
          <ul class="list-simple" id="favRemList"></ul>
        </div>
        <div>
          <div class="section-label">Favorite Rubrics</div>
          <ul class="list-simple" id="favRubList"></ul>
        </div>
      </div>

      <div class="two-col" style="margin-top:30px;">
        <div>
          <div class="section-label">Notes Summary</div>
          <div id="notesSummary"></div>
        </div>
        <div>
          <div class="section-label">Reading Statistics</div>
          <div id="readingStats"></div>
        </div>
      </div>
    </section>

    <!-- ============ SEARCH ============ -->
    <section class="view" id="view-search">
      <h1 class="page-title">Universal Search</h1>
      <p class="page-sub">One box, every author, every remedy and rubric</p>
      <div class="search-hero">
        <input id="mainSearch" placeholder='Try "fear of being touched", "bloating", or "Lycopodium"...' />
        <div class="search-types">
          <label>Search type:</label>
          <select id="searchType">
            <option value="any">Any Word</option>
            <option value="all">Multiple Words (All)</option>
            <option value="phrase">Exact Phrase</option>
            <option value="partial">Partial Word</option>
          </select>
          <label>Field:</label>
          <select id="searchField">
            <option value="all">All fields</option>
            <option value="name">Remedy Name</option>
            <option value="rubric">Rubric</option>
            <option value="symptom">Symptom</option>
            <option value="disease">Disease / Clinical Condition</option>
            <option value="mental">Mental Symptom</option>
            <option value="physical">Physical Symptom</option>
            <option value="organ">Organ / System</option>
            <option value="modalities">Modalities</option>
            <option value="constitution">Constitution</option>
            <option value="relationships">Relationships</option>
          </select>
        </div>
        <div class="filter-chips" id="filterChips"></div>
      </div>
      <div class="result-count" id="resultCount"></div>
      <div id="resultsWrap"></div>

      <div class="section-label" style="margin-top:30px;">Recent Searches</div>
      <div id="recentSearches"></div>
    </section>

    <!-- ============ MATERIA MEDICA ============ -->
    <section class="view" id="view-materia">
      <h1 class="page-title">Materia Medica</h1>
      <p class="page-sub" id="materiaSub">Browsing remedies A&ndash;Z</p>
      <div class="author-tabs" id="materiaAuthorTabs"></div>
      <div class="az-grid" id="materiaAZ"></div>
      <div class="chapter-strip" id="materiaChapters"></div>
      <div class="in-book-search">
        <input id="materiaSearch" placeholder="Search within this author's remedies..." />
        <button onclick="runMateriaSearch()">Filter</button>
        <button onclick="clearMateriaSearch()">Clear</button>
      </div>
      <div class="specimen-grid" id="materiaGrid"></div>
    </section>

    <!-- ============ REPERTORY ============ -->
    <section class="view" id="view-repertory">
      <h1 class="page-title">Repertory</h1>
      <p class="page-sub" id="repSub">Browsing rubrics</p>
      <div class="author-tabs" id="repAuthorTabs"></div>
      <div class="az-grid" id="repAZ"></div>
      <div class="chapter-strip" id="repChapters"></div>
      <div class="in-book-search">
        <input id="repSearch" placeholder="Search within this author's rubrics..." />
        <button onclick="runRepSearch()">Filter</button>
        <button onclick="clearRepSearch()">Clear</button>
      </div>
      <div id="repList"></div>
    </section>

    <!-- ============ READER ============ -->
    <section class="view" id="view-reader">
      <div class="reader-progress-strip"><div class="fill" id="readerProgressFill" style="width:0%"></div></div>
      <div class="reader-toolbar">
        <button class="back" onclick="goBack()">&larr; Back</button>
        <button onclick="navAdjacent(-1)">&laquo; Prev</button>
        <button onclick="navAdjacent(1)">Next &raquo;</button>
        <div class="spacer"></div>
        <button data-theme="boericke">Boericke</button>
        <button data-theme="phatak">Phatak</button>
        <button data-theme="murphy">Murphy</button>
        <button data-theme="light">Light</button>
        <button data-theme="sepia">Sepia</button>
        <button data-theme="dark">Dark</button>
        <button data-theme="amoled">AMOLED</button>
        <button onclick="adjustFont(-1)">A&minus;</button>
        <button onclick="adjustFont(1)">A+</button>
        <button onclick="toggleFullscreen()">&#9974; Full</button>
        <button onclick="copySelection()">&#9998; Copy</button>
      </div>
      <div class="reader-page theme-boericke" id="readerPage">
        <div class="reader-timer" id="readerTimer">00:00</div>
        <div class="rx-meta" id="readerMeta"></div>
        <h2 id="readerTitle"></h2>
        <div id="readerBody"></div>
        <div class="meta-block" id="readerMetaBlock"></div>
        <div class="action-row">
          <button id="btnFav" onclick="toggleFav()">&#9734; Favorite</button>
          <button id="btnBookmark" onclick="toggleBookmark()">&#128278; Bookmark</button>
          <button onclick="addHighlight('hl-yellow')">Highlight Yellow</button>
          <button onclick="addHighlight('hl-green')">Highlight Green</button>
          <button onclick="addHighlight('hl-blue')">Highlight Blue</button>
          <button onclick="addHighlight('hl-pink')">Highlight Pink</button>
          <button onclick="addUnderline()">Underline</button>
          <button onclick="clearMarks()">Clear marks</button>
          <button onclick="document.getElementById('noteInput').focus()">&#9998; Add note</button>
          <button id="btnCrossRef" onclick="showCrossRef()">&#8635; Cross-ref</button>
        </div>
        <div class="note-box">
          <textarea id="noteInput" placeholder="Personal clinical note..."></textarea>
          <div class="note-meta">
            <select id="noteCategory">
              <option value="Clinical">Clinical Note</option>
              <option value="Study">Study Note</option>
              <option value="Remedy">Remedy Note</option>
              <option value="Rubric">Rubric Note</option>
            </select>
            <button class="save" onclick="saveNote()">Save note</button>
          </div>
        </div>
        <div id="crossRefPanel" style="display:none;margin-top:18px;"></div>
      </div>
    </section>

    <!-- ============ FAVORITES ============ -->
    <section class="view" id="view-favorites">
      <h1 class="page-title">Favorites</h1>
      <p class="page-sub">Everything you've starred, stored privately on this device</p>
      <div class="fav-section">
        <div class="section-label">Favorite Remedies</div>
        <ul class="list-simple" id="favRemFull"></ul>
      </div>
      <div class="fav-section">
        <div class="section-label">Favorite Rubrics</div>
        <ul class="list-simple" id="favRubFull"></ul>
      </div>
      <div class="fav-section">
        <div class="section-label">Favorite Books</div>
        <ul class="list-simple" id="favBookFull"></ul>
      </div>
      <div class="fav-section">
        <div class="section-label">Favorite Chapters</div>
        <ul class="list-simple" id="favChapterFull"></ul>
      </div>
    </section>

    <!-- ============ NOTES ============ -->
    <section class="view" id="view-notes">
      <h1 class="page-title">Notes</h1>
      <p class="page-sub">Personal clinical, study, remedy and rubric notes</p>
      <div class="search-notes">
        <input id="noteSearch" placeholder="Search your notes..." />
        <select id="noteFilter">
          <option value="All">All categories</option>
          <option value="Clinical">Clinical</option>
          <option value="Study">Study</option>
          <option value="Remedy">Remedy</option>
          <option value="Rubric">Rubric</option>
        </select>
      </div>
      <div id="notesWrap"></div>
    </section>

    <!-- ============ HISTORY ============ -->
    <section class="view" id="view-history">
      <h1 class="page-title">Reading History</h1>
      <p class="page-sub">Continue reading, recently viewed remedies, rubrics & searches</p>
      <div class="fav-section">
        <div class="section-label">Continue Reading (last opened)</div>
        <div id="historyRecent"></div>
      </div>
      <div class="two-col">
        <div class="fav-section">
          <div class="section-label">Last Viewed Remedies</div>
          <ul class="list-simple" id="historyRemedies"></ul>
        </div>
        <div class="fav-section">
          <div class="section-label">Last Viewed Rubrics</div>
          <ul class="list-simple" id="historyRubrics"></ul>
        </div>
      </div>
      <div class="fav-section">
        <div class="section-label">Search History</div>
        <div id="searchHistoryWrap"></div>
      </div>
    </section>

    <!-- ============ SETTINGS ============ -->
    <section class="view" id="view-settings">
      <h1 class="page-title">Settings</h1>
      <p class="page-sub">Customize your reading experience & data</p>

      <div class="settings-panel">
        <h3>Appearance</h3>
        <div class="settings-row">
          <label>Default Reading Theme</label>
          <select id="setTheme">
            <option value="boericke">Boericke Classic</option>
            <option value="phatak">Phatak Emerald</option>
            <option value="murphy">Murphy Burgundy</option>
            <option value="light">Light</option>
            <option value="sepia">Sepia</option>
            <option value="dark">Dark</option>
            <option value="amoled">AMOLED Black</option>
          </select>
        </div>
        <div class="settings-row">
          <label>Font Family</label>
          <select id="setFont">
            <option value="Source Serif 4">Source Serif 4 (default)</option>
            <option value="Fraunces">Fraunces</option>
            <option value="Noto Serif">Noto Serif</option>
            <option value="Georgia">Georgia</option>
            <option value="sans-serif">Sans-serif</option>
            <option value="monospace">Monospace</option>
          </select>
        </div>
        <div class="settings-row">
          <label>Font Size</label>
          <input type="range" id="setFontSize" min="0.85" max="1.4" step="0.05" value="1.0">
          <span class="value-out" id="setFontSizeOut">1.00rem</span>
        </div>
        <div class="settings-row">
          <label>Font Weight</label>
          <select id="setFontWeight">
            <option value="400">Regular</option>
            <option value="500">Medium</option>
            <option value="600">Semibold</option>
            <option value="700">Bold</option>
          </select>
        </div>
        <div class="settings-row">
          <label>Line Height</label>
          <input type="range" id="setLineHeight" min="1.4" max="2.4" step="0.1" value="1.8">
          <span class="value-out" id="setLineHeightOut">1.8</span>
        </div>
        <div class="settings-row">
          <label>Paragraph Spacing</label>
          <input type="range" id="setParaSpacing" min="0.5" max="2.0" step="0.1" value="1.0">
          <span class="value-out" id="setParaSpacingOut">1.0em</span>
        </div>
        <div class="settings-row">
          <label>Page Margins</label>
          <input type="range" id="setMargin" min="20" max="80" step="2" value="44">
          <span class="value-out" id="setMarginOut">44px</span>
        </div>
        <div class="settings-row">
          <label>Reader Brightness</label>
          <input type="range" id="setBrightness" min="0.5" max="1.0" step="0.05" value="1.0">
          <span class="value-out" id="setBrightnessOut">100%</span>
        </div>
      </div>

      <div class="settings-panel">
        <h3>Reader Behavior</h3>
        <div class="settings-row">
          <label>Auto-resume last position</label>
          <span class="toggle"><input type="checkbox" id="setAutoResume" checked><span class="slider"></span></span>
        </div>
        <div class="settings-row">
          <label>Auto-bookmark on open</label>
          <span class="toggle"><input type="checkbox" id="setAutoBookmark" checked><span class="slider"></span></span>
        </div>
        <div class="settings-row">
          <label>Reading animation (fade)</label>
          <span class="toggle"><input type="checkbox" id="setAnim" checked><span class="slider"></span></span>
        </div>
        <div class="settings-row">
          <label>Continuous scroll</label>
          <span class="toggle"><input type="checkbox" id="setScroll" checked><span class="slider"></span></span>
        </div>
        <div class="settings-row">
          <label>Screen timeout override (keep awake)</label>
          <span class="toggle"><input type="checkbox" id="setWakeLock"><span class="slider"></span></span>
        </div>
      </div>

      <div class="settings-panel">
        <h3>Search</h3>
        <div class="settings-row">
          <label>Default filter</label>
          <select id="setDefFilter">
            <option value="All">All</option>
            <option value="Materia Medica">Materia Medica only</option>
            <option value="Repertory">Repertory only</option>
            <option value="Boericke">Boericke</option>
            <option value="Phatak">Phatak</option>
            <option value="Murphy">Murphy</option>
          </select>
        </div>
        <div class="btn-row">
          <button onclick="clearSearchHistory()">Clear search history</button>
        </div>
      </div>

      <div class="settings-panel">
        <h3>Data &amp; Privacy</h3>
        <div class="settings-row">
          <label>Notes, favorites, bookmarks, history are stored locally in your browser only.</label>
        </div>
        <div class="btn-row">
          <button onclick="exportData()">Export data (JSON)</button>
          <button onclick="importDataPrompt()">Import data</button>
          <button class="danger" onclick="clearAllData()">Clear all personal data</button>
        </div>
        <div class="settings-row" style="margin-top:14px;">
          <label>Install as PWA (offline support)</label>
          <button id="installBtn" onclick="triggerInstall()" style="display:none;">Install app</button>
          <span id="installStatus" style="font-family:'IBM Plex Mono',monospace;font-size:0.7rem;color:var(--sage);"></span>
        </div>
      </div>
    </section>

  </main>

  <footer class="note-strip">
    Sample library shell with paraphrased placeholder entries &mdash; replace with your own licensed book text for production use. All notes and favorites are stored privately on this device.
  </footer>
</div>
<div class="toast" id="toast"></div>
<input type="file" id="importFile" accept="application/json" style="display:none;">
"""

print(f"CSS: {len(CSS)} chars; HTML body: {len(HTML_BODY)} chars")

# =====================================================================
# JavaScript — full app logic
# =====================================================================
JS = r"""
/* ============ DATA (injected by Python) ============ */
const REMEDIES = __REMEDIES_JSON__;
const RUBRICS = __RUBRICS_JSON__;
const QUOTES = __QUOTES_JSON__;
const AUTHORS = __AUTHORS_JSON__;
const AUTHOR_META = __AUTHOR_META_JSON__;
const MM_CHAPTERS = __MM_CHAPTERS_JSON__;
const REP_CHAPTERS = __REP_CHAPTERS_JSON__;

/* ============ STATE ============ */
let favorites = new Set();      // ids
let bookmarks = new Set();
let notesData = [];             // {id, refId, refTitle, refType, category, text, date}
let history = [];               // array of {id, type, ts}
let searchHistory = [];         // array of {q, type, field, ts}
let readerMarks = {};           // {refId: [{type:'highlight', color:'hl-yellow', text}, ...]}
let currentRef = null;          // {type, data}
let currentTab = {materia:'Boericke', repertory:'Boericke'};
let materiaFilterLetter = null;
let repFilterLetter = null;
let materiaChapterFilter = null;
let repChapterFilter = null;
let materiaSearchTerm = '';
let repSearchTerm = '';
let activeFilter = 'All';
let readerTimer = {start:null, interval:null, total:0, lastId:null};
let readingStats = {totalTime:0, byRef:{}, byDate:{}, lastReadDate:null, streak:0};
let settings = {
  theme:'boericke', fontFamily:'Source Serif 4', fontSize:1.0, fontWeight:'400',
  lineHeight:1.8, paraSpacing:1.0, margin:44, brightness:1.0,
  autoResume:true, autoBookmark:true, anim:true, scroll:true, wakeLock:false,
  defaultFilter:'All'
};
let deferredPrompt = null; // PWA install

const LS_KEY = 'pradip-homoe-state-v2';

/* ============ STORAGE ============ */
function loadState(){
  try{
    const raw = localStorage.getItem(LS_KEY);
    if(raw){
      const d = JSON.parse(raw);
      favorites = new Set(d.favorites||[]);
      bookmarks = new Set(d.bookmarks||[]);
      notesData = d.notesData||[];
      history = d.history||[];
      searchHistory = d.searchHistory||[];
      readerMarks = d.readerMarks||{};
      readingStats = d.readingStats||readingStats;
      if(d.settings) settings = Object.assign(settings, d.settings);
    }
  }catch(e){ console.warn('loadState failed', e); }
}
function saveState(){
  try{
    localStorage.setItem(LS_KEY, JSON.stringify({
      favorites:[...favorites], bookmarks:[...bookmarks], notesData, history,
      searchHistory:searchHistory.slice(0,50), readerMarks, readingStats, settings
    }));
  }catch(e){ console.error('saveState failed', e); }
}
function toast(msg){
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(toast._t);
  toast._t = setTimeout(()=>t.classList.remove('show'), 1800);
}

/* ============ NAV ============ */
document.querySelectorAll('nav.tabs button').forEach(btn=>{
  btn.addEventListener('click', ()=>{
    switchView(btn.dataset.view);
    document.querySelector('nav.tabs').classList.remove('open');
  });
});
function switchView(name){
  document.querySelectorAll('nav.tabs button').forEach(b=>b.classList.toggle('active', b.dataset.view===name));
  document.querySelectorAll('.view').forEach(v=>v.classList.remove('active'));
  const v = document.getElementById('view-'+name);
  if(v) v.classList.add('active');
  window.scrollTo({top:0, behavior:'smooth'});
  if(name==='materia') renderMateria();
  if(name==='repertory') renderRepertory();
  if(name==='search') renderSearchView();
  if(name==='favorites') renderFavorites();
  if(name==='notes') renderNotesView();
  if(name==='history') renderHistory();
  if(name==='settings') renderSettings();
  if(name==='home') renderHome();
}
function goBack(){
  stopReaderTimer();
  if(currentRef && currentRef.type==='remedy') switchView('materia');
  else if(currentRef && currentRef.type==='rubric') switchView('repertory');
  else switchView('home');
}

/* ============ HELPERS ============ */
function findById(id){
  let r = REMEDIES.find(x=>x.id===id);
  if(r) return {type:'remedy', data:r};
  let ru = RUBRICS.find(x=>x.id===id);
  if(ru) return {type:'rubric', data:ru};
  return null;
}
function escapeHTML(s){
  return (s||'').replace(/[&<>"']/g, c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
function highlight(text, q){
  if(!q) return escapeHTML(text);
  const safe = q.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
  const re = new RegExp('('+safe+')','ig');
  return escapeHTML(text).replace(re,'<mark>$1</mark>');
}
function todayKey(){
  const d = new Date();
  return d.getFullYear()+'-'+String(d.getMonth()+1).padStart(2,'0')+'-'+String(d.getDate()).padStart(2,'0');
}
function updateStreak(){
  const t = todayKey();
  if(readingStats.lastReadDate === t) return;
  const y = new Date(Date.now()-86400000);
  const yk = y.getFullYear()+'-'+String(y.getMonth()+1).padStart(2,'0')+'-'+String(y.getDate()).padStart(2,'0');
  if(readingStats.lastReadDate === yk) readingStats.streak = (readingStats.streak||0)+1;
  else if(readingStats.lastReadDate !== t) readingStats.streak = 1;
  readingStats.lastReadDate = t;
}

/* ============ HOME ============ */
function renderHome(){
  const today = new Date();
  document.getElementById('homeDate').textContent = today.toLocaleDateString(undefined,
    {weekday:'long', year:'numeric', month:'long', day:'numeric'});

  // Daily quote
  const q = QUOTES[Math.floor(Date.now()/86400000) % QUOTES.length];
  document.getElementById('quoteText').textContent = q.text;
  document.getElementById('quoteAuthor').textContent = '\u2014 ' + q.author;

  // Stats
  const totalReadingMin = Math.floor((readingStats.totalTime||0)/60);
  document.getElementById('statRow').innerHTML = `
    <div class="stat"><div class="num">6</div><div class="lbl">Books</div></div>
    <div class="stat"><div class="num">${REMEDIES.length+RUBRICS.length}</div><div class="lbl">Entries</div></div>
    <div class="stat"><div class="num">${bookmarks.size}</div><div class="lbl">Bookmarks</div></div>
    <div class="stat"><div class="num">${notesData.length}</div><div class="lbl">Notes</div></div>
    <div class="stat"><div class="num">${favorites.size}</div><div class="lbl">Favorites</div></div>
    <div class="stat"><div class="num">${readingStats.streak||0}</div><div class="lbl">Day Streak</div></div>
    <div class="stat"><div class="num">${totalReadingMin}m</div><div class="lbl">Reading Time</div></div>
  `;

  // Cabinet
  const cabinet = document.getElementById('cabinetGrid');
  let html = '';
  ['materia','repertory'].forEach(view=>{
    AUTHORS.forEach(a=>{
      const cls = a==='Phatak'?'phatak':a==='Murphy'?'murphy':'';
      const isMM = view==='materia';
      html += `<div class="drawer ${cls}" onclick="openBrowse('${view}','${a}')">
        <div class="plate">${isMM?'Materia Medica':'Repertory'}</div>
        <h3>${a}</h3>
        <p>${AUTHOR_META[a].desc}</p>
      </div>`;
    });
  });
  cabinet.innerHTML = html;

  // Continue Reading
  const cont = document.getElementById('continueList');
  cont.innerHTML = history.length ? history.slice(0,6).map(h=>{
    const item = findById(h.id);
    return item ? `<li onclick="openRef('${item.type}','${item.data.id}')">
      <span>${escapeHTML(item.data.name||item.data.title)}</span>
      <span class="tag">${item.data.author}</span>
    </li>` : '';
  }).join('') : `<li style="cursor:default;color:#999;">Nothing opened yet &mdash; browse a drawer to begin</li>`;

  // Favorite Remedies
  const favRem = document.getElementById('favRemList');
  favRem.innerHTML = [...favorites].map(id=>{
    const r = REMEDIES.find(x=>x.id===id);
    return r ? `<li onclick="openRef('remedy','${r.id}')">
      <span>${escapeHTML(r.name)}</span><span class="tag">${r.author}</span></li>` : '';
  }).join('') || `<li style="cursor:default;color:#999;">No remedies favorited yet</li>`;

  // Favorite Rubrics
  const favRub = document.getElementById('favRubList');
  favRub.innerHTML = [...favorites].map(id=>{
    const r = RUBRICS.find(x=>x.id===id);
    return r ? `<li onclick="openRef('rubric','${r.id}')">
      <span>${escapeHTML(r.title)}</span><span class="tag">${r.author}</span></li>` : '';
  }).join('') || `<li style="cursor:default;color:#999;">No rubrics favorited yet</li>`;

  // Notes Summary (last 3)
  const ns = document.getElementById('notesSummary');
  ns.innerHTML = notesData.slice(0,3).map(n=>`
    <div class="note-card">
      <div class="nmeta"><span>${escapeHTML(n.refTitle)} &middot; ${n.category}</span><span>${n.date}</span></div>
      <p>${escapeHTML(n.text).slice(0,140)}${n.text.length>140?'&hellip;':''}</p>
    </div>`).join('') || `<div class="empty">No notes yet</div>`;

  // Reading Statistics
  const rs = document.getElementById('readingStats');
  const topRefs = Object.entries(readingStats.byRef||{})
    .sort((a,b)=>b[1]-a[1]).slice(0,3);
  rs.innerHTML = `
    <div class="note-card">
      <div class="nmeta"><span>Total reading time</span><span>${Math.floor((readingStats.totalTime||0)/60)} min</span></div>
      <div class="progress-bar"><div class="fill" style="width:${Math.min(100,(readingStats.totalTime||0)/600)}%"></div></div>
    </div>
    <div class="note-card">
      <div class="nmeta"><span>Reading streak</span><span>${readingStats.streak||0} day(s)</span></div>
    </div>
    ${topRefs.length ? topRefs.map(([id,sec])=>{
      const it = findById(id);
      if(!it) return '';
      return `<div class="note-card"><div class="nmeta"><span>${escapeHTML(it.data.name||it.data.title)}</span><span>${Math.floor(sec/60)}m</span></div></div>`;
    }).join('') : '<div class="empty">Open a remedy to start tracking</div>'}
  `;
}

/* ============ MATERIA MEDICA ============ */
function renderMateria(){
  const tabsEl = document.getElementById('materiaAuthorTabs');
  tabsEl.innerHTML = AUTHORS.map(a=>`<button class="${currentTab.materia===a?'active':''}" onclick="setMateriaAuthor('${a}')">${a}</button>`).join('');
  // A-Z clickable
  const az = document.getElementById('materiaAZ');
  const present = new Set(REMEDIES.filter(r=>r.author===currentTab.materia).map(r=>r.letter));
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  az.innerHTML = allLetters.map(L=>{
    const has = present.has(L);
    const active = materiaFilterLetter===L;
    return has
      ? `<a class="${active?'active':''}" onclick="setMateriaLetter('${L}')">${L}</a>`
      : `<span class="disabled">${L}</span>`;
  }).join('');
  // Chapters
  const chapters = [...new Set(REMEDIES.filter(r=>r.author===currentTab.materia).map(r=>r.chapter))].sort();
  const chapEl = document.getElementById('materiaChapters');
  chapEl.innerHTML = `<a class="${!materiaChapterFilter?'active':''}" onclick="setMateriaChapter(null)">All</a>` +
    chapters.map(c=>`<a class="${materiaChapterFilter===c?'active':''}" onclick="setMateriaChapter('${escapeHTML(c)}')">${escapeHTML(c)}</a>`).join('');
  // Sub
  const count = REMEDIES.filter(r=>r.author===currentTab.materia).length;
  document.getElementById('materiaSub').textContent = `Browsing ${currentTab.materia}'s remedies A\u2013Z (${count} entries)`;
  renderMateriaGrid();
}
function setMateriaAuthor(a){ currentTab.materia = a; materiaFilterLetter=null; materiaChapterFilter=null; renderMateria(); }
function setMateriaLetter(L){ materiaFilterLetter = materiaFilterLetter===L ? null : L; renderMateria(); }
function setMateriaChapter(c){ materiaChapterFilter = c; renderMateria(); }
function runMateriaSearch(){ materiaSearchTerm = document.getElementById('materiaSearch').value.trim().toLowerCase(); renderMateriaGrid(); }
function clearMateriaSearch(){ document.getElementById('materiaSearch').value=''; materiaSearchTerm=''; materiaFilterLetter=null; materiaChapterFilter=null; renderMateria(); }
function renderMateriaGrid(){
  const grid = document.getElementById('materiaGrid');
  let items = REMEDIES.filter(r=>r.author===currentTab.materia);
  if(materiaFilterLetter) items = items.filter(r=>r.letter===materiaFilterLetter);
  if(materiaChapterFilter) items = items.filter(r=>r.chapter===materiaChapterFilter);
  if(materiaSearchTerm){
    items = items.filter(r=>(r.name+' '+r.common+' '+r.keynote+' '+r.full+' '+r.organ+' '+r.modalities+' '+r.constitution).toLowerCase().includes(materiaSearchTerm));
  }
  items.sort((a,b)=>a.name.localeCompare(b.name));
  grid.innerHTML = items.length ? items.map(r=>`
    <div class="specimen" onclick="openRef('remedy','${r.id}')">
      <div class="tab"><span>${r.author} &middot; ${r.letter}</span>
        <span class="fav-star ${favorites.has(r.id)?'on':''}" onclick="event.stopPropagation();quickFav('${r.id}')">\u2605</span></div>
      <div class="punch"></div>
      <div class="body">
        <h4>${escapeHTML(r.name)}</h4>
        <div class="keynote">${escapeHTML(r.keynote)}</div>
        <span class="chip-mini">${escapeHTML(r.chapter)}</span>
      </div>
    </div>`).join('') : `<div class="empty">No remedies match</div>`;
}
function openBrowse(view, author){
  currentTab[view] = author;
  switchView(view);
}

/* ============ REPERTORY ============ */
function renderRepertory(){
  const tabsEl = document.getElementById('repAuthorTabs');
  tabsEl.innerHTML = AUTHORS.map(a=>`<button class="${currentTab.repertory===a?'active':''}" onclick="setRepAuthor('${a}')">${a}</button>`).join('');
  // A-Z by title first letter
  const present = new Set(RUBRICS.filter(r=>r.author===currentTab.repertory).map(r=>r.title[0].toUpperCase()));
  const az = document.getElementById('repAZ');
  const allLetters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
  az.innerHTML = allLetters.map(L=>{
    const has = present.has(L);
    const active = repFilterLetter===L;
    return has
      ? `<a class="${active?'active':''}" onclick="setRepLetter('${L}')">${L}</a>`
      : `<span class="disabled">${L}</span>`;
  }).join('');
  // Chapters (rubric paths)
  const paths = [...new Set(RUBRICS.filter(r=>r.author===currentTab.repertory).map(r=>r.path))].sort();
  const chapEl = document.getElementById('repChapters');
  chapEl.innerHTML = `<a class="${!repChapterFilter?'active':''}" onclick="setRepChapter(null)">All</a>` +
    paths.map(p=>`<a class="${repChapterFilter===p?'active':''}" onclick="setRepChapter('${escapeHTML(p)}')">${escapeHTML(p)}</a>`).join('');
  const count = RUBRICS.filter(r=>r.author===currentTab.repertory).length;
  document.getElementById('repSub').textContent = `Browsing ${currentTab.repertory}'s rubric index (${count} entries)`;
  renderRepList();
}
function setRepAuthor(a){ currentTab.repertory = a; repFilterLetter=null; repChapterFilter=null; renderRepertory(); }
function setRepLetter(L){ repFilterLetter = repFilterLetter===L ? null : L; renderRepList(); }
function setRepChapter(c){ repChapterFilter = c; renderRepList(); }
function runRepSearch(){ repSearchTerm = document.getElementById('repSearch').value.trim().toLowerCase(); renderRepList(); }
function clearRepSearch(){ document.getElementById('repSearch').value=''; repSearchTerm=''; repFilterLetter=null; repChapterFilter=null; renderRepertory(); }
function renderRepList(){
  const list = document.getElementById('repList');
  let items = RUBRICS.filter(r=>r.author===currentTab.repertory);
  if(repFilterLetter) items = items.filter(r=>r.title[0].toUpperCase()===repFilterLetter);
  if(repChapterFilter) items = items.filter(r=>r.path===repChapterFilter);
  if(repSearchTerm){
    items = items.filter(r=>(r.title+' '+r.path+' '+r.remedies.join(' ')).toLowerCase().includes(repSearchTerm));
  }
  list.innerHTML = items.length ? items.map(r=>`
    <div class="rubric-item" onclick="openRef('rubric','${r.id}')">
      <div class="rpath">${escapeHTML(r.path)}</div>
      <h4>${escapeHTML(r.title)} <span class="fav-star ${favorites.has(r.id)?'on':''}" style="font-size:0.8rem;cursor:pointer;" onclick="event.stopPropagation();quickFav('${r.id}')">\u2605</span></h4>
      <div class="remedies">Remedies: ${r.remedies.map(rm=>{
        const rd = REMEDIES.find(x=>x.name===rm);
        return rd ? `<b onclick="event.stopPropagation();openRef('remedy','${rd.id}')">${escapeHTML(rm)}</b>` : escapeHTML(rm);
      }).join(', ')}</div>
    </div>`).join('') : `<div class="empty">No rubrics match</div>`;
}

/* ============ SEARCH ============ */
function renderSearchView(){
  const chips = document.getElementById('filterChips');
  const opts = ['All','Materia Medica','Repertory','Boericke','Phatak','Murphy'];
  if(activeFilter==='All' && settings.defaultFilter) activeFilter = settings.defaultFilter;
  chips.innerHTML = opts.map(o=>`<span class="chip ${activeFilter===o?'active':''}" onclick="setFilter('${o}')">${o}</span>`).join('');
  document.getElementById('searchType').value = document.getElementById('searchType').value || 'any';
  document.getElementById('searchField').value = document.getElementById('searchField').value || 'all';
  runSearch(document.getElementById('mainSearch').value);
  renderRecentSearches();
}
function setFilter(o){ activeFilter = o; renderSearchView(); }
document.getElementById('mainSearch').addEventListener('input', e=>runSearch(e.target.value));
document.getElementById('searchType').addEventListener('change', ()=>runSearch(document.getElementById('mainSearch').value));
document.getElementById('searchField').addEventListener('change', ()=>runSearch(document.getElementById('mainSearch').value));
document.getElementById('quickSearch').addEventListener('input', e=>{
  if(e.target.value.trim().length>0){
    switchView('search');
    document.getElementById('mainSearch').value = e.target.value;
    runSearch(e.target.value);
  }
});
function recordSearch(q){
  if(!q) return;
  searchHistory.unshift({q, type:document.getElementById('searchType').value, field:document.getElementById('searchField').value, ts:Date.now()});
  searchHistory = searchHistory.slice(0,30);
  saveState();
  renderRecentSearches();
}
function renderRecentSearches(){
  const el = document.getElementById('recentSearches');
  el.innerHTML = searchHistory.length ? searchHistory.slice(0,8).map(s=>`
    <div class="history-item" onclick="replaySearch('${escapeHTML(s.q).replace(/'/g,"\\'")}')">
      <span class="htitle">${escapeHTML(s.q)}</span>
      <span class="hmeta">${s.type} &middot; ${s.field} &middot; ${new Date(s.ts).toLocaleDateString()}</span>
    </div>`).join('') : `<div class="empty">No searches yet</div>`;
}
function replaySearch(q){
  document.getElementById('mainSearch').value = q;
  runSearch(q);
}
function clearSearchHistory(){
  searchHistory = []; saveState(); renderRecentSearches(); toast('Search history cleared');
}
let searchDebounce;
function runSearch(q){
  clearTimeout(searchDebounce);
  searchDebounce = setTimeout(()=>{
    q = (q||'').trim();
    if(q.length>=3) recordSearch(q);
    performSearch(q);
  }, 200);
}
function performSearch(q){
  const type = document.getElementById('searchType').value;
  const field = document.getElementById('searchField').value;
  let pool = [];
  REMEDIES.forEach(r=>{
    let texts = {name:r.name, rubric:'', symptom:r.full, disease:'', mental:r.constitution,
      physical:r.full, organ:r.organ, modalities:r.modalities, constitution:r.constitution,
      relationships:r.relationships, all:r.name+' '+r.common+' '+r.keynote+' '+r.full+' '+r.organ+' '+r.modalities+' '+r.constitution+' '+r.relationships};
    pool.push({type:'remedy', data:r, text:texts[field]||texts.all});
  });
  RUBRICS.forEach(r=>{
    let texts = {name:'', rubric:r.title+' '+r.path, symptom:r.title, disease:'',
      mental:r.path==='Mind'?r.title:'', physical:r.title, organ:r.path, modalities:'',
      constitution:'', relationships:r.remedies.join(' '),
      all:r.title+' '+r.path+' '+r.remedies.join(' ')};
    pool.push({type:'rubric', data:r, text:texts[field]||texts.all});
  });
  if(activeFilter==='Materia Medica') pool = pool.filter(p=>p.type==='remedy');
  else if(activeFilter==='Repertory') pool = pool.filter(p=>p.type==='rubric');
  else if(AUTHORS.includes(activeFilter)) pool = pool.filter(p=>p.data.author===activeFilter);

  let results = pool;
  if(q.length>0){
    const ql = q.toLowerCase();
    if(type==='phrase'){
      results = pool.filter(p=>p.text.toLowerCase().includes(ql));
    } else if(type==='all'){
      const words = ql.split(/\s+/).filter(Boolean);
      results = pool.filter(p=>words.every(w=>p.text.toLowerCase().includes(w)));
    } else if(type==='partial'){
      results = pool.filter(p=>p.text.toLowerCase().includes(ql));
    } else { // any
      const words = ql.split(/\s+/).filter(Boolean);
      results = pool.filter(p=>words.some(w=>p.text.toLowerCase().includes(w)));
    }
  }
  document.getElementById('resultCount').textContent = q
    ? `${results.length} result${results.length!==1?'s':''} for \u201c${q}\u201d`
    : `Showing ${results.length} entries &mdash; start typing to narrow it down`;
  const wrap = document.getElementById('resultsWrap');
  wrap.innerHTML = results.map(r=>{
    const title = r.data.name || r.data.title;
    const snippetSrc = r.type==='remedy'
      ? r.data.keynote
      : `${r.data.path} \u2014 remedies: ${r.data.remedies.join(', ')}`;
    return `<div class="result-card" onclick="openRef('${r.type}','${r.data.id}')">
      <div class="rtitle">${highlight(title,q)}</div>
      <div class="rmeta">${r.type==='remedy'?'Materia Medica':'Repertory'} &middot; ${r.data.author}${r.type==='remedy'?' &middot; '+escapeHTML(r.data.chapter):' &middot; '+escapeHTML(r.data.path)}</div>
      <div class="rsnippet">${highlight(snippetSrc.slice(0,200),q)}</div>
    </div>`;
  }).join('') || `<div class="empty">No matches &mdash; try a different word, or add more entries to your library</div>`;
}

/* ============ READER ============ */
function openRef(type, id){
  const data = type==='remedy' ? REMEDIES.find(r=>r.id===id) : RUBRICS.find(r=>r.id===id);
  if(!data) return;
  currentRef = {type, data};
  history = [{id, type, ts:Date.now()}, ...history.filter(h=>h.id!==id)].slice(0,50);
  if(settings.autoBookmark) bookmarks.add(id);
  updateStreak();
  saveState();

  document.getElementById('readerMeta').innerHTML = `
    <span>${type==='remedy'?'Materia Medica':'Repertory'}</span>
    <span>\u00b7</span>
    <span>${data.author}</span>
    ${type==='remedy' ? `<span>\u00b7</span><span>${escapeHTML(data.chapter)}</span><span>\u00b7</span><span>${escapeHTML(data.common||'')}</span>` : `<span>\u00b7</span><span>${escapeHTML(data.path)}</span>`}
  `;
  document.getElementById('readerTitle').textContent = data.name || data.title;

  if(type==='remedy'){
    document.getElementById('readerBody').innerHTML = `<p>${escapeHTML(data.full)}</p>`;
    document.getElementById('readerMetaBlock').innerHTML = `
      <b>Keynote</b><p>${escapeHTML(data.keynote)}</p>
      <b>Organ / System</b><p>${escapeHTML(data.organ)}</p>
      <b>Modalities</b><p>${escapeHTML(data.modalities)}</p>
      <b>Constitution</b><p>${escapeHTML(data.constitution)}</p>
      <b>Relationships</b><p>${escapeHTML(data.relationships)}</p>
    `;
  } else {
    document.getElementById('readerBody').innerHTML = `
      <p><b>${escapeHTML(data.path)}</b> &mdash; ${escapeHTML(data.title)}</p>
      <p>Associated remedies:</p>
      <p>${data.remedies.map(rm=>{
        const rd = REMEDIES.find(x=>x.name===rm);
        return rd ? `<b style="color:var(--bottle);cursor:pointer;text-decoration:underline dotted;" onclick="openRef('remedy','${rd.id}')">${escapeHTML(rm)}</b>` : escapeHTML(rm);
      }).join(', ')}</p>`;
    document.getElementById('readerMetaBlock').innerHTML = `<b>Cross-reference</b><p>Tap any remedy above to jump to its Materia Medica entry.</p>`;
  }

  // Buttons
  document.getElementById('btnFav').textContent = favorites.has(id) ? '\u2605 Favorited' : '\u2606 Favorite';
  document.getElementById('btnFav').classList.toggle('on', favorites.has(id));
  document.getElementById('btnBookmark').textContent = bookmarks.has(id) ? '\ud83d\udd16 Bookmarked' : '\ud83d\udd16 Bookmark';
  document.getElementById('btnBookmark').classList.toggle('on', bookmarks.has(id));
  document.getElementById('noteInput').value = '';
  // Pre-fill note category based on type
  document.getElementById('noteCategory').value = type==='remedy' ? 'Remedy' : 'Rubric';

  // Theme
  const themeMap = {Boericke:'boericke', Phatak:'phatak', Murphy:'murphy'};
  applyTheme(themeMap[data.author] || settings.theme);

  // Reader marks (highlights/underlines)
  restoreMarks();

  // Cross-ref panel hidden initially
  document.getElementById('crossRefPanel').style.display = 'none';

  // Apply settings
  applyReaderSettings();

  // Reader progress (placeholder — full article loaded)
  document.getElementById('readerProgressFill').style.width = '100%';

  // Start timer
  startReaderTimer(id);

  switchView('reader');
}
function startReaderTimer(id){
  stopReaderTimer();
  readerTimer.start = Date.now();
  readerTimer.lastId = id;
  readerTimer.interval = setInterval(()=>{
    const sec = Math.floor((Date.now()-readerTimer.start)/1000);
    const m = String(Math.floor(sec/60)).padStart(2,'0');
    const s = String(sec%60).padStart(2,'0');
    document.getElementById('readerTimer').textContent = `${m}:${s}`;
  }, 1000);
}
function stopReaderTimer(){
  if(readerTimer.interval){
    clearInterval(readerTimer.interval);
    const sec = Math.floor((Date.now()-readerTimer.start)/1000);
    if(sec>1 && readerTimer.lastId){
      readingStats.totalTime = (readingStats.totalTime||0) + sec;
      readingStats.byRef = readingStats.byRef||{};
      readingStats.byRef[readerTimer.lastId] = (readingStats.byRef[readerTimer.lastId]||0) + sec;
      const t = todayKey();
      readingStats.byDate = readingStats.byDate||{};
      readingStats.byDate[t] = (readingStats.byDate[t]||0) + sec;
      saveState();
    }
    readerTimer.interval = null;
    readerTimer.start = null;
    readerTimer.lastId = null;
  }
}
function navAdjacent(dir){
  if(!currentRef) return;
  const list = currentRef.type==='remedy' ? REMEDIES : RUBRICS;
  const idx = list.findIndex(r=>r.id===currentRef.data.id);
  const next = list[idx+dir];
  if(next) openRef(currentRef.type, next.id);
  else toast(dir<0 ? 'Already at first' : 'Already at last');
}
function quickFav(id){
  if(favorites.has(id)) favorites.delete(id); else favorites.add(id);
  saveState();
  renderMateriaGrid(); renderRepList(); renderHome(); renderFavorites();
  toast(favorites.has(id) ? 'Added to favorites' : 'Removed from favorites');
}
function toggleFav(){
  const id = currentRef.data.id;
  if(favorites.has(id)) favorites.delete(id); else favorites.add(id);
  saveState();
  document.getElementById('btnFav').textContent = favorites.has(id) ? '\u2605 Favorited' : '\u2606 Favorite';
  document.getElementById('btnFav').classList.toggle('on', favorites.has(id));
  renderHome(); renderFavorites();
}
function toggleBookmark(){
  const id = currentRef.data.id;
  if(bookmarks.has(id)) bookmarks.delete(id); else bookmarks.add(id);
  saveState();
  document.getElementById('btnBookmark').textContent = bookmarks.has(id) ? '\ud83d\udd16 Bookmarked' : '\ud83d\udd16 Bookmark';
  document.getElementById('btnBookmark').classList.toggle('on', bookmarks.has(id));
  renderHome();
}
function saveNote(){
  const text = document.getElementById('noteInput').value.trim();
  if(!text) return;
  const category = document.getElementById('noteCategory').value;
  notesData.unshift({
    id: 'n'+Date.now(),
    refId: currentRef.data.id,
    refTitle: currentRef.data.name || currentRef.data.title,
    refType: currentRef.type,
    category,
    text,
    date: new Date().toLocaleDateString()
  });
  document.getElementById('noteInput').value = '';
  saveState();
  renderNotesView(); renderHome();
  toast('Note saved');
}
function deleteNote(id){
  notesData = notesData.filter(n=>n.id!==id);
  saveState();
  renderNotesView(); renderHome();
}
function editNote(id){
  const n = notesData.find(x=>x.id===id);
  if(!n) return;
  document.getElementById('noteInput').value = n.text;
  document.getElementById('noteCategory').value = n.category;
  notesData = notesData.filter(x=>x.id!==id);
  saveState();
  renderNotesView();
  if(currentRef && currentRef.data.id===n.refId){
    switchView('reader');
  } else {
    openRef(n.refType, n.refId);
  }
  toast('Note loaded for editing');
}

/* Highlights & underlines */
function addHighlight(cls){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount || sel.isCollapsed){
    toast('Select text first'); return;
  }
  const range = sel.getRangeAt(0);
  const text = sel.toString();
  if(!text) { toast('Select text first'); return; }
  try{
    const mark = document.createElement('mark');
    mark.className = cls;
    mark.dataset.mark = '1';
    range.surroundContents(mark);
    saveMark(currentRef.data.id, {type:'highlight', color:cls, text});
    sel.removeAllRanges();
    toast('Highlight added');
  }catch(e){
    toast('Cannot highlight across elements');
  }
}
function addUnderline(){
  const sel = window.getSelection();
  if(!sel || !sel.rangeCount || sel.isCollapsed){
    toast('Select text first'); return;
  }
  const range = sel.getRangeAt(0);
  const text = sel.toString();
  if(!text) { toast('Select text first'); return; }
  try{
    const u = document.createElement('u');
    u.className = 'underline-custom';
    u.dataset.mark = '1';
    range.surroundContents(u);
    saveMark(currentRef.data.id, {type:'underline', text});
    sel.removeAllRanges();
    toast('Underlined');
  }catch(e){ toast('Cannot underline across elements'); }
}
function clearMarks(){
  const page = document.getElementById('readerPage');
  page.querySelectorAll('mark[data-mark], u[data-mark]').forEach(el=>{
    const parent = el.parentNode;
    while(el.firstChild) parent.insertBefore(el.firstChild, el);
    parent.removeChild(el);
    parent.normalize();
  });
  if(currentRef) readerMarks[currentRef.data.id] = [];
  saveState();
  toast('Marks cleared');
}
function saveMark(refId, mark){
  if(!readerMarks[refId]) readerMarks[refId] = [];
  readerMarks[refId].push(mark);
  saveState();
}
function restoreMarks(){
  if(!currentRef) return;
  const marks = readerMarks[currentRef.data.id] || [];
  if(!marks.length) return;
  // Re-apply marks via simple text search within readerBody
  const body = document.getElementById('readerBody');
  marks.forEach(m=>{
    const walker = document.createTreeWalker(body, NodeFilter.SHOW_TEXT, null, false);
    while(walker.nextNode()){
      const node = walker.currentNode;
      const idx = node.nodeValue.indexOf(m.text);
      if(idx>=0){
        try{
          const range = document.createRange();
          range.setStart(node, idx);
          range.setEnd(node, idx + m.text.length);
          const el = document.createElement(m.type==='highlight' ? 'mark' : 'u');
          if(m.type==='highlight') el.className = m.color;
          else el.className = 'underline-custom';
          el.dataset.mark = '1';
          range.surroundContents(el);
          break;
        }catch(e){}
      }
    }
  });
}

/* Copy selected text */
function copySelection(){
  const sel = window.getSelection();
  if(!sel || sel.isCollapsed){ toast('Select text first'); return; }
  const text = sel.toString();
  navigator.clipboard.writeText(text).then(()=>toast('Copied')).catch(()=>toast('Copy failed'));
}

/* Cross-reference */
function showCrossRef(){
  const panel = document.getElementById('crossRefPanel');
  if(panel.style.display === 'block'){ panel.style.display='none'; return; }
  if(!currentRef){ panel.style.display='none'; return; }
  let html = '<div class="section-label">Cross Reference</div>';
  if(currentRef.type==='remedy'){
    // find rubrics mentioning this remedy
    const related = RUBRICS.filter(r=>r.remedies.some(rm=>rm===currentRef.data.name));
    html += related.length
      ? `<ul class="list-simple">${related.map(r=>`<li onclick="openRef('rubric','${r.id}')"><span>${escapeHTML(r.title)}</span><span class="tag">${r.author} &middot; ${r.path}</span></li>`).join('')}</ul>`
      : '<div class="empty">No rubrics reference this remedy</div>';
    // related remedies (same chapter, different author)
    const relRem = REMEDIES.filter(r=>r.id!==currentRef.data.id && r.chapter===currentRef.data.chapter).slice(0,5);
    if(relRem.length){
      html += '<div class="section-label" style="margin-top:18px;">Related Remedies (same chapter)</div>';
      html += `<ul class="list-simple">${relRem.map(r=>`<li onclick="openRef('remedy','${r.id}')"><span>${escapeHTML(r.name)}</span><span class="tag">${r.author}</span></li>`).join('')}</ul>`;
    }
  } else {
    // for rubric, list all its remedies with one-tap
    html += `<ul class="list-simple">${currentRef.data.remedies.map(rm=>{
      const rd = REMEDIES.find(x=>x.name===rm);
      return rd ? `<li onclick="openRef('remedy','${rd.id}')"><span>${escapeHTML(rm)}</span><span class="tag">${rd.author}</span></li>` : `<li><span>${escapeHTML(rm)}</span></li>`;
    }).join('')}</ul>`;
  }
  panel.innerHTML = html;
  panel.style.display = 'block';
}

/* Theme & font */
document.querySelectorAll('.reader-toolbar [data-theme]').forEach(btn=>{
  btn.addEventListener('click', ()=>applyTheme(btn.dataset.theme));
});
function applyTheme(t){
  const page = document.getElementById('readerPage');
  page.className = 'reader-page theme-'+t;
  document.querySelectorAll('.reader-toolbar [data-theme]').forEach(b=>b.classList.toggle('on', b.dataset.theme===t));
  settings.theme = t; saveState();
  applyBrightness();
}
function applyBrightness(){
  const page = document.getElementById('readerPage');
  page.style.filter = `brightness(${settings.brightness})`;
}
function adjustFont(dir){
  settings.fontSize = Math.max(0.7, Math.min(1.6, settings.fontSize + dir*0.08));
  saveState();
  applyReaderSettings();
  syncSettingsUI();
}
function applyReaderSettings(){
  const page = document.getElementById('readerPage');
  if(!page) return;
  page.style.fontFamily = `'${settings.fontFamily}', serif`;
  page.style.fontSize = settings.fontSize + 'rem';
  page.style.fontWeight = settings.fontWeight;
  page.style.lineHeight = settings.lineHeight;
  page.querySelectorAll('p').forEach(p=>p.style.marginBottom = settings.paraSpacing + 'em');
  page.style.padding = `40px ${settings.margin}px`;
  applyBrightness();
}
function toggleFullscreen(){
  const docEl = document.documentElement;
  if(!document.fullscreenElement){
    (docEl.requestFullscreen||docEl.webkitRequestFullscreen||function(){}).call(docEl);
    toast('Entered fullscreen');
  } else {
    (document.exitFullscreen||document.webkitExitFullscreen||function(){}).call(document);
    toast('Exited fullscreen');
  }
}

/* Swipe navigation (basic touch) */
let touchStartX = 0;
document.addEventListener('touchstart', e=>{
  if(document.getElementById('view-reader').classList.contains('active')){
    touchStartX = e.changedTouches[0].clientX;
  }
}, {passive:true});
document.addEventListener('touchend', e=>{
  if(document.getElementById('view-reader').classList.contains('active')){
    const dx = e.changedTouches[0].clientX - touchStartX;
    if(Math.abs(dx) > 80){
      if(dx > 0) navAdjacent(-1);
      else navAdjacent(1);
    }
  }
}, {passive:true});

/* Keyboard arrows for prev/next */
document.addEventListener('keydown', e=>{
  if(!document.getElementById('view-reader').classList.contains('active')) return;
  if(e.target.tagName==='INPUT' || e.target.tagName==='TEXTAREA') return;
  if(e.key==='ArrowLeft') navAdjacent(-1);
  if(e.key==='ArrowRight') navAdjacent(1);
});

/* ============ FAVORITES VIEW ============ */
function renderFavorites(){
  const remItems = [...favorites].map(id=>REMEDIES.find(x=>x.id===id)).filter(Boolean);
  const rubItems = [...favorites].map(id=>RUBRICS.find(x=>x.id===id)).filter(Boolean);
  const favRem = document.getElementById('favRemFull');
  favRem.innerHTML = remItems.length ? remItems.map(r=>`<li onclick="openRef('remedy','${r.id}')"><span>${escapeHTML(r.name)}</span><span class="tag">${r.author} &middot; ${escapeHTML(r.chapter)}</span></li>`).join('') : '<li style="cursor:default;color:#999;">No remedies favorited</li>';
  const favRub = document.getElementById('favRubFull');
  favRub.innerHTML = rubItems.length ? rubItems.map(r=>`<li onclick="openRef('rubric','${r.id}')"><span>${escapeHTML(r.title)}</span><span class="tag">${r.author} &middot; ${escapeHTML(r.path)}</span></li>`).join('') : '<li style="cursor:default;color:#999;">No rubrics favorited</li>';

  // Favorite books = authors user has favorited entries from
  const favAuthors = new Set([...remItems, ...rubItems].map(x=>x.author));
  const favBook = document.getElementById('favBookFull');
  favBook.innerHTML = favAuthors.size ? [...favAuthors].map(a=>`<li onclick="openBrowse('materia','${a}')"><span>${a}</span><span class="tag">${AUTHOR_META[a].desc}</span></li>`).join('') : '<li style="cursor:default;color:#999;">No favorite authors yet</li>';

  // Favorite chapters = chapters user has favorited entries from
  const favChapters = new Set(remItems.map(r=>r.chapter));
  const favCh = document.getElementById('favChapterFull');
  favCh.innerHTML = favChapters.size ? [...favChapters].map(c=>`<li onclick="setMateriaAuthor('Boericke');switchView('materia');setTimeout(()=>setMateriaChapter('${escapeHTML(c).replace(/'/g,"\\'")}'),50)"><span>${escapeHTML(c)}</span><span class="tag">Chapter</span></li>`).join('') : '<li style="cursor:default;color:#999;">No favorite chapters yet</li>';
}

/* ============ NOTES VIEW ============ */
function renderNotesView(){
  const term = (document.getElementById('noteSearch')?.value||'').toLowerCase();
  const cat = document.getElementById('noteFilter')?.value || 'All';
  let items = notesData.slice();
  if(cat!=='All') items = items.filter(n=>n.category===cat);
  if(term) items = items.filter(n=>(n.text+' '+n.refTitle).toLowerCase().includes(term));

  const wrap = document.getElementById('notesWrap');
  if(!items.length){
    wrap.innerHTML = '<div class="empty">No notes match</div>';
    return;
  }
  // Group by date
  const byDate = {};
  items.forEach(n=>{ (byDate[n.date]=byDate[n.date]||[]).push(n); });
  let html = '';
  Object.keys(byDate).sort((a,b)=>b.localeCompare(a)).forEach(date=>{
    html += `<div class="date-group"><div class="date-h">${escapeHTML(date)}</div>`;
    byDate[date].forEach(n=>{
      html += `<div class="note-card">
        <div class="nmeta">
          <span>${escapeHTML(n.refTitle)} <span class="cat">${n.category}</span></span>
          <span>${escapeHTML(n.date)}</span>
        </div>
        <p>${escapeHTML(n.text)}</p>
        <span class="del" onclick="deleteNote('${n.id}')">Delete</span>
        <span class="edit" onclick="editNote('${n.id}')">Edit</span>
      </div>`;
    });
    html += '</div>';
  });
  wrap.innerHTML = html;
}
document.addEventListener('input', e=>{
  if(e.target.id==='noteSearch' || e.target.id==='noteFilter') renderNotesView();
});

/* ============ HISTORY VIEW ============ */
function renderHistory(){
  const recent = document.getElementById('historyRecent');
  recent.innerHTML = history.length ? history.slice(0,10).map(h=>{
    const it = findById(h.id);
    if(!it) return '';
    return `<div class="history-item" onclick="openRef('${it.type}','${it.data.id}')">
      <span class="htitle">${escapeHTML(it.data.name||it.data.title)}</span>
      <span class="hmeta">${it.type} &middot; ${it.data.author} &middot; ${new Date(h.ts).toLocaleString()}</span>
    </div>`;
  }).join('') : '<div class="empty">No reading history yet</div>';

  const remHist = document.getElementById('historyRemedies');
  remHist.innerHTML = history.filter(h=>h.type==='remedy').slice(0,15).map(h=>{
    const r = REMEDIES.find(x=>x.id===h.id);
    return r ? `<li onclick="openRef('remedy','${r.id}')"><span>${escapeHTML(r.name)}</span><span class="tag">${new Date(h.ts).toLocaleDateString()}</span></li>` : '';
  }).join('') || '<li style="cursor:default;color:#999;">No remedies viewed yet</li>';

  const rubHist = document.getElementById('historyRubrics');
  rubHist.innerHTML = history.filter(h=>h.type==='rubric').slice(0,15).map(h=>{
    const r = RUBRICS.find(x=>x.id===h.id);
    return r ? `<li onclick="openRef('rubric','${r.id}')"><span>${escapeHTML(r.title)}</span><span class="tag">${new Date(h.ts).toLocaleDateString()}</span></li>` : '';
  }).join('') || '<li style="cursor:default;color:#999;">No rubrics viewed yet</li>';

  const sh = document.getElementById('searchHistoryWrap');
  sh.innerHTML = searchHistory.length ? searchHistory.map((s,i)=>`<div class="history-item" onclick="replaySearch('${escapeHTML(s.q).replace(/'/g,"\\'")}')">
    <span class="htitle">${escapeHTML(s.q)}</span>
    <span class="hmeta">${s.type} &middot; ${s.field} &middot; ${new Date(s.ts).toLocaleString()}</span>
  </div>`).join('') : '<div class="empty">No search history yet</div>';
}

/* ============ SETTINGS VIEW ============ */
function renderSettings(){
  document.getElementById('setTheme').value = settings.theme;
  document.getElementById('setFont').value = settings.fontFamily;
  document.getElementById('setFontSize').value = settings.fontSize;
  document.getElementById('setFontSizeOut').textContent = settings.fontSize.toFixed(2)+'rem';
  document.getElementById('setFontWeight').value = settings.fontWeight;
  document.getElementById('setLineHeight').value = settings.lineHeight;
  document.getElementById('setLineHeightOut').textContent = settings.lineHeight.toFixed(1);
  document.getElementById('setParaSpacing').value = settings.paraSpacing;
  document.getElementById('setParaSpacingOut').textContent = settings.paraSpacing.toFixed(1)+'em';
  document.getElementById('setMargin').value = settings.margin;
  document.getElementById('setMarginOut').textContent = settings.margin+'px';
  document.getElementById('setBrightness').value = settings.brightness;
  document.getElementById('setBrightnessOut').textContent = Math.round(settings.brightness*100)+'%';
  document.getElementById('setAutoResume').checked = settings.autoResume;
  document.getElementById('setAutoBookmark').checked = settings.autoBookmark;
  document.getElementById('setAnim').checked = settings.anim;
  document.getElementById('setScroll').checked = settings.scroll;
  document.getElementById('setWakeLock').checked = settings.wakeLock;
  document.getElementById('setDefFilter').value = settings.defaultFilter;
  // Animation toggle effect
  document.querySelectorAll('.view').forEach(v=> v.style.animation = settings.anim ? '' : 'none');
  // Apply wake lock if requested
  if(settings.wakeLock) requestWakeLock(); else releaseWakeLock();
}
function syncSettingsUI(){
  if(document.getElementById('setFontSize'))
    document.getElementById('setFontSize').value = settings.fontSize;
  if(document.getElementById('setFontSizeOut'))
    document.getElementById('setFontSizeOut').textContent = settings.fontSize.toFixed(2)+'rem';
}
['setTheme','setFont','setFontWeight','setDefFilter'].forEach(id=>{
  document.addEventListener('change', e=>{
    if(e.target.id===id){
      const map = {setTheme:'theme', setFont:'fontFamily', setFontWeight:'fontWeight', setDefFilter:'defaultFilter'};
      settings[map[id]] = e.target.value;
      saveState();
      if(id==='setTheme') applyTheme(e.target.value);
      applyReaderSettings();
    }
  });
});
['setFontSize','setLineHeight','setParaSpacing','setMargin','setBrightness'].forEach(id=>{
  document.addEventListener('input', e=>{
    if(e.target.id===id){
      const map = {setFontSize:'fontSize', setLineHeight:'lineHeight', setParaSpacing:'paraSpacing', setMargin:'margin', setBrightness:'brightness'};
      settings[map[id]] = parseFloat(e.target.value);
      const outMap = {setFontSize:()=>settings.fontSize.toFixed(2)+'rem', setLineHeight:()=>settings.lineHeight.toFixed(1),
        setParaSpacing:()=>settings.paraSpacing.toFixed(1)+'em', setMargin:()=>settings.margin+'px',
        setBrightness:()=>Math.round(settings.brightness*100)+'%'};
      const out = document.getElementById(id+'Out');
      if(out) out.textContent = outMap[id]();
      saveState();
      applyReaderSettings();
    }
  });
});
['setAutoResume','setAutoBookmark','setAnim','setScroll','setWakeLock'].forEach(id=>{
  document.addEventListener('change', e=>{
    if(e.target.id===id){
      const map = {setAutoResume:'autoResume', setAutoBookmark:'autoBookmark', setAnim:'anim', setScroll:'scroll', setWakeLock:'wakeLock'};
      settings[map[id]] = e.target.checked;
      saveState();
      if(id==='setAnim') document.querySelectorAll('.view').forEach(v=> v.style.animation = settings.anim ? '' : 'none');
      if(id==='setWakeLock'){ settings.wakeLock ? requestWakeLock() : releaseWakeLock(); }
    }
  });
});

/* Wake Lock API */
let wakeLockSentinel = null;
async function requestWakeLock(){
  try{
    if('wakeLock' in navigator){
      wakeLockSentinel = await navigator.wakeLock.request('screen');
    }
  }catch(e){}
}
async function releaseWakeLock(){
  if(wakeLockSentinel){
    try{ await wakeLockSentinel.release(); }catch(e){}
    wakeLockSentinel = null;
  }
}

/* Data export/import */
function exportData(){
  const data = {
    favorites:[...favorites], bookmarks:[...bookmarks], notesData, history,
    searchHistory, readerMarks, readingStats, settings,
    exportedAt:new Date().toISOString()
  };
  const blob = new Blob([JSON.stringify(data, null, 2)], {type:'application/json'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pradip-homoe-backup-'+todayKey()+'.json';
  a.click();
  URL.revokeObjectURL(url);
  toast('Data exported');
}
function importDataPrompt(){
  document.getElementById('importFile').click();
}
document.getElementById('importFile').addEventListener('change', e=>{
  const file = e.target.files[0];
  if(!file) return;
  const reader = new FileReader();
  reader.onload = ev=>{
    try{
      const d = JSON.parse(ev.target.result);
      if(d.favorites) favorites = new Set(d.favorites);
      if(d.bookmarks) bookmarks = new Set(d.bookmarks);
      if(d.notesData) notesData = d.notesData;
      if(d.history) history = d.history;
      if(d.searchHistory) searchHistory = d.searchHistory;
      if(d.readerMarks) readerMarks = d.readerMarks;
      if(d.readingStats) readingStats = d.readingStats;
      if(d.settings) settings = Object.assign(settings, d.settings);
      saveState();
      renderHome(); renderSettings(); renderNotesView(); renderFavorites();
      toast('Data imported');
    }catch(err){ toast('Import failed: invalid file'); }
  };
  reader.readAsText(file);
  e.target.value = '';
});
function clearAllData(){
  if(!confirm('This will delete ALL your notes, favorites, bookmarks, history and settings. Continue?')) return;
  favorites = new Set(); bookmarks = new Set(); notesData = []; history = [];
  searchHistory = []; readerMarks = {}; readingStats = {totalTime:0, byRef:{}, byDate:{}, lastReadDate:null, streak:0};
  localStorage.removeItem(LS_KEY);
  renderHome(); renderNotesView(); renderFavorites(); renderHistory(); renderSettings();
  toast('All personal data cleared');
}

/* ============ PWA ============ */
window.addEventListener('beforeinstallprompt', e=>{
  e.preventDefault();
  deferredPrompt = e;
  const btn = document.getElementById('installBtn');
  if(btn){ btn.style.display='inline-block'; }
  const st = document.getElementById('installStatus');
  if(st) st.textContent = 'Ready to install';
});
function triggerInstall(){
  if(!deferredPrompt){ toast('Install not available'); return; }
  deferredPrompt.prompt();
  deferredPrompt.userChoice.then(()=>{ deferredPrompt = null; document.getElementById('installBtn').style.display='none'; });
}
if('serviceWorker' in navigator){
  const swCode = `
    const CACHE='pradip-homoe-v2';
    self.addEventListener('install', e=>{ self.skipWaiting(); });
    self.addEventListener('activate', e=>{ e.waitUntil(self.clients.claim()); });
    self.addEventListener('fetch', e=>{
      e.respondWith(
        caches.match(e.request).then(r=> r || fetch(e.request).then(resp=>{
          if(resp && resp.status===200 && e.request.method==='GET'){
            const clone = resp.clone();
            caches.open(CACHE).then(c=>c.put(e.request, clone));
          }
          return resp;
        }).catch(()=>caches.match(e.request)))
      );
    });
  `;
  const swBlob = new Blob([swCode], {type:'application/javascript'});
  const swUrl = URL.createObjectURL(swBlob);
  navigator.serviceWorker.register(swUrl).catch(()=>{ /* offline not available */ });
}

/* ============ INIT ============ */
loadState();
renderHome();
// Apply settings to reader immediately when it opens
window.addEventListener('beforeunload', ()=>{ stopReaderTimer(); });
"""

print(f"JS length: {len(JS)} chars")

# =====================================================================
# ASSEMBLE & WRITE
# =====================================================================
JS_FILLED = (JS
  .replace("__REMEDIES_JSON__", json.dumps(REMEDIES, ensure_ascii=False))
  .replace("__RUBRICS_JSON__", json.dumps(RUBRICS, ensure_ascii=False))
  .replace("__QUOTES_JSON__", json.dumps(QUOTES, ensure_ascii=False))
  .replace("__AUTHORS_JSON__", json.dumps(AUTHORS, ensure_ascii=False))
  .replace("__AUTHOR_META_JSON__", json.dumps(AUTHOR_META, ensure_ascii=False))
  .replace("__MM_CHAPTERS_JSON__", json.dumps(MM_CHAPTERS, ensure_ascii=False))
  .replace("__REP_CHAPTERS_JSON__", json.dumps(REP_CHAPTERS, ensure_ascii=False))
)

# Inline PWA manifest as a data URL
manifest_json = json.dumps({
    "name": "Pradip's Homoe - Personal Digital Homeopathic Library",
    "short_name": "Pradip's Homoe",
    "description": "Personal digital homeopathic library with 6 references, universal search, and Moon+ Reader-like reading experience.",
    "start_url": ".",
    "display": "standalone",
    "background_color": "#F3EBDA",
    "theme_color": "#1E3A2B",
    "icons": []
})

# Inline icon as SVG data URL (a simple brass-ringed bottle)
icon_svg = ('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 192 192">'
            '<rect width="192" height="192" fill="#1E3A2B"/>'
            '<rect x="60" y="40" width="72" height="120" rx="8" fill="#B08D3F"/>'
            '<rect x="72" y="20" width="48" height="22" rx="4" fill="#B08D3F"/>'
            '<text x="96" y="115" text-anchor="middle" fill="#1E3A2B" '
            'font-family="Fraunces, serif" font-size="64" font-style="italic" font-weight="600">P</text>'
            '</svg>')
icon_data_url = "data:image/svg+xml;base64," + __import__('base64').b64encode(icon_svg.encode('utf-8')).decode('ascii')

manifest_url = "data:application/json;base64," + __import__('base64').b64encode(manifest_json.encode('utf-8')).decode('ascii')

HTML = f"""<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
<meta name="theme-color" content="#1E3A2B">
<meta name="description" content="Pradip's Homoe - Personal Digital Homeopathic Library. Six references (Boericke, Phatak, Murphy) for Materia Medica & Repertory, with universal search, reader themes, notes, favorites, history and offline support.">
<title>Pradip's Homoe &mdash; Personal Digital Homeopathic Library</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght,ital@9..144,400..700,0..1&family=Source+Serif+4:opsz,wght@8..60,400;8..60,500;8..60,600&family=IBM+Plex+Mono:wght@400;500&family=Noto+Serif:ital,wght@0,400;0,600;1,400&display=swap" rel="stylesheet">
<link rel="manifest" href="{manifest_url}">
<link rel="icon" type="image/svg+xml" href="{icon_data_url}">
<link rel="apple-touch-icon" href="{icon_data_url}">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="Pradip's Homoe">
<style>
{CSS}
</style>
</head>
<body>
{HTML_BODY}
<script>
{JS_FILLED}
</script>
</body>
</html>
"""

OUT.write_text(HTML, encoding='utf-8')
print(f"\n✓ Wrote {OUT}")
print(f"  Total size: {len(HTML):,} chars  ({len(HTML)/1024:.1f} KB)")
print(f"  Remedies: {len(REMEDIES)}, Rubrics: {len(RUBRICS)}, Quotes: {len(QUOTES)}")



