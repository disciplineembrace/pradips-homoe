/// Bookmark repository — handles user bookmarks with offline outbox.
///
/// Local writes are immediate (SQLite). Server sync happens via outbox.
library;

import 'dart:convert';
import 'package:drift/drift.dart';
import '../../core/network/api_exceptions.dart';
import '../../core/network/connectivity.dart';
import '../local/database.dart';
import '../remote/api_client.dart';

class BookmarkRepository {
  final ApiClient _api;
  final AppDatabase _db;
  final ConnectivityService _connectivity;

  BookmarkRepository(this._api, this._db, this._connectivity);

  /// Get all bookmarks for a user.
  /// Online: fetches from server + merges with local.
  /// Offline: reads from local SQLite.
  Future<List<Bookmark>> getBookmarks(String userId, {String? entityType}) async {
    // Always read from local first (instant)
    final local = await _db.bookmarkDao.getBookmarks(userId, entityType: entityType);

    if (_connectivity.isOnline) {
      try {
        // Fetch from server and merge
        final serverBookmarks = await _api.fetchBookmarks();
        for (final sb in serverBookmarks) {
          final serverId = sb['id']?.toString() ?? '';
          final entityId = sb['entityId']?.toString() ?? '';
          final entityType = sb['entityType']?.toString() ?? 'remedy';
          final title = sb['title']?.toString() ?? '';
          await _db.bookmarkDao.upsertFromServer(BookmarksCompanion(
            serverId: Value(serverId),
            userId: Value(userId),
            entityId: Value(entityId),
            entityType: Value(entityType),
            title: Value(title),
            syncStatus: const Value('synced'),
            lastSyncedAt: Value(DateTime.now()),
          ));
        }
        // Return merged result from local
        return _db.bookmarkDao.getBookmarks(userId, entityType: entityType);
      } on ApiException {
        // Return local on failure
      }
    }
    return local;
  }

  /// Check if an entity is bookmarked.
  Future<bool> isBookmarked(String userId, String entityId) async {
    return _db.bookmarkDao.isBookmarked(userId, entityId);
  }

  /// Add a bookmark.
  /// Writes locally immediately + enqueues outbox operation for server sync.
  Future<void> addBookmark({
    required String userId,
    required String entityId,
    required String entityType,
    required String title,
  }) async {
    // 1. Write locally immediately
    await _db.bookmarkDao.addBookmark(
      userId: userId,
      entityId: entityId,
      entityType: entityType,
      title: title,
    );

    // 2. Enqueue outbox operation
    final operationId = 'create_bookmark_${entityId}_${DateTime.now().millisecondsSinceEpoch}';
    await _db.outboxDao.enqueue(
      operationId: operationId,
      userId: userId,
      entityId: entityId,
      entityType: entityType,
      operationType: 'create_bookmark',
      payload: {
        'entityId': entityId,
        'entityType': entityType,
        'title': title,
      },
      idempotencyKey: operationId,
    );
  }

  /// Remove a bookmark.
  /// Soft-deletes locally + enqueues outbox operation.
  Future<void> removeBookmark({
    required String userId,
    required String entityId,
  }) async {
    // 1. Soft-delete locally
    await _db.bookmarkDao.removeBookmark(userId, entityId);

    // 2. Enqueue outbox operation
    final operationId = 'delete_bookmark_${entityId}_${DateTime.now().millisecondsSinceEpoch}';
    await _db.outboxDao.enqueue(
      operationId: operationId,
      userId: userId,
      entityId: entityId,
      entityType: 'bookmark',
      operationType: 'delete_bookmark',
      payload: {
        'entityId': entityId,
      },
      idempotencyKey: operationId,
    );
  }

  /// Count bookmarks.
  Future<int> count(String userId) {
    return _db.bookmarkDao.count(userId);
  }
}
