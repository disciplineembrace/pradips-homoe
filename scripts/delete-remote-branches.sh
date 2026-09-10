#!/bin/bash
# Delete all remote branches except main and master.
# Run from /home/z/my-project with a valid GitHub token in the remote URL.
set -e
cd /home/z/my-project

# Get list of remote branches (excluding main, master, and HEAD pointer)
BRANCHES=$(git branch -r | grep -v "origin/main" | grep -v "origin/master" | grep -v "HEAD ->" | sed 's|^[[:space:]]*origin/||' | sed 's|[[:space:]]*$||')

TOTAL=$(echo "$BRANCHES" | wc -l)
echo "Deleting $TOTAL remote branches..."
echo ""

COUNT=0
FAILED=0
echo "$BRANCHES" | while read -r branch; do
  if [ -z "$branch" ]; then continue; fi
  COUNT=$((COUNT + 1))
  # Delete the remote branch using git push with --delete
  # This is faster than `git branch -r -D` which only deletes local refs
  RESULT=$(git push origin --delete "$branch" 2>&1) || true
  if echo "$RESULT" | grep -qi "error\|fatal"; then
    echo "[$COUNT/$TOTAL] FAILED: $branch"
    echo "  $RESULT" | head -2
    FAILED=$((FAILED + 1))
  else
    echo "[$COUNT/$TOTAL] Deleted: $branch"
  fi
done

echo ""
echo "Done. Failed: $FAILED"
