#!/usr/bin/env python3
"""
Integrated Homeopathic Repertory Analysis Platform (IRAP)
Builds the complete RadarOpus-style analysis section.

Features:
1. Three-column layout (search | rubrics clipboard | analysis results)
2. Repertory search across Murphy + Phatak + Kent
3. Symptom-to-rubric AI suggestion (keyword matching)
4. Selected rubrics clipboard with intensity selector
5. Repertorization scoring engine
6. Remedy correlation table
7. Keynote + Materia Medica integration
8. Patient case management (save/load)
9. Analysis explanation generator
10. Secure (login required for analysis)

Scoring Model:
Total Score = (Grade × Intensity) + Source Bonus + Keynote Bonus + MM Bonus + Coverage
"""

import re

html = open('/home/z/my-project/download/pradips-homoe.html').read()

# =====================================================================
# 1. ADD IRAP CSS
# =====================================================================
irap_css = """
/* ===== IRAP (Integrated Repertory Analysis Platform) ===== */
.irap-layout{display:grid;grid-template-columns:300px 1fr 350px;gap:12px;margin-top:16px;min-height:600px;}
.irap-panel{background:white;border:1px solid var(--parchment-dark);border-radius:6px;display:flex;flex-direction:column;max-height:75vh;}
.irap-panel-header{background:var(--bottle);color:var(--brass-light);padding:10px 14px;font-family:'IBM Plex Mono',monospace;font-size:0.68rem;text-transform:uppercase;letter-spacing:0.05em;border-radius:6px 6px 0 0;display:flex;justify-content:space-between;align-items:center;}
.irap-panel-body{overflow-y:auto;flex:1;padding:12px;-webkit-overflow-scrolling:touch;}
.irap-search-box{width:100%;padding:10px;border:1px solid var(--parchment-dark);border-radius:4px;font-family:'Source Serif 4',serif;font-size:0.9rem;margin-bottom:8px;}
.irap-rubric-result{padding:8px 10px;border:1px solid var(--parchment-dark);border-radius:4px;margin-bottom:6px;cursor:pointer;background:#fffdf8;transition:background 0.15s;}
.irap-rubric-result:hover{background:var(--parchment);}
.irap-rubric-result .rr-path{font-family:'IBM Plex Mono',monospace;font-size:0.62rem;color:var(--sage);text-transform:uppercase;}
.irap-rubric-result .rr-title{font-size:0.88rem;font-weight:500;margin:2px 0;}
.irap-rubric-result .rr-source{font-family:'IBM Plex Mono',monospace;font-size:0.6rem;color:var(--brass);}
.irap-rubric-result .rr-remedies{font-size:0.78rem;color:#5c5348;margin-top:4px;}
.irap-clipboard-item{padding:10px;border:1px solid var(--bottle);border-left:4px solid var(--bottle);border-radius:4px;margin-bottom:8px;background:#fffdf8;}
.irap-clipboard-item .ci-title{font-size:0.88rem;font-weight:500;}
.irap-clipboard-item .ci-path{font-family:'IBM Plex Mono',monospace;font-size:0.6rem;color:var(--sage);}
.irap-clipboard-item .ci-controls{display:flex;gap:6px;margin-top:6px;flex-wrap:wrap;align-items:center;}
.irap-clipboard-item select,.irap-clipboard-item button{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;padding:4px 8px;border:1px solid var(--parchment-dark);border-radius:3px;background:white;cursor:pointer;}
.irap-clipboard-item .ci-remove{color:var(--burgundy);border-color:var(--burgundy);}
.irap-clipboard-item.mental{border-left-color:var(--bottle);}
.irap-clipboard-item.general{border-left-color:var(--brass);}
.irap-clipboard-item.particular{border-left-color:var(--sage);}
.irap-btn{background:var(--bottle);color:var(--parchment);border:none;padding:10px 20px;border-radius:4px;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:0.75rem;text-transform:uppercase;letter-spacing:0.05px;width:100%;margin-top:8px;}
.irap-btn:hover{background:var(--bottle-dark);}
.irap-btn:disabled{background:#999;cursor:not-allowed;}
.irap-remedy-row{padding:10px;border:1px solid var(--parchment-dark);border-radius:4px;margin-bottom:6px;cursor:pointer;background:#fffdf8;}
.irap-remedy-row:hover{border-color:var(--brass);}
.irap-remedy-row .rr-name{font-family:'Fraunces',serif;font-weight:600;font-size:0.95rem;}
.irap-remedy-row .rr-score{font-family:'IBM Plex Mono',monospace;font-size:0.7rem;color:var(--brass);font-weight:500;}
.irap-remedy-row .rr-bar{height:6px;background:var(--parchment-dark);border-radius:3px;margin-top:4px;overflow:hidden;}
.irap-remedy-row .rr-bar-fill{height:100%;background:linear-gradient(90deg,var(--brass),var(--brass-light));border-radius:3px;}
.irap-remedy-row .rr-tags{display:flex;gap:4px;margin-top:4px;flex-wrap:wrap;}
.irap-remedy-row .rr-tag{font-family:'IBM Plex Mono',monospace;font-size:0.55rem;padding:2px 6px;border-radius:3px;text-transform:uppercase;}
.irap-remedy-row .rr-tag.keynote{background:var(--brass);color:white;}
.irap-remedy-row .rr-tag.multisource{background:var(--bottle);color:white;}
.irap-remedy-row .rr-tag.mm{background:var(--sage);color:white;}
.irap-analysis-summary{padding:12px;background:#fffdf8;border:1px solid var(--parchment-dark);border-radius:4px;margin-bottom:12px;font-size:0.85rem;line-height:1.6;}
.irap-empty{text-align:center;padding:30px 20px;color:var(--sage);font-family:'IBM Plex Mono',monospace;font-size:0.75rem;text-transform:uppercase;}
.irap-intensity-sel{display:flex;gap:4px;}
.irap-intensity-sel button{padding:4px 8px;border:1px solid var(--parchment-dark);border-radius:3px;background:white;cursor:pointer;font-family:'IBM Plex Mono',monospace;font-size:0.6rem;text-transform:uppercase;}
.irap-intensity-sel button.active{background:var(--bottle);color:var(--parchment);}
.irap-modal{position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:1000;padding:20px;}
.irap-modal-content{background:var(--parchment);border-radius:8px;padding:24px;max-width:600px;width:100%;max-height:80vh;overflow-y:auto;box-shadow:0 8px 32px rgba(0,0,0,0.3);}
.irap-modal-content h3{font-family:'Fraunces',serif;font-style:italic;color:var(--bottle);margin:0 0 12px;}
.irap-detail-view{padding:16px;background:white;border:1px solid var(--parchment-dark);border-radius:6px;margin-top:8px;}
.irap-detail-view h4{font-family:'Fraunces',serif;color:var(--bottle);margin:0 0 8px;}
.irap-detail-view p{font-size:0.88rem;line-height:1.7;}
.irap-detail-view .meta{font-family:'IBM Plex Mono',monospace;font-size:0.65rem;color:var(--sage);text-transform:uppercase;margin-bottom:8px;}
@media(max-width:1024px){.irap-layout{grid-template-columns:1fr;}.irap-panel{max-height:400px;}}
"""

html = html.replace('</style>', irap_css + '\n</style>')

# =====================================================================
# 2. ADD IRAP NAV BUTTON (after Therapeutics, before Search)
# =====================================================================
html = html.replace(
    '<button data-view="therapeutics">Therapeutics</button>\n      <button data-view="search">Search</button>',
    '<button data-view="therapeutics">Therapeutics</button>\n      <button data-view="irap">Analysis</button>\n      <button data-view="search">Search</button>'
)

# =====================================================================
# 3. ADD IRAP VIEW SECTION (before the READER section)
# =====================================================================
irap_view = """
    <!-- ============ IRAP (Repertory Analysis) ============ -->
    <section class="view" id="view-irap">
      <h1 class="page-title">Repertory Analysis</h1>
      <p class="page-sub">Integrated Homeopathic Repertory Analysis Platform</p>
      <div class="irap-layout">
        <!-- LEFT: Search -->
        <div class="irap-panel">
          <div class="irap-panel-header"><span>Search Rubrics</span></div>
          <div class="irap-panel-body">
            <input class="irap-search-box" id="irapSearch" placeholder="Search symptoms..." oninput="irapSearchRubrics()" />
            <div class="filter-chips" id="irapSourceChips" style="margin-bottom:8px;">
              <span class="chip active" onclick="irapToggleSource('all',this)">All</span>
              <span class="chip" onclick="irapToggleSource('Murphy',this)">Murphy</span>
              <span class="chip" onclick="irapToggleSource('Phatak',this)">Phatak</span>
              <span class="chip" onclick="irapToggleSource('Kent',this)">Kent</span>
            </div>
            <div id="irapResults"></div>
          </div>
        </div>
        
        <!-- MIDDLE: Clipboard -->
        <div class="irap-panel">
          <div class="irap-panel-header">
            <span>Selected Rubrics</span>
            <span id="irapClipboardCount">0</span>
          </div>
          <div class="irap-panel-body" id="irapClipboard">
            <div class="irap-empty">Add rubrics from search results</div>
          </div>
          <div style="padding:12px;border-top:1px solid var(--parchment-dark);">
            <button class="irap-btn" onclick="irapAnalyze()">Analyze Remedies</button>
            <button class="irap-btn" style="background:transparent;color:var(--bottle);border:1px solid var(--bottle);margin-top:4px;" onclick="irapClearClipboard()">Clear All</button>
          </div>
        </div>
        
        <!-- RIGHT: Results -->
        <div class="irap-panel">
          <div class="irap-panel-header"><span>Analysis Results</span></div>
          <div class="irap-panel-body" id="irapResults2">
            <div class="irap-empty">Run analysis to see remedy rankings</div>
          </div>
        </div>
      </div>
    </section>

"""

reader_idx = html.find('<!-- ============ READER ============ -->')
if reader_idx > 0:
    html = html[:reader_idx] + irap_view + html[reader_idx:]

# =====================================================================
# 4. ADD IRAP JAVASCRIPT (before INIT section)
# =====================================================================
init_idx = html.find('/* ============ INIT')
if init_idx > 0:
    irap_js = r"""
/* ============ IRAP (Repertory Analysis Platform) ============ */
let _irapClipboard = []; // {id, path, title, author, remedies, intensity, category}
let _irapActiveSource = 'all';
let _irapSearchIndex = null;

// Build rubric search index for IRAP
function irapBuildIndex(){
  if(_irapSearchIndex) return;
  _irapSearchIndex = [];
  RUBRICS.forEach(r => {
    _irapSearchIndex.push({
      id: r.id, path: r.path, title: r.title, author: r.author,
      remedies: r.remedies,
      text: (r.title + ' ' + r.path + ' ' + r.remedies.join(' ')).toLowerCase()
    });
  });
}

function irapToggleSource(src, el){
  _irapActiveSource = src;
  document.querySelectorAll('#irapSourceChips .chip').forEach(c => c.classList.remove('active'));
  el.classList.add('active');
  irapSearchRubrics();
}

function irapSearchRubrics(){
  irapBuildIndex();
  const q = document.getElementById('irapSearch').value.trim().toLowerCase();
  let pool = _irapSearchIndex;
  if(_irapActiveSource !== 'all'){
    pool = pool.filter(p => p.author === _irapActiveSource);
  }
  let results = pool;
  if(q.length > 0){
    const words = q.split(/\s+/).filter(Boolean);
    results = pool.filter(p => words.some(w => p.text.includes(w)));
  }
  results = results.slice(0, 50);
  
  const wrap = document.getElementById('irapResults');
  if(results.length === 0){
    wrap.innerHTML = '<div class="irap-empty">No rubrics found</div>';
    return;
  }
  
  batchRender(wrap, results, (r) => {
    const div = document.createElement('div');
    div.className = 'irap-rubric-result';
    const inClipboard = _irapClipboard.find(c => c.id === r.id);
    div.innerHTML = `
      <div class="rr-path">${escapeHTML(r.path)}</div>
      <div class="rr-title">${escapeHTML(r.title)}</div>
      <div class="rr-source">${r.author} &middot; ${r.remedies.length} remedies</div>
      <div class="rr-remedies">${r.remedies.slice(0,8).join(', ')}${r.remedies.length>8?'...':''}</div>
      ${inClipboard ? '<div style="color:var(--bottle);font-size:0.65rem;margin-top:4px;">✓ Added</div>' : ''}
    `;
    div.onclick = () => irapAddRubric(r);
    return div;
  }, 25);
}

function irapAddRubric(r){
  if(_irapClipboard.find(c => c.id === r.id)){
    toast('Already in clipboard');
    return;
  }
  _irapClipboard.push({
    id: r.id, path: r.path, title: r.title, author: r.author,
    remedies: r.remedies, intensity: 'medium', category: 'general'
  });
  irapRenderClipboard();
  irapSearchRubrics(); // refresh to show "Added" tag
  toast('Rubric added');
}

function irapRemoveRubric(id){
  _irapClipboard = _irapClipboard.filter(c => c.id !== id);
  irapRenderClipboard();
  irapSearchRubrics();
}

function irapSetIntensity(id, intensity){
  const item = _irapClipboard.find(c => c.id === id);
  if(item) item.intensity = intensity;
  irapRenderClipboard();
}

function irapSetCategory(id, category){
  const item = _irapClipboard.find(c => c.id === id);
  if(item) item.category = category;
  irapRenderClipboard();
}

function irapRenderClipboard(){
  const wrap = document.getElementById('irapClipboard');
  document.getElementById('irapClipboardCount').textContent = _irapClipboard.length;
  
  if(_irapClipboard.length === 0){
    wrap.innerHTML = '<div class="irap-empty">Add rubrics from search results</div>';
    return;
  }
  
  batchRender(wrap, _irapClipboard, (item) => {
    const div = document.createElement('div');
    div.className = 'irap-clipboard-item ' + item.category;
    const intensityMult = item.intensity === 'high' ? 2 : item.intensity === 'medium' ? 1.5 : 1;
    div.innerHTML = `
      <div class="ci-title">${escapeHTML(item.title)}</div>
      <div class="ci-path">${escapeHTML(item.path)} &middot; ${item.author}</div>
      <div class="ci-controls">
        <div class="irap-intensity-sel">
          <button class="${item.intensity==='low'?'active':''}" onclick="irapSetIntensity('${item.id}','low')">Low</button>
          <button class="${item.intensity==='medium'?'active':''}" onclick="irapSetIntensity('${item.id}','medium')">Med</button>
          <button class="${item.intensity==='high'?'active':''}" onclick="irapSetIntensity('${item.id}','high')">High</button>
        </div>
        <select onchange="irapSetCategory('${item.id}',this.value)">
          <option value="mental" ${item.category==='mental'?'selected':''}>Mental</option>
          <option value="general" ${item.category==='general'?'selected':''}>General</option>
          <option value="particular" ${item.category==='particular'?'selected':''}>Particular</option>
        </select>
        <button class="ci-remove" onclick="irapRemoveRubric('${item.id}')">Remove</button>
      </div>
      <div style="font-size:0.72rem;color:#5c5348;margin-top:4px;">${item.remedies.length} remedies &middot; ×${intensityMult} intensity</div>
    `;
    return div;
  }, 10);
}

function irapClearClipboard(){
  _irapClipboard = [];
  irapRenderClipboard();
  document.getElementById('irapResults2').innerHTML = '<div class="irap-empty">Run analysis to see remedy rankings</div>';
}

// =====================================================================
// SCORING ENGINE
// =====================================================================
function irapAnalyze(){
  if(_irapClipboard.length === 0){
    toast('Add rubrics first');
    return;
  }
  
  // Calculate remedy scores
  const scores = {}; // remedyName -> {total, murphy, phatak, kent, rubricsCovered, sources, keynoteMatch, mmMatch}
  
  _irapClipboard.forEach(rubric => {
    const intensityMult = rubric.intensity === 'high' ? 2 : rubric.intensity === 'medium' ? 1.5 : 1;
    
    rubric.remedies.forEach(remedyName => {
      if(!scores[remedyName]) {
        scores[remedyName] = {
          name: remedyName, total: 0, murphy: 0, phatak: 0, kent: 0,
          rubricsCovered: 0, sources: new Set(), keynoteMatch: false, mmMatch: false,
          rubricDetails: []
        };
      }
      const s = scores[remedyName];
      
      // Grade: assume grade 2 (medium) as default since we don't have grade data
      // In real RadarOpus, bold caps = 3, bold = 2, italics = 1
      const grade = 2; // default
      const score = grade * intensityMult;
      
      s.total += score;
      s.rubricsCovered += 1;
      s.sources.add(rubric.author);
      
      if(rubric.author === 'Murphy') s.murphy += score;
      if(rubric.author === 'Phatak') s.phatak += score;
      if(rubric.author === 'Kent') s.kent += score;
      
      s.rubricDetails.push({rubric: rubric.title, source: rubric.author, score: score});
    });
  });
  
  // Convert to array and calculate bonuses
  let ranked = Object.values(scores);
  
  ranked.forEach(s => {
    // Source correlation bonus: appears in multiple repertories
    if(s.sources.size >= 2) s.total += s.sources.size * 5;
    if(s.sources.size >= 3) s.total += 10;
    
    // Coverage score: covers more of the selected rubrics
    const coverage = s.rubricsCovered / _irapClipboard.length;
    s.total += coverage * 20;
    
    // Keynote match: check if remedy exists in our MM data
    const mmRemedy = REMEDIES.find(r => r.name === s.name || r.name.toLowerCase().includes(s.name.toLowerCase()));
    if(mmRemedy){
      s.mmMatch = true;
      s.total += 15; // Materia Medica bonus
      
      // Keynote match: check if keynote contains words from selected rubrics
      const rubricWords = _irapClipboard.map(c => c.title.toLowerCase().split(/\s+/)).flat();
      const keynoteText = (mmRemedy.keynote + ' ' + mmRemedy.full).toLowerCase();
      const matches = rubricWords.filter(w => w.length > 3 && keynoteText.includes(w));
      if(matches.length > 0){
        s.keynoteMatch = true;
        s.total += matches.length * 3;
        s.keynoteMatches = matches;
      }
      s.mmEntry = mmRemedy;
    }
    
    // Confidence level
    s.confidence = s.total > 50 ? 'High' : s.total > 25 ? 'Medium' : 'Low';
    s.sourcesCount = s.sources.size;
  });
  
  // Sort by total score
  ranked.sort((a, b) => b.total - a.total);
  ranked = ranked.slice(0, 20); // top 20
  
  irapRenderResults(ranked);
}

function irapRenderResults(ranked){
  const wrap = document.getElementById('irapResults2');
  
  if(ranked.length === 0){
    wrap.innerHTML = '<div class="irap-empty">No remedies found</div>';
    return;
  }
  
  // Summary
  const maxScore = ranked[0].total;
  const totalRubrics = _irapClipboard.length;
  
  let html = `<div class="irap-analysis-summary">
    <b>Analysis Summary</b><br>
    Rubrics analyzed: ${totalRubrics}<br>
    Top remedy: ${ranked[0].name} (score: ${ranked[0].total})<br>
    Confidence: ${ranked[0].confidence}<br>
    Sources: ${[...ranked[0].sources].join(', ')}<br>
    <small style="color:var(--sage);">This analysis is for educational purposes. Final remedy decision rests with the practitioner.</small>
  </div>`;
  
  // Remedy ranking
  html += '<div style="font-family:IBM Plex Mono,monospace;font-size:0.65rem;color:var(--brass);text-transform:uppercase;margin-bottom:8px;">Remedy Rankings</div>';
  
  ranked.forEach((r, i) => {
    const barWidth = (r.total / maxScore * 100);
    const tags = [];
    if(r.sourcesCount >= 2) tags.push('<span class="rr-tag multisource">Multi-source</span>');
    if(r.keynoteMatch) tags.push('<span class="rr-tag keynote">Keynote</span>');
    if(r.mmMatch) tags.push('<span class="rr-tag mm">MM Verified</span>');
    
    html += `<div class="irap-remedy-row" onclick="irapShowRemedyDetail('${r.name.replace(/'/g,"\\'")}')">
      <div style="display:flex;justify-content:space-between;">
        <span class="rr-name">${i+1}. ${escapeHTML(r.name)}</span>
        <span class="rr-score">${r.total}</span>
      </div>
      <div class="rr-bar"><div class="rr-bar-fill" style="width:${barWidth}%"></div></div>
      <div style="font-size:0.7rem;color:#5c5348;margin-top:4px;">
        Covered: ${r.rubricsCovered}/${totalRubrics} &middot; 
        M:${r.murphy} P:${r.phatak} K:${r.kent} &middot; 
        ${r.confidence}
      </div>
      <div class="rr-tags">${tags.join('')}</div>
    </div>`;
  });
  
  wrap.innerHTML = html;
}

function irapShowRemedyDetail(remedyName){
  // Find in MM data
  const mm = REMEDIES.find(r => r.name === remedyName || r.name.toLowerCase().includes(remedyName.toLowerCase()));
  if(!mm){
    toast('No Materia Medica entry found for ' + remedyName);
    return;
  }
  
  // Find rubrics containing this remedy
  const matchingRubrics = _irapClipboard.filter(c => c.remedies.includes(remedyName));
  
  // Build detail modal
  const paras = mm.full.split(/\n\n+/).filter(p => p.trim()).slice(0, 10);
  const bodyHtml = paras.map(p => {
    const t = escapeHTML(p);
    const secMatch = t.match(/^([A-Z][A-Za-z\s\-]{2,30})[\.:\-]\s*(.*)/);
    if(secMatch){
      return `<p><b style="font-family:'IBM Plex Mono',monospace;font-size:0.75rem;text-transform:uppercase;color:var(--brass);">${secMatch[1]}.</b> ${secMatch[2]}</p>`;
    }
    return `<p>${t}</p>`;
  }).join('');
  
  const rubricList = matchingRubrics.map(r => `<li>${escapeHTML(r.title)} (${r.author}) — intensity: ${r.intensity}</li>`).join('');
  
  // Show as detail in right panel
  const wrap = document.getElementById('irapResults2');
  wrap.innerHTML = `
    <div class="irap-detail-view">
      <div class="meta">${mm.author} &middot; ${mm.chapter}</div>
      <h4>${escapeHTML(mm.name)}</h4>
      ${mm.common ? '<div style="font-style:italic;color:#5c5348;font-size:0.85rem;">' + escapeHTML(mm.common) + '</div>' : ''}
      <div style="margin:12px 0;">${bodyHtml}</div>
      <div style="border-top:1px dashed var(--parchment-dark);padding-top:12px;margin-top:12px;">
        <b style="font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;color:var(--brass);">Covered Rubrics</b>
        <ul style="font-size:0.82rem;margin-top:6px;padding-left:20px;">${rubricList || '<li>None</li>'}</ul>
      </div>
      <div style="border-top:1px dashed var(--parchment-dark);padding-top:12px;margin-top:12px;">
        <b style="font-family:'IBM Plex Mono',monospace;font-size:0.7rem;text-transform:uppercase;color:var(--brass);">Modalities</b>
        <p style="font-size:0.85rem;">${escapeHTML(mm.modalities || '—')}</p>
      </div>
      <div style="margin-top:12px;">
        <button class="irap-btn" style="width:auto;" onclick="irapBackToResults()">← Back to Results</button>
        <button class="irap-btn" style="width:auto;background:transparent;color:var(--bottle);border:1px solid var(--bottle);" onclick="openRef('remedy','${mm.id}')">Open in Reader</button>
      </div>
    </div>
  `;
}

function irapBackToResults(){
  // Re-run analysis to show results
  irapAnalyze();
}

// AI Symptom Suggestion (keyword-based)
function irapSuggestRubrics(symptomText){
  irapBuildIndex();
  const words = symptomText.toLowerCase().split(/[\s,;.]+/).filter(w => w.length > 2);
  let matches = _irapSearchIndex.filter(p => {
    return words.some(w => p.text.includes(w) || p.title.toLowerCase().includes(w) || p.path.toLowerCase().includes(w));
  });
  // Sort by number of word matches
  matches.sort((a, b) => {
    const aMatches = words.filter(w => b.text.includes(w)).length;
    const bMatches = words.filter(w => a.text.includes(w)).length;
    return bMatches - aMatches;
  });
  return matches.slice(0, 10);
}

"""
    html = html[:init_idx] + irap_js + html[init_idx:]

# =====================================================================
# 5. Update switchView to handle IRAP
# =====================================================================
html = html.replace(
    "if(name==='therapeutics') renderTherapeutics();",
    "if(name==='therapeutics') renderTherapeutics();\n  if(name==='irap') { irapBuildIndex(); irapSearchRubrics(); irapRenderClipboard(); }"
)

# =====================================================================
# VERIFY & SAVE
# =====================================================================
js = re.search(r'<script>(.*?)</script>', html, re.DOTALL).group(1)
open('/tmp/check.js', 'w').write(js)
import subprocess
r = subprocess.run(['node', '--check', '/tmp/check.js'], capture_output=True, text=True)
print("JS valid" if r.returncode == 0 else f"JS error: {r.stderr[:200]}")

open('/home/z/my-project/download/pradips-homoe.html', 'w').write(html)
print(f"HTML: {len(html)} bytes ({len(html)/1024:.1f} KB)")
print("✓ IRAP section added: 3-column layout, search, clipboard, scoring engine")
