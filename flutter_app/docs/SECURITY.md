# Security Notes

## Authentication

- **PIN-based auth** (6-digit) — reuses existing website `/api/auth/login`
- **No passwords stored** in the app
- Session token stored in **flutter_secure_storage** (Android Keystore)
- Token attached as Cookie + Authorization header on every request
- Session auto-refreshed on 401 responses
- Session expiry handled → redirect to login

## Data Access

- App **never connects directly** to Neon PostgreSQL
- App **never uses** Supabase service-role key
- All database access goes through existing Next.js API routes
- Supabase Row Level Security (existing) enforced server-side
- Premium access validated server-side (not just hidden in UI)

## Secure Storage

- `flutter_secure_storage` uses Android Keystore (hardware-backed on supported devices)
- Stored: session token, user profile (id, name, email, role)
- **Never stored**: passwords, database credentials, API service keys, admin secrets

## Network Security

- **HTTPS-only** communication (enforced via Dio baseUrl)
- Certificate pinning can be added for production (recommended)
- No mixed-content (HTTP) requests allowed
- Request/response validation on all API calls

## Input Validation

- All user inputs validated before sending to API
- PIN format checked locally (6 digits) before network call
- Email format validated
- Search queries sanitized
- No SQL injection risk (Drift uses parameterized queries)

## Error Handling

- Error messages shown to users are user-friendly (no stack traces)
- Technical logs redact sensitive data (tokens, emails, PINs)
- No sensitive data in error reports

## Local Database (SQLite)

- SQLite is **not encrypted** by default in v1
- If sensitive locally-stored data requires encryption, add `sqlcipher` (future enhancement)
- **Do not claim encryption unless actually implemented and tested**
- Local DB contains: content data (remedies, rubrics), user bookmarks/favorites/history
- Local DB does NOT contain: passwords, database credentials, service keys

## Premium Access

- Premium access enforced **server-side** via API
- App UI hides premium features, but this is **not the only protection**
- Server validates premium status on every premium-content request
- If premium expires, server returns 403 and app shows upgrade prompt

## Background Sync Security

- Background sync (WorkManager) uses the same authenticated API
- Token refreshed on each sync cycle
- No background sync if session expired (waits for app foreground)

## What the App Does NOT Do

- ❌ Does not store user passwords
- ❌ Does not store Supabase service-role key
- ❌ Does not store Neon database credentials
- ❌ Does not connect directly to PostgreSQL
- ❌ Does not bypass Row Level Security
- ❌ Does not expose admin secrets
- ❌ Does not send data over HTTP (HTTPS only)
- ❌ Does not log sensitive data
- ❌ Does not disable SSL certificate validation

## Production Checklist

Before release:
- [ ] Change `apiBaseUrl` to production URL
- [ ] Enable certificate pinning
- [ ] Test secure storage on target Android devices
- [ ] Verify no secrets in APK (decompile check)
- [ ] Test session expiry handling
- [ ] Test premium access denial
- [ ] Verify error logs are redacted
- [ ] Add SQLCipher encryption if storing sensitive local data
