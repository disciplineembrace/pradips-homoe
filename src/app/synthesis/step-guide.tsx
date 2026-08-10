'use client';
/// Step Guide — 9-step workflow walkthrough for Synthesis section
/// Shows users how to use the repertorization workflow
import { useState } from 'react';

interface StepGuideProps {
  onClose: () => void;
  onStartWorkflow: () => void;
}

const STEPS = [
  {
    num: 1,
    title: 'Home / Dashboard',
    icon: '🏠',
    description: 'Start from the Synthesis dashboard.',
    details: [
      'View database statistics: 180,386 rubrics, 2,384 remedies, 41 chapters',
      'Click "+ Start New Repertorization" to begin a new case',
      'Access Chapters, Search, Case Paper, History, and Profile from the navigation grid',
    ],
  },
  {
    num: 2,
    title: 'Search Rubric',
    icon: '🔍',
    description: 'Search for rubrics by symptom or clinical term.',
    details: [
      'Type a symptom (e.g., "headache", "anger", "fear") in the search bar',
      'Results show matching rubrics organized by chapter hierarchy',
      'Each result shows the rubric path and remedy count',
      'Debounced search — results appear as you type (350ms delay)',
    ],
  },
  {
    num: 3,
    title: 'Select Rubrics',
    icon: '📋',
    description: 'Add rubrics to your active case.',
    details: [
      'Click "+ Add" next to any rubric to add it to your case',
      'Browse Chapter → Rubric → Sub-rubric hierarchy using the tree',
      'Use breadcrumbs to navigate back through the hierarchy',
      'Set weight (1-4) for each selected rubric based on importance',
      'Duplicate rubrics are automatically prevented',
    ],
  },
  {
    num: 4,
    title: 'Case Paper',
    icon: '📄',
    description: 'Enter patient details and review selected rubrics.',
    details: [
      'Enter Patient Name, Case No (auto-generated), Age, Sex, Date',
      'Add optional Contact and Notes',
      'Review all selected rubrics with their weights',
      'Enable/Disable rubrics, change weights, or remove as needed',
      'The case persists in your browser — navigate freely without losing data',
    ],
  },
  {
    num: 5,
    title: 'Start Repertorization',
    icon: '⚙️',
    description: 'Run the calculation engine on your selected rubrics.',
    details: [
      'Click "Start Repertorization" in the Case Paper',
      'The engine retrieves actual remedy relationships from the Synthesis database',
      'Scoring: Grade × Weight for each rubric-remedy pair',
      'Grade 4 = 4 points, Grade 3 = 3 points, Grade 2 = 2 points, Grade 1 = 1 point',
      'Results are deterministic and auditable — no AI-generated scores',
    ],
  },
  {
    num: 6,
    title: 'Result — Remedy Ranking',
    icon: '📊',
    description: 'View ranked remedies with scores and coverage.',
    details: [
      'Remedies sorted by Total Score (descending), then Coverage',
      'Each row shows: Rank, Remedy, Score, Coverage (X/Y), Grade Breakdown',
      'Coverage = number of selected rubrics containing the remedy / total rubrics',
      'Grade breakdown shows how many rubrics at each grade level',
      'Top 50 remedies displayed (full results available)',
    ],
  },
  {
    num: 7,
    title: 'View Remedy Details',
    icon: '💊',
    description: 'Click any remedy to see its rubric contribution.',
    details: [
      'Click "Details" button next to any ranked remedy',
      'View Total Score and Coverage summary',
      'See Rubric Contribution: each rubric with source grade and weight',
      'Grade colors: G4=Red, G3=Dark Green, G2=Dark Blue, G1=Normal',
      'Link to Materia Medica for further reference',
    ],
  },
  {
    num: 8,
    title: 'Compare Remedies',
    icon: '🔄',
    description: 'Compare remedies across all selected rubrics.',
    details: [
      'Click "Compare Remedies" in the Selected Rubrics section',
      'View remedies common to ALL selected rubrics',
      'View remedies grouped by coverage (Present in 4/5, 3/5, etc.)',
      'Full matrix table: Remedy × Rubric with grades',
      'Grades color-coded: G4=Red, G3=Green, G2=Blue, G1=Stone',
    ],
  },
  {
    num: 9,
    title: 'Report & Save',
    icon: '💾',
    description: 'Generate professional report and save the case.',
    details: [
      'Click "Save Case" to store patient + rubrics + results',
      'Set up your Doctor/Clinic Profile (Profile view) for branded reports',
      'Click report preview to view the professional repertorization sheet',
      'Print (A4 optimized) or Download PDF with your clinic branding',
      'Reopen saved cases from History at any time',
    ],
  },
];

export function StepGuide({ onClose, onStartWorkflow }: StepGuideProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const step = STEPS[currentStep];
  const isLast = currentStep === STEPS.length - 1;
  const isFirst = currentStep === 0;

  return (
    <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-5 py-3 bg-[#173B2D] text-white flex items-center justify-between">
          <div>
            <h2 className="font-serif text-lg">Synthesis Workflow Guide</h2>
            <p className="text-xs text-stone-300">Step {currentStep + 1} of {STEPS.length}</p>
          </div>
          <button onClick={onClose} className="text-stone-300 hover:text-white text-2xl leading-none">✕</button>
        </div>

        {/* Progress bar */}
        <div className="h-1.5 bg-stone-200">
          <div
            className="h-full bg-[#C8A24A] transition-all duration-300"
            style={{ width: `${((currentStep + 1) / STEPS.length) * 100}%` }}
          />
        </div>

        {/* Step indicators */}
        <div className="px-5 py-3 bg-stone-50 border-b border-stone-200">
          <div className="flex items-center justify-between gap-1">
            {STEPS.map((s, idx) => (
              <button
                key={s.num}
                onClick={() => setCurrentStep(idx)}
                className={`flex-1 flex flex-col items-center gap-1 group`}
              >
                <div
                  className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                    idx === currentStep
                      ? 'bg-[#173B2D] text-white scale-110'
                      : idx < currentStep
                        ? 'bg-green-500 text-white'
                        : 'bg-stone-200 text-stone-500 group-hover:bg-stone-300'
                  }`}
                >
                  {idx < currentStep ? '✓' : s.num}
                </div>
                <span className={`text-[0.6rem] hidden md:block ${idx === currentStep ? 'text-[#173B2D] font-semibold' : 'text-stone-400'}`}>
                  {s.title.split(' ')[0]}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Step content */}
        <div className="p-6 overflow-y-auto flex-1">
          <div className="flex items-start gap-4 mb-4">
            <div className="w-14 h-14 rounded-full bg-[#173B2D] flex items-center justify-center text-2xl flex-shrink-0">
              {step.icon}
            </div>
            <div className="flex-1">
              <div className="text-xs text-[#C8A24A] font-semibold uppercase tracking-wider mb-1">
                Step {step.num}
              </div>
              <h3 className="font-serif text-xl text-[#173B2D] mb-1">{step.title}</h3>
              <p className="text-sm text-stone-600">{step.description}</p>
            </div>
          </div>

          {/* Details */}
          <div className="space-y-2 mt-4">
            {step.details.map((detail, idx) => (
              <div key={idx} className="flex items-start gap-2.5 p-2.5 bg-stone-50 rounded-lg border border-stone-200">
                <span className="w-5 h-5 rounded-full bg-[#C8A24A] text-[#173B2D] flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">
                  {idx + 1}
                </span>
                <p className="text-sm text-stone-700">{detail}</p>
              </div>
            ))}
          </div>

          {/* Visual demo box — uses Synthesis palette (no bright blue) */}
          <div className="mt-4 p-4 rounded-lg" style={{ backgroundColor: '#E6F4EC', border: '1px solid rgba(15, 74, 56, 0.2)' }}>
            <div className="text-xs font-semibold uppercase tracking-wider mb-1.5" style={{ color: '#0F4A38' }}>💡 Tip</div>
            <p className="text-xs text-stone-600">
              {currentStep === 0 && 'Bookmark this page — the dashboard is your home base for all repertorization work.'}
              {currentStep === 1 && 'Search works across all 180,386 rubrics. Try clinical terms like "headache morning", "anxiety fear", or "pain burning".'}
              {currentStep === 2 && 'You can add rubrics from different chapters (e.g., MIND + HEAD + STOMACH) — they all stay in the same case.'}
              {currentStep === 3 && 'Case data is saved in your browser. You can close the tab and come back — your case will still be there.'}
              {currentStep === 4 && 'Only enabled rubrics (✓) are included in repertorization. Disabled rubrics (✗) are kept but not scored.'}
              {currentStep === 5 && 'Coverage 5/5 means the remedy appears in ALL 5 selected rubrics — a strong indicator for that remedy.'}
              {currentStep === 6 && 'The grade shown is the ORIGINAL source grade from the Synthesis database — never AI-generated or modified.'}
              {currentStep === 7 && 'The comparison matrix helps you see which remedies cover the most rubrics at the highest grades.'}
              {currentStep === 8 && 'Set up your Profile (doctor name, clinic, logo) before generating reports — it brands the report header automatically.'}
            </p>
          </div>
        </div>

        {/* Footer navigation */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-between">
          <button
            onClick={() => !isFirst && setCurrentStep(currentStep - 1)}
            disabled={isFirst}
            className="px-4 py-2 text-sm text-stone-600 rounded-lg hover:bg-stone-200 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
          >
            ← Previous
          </button>

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm text-stone-600 hover:text-stone-800"
            >
              Skip Guide
            </button>
            {isLast ? (
              <button
                onClick={onStartWorkflow}
                className="px-5 py-2 text-sm font-semibold bg-[#173B2D] text-white rounded-lg hover:bg-[#0f2a20] transition-colors"
              >
                ✓ Start Repertorizing →
              </button>
            ) : (
              <button
                onClick={() => setCurrentStep(currentStep + 1)}
                className="px-5 py-2 text-sm font-semibold bg-[#173B2D] text-white rounded-lg hover:bg-[#0f2a20] transition-colors"
              >
                Next →
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
