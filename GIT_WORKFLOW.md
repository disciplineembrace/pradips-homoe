# Git Branch Workflow

## Branch Structure

| Branch | Purpose | Rules |
|--------|---------|-------|
| `main` | Production (live website) | Protected — no direct pushes, PR required |
| `master` | Development (all edits) | Free to commit, push, experiment |

## Workflow

```
1. git checkout master
2. Make changes (code, UI, features, fixes)
3. git add -A && git commit -m "Description"
4. git push origin master
5. Test on Vercel Preview Deployment
6. Create Pull Request: master → main
7. Merge PR (after verification)
8. Vercel auto-deploys main → Production
```

## Rules

### main (Production)
- ✅ Always stable
- ✅ Vercel Production Deployment uses this branch
- ❌ Never make direct edits or commits
- ❌ Never push directly
- ✅ Changes come ONLY through merge from master

### master (Development)
- ✅ All coding, editing, testing, debugging here
- ✅ Every commit pushed here first
- ✅ Vercel Preview Deployments created automatically
- ❌ Never replaces live website automatically

## Setup

```bash
# Configure branch protection (requires GH_TOKEN)
export GH_TOKEN='ghp_your_token'
bash setup-github-branches.sh
```

## Vercel Configuration

1. Go to: https://vercel.com/campus-nova-s-projects/pradips-homoe/settings/git
2. Production Branch: `main`
3. Preview Branches: `master` (and any feature branches)

## Quick Commands

```bash
# Switch to development
git checkout master

# Switch to production (view only — don't edit!)
git checkout main

# Create a feature branch from master
git checkout master
git checkout -b feature/new-feature

# Merge master into main (via PR on GitHub)
# Don't do this locally — use GitHub Pull Requests

# Sync main with master (after PR merge)
git checkout main
git pull origin main
git checkout master
git merge main
git push origin master
```
