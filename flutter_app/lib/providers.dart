/// Centralized Riverpod providers.
///
/// All app-wide providers defined here to avoid circular imports.
/// Every provider is fully wired — no UnimplementedError, no placeholders.
library;

import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';

import 'core/config/app_config.dart';
import 'core/network/connectivity.dart';
import 'core/network/dio_client.dart';
import 'data/local/database.dart';
import 'data/remote/api_client.dart';
import 'data/repositories/auth_repository.dart';
import 'data/repositories/bookmark_repository.dart';
import 'data/repositories/remedy_repository.dart';
import 'data/repositories/rubric_repository.dart';
import 'sync/conflict_resolver.dart';
import 'sync/outbox_processor.dart';
import 'sync/sync_engine.dart';

// ============================================================
// CORE INFRASTRUCTURE
// ============================================================

/// Local database (Drift/SQLite)
final databaseProvider = Provider<AppDatabase>((ref) {
  final db = AppDatabase();
  ref.onDispose(() => db.close());
  return db;
});

/// Secure storage (Android Keystore)
final secureStorageProvider = Provider<FlutterSecureStorage>((ref) {
  return const FlutterSecureStorage(
    aOptions: AndroidOptions(encryptedSharedPreferences: true),
  );
});

/// HTTP client (Dio with auth interceptor)
final dioClientProvider = Provider<DioClient>((ref) {
  final secureStorage = ref.watch(secureStorageProvider);
  return DioClient(secureStorage);
});

/// Connectivity monitor
final connectivityProvider = Provider<ConnectivityService>((ref) {
  final service = ConnectivityService();
  service.init();
  ref.onDispose(() => service.dispose());
  return service;
});

// ============================================================
// API CLIENT
// ============================================================

final apiClientProvider = Provider<ApiClient>((ref) {
  final dio = ref.watch(dioClientProvider);
  return ApiClient(dio);
});

// ============================================================
// REPOSITORIES
// ============================================================

/// Authentication repository
final authRepositoryProvider = Provider<AuthRepository>((ref) {
  final dio = ref.watch(dioClientProvider);
  final secureStorage = ref.watch(secureStorageProvider);
  final repo = AuthRepository(dio, secureStorage);

  // Wire up logout callback to clear the encrypted database
  // When the user logs out, the local database + encryption key are deleted.
  repo.onLogout = () async {
    try {
      final db = ref.read(databaseProvider);
      await db.clearOnLogout();
    } catch (_) {
      // Non-fatal — database cleanup failure doesn't block logout
    }
  };

  return repo;
});

/// Remedy repository (Materia Medica)
final remedyRepositoryProvider = Provider<RemedyRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  final db = ref.watch(databaseProvider);
  final connectivity = ref.watch(connectivityProvider);
  return RemedyRepository(api, db, connectivity);
});

/// Rubric repository (Repertory)
final rubricRepositoryProvider = Provider<RubricRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  final db = ref.watch(databaseProvider);
  final connectivity = ref.watch(connectivityProvider);
  return RubricRepository(api, db, connectivity);
});

/// Bookmark repository
final bookmarkRepositoryProvider = Provider<BookmarkRepository>((ref) {
  final api = ref.watch(apiClientProvider);
  final db = ref.watch(databaseProvider);
  final connectivity = ref.watch(connectivityProvider);
  return BookmarkRepository(api, db, connectivity);
});

// ============================================================
// SYNC ENGINE + OUTBOX
// ============================================================

/// Sync engine
final syncEngineProvider = Provider<SyncEngine>((ref) {
  final db = ref.watch(databaseProvider);
  final dio = ref.watch(dioClientProvider);
  final connectivity = ref.watch(connectivityProvider);
  return SyncEngine(db, dio, connectivity);
});

/// Outbox processor
final outboxProcessorProvider = Provider<OutboxProcessor>((ref) {
  final db = ref.watch(databaseProvider);
  final dio = ref.watch(dioClientProvider);
  final connectivity = ref.watch(connectivityProvider);
  return OutboxProcessor(db, dio, connectivity);
});

/// Conflict resolver
final conflictResolverProvider = Provider<ConflictResolver>((ref) {
  return ConflictResolver();
});
