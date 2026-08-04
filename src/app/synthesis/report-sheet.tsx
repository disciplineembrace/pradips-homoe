'use client';
/// Report Sheet — professional repertorization report with print/PDF support
import { useState, useEffect } from 'react';
import {
  PatientDetails, SelectedRubric, RepertorizationResult, DoctorProfile,
  GRADE_COLORS, PRINT_GRADE_COLORS, sanitizeFilename,
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

  // Print handler — opens print dialog
  function handlePrint() {
    window.print();
  }

  // Download PDF — uses browser's print-to-PDF
  function handleDownloadPDF() {
    // Set document title for PDF filename
    const originalTitle = document.title;
    const filename = `Repertorization-Case-${sanitizeFilename(patient.caseNo || 'draft')}-${sanitizeFilename(patient.date || new Date().toISOString().split('T')[0])}`;
    document.title = filename;
    window.print();
    document.title = originalTitle;
  }

  // Calculate summary stats
  const enabledRubrics = rubrics.filter(r => r.enabled);
  const totalRubrics = enabledRubrics.length;
  const topRemedy = results[0];

  // Build comparison matrix data
  const matrixRemedies = results.slice(0, 15); // Top 15 remedies
  const enabledRubricIds = enabledRubrics.map(r => r.symptomId);

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-2 md:p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header — NOT printed */}
        <div className="px-4 py-2.5 border-b border-stone-200 bg-stone-50 flex items-center justify-between no-print">
          <h2 className="font-serif text-lg text-[#173B2D]">Repertorization Report Preview</h2>
          <div className="flex gap-2">
            <button
              onClick={handlePrint}
              className="px-3 py-1.5 text-xs bg-stone-200 text-stone-700 rounded font-semibold hover:bg-stone-300"
            >
              🖨 Print
            </button>
            <button
              onClick={handleDownloadPDF}
              className="px-3 py-1.5 text-xs bg-[#173B2D] text-white rounded font-semibold hover:bg-[#0f2a20]"
            >
              📄 Download PDF
            </button>
            <button onClick={onClose} className="text-stone-400 hover:text-stone-600 text-xl px-2">✕</button>
          </div>
        </div>

        {/* Report Content — printable */}
        <div className="overflow-y-auto p-6 md:p-8 flex-1 print-area" id="report-content">
          <div className="max-w-[210mm] mx-auto">
            {/* ============================================================
                REPORT HEADER — Doctor/Clinic branding
            ============================================================ */}
            <div className="text-center pb-4 border-b-2 border-[#173B2D]">
              {profile.logo && (
                <img src={profile.logo} alt="" className="w-20 h-20 mx-auto mb-2 object-contain" />
              )}
              {profile.clinicName && (
                <div className="font-serif text-xl md:text-2xl font-bold text-[#173B2D]">{profile.clinicName}</div>
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
            <div className="text-center my-4">
              <h1 className="font-serif text-lg md:text-xl font-bold text-[#173B2D] uppercase tracking-wider">
                Repertorization Sheet
              </h1>
              <div className="text-xs text-stone-500 mt-1">Synthesis Repertory — Updated Version by Dr. Pradip</div>
            </div>

            {/* ============================================================
                PATIENT DETAILS
            ============================================================ */}
            <div className="mb-4">
              <div className="text-xs font-bold text-[#173B2D] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Patient Details
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-1 text-sm">
                <div><span className="text-stone-500 font-medium">Patient Name:</span> <span className="font-semibold text-stone-800">{patient.patientName || '—'}</span></div>
                <div><span className="text-stone-500 font-medium">Case No:</span> <span className="font-semibold text-stone-800">{patient.caseNo || '—'}</span></div>
                <div><span className="text-stone-500 font-medium">Date:</span> <span className="font-semibold text-stone-800">{patient.date || '—'}</span></div>
                <div><span className="text-stone-500 font-medium">Age:</span> <span className="font-semibold text-stone-800">{patient.age || '—'}</span></div>
                <div><span className="text-stone-500 font-medium">Sex:</span> <span className="font-semibold text-stone-800">{patient.sex || '—'}</span></div>
                {patient.contact && <div><span className="text-stone-500 font-medium">Contact:</span> <span className="font-semibold text-stone-800">{patient.contact}</span></div>}
              </div>
            </div>

            {/* ============================================================
                SELECTED RUBRICS
            ============================================================ */}
            <div className="mb-4">
              <div className="text-xs font-bold text-[#173B2D] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Selected Rubrics ({totalRubrics})
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="border border-stone-200 px-2 py-1 text-left text-stone-600 w-8">#</th>
                    <th className="border border-stone-200 px-2 py-1 text-left text-stone-600">Rubric Path</th>
                    <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 w-16">Weight</th>
                    <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 w-20">Remedies</th>
                  </tr>
                </thead>
                <tbody>
                  {enabledRubrics.map((sr, idx) => (
                    <tr key={sr.symptomId}>
                      <td className="border border-stone-200 px-2 py-1 text-stone-500">{idx + 1}</td>
                      <td className="border border-stone-200 px-2 py-1 text-stone-800">{sr.path}</td>
                      <td className="border border-stone-200 px-2 py-1 text-center font-mono font-bold text-blue-700">{sr.weight}</td>
                      <td className="border border-stone-200 px-2 py-1 text-center text-stone-600">{sr.remedyCount}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* ============================================================
                REPERTORIZATION ANALYSIS — RESULTS TABLE
            ============================================================ */}
            <div className="mb-4">
              <div className="text-xs font-bold text-[#173B2D] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Repertorization Analysis — Remedy Ranking
              </div>
              <table className="w-full text-xs border-collapse">
                <thead>
                  <tr className="bg-stone-100">
                    <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 w-10">Rank</th>
                    <th className="border border-stone-200 px-2 py-1 text-left text-stone-600">Remedy</th>
                    <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 w-14">Score</th>
                    <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 w-16">Coverage</th>
                    <th className="border border-stone-200 px-2 py-1 text-center text-stone-600 w-16">Σ Sym</th>
                    <th className="border border-stone-200 px-2 py-1 text-left text-stone-600">Grade Breakdown</th>
                  </tr>
                </thead>
                <tbody>
                  {results.slice(0, 25).map((r, idx) => {
                    const gradeCounts: Record<number, number> = {};
                    let totalGrade = 0;
                    r.rubrics.forEach(rb => {
                      gradeCounts[rb.grade] = (gradeCounts[rb.grade] || 0) + 1;
                      totalGrade += rb.grade;
                    });
                    return (
                      <tr key={r.abbrev} className={idx < 3 ? 'bg-stone-50' : ''}>
                        <td className="border border-stone-200 px-2 py-1 text-center font-mono text-stone-500">{idx + 1}</td>
                        <td className="border border-stone-200 px-2 py-1">
                          <span className="font-mono font-bold text-[#173B2D]">{r.abbrev}</span>
                          <span className="text-stone-400 ml-1 text-xs">{r.full}</span>
                        </td>
                        <td className="border border-stone-200 px-2 py-1 text-center font-bold text-[#173B2D]">{r.totalScore}</td>
                        <td className="border border-stone-200 px-2 py-1 text-center">
                          <span className={`px-1.5 py-0.5 rounded text-xs font-semibold ${
                            r.coverageCount === r.coverageTotal ? 'bg-green-100 text-green-700' : 'bg-stone-100 text-stone-600'
                          }`}>
                            {r.coverage}
                          </span>
                        </td>
                        <td className="border border-stone-200 px-2 py-1 text-center text-stone-600">{r.coverageCount}</td>
                        <td className="border border-stone-200 px-2 py-1">
                          <div className="flex gap-1 flex-wrap">
                            {[4, 3, 2, 1].map(g => (
                              gradeCounts[g] ? (
                                <span
                                  key={g}
                                  className="px-1 py-0.5 rounded text-xs font-mono font-bold"
                                  style={{
                                    color: PRINT_GRADE_COLORS[g],
                                    backgroundColor: g === 4 ? '#FEE2E2' : g === 3 ? '#DCFCE7' : g === 2 ? '#DBEAFE' : '#F5F5F4',
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
                DETAILED MATRIX (if toggled)
            ============================================================ */}
            {showMatrix && matrixRemedies.length > 0 && (
              <div className="mb-4">
                <div className="text-xs font-bold text-[#173B2D] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                  Detailed Rubric / Remedy Matrix
                </div>
                <div className="overflow-x-auto">
                  <table className="text-xs border-collapse min-w-full">
                    <thead>
                      <tr className="bg-stone-100">
                        <th className="border border-stone-200 px-2 py-1 text-left text-stone-600 sticky left-0 bg-stone-100">Remedy</th>
                        {enabledRubrics.map(sr => (
                          <th key={sr.symptomId} className="border border-stone-200 px-1 py-1 text-center text-stone-600 max-w-[80px]">
                            <div className="truncate text-xs" title={sr.path}>{sr.path.split(' - ').pop()}</div>
                          </th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {matrixRemedies.map(r => (
                        <tr key={r.abbrev} className="hover:bg-stone-50">
                          <td className="border border-stone-200 px-2 py-1 font-mono font-bold text-[#173B2D] sticky left-0 bg-white">
                            {r.abbrev}
                          </td>
                          {enabledRubrics.map(sr => {
                            const rubricData = r.rubrics.find(rb => rb.symptomId === sr.symptomId);
                            const grade = rubricData?.grade;
                            return (
                              <td
                                key={sr.symptomId}
                                className="border border-stone-200 px-1 py-1 text-center font-mono font-bold text-xs"
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
            <div className="mb-4">
              <div className="text-xs font-bold text-[#173B2D] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                Remedy Grade Legend
              </div>
              <div className="flex gap-3 text-xs flex-wrap">
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded inline-flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PRINT_GRADE_COLORS[4] }}>4</span>
                  <span className="text-stone-600">Grade 4 (Red)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded inline-flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PRINT_GRADE_COLORS[3] }}>3</span>
                  <span className="text-stone-600">Grade 3 (Dark Green)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded inline-flex items-center justify-center text-white font-bold text-xs" style={{ backgroundColor: PRINT_GRADE_COLORS[2] }}>2</span>
                  <span className="text-stone-600">Grade 2 (Dark Blue)</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-4 h-4 rounded inline-flex items-center justify-center font-bold text-xs" style={{ backgroundColor: '#F5F5F4', color: PRINT_GRADE_COLORS[1] }}>1</span>
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
              <div className="mb-4">
                <div className="text-xs font-bold text-[#173B2D] uppercase tracking-wider mb-2 border-b border-stone-300 pb-1">
                  Notes
                </div>
                <div className="text-xs text-stone-700 whitespace-pre-wrap p-2 bg-stone-50 rounded">
                  {patient.notes}
                </div>
              </div>
            )}

            {/* ============================================================
                FOOTER
            ============================================================ */}
            <div className="mt-6 pt-4 border-t border-stone-300 text-center">
              {profile.reportFooter && (
                <p className="text-xs text-stone-500 italic mb-2">{profile.reportFooter}</p>
              )}
              <p className="text-xs text-stone-400">
                Generated on: {new Date().toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </p>
              <p className="text-xs text-stone-400 mt-1">
                Doctor: {profile.doctorName || '—'} · Synthesis Repertory — Updated Version by Dr. Pradip
              </p>
            </div>
          </div>
        </div>

        {/* Toggle matrix — NOT printed */}
        <div className="px-4 py-2 border-t border-stone-200 bg-stone-50 no-print">
          <button
            onClick={() => setShowMatrix(!showMatrix)}
            className="text-xs text-blue-600 hover:text-blue-800 hover:underline"
          >
            {showMatrix ? 'Hide' : 'Show'} Detailed Rubric/Remedy Matrix
          </button>
        </div>
      </div>
    </div>
  );
}
