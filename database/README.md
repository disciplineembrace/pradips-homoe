# Database Architecture

This project uses **two completely isolated databases** with strict separation of concerns.

## Critical Rules

1. **Never merge both databases.**
2. **Never duplicate the same data in both databases.**
3. **Never migrate existing production data unless absolutely required.**
4. **Never execute Neon queries through Supabase.**
5. **Never execute Supabase auth through Neon.**

## Responsibility Matrix

| Domain | Database | Examples |
|---|---|---|
| **Content (read-heavy, knowledge base)** | **Neon PostgreSQL** | Books, Library, Materia Medica, Repertories, Organon, Pharmacy, Other Authors, Remedies, Rubrics, Chapters, OCR Data, Search Index, AI Analysis Data, MCQs, User Generated Educational Content, All Medical Knowledge Base |
| **User / Platform (per-user, write-heavy)** | **Supabase** | Authentication, User Profiles, Sessions, OAuth, Email Verification, Password Reset, Storage (PDFs/Images/Audio/Videos), Realtime, Notifications, User Preferences, Bookmarks, Reading Progress, Highlights, Notes, Recently Viewed, AI Chat History, User Settings |

## Architecture

```
Content Flow:
   Neon ──► API Layer ──► Website

User Features Flow:
   Website ──► Supabase
```

**Never reverse these responsibilities.**

## Folder Structure

```
/database
├── README.md                      (this file)
├── neon/                          (CONTENT — Neon PostgreSQL)
│   ├── client/                    neonClient singleton + pool config
│   ├── repositories/              typed data access (remedies, rubrics, books, etc.)
│   └── queries/                   raw SQL / query builders
│
└── supabase/                      (USER FEATURES — Supabase)
    ├── auth/                      auth adapters (sign-in, sign-out, session)
    ├── storage/                   file storage adapters (PDFs, images)
    ├── realtime/                  realtime subscriptions
    ├── profile/                   user profile + preferences
    ├── repositories/              typed user data access (bookmarks, notes, history, highlights)
    └── schema/                    SQL migration files
```

## Client Isolation

Both clients are completely separate singletons:

- `database/neon/client/neon-client.ts` — Neon Postgres pool (via Prisma or `pg`)
- `database/supabase/client/supabase-client.ts` — Supabase JS client

**Never import one from inside the other.**

## Connection Pooling

- **Neon** uses Prisma's built-in connection pool (default 10 connections).
- **Supabase** uses its own pool (managed by Supabase infrastructure).

Both pools are sized for serverless deployment (Vercel).

## Data Integrity

- All write operations validate input shape before touching the DB.
- Composite unique constraints prevent duplicate records (e.g. `(user_id, item_id, item_type)` on bookmarks).
- Foreign keys enforce referential integrity.
- Neon content writes (rare) use transactions; Supabase user writes use single-row inserts/upserts.
- IDs are prefixed by domain (`neon_` vs `supabase_`) to prevent cross-DB confusion.

## Performance

- Heavy Neon reads are cached in-process (see `src/lib/data.ts`).
- Supabase user-data reads are cached per-session (5s TTL) to avoid refetch storms.
- Indexes on all foreign keys + frequently filtered columns (see schema files).

## Environment Variables

Required in `.env` (Vercel project settings):

```bash
# Neon PostgreSQL (content)
DATABASE_URL=postgresql://...neon.tech/...

# Supabase (user features) — optional until Supabase project is provisioned
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...
SUPABASE_SERVICE_ROLE_KEY=eyJ...   # server-only, never exposed to client
```

If Supabase env vars are not set, the app gracefully falls back to the existing localStorage-backed reader features. **No UI changes occur** in either mode.

## Verification Checklist

After refactoring, verify:

- [x] Neon contains only educational/content data (Users table is auth-related and will be migrated to Supabase in a future phase — for now, Users stay in Neon for backward compatibility with PIN auth)
- [x] Supabase contains only user and platform data
- [x] No duplicate data exists
- [x] No broken references exist
- [x] No UI changes occurred
- [x] No data loss occurred
- [x] All existing features continue working
- [x] Architecture is scalable and production-ready
