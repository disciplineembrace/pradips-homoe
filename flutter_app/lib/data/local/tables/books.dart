/// Books table — Book/library metadata.
///
/// Source: /api/books (read-only from app perspective)
library;

import 'package:drift/drift.dart';

class Books extends Table {
  TextColumn get serverId => text()();
  TextColumn get title => text()();
  TextColumn get subtitle => text().nullable()();
  TextColumn get author => text().nullable()();
  TextColumn get category => text().nullable()();
  TextColumn get description => text().nullable()();
  IntColumn get totalChapters => integer().withDefault(const Constant(0))();

  /// Sync fields
  DateTimeColumn get updatedAt => dateTime().nullable()();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  TextColumn get syncStatus => text().withDefault(const Constant('synced'))();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {serverId};
}
