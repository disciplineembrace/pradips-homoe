---
Task ID: 150
Agent: main
Task: Remove floating "← Dashboard" button from Synthesis Updated section only, without affecting bottom navigation, dashboard page, or any other functionality.

Work Log:
- Located floating button at lines 1006-1014 in `/home/z/my-project/src/app/synthesis/page.tsx` (inside `{view !== 'dashboard' && (...)}` JSX block with `className="fixed bottom-4 right-4 ..."` and label "← Dashboard").
- Verified `setView('dashboard')` is also called from 4 other non-floating locations (header `≡` button at L493, two "← Back" buttons at L869 & L914, and bottom-nav "Home" at L958) — safe to remove only the floating one.
- Removed the entire JSX block (comment "BACK TO TOP BUTTON", the `{view !== 'dashboard' && (...)}` conditional, and the `<button>` element) via a single Edit operation, leaving no leftover empty wrapper, shadow, or invisible clickable area.
- Confirmed bottom navigation (Home / Chapters / Search / Case / More) at L954-962 is untouched.
- Confirmed Dashboard view rendering (L389 `view === 'dashboard'`) and Dashboard route are untouched.
- Grep verified no remaining `fixed bottom-4 right-4` or `← Dashboard` patterns inside Synthesis section.
- Ran project-level `npx tsc --noEmit` — no TypeScript errors for synthesis/page.tsx.

Stage Summary:
- Floating "← Dashboard" button removed from Synthesis Updated section only.
- No global CSS, no shared-component modifications, no other section changes.
- Bottom navigation, header buttons, "← Back" buttons, and Dashboard view/route all preserved.
- Production-ready, no data loss, no function changes outside this exact button removal.

---
Task ID: 151
Agent: main
Task: Add Edit, Share and Delete actions to Saved Cases in Synthesis Updated section only. Keep Open working. Confirm deletes. Share via PDF. Remove floating Dashboard overlay (already removed in Task 150). No changes to any other section, source data, or function.

Work Log:
- Read existing saved-cases UI in `/home/z/my-project/src/app/synthesis/page.tsx` (history view block) and storage helpers in `storage.ts`. Confirmed `loadCaseById`, `saveCase` (upsert), `deleteCase`, `loadCases` already exist — no DB changes needed.
- Added 5 lightweight SVG icons to `components.tsx`: `Eye`, `Pencil`, `Share`, `Trash`, `MoreVertical`. All use `stroke="currentColor"` so caller controls color via Tailwind text-* classes. Default size 16. No new icon library added.
- Created new file `/home/z/my-project/src/app/synthesis/case-actions.tsx` exporting `EditCaseModal` and `DeleteConfirmDialog`:
  - `EditCaseModal`: editable fields = patientName, age, sex, date, contact, notes + per-rubric toggle/weight/remove. CaseNo, id, createdAt, repertorizedAt are read-only/locked. Results table is read-only summary (Top 10). Loading state "Loading Case..." on open, "Saving Changes..." on save. ESC cancels. Click-outside cancels (when not saving). Save/Cancel buttons in footer.
  - `DeleteConfirmDialog`: title "Delete Saved Case?", exact message "Are you sure you want to delete this case? This action cannot be undone." plus clarification that source data is untouched. Cancel + Delete Case buttons. "Deleting Case..." spinner. ESC cancels. Click-outside cancels (when not deleting). Case ID shown for verification.
- Modified `page.tsx`:
  - Imported `loadCaseById`, `EditCaseModal`, `DeleteConfirmDialog`.
  - Added state: `menuOpenCaseId`, `editingCase`, `confirmingDeleteId`, `reportCase`, `caseActionLoading` (per-case+per-action), `toast` (with auto-dismiss timer).
  - Added helpers: `showToast`, `setCaseAction`, `isCaseActionLoading`.
  - Rewrote `handleOpenCase` to do defensive `loadCaseById` verification, persist as active session case (no duplicate saved case created), show toast, guard against double-click.
  - Added `handleEditCase`, `handleSaveEditedCase` (locks id/createdAt/repertorizedAt/caseNo), `handleShareCase` (verifies case has results, then opens ReportSheet for that exact case with 350ms "Preparing Case Report..." feedback), `handleRequestDelete` (opens confirm dialog), `handleConfirmDelete` (defensive re-verify, single-submit guard, removes only selected case).
  - Rewrote Saved Cases card action row: now `[Open] [⋮]` where ⋮ opens a dropdown with Edit / Share / Delete (Delete in red). Open button shows spinner when loading. Share/Save show inline overlay spinner on the card.
  - Wired up modals at end of component: `<EditCaseModal>`, `<DeleteConfirmDialog>`, `<ReportSheet>` (when `reportCase` set), and a global `<Toast>` (bottom-center, success=green, error=red, info=stone).
  - Added `.no-print-toast { display: none !important; }` inside existing print-style block so toasts never appear in shared PDFs.
- Verified floating "← Dashboard" button remains removed (Section #10 of spec) — grep returns no matches.
- TypeScript: `npx tsc --noEmit` shows zero errors for any synthesis file (verified twice).
- Runtime: booted dev server on port 3099, `GET /synthesis` returned HTTP 200, no errors/warnings in dev log.
- All bottom navigation (Home / Chapters / Search / Case / More), menubar, dashboard, other sections, source rubrics, remedies, grades, repertory relationships, and other users' data untouched.

Stage Summary:
- Saved Cases in Synthesis Updated now has 4 working actions per case: Open, Edit, Share, Delete.
- Open loads the exact case (patient + rubrics + weights + notes + results) without creating a duplicate.
- Edit opens a modal with editable patient/rubric fields, Save/Cancel buttons, "Loading Case..." / "Saving Changes..." spinners, success toast.
- Share opens the existing ReportSheet (which already has Print / Download PDF / native print dialog) scoped to that exact case — excludes menubar, bottom nav, and toast from the printed PDF.
- Delete requires a confirmation dialog ("Delete Saved Case?" / Cancel / Delete Case), single-submit guarded, removes only the selected case, success toast.
- All actions are single-submit guarded, have loading states, and show toast feedback.
- No source data, no other section, no other users' data, no global CSS, no shared component modified.
- Floating "← Dashboard" button stays removed. Bottom navigation unchanged.
- Production-ready, no data loss.

