'use client';
/// ============================================================
/// SAVED-CASE ACTION MODALS — Synthesis-only
/// EditCaseModal + DeleteConfirmDialog
/// Scoped to the Synthesis Updated section only. No global CSS,
/// no shared-component changes. Uses the same icon library
/// (./components → Icons.*) and the same storage types (./storage).
/// ============================================================
import { useState, useEffect } from 'react';
import {
  SavedCase, PatientDetails, SelectedRubric, RepertorizationResult,
} from './storage';
import { Icons } from './components';

// ============================================================
// EDIT CASE MODAL
// ============================================================
// Allows the doctor to edit ONLY user-owned saved-case fields:
//   - Patient name, age, sex, date, contact, notes
//   - Selected rubrics (toggle enabled, adjust weight)
// It does NOT touch source rubrics, remedies, grades, or
// repertory relationships. Results are preserved as-is —
// re-repertorization must be triggered explicitly elsewhere.
// ID, createdAt, repertorizedAt are locked by the parent
// (handleSaveEditedCase) — they cannot drift here.
// ============================================================
interface EditCaseModalProps {
  caseData: SavedCase;
  saving: boolean;
  onSave: (updated: SavedCase) => void;
  onCancel: () => void;
}

const WEIGHT_OPTIONS = [
  { value: 1, label: '1 (Normal)' },
  { value: 2, label: '2 (Blue)' },
  { value: 3, label: '3 (Green)' },
  { value: 4, label: '4 (Red)' },
];

const SEX_OPTIONS: PatientDetails['sex'][] = ['', 'Male', 'Female', 'Other'];

export function EditCaseModal({ caseData, saving, onSave, onCancel }: EditCaseModalProps) {
  const [patient, setPatient] = useState<PatientDetails>(caseData.patient);
  const [rubrics, setRubrics] = useState<SelectedRubric[]>(caseData.rubrics);
  const [results, setResults] = useState<RepertorizationResult[]>(caseData.results);
  const [loading, setLoading] = useState(true);

  // Brief "Loading Case..." state so the doctor sees feedback on slow devices.
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 200);
    return () => clearTimeout(t);
  }, []);

  // ESC to cancel (without saving)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !saving) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [saving, onCancel]);

  function handleField<K extends keyof PatientDetails>(key: K, value: PatientDetails[K]) {
    setPatient(prev => ({ ...prev, [key]: value }));
  }

  function handleRubricWeight(symptomId: number, weight: number) {
    setRubrics(prev => prev.map(r => r.symptomId === symptomId ? { ...r, weight } : r));
  }

  function handleRubricToggle(symptomId: number) {
    setRubrics(prev => prev.map(r => r.symptomId === symptomId ? { ...r, enabled: !r.enabled } : r));
  }

  function handleRubricRemove(symptomId: number) {
    setRubrics(prev => prev.filter(r => r.symptomId !== symptomId));
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return; // prevent double-submit
    onSave({
      ...caseData,
      patient,
      rubrics,
      results,
    });
  }

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !saving) onCancel(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="px-4 py-3 border-b border-stone-200 bg-stone-50 flex items-center justify-between flex-shrink-0">
          <div className="flex items-center gap-2">
            <Icons.Pencil size={18} className="text-[#124C3B]" />
            <h2 className="font-serif text-lg text-[#124C3B]">Edit Saved Case</h2>
          </div>
          <button
            onClick={onCancel}
            disabled={saving}
            className="text-stone-400 hover:text-stone-600 text-xl px-2 disabled:opacity-50"
            aria-label="Close"
          >
            ✕
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="inline-block w-6 h-6 border-2 border-[#124C3B]/30 border-t-[#124C3B] rounded-full animate-spin mb-3" />
              <p className="text-sm text-stone-600 font-medium">Loading Case...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="p-4 space-y-5">
              {/* Patient details */}
              <fieldset className="space-y-3" disabled={saving}>
                <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Patient Details
                </legend>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <Field label="Patient Name" required={false}>
                    <input
                      type="text"
                      value={patient.patientName}
                      onChange={e => handleField('patientName', e.target.value)}
                      placeholder="Enter patient name (or leave blank for Unknown Patient)"
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#124C3B]/30 focus:border-[#124C3B]"
                    />
                  </Field>
                  <Field label="Case No. (locked)">
                    <input
                      type="text"
                      value={patient.caseNo}
                      readOnly
                      className="w-full px-3 py-2 border border-stone-200 rounded-md text-sm bg-stone-100 text-stone-500 cursor-not-allowed"
                    />
                  </Field>
                  <Field label="Age">
                    <input
                      type="text"
                      inputMode="numeric"
                      value={patient.age}
                      onChange={e => handleField('age', e.target.value)}
                      placeholder="e.g. 34"
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#124C3B]/30 focus:border-[#124C3B]"
                    />
                  </Field>
                  <Field label="Sex">
                    <select
                      value={patient.sex}
                      onChange={e => handleField('sex', e.target.value as PatientDetails['sex'])}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-[#124C3B]/30 focus:border-[#124C3B]"
                    >
                      {SEX_OPTIONS.map(s => (
                        <option key={s || 'unknown'} value={s}>{s || '— Select —'}</option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Date">
                    <input
                      type="date"
                      value={patient.date}
                      onChange={e => handleField('date', e.target.value)}
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#124C3B]/30 focus:border-[#124C3B]"
                    />
                  </Field>
                  <Field label="Contact">
                    <input
                      type="text"
                      value={patient.contact}
                      onChange={e => handleField('contact', e.target.value)}
                      placeholder="Phone / email (optional)"
                      className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#124C3B]/30 focus:border-[#124C3B]"
                    />
                  </Field>
                </div>
                <Field label="Notes">
                  <textarea
                    value={patient.notes}
                    onChange={e => handleField('notes', e.target.value)}
                    rows={3}
                    placeholder="Clinical notes, observations, follow-up details..."
                    className="w-full px-3 py-2 border border-stone-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-[#124C3B]/30 focus:border-[#124C3B] resize-y"
                  />
                </Field>
              </fieldset>

              {/* Selected rubrics — toggle / weight / remove */}
              <fieldset className="space-y-2" disabled={saving}>
                <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                  Selected Rubrics ({rubrics.length})
                </legend>
                {rubrics.length === 0 ? (
                  <p className="text-xs text-stone-400 italic px-1 py-2">No rubrics in this case.</p>
                ) : (
                  <div className="border border-stone-200 rounded-md max-h-56 overflow-y-auto divide-y divide-stone-100">
                    {rubrics.map(r => (
                      <div key={r.symptomId} className="flex items-center gap-2 px-3 py-2">
                        <input
                          type="checkbox"
                          checked={r.enabled}
                          onChange={() => handleRubricToggle(r.symptomId)}
                          className="w-4 h-4 accent-[#124C3B] flex-shrink-0"
                          aria-label={`Toggle rubric ${r.name}`}
                        />
                        <div className="flex-1 min-w-0">
                          <div className="text-xs font-medium text-stone-800 truncate">{r.name}</div>
                          <div className="text-[10px] text-stone-400 truncate">{r.path}</div>
                        </div>
                        <select
                          value={r.weight}
                          onChange={e => handleRubricWeight(r.symptomId, Number(e.target.value))}
                          className="text-xs border border-stone-300 rounded px-1.5 py-1 bg-white flex-shrink-0"
                          aria-label={`Weight for ${r.name}`}
                        >
                          {WEIGHT_OPTIONS.map(o => (
                            <option key={o.value} value={o.value}>{o.label}</option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={() => handleRubricRemove(r.symptomId)}
                          className="text-stone-400 hover:text-red-600 px-1 flex-shrink-0"
                          aria-label={`Remove ${r.name}`}
                          title="Remove rubric"
                        >
                          <Icons.Trash size={14} className="text-stone-400 hover:text-red-600" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[10px] text-stone-400 italic">
                  Note: editing rubrics here does not re-repertorize automatically.
                  To refresh results, open the case and use the Repertorize action.
                </p>
              </fieldset>

              {/* Repertorization results — read-only summary (re-repertorize via Open) */}
              {results.length > 0 && (
                <fieldset className="space-y-1" disabled={saving}>
                  <legend className="text-xs font-semibold text-stone-500 uppercase tracking-wider mb-2">
                    Repertorization Results ({results.length} remedies · Top 10 shown)
                  </legend>
                  <div className="border border-stone-200 rounded-md max-h-40 overflow-y-auto">
                    <table className="w-full text-xs">
                      <thead className="bg-stone-50 sticky top-0">
                        <tr>
                          <th className="text-left px-2 py-1.5 font-medium text-stone-600">#</th>
                          <th className="text-left px-2 py-1.5 font-medium text-stone-600">Remedy</th>
                          <th className="text-right px-2 py-1.5 font-medium text-stone-600">Score</th>
                          <th className="text-right px-2 py-1.5 font-medium text-stone-600">Coverage</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-stone-100">
                        {results.slice(0, 10).map((r, i) => (
                          <tr key={r.abbrev}>
                            <td className="px-2 py-1 text-stone-400">{i + 1}</td>
                            <td className="px-2 py-1">
                              <span className="font-semibold text-stone-800">{r.abbrev}</span>
                              <span className="text-stone-400 ml-1">— {r.full}</span>
                            </td>
                            <td className="px-2 py-1 text-right font-medium text-[#124C3B]">{r.totalScore}</td>
                            <td className="px-2 py-1 text-right text-stone-500">{r.coverage}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </fieldset>
              )}
            </form>
          )}
        </div>

        {/* Footer — Save / Cancel */}
        <div className="px-4 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2 flex-shrink-0">
          <button
            onClick={onCancel}
            disabled={saving}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving || loading}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-[#124C3B] rounded-md hover:bg-[#0B392D] disabled:opacity-50 disabled:cursor-not-allowed min-w-[120px] justify-center"
          >
            {saving ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Saving Changes...</span>
              </>
            ) : (
              <>
                <Icons.Pencil size={14} className="text-white" />
                <span>Save Changes</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

function Field({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) {
  return (
    <label className="block">
      <span className="block text-xs font-medium text-stone-600 mb-1">
        {label}{required && <span className="text-red-500 ml-0.5">*</span>}
      </span>
      {children}
    </label>
  );
}

// ============================================================
// DELETE CONFIRMATION DIALOG
// ============================================================
interface DeleteConfirmDialogProps {
  caseId: string;
  deleting: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function DeleteConfirmDialog({ caseId, deleting, onConfirm, onCancel }: DeleteConfirmDialogProps) {
  // ESC to cancel (without deleting)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [deleting, onCancel]);

  return (
    <div
      className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4"
      onClick={(e) => { if (e.target === e.currentTarget && !deleting) onCancel(); }}
    >
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full overflow-hidden">
        {/* Header — red accent */}
        <div className="px-5 py-4 border-b border-stone-200 flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-red-50 flex items-center justify-center flex-shrink-0">
            <Icons.Trash size={18} className="text-red-600" />
          </div>
          <h2 className="font-serif text-lg text-[#124C3B]">Delete Saved Case?</h2>
        </div>

        {/* Body */}
        <div className="px-5 py-4">
          <p className="text-sm text-stone-600">
            Are you sure you want to delete this saved case?
          </p>
          <p className="text-xs text-stone-500 mt-2">
            This action cannot be undone. Only this saved case will be removed — your
            patient account, Synthesis rubrics, remedies, and source grades remain untouched.
          </p>
          <p className="text-[10px] text-stone-400 mt-3 font-mono break-all">
            Case ID: {caseId}
          </p>
        </div>

        {/* Footer — Cancel / Delete Case */}
        <div className="px-5 py-3 border-t border-stone-200 bg-stone-50 flex items-center justify-end gap-2">
          <button
            onClick={onCancel}
            disabled={deleting}
            className="px-4 py-2 text-sm font-semibold text-stone-700 bg-white border border-stone-300 rounded-md hover:bg-stone-100 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Cancel
          </button>
          <button
            onClick={onConfirm}
            disabled={deleting}
            className="flex items-center gap-2 px-4 py-2 text-sm font-semibold text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed min-w-[130px] justify-center"
          >
            {deleting ? (
              <>
                <span className="inline-block w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Deleting Case...</span>
              </>
            ) : (
              <>
                <Icons.Trash size={14} className="text-white" />
                <span>Delete Case</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
