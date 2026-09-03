# Deployment Status Report — Pradip's Homoe

**Date:** 2026-08-01
**Live URL:** https://pradips-homoe.vercel.app/
**GitHub:** https://github.com/disciplineembrace/pradips-homoe

---

## ✅ Live Website Status

| Endpoint | Status | Response Time |
|----------|--------|---------------|
| Home (`/`) | ✅ HTTP 200 | 0.12s |
| Login (`/login`) | ✅ HTTP 200 | — |
| Dashboard (`/dashboard`) | ✅ HTTP 200 | — |
| About (`/about`) | ✅ HTTP 200 | — |
| API Remedies (`/api/remedies`) | ✅ HTTP 401 (auth required) | — |

**Live website is fully operational.**

---

## 📊 Current Live Data (OLD — before rebuild)

| Metric | Value |
|--------|-------|
| Total remedies | 4,493 |
| Authors | 10 (Murphy, Boericke, Boeger, Phatak, Farrington, Dubey, Allen, Mathur, Kent, Sankaran) |
| Phatak remedies | 543 (with duplicates and OCR errors) |
| Sankaran remedies | 148 (includes non-remedy entries like "ACKNOWLEDGEMENT") |
| Rubrics | 81,463 |
| Therapeutic formulas | 408 |
| Predictive chapters | 23 |

---

## 📊 Local Data (NEW — ready to deploy)

| Metric | Value |
|--------|-------|
| Total remedies | 4,299 |
| Authors | 10 (same) |
| Phatak remedies | **402** (clean, deduplicated, from digital PDF) |
| Sankaran remedies | **95** (clean, matches book's TOC exactly) |
| Other authors | 3,802 (preserved unchanged) |
| File size | 26.1 MB (under Vercel 100MB limit) |

### Phatak Rebuild Summary
- **Source:** `Phatak's Materia Medica.pdf` (806 pages, digital-native PDF)
- **Extraction:** 402 remedies (matches book's Table of Contents)
- **Content:** 1,135,989 characters preserved
- **Quality:** Clean text, no OCR errors, proper section detection
- **Sections:** Generalities, Mind, Head, Eyes, Ears, Nose, Face, Mouth, Throat, Stomach, Abdomen, Rectum, Urinary, Female, Male, Respiratory, Chest, Heart, Back, Extremities, Skin, Sleep, Fever, Worse, Better, Rubrics, Related, Complementary

### Sankaran Rebuild Summary
- **Source:** `The Soul of Remedies - Rajan Sankaran(New).pdf` (417 pages)
- **Extraction:** 95 remedies (matches book's alphabetical arrangement)
- **Content:** 380,928 characters preserved
- **Quotes:** 92/95 remedies have italic "soul of remedy" quotes
- **Sections:** Rubrics, Physical concomitants, Phatak Rubrics
- **Cleanup:** Removed non-remedy entries (ACKNOWLEDGEMENT, etc.)

---

## 🎨 RemedyReader Component Updates

The `RemedyReader.tsx` component has been updated to:
1. **Added Sankaran section markers** to `KNOWN_HEADINGS` set:
   - `Rubrics`, `Phatak Rubrics`, `Physical concomitants`
   - `Source`, `Kingdom`, `Group`, `Miasm`, `Central Theme`, `Soul of the Remedy`
   - `Basic Delusion`, `Inner Perception`, `Remedy Situation`, etc.

2. **Added italic quote rendering** for Sankaran remedies:
   - Detects lines starting with curly quotes (`"` or `"`)
   - Renders as centered, serif italic text
   - Elegant styling for the "soul of remedy" essence quote

3. **Section headings** continue to render as:
   - Dark medical red (`#8B0000`)
   - Bold serif font
   - With bottom border separator

---

## 🗄️ Database Configuration

### Neon PostgreSQL (Production)
- **Provider:** Neon (serverless PostgreSQL)
- **Schema:** `prisma/schema.prisma` with `provider = "postgresql"`
- **Connection:** Via `DATABASE_URL` env var on Vercel
- **Status:** ✅ Configured and operational on live site

### Supabase (User Features)
- **Module:** `@supabase/supabase-js` (installed)
- **Client:** `database/supabase/client/supabase-client.ts`
- **Features:** Bookmarks, notes, reading progress, AI chat history
- **Env vars required on Vercel:**
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `SUPABASE_SERVICE_ROLE_KEY`
- **Status:** ✅ Module installed, ready for env var configuration
- **Fallback:** If env vars not set, falls back to localStorage (UI remains functional)

### Local Development
- **Database:** SQLite at `file:/home/z/my-project/db/custom.db`
- **Status:** Working for local dev (production uses Neon)

---

## 🚀 Deployment Status

### Git Commits Ready (NOT YET PUSHED)
```
b2cc79f chore: exclude backup files from Vercel deployment
91ccac0 feat(MM): Rebuild Phatak (402) + Sankaran Soul of Remedies (95) from clean PDFs
2e09fc3 Global Premium Remedy Reading Component (#87) [already on live]
```

### ⚠️ CANNOT PUSH — No Git Credentials
The environment does not have GitHub credentials (`GH_TOKEN`) or Vercel CLI token configured.

**To deploy the changes, the user needs to:**

#### Option 1: Push via GitHub (Recommended)
```bash
cd /home/z/my-project
export GH_TOKEN='your_github_personal_access_token'
bash push-to-github.sh
```
This will push to GitHub, which auto-triggers Vercel deployment.

#### Option 2: Deploy via Vercel CLI
```bash
cd /home/z/my-project
vercel login
vercel --prod
```

---

## ✅ Build Verification

- **Next.js build:** ✅ Succeeds
- **All routes generated:** ✅ 30+ routes (static + dynamic)
- **File size:** ✅ 26.1 MB (under 100MB Vercel limit)
- **No build errors:** ✅ Clean build
- **@supabase/supabase-js:** ✅ Installed (was missing, now available)

---

## 📋 What's Changed (Local — pending push)

### Files Modified:
1. **`data/remedies.json`** — Phatak (402) + Sankaran (95) replaced with clean extractions
2. **`src/components/RemedyReader.tsx`** — Added Sankaran sections + italic quote rendering
3. **`package.json`** — Added `@supabase/supabase-js` dependency
4. **`package-lock.json`** — Updated lockfile
5. **`.vercelignore`** — Excluded backup files from deployment

### Files Added:
1. **`scripts/rebuild_phatak_sankaran.py`** — Combined extraction script
2. **`data/remedies_backup_pre_rebuild.json`** — Backup of previous data

---

## 🎯 Next Steps for the User

1. **Push to GitHub** (triggers auto-deploy):
   ```bash
   export GH_TOKEN='ghp_your_token_here'
   bash push-to-github.sh
   ```

2. **Verify deployment** at https://pradips-homoe.vercel.app/
   - Login with admin credentials
   - Browse Materia Medica → Phatak (should show 402 clean remedies)
   - Browse Materia Medica → Sankaran (should show 95 clean remedies with italic quotes)

3. **Configure Supabase env vars** on Vercel (if not already done):
   - Go to Vercel Project Settings → Environment Variables
   - Add: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`

4. **Verify database connections:**
   - Neon PostgreSQL: Check `/admin` page loads user list
   - Supabase: Check that bookmarks/notes persist after login

---

## ⚠️ Important Notes

- **No data loss:** All other authors (3,802 remedies) preserved unchanged
- **Backup created:** `data/remedies_backup_pre_rebuild.json` (17.7 MB)
- **Live site is STABLE:** The live site continues running with OLD data until push
- **Local build verified:** Next.js production build succeeds with all changes
- **No breaking changes:** Existing functionality (auth, search, navigation) unaffected
