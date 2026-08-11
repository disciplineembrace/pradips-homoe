/// Synthesis section — shared types and localStorage helpers
/// Used for case management and doctor/clinic profile (user-specific, per-browser)

// ============================================================
// TYPES
// ============================================================

export interface DoctorProfile {
  doctorName: string;
  qualification: string;
  clinicName: string;
  clinicAddress: string;
  phone: string;
  email: string;
  registrationNo: string;
  logo: string | null; // base64 data URL
  reportFooter: string;
}

export interface PatientDetails {
  patientName: string;
  caseNo: string;
  age: string;
  sex: 'Male' | 'Female' | 'Other' | '';
  date: string; // ISO date string
  contact: string;
  notes: string;
}

export interface SelectedRubric {
  symptomId: number;
  name: string;
  path: string;
  chapterId: number;
  level: number;
  weight: number;
  enabled: boolean;
  remedyCount: number;
}

export interface RepertorizationResult {
  abbrev: string;
  full: string;
  totalScore: number;
  coverage: string;
  coverageCount: number;
  coverageTotal: number;
  rubrics: { symptomId: number; grade: number; weight: number }[];
}

export interface SavedCase {
  id: string;
  patient: PatientDetails;
  rubrics: SelectedRubric[];
  results: RepertorizationResult[];
  createdAt: string;
  updatedAt: string;
  repertorizedAt: string | null;
}

export interface TreeNode {
  i: number; f: number; n: string; l: number; c: number; p: string;
}

export interface SearchResult {
  id: number; name: string; path: string; level: number; chapterId: number; fatherId: number;
}

export interface Chapter {
  id: number; name: string; path: string;
}

export interface CrossRef {
  id: number; text: string; kind: string; dest_path: string;
  dest_level: number; dest_chapter_id: number; dest_remedies_count: number;
}

// ============================================================
// GRADE COLORS (per spec)
// ============================================================
export const GRADE_COLORS: Record<number, { bg: string; text: string; border: string; label: string }> = {
  4: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-400', label: 'Red' },
  3: { bg: 'bg-green-50', text: 'text-green-800', border: 'border-green-600', label: 'Dark Green' },
  2: { bg: 'bg-blue-50', text: 'text-blue-800', border: 'border-blue-600', label: 'Dark Blue' },
  1: { bg: 'bg-stone-50', text: 'text-stone-600', border: 'border-stone-300', label: 'Normal' },
};

export const PRINT_GRADE_COLORS: Record<number, string> = {
  4: '#DC2626', // Red
  3: '#166534', // Dark Green
  2: '#1E40AF', // Dark Blue
  1: '#44403C', // Normal (stone)
};

// ============================================================
// HELPERS
// ============================================================
export function getRubricId(r: TreeNode | SearchResult): number {
  return (r as any).i || (r as any).id;
}
export function getRubricName(r: TreeNode | SearchResult): string {
  return (r as any).n || (r as any).name;
}
export function getRubricPath(r: TreeNode | SearchResult): string {
  return (r as any).p || (r as any).path;
}
export function getRubricChapterId(r: TreeNode | SearchResult): number {
  return (r as any).c || (r as any).chapterId;
}
export function getRubricLevel(r: TreeNode | SearchResult): number {
  return (r as any).l || (r as any).level;
}

// Generate unique case number
export function generateCaseNo(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `C${y}${m}${d}-${rand}`;
}

// Sanitize filename
export function sanitizeFilename(name: string): string {
  return name.replace(/[^a-zA-Z0-9\-_]/g, '_').substring(0, 50);
}

// ============================================================
// LOCAL STORAGE — DOCTOR PROFILE
// ============================================================
const PROFILE_KEY = 'synthesis_doctor_profile';

export function loadProfile(): DoctorProfile {
  try {
    const raw = localStorage.getItem(PROFILE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return {
    doctorName: '',
    qualification: '',
    clinicName: '',
    clinicAddress: '',
    phone: '',
    email: '',
    registrationNo: '',
    logo: null,
    reportFooter: '',
  };
}

export function saveProfile(profile: DoctorProfile): void {
  localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}

// ============================================================
// LOCAL STORAGE — CASES
// ============================================================
const CASES_KEY = 'synthesis_saved_cases';

export function loadCases(): SavedCase[] {
  try {
    const raw = localStorage.getItem(CASES_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return [];
}

export function saveCase(caseData: SavedCase): void {
  const cases = loadCases();
  const idx = cases.findIndex(c => c.id === caseData.id);
  if (idx >= 0) {
    cases[idx] = { ...caseData, updatedAt: new Date().toISOString() };
  } else {
    cases.unshift(caseData);
  }
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

export function deleteCase(caseId: string): void {
  const cases = loadCases().filter(c => c.id !== caseId);
  localStorage.setItem(CASES_KEY, JSON.stringify(cases));
}

export function loadCaseById(caseId: string): SavedCase | null {
  return loadCases().find(c => c.id === caseId) || null;
}

// ============================================================
// ACTIVE CASE STATE (session-level, in localStorage for persistence)
// ============================================================
const ACTIVE_CASE_KEY = 'synthesis_active_case';

export function loadActiveCase(): { patient: PatientDetails; rubrics: SelectedRubric[]; results: RepertorizationResult[] } | null {
  try {
    const raw = localStorage.getItem(ACTIVE_CASE_KEY);
    if (raw) return JSON.parse(raw);
  } catch {}
  return null;
}

export function saveActiveCase(data: { patient: PatientDetails; rubrics: SelectedRubric[]; results: RepertorizationResult[] }): void {
  localStorage.setItem(ACTIVE_CASE_KEY, JSON.stringify(data));
}

export function clearActiveCase(): void {
  localStorage.removeItem(ACTIVE_CASE_KEY);
}
