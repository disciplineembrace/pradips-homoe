#!/bin/bash
# Push Pradip's Homoe to GitHub
#
# USAGE:
#   1. Create a GitHub Personal Access Token at https://github.com/settings/tokens
#      - Scopes: repo (full control of private repositories)
#   2. export GH_TOKEN='ghp_your_token_here'
#   3. bash push-to-github.sh

set -e

if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: GH_TOKEN env var not set."
  echo "Create a token at https://github.com/settings/tokens (scope: repo)"
  echo "Then run: export GH_TOKEN='ghp_xxxxx'"
  exit 1
fi

GH_USER="disciplineembrace"
GH_REPO="pradips-homoe"
GH_EMAIL="disciplineembrace@users.noreply.github.com"

cd /home/z/my-project

# Configure git
git config user.name "$GH_USER"
git config user.email "$GH_EMAIL"

# Create the repo via GitHub API (if it doesn't exist)
echo "=== Creating GitHub repo (if not exists) ==="
curl -s -X POST "https://api.github.com/user/repos" \
  -H "Authorization: token $GH_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"$GH_REPO\",\"description\":\"Secure Next.js 16 homoeopathy library with PIN auth + Neon Postgres\",\"private\":false}" \
  | head -c 200
echo ""

# Update remote URL with token
git remote remove origin 2>/dev/null || true
git remote add origin "https://$GH_USER:$GH_TOKEN@github.com/$GH_USER/$GH_REPO.git"

# Push
echo ""
echo "=== Pushing to GitHub ==="
git push -u origin main

echo ""
echo "=== Done! ==="
echo "Repo: https://github.com/$GH_USER/$GH_REPO"
echo ""
echo "To connect Vercel to GitHub (for auto-deploy on push):"
echo "1. Go to https://vercel.com/campus-nova-s-projects/pradips-homoe/settings/git"
echo "2. Connect your GitHub repository"
echo "3. Future pushes to main will auto-deploy"
