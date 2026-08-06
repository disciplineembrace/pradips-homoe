/// Bookmark DAO — database access for user bookmarks.
library;

import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/bookmarks.dart';

part 'bookmark_dao.g.dart';

@DriftAccessor(tables: [Bookmarks])
class BookmarkDao extends DatabaseAccessor<AppDatabase> with _$BookmarkDaoMixin {
  BookmarkDao(super.db);

  /// Get all bookmarks for a user (non-deleted).
  Future<List<Bookmark>> getBookmarks(String userId, {String? entityType}) {
    final q = select(bookmarks)
      ..where((b) =>
          b.userId.equals(userId) &
          b.deletedAt.isNull() &
          (entityType == null ? const Constant(true) : b.entityType.equals(entityType)))
      ..orderBy([(b) => OrderingTerm.desc(b.createdAt)]);
    return q.get();
  }

  /// Check if an entity is bookmarked.
  Future<bool> isBookmarked(String userId, String entityId) async {
    final result = await (select(bookmarks)
          ..where((b) =>
              b.userId.equals(userId) &
              b.entityId.equals(entityId) &
              b.deletedAt.isNull()))
        .get();
    return result.isNotEmpty;
  }

  /// Add a bookmark (local + pending sync).
  Future<int> addBookmark({
    required String userId,
    required String entityId,
    required String entityType,
    required String title,
  }) async {
    return into(bookmarks).insert(BookmarksCompanion.insert(
      userId: userId,
      entityId: entityId,
      entityType: entityType,
      title: title,
      syncStatus: const Value('pending'),
    ));
  }

  /// Remove a bookmark (soft-delete + pending sync).
  Future<void> removeBookmark(String userId, String entityId) async {
    await (update(bookmarks)
          ..where((b) =>
              b.userId.equals(userId) &
              b.entityId.equals(entityId) &
              b.deletedAt.isNull()))
        .write(BookmarksCompanion(
      deletedAt: Value(DateTime.now()),
      syncStatus: const Value('pending'),
    ));
  }

  /// Upsert from server sync.
  Future<void> upsertFromServer(BookmarksCompanion bookmark) async {
    await into(bookmarks).insertOnConflictUpdate(bookmark);
  }

  /// Get pending (unsynced) bookmarks.
  Future<List<Bookmark>> getPending(String userId) {
    return (select(bookmarks)
          ..where((b) =>
              b.userId.equals(userId) &
              b.syncStatus.equals('pending') &
              b.deletedAt.isNull()))
        .get();
  }

  /// Mark as synced.
  Future<void> markSynced(int localId, {String? serverId}) async {
    await (update(bookmarks)..where((b) => b.localId.equals(localId))).write(BookmarksCompanion(
      syncStatus: const Value('synced'),
      lastSyncedAt: Value(DateTime.now()),
      serverId: serverId != null ? Value(serverId) : const Value.absent(),
    ));
  }

  /// Count bookmarks.
  Future<int> count(String userId) async {
    final countExp = bookmarks.localId.count();
    return (selectOnly(bookmarks)
          ..addColumns([countExp])
          ..where(bookmarks.userId.equals(userId) & bookmarks.deletedAt.isNull()))
        .map((row) => row.read(countExp) ?? 0)
        .getSingle();
  }
}
