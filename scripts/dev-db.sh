#!/bin/bash
# Switch Prisma provider between PostgreSQL (production) and SQLite (local dev).
#
# Usage:
#   bash scripts/dev-db.sh sqlite   # switch to SQLite for local dev
#   bash scripts/dev-db.sh postgres # switch back to PostgreSQL (production)
#
# When switching to SQLite, this script also runs `prisma db push` and
# `prisma generate` so the local DB is ready immediately.
#
# NOTE: Never commit the schema while it's set to "sqlite" — always
# switch back to "postgres" before pushing to GitHub.

set -e

SCHEMA="prisma/schema.prisma"

if [ ! -f "$SCHEMA" ]; then
  echo "ERROR: $SCHEMA not found. Run this from the project root."
  exit 1
fi

TARGET="${1:-}"

if [ -z "$TARGET" ]; then
  # Show current provider
  CURRENT=$(grep -E '^\s*provider\s*=' "$SCHEMA" | head -1 | sed -E 's/.*"([^"]+)".*/\1/')
  echo "Current Prisma provider: $CURRENT"
  echo ""
  echo "Usage:"
  echo "  bash scripts/dev-db.sh sqlite     # switch to SQLite for local dev"
  echo "  bash scripts/dev-db.sh postgres   # switch back to PostgreSQL (production)"
  exit 0
fi

case "$TARGET" in
  sqlite)
    # Switch to SQLite
    sed -i 's/provider = "postgresql"/provider = "sqlite"/' "$SCHEMA"
    # Ensure .env has the SQLite URL
    if ! grep -q 'file:.*custom.db' .env 2>/dev/null; then
      echo 'DATABASE_URL=file:/home/z/my-project/db/custom.db' > .env
    fi
    mkdir -p db
    echo "✓ Switched to SQLite"
    echo "  Running prisma db push..."
    npx prisma db push --skip-generate
    echo "  Running prisma generate..."
    npx prisma generate
    echo ""
    echo "✓ Local dev DB ready. You can now run: npm run dev"
    echo ""
    echo "⚠  WARNING: Before committing to git, run:"
    echo "    bash scripts/dev-db.sh postgres"
    ;;
  postgres)
    # Switch back to PostgreSQL
    sed -i 's/provider = "sqlite"/provider = "postgresql"/' "$SCHEMA"
    echo "✓ Switched to PostgreSQL (production-safe)"
    echo "  Run 'npx prisma generate' to regenerate the client."
    echo ""
    echo "✓ Safe to commit and push to GitHub/Vercel."
    ;;
  *)
    echo "ERROR: Unknown target '$TARGET'. Use 'sqlite' or 'postgres'."
    exit 1
    ;;
esac
