/// Remedies table — Materia Medica remedies from all authors.
///
/// Source: /api/remedies (read-only from app perspective)
/// Server fields reused: id, name, author, keynote, full, source_book, etc.
library;

import 'package:drift/drift.dart';

class Remedies extends Table {
  /// Server-side stable unique ID (e.g. 'boericke-belladonna').
  /// Primary key — must be non-null, no clientDefault.
  TextColumn get serverId => text()();
  TextColumn get name => text()();
  TextColumn get author => text().withDefault(const Constant(''))();
  TextColumn get sourceBook => text().nullable()();
  TextColumn get keynote => text().nullable()();
  TextColumn get full => text().nullable()();

  /// Sync fields
  DateTimeColumn get updatedAt => dateTime().nullable()();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  TextColumn get syncStatus => text().withDefault(const Constant('synced'))();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {serverId};
}
