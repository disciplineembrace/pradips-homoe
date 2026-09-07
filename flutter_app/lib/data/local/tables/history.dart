/// Reading history table — recently viewed remedies/rubrics/books.
///
/// Source: /api/user/history (read/write — synced via outbox)
library;

import 'package:drift/drift.dart';

class ReadingHistory extends Table {
  IntColumn get localId => integer().autoIncrement()();
  TextColumn get serverId => text().nullable()();
  TextColumn get userId => text()();
  TextColumn get entityId => text()();
  TextColumn get entityType => text()();
  TextColumn get title => text()();
  TextColumn get author => text().nullable()();

  DateTimeColumn get visitedAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().nullable()();
  DateTimeColumn get deletedAt => dateTime().nullable()();
  TextColumn get syncStatus => text().withDefault(const Constant('pending'))();
  DateTimeColumn get lastSyncedAt => dateTime().nullable()();
}
