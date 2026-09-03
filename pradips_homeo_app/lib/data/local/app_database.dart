/// AppDatabase - Drift (SQLite) database for offline-first storage.
import 'dart:io';
import 'package:drift/drift.dart';
import 'package:drift/native.dart';
import 'package:path/path.dart' as p;
import 'package:path_provider/path_provider.dart';
import 'tables.dart';

part 'app_database.g.dart';

@DriftDatabase(tables: [
  Remedies,
  Rubrics,
  SynthesisRubrics,
  Chapters,
  Books,
  Bookmarks,
  Favorites,
  AppNotes,
  ReadingHistory,
  SearchHistory,
  SyncMetadata,
  PendingChanges,
])
class AppDatabase extends _$AppDatabase {
  AppDatabase() : super(_openConnection());

  /// For testing
  AppDatabase.forTesting(super.e);

  @override
  int get schemaVersion => 1;

  @override
  MigrationStrategy get migration => MigrationStrategy(
        onCreate: (m) async {
          await m.createAll();
          // Create indexes for fast search
          await customStatement('CREATE INDEX IF NOT EXISTS idx_remedies_name ON remedies (name);');
          await customStatement('CREATE INDEX IF NOT EXISTS idx_remedies_author ON remedies (author);');
          await customStatement('CREATE INDEX IF NOT EXISTS idx_remedies_letter ON remedies (letter);');
          await customStatement('CREATE INDEX IF NOT EXISTS idx_rubrics_chapter ON rubrics (chapter);');
          await customStatement('CREATE INDEX IF NOT EXISTS idx_rubrics_parent ON rubrics (parent_id);');
          await customStatement('CREATE INDEX IF NOT EXISTS idx_synthesis_chapter ON synthesis_rubrics (chapter);');
          await customStatement('CREATE INDEX IF NOT EXISTS idx_bookmarks_item ON bookmarks (item_id);');
          await customStatement('CREATE INDEX IF NOT EXISTS idx_history_viewed ON reading_history (viewed_at DESC);');
          // FTS for full-text search on remedies
          await customStatement('''
            CREATE VIRTUAL TABLE IF NOT EXISTS remedies_fts USING fts5(
              id, name, common, author, keynote,
              content='remedies',
              content_rowid='rowid'
            );
          ''');
          await customStatement('''
            CREATE TRIGGER IF NOT EXISTS remedies_ai AFTER INSERT ON remedies BEGIN
              INSERT INTO remedies_fts(rowid, id, name, common, author, keynote)
              VALUES (new.rowid, new.id, new.name, new.common, new.author, new.keynote);
            END;
          ''');
          await customStatement('''
            CREATE TRIGGER IF NOT EXISTS remedies_ad AFTER DELETE ON remedies BEGIN
              INSERT INTO remedies_fts(remedies_fts, rowid, id, name, common, author, keynote)
              VALUES ('delete', old.rowid, old.id, old.name, old.common, old.author, old.keynote);
            END;
          ''');
        },
        onUpgrade: (m, from, to) async {
          // Future migrations will go here
        },
        beforeOpen: (details) async {
          await customStatement('PRAGMA foreign_keys = ON;');
          await customStatement('PRAGMA journal_mode = WAL;');
          await customStatement('PRAGMA synchronous = NORMAL;');
          await customStatement('PRAGMA cache_size = -64000;');
        },
      );

  // ===================================================================
  // REMEDIES
  // ===================================================================

  Future<List<RemedyRow>> getRemedies({
    int limit = 50,
    int offset = 0,
    String? letter,
    String? author,
  }) {
    final query = select(remedies);
    if (letter != null) {
      query.where((r) => r.letter.equals(letter));
    }
    if (author != null) {
      query.where((r) => r.author.equals(author));
    }
    query
      ..orderBy([(r) => OrderingTerm(expression: r.name)])
      ..limit(limit, offset: offset);
    return query.get();
  }

  Future<int> getRemedyCount({String? letter, String? author}) async {
    final countExp = remedies.id.count();
    final query = selectOnly(remedies);
    if (letter != null) query.where(remedies.letter.equals(letter));
    if (author != null) query.where(remedies.author.equals(author));
    query.addColumns([countExp]);
    final row = await query.getSingle();
    return row.read(countExp) ?? 0;
  }

  Future<RemedyRow?> getRemedyById(String id) {
    return (select(remedies)..where((r) => r.id.equals(id))).getSingleOrNull();
  }

  /// Search remedies using FTS5
  Future<List<RemedyRow>> searchRemedies(String query, {int limit = 50}) async {
    final escaped = query.replaceAll('"', '""');
    final sql = '''
      SELECT r.id, r.name, r.common, r.author, r.letter, r.chapter,
             r.organ, r.keynote, r.source, r.updated_at, r.version
      FROM remedies r
      JOIN remedies_fts f ON f.rowid = r.rowid
      WHERE remedies_fts MATCH ?
      ORDER BY rank
      LIMIT ?
    ''';
    final rows = await customSelect(
      sql,
      variables: [Variable.withString('"$escaped"*'), Variable.withInt(limit)],
    ).get();
    return rows.map((row) {
      final d = row.data;
      return RemedyRow(
        id: d['id'] as String,
        name: d['name'] as String,
        common: (d['common'] as String?) ?? '',
        author: d['author'] as String,
        letter: (d['letter'] as String?) ?? '',
        chapter: (d['chapter'] as String?) ?? '',
        organ: (d['organ'] as String?) ?? '',
        keynote: (d['keynote'] as String?) ?? '',
        source: d['source'] as String?,
        updatedAt: DateTime.parse(d['updated_at'] as String),
        version: (d['version'] as num?)?.toInt() ?? 1,
      );
    }).toList();
  }

  Future<void> upsertRemedies(List<RemediesCompanion> entries) async {
    if (entries.isEmpty) return;
    await batch((b) {
      b.insertAll(remedies, entries, mode: InsertMode.insertOrReplace);
    });
  }

  Future<List<String>> getAuthors() async {
    final query = selectOnly(remedies, distinct: true);
    query.addColumns([remedies.author]);
    final rows = await query.map((row) => row.read(remedies.author)!).get();
    return rows;
  }

  // ===================================================================
  // RUBRICS
  // ===================================================================

  Future<List<RubricRow>> getTopLevelRubrics({
    String? chapter,
    int limit = 50,
    int offset = 0,
  }) {
    final query = select(rubrics)..where((r) => r.parentId.isNull());
    if (chapter != null) {
      query.where((r) => r.chapter.equals(chapter));
    }
    query
      ..orderBy([(r) => OrderingTerm(expression: r.main)])
      ..limit(limit, offset: offset);
    return query.get();
  }

  Future<List<RubricRow>> getSubRubrics(String parentId) {
    return (select(rubrics)
          ..where((r) => r.parentId.equals(parentId))
          ..orderBy([(r) => OrderingTerm(expression: r.main)]))
        .get();
  }

  Future<void> upsertRubrics(List<RubricsCompanion> entries) async {
    if (entries.isEmpty) return;
    await batch((b) {
      b.insertAll(rubrics, entries, mode: InsertMode.insertOrReplace);
    });
  }

  Future<int> getRubricCount({String? chapter}) async {
    final countExp = rubrics.id.count();
    final query = selectOnly(rubrics);
    if (chapter != null) query.where(rubrics.chapter.equals(chapter));
    query.addColumns([countExp]);
    return (await query.getSingle()).read(countExp) ?? 0;
  }

  // ===================================================================
  // CHAPTERS
  // ===================================================================

  Future<List<Chapter>> getAllChapters() => select(chapters).get();

  Future<void> upsertChapters(List<ChaptersCompanion> entries) async {
    if (entries.isEmpty) return;
    await batch((b) {
      b.insertAll(chapters, entries, mode: InsertMode.insertOrReplace);
    });
  }

  // ===================================================================
  // BOOKS
  // ===================================================================

  Future<List<Book>> getAllBooks() => select(books).get();

  Future<void> upsertBooks(List<BooksCompanion> entries) async {
    if (entries.isEmpty) return;
    await batch((b) {
      b.insertAll(books, entries, mode: InsertMode.insertOrReplace);
    });
  }

  // ===================================================================
  // BOOKMARKS
  // ===================================================================

  Future<List<Bookmark>> getAllBookmarks() {
    return (select(bookmarks)..orderBy([(b) => OrderingTerm.desc(b.createdAt)])).get();
  }

  Future<Bookmark?> getBookmark(String itemId, String itemType) {
    return (select(bookmarks)
          ..where((b) => b.itemId.equals(itemId) & b.itemType.equals(itemType)))
        .getSingleOrNull();
  }

  Future<void> addBookmark(BookmarksCompanion entry) async {
    await into(bookmarks).insert(entry, mode: InsertMode.insertOrReplace);
  }

  Future<void> removeBookmark(String itemId, String itemType) async {
    await (delete(bookmarks)
          ..where((b) => b.itemId.equals(itemId) & b.itemType.equals(itemType)))
        .go();
  }

  Future<List<Bookmark>> getPendingBookmarks() {
    return (select(bookmarks)..where((b) => b.pendingSync.equals(true))).get();
  }

  // ===================================================================
  // FAVORITES
  // ===================================================================

  Future<List<Favorite>> getAllFavorites() {
    return (select(favorites)..orderBy([(f) => OrderingTerm.desc(f.createdAt)])).get();
  }

  Future<Favorite?> getFavorite(String itemId, String itemType) {
    return (select(favorites)
          ..where((f) => f.itemId.equals(itemId) & f.itemType.equals(itemType)))
        .getSingleOrNull();
  }

  Future<void> addFavorite(FavoritesCompanion entry) async {
    await into(favorites).insert(entry, mode: InsertMode.insertOrReplace);
  }

  Future<void> removeFavorite(String itemId, String itemType) async {
    await (delete(favorites)
          ..where((f) => f.itemId.equals(itemId) & f.itemType.equals(itemType)))
        .go();
  }

  // ===================================================================
  // NOTES (UserNotes table)
  // ===================================================================

  Future<List<AppNote>> getNotes({String? itemId, String? itemType}) {
    final query = select(appNotes);
    if (itemId != null) query.where((n) => n.itemId.equals(itemId));
    if (itemType != null) query.where((n) => n.itemType.equals(itemType));
    query.orderBy([(n) => OrderingTerm.desc(n.updatedAt)]);
    return query.get();
  }

  Future<int> addNote(AppNotesCompanion entry) async {
    return await into(appNotes).insert(entry);
  }

  Future<void> updateNote(int localId, AppNotesCompanion entry) async {
    await (update(appNotes)..where((n) => n.localId.equals(localId))).write(entry);
  }

  Future<void> deleteNote(int localId) async {
    await (delete(appNotes)..where((n) => n.localId.equals(localId))).go();
  }

  // ===================================================================
  // READING HISTORY
  // ===================================================================

  Future<List<ReadingHistoryData>> getHistory({int limit = 100}) {
    return (select(readingHistory)
          ..orderBy([(h) => OrderingTerm.desc(h.viewedAt)])
          ..limit(limit))
        .get();
  }

  Future<void> addToHistory(ReadingHistoryCompanion entry) async {
    await (delete(readingHistory)
          ..where((h) => h.itemId.equals(entry.itemId.value) & h.itemType.equals(entry.itemType.value)))
        .go();
    await into(readingHistory).insert(entry);
  }

  Future<void> clearHistory() async {
    await delete(readingHistory).go();
  }

  // ===================================================================
  // SEARCH HISTORY
  // ===================================================================

  Future<List<SearchHistoryData>> getSearchHistory({int limit = 10}) {
    return (select(searchHistory)
          ..orderBy([(s) => OrderingTerm.desc(s.searchedAt)])
          ..limit(limit))
        .get();
  }

  Future<void> addSearchHistory(String query, String mode) async {
    await into(searchHistory).insert(SearchHistoryCompanion.insert(
      query: query,
      mode: Value(mode),
    ));
  }

  Future<void> clearSearchHistory() async {
    await delete(searchHistory).go();
  }

  // ===================================================================
  // SYNC METADATA
  // ===================================================================

  Future<SyncMetadataData?> getSyncMetadata(String dataType) {
    return (select(syncMetadata)..where((s) => s.dataType.equals(dataType))).getSingleOrNull();
  }

  Future<void> upsertSyncMetadata(SyncMetadataCompanion entry) async {
    await into(syncMetadata).insert(entry, mode: InsertMode.insertOrReplace);
  }

  Future<List<SyncMetadataData>> getAllSyncMetadata() => select(syncMetadata).get();

  // ===================================================================
  // PENDING CHANGES
  // ===================================================================

  Future<List<PendingChange>> getPendingChanges() {
    return (select(pendingChanges)..orderBy([(p) => OrderingTerm.asc(p.createdAt)])).get();
  }

  Future<int> addPendingChange(PendingChangesCompanion entry) async {
    return await into(pendingChanges).insert(entry);
  }

  Future<void> removePendingChange(int id) async {
    await (delete(pendingChanges)..where((p) => p.id.equals(id))).go();
  }

  Future<int> getPendingChangeCount() async {
    final countExp = pendingChanges.id.count();
    final query = selectOnly(pendingChanges)..addColumns([countExp]);
    final row = await query.getSingle();
    return row.read(countExp) ?? 0;
  }

  // ===================================================================
  // UTILITY
  // ===================================================================

  Future<void> clearAllContent() async {
    await customStatement('DELETE FROM remedies;');
    await customStatement('DELETE FROM rubrics;');
    await customStatement('DELETE FROM synthesis_rubrics;');
    await customStatement('DELETE FROM chapters;');
    await customStatement('DELETE FROM books;');
  }

  Future<int> getDatabaseSize() async {
    final row = await customSelect(
      'SELECT page_count * page_size AS size FROM pragma_page_count(), pragma_page_size();',
    ).getSingle();
    return row.read('size')!;
  }
}

LazyDatabase _openConnection() {
  return LazyDatabase(() async {
    final dbFolder = await getApplicationDocumentsDirectory();
    final file = File(p.join(dbFolder.path, 'pradips_homeo.db'));
    return NativeDatabase.createInBackground(file, logStatements: false);
  });
}
