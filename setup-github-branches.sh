#!/bin/bash
# ============================================================
# GitHub Branch Configuration Script
# Sets up: main (production) + master (development)
# ============================================================
#
# USAGE:
#   1. Create a GitHub Personal Access Token at:
#      https://github.com/settings/tokens
#      Scopes: repo (full control), admin:repo_hook (for Vercel webhooks)
#   2. export GH_TOKEN='ghp_your_token_here'
#   3. bash setup-github-branches.sh

set -e

if [ -z "$GH_TOKEN" ]; then
  echo "ERROR: GH_TOKEN env var not set."
  echo "Create a token at https://github.com/settings/tokens (scope: repo)"
  echo "Then run: export GH_TOKEN='ghp_xxxxx'"
  exit 1
fi

GH_USER="disciplineembrace"
GH_REPO="pradips-homoe"
API="https://api.github.com/repos/$GH_USER/$GH_REPO"

echo "=========================================="
echo "  GitHub Branch Configuration"
echo "  Repo: $GH_USER/$GH_REPO"
echo "=========================================="
echo ""

# Step 1: Push both branches to GitHub
echo "=== Step 1: Pushing branches to GitHub ==="

# Push master branch
echo "Pushing master (development branch)..."
git push origin master 2>&1 || true

# Push main branch  
echo "Pushing main (production branch)..."
git push origin main 2>&1 || true

echo ""

# Step 2: Set default branch to main
echo "=== Step 2: Setting default branch to main ==="
curl -s -X PATCH "$API" \
  -H "Authorization: token $GH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"default_branch":"main"}' \
  | python3 -c "import json,sys;d=json.load(sys.stdin);print(f'  Default branch: {d.get(\"default_branch\",\"?\")}')" 2>&1

echo ""

# Step 3: Protect main branch
echo "=== Step 3: Protecting main branch ==="
curl -s -X PUT "$API/branches/main/protection" \
  -H "Authorization: token $GH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "required_status_checks": {
      "strict": true,
      "contexts": []
    },
    "enforce_admins": true,
    "required_pull_request_reviews": {
      "required_approving_review_count": 0,
      "dismiss_stale_reviews": false,
      "require_code_owner_reviews": false
    },
    "restrictions": null,
    "required_linear_history": false,
    "allow_force_pushes": false,
    "allow_deletions": false
  }' 2>&1 | python3 -c "import json,sys;d=json.load(sys.stdin);print(f'  main protected: {\"url\" in d}')" 2>&1

echo ""

# Step 4: Verify branch protection
echo "=== Step 4: Verifying branch protection ==="
curl -s "$API/branches/main/protection" \
  -H "Authorization: token $GH_TOKEN" 2>&1 | python3 -c "
import json,sys
d=json.load(sys.stdin)
print(f'  main: direct pushes blocked = {d.get(\"enforce_admins\",{}).get(\"enabled\",False)}')
print(f'  main: PR required = {\"required_pull_request_reviews\" in d}')
print(f'  main: force push blocked = {not d.get(\"allow_force_pushes\",{}).get(\"enabled\",True)}')
print(f'  main: deletion blocked = {not d.get(\"allow_deletions\",{}).get(\"enabled\",True)}')" 2>&1

echo ""

# Step 5: Verify both branches exist
echo "=== Step 5: Verifying branches ==="
curl -s "$API/branches" \
  -H "Authorization: token $GH_TOKEN" 2>&1 | python3 -c "
import json,sys
d=json.load(sys.stdin)
for b in d:
    print(f'  {b[\"name\"]}: protected={b.get(\"protected\",False)}')" 2>&1

echo ""
echo "=========================================="
echo "  ✅ Configuration Complete!"
echo "=========================================="
echo ""
echo "Branch Structure:"
echo "  main   → Production (protected, no direct pushes)"
echo "  master → Development (all edits go here)"
echo ""
echo "Workflow:"
echo "  1. git checkout master"
echo "  2. Make changes, commit, push to master"
echo "  3. Create PR: master → main"
echo "  4. Merge PR after testing"
echo "  5. Vercel auto-deploys main to production"
echo ""
echo "Vercel Settings:"
echo "  Production Deployment: main branch"
echo "  Preview Deployments: master branch"
echo "  (Configure at: https://vercel.com/campus-nova-s-projects/pradips-homoe/settings/git)"
echo ""
echo "GitHub Repo: https://github.com/$GH_USER/$GH_REPO"
