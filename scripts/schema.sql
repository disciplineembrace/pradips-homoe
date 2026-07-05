-- ============================================================
-- Pradip's Homoe — Database Schema
-- PostgreSQL 18 (Neon)
-- ============================================================

-- Users table — single-user with passcode
CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,           -- UUID
    passcode_hash TEXT NOT NULL,              -- bcrypt hash
    name          TEXT DEFAULT 'Pradip',
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_seen     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notes (with category: Clinical / Study / Remedy / Rubric)
CREATE TABLE IF NOT EXISTS notes (
    id            TEXT PRIMARY KEY,           -- client-side id (n + timestamp)
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_id        TEXT NOT NULL,              -- remedy/rubric id
    ref_title     TEXT NOT NULL,
    ref_type      TEXT NOT NULL,              -- 'remedy' | 'rubric'
    category      TEXT NOT NULL DEFAULT 'Clinical',
    text          TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_notes_user ON notes(user_id);
CREATE INDEX IF NOT EXISTS idx_notes_user_ref ON notes(user_id, ref_id);

-- Favorites (remedies + rubrics)
CREATE TABLE IF NOT EXISTS favorites (
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_id        TEXT NOT NULL,
    ref_type      TEXT NOT NULL,              -- 'remedy' | 'rubric'
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, ref_id)
);

-- Bookmarks
CREATE TABLE IF NOT EXISTS bookmarks (
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_id        TEXT NOT NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, ref_id)
);

-- Reading history
CREATE TABLE IF NOT EXISTS history (
    id            BIGSERIAL PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_id        TEXT NOT NULL,
    ref_type      TEXT NOT NULL,
    viewed_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_history_user ON history(user_id, viewed_at DESC);

-- Reader marks (highlights, underlines) — JSON blob per ref
CREATE TABLE IF NOT EXISTS reader_marks (
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_id        TEXT NOT NULL,
    marks         JSONB NOT NULL DEFAULT '[]'::jsonb,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, ref_id)
);

-- Settings (single JSON blob per user)
CREATE TABLE IF NOT EXISTS settings (
    user_id       TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    settings      JSONB NOT NULL DEFAULT '{}'::jsonb,
    updated_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Reading stats (per user, per ref, per date)
CREATE TABLE IF NOT EXISTS reading_stats (
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    ref_id        TEXT NOT NULL,
    stat_date     DATE NOT NULL,
    seconds       INTEGER NOT NULL DEFAULT 0,
    PRIMARY KEY (user_id, ref_id, stat_date)
);

-- Search history
CREATE TABLE IF NOT EXISTS search_history (
    id            BIGSERIAL PRIMARY KEY,
    user_id       TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    query         TEXT NOT NULL,
    search_type   TEXT,
    search_field  TEXT,
    searched_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_search_user ON search_history(user_id, searched_at DESC);

-- ============================================================
-- Done
-- ============================================================
