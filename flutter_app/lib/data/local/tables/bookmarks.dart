/// Bookmarks table — user-owned bookmarks.
///
/// Source: /api/user/bookmarks (read/write — synced via outbox)
/// Conflict resolution: version-based, no silent overwrites.
library;

import 'package:drift/drift.dart';

class Bookmarks extends Table {
  /// Local auto-increment ID
  IntColumn get localId => integer().autoIncrement()();
  /// Server-side ID (null until synced)
  TextColumn get serverId => text().nullable()();
  TextColumn get userId => text()();
  TextColumn get entityId => text()();
  TextColumn get entityType => text()(); // 'remedy', 'rubric', 'book', etc.
  TextColumn get title => text()();

  /// Sync fields
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().nullable()();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();
}
