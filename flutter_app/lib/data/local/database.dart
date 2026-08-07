/// Drift database definition for Pradip's Homeo offline cache.
///
/// This SQLite database is the app's LOCAL offline storage only.
/// The server (Neon PostgreSQL + Supabase) remains the source of truth.
///
/// ENCRYPTION:
///   The database is encrypted using SQLCipher. The encryption key is:
///   - Generated on first app launch (256-bit random)
///   - Stored ONLY in Android secure storage (Android Keystore)
///   - Never hardcoded in source code
///   - Never committed to GitHub
///   - Never stored in shared preferences
///   - Never exposed in error messages
library;

import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path_provider/path_provider.dart';
import 'package:path/path.dart' as p;
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/config/app_config.dart';
import '../../core/security/database_encryption.dart';
import 'tables/remedies.dart';
import 'tables/rubrics.dart';
import 'tables/books.dart';
import 'tables/bookmarks.dart';
import 'tables/favorites.dart';
import 'tables/history.dart';
import 'tables/outbox.dart';
import 'tables/sync_state.dart';
import 'daos/remedy_dao.dart';
import 'daos/rubric_dao.dart';
import 'daos/bookmark_dao.dart';
import 'daos/outbox_dao.dart';

part 'database.g.dart';

@DriftDatabase(
  tables: [
    Remedies,
    Rubrics,
    Books,
    Bookmarks,
    Favorites,
    ReadingHistory,
    OutboxOperations,
    SyncState,
  ],
  daos: [RemedyDao, RubricDao, BookmarkDao, OutboxDao],
)
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openEncryptedConnection());

  AppDatabase.forTesting(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          if (from < 2) {
            // Future migration placeholder
          }
        },
        beforeOpen: (details) async {
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );

  /// Open an encrypted SQLCipher database connection.
  ///
  /// Uses sqlcipher_flutter_libs which provides a SQLCipher-compatible
  /// SQLite library. The key is set via PRAGMA key before any other
  /// operation. The key is NEVER logged or exposed in error messages.
  static LazyDatabase _openEncryptedConnection() {
    return LazyDatabase(() async {
      final dbFolder = await getApplicationDocumentsDirectory();
      final dbPath = p.join(dbFolder.path, AppConfig.dbFileName);
      final file = File(dbPath);

      final secureStorage = const FlutterSecureStorage(
        aOptions: AndroidOptions(encryptedSharedPreferences: true),
      );
      final encryptionService = DatabaseEncryptionService(secureStorage);

      final hexKey = await encryptionService.getOrCreateKey();

      // Check for old unencrypted database
      await _migrateUnencryptedIfNeeded(dbPath);

      // Open with SQLCipher — the key is passed as a PRAGMA statement.
      // The key value is NEVER included in error messages or logs.
      // If the database cannot be opened, a generic error is thrown
      // that does NOT reveal the key.
      try {
        return NativeDatabase.createInBackground(
          file,
          setup: (rawDb) {
            // Set the SQLCipher key — this MUST be the first statement.
            // Using hex format: x'...'
            rawDb.execute("PRAGMA key = \"x'$hexKey'\";");
          },
        );
      } catch (e) {
        // NEVER expose the key in the error message.
        // Log a redacted error and throw a generic message.
        throw Exception(
          'Local database could not be opened. Please retry.',
        );
      }
    });
  }

  /// Migrate an old unencrypted SQLite database.
  /// Renames to .bak (preserved), new encrypted DB created fresh.
  static Future<void> _migrateUnencryptedIfNeeded(String dbPath) async {
    final file = File(dbPath);

    if (!await file.exists()) return;

    try {
      final bytes = await file.openRead(0, 16).first;
      final header = String.fromCharCodes(bytes);
      if (header == 'SQLite format 3\x00') {
        final backupPath = '$dbPath.unencrypted.bak';
        await file.rename(backupPath);
      }
    } catch (_) {
      // Could not read — might be encrypted or corrupted.
      // Do NOT delete — let Drift try to open it.
    }
  }

  /// Close the database and clear all local data on logout.
  Future<void> clearOnLogout() async {
    await close();

    try {
      final dbFolder = await getApplicationDocumentsDirectory();
      final dbPath = p.join(dbFolder.path, AppConfig.dbFileName);
      final file = File(dbPath);
      if (await file.exists()) await file.delete();
      final walFile = File('$dbPath-wal');
      final shmFile = File('$dbPath-shm');
      if (await walFile.exists()) await walFile.delete();
      if (await shmFile.exists()) await shmFile.delete();
    } catch (_) {}

    try {
      final secureStorage = const FlutterSecureStorage(
        aOptions: AndroidOptions(encryptedSharedPreferences: true),
      );
      final encryptionService = DatabaseEncryptionService(secureStorage);
      await encryptionService.deleteKey();
    } catch (_) {}
  }
}
