# Pradip's Homeo — Flutter Android App

Offline-first Flutter Android application for Pradip's Homoeopathy website.

## ⚠️ Live Website Protection

This Flutter app is a **separate client** that connects to the existing live website backend.
The live website at https://pradips-homoe.vercel.app remains **completely unchanged** and **fully functional**.

- ✅ Website code: untouched
- ✅ Website database (Neon PostgreSQL + Supabase): untouched
- ✅ Website APIs: reused (read-only from app perspective for content)
- ✅ SQLite: used ONLY as the app's local offline cache

## Architecture

```
Live Website (Next.js)
      │
      ├──── Existing Backend/API Layer (Next.js API routes)
      │
      ▼
Supabase + Neon PostgreSQL (Source of Truth)
      ▲
      │
      ├──── Flutter Sync Service
      │
      ▼
Flutter Android App
      │
      ▼
Drift + SQLite (Local Offline Database)
```

## Tech Stack

- **Flutter** (latest stable)
- **Dart** with null safety
- **Drift** ORM with SQLite (offline database)
- **Dio** (HTTP client)
- **flutter_secure_storage** (secure token storage)
- **Riverpod** (state management / dependency injection)
- **connectivity_plus** (connectivity detection)
- **workmanager** (background sync)

## Project Structure

```
flutter_app/
├── lib/
│   ├── main.dart                    # App entry point
│   ├── app.dart                     # MaterialApp + routing
│   ├── core/
│   │   ├── config/
│   │   │   └── app_config.dart      # API URLs, constants
│   │   ├── network/
│   │   │   ├── dio_client.dart      # HTTP client with auth
│   │   │   ├── connectivity.dart    # Online/offline detection
│   │   │   └── api_exceptions.dart  # Error types
│   │   └── utils/
│   │       └── logger.dart          # Redacted logging
│   ├── data/
│   │   ├── local/
│   │   │   ├── database.dart        # Drift database definition
│   │   │   ├── tables/
│   │   │   │   ├── remedies.dart
│   │   │   │   ├── rubrics.dart
│   │   │   │   ├── books.dart
│   │   │   │   ├── bookmarks.dart
│   │   │   │   ├── favorites.dart
│   │   │   │   ├── history.dart
│   │   │   │   ├── outbox.dart
│   │   │   │   └── sync_state.dart
│   │   │   └── daos/
│   │   │       ├── remedy_dao.dart
│   │   │       ├── rubric_dao.dart
│   │   │       ├── bookmark_dao.dart
│   │   │       └── outbox_dao.dart
│   │   ├── remote/
│   │   │   ├── api_client.dart      # API endpoint wrappers
│   │   │   └── dtos/                # Data Transfer Objects
│   │   └── repositories/
│       ├── auth_repository.dart
│       ├── remedy_repository.dart
│       ├── rubric_repository.dart
│       ├── bookmark_repository.dart
│       └── sync_repository.dart
│   ├── sync/
│   │   ├── sync_engine.dart         # Initial + incremental sync
│   │   ├── outbox_processor.dart    # Pending writes queue
│   │   └── conflict_resolver.dart   # Conflict rules
│   ├── features/
│   │   ├── auth/
│   │   │   └── login_screen.dart
│   │   ├── dashboard/
│   │   │   └── dashboard_screen.dart
│   │   ├── materia_medica/
│   │   │   └── materia_medica_screen.dart
│   │   ├── repertory/
│   │   │   └── repertory_screen.dart
│   │   ├── search/
│   │   │   └── quick_search_screen.dart
│   │   ├── bookmarks/
│   │   │   └── bookmarks_screen.dart
│   │   └── settings/
│   │       └── settings_screen.dart
│   └── widgets/
│       ├── offline_indicator.dart
│       ├── sync_progress.dart
│       └── error_widget.dart
├── pubspec.yaml
├── android/                         # Android-specific config
├── test/                            # Unit + widget tests
└── README.md
```

## Setup Instructions

### Prerequisites

1. **Flutter SDK** (>= 3.19.0): https://flutter.dev/docs/get-started/install
2. **Android Studio** or **VS Code** with Flutter plugin
3. **Android SDK** (API level 21+)
4. **Java 17+**

### Install

```bash
cd flutter_app
flutter pub get
```

### Configure

Edit `lib/core/config/app_config.dart`:

```dart
class AppConfig {
  // Live website API base URL
  static const String apiBaseUrl = 'https://pradips-homoe.vercel.app';
  
  // For local development:
  // static const String apiBaseUrl = 'http://10.0.2.2:3000'; // Android emulator → host localhost
}
```

### Run (Debug)

```bash
flutter run
```

### Build Release APK

```bash
flutter build apk --release
# Output: build/app/outputs/flutter-apk/app-release.apk
```

## Authentication

The app uses the **existing PIN-based auth** from the website:
- User enters email + 6-digit PIN
- App sends `POST /api/auth/login` to the website API
- Website returns JWT session cookie
- App stores token in **flutter_secure_storage** (Android Keystore)
- Token used for all subsequent API calls
- Session auto-refreshed on app launch

**No passwords are stored.** No Supabase service-role key. No Neon credentials.

## Offline Mode

- App detects connectivity via `connectivity_plus`
- All content available offline after initial sync
- Local SQLite search (Drift ORM) with FTS indexes
- Outbox queue for offline writes (bookmarks, favorites, history)
- Automatic sync when connectivity returns
- Non-intrusive offline indicator

## Sync Engine

### Initial Sync
1. Verify connectivity + session
2. Download data in batches (paginated)
3. Save each batch transactionally
4. Record sync progress
5. Resumable on interruption
6. Count + checksum validation

### Incremental Sync
- Uses `updated_at` timestamps
- Cursor-based pagination
- Soft-delete handling
- Exponential backoff retries
- Updates local sync checkpoint only after success

### Outbox (Offline Writes)
- Pending operations queued locally
- Each op has: operation ID, user ID, entity ID, type, timestamp, retry count, status
- Processed when connectivity returns
- Idempotency keys prevent duplicates
- Failed ops preserved for retry

## Conflict Resolution

- **Server-owned content** (remedies, rubrics, books): server wins, latest version applied
- **User-owned data** (bookmarks, favorites, history): version-based conflict detection, no silent overwrites
- Unresolved conflicts logged safely (sensitive data redacted)

## Security

- HTTPS-only communication
- Secure token storage (Android Keystore via flutter_secure_storage)
- No plain-text passwords stored
- No database credentials in app
- Supabase Row Level Security (existing) enforced
- Premium access validated server-side
- Input validation on all API calls
- Redacted error logs

## Database Migrations

Drift uses versioned schema migrations:
- `schema_v1.dart` → initial schema
- Future migrations are additive only
- Existing local data preserved on upgrade
- Failed transactions rolled back
- Recovery path for corrupted cache

## Background Sync

- On app launch
- On app resume
- After login
- When connectivity returns
- Manual refresh (pull-to-refresh)
- Periodic via WorkManager (within Android limits)

## Testing

```bash
# Unit tests
flutter test

# Integration tests
flutter test integration_test/
```

## Website Regression

The live website is **not modified** by this app. All app data access goes through existing read-only API endpoints. User writes (bookmarks, favorites) use existing user-feature APIs.

## Rollback

To remove the Flutter app:
1. Delete `flutter_app/` directory
2. No website changes to revert (none were made)

## Branch Workflow

- `master` = development branch (Flutter app developed here)
- `main` = production branch (website only — Flutter app doesn't deploy to Vercel)
- PR `master` → `main` only for any backend additions (none required for v1)

## License

Proprietary — Pradip's Homoe
