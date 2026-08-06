/// Rubrics table — Repertory rubrics (Kent, Phatak, Murphy, Boericke).
///
/// Source: /api/rubrics (read-only from app perspective)
/// Supports unlimited hierarchy via parentId.
library;

import 'package:drift/drift.dart';

class Rubrics extends Table {
  TextColumn get serverId => text()();
  TextColumn get parentId => text().nullable()();
  TextColumn get source => text()(); // Kent, Phatak, Murphy, Boericke
  TextColumn get chapter => text().withDefault(const Constant(''))();
  TextColumn get title => text()();
  TextColumn get fullPath => text().withDefault(const Constant(''))();
  IntColumn get level => integer().withDefault(const Constant(0))();

  /// Remedies stored as JSON: [{"abbrev":"Bell","grade":3}, ...]
  /// Grade: 4=Red(highest), 3=Green, 2=Blue, 1=Black(normal)
  TextColumn get remediesJson => text().withDefault(const Constant('[]'))();
  IntColumn get remedyCount => integer().withDefault(const Constant(0))();

  /// Sync fields
  DateTimeColumn get updatedAt => dateTime().nullable()();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  TextColumn get syncStatus => text().withDefault(const Constant('synced'))();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();

  @override
  Set<Column> get primaryKey => {serverId};
}
