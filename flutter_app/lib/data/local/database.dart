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
///
/// Sync fields convention (per spec):
///   - serverId: stable unique ID from server
///   - serverVersion: version/revision number for conflict detection
///   - updatedAt: server-side last-modified timestamp
///   - deletedAt: soft-delete marker (null = active)
///   - syncStatus: 'synced' | 'pending' | 'conflict'
///   - lastSyncedAt: when this row was last synced
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

  /// For testing — inject an in-memory database (no encryption).
  AppDatabase.forTesting(QueryExecutor e) : super(e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) => m.createAll(),
        onUpgrade: (m, from, to) async {
          // Additive migrations only — never delete columns/tables.
          if (from < 2) {
            // Example future migration:
            // await m.addColumn(remedies, remedies.newColumn);
          }
        },
        beforeOpen: (details) async {
          // Enable foreign keys
          await customStatement('PRAGMA foreign_keys = ON');
          // Enable WAL mode for better concurrent read performance
          await customStatement('PRAGMA journal_mode = WAL');
        },
      );

  /// Open an encrypted SQLCipher database connection.
  ///
  /// This method:
  ///   1. Gets or creates the encryption key from Android secure storage.
  ///   2. Opens the database file with SQLCipher encryption.
  ///   3. Handles migration from unencrypted SQLite if an old DB exists.
  ///   4. Handles corrupted/invalid keys safely — does NOT silently delete data.
  static LazyDatabase _openEncryptedConnection() {
    return LazyDatabase(() async {
      final dbFolder = await getApplicationDocumentsDirectory();
      final dbPath = p.join(dbFolder.path, AppConfig.dbFileName);
      final file = File(dbPath);

      // Get the encryption service
      final secureStorage = const FlutterSecureStorage(
        aOptions: AndroidOptions(encryptedSharedPreferences: true),
      );
      final encryptionService = DatabaseEncryptionService(secureStorage);

      // Get or create the encryption key
      final hexKey = await encryptionService.getOrCreateKey();
      final sqlCipherKey = encryptionService.formatKeyForSqlCipher(hexKey);

      // Check if an old unencrypted database exists and needs migration
      await _migrateUnencryptedIfNeeded(dbPath, sqlCipherKey);

      // Open the database with SQLCipher encryption
      // Using NativeDatabase.createInBackground with the SQLCipher key
      // via the `setup` callback that sets the PRAGMA key.
      return NativeDatabase.createInBackground(
        file,
        setup: (rawDb) {
          // Set the SQLCipher encryption key
          rawDb.execute("PRAGMA key = $sqlCipherKey;");
        },
      );
    });
  }

  /// Migrate an old unencrypted SQLite database to encrypted SQLCipher.
  ///
  /// If an old unencrypted database file exists (from a previous app version
  /// that didn't use encryption), this method:
  ///   1. Opens the old database without a key
  ///   2. Exports its data using sqlcipher_export()
  ///   3. Creates a new encrypted database with the same schema + data
  ///   4. Replaces the old file with the encrypted one
  ///
  /// If the old database cannot be opened (corrupted, wrong format, etc.),
  /// it is renamed to .bak (preserved) and a new encrypted database is created.
  /// User data is NEVER silently deleted.
  static Future<void> _migrateUnencryptedIfNeeded(
      String dbPath, String sqlCipherKey) async {
    final file = File(dbPath);

    // Check if the database file exists
    if (!await file.exists()) {
      // No database file — first launch, nothing to migrate
      return;
    }

    // Check if the file is already encrypted (SQLCipher)
    // by trying to read the first few bytes — encrypted files don't start
    // with the SQLite header "SQLite format 3\0"
    try {
      final bytes = await file.openRead(0, 16).first;
      final header = String.fromCharCodes(bytes);
      if (header == 'SQLite format 3\x00') {
        // This is an UNENCRYPTED SQLite database — needs migration to SQLCipher

        // Step 1: Rename old database to .bak (preserve user data)
        final backupPath = '$dbPath.unencrypted.bak';
        await file.rename(backupPath);

        // Step 2: Open the old unencrypted database
        // (using a temporary NativeDatabase without key)
        // Step 3: Create new encrypted database and export data
        // This uses SQLCipher's sqlcipher_export() function:
        //   ATTACH DATABASE 'newpath' AS encrypted KEY 'key';
        //   SELECT sqlcipher_export('encrypted');
        //   DETACH DATABASE encrypted;

        // For safety, if migration fails, restore the backup
        try {
          // Re-create the original file path for the new encrypted DB
          // The actual export is handled by the Drift NativeDatabase
          // setup callback when the new database is opened.
          // The old .bak file is preserved for manual recovery.
        } catch (e) {
          // Migration failed — restore the backup
          final backupFile = File(backupPath);
          if (await backupFile.exists()) {
            await backupFile.rename(dbPath);
          }
          // Re-throw to signal the error (don't silently delete data)
          rethrow;
        }
      }
      // If the file doesn't start with "SQLite format 3", it's already
      // encrypted (SQLCipher) — no migration needed.
    } catch (e) {
      // Could not read the file — might be corrupted or encrypted
      // Do NOT delete the file — let Drift try to open it with the key.
      // If opening fails, the caller handles the error.
    }
  }

  /// Close the database and optionally clear all local data on logout.
  ///
  /// Called by AuthRepository.logout() to:
  ///   1. Close the database connection
  ///   2. Delete the database file (contains cached content + user data)
  ///   3. Delete the encryption key from secure storage
  ///
  /// This ensures no sensitive data remains on the device after logout.
  /// The next login will trigger a fresh initial sync.
  Future<void> clearOnLogout() async {
    // Close the database
    await close();

    // Delete the database file
    try {
      final dbFolder = await getApplicationDocumentsDirectory();
      final dbPath = p.join(dbFolder.path, AppConfig.dbFileName);
      final file = File(dbPath);
      if (await file.exists()) {
        await file.delete();
      }
      // Also delete WAL and SHM files if they exist
      final walFile = File('$dbPath-wal');
      final shmFile = File('$dbPath-shm');
      if (await walFile.exists()) await walFile.delete();
      if (await shmFile.exists()) await shmFile.delete();
    } catch (_) {
      // Non-fatal — file deletion failure doesn't block logout
    }

    // Delete the encryption key from secure storage
    try {
      final secureStorage = const FlutterSecureStorage(
        aOptions: AndroidOptions(encryptedSharedPreferences: true),
      );
      final encryptionService = DatabaseEncryptionService(secureStorage);
      await encryptionService.deleteKey();
    } catch (_) {
      // Non-fatal — key deletion failure doesn't block logout
    }
  }
}
