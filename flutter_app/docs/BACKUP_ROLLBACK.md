# Backup and Rollback Procedure

## Live Website Protection

The Flutter app development **does not modify** the live website.
The live website at https://pradips-homoe.vercel.app remains fully functional
throughout development and after release.

## Pre-Implementation Backup (Already Recorded)

Before starting Flutter development:
- ✅ Live website state: `main` branch at commit `5d2c398` (protected)
- ✅ Database schema: Neon PostgreSQL unchanged
- ✅ Supabase: unchanged
- ✅ Website code: untouched (Flutter app is in separate `flutter_app/` directory)
- ✅ No backend additions required for v1

## Rollback: Remove Flutter App

If you need to completely remove the Flutter app:

```bash
# 1. Delete the Flutter app directory
cd /home/z/my-project
rm -rf flutter_app/

# 2. Commit the removal on master branch
git checkout master
git add -A
git commit -m "Revert: Remove Flutter app"
git push origin master

# 3. Create PR to main (if Flutter was merged to main)
# (Flutter app is NOT deployed to Vercel, so no Vercel rollback needed)
```

**After rollback:**
- ✅ Live website continues working (it was never modified)
- ✅ Neon PostgreSQL unchanged
- ✅ Supabase unchanged
- ✅ No website routes broken
- ✅ No website data lost
- ✅ No website features removed

## What Requires NO Rollback

- Flutter app directory (`flutter_app/`) — separate from website
- Flutter app does not deploy to Vercel (Vercel only deploys Next.js)
- Flutter app does not modify any database
- Flutter app does not modify any API
- Flutter app only **reads** from existing APIs (and writes to user-feature APIs via outbox)

## If Backend Addition Is Needed (Future)

If a future Flutter feature requires a backend change:
1. Create a feature branch from `master`
2. Implement additive-only migration (no destructive schema changes)
3. Test outside production (local dev or staging)
4. Verify backward compatibility with existing website
5. Prepare rollback SQL
6. Deploy migration to Neon (additive only)
7. Verify website still works
8. Then update Flutter app to use new endpoint
9. If anything breaks: roll back the migration (the additive change is safe to remove)

## Database Migration Rollback

If a Drift migration fails in the app:
1. Drift uses versioned schemas with transactional migrations
2. Failed migration → transaction rolls back → old data preserved
3. User sees recovery prompt (not silent data loss)
4. App can be reinstalled without affecting server data

## Emergency Procedures

### Website is down
1. Flutter app shows offline indicator
2. App uses local SQLite cache
3. User can still read synced content
4. When website recovers, app auto-syncs

### App causes issues
1. Uninstall the app from devices
2. App removal does not affect the website
3. No server-side cleanup needed (app only used existing read APIs + user-feature write APIs)

### Data integrity concern
1. App's local SQLite can be cleared (Settings → Clear Cache)
2. App re-syncs from server (source of truth)
3. No server data is affected by local cache clearing
