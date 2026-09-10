# Task: Create 13 themed Next.js pages + useReaderFeatures hook

## Summary

Created 13 page files + 1 hook + 2 supporting API routes + 1 lib data file for the Pradip's Homoe homeopathy library app. All pages follow the Forest Green (#173B2D) / Gold (#C8A24A) / Ivory (#F5EFE0) / Sage (#7C8F6E) theme, use serif headings, white cards with shadows, and respect the shared Navbar/Footer + auth-check pattern.

## Files Created

### Hook
- `src/hooks/use-reader-features.ts` — localStorage-backed hook with bookmarks, favorites, notes, history, highlights. Exports: `toggleBookmark`, `isBookmarked`, `removeBookmark`, `toggleFavorite`, `isFavorite`, `removeFavorite`, `addNote`, `removeNote`, `updateNote`, `getNotes`, `addHistory`, `clearHistory`, `addHighlight`, `removeHighlight`, `getHighlights`, `hydrated`. Listens to `storage` events for cross-tab sync.

### Pages (13)
1. `src/app/materia-medica/page.tsx` — Author tabs (All, Boericke, Phatak, Murphy, Kent, Allen, Sankaran, Farrington, Boeger, Mathur), A-Z alphabet filter, search, 3-col remedy grid, ★/🔖 buttons, pagination. Uses `/api/remedies`.
2. `src/app/repertory/page.tsx` — Author tabs (Kent, Phatak, Murphy, Boericke) + Synthesis link, search, 2-col rubric cards with remedy chips, ★/🔖, pagination. Uses `/api/rubrics`.
3. `src/app/therapeutics/page.tsx` — Two-column layout (4/8 grid): left sidebar disease list (click-to-select), right detail panel with subcategories & remedies chips. A-Z + search + ★/🔖 on detail. Uses `/api/therapeutics`.
4. `src/app/organon/page.tsx` — 10 static chapter cards (Introduction, Physician's Mission, Knowledge of Physician, Knowledge of Medicines, Vital Force, Law of Similars, Case Taking, Potentisation, Acute & Chronic, Obstacles), dark-green Hahnemann quote card, search, 🔖 bookmark buttons.
5. `src/app/segal/page.tsx` — Search box, dark-green Segal quote card, "Coming Soon" placeholder.
6. `src/app/predictive/page.tsx` — Book grid → click book → chapter list + full chapter text + Prev/Next. Uses `/api/predictive`.
7. `src/app/synthesis/page.tsx` — Search box, dashed-border placeholder, quick-link cards to other repertories.
8. `src/app/analysis/page.tsx` — Symptom textarea + Analyze button → splits input into keywords (with stop-word filter), queries `/api/search` per keyword in parallel, aggregates remedy matches into ranked list with score bars.
9. `src/app/books/page.tsx` — "Full E-Books" section (from `/api/books`) with clickable cards + "Reference Catalog" section with 12 static entries linking to /materia-medica, /therapeutics, /predictive.
10. `src/app/books/[id]/page.tsx` — Full reader: top bar (Back, Contents dropdown, Search-within-book, Bookmark, A−/A+, theme toggle), chapter content with scroll progress, bottom bar (Prev/Next + progress bar), light/dark/sepia themes + font size saved to `ph_reader_settings` localStorage.
11. `src/app/search/page.tsx` — Wrapped in `<Suspense>` (uses `useSearchParams`), search box, filter tabs (All/Remedies/Rubrics with counts), results list linking to remedy/rubric pages. Uses `/api/search?q=`.
12. `src/app/account/page.tsx` — Profile from `/api/me` (name, email, role badge, status, last login, created date, last PIN), quick links to dashboard/settings, Logout button.
13. `src/app/settings/page.tsx` — Appearance (font family, font size, line height, reader width, brightness slider, dark mode checkbox, theme select, language select) + Data Management (export bookmarks/favorites/notes, clear cache). All saved to `ph_settings` localStorage key.

### Supporting API routes & lib
- `src/app/api/books/route.ts` — list books (with chapter metadata only)
- `src/app/api/books/[id]/route.ts` — full book with chapter content
- `src/lib/books-data.ts` — curated in-memory book dataset: Organon of Medicine, Kent's Lectures, Sankaran's Sensation, Hering's Lesser Writings, Sommer's Intro, Boger's Method.

## Conventions Followed

- All pages are `'use client'`.
- Auth check via `fetch('/api/auth/session')` — if not `d.authenticated`, `router.push('/login')`. `d.role` used for admin role check (no `d.user.role`).
- `setSession(d)` called IMMEDIATELY after auth check; additional data loads run in background with `.catch()`.
- Themed loading spinner (forest green `#173B2D` ring on ivory `#F5EFE0`) shown while `session === null`.
- Shared `Navbar` and `Footer` components imported from `@/components/layout/`.
- Exact theme colors used: `bg-[#F5EFE0]` page, `bg-[#173B2D]` headers, `text-[#C8A24A]` accents, `text-[#173B2D]` headings, `text-[#7C8F6E]` labels, `font-serif` for headings.
- Sticky-footer layout via `min-h-screen flex flex-col` on every page (Footer pinned via `mt-auto` on the Footer component).
- ★ favorite and 🔖 bookmark buttons use `useReaderFeatures` hook, with `e.preventDefault(); e.stopPropagation()` so they don't trigger parent link navigation.

## Verification

- `bun run lint` — passes (only a pre-existing `.eslintignore` migration warning, no actual lint errors).
- Dev server (`bun run dev`) starts cleanly with no compile errors; `dev.log` shows `✓ Ready in 1472ms`.

## Notes for Future Agents

- The `useReaderFeatures` hook keys its data under `ph_bookmarks`, `ph_favorites`, `ph_notes`, `ph_history`, `ph_highlights` in localStorage. It also dispatches a synthetic `storage` event on writes so same-tab listeners re-hydrate immediately.
- The book reader at `/books/[id]` saves its settings under `ph_reader_settings` (separate from `/settings`'s `ph_settings` key) so they don't conflict.
- The `analysis` page uses stop-word filtering to avoid polluting the search with common English words.
