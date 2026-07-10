// Server-side search API — avoids downloading 32MB JSON to browser
// GET /api/search?q=fear&author=Kent&type=remedy&limit=50

const { query } = require('./_lib/db');
const { getUserFromRequest, sendJSON, sendError } = require('./_lib/auth');

// Pre-loaded data (cached in memory across function invocations)
let _remediesCache = null;
let _rubricsCache = null;
let _searchIndex = null;

async function loadData() {
  if (_searchIndex) return;
  
  // Load remedies from database (or static JSON)
  // For now, we'll use the static JSON files since they're deployed alongside
  const fs = require('fs');
  const path = require('path');
  
  try {
    const remediesPath = path.join(process.cwd(), 'remedies.json');
    const rubricsPath = path.join(process.cwd(), 'rubrics.json');
    
    _remediesCache = JSON.parse(fs.readFileSync(remediesPath, 'utf-8'));
    _rubricsCache = JSON.parse(fs.readFileSync(rubricsPath, 'utf-8'));
    
    // Build search index
    _searchIndex = [];
    _remediesCache.forEach(r => {
      _searchIndex.push({
        type: 'remedy',
        data: r,
        text: (r.name + ' ' + (r.common||'') + ' ' + (r.keynote||'') + ' ' + (r.full||'')).toLowerCase()
      });
    });
    _rubricsCache.forEach(r => {
      _searchIndex.push({
        type: 'rubric',
        data: r,
        text: (r.title + ' ' + r.path + ' ' + r.remedies.join(' ')).toLowerCase()
      });
    });
    
    console.log(`Search index loaded: ${_searchIndex.length} entries`);
  } catch(e) {
    console.error('Failed to load data:', e);
    // Fallback: return empty results
    _searchIndex = [];
  }
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(204).end();

  try {
    await loadData();
    
    const q = (req.query.q || '').toLowerCase().trim();
    const author = req.query.author || '';
    const type = req.query.type || '';
    const limit = Math.min(parseInt(req.query.limit) || 50, 200);
    
    let pool = _searchIndex;
    
    // Filter by author
    if (author && author !== 'All') {
      pool = pool.filter(p => p.data.author === author);
    }
    
    // Filter by type
    if (type === 'remedy') {
      pool = pool.filter(p => p.type === 'remedy');
    } else if (type === 'rubric') {
      pool = pool.filter(p => p.type === 'rubric');
    }
    
    // Search
    let results = pool;
    if (q.length > 0) {
      results = pool.filter(p => p.text.includes(q));
    }
    
    // Limit results
    const total = results.length;
    const display = results.slice(0, limit);
    
    // Return lightweight results (no full text)
    const lightResults = display.map(r => ({
      type: r.type,
      id: r.data.id,
      name: r.data.name || r.data.title,
      author: r.data.author,
      chapter: r.data.chapter || r.data.path,
      keynote: r.type === 'remedy' ? (r.data.keynote || '').slice(0, 200) : '',
      remedies: r.type === 'rubric' ? r.data.remedies.slice(0, 10) : []
    }));
    
    return sendJSON(res, 200, {
      results: lightResults,
      total: total,
      showing: lightResults.length,
      query: q
    });
  } catch(e) {
    console.error('Search error:', e);
    return sendError(res, 500, 'Search failed: ' + e.message);
  }
};
