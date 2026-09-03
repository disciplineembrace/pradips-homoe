/// Drift database schema for Pradip's Homeo offline-first sync architecture.
import 'package:drift/drift.dart';

/// Remedies table - homeopathic remedy data
@DataClassName('RemedyRow')
class Remedies extends Table {
  TextColumn get id => text()();
  TextColumn get name => text()();
  TextColumn get common => text().withDefault(const Constant(''))();
  TextColumn get author => text()();
  TextColumn get letter => text().withDefault(const Constant(''))();
  TextColumn get chapter => text().withDefault(const Constant(''))();
  TextColumn get organ => text().withDefault(const Constant(''))();
  TextColumn get keynote => text().withDefault(const Constant(''))();
  TextColumn get source => text().nullable()();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get version => integer().withDefault(const Constant(1))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Rubrics table - repertory rubrics with parent-child tree
@DataClassName('RubricRow')
class Rubrics extends Table {
  TextColumn get id => text()();
  TextColumn get main => text()();
  TextColumn get chapter => text().withDefault(const Constant(''))();
  TextColumn get author => text().withDefault(const Constant(''))();
  TextColumn get parentId => text().nullable()();
  TextColumn get remediesJson => text().withDefault(const Constant('[]'))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get version => integer().withDefault(const Constant(1))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Synthesis rubrics table - 180K rubrics dataset
class SynthesisRubrics extends Table {
  TextColumn get id => text()();
  TextColumn get main => text()();
  TextColumn get chapter => text().withDefault(const Constant(''))();
  TextColumn get author => text().withDefault(const Constant(''))();
  TextColumn get parentId => text().nullable()();
  TextColumn get remediesJson => text().withDefault(const Constant('[]'))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get version => integer().withDefault(const Constant(1))();

  @override
  Set<Column> get primaryKey => {id};
}

/// Chapters table - repertory chapter metadata
class Chapters extends Table {
  TextColumn get name => text()();
  IntColumn get rubricCount => integer().withDefault(const Constant(0))();
  TextColumn get author => text().withDefault(const Constant(''))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {name};
}

/// Books table - reference book metadata
class Books extends Table {
  TextColumn get id => text()();
  TextColumn get title => text()();
  TextColumn get author => text().withDefault(const Constant(''))();
  TextColumn get description => text().withDefault(const Constant(''))();
  TextColumn get remedyCount => text().withDefault(const Constant(''))();
  TextColumn get icon => text().withDefault(const Constant('menu_book'))();
  IntColumn get color => integer().withDefault(const Constant(0xFF173B2D))();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {id};
}

/// User bookmarks table - synced with Supabase
class Bookmarks extends Table {
  TextColumn get itemId => text()();
  TextColumn get itemType => text()();
  TextColumn get title => text()();
  TextColumn get href => text().nullable()();
  TextColumn get author => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  BoolColumn get pendingSync => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {itemId, itemType};
}

/// User favorites table - synced with Supabase
class Favorites extends Table {
  TextColumn get itemId => text()();
  TextColumn get itemType => text()();
  TextColumn get title => text()();
  TextColumn get href => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  BoolColumn get pendingSync => boolean().withDefault(const Constant(false))();

  @override
  Set<Column> get primaryKey => {itemId, itemType};
}

/// User notes table - synced with Supabase
class AppNotes extends Table {
  IntColumn get localId => integer().autoIncrement()();
  TextColumn get itemId => text()();
  TextColumn get itemType => text()();
  TextColumn get content => text()();
  TextColumn get metadata => text().nullable()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  DateTimeColumn get updatedAt => dateTime().withDefault(currentDateAndTime)();
  BoolColumn get pendingSync => boolean().withDefault(const Constant(false))();
  TextColumn get serverId => text().nullable()();
}

/// Reading history table - recently viewed items
class ReadingHistory extends Table {
  TextColumn get itemId => text()();
  TextColumn get itemType => text()();
  TextColumn get title => text()();
  TextColumn get href => text().nullable()();
  DateTimeColumn get viewedAt => dateTime().withDefault(currentDateAndTime)();

  @override
  Set<Column> get primaryKey => {itemId, itemType};
}

/// Search history table - recent search queries
class SearchHistory extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get query => text()();
  TextColumn get mode => text().withDefault(const Constant('global'))();
  DateTimeColumn get searchedAt => dateTime().withDefault(currentDateAndTime)();
}

/// Sync metadata table - tracks last sync time per data type
class SyncMetadata extends Table {
  TextColumn get dataType => text()();
  DateTimeColumn get lastSyncAt => dateTime().nullable()();
  IntColumn get totalRecords => integer().withDefault(const Constant(0))();
  TextColumn get lastError => text().nullable()();
  TextColumn get status => text().withDefault(const Constant('never'))();

  @override
  Set<Column> get primaryKey => {dataType};
}

/// Pending changes queue - for offline writes that need to be pushed
class PendingChanges extends Table {
  IntColumn get id => integer().autoIncrement()();
  TextColumn get entityType => text()();
  TextColumn get entityId => text()();
  TextColumn get operation => text()();
  TextColumn get payload => text()();
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();
  IntColumn get retryCount => integer().withDefault(const Constant(0))();
}
