/// Sync state table — tracks sync checkpoints per entity type.
///
/// One row per entity type (remedies, rubrics, bookmarks, etc.)
/// Records the last successful sync timestamp and cursor for
/// incremental sync.
library;

import 'package:drift/drift.dart';

class SyncState extends Table {
  /// Entity type: 'remedies', 'rubrics', 'books', 'bookmarks', etc.
  TextColumn get entityType => text()();

  /// Last successful sync timestamp (server time)
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();

  /// Cursor for cursor-based pagination (opaque token from server)
  TextColumn get nextCursor => text().nullable()();

  /// Total records synced (for progress display + validation)
  IntColumn get totalSynced => integer().withDefault(const Constant(0))();

  /// Initial sync complete flag
  BoolColumn get initialSyncComplete => boolean().withDefault(const Constant(false))();

  /// Last sync error (redacted)
  TextColumn get lastError => text().nullable()();

  /// Sync status: 'idle', 'syncing', 'error', 'complete'
  TextColumn get status => text().withDefault(const Constant('idle'))();

  @override
  Set<Column> get primaryKey => {entityType};
}
