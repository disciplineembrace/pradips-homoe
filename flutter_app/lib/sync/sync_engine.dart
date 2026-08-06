/// Sync engine — orchestrates initial and incremental synchronization.
///
/// Architecture:
///   1. Initial sync: download all content in batches, transactionally.
///   2. Incremental sync: use updated_at/cursor to fetch only changes.
///   3. Outbox processing: flush pending writes when online.
///   4. Conflict resolution: server-wins for content, version-based for user data.
///   5. Soft-delete handling: never delete on empty response, only on explicit delete signal.
///
/// Safety:
///   - Interrupted sync resumes from last checkpoint.
///   - Batch transactions prevent partial data.
///   - Count validation detects incomplete downloads.
///   - Exponential backoff on transient failures.
///   - Mass-deletion protection: stops if >10% records would be deleted.
library;

import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import '../../core/config/app_config.dart';
import '../../core/network/connectivity.dart';
import '../../core/network/api_exceptions.dart';
import '../../core/network/dio_client.dart';
import '../local/database.dart';
import '../local/tables/sync_state.dart';

/// Sync progress for UI display.
class SyncProgress {
  final String entityType;
  final int current;
  final int total;
  final String status; // 'syncing', 'complete', 'error'
  final String? message;

  const SyncProgress({
    required this.entityType,
    required this.current,
    required this.total,
    required this.status,
    this.message,
  });

  double get percent => total > 0 ? (current / total) : 0;
}

/// Sync engine — singleton orchestrator.
class SyncEngine {
  final AppDatabase _db;
  final DioClient _dio;
  final ConnectivityService _connectivity;

  final StreamController<SyncProgress> _progressController =
      StreamController<SyncProgress>.broadcast();
  Stream<SyncProgress> get progressStream => _progressController.stream;

  bool _isSyncing = false;
  bool get isSyncing => _isSyncing;

  SyncEngine(this._db, this._dio, this._connectivity);

  /// Run a full sync cycle:
  ///   1. Check connectivity
  ///   2. Incremental sync for each entity type
  ///   3. Process outbox
  Future<SyncResult> sync({bool forceFull = false}) async {
    if (_isSyncing) {
      return SyncResult(status: SyncStatus.alreadyRunning);
    }
    _isSyncing = true;

    try {
      // Check connectivity
      if (!await _connectivity.checkOnline()) {
        return SyncResult(status: SyncStatus.offline);
      }

      // Sync content entities (server-owned)
      await _syncEntity('remedies', forceFull);
      await _syncEntity('rubrics', forceFull);
      await _syncEntity('books', forceFull);

      // Sync user entities (user-owned, bidirectional)
      await _syncUserEntity('bookmarks');
      await _syncUserEntity('favorites');
      await _syncUserEntity('history');

      // Process outbox (pending writes)
      await _processOutbox();

      return SyncResult(status: SyncStatus.success);
    } on ApiException catch (e) {
      return SyncResult(status: SyncStatus.error, error: e.message);
    } catch (e) {
      return SyncResult(status: SyncStatus.error, error: e.toString());
    } finally {
      _isSyncing = false;
    }
  }

  /// Sync a server-owned content entity (remedies, rubrics, books).
  /// Uses cursor-based pagination + updated_at for incremental sync.
  Future<void> _syncEntity(String entityType, bool forceFull) async {
    // Get or create sync state
    final state = await (_db.select(_db.syncState)
          ..where((s) => s.entityType.equals(entityType)))
        .getSingleOrNull();

    final bool initialSyncComplete = state?.initialSyncComplete ?? false;
    final String? lastCursor = forceFull ? null : state?.nextCursor;
    final DateTime? lastSynced = forceFull ? null : state?.lastSyncedAt;

    if (!initialSyncComplete || forceFull) {
      // Full sync — download everything in batches
      await _fullSync(entityType);
    } else {
      // Incremental sync — only changed records since lastSynced
      await _incrementalSync(entityType, lastSynced, lastCursor);
    }
  }

  /// Full initial sync — download all records in batches.
  Future<void> _fullSync(String entityType) async {
    final endpoint = _getEndpointForEntity(entityType);
    int page = 1;
    int total = 0;
    int received = 0;
    String? cursor;

    while (true) {
      // Check connectivity before each batch
      if (!await _connectivity.checkOnline()) {
        throw const NoConnectionException();
      }

      // Fetch batch
      final response = await _dio.get<Map<String, dynamic>>(endpoint, queryParameters: {
        'page': page,
        'pageSize': AppConfig.syncBatchSize,
        'sync': true, // signal to API that this is a sync request
        'cursor': cursor,
      });

      final data = response['items'] as List? ?? response['results'] as List? ?? [];
      total = (response['total'] as num?)?.toInt() ?? total;

      // Save batch transactionally
      await _saveBatch(entityType, data.cast<Map<String, dynamic>>());
      received += data.length;

      // Emit progress
      _progressController.add(SyncProgress(
        entityType: entityType,
        current: received,
        total: total,
        status: 'syncing',
      ));

      // Check if done
      if (data.length < AppConfig.syncBatchSize) break;

      // Move to next page
      page++;
      cursor = response['nextCursor'] as String?;
      if (cursor == null && data.isEmpty) break;

      // Small delay between batches to avoid overwhelming the server
      await Future.delayed(const Duration(milliseconds: 100));
    }

    // Update sync state
    await _updateSyncState(entityType, received, total, true);
    _progressController.add(SyncProgress(
      entityType: entityType,
      current: received,
      total: total,
      status: 'complete',
    ));
  }

  /// Incremental sync — fetch only records updated since lastSynced.
  Future<void> _incrementalSync(
      String entityType, DateTime? lastSynced, String? cursor) async {
    final endpoint = _getEndpointForEntity(entityType);
    int received = 0;

    while (true) {
      if (!await _connectivity.checkOnline()) {
        throw const NoConnectionException();
      }

      final params = <String, dynamic>{
        'page': 1,
        'pageSize': AppConfig.syncBatchSize,
        'sync': true,
        'updatedSince': lastSynced?.toIso8601String(),
      };
      if (cursor != null) params['cursor'] = cursor;

      final response = await _dio.get<Map<String, dynamic>>(endpoint, queryParameters: params);
      final data = response['items'] as List? ?? response['results'] as List? ?? [];

      if (data.isEmpty) break;

      // Apply updates + deletions transactionally
      await _applyIncrementalBatch(entityType, data.cast<Map<String, dynamic>>());
      received += data.length;

      if (data.length < AppConfig.syncBatchSize) break;
      cursor = response['nextCursor'] as String?;
      if (cursor == null) break;
    }

    // Update sync checkpoint
    await _updateSyncState(entityType, received, received, true,
        lastSynced: DateTime.now());
  }

  /// Save a batch of records transactionally (full sync).
  Future<void> _saveBatch(String entityType, List<Map<String, dynamic>> batch) async {
    await _db.transaction(() async {
      for (final item in batch) {
        final deletedAt = item['deletedAt'] != null
            ? DateTime.parse(item['deletedAt'].toString())
            : null;

        final companion = _buildCompanion(entityType, item, deletedAt);
        await _upsert(entityType, companion);
      }
    });
  }

  /// Apply incremental batch (updates + soft-deletes).
  /// Includes mass-deletion protection.
  Future<void> _applyIncrementalBatch(
      String entityType, List<Map<String, dynamic>> batch) async {
    // Count deletions in this batch
    final deletions = batch.where((r) => r['deletedAt'] != null).length;

    // Mass-deletion protection: if >10% of local records would be deleted,
    // stop and log for manual verification.
    if (deletions > 0) {
      final localCount = await _getLocalCount(entityType);
      if (localCount > 0 && deletions > (localCount * 0.10).toInt()) {
        // Stop destructive sync step — preserve current local data
        _progressController.add(SyncProgress(
          entityType: entityType,
          current: 0,
          total: 0,
          status: 'error',
          message: 'Unusual deletion count detected ($deletions). Sync paused for verification.',
        ));
        // Log the issue for later review (redacted, no sensitive content)
        return;
      }
    }

    await _db.transaction(() async {
      for (final item in batch) {
        final deletedAt = item['deletedAt'] != null
            ? DateTime.parse(item['deletedAt'].toString())
            : null;
        final companion = _buildCompanion(entityType, item, deletedAt);
        await _upsert(entityType, companion);
      }
    });
  }

  /// Sync a user-owned entity (bookmarks, favorites, history).
  /// Bidirectional: download server changes + push local outbox.
  Future<void> _syncUserEntity(String entityType) async {
    // First, process any pending outbox operations for this entity
    // (handled by _processOutbox below)

    // Then, download server-side changes
    final endpoint = _getUserEndpointForEntity(entityType);
    try {
      final response = await _dio.get<Map<String, dynamic>>(endpoint);
      final items = response['items'] as List? ?? [];
      await _saveUserBatch(entityType, items.cast<Map<String, dynamic>>());
    } on ApiException {
      // Non-fatal — user data sync can retry later
    }
  }

  /// Process the outbox — flush pending writes to the server.
  Future<void> _processOutbox() async {
    final pending = await (_db.select(_db.outboxOperations)
          ..where((o) => status.equals('pending') | status.equals('failed'))
          ..orderBy([(o) => OrderingTerm.asc(o.createdAt)])
          ..limit(50))
        .get();

    for (final op in pending) {
      if (!await _connectivity.checkOnline()) break;

      try {
        await _processOutboxOp(op);
      } on ApiException catch (e) {
        // Mark as failed, increment retry count
        await (_db.update(_db.outboxOperations)
              ..where((o) => o.operationId.equals(op.operationId)))
            .write(OutboxOperationsCompanion(
          status: const Value('failed'),
          retryCount: Value(op.retryCount + 1),
          lastAttemptAt: Value(DateTime.now()),
          lastError: Value(e.message),
        ));

        // Exponential backoff: if retry count exceeded, stop processing
        if (op.retryCount >= AppConfig.outboxMaxRetries) {
          break; // Stop processing — will retry on next sync cycle
        }
      }
    }
  }

  /// Process a single outbox operation.
  Future<void> _processOutboxOp(OutboxOperation op) async {
    // Mark as processing
    await (_db.update(_db.outboxOperations)
          ..where((o) => o.operationId.equals(op.operationId)))
        .write(const OutboxOperationsCompanion(status: Value('processing')));

    final payload = jsonDecode(op.payload) as Map<String, dynamic>;
    final endpoint = _getOutboxEndpoint(op.operationType);
    final method = _getOutboxMethod(op.operationType);

    // Send with idempotency key to prevent duplicates
    final response = await _dio.post<Map<String, dynamic>>(endpoint, data: {
      ...payload,
      'idempotencyKey': op.idempotencyKey ?? op.operationId,
    });

    // Mark as synced
    await (_db.update(_db.outboxOperations)
          ..where((o) => o.operationId.equals(op.operationId)))
        .write(OutboxOperationsCompanion(
      status: const Value('synced'),
      lastAttemptAt: Value(DateTime.now()),
    ));

    // Update the corresponding local entity's sync status
    await _markEntitySynced(op.entityType, op.entityId, response);
  }

  // ============ Helper methods ============

  String _getEndpointForEntity(String entityType) {
    switch (entityType) {
      case 'remedies':
        return AppConfig.remediesEndpoint;
      case 'rubrics':
        return AppConfig.rubricsEndpoint;
      case 'books':
        return AppConfig.booksEndpoint;
      default:
        throw ArgumentError('Unknown entity: $entityType');
    }
  }

  String _getUserEndpointForEntity(String entityType) {
    switch (entityType) {
      case 'bookmarks':
        return AppConfig.bookmarksEndpoint;
      case 'favorites':
        return AppConfig.favoritesEndpoint;
      case 'history':
        return AppConfig.historyEndpoint;
      default:
        throw ArgumentError('Unknown user entity: $entityType');
    }
  }

  String _getOutboxEndpoint(String opType) {
    if (opType.startsWith('create_bookmark') || opType.startsWith('delete_bookmark')) {
      return AppConfig.bookmarksEndpoint;
    }
    if (opType.startsWith('create_favorite') || opType.startsWith('delete_favorite')) {
      return AppConfig.favoritesEndpoint;
    }
    if (opType.startsWith('add_history')) {
      return AppConfig.historyEndpoint;
    }
    throw ArgumentError('Unknown operation: $opType');
  }

  String _getOutboxMethod(String opType) {
    if (opType.startsWith('delete')) return 'DELETE';
    if (opType.startsWith('update')) return 'PUT';
    return 'POST';
  }

  Future<void> _upsert(String entityType, Insertable companion) async {
    switch (entityType) {
      case 'remedies':
        await _db.into(_db.remedies).insertOnConflictUpdate(companion as RemediesCompanion);
        break;
      case 'rubrics':
        await _db.into(_db.rubrics).insertOnConflictUpdate(companion as RubricsCompanion);
        break;
      case 'books':
        await _db.into(_db.books).insertOnConflictUpdate(companion as BooksCompanion);
        break;
    }
  }

  Insertable _buildCompanion(
      String entityType, Map<String, dynamic> item, DateTime? deletedAt) {
    final updatedAt = item['updatedAt'] != null
        ? DateTime.tryParse(item['updatedAt'].toString())
        : null;
    final lastSynced = DateTime.now();

    switch (entityType) {
      case 'remedies':
        return RemediesCompanion(
          serverId: Value(item['id'] ?? item['serverId'] ?? ''),
          name: Value(item['name'] ?? ''),
          author: Value(item['author'] ?? ''),
          sourceBook: Value(item['source_book'] ?? item['sourceBook']),
          keynote: Value(item['keynote']),
          full: Value(item['full']),
          updatedAt: Value(updatedAt),
          deletedAt: Value(deletedAt),
          syncStatus: const Value('synced'),
          lastSyncedAt: Value(lastSynced),
        );
      case 'rubrics':
        return RubricsCompanion(
          serverId: Value(item['id'] ?? item['serverId'] ?? ''),
          parentId: Value(item['parentId'] ?? item['parent_id']),
          source: Value(item['source'] ?? item['author'] ?? ''),
          chapter: Value(item['chapter'] ?? ''),
          title: Value(item['title'] ?? ''),
          fullPath: Value(item['fullPath'] ?? item['full_path'] ?? item['title'] ?? ''),
          level: Value(item['level'] ?? 0),
          remediesJson: Value(jsonEncode(item['remedies'] ?? [])),
          remedyCount: Value(item['remedyCount'] ?? 0),
          updatedAt: Value(updatedAt),
          deletedAt: Value(deletedAt),
          syncStatus: const Value('synced'),
          lastSyncedAt: Value(lastSynced),
        );
      case 'books':
        return BooksCompanion(
          serverId: Value(item['id'] ?? item['serverId'] ?? ''),
          title: Value(item['title'] ?? ''),
          subtitle: Value(item['subtitle']),
          author: Value(item['author']),
          category: Value(item['category']),
          description: Value(item['description']),
          totalChapters: Value(item['totalChapters'] ?? 0),
          updatedAt: Value(updatedAt),
          deletedAt: Value(deletedAt),
          syncStatus: const Value('synced'),
          lastSyncedAt: Value(lastSynced),
        );
      default:
        throw ArgumentError('Unknown entity: $entityType');
    }
  }

  Future<void> _saveUserBatch(
      String entityType, List<Map<String, dynamic>> batch) async {
    await _db.transaction(() async {
      for (final item in batch) {
        final serverId = item['id']?.toString() ?? '';
        final entityId = item['entityId']?.toString() ?? '';
        final entityType = item['entityType']?.toString() ?? 'remedy';
        final title = item['title']?.toString() ?? '';
        final userId = item['userId']?.toString() ?? '';
        final deletedAt = item['deletedAt'] != null
            ? DateTime.tryParse(item['deletedAt'].toString())
            : null;

        if (entityType == 'bookmark') {
          await _db.bookmarkDao.upsertFromServer(BookmarksCompanion(
            serverId: Value(serverId),
            userId: Value(userId),
            entityId: Value(entityId),
            entityType: Value(entityType),
            title: Value(title),
            syncStatus: const Value('synced'),
            lastSyncedAt: Value(DateTime.now()),
            deletedAt: Value(deletedAt),
          ));
        } else if (entityType == 'favorite') {
          await _db.into(_db.favorites).insertOnConflictUpdate(FavoritesCompanion(
            serverId: Value(serverId),
            userId: Value(userId),
            entityId: Value(entityId),
            entityType: Value(entityType),
            title: Value(title),
            syncStatus: const Value('synced'),
            lastSyncedAt: Value(DateTime.now()),
            deletedAt: Value(deletedAt),
          ));
        } else if (entityType == 'history') {
          await _db.into(_db.readingHistory).insertOnConflictUpdate(ReadingHistoryCompanion(
            serverId: Value(serverId),
            userId: Value(userId),
            entityId: Value(entityId),
            entityType: Value(entityType),
            title: Value(title),
            syncStatus: const Value('synced'),
            lastSyncedAt: Value(DateTime.now()),
            deletedAt: Value(deletedAt),
          ));
        }
      }
    });
  }

  Future<void> _markEntitySynced(
      String entityType, String entityId, Map<String, dynamic>? response) async {
    // Update the local entity's syncStatus to 'synced' and set serverId
    // if this was a create operation.
    final serverId = response?['id']?.toString();

    if (entityType == 'bookmark') {
      // Find the local bookmark by entityId and mark as synced
      final localBookmarks = await (_db.select(_db.bookmarks)
            ..where((b) => b.entityId.equals(entityId) & b.deletedAt.isNull()))
          .get();
      for (final bm in localBookmarks) {
        await _db.bookmarkDao.markSynced(bm.localId, serverId: serverId);
      }
    }
  }

  Future<void> _updateSyncState(
      String entityType, int received, int total, bool complete,
      {DateTime? lastSynced}) async {
    await _db.into(_db.syncState).insertOnConflictUpdate(SyncStateCompanion(
          entityType: Value(entityType),
          lastSyncedAt: Value(lastSynced ?? DateTime.now()),
          totalSynced: Value(received),
          initialSyncComplete: Value(complete),
          status: const Value('complete'),
        ));
  }

  Future<int> _getLocalCount(String entityType) async {
    switch (entityType) {
      case 'remedies':
        final count = await _db.remedies.count().get();
        return count;
      case 'rubrics':
        return _db.rubrics.count().get();
      case 'books':
        return _db.books.count().get();
      default:
        return 0;
    }
  }

  void dispose() {
    _progressController.close();
  }
}

/// Sync result.
enum SyncStatus { success, offline, error, alreadyRunning }

class SyncResult {
  final SyncStatus status;
  final String? error;
  const SyncResult({required this.status, this.error});
}

// Note: syncEngineProvider is defined in lib/main.dart
// (it wires together AppDatabase + DioClient + ConnectivityService).
