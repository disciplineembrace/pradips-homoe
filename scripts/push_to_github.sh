#!/bin/bash
# Push pradips-homoe.html to a new GitHub repo
#
# USAGE:
#   1. First REVOKE the leaked token at https://github.com/settings/tokens
#   2. Create a NEW token at https://github.com/settings/tokens/new
#      - Note: "Pradip's Homoe push"
#      - Expiration: 30 days
#      - Scope: ✅ repo (full control of private repositories)
#      - Copy the new ghp_... token
#   3. Set environment variables in your terminal BEFORE running this script:
#        export GH_TOKEN='ghp_YOUR_NEW_TOKEN_HERE'
#        export GH_USER='your-github-username'
#        export GH_REPO='pradips-homoe'   # optional, defaults to this
#   4. Run: bash /home/z/my-project/scripts/push_to_github.sh
#
# The script will:
#   - Create a new public repo named $GH_REPO under your account (via GitHub API)
#   - Init a local git repo in /home/z/my-project/download
#   - Push pradips-homoe.html + preview screenshots
#   - Enable GitHub Pages on the main branch

set -e

# === Validate env vars ===
if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: GH_TOKEN env var not set."
  echo "Run: export GH_TOKEN='ghp_YOUR_TOKEN'"
  exit 1
fi
if [ -z "$GH_USER" ]; then
  echo "ERROR: GH_USER env var not set."
  echo "Run: export GH_USER='your-github-username'"
  exit 1
fi
GH_REPO="${GH_REPO:-pradips-homoe}"

echo "==> Using GitHub user: $GH_USER"
echo "==> Repo name:         $GH_REPO"
echo "==> Token starts with: ${GH_TOKEN:0:7}..."
echo ""

# === Step 1: Create the repo via GitHub REST API ===
echo "==> Creating repository $GH_REPO (public)..."
HTTP_CODE=$(curl -sS -o /tmp/repo-create-response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d "{\"name\":\"$GH_REPO\",\"description\":\"Pradip's Homoe — Personal Digital Homeopathic Library (Boericke Pocket Manual parsed). Single-file PWA with search, notes, favorites, themes, offline support.\",\"public\":true,\"auto_init\":false}" \
  https://api.github.com/user/repos)

if [ "$HTTP_CODE" = "201" ]; then
  echo "    ✓ Repo created at https://github.com/$GH_USER/$GH_REPO"
elif [ "$HTTP_CODE" = "422" ]; then
  echo "    ! Repo already exists — will push to it"
else
  echo "    ✗ Failed to create repo (HTTP $HTTP_CODE)"
  cat /tmp/repo-create-response.json
  exit 1
fi
echo ""

# === Step 2: Init local git repo ===
cd /home/z/my-project/download

# Clean up any existing git state
rm -rf .git

echo "==> Initializing local git repo..."
git init -q
git config user.name "$GH_USER"
git config user.email "$GH_USER@users.noreply.github.com"

# Create a README for the repo
cat > README.md << 'EOF'
# Pradip's Homoe — Personal Digital Homeopathic Library

A single-file personal digital homeopathic library with 715 remedies
(687 from Boericke's Pocket Manual, parsed directly from the user's PDF)
and 45 sample rubrics.

## Features

- **6 books in one library** — Boericke / Phatak / Murphy × Materia Medica / Repertory
- **Universal full-text search** across all books (Any word / All words / Exact phrase / Partial)
- **Moon+ Reader-style reading experience** — 7 themes (Boericke Classic, Phatak Emerald,
  Murphy Burgundy, Light, Sepia, Dark, AMOLED Black), font controls, line spacing, margins,
  brightness, swipe navigation, reading timer, progress %, auto-resume
- **Smart bookmark system** — unlimited bookmarks, colored highlights (4 colors),
  underline, personal notes with categories (Clinical / Study / Remedy / Rubric)
- **Cross-reference** — one-tap jump between Materia Medica ↔ Repertory, remedy ↔ rubrics,
  related remedies
- **Offline support** — installable PWA, all data (notes, favorites, history, settings)
  stored locally in your browser
- **A–Z browse** with clickable alphabet and chapter filters
- **Reading statistics** — total time, day streak, per-remedy time
- **Daily quote** widget on the dashboard
- **Export/Import** all personal data as JSON backup

## Usage

Just open `pradips-homoe.html` in any modern browser. No server, no install,
no account required. All your notes and favorites stay private on your device.

To install as a PWA (mobile/desktop): open the file in Chrome/Edge, click
"Install" in the address bar or browser menu.

## Live version

If you're viewing this on GitHub Pages:
**https://YOUR_USERNAME.github.io/pradips-homoe/pradips-homoe.html**

## Data sources

- William Boericke, *Pocket Manual of Homoeopathic Materia Medica* (9th edition)
  — 687 remedies parsed from the user's own PDF copy
- S. R. Phatak, *Materia Medica Concordance* — placeholder entries (11)
- Robin Murphy, *Lotus Materia Medica* — placeholder entries (17)

The Phatak and Murphy texts remain as paraphrased placeholders until the
corresponding PDFs are uploaded.

## Copyright

Boericke's 9th edition is widely treated as out of copyright in many
jurisdictions. Modern editions of Phatak and Murphy may still be under
copyright — verify before any public sharing or commercial use. This
library is intended for private study only.
EOF

# Create a .gitignore to skip nothing important
cat > .gitignore << 'EOF'
# OS files
.DS_Store
Thumbs.db
# Editor files
*.swp
.vscode/
EOF

# Stage everything
git add pradips-homoe.html README.md .gitignore
# Also add screenshots if they exist
for png in preview-*.png; do
  [ -e "$png" ] && git add "$png"
done

# Commit
git commit -q -m "Add Pradip's Homoe personal digital homeopathic library

- 715 remedies (687 real Boericke from PDF + 28 placeholder Phatak/Murphy)
- 45 rubrics
- Single-file PWA with universal search, reader themes, notes, favorites,
  history, settings, reading stats, cross-reference, offline support
- Boericke text parsed from user's uploaded PDF (595 pages, 1.3 MB)"

echo "    ✓ Committed $(git log --oneline -1 | awk '{print $NF}')"
echo ""

# === Step 3: Push to GitHub ===
# Use the token in the remote URL (git will not log it)
# Use https:// with token authentication
REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/${GH_USER}/${GH_REPO}.git"

echo "==> Pushing to https://github.com/$GH_USER/$GH_REPO ..."
git branch -M main
git push -q -u "$REMOTE_URL" main 2>&1 | sed 's/x-access-token:[^@]*@/x-access-token:***@/g'

if [ $? -eq 0 ]; then
  echo "    ✓ Push successful"
else
  echo "    ✗ Push failed"
  exit 1
fi
echo ""

# === Step 4: Enable GitHub Pages on main branch ===
echo "==> Enabling GitHub Pages on main branch..."
HTTP_CODE=$(curl -sS -o /tmp/pages-response.json -w "%{http_code}" \
  -X POST \
  -H "Authorization: token $GH_TOKEN" \
  -H "Accept: application/vnd.github+json" \
  -d '{"source":{"branch":"main","path":"/"}}' \
  "https://api.github.com/repos/$GH_USER/$GH_REPO/pages")

if [ "$HTTP_CODE" = "201" ]; then
  echo "    ✓ GitHub Pages enabled"
  echo "    URL: https://$GH_USER.github.io/$GH_REPO/pradips-homoe.html"
elif [ "$HTTP_CODE" = "409" ] || [ "$HTTP_CODE" = "422" ]; then
  echo "    ! Pages already enabled or building..."
else
  echo "    ? Could not enable Pages automatically (HTTP $HTTP_CODE)"
  echo "      Enable manually: https://github.com/$GH_USER/$GH_REPO/settings/pages"
fi
echo ""

# === Done ===
echo "========================================"
echo "✓ All done!"
echo "========================================"
echo ""
echo "Repository:  https://github.com/$GH_USER/$GH_REPO"
echo "Live site:   https://$GH_USER.github.io/$GH_REPO/pradips-homoe.html"
echo "             (Pages takes ~1-2 min to build first time)"
echo ""
echo "REMINDER: Revoke this token at https://github.com/settings/tokens"
echo "          when you no longer need it."
