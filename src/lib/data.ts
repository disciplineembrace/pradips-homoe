/**
 * Data loader — caches JSON files in memory after first load.
 * Files live in /home/z/my-project/data (NOT /public) so they are not downloadable.
 */
import fs from 'fs/promises';
import path from 'path';

const DATA_DIR = path.join(process.cwd(), '..', 'data');
// Fallback for production where cwd might be different
const DATA_DIR_ALT = '/home/z/my-project/data';

let _remedies: any[] | null = null;
let _rubrics: any[] | null = null;
let _therapeutics: any = null;
let _predictive: any = null;
let _synthesis: any = null;

async function readJson(p: string): Promise<any> {
  try {
    const buf = await fs.readFile(p);
    return JSON.parse(buf.toString('utf-8'));
  } catch (e1: any) {
    if (e1.code === 'ENOENT' && p !== DATA_DIR_ALT) {
      // Try alt path
      const altP = path.join(DATA_DIR_ALT, path.basename(p));
      const buf = await fs.readFile(altP);
      return JSON.parse(buf.toString('utf-8'));
    }
    throw e1;
  }
}

export async function getRemedies(): Promise<any[]> {
  if (_remedies) return _remedies;
  _remedies = await readJson(path.join(DATA_DIR, 'remedies.json'));
  return _remedies!;
}

export async function getRubrics(): Promise<any[]> {
  if (_rubrics) return _rubrics;
  _rubrics = await readJson(path.join(DATA_DIR, 'rubrics.json'));
  return _rubrics!;
}

export async function getTherapeutics(): Promise<any> {
  if (_therapeutics) return _therapeutics;
  _therapeutics = await readJson(path.join(DATA_DIR, 'therapeutics.json'));
  return _therapeutics;
}

export async function getPredictive(): Promise<any> {
  if (_predictive) return _predictive;
  _predictive = await readJson(path.join(DATA_DIR, 'predictive_chapters.json'));
  return _predictive;
}

export async function getSynthesis(): Promise<any> {
  if (_synthesis) return _synthesis;
  _synthesis = await readJson(path.join(DATA_DIR, 'synthesis_rubrics.json'));
  return _synthesis;
}

// Lightweight search index — built lazily
let _searchIndex: { type: 'remedy' | 'rubric'; id: string; name: string; author: string; text: string }[] | null = null;
export async function getSearchIndex() {
  if (_searchIndex) return _searchIndex;
  const [remedies, rubrics] = await Promise.all([getRemedies(), getRubrics()]);
  _searchIndex = [];
  for (const r of remedies) {
    _searchIndex.push({
      type: 'remedy',
      id: r.id,
      name: r.name,
      author: r.author || '',
      text: (r.name + ' ' + (r.common || '') + ' ' + (r.keynote || '') + ' ' + (r.full || '')).toLowerCase(),
    });
  }
  for (const r of rubrics) {
    _searchIndex.push({
      type: 'rubric',
      id: r.id,
      name: r.title,
      author: r.author || '',
      text: (r.title + ' ' + (r.path || '') + ' ' + ((r.remedies || []).join(' '))).toLowerCase(),
    });
  }
  return _searchIndex;
}
