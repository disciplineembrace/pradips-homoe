/**
 * Centralized Repertory Grade Configuration
 * ==========================================
 * Per the master spec:
 * - HIGH grade → RED
 * - LOW grade → GREEN
 * - LOWER grade → BLUE
 * - NORMAL/UNGRADED → BLACK
 *
 * This is a DISPLAY rule only. It does NOT modify source data.
 * Grades must come from source verification, not from this config.
 *
 * Source-specific grade mapping:
 * - Synthesis: Grade 4=HIGH, 3=LOW, 2=LOWER, 1=NORMAL (confirmed from data)
 * - Kent/Phatak/Murphy/Boericke: NO grades in current data (all remedies
 *   are plain strings). Display as NORMAL (BLACK) until source grades
 *   are verified from PDFs.
 *
 * CSS classes are scoped to repertory section only.
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

// ============================================================
// GRADE DISPLAY MAP — centralized, single source of truth
// ============================================================
export const GRADE_DISPLAY_MAP: Record<NormalizedGradeLevel, GradeDisplayConfig> = {
  HIGH: {
    color: '#FFFFFF',
    bg: '#DC2626',    // RED
    border: '#B91C1C',
    label: 'G4',
    cssClass: 'repertory-grade-high',
    weight: 'font-bold',
  },
  LOW: {
    color: '#FFFFFF',
    bg: '#166534',    // GREEN
    border: '#14532D',
    label: 'G3',
    cssClass: 'repertory-grade-low',
    weight: 'font-semibold',
  },
  LOWER: {
    color: '#FFFFFF',
    bg: '#1E40AF',   // BLUE
    border: '#1E3A8A',
    label: 'G2',
    cssClass: 'repertory-grade-lower',
    weight: 'font-medium',
  },
  NORMAL: {
    color: '#FFFFFF',
    bg: '#374151',   // BLACK/DARK GREY
    border: '#1F2937',
    label: 'G1',
    cssClass: 'repertory-grade-normal',
    weight: 'font-normal',
  },
  NOT_SPECIFIED: {
    color: '#FFFFFF',
    bg: '#374151',   // BLACK (same as NORMAL)
    border: '#1F2937',
    label: '—',
    cssClass: 'repertory-grade-normal',
    weight: 'font-normal',
  },
};

// ============================================================
// SOURCE-SPECIFIC GRADE MAPPING
// Maps numeric source grades to normalized levels.
// Each repertory may have different conventions.
// ONLY use mappings confirmed from the source book's own instructions.
// ============================================================
export const SOURCE_GRADE_MAP: Record<string, Record<number, NormalizedGradeLevel>> = {
  // Synthesis Repertory: confirmed from data
  // Grade 4 = highest importance, 3 = high, 2 = moderate, 1 = normal
  'Synthesis': {
    4: 'HIGH',
    3: 'LOW',
    2: 'LOWER',
    1: 'NORMAL',
  },
  // Kent Repertory: NO grades in current data
  // All remedies are plain strings — display as NORMAL until verified
  'Kent': {},
  'Phatak': {},
  'Murphy': {},
  'Boericke': {},
};

// ============================================================
// HELPER: Get display config for a source + grade
// ============================================================
export function getGradeDisplay(
  source: string,
  grade: number | null | undefined
): { level: NormalizedGradeLevel; config: GradeDisplayConfig } {
  if (grade == null) {
    return { level: 'NOT_SPECIFIED', config: GRADE_DISPLAY_MAP.NOT_SPECIFIED };
  }

  const sourceMap = SOURCE_GRADE_MAP[source] || {};
  const level = sourceMap[grade] || 'NORMAL';
  return { level, config: GRADE_DISPLAY_MAP[level] };
}

// ============================================================
// HELPER: Group remedies by grade for display
// Takes plain string[] (no grades) or [remedy, grade][] (with grades)
// Returns Record<number, string[]> for backward compat with existing UI
// ============================================================
export function groupRemediesByGrade(
  remedies: (string | [string, number])[],
  source: string
): { byGrade: Record<number, string[]>; totalRemedies: number } {
  const byGrade: Record<number, string[]> = { 4: [], 3: [], 2: [], 1: [] };

  for (const r of remedies) {
    if (Array.isArray(r)) {
      // [remedy_abbrev, grade] format (Synthesis)
      const [abbrev, grade] = r;
      const g = Math.max(1, Math.min(4, grade));
      if (!byGrade[g]) byGrade[g] = [];
      byGrade[g].push(abbrev);
    } else if (typeof r === 'string') {
      // Plain string (Kent/Phatak/Murphy/Boericke — no grades)
      // Display as grade 1 (NORMAL/BLACK) until source grades are verified
      byGrade[1].push(r);
    }
  }

  const totalRemedies = Object.values(byGrade).reduce((s, arr) => s + arr.length, 0);
  return { byGrade, totalRemedies };
}
