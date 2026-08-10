'use client';
/// ============================================================
/// CasePaper — Synthesis Updated clinical workspace
/// Combines:
///   • Page title + gold underline
///   • Hero illustration (compact on mobile)
///   • Case badge (real case ID + rubric count)
///   • Workflow indicator (4 steps: Case Details → Select Rubrics → Results → Report)
///   • Case Details card (Patient Information form, with validation + char counter)
///   • Selected Rubrics card (with case-weight 1-4 buttons, View Remedies, Remove)
///   • Action buttons (Start Repertorization + Save Case)
///   • Reminders card
///
/// All colors follow the strict palette:
///   Primary dark green #0F4A38, Gold #C79A32, Page bg #F8F6EF,
///   Card #FFFFFF, Border #DED8C9, Text #21352E / #748078,
///   Delete #C62828, Success tint #E6F4EC
///
/// No global CSS, no shared-component modifications.
/// No source rubric / remedy / grade data is modified by this UI.
/// ============================================================
import { useState } from 'react';
import {
  PatientDetails, SelectedRubric, RepertorizationResult,
  generateCaseNo,
} from './storage';
import {
  SYNTH_COLORS, PageTitle, CaseBadge, WorkflowIndicator,
  HeroIllustration, RemindersCard, GradeLegend, ClearAllConfirmDialog,
} from './synthesis-ui';
import { Icons } from './components';

interface Props {
  patient: PatientDetails;
  rubrics: SelectedRubric[];
  results: RepertorizationResult[];
  onPatientChange: (p: PatientDetails) => void;
  onRemoveRubric: (id: number) => void;
  onUpdateWeight: (id: number, w: number) => void;
  onToggleRubric: (id: number) => void;
  onRepertorize: () => void;
  onClearAll: () => void;
  onSaveCase: () => void;
  onViewRemedies: (symptomId: number) => void;
  repertorizing: boolean;
  savingCase?: boolean;
  /** rubricRemedyLoading[symptomId] = true while remedy count is being fetched */
  rubricRemedyLoading?: Record<number, boolean>;
  /** rubricRemedyFailed[symptomId] = true if remedy count fetch failed */
  rubricRemedyFailed?: Record<number, boolean>;
}

const NOTES_MAX = 500;

export function CasePaper({
  patient, rubrics, results,
  onPatientChange, onRemoveRubric, onUpdateWeight, onToggleRubric,
  onRepertorize, onClearAll, onSaveCase, onViewRemedies,
  repertorizing, savingCase = false,
  rubricRemedyLoading = {}, rubricRemedyFailed = {},
}: Props) {
  // ============================================================
  // LOCAL STATE — form validation, save-and-continue, clear-all confirm
  // ============================================================
  const [errors, setErrors] = useState<Partial<Record<keyof PatientDetails | 'age', string>>>({});
  const [savingDetails, setSavingDetails] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);

  // Helper to update a single patient field
  function updatePatient<K extends keyof PatientDetails>(key: K, value: PatientDetails[K]) {
    onPatientChange({ ...patient, [key]: value });
    // Clear field-specific error when user edits
    if (errors[key]) {
      setErrors(prev => {
        const next = { ...prev };
        delete next[key];
        return next;
      });
    }
  }

  // ============================================================
  // VALIDATION — required: patientName, caseNo, date. Age must be
  // numeric if entered. Contact must be valid phone/email if entered.
  // ============================================================
  function validate(): boolean {
    const e: Partial<Record<keyof PatientDetails | 'age', string>> = {};
    if (!patient.patientName.trim()) e.patientName = 'Patient name is required.';
    if (!patient.caseNo.trim()) e.caseNo = 'Case number is required.';
    if (!patient.date) e.date = 'Date is required.';
    if (patient.age && !/^\d{1,3}$/.test(patient.age.trim())) {
      e.age = 'Age must be a number (e.g. 35).';
    } else if (patient.age) {
      const ageNum = parseInt(patient.age, 10);
      if (ageNum < 0 || ageNum > 150) e.age = 'Please enter a valid age.';
    }
    if (patient.contact.trim()) {
      const v = patient.contact.trim();
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
      const isPhone = /^[+]?[\d\s\-()]{7,}$/.test(v);
      if (!isEmail && !isPhone) e.contact = 'Enter a valid phone number or email address.';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  // ============================================================
  // SAVE & CONTINUE — validates the patient details form, shows a
  // brief "Saving Case Details..." loading state for UX feedback,
  // then completes. The actual case state is already live in the
  // parent (patient state is updated as the user types). The user
  // advances to "Select Rubrics" via the bottom-nav Chapters/Search
  // buttons or by browsing — the workflow indicator auto-advances
  // based on rubric count.
  // Prevents duplicate submission via local savingDetails flag.
  // ============================================================
  function handleSaveAndContinue() {
    if (savingDetails) return;
    if (!validate()) return;
    setSavingDetails(true);
    setTimeout(() => {
      setSavingDetails(false);
    }, 350);
  }

  // Notes character counter
  const notesLen = patient.notes.length;
  const notesOver = notesLen > NOTES_MAX;

  // Determine current workflow step
  const currentStep: 1 | 2 | 3 | 4 = results.length > 0 ? 3 : rubrics.length > 0 ? 2 : 1;

  const enabledRubrics = rubrics.filter(r => r.enabled);

  return (
    <div className="space-y-4">
      {/* ===== PAGE TITLE + HERO ILLUSTRATION ROW ===== */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <PageTitle />
          <div className="mt-2">
            <CaseBadge caseNo={patient.caseNo} rubricCount={rubrics.length} />
          </div>
        </div>
        <HeroIllustration className="hidden sm:block" />
      </div>

      {/* ===== WORKFLOW INDICATOR ===== */}
      <WorkflowIndicator currentStep={currentStep} />

      {/* ===== CASE DETAILS CARD ===== */}
      <div
        className="rounded-xl bg-white shadow-sm overflow-hidden"
        style={{ border: `1px solid ${SYNTH_COLORS.border}` }}
      >
        {/* Card header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{
            borderColor: SYNTH_COLORS.border,
            backgroundColor: '#FBFAF6',
          }}
        >
          <div>
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: SYNTH_COLORS.primary }}
            >
              Case Details — Patient Information
            </h2>
            <div
              className="mt-1 h-[2px] w-12"
              style={{ backgroundColor: SYNTH_COLORS.gold }}
            />
          </div>
        </div>

        {/* Form body */}
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Patient Name — required */}
            <div className="md:col-span-2">
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: SYNTH_COLORS.text }}
              >
                Patient Name <span style={{ color: SYNTH_COLORS.delete }}>*</span>
              </label>
              <input
                type="text"
                value={patient.patientName}
                onChange={e => updatePatient('patientName', e.target.value)}
                placeholder="Enter patient name"
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
                style={{
                  border: `1px solid ${errors.patientName ? SYNTH_COLORS.delete : SYNTH_COLORS.border}`,
                  backgroundColor: '#FFFFFF',
                  color: SYNTH_COLORS.text,
                }}
              />
              {errors.patientName && (
                <p className="text-xs mt-1" style={{ color: SYNTH_COLORS.delete }}>
                  {errors.patientName}
                </p>
              )}
            </div>

            {/* Case No — required, pre-filled, with regenerate */}
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: SYNTH_COLORS.text }}
              >
                Case No <span style={{ color: SYNTH_COLORS.delete }}>*</span>
              </label>
              <div className="flex gap-1.5">
                <input
                  type="text"
                  value={patient.caseNo}
                  onChange={e => updatePatient('caseNo', e.target.value)}
                  placeholder="Auto-generated"
                  className="flex-1 px-3 py-2.5 rounded-lg text-sm font-mono focus:outline-none transition-colors"
                  style={{
                    border: `1px solid ${errors.caseNo ? SYNTH_COLORS.delete : SYNTH_COLORS.border}`,
                    backgroundColor: '#FFFFFF',
                    color: SYNTH_COLORS.text,
                  }}
                />
                <button
                  type="button"
                  onClick={() => updatePatient('caseNo', generateCaseNo())}
                  className="px-2.5 rounded-lg text-xs font-medium flex items-center justify-center transition-colors"
                  style={{
                    backgroundColor: '#F3F1EA',
                    color: SYNTH_COLORS.primary,
                    border: `1px solid ${SYNTH_COLORS.border}`,
                  }}
                  title="Regenerate case number"
                  aria-label="Regenerate case number"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8" />
                    <path d="M21 3v5h-5" />
                    <path d="M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16" />
                    <path d="M3 21v-5h5" />
                  </svg>
                </button>
              </div>
              {errors.caseNo && (
                <p className="text-xs mt-1" style={{ color: SYNTH_COLORS.delete }}>
                  {errors.caseNo}
                </p>
              )}
            </div>

            {/* Age */}
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: SYNTH_COLORS.text }}
              >
                Age <span style={{ color: SYNTH_COLORS.textSecondary }}>(Years)</span>
              </label>
              <input
                type="text"
                inputMode="numeric"
                value={patient.age}
                onChange={e => updatePatient('age', e.target.value)}
                placeholder="e.g. 35"
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
                style={{
                  border: `1px solid ${errors.age ? SYNTH_COLORS.delete : SYNTH_COLORS.border}`,
                  backgroundColor: '#FFFFFF',
                  color: SYNTH_COLORS.text,
                }}
              />
              {errors.age && (
                <p className="text-xs mt-1" style={{ color: SYNTH_COLORS.delete }}>
                  {errors.age}
                </p>
              )}
            </div>

            {/* Sex — segmented control */}
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: SYNTH_COLORS.text }}
              >
                Sex
              </label>
              <div className="flex gap-1.5">
                {(['Male', 'Female', 'Other'] as const).map(s => {
                  const selected = patient.sex === s;
                  return (
                    <button
                      key={s}
                      type="button"
                      onClick={() => updatePatient('sex', s)}
                      className="flex-1 px-3 py-2.5 text-xs font-medium rounded-lg transition-all"
                      style={
                        selected
                          ? { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF', border: `1px solid ${SYNTH_COLORS.primary}` }
                          : { backgroundColor: '#FFFFFF', color: SYNTH_COLORS.text, border: `1px solid ${SYNTH_COLORS.border}` }
                      }
                    >
                      {s}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Date — required */}
            <div>
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: SYNTH_COLORS.text }}
              >
                Date <span style={{ color: SYNTH_COLORS.delete }}>*</span>
              </label>
              <div className="relative">
                <input
                  type="date"
                  value={patient.date}
                  onChange={e => updatePatient('date', e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
                  style={{
                    border: `1px solid ${errors.date ? SYNTH_COLORS.delete : SYNTH_COLORS.border}`,
                    backgroundColor: '#FFFFFF',
                    color: SYNTH_COLORS.text,
                  }}
                />
              </div>
              {errors.date && (
                <p className="text-xs mt-1" style={{ color: SYNTH_COLORS.delete }}>
                  {errors.date}
                </p>
              )}
            </div>

            {/* Contact — optional */}
            <div className="md:col-span-2">
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: SYNTH_COLORS.text }}
              >
                Contact <span style={{ color: SYNTH_COLORS.textSecondary }}>(Optional)</span>
              </label>
              <input
                type="text"
                value={patient.contact}
                onChange={e => updatePatient('contact', e.target.value)}
                placeholder="Phone number or email address"
                className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors"
                style={{
                  border: `1px solid ${errors.contact ? SYNTH_COLORS.delete : SYNTH_COLORS.border}`,
                  backgroundColor: '#FFFFFF',
                  color: SYNTH_COLORS.text,
                }}
              />
              {errors.contact && (
                <p className="text-xs mt-1" style={{ color: SYNTH_COLORS.delete }}>
                  {errors.contact}
                </p>
              )}
            </div>

            {/* Notes — optional, with char counter */}
            <div className="md:col-span-2">
              <label
                className="block text-xs font-semibold mb-1"
                style={{ color: SYNTH_COLORS.text }}
              >
                Notes <span style={{ color: SYNTH_COLORS.textSecondary }}>(Optional)</span>
              </label>
              <div className="relative">
                <textarea
                  value={patient.notes}
                  onChange={e => {
                    const v = e.target.value.slice(0, NOTES_MAX);
                    updatePatient('notes', v);
                  }}
                  placeholder="Enter case notes, presenting complaints, history, etc."
                  rows={3}
                  className="w-full px-3 py-2.5 rounded-lg text-sm focus:outline-none transition-colors resize-y"
                  style={{
                    border: `1px solid ${SYNTH_COLORS.border}`,
                    backgroundColor: '#FFFFFF',
                    color: SYNTH_COLORS.text,
                  }}
                />
                <div
                  className="text-right text-[0.65rem] mt-1 font-mono"
                  style={{
                    color: notesOver ? SYNTH_COLORS.delete : SYNTH_COLORS.textSecondary,
                  }}
                >
                  {notesLen}/{NOTES_MAX}
                </div>
              </div>
            </div>
          </div>

          {/* Action buttons: Cancel + Save & Continue */}
          <div className="flex gap-2 mt-4">
            <button
              type="button"
              onClick={() => {
                // Cancel — clear validation errors, keep entered data
                setErrors({});
              }}
              disabled={savingDetails}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-50"
              style={{
                backgroundColor: '#FFFFFF',
                color: SYNTH_COLORS.primary,
                border: `1.5px solid ${SYNTH_COLORS.primary}`,
              }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="button"
              onClick={handleSaveAndContinue}
              disabled={savingDetails}
              className="flex-1 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all flex items-center justify-center gap-1.5 disabled:opacity-60"
              style={{
                backgroundColor: SYNTH_COLORS.primary,
                color: '#FFFFFF',
                border: `1.5px solid ${SYNTH_COLORS.primary}`,
              }}
            >
              {savingDetails ? (
                <>
                  <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  <span>Saving Case Details...</span>
                </>
              ) : (
                <>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                    <polyline points="17 21 17 13 7 13 7 21" />
                    <polyline points="7 3 7 8 15 8" />
                  </svg>
                  <span>Save &amp; Continue</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* ===== SELECTED RUBRICS CARD ===== */}
      <div
        className="rounded-xl bg-white shadow-sm overflow-hidden"
        style={{ border: `1px solid ${SYNTH_COLORS.border}` }}
      >
        {/* Card header */}
        <div
          className="px-4 py-3 border-b flex items-center justify-between"
          style={{
            borderColor: SYNTH_COLORS.border,
            backgroundColor: '#FBFAF6',
          }}
        >
          <div>
            <h2
              className="text-sm font-bold uppercase tracking-wider"
              style={{ color: SYNTH_COLORS.primary }}
            >
              Selected Rubrics ({rubrics.length})
            </h2>
            <div
              className="mt-1 h-[2px] w-12"
              style={{ backgroundColor: SYNTH_COLORS.gold }}
            />
          </div>
          {rubrics.length > 0 && (
            <button
              type="button"
              onClick={() => setShowClearConfirm(true)}
              className="flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors"
              style={{
                color: SYNTH_COLORS.delete,
                border: `1px solid ${SYNTH_COLORS.delete}`,
                backgroundColor: '#FFFFFF',
              }}
            >
              <Icons.Trash size={12} className="text-[#C62828]" />
              Clear All
            </button>
          )}
        </div>

        {/* Rubric list */}
        <div className="p-3">
          {rubrics.length === 0 ? (
            <div
              className="text-center py-8 px-4 rounded-lg"
              style={{ backgroundColor: '#FBFAF6' }}
            >
              <div
                className="w-12 h-12 mx-auto rounded-full flex items-center justify-center mb-3"
                style={{ backgroundColor: SYNTH_COLORS.success }}
              >
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke={SYNTH_COLORS.primary} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
                  <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
                </svg>
              </div>
              <p className="text-sm font-medium mb-1" style={{ color: SYNTH_COLORS.text }}>
                No rubrics selected yet
              </p>
              <p className="text-xs" style={{ color: SYNTH_COLORS.textSecondary }}>
                Browse chapters or search to add rubrics to this case.
              </p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {rubrics.map((sr, idx) => {
                const isLoadingCount = !!rubricRemedyLoading[sr.symptomId];
                const failedCount = !!rubricRemedyFailed[sr.symptomId];
                return (
                  <div
                    key={sr.symptomId}
                    className="rounded-lg border p-3 transition-all"
                    style={{
                      borderColor: sr.enabled ? SYNTH_COLORS.border : '#E8E2D2',
                      backgroundColor: sr.enabled ? '#FFFFFF' : '#F8F6EF',
                      opacity: sr.enabled ? 1 : 0.65,
                    }}
                  >
                    {/* Top row: number + path + trash */}
                    <div className="flex items-start gap-2.5">
                      {/* Sequence number */}
                      <div
                        className="flex-shrink-0 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                        style={{
                          backgroundColor: SYNTH_COLORS.primary,
                          color: '#FFFFFF',
                        }}
                      >
                        {idx + 1}
                      </div>
                      {/* Rubric path + remedy count */}
                      <div className="flex-1 min-w-0">
                        <div
                          className="text-sm font-bold uppercase leading-snug break-words"
                          style={{ color: SYNTH_COLORS.text }}
                        >
                          {sr.path}
                        </div>
                        <div
                          className="text-xs mt-0.5"
                          style={{ color: SYNTH_COLORS.textSecondary }}
                        >
                          {isLoadingCount ? (
                            <span className="italic">Loading remedy count...</span>
                          ) : failedCount ? (
                            <span className="italic" style={{ color: SYNTH_COLORS.delete }}>
                              Remedy count unavailable
                            </span>
                          ) : (
                            <span>
                              <span className="font-semibold" style={{ color: SYNTH_COLORS.primary }}>
                                {sr.remedyCount}
                              </span>{' '}
                              {sr.remedyCount === 1 ? 'remedy' : 'remedies'}
                            </span>
                          )}
                        </div>
                      </div>
                      {/* Remove (trash) icon */}
                      <button
                        type="button"
                        onClick={() => onRemoveRubric(sr.symptomId)}
                        className="flex-shrink-0 p-1.5 rounded-md transition-colors"
                        style={{ color: SYNTH_COLORS.delete }}
                        aria-label={`Remove rubric ${sr.name}`}
                        title="Remove rubric"
                      >
                        <Icons.Trash size={16} className="text-[#C62828]" />
                      </button>
                    </div>

                    {/* Case Weight row */}
                    <div className="mt-2.5 flex items-center gap-2 flex-wrap">
                      <span
                        className="text-xs font-semibold"
                        style={{ color: SYNTH_COLORS.text }}
                      >
                        Case Weight:
                      </span>
                      <div className="flex gap-1">
                        {[1, 2, 3, 4].map(w => {
                          const selected = sr.weight === w;
                          return (
                            <button
                              key={w}
                              type="button"
                              onClick={() => onUpdateWeight(sr.symptomId, w)}
                              className="w-8 h-8 rounded-md text-xs font-bold transition-all"
                              style={
                                selected
                                  ? {
                                      backgroundColor: SYNTH_COLORS.primary,
                                      color: '#FFFFFF',
                                      border: `1.5px solid ${SYNTH_COLORS.primary}`,
                                    }
                                  : {
                                      backgroundColor: '#FFFFFF',
                                      color: SYNTH_COLORS.primary,
                                      border: `1.5px solid ${SYNTH_COLORS.primary}`,
                                    }
                              }
                              aria-label={`Set case weight ${w}`}
                              aria-pressed={selected}
                            >
                              {w}
                            </button>
                          );
                        })}
                      </div>
                      {/* Enable/disable toggle — small, low emphasis */}
                      <button
                        type="button"
                        onClick={() => onToggleRubric(sr.symptomId)}
                        className="ml-auto text-[0.65rem] px-2 py-1 rounded font-medium transition-colors"
                        style={{
                          color: sr.enabled ? SYNTH_COLORS.primary : SYNTH_COLORS.textSecondary,
                          backgroundColor: sr.enabled ? SYNTH_COLORS.success : '#F3F1EA',
                        }}
                        title={sr.enabled ? 'Included in repertorization' : 'Excluded from repertorization'}
                      >
                        {sr.enabled ? 'Included' : 'Excluded'}
                      </button>
                    </div>

                    {/* View Remedies button */}
                    <button
                      type="button"
                      onClick={() => onViewRemedies(sr.symptomId)}
                      className="mt-2.5 w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all"
                      style={{
                        backgroundColor: '#FFFFFF',
                        color: SYNTH_COLORS.primary,
                        border: `1px solid ${SYNTH_COLORS.primary}`,
                      }}
                    >
                      <Icons.Eye size={14} className="text-[#0F4A38]" />
                      View Remedies
                    </button>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* ===== ACTION BUTTONS: Start Repertorization + Save Case ===== */}
      {rubrics.length > 0 && (
        <div className="space-y-2">
          <button
            type="button"
            onClick={onRepertorize}
            disabled={repertorizing || savingCase || enabledRubrics.length === 0}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm font-bold uppercase tracking-wider transition-all disabled:opacity-60 disabled:cursor-not-allowed"
            style={{
              backgroundColor: SYNTH_COLORS.primary,
              color: '#FFFFFF',
              border: `1.5px solid ${SYNTH_COLORS.primary}`,
            }}
          >
            {repertorizing ? (
              <>
                <span className="inline-block w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Calculating Verified Results...</span>
              </>
            ) : (
              <>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <polygon points="5 3 19 12 5 21 5 3" />
                </svg>
                <span>Start Repertorization</span>
              </>
            )}
          </button>
          <button
            type="button"
            onClick={onSaveCase}
            disabled={repertorizing || savingCase}
            className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-all disabled:opacity-60"
            style={{
              backgroundColor: '#FFFFFF',
              color: SYNTH_COLORS.primary,
              border: `1.5px solid ${SYNTH_COLORS.primary}`,
            }}
          >
            {savingCase ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-[#0F4A38]/30 border-t-[#0F4A38] rounded-full animate-spin" />
                <span>Saving Case...</span>
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z" />
                  <polyline points="17 21 17 13 7 13 7 21" />
                  <polyline points="7 3 7 8 15 8" />
                </svg>
                <span>Save Case</span>
              </>
            )}
          </button>
        </div>
      )}

      {/* ===== REMINDERS CARD ===== */}
      <RemindersCard />

      {/* ===== CLEAR-ALL CONFIRM DIALOG ===== */}
      <ClearAllConfirmDialog
        open={showClearConfirm}
        rubricCount={rubrics.length}
        onCancel={() => setShowClearConfirm(false)}
        onConfirm={() => {
          setShowClearConfirm(false);
          onClearAll();
        }}
      />
    </div>
  );
}
