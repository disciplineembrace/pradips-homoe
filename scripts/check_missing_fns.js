const fs = require('fs');
const html = fs.readFileSync('/home/z/my-project/vercel-deploy/index.html', 'utf8');
// Extract all inline <script> content
let scripts = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]).join('\n');
// Add module scripts
for (const f of ['synthesis_module.js','predictive_module.js','security_module.js','account_module.js']) {
  scripts += '\n' + fs.readFileSync('/home/z/my-project/vercel-deploy/'+f,'utf8');
}
// Find all function calls
const callPattern = /\b([a-zA-Z_$][a-zA-Z0-9_$]*)\s*\(/g;
// Find all function definitions
const defPattern = /(?:function\s+([a-zA-Z_$][a-zA-Z0-9_$]*)|(?:const|let|var)\s+([a-zA-Z_$][a-zA-Z0-9_$]*)\s*=\s*(?:function|\([^)]*\)\s*=>|async\s))|([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:\s*function/g;
const calls = new Set();
const defs = new Set();
let m;
const reserved = new Set(['if','for','while','switch','catch','function','return','typeof','new','await','async','console','do','in','of','void','delete','instanceof','this','super','class','extends','import','export','from','default','try','finally','else','yield']);
while ((m = callPattern.exec(scripts))) {
  const name = m[1];
  if (reserved.has(name)) continue;
  calls.add(name);
}
while ((m = defPattern.exec(scripts))) {
  const name = m[1]||m[2]||m[3];
  if (name) defs.add(name);
}
// Built-in / browser globals / module globals
const builtin = new Set([
  'alert','confirm','prompt','fetch','setTimeout','setInterval','clearTimeout','clearInterval',
  'parseInt','parseFloat','isNaN','isFinite','NaN','Infinity','undefined',
  'JSON','Math','Date','Array','Object','String','Number','Boolean','RegExp','Error','Promise','Map','Set','Symbol','WeakMap','WeakSet','Proxy','Reflect',
  'encodeURIComponent','decodeURIComponent','encodeURI','decodeURI','escape','unescape',
  'document','window','navigator','console','localStorage','sessionStorage','indexedDB','location','history','screen',
  'requestAnimationFrame','cancelAnimationFrame','requestIdleCallback','cancelIdleCallback',
  'addEventListener','removeEventListener','dispatchEvent','getComputedStyle','querySelector','querySelectorAll','getElementById','getElementsByClassName','getElementsByTagName','createElement','createTextNode','createDocumentFragment','createEvent','CustomEvent',
  'open','close','print','focus','blur','scrollTo','scrollBy','scrollIntoView','postMessage','atob','btoa',
  'URL','URLSearchParams','FormData','Headers','Request','Response','Blob','File','FileReader','Image','Audio','Video','WebSocket',
  'Worker','SharedWorker','MessageChannel','MessagePort','AbortController','AbortSignal',
  'PerformanceObserver','performance','IntersectionObserver','ResizeObserver','MutationObserver',
  'crypto','Buffer','process','require','module','exports','global','globalThis','TextEncoder','TextDecoder',
  'setTimeout','setInterval','setImmediate','queueMicrotask',
  'structuredClone','crypto','CSS','HTMLDocument','HTMLElement','Element','Node','EventTarget','Event','MouseEvent','KeyboardEvent','TouchEvent','WheelEvent','InputEvent'
]);
// Known defined in index.html inline (collected by name patterns)
const known = new Set([
  // Found in script
  'loadData','loadState','renderHome','switchView','escapeHTML','findById','toast',
  'REMEDIES','RUBRICS','QUOTES','AUTHORS','AUTHOR_META','MM_CHAPTERS','REP_CHAPTERS',
  'openRef','goBack','goBackBrowser','renderROH','setRohSeries','runRohSearch','clearRohSearch',
  'renderMateria','setMateriaAuthor','setMateriaChapter','renderRepertory','renderRepList','renderSearchView',
  'renderFavorites','renderNotesView','renderHistory','renderSettings','quickFav','buildSearchPool',
  'openDB','getCachedData','setCachedData','getFreshCachedData',
  'irapBuildIndex','irapSuggestRubrics','irapAddRubric','irapRemoveRubric','irapAnalyze','irapClear',
  'renderMateriaGrid',
  'preloadAssets' // already fixed
]);

const missing = [...calls].filter(c => !defs.has(c) && !builtin.has(c) && !known.has(c)).sort();
console.log('Total unique function-like calls:', calls.size);
console.log('Total defined functions:', defs.size);
console.log('');
console.log('=== Potentially MISSING functions (called but not defined) ===');
// Filter out DOM API names that look like function calls
const likelyMissing = missing.filter(f => !f.startsWith('_') && f.length > 2);
likelyMissing.forEach(f => console.log('  ' + f));
