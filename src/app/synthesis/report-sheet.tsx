'use client';
/// Report Sheet — professional repertorization report with print/PDF support
/// Fixed: Top 10 remedies, proper print isolation, grade distribution, remedy details
import { useState } from 'react';
import {
  PatientDetails, SelectedRubric, RepertorizationResult, DoctorProfile,
  PRINT_GRADE_COLORS, sanitizeFilename,
} from './storage';

interface Props {
  patient: PatientDetails;
  rubrics: SelectedRubric[];
  results: RepertorizationResult[];
  profile: DoctorProfile;
  onClose: () => void;
}

export function ReportSheet({ patient, rubrics, results, profile, onClose }: Props) {
  const [showMatrix, setShowMatrix] = useState(false);
  const [expandedRemedy, setExpandedRemedy] = useState<string | null>(null);

  // Print handler — opens print dialog
  function handlePrint() {
    window.print();
  }

  // Download PDF — uses browser's print-to-PDF
  function handleDownloadPDF() {
    const originalTitle = document.title;
    const filename = `Repertorization-Case-${sanitizeFilename(patient.caseNo || 'draft')}-${sanitizeFilename(patient.date || new Date().toISOString().split('T')[0])}`;
    document.title = filename;
    window.print();
    document.title = originalTitle;
  }

  // Calculate summary stats
  const enabledRubrics = rubrics.filter(r => r.enabled);
  const totalRubrics = enabledRubrics.length;
  const top10Remedies = results.slice(0, 10); // TOP 10 only
  const matrixRemedies = results.slice(0, 10);

  // Format date for display
  function formatDate(dateStr: string): string {
    if (!dateStr) return new Date().toLocaleDateString('en-IN');
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
    } catch {
      return dateStr;
    }
  }

  function formatDateTime(): string {
    return new Date().toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  }

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4 no-print-modal">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col no-print-modal-inner">
        {/* Header — NOT printed */}
        <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between no-print-bar">
          <h2 className="font-serif text-lg text-[#124C3B]">Repertorization Report Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs bg-stone-200 text-stone-700 rounded font-semibold hover:bg-stone-300"
            >
              🖨 Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-xs bg-[#124C3B] text-white rounded font-semibold hover:bg-[#0B392D]"
            >
              📄 Download PDF
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl px-2">✕</button>
          </div>
        </div>

        {/* Report Content — printable area */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1 print-only-content" id="report-content">
          <div className="max-w-[210mm] mx-auto">

            {/* ============================================================
                REPORT HEADER — Doctor/Clinic branding
            ============================================================ */}
            <div className="text-center pb-4 border-b-2 border-[#124C3B] report-header">
              {profile.logo && (
                <img src={profile.logo} alt="" className="w-16 h-16 md:w-20 md:h-20 mx-auto mb-2 object-contain" />
              )}
              {profile.clinicName && (
                <div className="font-serif text-xl md:text-2xl font-bold text-[#124C3B]">{profile.clinicName}</div>
              )}
              {profile.doctorName && (
                <div className="text-base font-semibold text-stone-700 mt-1">{profile.doctorName}</div>
              )}
              {profile.qualification && (
                <div className="text-sm text-stone-500">{profile.qualification}</div>
              )}
              {profile.clinicAddress && (
                <div className="text-xs text-stone-500 mt-1">{profile.clinicAddress}</div>
              )}
              <div className="text-xs text-stone-500">
                {profile.phone && <span className="mr-3">Phone: {profile.phone}</span>}
                {profile.email && <span className="mr-3">Email: {profile.email}</span>}
                {profile.registrationNo && <span>Reg. No: {profile.registrationNo}</span>}
              </div>
            </div>

            {/* ============================================================
                REPORT TITLE
            ============================================================ */}
            <div className="text-center my-4 report-title">
              <h1 className="font-serif text-lg md:text-xl font-bold text-[#124C3B] uppercase tracking-wider">
                Repertorization Sheet
              </h1>
              <div className="text-xs text-stone-500 mt-1">Synthesis Repertory — Updated Version by Dr. Pradip</div>
            </div>

            {/* ============================================================
                PATIENT DETAILS
            ============================================================ */}
            <div className="mb-4 report-patient">
              <div className="text-xs font-bold text-[#124C3B] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Patient Details
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                <div><span className="text-stone-500 font-medium">Patient Name:</span> <span className="font-semibold text-stone-800">{patient.patientName || '—'}</span></div>
                <div><span className="text-stone-500 font-medium">Case No:</span> <span className="font-semibold text-stone-800">{patient.caseNo || '—'}</span></div>
                <div><span className="text-stone-500 font-medium">Date:</span> <span className="font-semibold text-stone-800">{formatDate(patient.date)}</span></div>
                <div><span className="text-stone-500 font-medium">Age:</span> <span className="font-semibold text-stone-800">{patient.age || '—'}</span></div>
                <div><span className="text-stone-500 font-medium">Sex:</span> <span className="font-semibold text-stone-800">{patient.sex || '—'}</span></div>
                {patient.contact && <div><span className="text-stone-500 font-medium">Contact:</span> <span className="font-semibold text-stone-800">{patient.contact}</span></div>}
              </div>
            </div>

            {/* ============================================================
                SELECTED RUBRICS
            ============================================================ */}
            <div className="mb-4 report-rubrics" style={{ breakInside: 'avoid' }}>
              <div className="text-xs font-bold text-[#124C3B] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Selected Rubrics ({totalRubrics})
              </div>
              <table className="w-full text-xs border-collapse rubrics-table">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="border border-stone-200 px-2 py-1.5 text-left text-stone-600 font-semibold" style={{ width: '30px' }}>#</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-left text-stone-600 font-semibold">Rubric Path</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold" style={{ width: '50px' }}>Weight</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold" style={{ width: '60px' }}>Remedies</th>
                  </tr>
                </thead>
                <tbody>
                  {enabledRubrics.map((sr, idx) => (
                    <tr key={sr.symptomId} style={{ breakInside: 'avoid' }}>
                      <td className="border border-stone-200 px-2 py-1.5 text-stone-500">{idx + 1}</td>
                      <td className="border border-stone-200 px-2 py-1.5 text-stone-800">{sr.path}</td>
                      <td className="border border-stone-200 px-2 py-1.5 text-center font-mono font-bold" style={{ color: '#124C3B' }}>{sr.weight}</td>
                      <td className="border border-stone-200 px-2 py-1.5 text-center text-stone-600">{sr.remedyCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ============================================================
                REPERTORIZATION ANALYSIS — TOP 10 REMEDIES
            ============================================================ */}
            <div className="mb-4 report-results" style={{ breakInside: 'avoid' }}>
              <div className="text-xs font-bold text-[#124C3B] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Repertorization Analysis — Top 10 Remedies
              </div>
              <table className="w-full text-xs border-collapse results-table">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold" style={{ width: '35px' }}>Rank</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-left text-stone-600 font-semibold">Remedy</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold" style={{ width: '45px' }}>Score</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold" style={{ width: '55px' }}>Coverage</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold" style={{ width: '40px' }}>Σ Sym</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-center text-stone-600 font-semibold" style={{ width: '40px' }}>Σ Deg</th>
                    <th className="border border-stone-200 px-2 py-1.5 text-left text-stone-600 font-semibold">Grade Distribution</th>
                  </tr>
                </thead>
                <tbody>
                  {top10Remedies.map((r, idx) => {
                    const gradeCounts: Record<number, number> = {};
                    let totalGradeSum = 0;
                    r.rubrics.forEach(rb => {
                      gradeCounts[rb.grade] = (gradeCounts[rb.grade] || 0) + 1;
                      totalGradeSum += rb.grade;
                    });
                    return (
                      <tr key={r.abbrev} className={idx < 3 ? 'bg-stone-50' : ''} style={{ breakInside: 'avoid' }}>
                        <td className="border border-stone-200 px-2 py-1.5 text-center font-mono font-bold text-stone-700">{idx + 1}</td>
                        <td className="border border-stone-200 px-2 py-1.5">
                          <div className="font-mono font-bold text-[#124C3B]">{r.abbrev}</div>
                          <div className="text-stone-400 text-xs truncate" style={{ maxWidth: '200px' }}>{r.full}</div>
                        </td>
                        <td className="border border-stone-200 px-2 py-1.5 text-center font-bold text-[#124C3B]">{r.totalScore}</td>
                        <td className="border border-stone-200 px-2 py-1.5 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                            r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {r.coverage}
                          </span>
                        </td>
                        <td className="border border-stone-200 px-2 py-1.5 text-center text-stone-600">{r.coverageCount}</td>
                        <td className="border border-stone-200 px-2 py-1.5 text-center text-stone-600">{totalGradeSum}</td>
                        <td className="border border-stone-200 px-2 py-1.5">
                          <div className="flex gap-1 flex-wrap">
                            {[4, 3, 2, 1].map(g => (
                              gradeCounts[g] ? (
                                <span
                                  key={g}
                                  className="px-1.5 py-0.5 rounded text-xs font-mono font-bold grade-badge"
                                  style={{
                                    color: PRINT_GRADE_COLORS[g],
                                    backgroundColor: g === 4 ? '#FEE2E2' : g === 3 ? '#DCFCE7' : g === 2 ? '#DBEAFE' : '#F5F5F4',
                                    border: `1px solid ${PRINT_GRADE_COLORS[g]}40`,
                                  }}
                                >
                                  G{g}:{gradeCounts[g]}
                                </span>
                              ) : null
                            ))}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* ============================================================
                REMEDY DETAILS — Top 10 with rubric contribution
            ============================================================ */}
            <div className="mb-4 report-remedy-details" style={{ breakInside: 'avoid' }}>
              <div className="text-xs font-bold text-[#124C3B] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Remedy Details — Rubric Contribution (Top 10)
              </div>
              <div className="space-y-3">
                {top10Remedies.map((r, idx) => {
                  const isExpanded = expandedRemedy === r.abbrev;
                  return (
                    <div key={r.abbrev} className="border border-stone-200 rounded overflow-hidden" style={{ breakInside: 'avoid' }}>
                      {/* Remedy header row */}
                      <div
                        className="flex items-center justify-between gap-2 p-2.5 bg-stone-50 cursor-pointer hover:bg-stone-100 no-print-clickable"
                        onClick={() => setExpandedRemedy(isExpanded ? null : r.abbrev)}
                      >
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-full bg-[#124C3B] text-white flex items-center justify-center text-xs font-bold">{idx + 1}</span>
                          <span className="font-mono font-bold text-[#124C3B]">{r.abbrev}</span>
                          <span className="text-xs text-stone-500 truncate" style={{ maxWidth: '150px' }}>{r.full}</span>
                        </div>
                        <div className="flex items-center gap-3 text-xs flex-shrink-0">
                          <span className="font-bold text-[#124C3B]">Score: {r.totalScore}</span>
                          <span className={`px-1.5 py-0.5 rounded font-semibold ${
                            r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                          }`}>{r.coverage}</span>
                          <span className="text-stone-400 no-print-toggle">{isExpanded ? '▲' : '▼'}</span>
                        </div>
                      </div>
                      {/* Rubric contribution — always visible in print, toggle on screen */}
                      <div className={`p-2.5 ${isExpanded ? '' : 'hidden print:block'}`}>
                        <table className="w-full text-xs border-collapse">
                          <thead>
                            <tr className="bg-stone-100">
                              <th className="border border-stone-200 px-2 py-1 text-left text-stone-600 font-semibold">Rubric Path</th>
                              <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 font-semibold" style={{ width: '60px' }}>Source Grade</th>
                              <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 font-semibold" style={{ width: '50px' }}>Weight</th>
                              <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 font-semibold" style={{ width: '60px' }}>Contribution</th>
                            </tr>
                          </thead>
                          <tbody>
                            {r.rubrics.map((rb, ridx) => {
                              const sr = enabledRubrics.find(s => s.symptomId === rb.symptomId);
                              return (
                                <tr key={ridx}>
                                  <td className="border border-stone-200 px-2 py-1 text-stone-700">{sr?.path || `Symptom ${rb.symptomId}`}</td>
                                  <td className="border border-stone-200 px-2 py-1 text-center">
                                    <span
                                      className="inline-flex items-center justify-center w-5 h-5 rounded text-xs font-bold text-white"
                                      style={{ backgroundColor: PRINT_GRADE_COLORS[rb.grade] }}
                                    >
                                      {rb.grade}
                                    </span>
                                  </td>
                                  <td className="border border-stone-200 px-2 py-1 text-center font-mono font-bold" style={{ color: '#124C3B' }}>{rb.weight}</td>
                                  <td className="border border-stone-200 px-2 py-1 text-center font-bold text-[#124C3B]">{rb.grade * rb.weight}</td>
                                </tr>
                              );
                            })}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* ============================================================
                DETAILED MATRIX (toggleable)
            ============================================================ */}
            {showMatrix && matrixRemedies.length > 0 && (
              <div className="mb-4 report-matrix" style={{ breakInside: 'avoid' }}>
                <div className="text-xs font-bold text-[#124C3B] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                  Detailed Rubric / Remedy Matrix
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse min-w-full matrix-table">
                    <thead>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-200 px-2 py-1.5 text-left text-stone-600 font-semibold">Remedy</th>
                        {enabledRubrics.map(sr => (
                          <th key={sr.symptomId} className="border border-stone-200 px-1 py-1.5 text-center text-stone-600 font-semibold" style={{ maxWidth: '80px' }}>
                            <div className="truncate text-xs" title={sr.path}>{sr.path.split(' - ').pop()}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRemedies.map(r => (
                        <tr key={r.abbrev}>
                          <td className="border border-stone-200 px-2 py-1.5 font-mono font-bold text-[#124C3B]">
                            {r.abbrev}
                          </td>
                          {enabledRubrics.map(sr => {
                            const rubricData = r.rubrics.find(rb => rb.symptomId === sr.symptomId);
                            const grade = rubricData?.grade;
                            return (
                              <td
                                key={sr.symptomId}
                                className="border border-stone-200 px-1 py-1.5 text-center font-mono font-bold text-xs"
                                style={{
                                  color: grade ? PRINT_GRADE_COLORS[grade] : '#D1D5DB',
                                }}
                              >
                                {grade || '—'}
                              </td>
                            );
                          })}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* ============================================================
                GRADE LEGEND
            ============================================================ */}
            <div className="mb-4 report-legend" style={{ breakInside: 'avoid' }}>
              <div className="text-xs font-bold text-[#124C3B] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Remedy Grade Legend
              </div>
              <div className="flex gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded inline-flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PRINT_GRADE_COLORS[4] }}>4</span>
                  <span className="text-stone-600">Grade 4 (Red)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded inline-flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PRINT_GRADE_COLORS[3] }}>3</span>
                  <span className="text-stone-600">Grade 3 (Dark Green)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded inline-flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PRINT_GRADE_COLORS[2] }}>2</span>
                  <span className="text-stone-600">Grade 2 (Dark Blue)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-5 h-5 rounded inline-flex items-center justify-center font-bold text-xs" style={{ backgroundColor: '#F5F5F4', color: PRINT_GRADE_COLORS[1] }}>1</span>
                  <span className="text-stone-600">Grade 1 (Normal)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="text-stone-400 font-mono">—</span>
                  <span className="text-stone-600">Not present</span>
                </div>
              </div>
            </div>

            {/* ============================================================
                NOTES (if present)
            ============================================================ */}
            {patient.notes && (
              <div className="mb-4 report-notes" style={{ breakInside: 'avoid' }}>
                <div className="text-xs font-bold text-[#124C3B] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                  Notes
                </div>
                <div className="text-xs text-stone-700 whitespace-pre-wrap p-3 bg-stone-50 rounded border border-stone-200">
                  {patient.notes}
                </div>
              </div>
            )}

            {/* ============================================================
                FOOTER
            ============================================================ */}
            <div className="mt-6 pt-4 border-t border-stone-300 text-center report-footer">
              {profile.reportFooter && (
                <p className="text-xs text-stone-500 italic mb-2">{profile.reportFooter}</p>
              )}
              <p className="text-xs text-stone-400">
                Generated on: {formatDateTime()}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Doctor: {profile.doctorName || '—'} · Synthesis Repertory — Updated Version by Dr. Pradip
              </p>
            </div>
          </div>
        </div>

        {/* Toggle matrix — NOT printed */}
        <div className="px-4 py-2 border-t border-stone-200 bg-stone-50 no-print-bar">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="text-xs hover:underline"
            style={{ color: '#124C3B' }}
          >
            {showMatrix ? 'Hide' : 'Show'} Detailed Rubric/Remedy Matrix
          </button>
        </div>
      </div>

      {/* ============================================================
          PRINT STYLES — A4 optimized, hides all website UI
      ============================================================ */}
      <style jsx global>{`
        @media print {
          /* Hide EVERYTHING on the page */
          body * {
            visibility: hidden !important;
          }

          /* Show only the report content */
          .print-only-content,
          .print-only-content * {
            visibility: visible !important;
          }

          /* Position report at top-left of page */
          .print-only-content {
            position: absolute !important;
            left: 0 !important;
            top: 0 !important;
            width: 100% !important;
            max-height: none !important;
            overflow: visible !important;
            padding: 15mm !important;
            background: white !important;
          }

          /* Hide modal overlay, header bar, toggle bar */
          .no-print-modal,
          .no-print-modal-inner,
          .no-print-bar,
          .no-print-toggle,
          .no-print-clickable {
            display: none !important;
          }

          /* Remove shadows and borders from modal */
          .print-only-content {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
          }

          /* A4 page setup */
          @page {
            size: A4 !important;
            margin: 10mm !important;
          }

          /* Table styling for print */
          .results-table,
          .rubrics-table,
          .matrix-table {
            width: 100% !important;
            font-size: 9pt !important;
            page-break-inside: auto !important;
          }

          .results-table tr,
          .rubrics-table tr {
            page-break-inside: avoid !important;
          }

          /* Grade badges keep colors in print */
          .grade-badge {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Ensure colors print */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

          /* Remove scrollbars */
          ::-webkit-scrollbar {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}
