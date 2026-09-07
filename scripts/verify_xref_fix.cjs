/**
 * Cross-Reference Bug Fix Verification
 * Verifies the root cause is fixed: no rubric shows itself as its own xref.
 */
const fs = require('fs');

console.log('='.repeat(70));
console.log('CROSS-REFERENCE BUG FIX VERIFICATION');
console.log('='.repeat(70));

const xrefs = JSON.parse(fs.readFileSync('/home/z/my-project/data/synthesis/cross_references.json', 'utf-8'));
const tree = JSON.parse(fs.readFileSync('/home/z/my-project/data/synthesis/tree.json', 'utf-8'));

// Build a lookup map for tree nodes
const treeById = {};
for (const n of tree) treeById[n.i] = n;

let pass = 0, fail = 0;
function check(name, condition, detail = '') {
  if (condition) { console.log(`  ✅ ${name}`); pass++; }
  else { console.log(`  ❌ ${name}${detail ? ' — ' + detail : ''}`); fail++; }
}

// ============================================================
// ISSUE #1: No self-reference
// ============================================================
console.log('\n--- ISSUE #1: No rubric shows itself as cross-ref ---');

// Test MIND - ABANDONED (id=13401767) — the user's reported bug
const abandoned = xrefs['13401767'] || [];
console.log(`\n  MIND - ABANDONED (id=13401767):`);
console.log(`    Cross-refs: ${abandoned.length}`);
abandoned.forEach(cr => console.log(`    → id=${cr.id} text="${cr.text}"`));

check(
  'ABANDONED does NOT show itself',
  !abandoned.some(cr => cr.id === 13401767 || cr.text === 'MIND - ABANDONED'),
  `Got: ${JSON.stringify(abandoned)}`
);
check(
  'ABANDONED shows FORSAKEN feeling instead',
  abandoned.some(cr => cr.text === 'MIND - FORSAKEN feeling' && cr.id === 13412445),
  `Got: ${JSON.stringify(abandoned)}`
);

// Test MIND - HAUGHTY (id=13412961) — should have 77 real xrefs
const haughty = xrefs['13412961'] || [];
console.log(`\n  MIND - HAUGHTY (id=13412961):`);
console.log(`    Cross-refs: ${haughty.length}`);
haughty.slice(0, 3).forEach(cr => console.log(`    → id=${cr.id} text="${cr.text}"`));

check('HAUGHTY has 77 cross-refs', haughty.length === 77, `Got ${haughty.length}`);
check('HAUGHTY does NOT show itself', !haughty.some(cr => cr.id === 13412961 || cr.text === 'MIND - HAUGHTY'));
check('HAUGHTY shows AFFECTATION', haughty.some(cr => cr.text === 'MIND - AFFECTATION'));

// Test ALL rubrics — none should show themselves
console.log('\n  Checking ALL rubrics for self-references...');
let selfRefCount = 0;
let totalChecked = 0;
for (const [srcId, refs] of Object.entries(xrefs)) {
  const srcIdNum = parseInt(srcId, 10);
  const srcNode = treeById[srcIdNum];
  for (const cr of refs) {
    totalChecked++;
    if (cr.id === srcIdNum) {
      selfRefCount++;
      console.log(`    ⚠️ SELF-REF: src=${srcId} (${srcNode?.p}) → dest=${cr.id}`);
    }
    // Also check text doesn't match the source's path
    if (srcNode && cr.text === srcNode.p) {
      selfRefCount++;
      console.log(`    ⚠️ SELF-TEXT: src=${srcId} (${srcNode.p}) → text="${cr.text}"`);
    }
  }
}
check(`No self-references in ${totalChecked} total cross-refs`, selfRefCount === 0, `Found ${selfRefCount} self-refs`);

// ============================================================
// ISSUE #2: Each xref has destination ID (clickable)
// ============================================================
console.log('\n--- ISSUE #2: Each cross-ref has destination ID ---');
let missingId = 0;
for (const refs of Object.values(xrefs)) {
  for (const cr of refs) {
    if (!cr.id || typeof cr.id !== 'number' || cr.id <= 0) missingId++;
  }
}
check(`All cross-refs have valid destination ID`, missingId === 0, `${missingId} missing IDs`);

// ============================================================
// ISSUE #3: Each xref has destination path + level + remedy count
// ============================================================
console.log('\n--- ISSUE #3: Each cross-ref has dest_path, level, remedy count ---');
let missingFields = 0;
for (const refs of Object.values(xrefs)) {
  for (const cr of refs) {
    if (!cr.text || !cr.dest_path || cr.dest_level === undefined || cr.dest_remedies_count === undefined) {
      missingFields++;
    }
  }
}
check('All cross-refs have text, dest_path, dest_level, dest_remedies_count', missingFields === 0, `${missingFields} incomplete`);

// ============================================================
// ISSUE #4: No duplicates
// ============================================================
console.log('\n--- ISSUE #4: No duplicate cross-refs ---');
let dupCount = 0;
for (const [srcId, refs] of Object.entries(xrefs)) {
  const seen = new Set();
  for (const cr of refs) {
    if (seen.has(cr.id)) {
      dupCount++;
      console.log(`    ⚠️ DUP: src=${srcId} → dest=${cr.id}`);
    }
    seen.add(cr.id);
  }
}
check(`No duplicate destination IDs`, dupCount === 0, `${dupCount} duplicates`);

// ============================================================
// ISSUE #5: No empty/invalid references
// ============================================================
console.log('\n--- ISSUE #5: No empty/invalid references ---');
let invalidCount = 0;
for (const refs of Object.values(xrefs)) {
  for (const cr of refs) {
    if (!cr.text || cr.text.trim() === '' || !cr.id || cr.id <= 0) invalidCount++;
  }
}
check('No empty/invalid references', invalidCount === 0, `${invalidCount} invalid`);

// ============================================================
// ISSUE #6: Destination exists in tree
// ============================================================
console.log('\n--- ISSUE #6: All destinations exist in tree ---');
let orphanCount = 0;
for (const refs of Object.values(xrefs)) {
  for (const cr of refs) {
    if (!treeById[cr.id]) {
      orphanCount++;
      console.log(`    ⚠️ ORPHAN: dest=${cr.id} not in tree`);
    }
  }
}
check('All destinations exist in tree', orphanCount === 0, `${orphanCount} orphans`);

// ============================================================
// ISSUE #7: Click simulation — verify fetchRubricDetail would work
// ============================================================
console.log('\n--- ISSUE #7: Click simulation (verify destination loads) ---');
const sampleXref = abandoned[0];
if (sampleXref) {
  console.log(`  Cross-ref: id=${sampleXref.id} text="${sampleXref.text}"`);
  const destNode = treeById[sampleXref.id];
  console.log(`  Destination in tree: ${destNode ? destNode.p : 'NOT FOUND'}`);
  check('Destination rubric exists and has correct path', destNode && destNode.p === sampleXref.text);
  check('Destination has a level', destNode && destNode.l > 0);
  console.log(`  → fetchRubricDetail(${sampleXref.id}) would load: ${destNode?.p}`);
}

// ============================================================
// SUMMARY
// ============================================================
console.log('\n' + '='.repeat(70));
console.log(`SUMMARY: ${pass} passed, ${fail} failed (out of ${pass + fail})`);
if (fail === 0) {
  console.log('🎉 ALL CHECKS PASSED — Cross-reference root cause is FIXED.');
  console.log('');
  console.log('BEFORE: MIND - ABANDONED showed "MIND - ABANDONED" as its own xref');
  console.log('AFTER:  MIND - ABANDONED shows "MIND - FORSAKEN feeling" (clickable)');
} else {
  console.log('⚠️  SOME CHECKS FAILED — Review above.');
}
console.log('='.repeat(70));
