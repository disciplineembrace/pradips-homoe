'use client';
/// Case Paper — patient details + selected rubrics + repertorize
import { useState, useEffect } from 'react';
import {
  PatientDetails, SelectedRubric, RepertorizationResult,
  generateCaseNo, GRADE_COLORS,
} from './storage';

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
  repertorizing: boolean;
}

export function CasePaper({
  patient, rubrics, results,
  onPatientChange, onRemoveRubric, onUpdateWeight, onToggleRubric,
  onRepertorize, onClearAll, onSaveCase, repertorizing,
}: Props) {
  function updatePatient<K extends keyof PatientDetails>(key: K, value: PatientDetails[K]) {
    onPatientChange({ ...patient, [key]: value });
  }

  return (
    <div className="space-y-4">
      {/* ===== PATIENT DETAILS ===== */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50">
          <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">Case Paper — Patient Details</h2>
        </div>
        <div className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {/* Patient Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 mb-1">Patient Name</label>
              <input
                type="text"
                value={patient.patientName}
                onChange={e => updatePatient('patientName', e.target.value)}
                placeholder="Enter patient name"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Case No */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Case No</label>
              <div className="flex gap-1">
                <input
                  type="text"
                  value={patient.caseNo}
                  onChange={e => updatePatient('caseNo', e.target.value)}
                  placeholder="Auto-generated"
                  className="flex-1 px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
                />
                <button
                  onClick={() => updatePatient('caseNo', generateCaseNo())}
                  className="px-2 py-2 text-xs bg-stone-100 text-stone-600 rounded-lg hover:bg-stone-200"
                  title="Generate case number"
                >
                  🔄
                </button>
              </div>
            </div>

            {/* Age */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Age</label>
              <input
                type="text"
                value={patient.age}
                onChange={e => updatePatient('age', e.target.value)}
                placeholder="e.g. 35"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Sex */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Sex</label>
              <div className="flex gap-1">
                {(['Male', 'Female', 'Other'] as const).map(s => (
                  <button
                    key={s}
                    onClick={() => updatePatient('sex', s)}
                    className={`flex-1 px-3 py-2 text-xs rounded-lg font-medium transition-colors ${
                      patient.sex === s ? 'bg-[#173B2D] text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                    }`}
                  >
                    {s === 'Other' ? 'Other' : s}
                  </button>
                ))}
              </div>
            </div>

            {/* Date */}
            <div>
              <label className="block text-xs font-semibold text-stone-600 mb-1">Date</label>
              <input
                type="date"
                value={patient.date}
                onChange={e => updatePatient('date', e.target.value)}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Contact (optional) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 mb-1">Contact (optional)</label>
              <input
                type="text"
                value={patient.contact}
                onChange={e => updatePatient('contact', e.target.value)}
                placeholder="Phone or email"
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>

            {/* Notes (optional) */}
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-stone-600 mb-1">Notes (optional)</label>
              <textarea
                value={patient.notes}
                onChange={e => updatePatient('notes', e.target.value)}
                placeholder="Clinical notes, symptoms description, etc."
                rows={3}
                className="w-full px-3 py-2 border border-stone-300 rounded-lg text-sm focus:outline-none focus:border-[#173B2D]"
              />
            </div>
          </div>
        </div>
      </div>

      {/* ===== SELECTED RUBRICS ===== */}
      <div className="bg-white rounded-lg shadow-sm border border-stone-200 overflow-hidden">
        <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-[#173B2D] uppercase tracking-wider">
            Selected Rubrics ({rubrics.length})
          </h2>
          {rubrics.length > 0 && (
            <button
              onClick={onClearAll}
              className="px-3 py-1 text-xs bg-red-100 text-red-700 rounded font-semibold hover:bg-red-200"
            >
              Clear All
            </button>
          )}
        </div>
        <div className="p-3">
          {rubrics.length === 0 ? (
            <p className="text-sm text-stone-500 text-center py-4">
              No rubrics selected. Browse chapters or search, then click &quot;+ Add to Case&quot;.
            </p>
          ) : (
            <div className="space-y-2">
              {rubrics.map((sr, idx) => (
                <div
                  key={sr.symptomId}
                  className={`flex items-center gap-2 p-2.5 border rounded-lg ${
                    sr.enabled ? 'border-stone-200 bg-white' : 'border-stone-200 bg-stone-50 opacity-60'
                  }`}
                >
                  <span className="text-xs text-stone-400 font-mono w-5">{idx + 1}.</span>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-[#173B2D] truncate">{sr.path}</div>
                    <div className="text-xs text-stone-500">Remedies: {sr.remedyCount}</div>
                  </div>
                  {/* Weight */}
                  <div className="flex items-center gap-1 flex-shrink-0">
                    <span className="text-xs text-stone-500 hidden sm:inline">W:</span>
                    <div className="flex gap-0.5">
                      {[1, 2, 3, 4].map(w => (
                        <button
                          key={w}
                          onClick={() => onUpdateWeight(sr.symptomId, w)}
                          className={`w-6 h-6 text-xs rounded font-bold transition-colors ${
                            sr.weight === w ? 'bg-blue-600 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                          }`}
                        >
                          {w}
                        </button>
                      ))}
                    </div>
                  </div>
                  {/* Enable/Disable */}
                  <button
                    onClick={() => onToggleRubric(sr.symptomId)}
                    className={`px-2 py-1 text-xs rounded transition-colors flex-shrink-0 ${
                      sr.enabled ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-400'
                    }`}
                    title={sr.enabled ? 'Enabled' : 'Disabled'}
                  >
                    {sr.enabled ? '✓' : '✗'}
                  </button>
                  {/* Remove */}
                  <button
                    onClick={() => onRemoveRubric(sr.symptomId)}
                    className="px-2 py-1 text-xs text-red-600 hover:bg-red-50 rounded flex-shrink-0"
                  >
                    ✕
                  </button>
                </div>
              ))}

              {/* Repertorize button */}
              <div className="pt-2 flex gap-2">
                <button
                  onClick={onRepertorize}
                  disabled={repertorizing || rubrics.filter(r => r.enabled).length === 0}
                  className="flex-1 px-6 py-2.5 bg-[#173B2D] text-white rounded-lg text-sm font-bold uppercase tracking-wider hover:bg-[#0f2a20] transition-colors disabled:opacity-50"
                >
                  {repertorizing ? 'Repertorizing...' : 'Start Repertorization'}
                </button>
                {results.length > 0 && (
                  <button
                    onClick={onSaveCase}
                    className="px-4 py-2.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors"
                  >
                    Save Case
                  </button>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
