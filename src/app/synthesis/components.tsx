/// Synthesis loading animations — lightweight SVG/CSS based
/// Synthesis Circle: circular green progress ring with gold emblem
/// Leaf Growth: for chapter/rubric loading

import React from 'react';

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
