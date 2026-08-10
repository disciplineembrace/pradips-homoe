/// Synthesis loading animations, icons, and UI components
/// Lightweight SVG/CSS based — no heavy dependencies

import React from 'react';

// ============================================================
// SVG ICON SYSTEM — Green and gold clinical icons
// ============================================================
type IconProps = { size?: number; className?: string };

export const Icons = {
  Rubrics: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  Remedies: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10.5 20.5 3.5 13.5a5 5 0 0 1 7-7l7 7a5 5 0 0 1-7 7z" />
      <path d="M8.5 8.5l7 7" />
    </svg>
  ),
  Relationships: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
      <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
    </svg>
  ),
  Authors: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  ),
  Chapters: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20" />
      <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z" />
    </svg>
  ),
  CrossRefs: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M8 6h12M8 12h12M8 18h12M3 6h.01M3 12h.01M3 18h.01" />
    </svg>
  ),
  Search: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.35-4.35" />
    </svg>
  ),
  Case: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="20" height="14" x="2" y="7" rx="2" ry="2" />
      <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16" />
    </svg>
  ),
  History: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M3 3v5h5" />
      <path d="M3.05 13A9 9 0 1 0 6 5.3L3 8" />
      <path d="M12 7v5l4 2" />
    </svg>
  ),
  Profile: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="8" r="5" />
      <path d="M20 21a8 8 0 0 0-16 0" />
    </svg>
  ),
  Report: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
      <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" />
    </svg>
  ),
  NewCase: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#0F3D2E" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M5 12h14M12 5v14" />
    </svg>
  ),
  HowItWorks: ({ size = 20, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="#D4AF37" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" />
    </svg>
  ),
  // ============================================================
  // SAVED-CASE ACTION ICONS (lightweight, currentColor stroke)
  // Each uses stroke="currentColor" so caller controls the color
  // via text-* class. Default size 16 for compact mobile buttons.
  // ============================================================
  Eye: ({ size = 16, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  ),
  Pencil: ({ size = 16, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 1 1 3 3L7 19l-4 1 1-4 12.5-12.5z" />
    </svg>
  ),
  Share: ({ size = 16, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  ),
  Trash: ({ size = 16, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <polyline points="3 6 5 6 21 6" />
      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
      <path d="M10 11v6M14 11v6" />
      <path d="M9 6V4a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  ),
  MoreVertical: ({ size = 16, className = '' }: IconProps) => (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="5" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="12" cy="19" r="1" />
    </svg>
  ),
};

// ============================================================
// SYNTHESIS CIRCLE — Primary loading animation
// ============================================================
export function SynthesisCircle({ text = 'Loading Synthesis Data...' }: { text?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-8">
      <div className="relative w-16 h-16">
        {/* Outer rotating ring */}
        <svg className="w-16 h-16 animate-spin" viewBox="0 0 64 64" style={{ animationDuration: '2s' }}>
          <circle cx="32" cy="32" r="28" fill="none" stroke="#E5DCC8" strokeWidth="3" />
          <circle
            cx="32" cy="32" r="28" fill="none" stroke="#0F3D2E" strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="175.9"
            strokeDashoffset="60"
          />
        </svg>
        {/* Center emblem — book/leaf */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <path d="M12 2C8 6 6 10 6 14c0 4 2 8 6 8s6-4 6-8c0-4-2-8-6-12z" fill="#D4AF37" opacity="0.8"/>
            <path d="M12 6v14" stroke="#0F3D2E" strokeWidth="1" opacity="0.4"/>
          </svg>
        </div>
      </div>
      <p className="text-xs text-[#6B7280] mt-3 font-medium">{text}</p>
    </div>
  );
}

// ============================================================
// LEAF GROWTH — For chapter/rubric loading
// ============================================================
export function LeafGrowth({ text = 'Loading...' }: { text?: string }) {
  return (
    <div className="flex items-center gap-2 py-2">
      <svg width="16" height="16" viewBox="0 0 24 24" className="animate-pulse">
        <path
          d="M12 22c0-6 4-10 10-10-0 6-4 10-10 10zM12 22c0-6-4-10-10-10 0 6 4 10 10 10z"
          fill="#1E6B52"
          opacity="0.6"
        />
      </svg>
      <span className="text-xs text-[#6B7280]">{text}</span>
    </div>
  );
}

// ============================================================
// SKELETON LOADER — For tables and lists
// ============================================================
export function SkeletonRow() {
  return (
    <div className="flex items-center gap-3 p-3 animate-pulse">
      <div className="w-8 h-8 rounded-full bg-stone-200"></div>
      <div className="flex-1 space-y-2">
        <div className="h-3 bg-stone-200 rounded w-1/3"></div>
        <div className="h-2 bg-stone-100 rounded w-1/2"></div>
      </div>
      <div className="w-12 h-6 bg-stone-200 rounded"></div>
    </div>
  );
}

export function SkeletonTable({ rows = 5 }: { rows?: number }) {
  return (
    <div className="space-y-1">
      {Array.from({ length: rows }).map((_, i) => <SkeletonRow key={i} />)}
    </div>
  );
}

// ============================================================
// PULSE DOT — For status indicators
// ============================================================
export function PulseDot({ color = '#22C55E' }: { color?: string }) {
  return (
    <span className="relative inline-flex w-2 h-2">
      <span
        className="absolute inline-flex w-full h-full rounded-full opacity-75 animate-ping"
        style={{ backgroundColor: color }}
      ></span>
      <span
        className="relative inline-flex w-2 h-2 rounded-full"
        style={{ backgroundColor: color }}
      ></span>
    </span>
  );
}

// ============================================================
// EMPTY STATE — With icon, message, and action button
// ============================================================
export function EmptyState({
  icon = '📭',
  title,
  message,
  actionLabel,
  onAction,
}: {
  icon?: string;
  title: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-16 h-16 rounded-full bg-[#F8F5EC] border border-[#E5DCC8] flex items-center justify-center mb-4">
        <span className="text-3xl">{icon}</span>
      </div>
      <h3 className="font-serif text-lg text-[#0F3D2E] mb-2">{title}</h3>
      {message && <p className="text-sm text-[#6B7280] text-center max-w-sm mb-4">{message}</p>}
      {actionLabel && onAction && (
        <button
          onClick={onAction}
          className="px-5 py-2 bg-[#0F3D2E] text-white rounded-lg text-sm font-semibold hover:bg-[#123C30] transition-colors"
        >
          {actionLabel}
        </button>
      )}
    </div>
  );
}

// ============================================================
// WORKFLOW STEPS — Visual progress indicator
// ============================================================
const WORKFLOW_STEPS = [
  { num: 1, label: 'Dashboard', icon: '🏠' },
  { num: 2, label: 'Search', icon: '🔍' },
  { num: 3, label: 'Select', icon: '📋' },
  { num: 4, label: 'Case Paper', icon: '📄' },
  { num: 5, label: 'Repertorize', icon: '⚙️' },
  { num: 6, label: 'Results', icon: '📊' },
];

export function WorkflowSteps({ currentStep }: { currentStep: number }) {
  return (
    <div className="bg-white rounded-lg shadow-sm border border-[#E5DCC8] p-3 mb-4">
      <div className="flex items-center justify-between gap-1 overflow-x-auto">
        {WORKFLOW_STEPS.map((step, idx) => {
          const isCompleted = step.num < currentStep;
          const isActive = step.num === currentStep;
          const isPending = step.num > currentStep;
          return (
            <React.Fragment key={step.num}>
              <div className="flex flex-col items-center gap-1 flex-shrink-0">
                <div
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    isCompleted
                      ? 'bg-[#22C55E] text-white'
                      : isActive
                        ? 'bg-[#0F3D2E] text-white ring-2 ring-[#D4AF37] ring-offset-2'
                        : 'bg-stone-100 text-stone-400'
                  }`}
                >
                  {isCompleted ? '✓' : step.num}
                </div>
                <span className={`text-[0.6rem] font-medium whitespace-nowrap ${
                  isActive ? 'text-[#0F3D2E]' : isCompleted ? 'text-[#22C55E]' : 'text-stone-400'
                }`}>
                  {step.label}
                </span>
              </div>
              {idx < WORKFLOW_STEPS.length - 1 && (
                <div className={`flex-1 h-0.5 min-w-[20px] ${isCompleted ? 'bg-[#22C55E]' : 'bg-stone-200'}`}></div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
