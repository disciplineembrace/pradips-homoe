/**
 * Centralized Repertory Grade Configuration
 * ==========================================
 * Per the master spec:
 * - HIGH grade → RED
 * - LOW grade → GREEN
 * - LOWER grade → BLUE
 * - NORMAL/UNGRADED → BLACK
 *
 * Source-specific grade mapping (VERIFIED):
 * - Kent: Bold=3(HIGH), Italic=2(LOW), Roman=1(NORMAL) — from PDF typography
 * - Synthesis: 4=HIGH, 3=LOW, 2=LOWER, 1=NORMAL — from data
 * - Phatak/Murphy/Boericke: not yet verified — display as NORMAL (BLACK)
 */

export type NormalizedGradeLevel = 'HIGH' | 'LOW' | 'LOWER' | 'NORMAL' | 'NOT_SPECIFIED';

export interface GradeDisplayConfig {
  color: string;
  bg: string;
  border: string;
  label: string;
  cssClass: string;
  weight: string;
}

export const GRADE_DISPLAY_MAP: Record<NormalizedGradeLevel, GradeDisplayConfig> = {
  HIGH: { color: '#FFFFFF', bg: '#DC2626', border: '#B91C1C', label: 'G4', cssClass: 'repertory-grade-high', weight: 'font-bold' },
  LOW: { color: '#FFFFFF', bg: '#166534', border: '#14532D', label: 'G3', cssClass: 'repertory-grade-low', weight: 'font-semibold' },
  LOWER: { color: '#FFFFFF', bg: '#1E40AF', border: '#1E3A8A', label: 'G2', cssClass: 'repertory-grade-lower', weight: 'font-medium' },
  NORMAL: { color: '#FFFFFF', bg: '#374151', border: '#1F2937', label: 'G1', cssClass: 'repertory-grade-normal', weight: 'font-normal' },
  NOT_SPECIFIED: { color: '#FFFFFF', bg: '#374151', border: '#1F2937', label: '—', cssClass: 'repertory-grade-normal', weight: 'font-normal' },
};

export const SOURCE_GRADE_MAP: Record<string, Record<number, NormalizedGradeLevel>> = {
  'Kent': { 3: 'HIGH', 2: 'LOW', 1: 'NORMAL' },
  'Synthesis': { 4: 'HIGH', 3: 'LOW', 2: 'LOWER', 1: 'NORMAL' },
  'Phatak': {},
  'Murphy': {},
  'Boericke': {},
};

export function getGradeDisplay(source: string, grade: number | null | undefined) {
  if (grade == null) return { level: 'NOT_SPECIFIED' as NormalizedGradeLevel, config: GRADE_DISPLAY_MAP.NOT_SPECIFIED };
  const sourceMap = SOURCE_GRADE_MAP[source] || {};
  const level = sourceMap[grade] || 'NORMAL';
  return { level, config: GRADE_DISPLAY_MAP[level] };
}

export function groupRemediesByGrade(remedies: any[], source: string) {
  const byGrade: Record<number, string[]> = { 4: [], 3: [], 2: [], 1: [] };
  for (const r of remedies) {
    if (Array.isArray(r)) {
      const [abbrev, grade] = r;
      const g = Math.max(1, Math.min(4, grade));
      if (!byGrade[g]) byGrade[g] = [];
      byGrade[g].push(abbrev);
    } else if (typeof r === 'string') {
      byGrade[1].push(r);
    }
  }
  const totalRemedies = Object.values(byGrade).reduce((s, arr) => s + arr.length, 0);
  return { byGrade, totalRemedies };
}
