'use client';
/// ============================================================
/// SYNTHESIS UI — Design system components for the
/// Synthesis Updated section redesign.
/// All colors follow the strict palette:
///   Primary dark green : #124C3B
///   Dark green hover   : #0B392D
///   Gold accent        : #C79A32
///   Page background    : #F8F6EF
///   Card               : #FFFFFF
///   Border             : #DEDACF
///   Main text          : #243A32
///   Secondary text     : #748078
///   Delete             : #C83B3B
///   Success tint       : #EAF4EF
/// No global CSS, no shared-component modifications.
/// ============================================================
import React from 'react';
import { Icons } from './components';

// ============================================================
// COLOR TOKENS — single source of truth for the redesign
// ============================================================
export const SYNTH_COLORS = {
  primary: '#124C3B',
  primaryHover: '#0B392D',
  gold: '#C79A32',
  bg: '#F8F6EF',
  card: '#FFFFFF',
  border: '#DEDACF',
  text: '#243A32',
  textSecondary: '#748078',
  delete: '#C83B3B',
  success: '#EAF4EF',
} as const;

// ============================================================
// PAGE TITLE — "SYNTHESIS REPERTORY" + gold underline
// Used on Case Details, Select Rubrics, Results, Report screens.
// ============================================================
export function PageTitle({
  compact = false,
}: {
  compact?: boolean;
}) {
  return (
    <div className={compact ? 'mb-3' : 'mb-4'}>
      <h1
        className="font-serif font-bold uppercase tracking-wide text-[#124C3B]"
        style={{ fontSize: compact ? '1.25rem' : '1.5rem', lineHeight: 1.2 }}
      >
        Synthesis Repertory
      </h1>
      <div className="flex items-center gap-2 mt-1">
        <span
          className="block h-[2px] w-10"
          style={{ backgroundColor: SYNTH_COLORS.gold }}
        />
        <p
          className="uppercase tracking-[0.18em] text-[0.65rem] font-medium"
          style={{ color: SYNTH_COLORS.textSecondary }}
        >
          Updated Version by Dr. Pradip
        </p>
      </div>
    </div>
  );
}

// ============================================================
// CASE BADGE — light-green pill showing real case ID + rubric count
// ============================================================
export function CaseBadge({
  caseNo,
  rubricCount,
}: {
  caseNo: string;
  rubricCount: number;
}) {
  return (
    <div
      className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold"
      style={{
        backgroundColor: SYNTH_COLORS.success,
        color: SYNTH_COLORS.primary,
        border: '1px solid rgba(15, 74, 56, 0.15)',
      }}
    >
      <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <rect width="18" height="18" x="3" y="4" rx="2" />
        <path d="M16 2v4M8 2v4M3 10h18" />
      </svg>
      <span>
        Case {caseNo || '—'} · {rubricCount} {rubricCount === 1 ? 'Rubric' : 'Rubrics'}
      </span>
    </div>
  );
}

// ============================================================
// WORKFLOW INDICATOR — 4-step clinical workflow
// Steps: 1) Case Details  2) Select Rubrics  3) Results  4) Report
// States: completed (check, green) | active (solid green + gold ring)
//       | pending (gray outline)
// Connectors: dashed gray between pending, solid green when completed→next
// ============================================================
const WORKFLOW_STEPS_CLINICAL = [
  { num: 1, label: 'Case Details' },
  { num: 2, label: 'Select Rubrics' },
  { num: 3, label: 'Results' },
  { num: 4, label: 'Report' },
];

export function WorkflowIndicator({ currentStep }: { currentStep: 1 | 2 | 3 | 4 }) {
  return (
    <div
      className="rounded-xl border bg-white p-3 mb-4"
      style={{ borderColor: SYNTH_COLORS.border }}
    >
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {WORKFLOW_STEPS_CLINICAL.map((step, idx) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;
          return (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0 min-w-[60px]">
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all"
                  style={
                    isCompleted
                      ? { backgroundColor: SYNTH_COLORS.primary, color: '#FFFFFF' }
                      : isActive
                        ? {
                            backgroundColor: SYNTH_COLORS.primary,
                            color: '#FFFFFF',
                            boxShadow: `0 0 0 2px ${SYNTH_COLORS.gold}, 0 0 0 4px #FFFFFF`,
                          }
                        : {
                            backgroundColor: '#F3F1EA',
                            color: SYNTH_COLORS.textSecondary,
                            border: `1px solid ${SYNTH_COLORS.border}`,
                          }
                  }
                >
                  {isCompleted ? (
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="20 6 9 17 4 12" />
                    </svg>
                  ) : (
                    step.num
                  )}
                </div>
                <span
                  className="text-[0.65rem] font-medium whitespace-nowrap"
                  style={{
                    color: isActive
                      ? SYNTH_COLORS.primary
                      : isCompleted
                        ? SYNTH_COLORS.primary
                        : SYNTH_COLORS.textSecondary,
                  }}
                >
                  {step.label}
                </span>
              </div>
              {idx < WORKFLOW_STEPS_CLINICAL.length - 1 && (
                <div
                  className="flex-1 h-[1.5px] min-w-[14px] border-t border-dashed"
                  style={{
                    borderColor: isCompleted ? SYNTH_COLORS.primary : SYNTH_COLORS.border,
                    borderTopStyle: isCompleted ? 'solid' : 'dashed',
                    backgroundColor: isCompleted ? SYNTH_COLORS.primary : 'transparent',
                    opacity: isCompleted ? 1 : 0.6,
                  }}
                />
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// HERO ILLUSTRATION — mortar & pestle + green leaves +
// amber homeopathic bottle + white globules.
// Pure SVG, no external images. Compact on mobile (h-24),
// larger on md+ screens (h-36).
// ============================================================
export function HeroIllustration({ className = '' }: { className?: string }) {
  return (
    <div
      className={`flex-shrink-0 ${className}`}
      aria-hidden="true"
      style={{
        width: 'clamp(96px, 28vw, 160px)',
        height: 'clamp(96px, 28vw, 160px)',
      }}
    >
      <svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* Soft ivory backdrop circle */}
        <circle cx="100" cy="100" r="92" fill="#F8F6EF" />
        <circle cx="100" cy="100" r="92" fill="none" stroke="#DEDACF" strokeWidth="1" strokeDasharray="2 3" opacity="0.6" />

        {/* Decorative green leaves — left side */}
        <g transform="translate(28, 70)">
          <path
            d="M 0 30 C 5 5, 25 -5, 38 0 C 32 25, 18 35, 0 30 Z"
            fill="#1B6B4F"
            opacity="0.85"
          />
          <path
            d="M 8 25 C 12 12, 22 8, 30 12"
            stroke="#124C3B"
            strokeWidth="1.2"
            fill="none"
            opacity="0.6"
          />
        </g>
        {/* Second leaf — top right */}
        <g transform="translate(140, 32) rotate(35)">
          <path
            d="M 0 25 C 4 4, 22 -3, 32 2 C 27 22, 14 30, 0 25 Z"
            fill="#2A8F6A"
            opacity="0.8"
          />
        </g>

        {/* White marble mortar (bowl) */}
        <g transform="translate(100, 125)">
          {/* Mortar bowl — outer */}
          <path
            d="M -42 0 Q -42 35, 0 38 Q 42 35, 42 0 Z"
            fill="#FFFFFF"
            stroke="#B8B0A0"
            strokeWidth="1.5"
          />
          {/* Mortar bowl — inner shadow */}
          <ellipse cx="0" cy="0" rx="42" ry="6" fill="#EAE5D5" />
          <ellipse cx="0" cy="-1" rx="36" ry="3.5" fill="#F8F6EF" />
          {/* Marble veins */}
          <path d="M -28 8 Q -18 14, -8 10" stroke="#D8D2C0" strokeWidth="0.8" fill="none" opacity="0.7" />
          <path d="M 12 6 Q 22 12, 32 8" stroke="#D8D2C0" strokeWidth="0.8" fill="none" opacity="0.7" />

          {/* Pestle — diagonal across mortar */}
          <g transform="rotate(-25)">
            <rect x="-3" y="-58" width="6" height="55" rx="3" fill="#FFFFFF" stroke="#B8B0A0" strokeWidth="1.2" />
            <ellipse cx="0" cy="-58" rx="7" ry="6" fill="#FFFFFF" stroke="#B8B0A0" strokeWidth="1.2" />
            <ellipse cx="0" cy="0" rx="3" ry="2" fill="#EAE5D5" />
          </g>
        </g>

        {/* Amber homeopathic bottle — right side */}
        <g transform="translate(155, 110)">
          {/* Bottle body */}
          <rect x="-12" y="-5" width="24" height="38" rx="4" fill="#D49A3E" opacity="0.88" />
          <rect x="-12" y="-5" width="24" height="38" rx="4" fill="none" stroke="#A57220" strokeWidth="1" />
          {/* Bottle neck */}
          <rect x="-5" y="-15" width="10" height="12" fill="#D49A3E" opacity="0.88" />
          <rect x="-5" y="-15" width="10" height="12" fill="none" stroke="#A57220" strokeWidth="1" />
          {/* Cap */}
          <rect x="-6" y="-19" width="12" height="5" rx="1" fill="#124C3B" />
          {/* Highlight */}
          <rect x="-9" y="0" width="2" height="28" rx="1" fill="#F4D58A" opacity="0.6" />
          {/* Label */}
          <rect x="-9" y="8" width="18" height="14" rx="1" fill="#F8F6EF" opacity="0.9" />
          <line x1="-6" y1="13" x2="6" y2="13" stroke="#124C3B" strokeWidth="0.8" />
          <line x1="-6" y1="16" x2="3" y2="16" stroke="#124C3B" strokeWidth="0.6" />
        </g>

        {/* White globules — scattered near bottom right */}
        <g transform="translate(150, 165)">
          <circle cx="0" cy="0" r="3" fill="#FFFFFF" stroke="#B8B0A0" strokeWidth="0.6" />
          <circle cx="6" cy="-3" r="2.5" fill="#FFFFFF" stroke="#B8B0A0" strokeWidth="0.6" />
          <circle cx="-5" cy="-2" r="2.5" fill="#FFFFFF" stroke="#B8B0A0" strokeWidth="0.6" />
          <circle cx="3" cy="3" r="2" fill="#FFFFFF" stroke="#B8B0A0" strokeWidth="0.6" />
          <circle cx="-3" cy="4" r="2" fill="#FFFFFF" stroke="#B8B0A0" strokeWidth="0.6" />
        </g>
      </svg>
    </div>
  );
}

// ============================================================
// REMINDERS CARD — clinical tip with botanical leaf
// ============================================================
export function RemindersCard({
  message = 'Adjust case weight carefully. Higher weight gives more importance to a rubric during repertorization.',
}: {
  message?: string;
}) {
  return (
    <div
      className="rounded-xl border p-3 mt-4 flex items-start gap-3"
      style={{
        backgroundColor: SYNTH_COLORS.success,
        borderColor: 'rgba(15, 74, 56, 0.18)',
      }}
    >
      {/* Bell icon */}
      <div
        className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
        style={{ backgroundColor: SYNTH_COLORS.primary }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
          <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
        </svg>
      </div>
      <div className="flex-1 min-w-0">
        <div
          className="text-[0.65rem] font-bold uppercase tracking-wider mb-1"
          style={{ color: SYNTH_COLORS.primary }}
        >
          Reminders
        </div>
        <p className="text-xs leading-relaxed" style={{ color: SYNTH_COLORS.text }}>
          {message}
        </p>
      </div>
      {/* Small leaf accent */}
      <svg
        width="20"
        height="20"
        viewBox="0 0 24 24"
        className="flex-shrink-0 opacity-70"
        fill="#1B6B4F"
      >
        <path d="M12 22c0-6 4-10 10-10-0 6-4 10-10 10zM12 22c0-6-4-10-10-10 0 6 4 10 10 10z" />
      </svg>
    </div>
  );
}

// ============================================================
// GRADE LEGEND — Grade 4/3/2/1 with color dots
// Uses the same colors as the actual source grading.
// ============================================================
export function GradeLegend() {
  const grades = [
    { grade: 4, label: 'Grade 4', color: '#DC2626' },
    { grade: 3, label: 'Grade 3', color: '#166534' },
    { grade: 2, label: 'Grade 2', color: '#1E40AF' },
    { grade: 1, label: 'Grade 1', color: '#748078' },
  ];
  return (
    <div
      className="rounded-lg border px-3 py-2 flex items-center gap-3 flex-wrap text-xs"
      style={{
        backgroundColor: '#FBFAF6',
        borderColor: SYNTH_COLORS.border,
      }}
    >
      <span
        className="font-bold uppercase tracking-wider"
        style={{ color: SYNTH_COLORS.textSecondary }}
      >
        Legend:
      </span>
      {grades.map(g => (
        <span key={g.grade} className="flex items-center gap-1.5">
          <span
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: g.color }}
          />
          <span style={{ color: SYNTH_COLORS.text }}>{g.label}</span>
        </span>
      ))}
    </div>
  );
}

// ============================================================
// REMEDY RESULT CARD — single ranked remedy in the results list
// Shows: rank badge (gold tint for #1, light grey for #2-3,
// plain white for #4+), abbreviation, full name, score, coverage,
// rubrics count, and a chevron indicating tap-to-detail.
// ============================================================
export function RemedyResultCard({
  rank,
  abbrev,
  full,
  score,
  coverageCount,
  coverageTotal,
  coverageLabel,
  rubricCount,
  onClick,
}: {
  rank: number;
  abbrev: string;
  full: string;
  score: number;
  coverageCount: number;
  coverageTotal: number;
  coverageLabel: string;
  rubricCount: number;
  onClick?: () => void;
}) {
  // Rank badge styling — gold tint for #1, light grey for #2-3, plain for #4+
  const rankBadgeStyle: React.CSSProperties =
    rank === 1
      ? { backgroundColor: '#F5E2A8', color: '#7A5A12', border: '1px solid #C79A32' }
      : rank === 2
        ? { backgroundColor: '#EDEAE0', color: '#5A5246', border: '1px solid #C8C2B0' }
        : rank === 3
          ? { backgroundColor: '#F0E9DC', color: '#5A5246', border: '1px solid #C8C2B0' }
          : { backgroundColor: '#FFFFFF', color: SYNTH_COLORS.textSecondary, border: `1px solid ${SYNTH_COLORS.border}` };

  const isFullCoverage = coverageCount === coverageTotal && coverageTotal > 0;

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={!onClick}
      className="w-full text-left rounded-xl border bg-white p-3 flex items-center gap-3 transition-all hover:shadow-md disabled:cursor-default"
      style={{ borderColor: SYNTH_COLORS.border }}
    >
      {/* Rank badge */}
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0"
        style={rankBadgeStyle}
      >
        #{rank}
      </div>

      {/* Remedy info */}
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline gap-2">
          <span
            className="font-mono font-bold text-base"
            style={{ color: SYNTH_COLORS.primary }}
          >
            {abbrev}
          </span>
          <span
            className="text-xs italic truncate"
            style={{ color: SYNTH_COLORS.textSecondary }}
          >
            {full}
          </span>
        </div>
        {/* Metrics row */}
        <div className="flex items-center gap-3 mt-1.5 text-[0.7rem]">
          <span className="flex items-center gap-1" style={{ color: SYNTH_COLORS.textSecondary }}>
            <span className="font-semibold" style={{ color: SYNTH_COLORS.text }}>Score:</span>
            <span className="font-bold" style={{ color: SYNTH_COLORS.primary }}>{score}</span>
          </span>
          <span
            className="px-1.5 py-0.5 rounded font-semibold"
            style={{
              backgroundColor: isFullCoverage ? SYNTH_COLORS.success : '#F3F1EA',
              color: isFullCoverage ? SYNTH_COLORS.primary : SYNTH_COLORS.textSecondary,
            }}
          >
            Coverage: {coverageLabel}
          </span>
          <span className="flex items-center gap-1" style={{ color: SYNTH_COLORS.textSecondary }}>
            <span className="font-semibold" style={{ color: SYNTH_COLORS.text }}>Rubrics:</span>
            <span>{rubricCount}</span>
          </span>
        </div>
      </div>

      {/* Chevron */}
      {onClick && (
        <div className="flex-shrink-0" style={{ color: SYNTH_COLORS.textSecondary }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="9 18 15 12 9 6" />
          </svg>
        </div>
      )}
    </button>
  );
}

// ============================================================
// CLEAR ALL CONFIRM DIALOG — Synthesis-only
// Asks the user to confirm clearing all selected rubrics
// for the current case. Does NOT touch source rubrics.
// ============================================================
export function ClearAllConfirmDialog({
  open,
  onConfirm,
  onCancel,
  rubricCount,
}: {
  open: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  rubricCount: number;
}) {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget) onCancel(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        <div className="px-5 py-4 border-b border-stone-200 flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ backgroundColor: '#FDECEC' }}
          >
            <Icons.Trash size={18} className="text-[#C83B3B]" />
          </div>
          <h2 className="font-serif text-lg" style={{ color: SYNTH_COLORS.primary }}>
            Clear All Rubrics?
          </h2>
        </div>
        <div className="px-5 py-4">
          <p className="text-sm" style={{ color: SYNTH_COLORS.text }}>
            Are you sure you want to remove all {rubricCount} selected rubrics from this case?
          </p>
          <p className="text-xs mt-2" style={{ color: SYNTH_COLORS.textSecondary }}>
            This removes only the rubrics selected for the current case. Synthesis source
            rubrics, remedies, and grades remain untouched.
          </p>
        </div>
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-100"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white rounded-md"
            style={{ backgroundColor: SYNTH_COLORS.delete }}
          >
            <Icons.Trash size={14} className="text-white" />
            <span>Clear All</span>
          </button>
        </div>
      </div>
    </div>
  );
}
