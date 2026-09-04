/// Drift database definition for Pradip's Homeo offline cache.
///
/// ENCRYPTION:
///   SQLCipher with 256-bit key stored in Android Keystore.
///   Key NEVER appears in error messages, logs, or source code.
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
        beforeOpen: (details) async {
          await customStatement('PRAGMA foreign_keys = ON');
        },
      );

  /// Open an encrypted SQLCipher database connection.
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

      // Migrate old unencrypted DB if exists
      await _migrateUnencryptedIfNeeded(dbPath);

      try {
        return NativeDatabase.createInBackground(
          file,
          setup: (rawDb) {
            // SQLCipher PRAGMA key — hex format without double quotes.
            // SQL: PRAGMA key = x'abcdef...';
            rawDb.execute("PRAGMA key = x'$hexKey';");
          },
        );
      } catch (e) {
        // NEVER expose the key. Throw a generic error.
        throw Exception('Local database could not be opened. Please retry.');
      }
    });
  }

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
      // Do NOT delete — let Drift try to open it.
    }
  }

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
