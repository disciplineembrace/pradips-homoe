/* ============ THERAPEUTICS MODULE ============ */
const TherapeuticsModule = (function(){
  let _diseases = [];
  let _loaded = false;
  let _filterLetter = null;
  let _searchTerm = '';

  async function init(){
    if (_loaded) { render(); return; }
    try {
      const r = await fetch('data/therapeutics.json?v=1');
      const d = await r.json();
      _diseases = d.diseases || [];
      _loaded = true;
      render();
    } catch(e) {
      console.error('[Therapeutics] load failed:', e);
      const list = document.getElementById('therList');
      if (list) list.innerHTML = '<div style="padding:40px;text-align:center;color:#6E2A3A;"><h3>Could not load therapeutics data</h3><button onclick="TherapeuticsModule.init()" style="background:#1d3a2b;color:#fff;border:none;padding:10px 24px;border-radius:6px;cursor:pointer;margin-top:12px;">Retry</button></div>';
    }
  }

  function render(){
    const az = document.getElementById('therAZ');
    const list = document.getElementById('therList');
    if (!az || !list) return;

    // Build A-Z filter
    const present = new Set(_diseases.map(d => d.name[0].toUpperCase()));
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
    az.innerHTML = letters.map(L => {
      const has = present.has(L);
      const active = _filterLetter === L;
      if (!has) return `<span style="padding:4px 8px;color:#ccc;font-size:0.8rem;font-family:IBM Plex Mono,monospace;">${L}</span>`;
      return `<a onclick="TherapeuticsModule.setLetter('${L}')" style="padding:4px 8px;cursor:pointer;font-size:0.85rem;font-family:IBM Plex Mono,monospace;color:${active?'#fff':'#1E3A2B'};background:${active?'#1E3A2B':'transparent'};border:1px solid #1E3A2B;border-radius:4px;">${L}</a>`;
    }).join('');

    // Filter
    let items = _diseases;
    if (_filterLetter) items = items.filter(d => d.name[0].toUpperCase() === _filterLetter);
    if (_searchTerm) {
      const q = _searchTerm.toLowerCase();
      items = items.filter(d => {
        if (d.name.toLowerCase().includes(q)) return true;
        if (d.note && d.note.toLowerCase().includes(q)) return true;
        return d.subcategories.some(s => {
          if (s.name.toLowerCase().includes(q)) return true;
          return s.remedies.some(r => r.name.toLowerCase().includes(q));
        });
      });
    }

    // Update subtitle
    const sub = document.getElementById('therSub');
    if (sub) sub.textContent = `${items.length} of ${_diseases.length} diseases ${_filterLetter ? '· Letter ' + _filterLetter : ''} ${_searchTerm ? '· Search: "' + _searchTerm + '"' : ''}`;

    // Render — limit to 100 for performance
    const display = items.slice(0, 100);
    if (display.length === 0) {
      list.innerHTML = '<div style="padding:40px;text-align:center;color:#999;">No matches found. Try a different search or letter.</div>';
      return;
    }
    list.innerHTML = display.map(d => {
      const subsHtml = d.subcategories.slice(0, 6).map(s => {
        const rms = s.remedies.slice(0, 10).map(r => `<b style="color:#1E3A2B;cursor:pointer;" onclick="event.stopPropagation();quickTherRemedy('${r.name.replace(/'/g,"\\'")}')">${r.name}${r.potency ? '<span style="font-size:0.75rem;color:#999;">('+r.potency+')</span>' : ''}</b>`).join(', ');
        const more = s.remedies.length > 10 ? ` <span style="color:#999;font-size:0.8rem;">+${s.remedies.length-10} more</span>` : '';
        return `<div style="margin-bottom:8px;"><span style="font-weight:600;color:#6E2A3A;font-size:0.9rem;">${s.name}:</span> ${rms}${more}</div>`;
      }).join('');
      const moreSubs = d.subcategories.length > 6 ? `<div style="color:#999;font-size:0.8rem;font-style:italic;margin-top:4px;">+${d.subcategories.length-6} more subcategories — click to expand</div>` : '';
      const note = d.note ? `<div style="font-size:0.8rem;color:#888;font-style:italic;margin-top:4px;">(${d.note})</div>` : '';
      return `<div class="rubric-item" style="background:#fffdf8;border:1px solid #f3ead7;border-radius:10px;padding:16px;margin-bottom:12px;cursor:pointer;" onclick="TherapeuticsModule.open('${d.id}')">
        <h4 style="margin:0 0 6px;color:#1d3a2b;font-family:Fraunces,serif;font-size:1.1rem;">${d.name}</h4>
        ${note}
        <div style="font-size:0.75rem;color:#999;margin-bottom:8px;">${d.subcategories.length} formula${d.subcategories.length!==1?'s':''}</div>
        ${subsHtml}
        ${moreSubs}
      </div>`;
    }).join('') + (items.length > 100 ? `<div style="text-align:center;padding:16px;color:#999;">Showing first 100 of ${items.length}. Use search or letter filter to narrow down.</div>` : '');
  }

  function setLetter(L){
    _filterLetter = _filterLetter === L ? null : L;
    render();
  }

  function search(v){
    _searchTerm = (v || '').trim();
    render();
  }

  function clearSearch(){
    _searchTerm = '';
    _filterLetter = null;
    const inp = document.getElementById('therSearch');
    if (inp) inp.value = '';
    render();
  }

  function open(id){
    const d = _diseases.find(x => x.id === id);
    if (!d) return;
    const list = document.getElementById('therList');
    if (!list) return;
    const az = document.getElementById('therAZ');
    if (az) az.style.display = 'none';

    const subsHtml = d.subcategories.map(s => {
      const rms = s.remedies.map(r => `<b style="color:#1E3A2B;cursor:pointer;" onclick="quickTherRemedy('${r.name.replace(/'/g,"\\'")}')">${r.name}</b>${r.potency ? '<span style="font-size:0.8rem;color:#999;">('+r.potency+')</span>' : ''}`).join(', ');
      return `<div style="background:#fff;border:1px solid #f3ead7;border-radius:8px;padding:14px;margin-bottom:10px;">
        <div style="font-weight:600;color:#6E2A3A;font-size:0.95rem;margin-bottom:6px;font-family:Fraunces,serif;">${s.name}</div>
        <div style="line-height:1.8;font-size:0.95rem;">${rms}</div>
      </div>`;
    }).join('');

    const note = d.note ? `<div style="font-size:0.85rem;color:#888;font-style:italic;margin-bottom:12px;">(${d.note})</div>` : '';
    list.innerHTML = `<div>
      <button onclick="TherapeuticsModule.back()" style="background:#1d3a2b;color:#fff;border:none;padding:8px 16px;border-radius:6px;cursor:pointer;margin-bottom:16px;">&larr; All Diseases</button>
      <h2 style="color:#1d3a2b;font-family:Fraunces,serif;margin:0 0 8px;">${d.name}</h2>
      <div style="font-size:0.8rem;color:#999;margin-bottom:12px;">${d.subcategories.length} formulas &middot; Encyclopedia of Homoeopathic Formulas</div>
      ${note}
      ${subsHtml}
    </div>`;
  }

  function back(){
    const az = document.getElementById('therAZ');
    if (az) az.style.display = 'flex';
    render();
  }

  return { init, render, setLetter, search, clearSearch, open, back };
})();
window.TherapeuticsModule = TherapeuticsModule;
// Helper for inline remedy click from therapeutics
function runTherSearch(){ TherapeuticsModule.search(document.getElementById('therSearch').value); }
function clearTherSearch(){ TherapeuticsModule.clearSearch(); }
function quickTherRemedy(name){
  // Try to find matching remedy in REMEDIES and open it
  if (typeof REMEDIES === 'undefined' || !REMEDIES.length) return;
  // Try exact match first, then partial
  const abbrev = name.split(/[.\s]/)[0].toLowerCase();
  let match = REMEDIES.find(r => r.name.toLowerCase() === name.toLowerCase()) ||
              REMEDIES.find(r => r.name.toLowerCase().startsWith(abbrev)) ||
              REMEDIES.find(r => r.id.startsWith(abbrev));
  if (match) openRef('remedy', match.id);
  else alert('Remedy "' + name + '" not found in Materia Medica library');
}
