# Sync Flow Documentation

## Overview

The Flutter app uses an **offline-first** architecture with bidirectional sync.
The server (Neon PostgreSQL + Supabase via Next.js API) is always the source of truth.
SQLite (Drift) is only the app's local cache.

## Sync Triggers

Sync runs on:
1. **App launch** — incremental sync if online
2. **App resume** (from background) — incremental sync if online
3. **After login** — initial sync (if not already done)
4. **Connectivity restored** — incremental sync + outbox flush
5. **Manual refresh** — pull-to-refresh or Settings → Sync Now
6. **Periodic background** — WorkManager every 15 min (Android permitting)

## Initial Sync

On first authenticated launch:

1. Verify connectivity → if offline, wait
2. Verify session (JWT valid) → if expired, redirect to login
3. For each entity type (remedies, rubrics, books, bookmarks, favorites, history):
   a. Download in batches of 100: `GET /api/{entity}?page=N&pageSize=100&sync=true`
   b. Save each batch transactionally (INSERT OR REPLACE)
   c. Record sync progress (current/total)
   d. Validate counts — if received != total, retry batch
4. Mark `initialSyncComplete = true` in SyncState
5. Show completion message

**Resumable**: If interrupted, sync resumes from `nextCursor` stored in SyncState.

## Incremental Sync

After initial sync, only fetches changes:

1. Read `lastSyncedAt` from SyncState
2. `GET /api/{entity}?updatedSince={lastSyncedAt}&cursor={nextCursor}`
3. For each record:
   - If `deletedAt != null` → mark soft-deleted locally
   - Else → INSERT OR REPLACE
4. **Mass-deletion protection**: if deletions > 10% of local count → STOP, log, verify
5. Update `lastSyncedAt` + `nextCursor`

## Outbox (Offline Writes)

User actions performed offline are queued:
1. Immediate local SQLite write (user sees result)
2. Operation recorded in Outbox table with idempotency key
3. When online: process outbox → POST/PUT/DELETE to API with idempotency key
4. On success: mark `status=synced`, update entity `syncStatus=synced`
5. On failure: mark `status=failed`, increment `retryCount`, exponential backoff
6. If `retryCount > 10` → stop processing (will retry next sync cycle)

## Conflict Resolution

- **Server-owned content** (remedies, rubrics, books): server wins, latest version applied
- **User-owned data** (bookmarks, favorites, history): version-based conflict detection
- Never duplicate bookmarks/favorites
- Never lose a user action silently
- Unresolved conflicts logged (redacted)

## Deletion Safety

A record is removed locally ONLY when:
- Server explicitly marks `deletedAt != null`, OR
- Verified deletion log confirms deletion

Never delete on empty response, network error, or partial download.

Mass-deletion protection: if >10% of local records would be deleted → stop, log, verify.
