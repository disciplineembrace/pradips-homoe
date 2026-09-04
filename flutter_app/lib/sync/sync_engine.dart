/// Sync engine — orchestrates initial and incremental synchronization.
library;

import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import '../core/config/app_config.dart';
import '../core/network/connectivity.dart';
import '../core/network/api_exceptions.dart';
import '../core/network/dio_client.dart';
import '../data/local/database.dart';

/// Sync progress for UI display.
class SyncProgress {
  final String entityType;
  final int current;
  final int total;
  final String status;
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

/// Sync result.
enum SyncStatus { success, offline, error, alreadyRunning }

class SyncResult {
  final SyncStatus status;
  final String? error;
  const SyncResult({required this.status, this.error});
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

  Future<SyncResult> sync({bool forceFull = false}) async {
    if (_isSyncing) {
      return const SyncResult(status: SyncStatus.alreadyRunning);
    }
    _isSyncing = true;

    try {
      if (!await _connectivity.checkOnline()) {
        return const SyncResult(status: SyncStatus.offline);
      }

      await _syncEntity('remedies', forceFull);
      await _syncEntity('rubrics', forceFull);
      await _syncEntity('books', forceFull);

      await _syncUserEntity('bookmarks');
      await _syncUserEntity('favorites');
      await _syncUserEntity('history');

      await _processOutbox();

      return const SyncResult(status: SyncStatus.success);
    } on ApiException catch (e) {
      return SyncResult(status: SyncStatus.error, error: e.message);
    } catch (e) {
      return SyncResult(status: SyncStatus.error, error: e.toString());
    } finally {
      _isSyncing = false;
    }
  }

  Future<void> _syncEntity(String entityType, bool forceFull) async {
    final state = await (_db.select(_db.syncState)
          ..where((s) => s.entityType.equals(entityType)))
        .getSingleOrNull();

    final bool initialSyncComplete = state?.initialSyncComplete ?? false;

    if (!initialSyncComplete || forceFull) {
      await _fullSync(entityType);
    } else {
      await _incrementalSync(entityType, state?.lastSyncedAt);
    }
  }

  Future<void> _fullSync(String entityType) async {
    final endpoint = _getEndpointForEntity(entityType);
    int page = 1;
    int total = 0;
    int received = 0;

    while (true) {
      if (!await _connectivity.checkOnline()) {
        throw const NoConnectionException();
      }

      final response = await _dio.get<Map<String, dynamic>>(endpoint,
          queryParameters: {
            'page': page,
            'pageSize': AppConfig.syncBatchSize,
          });

      final data =
          (response['items'] as List? ?? response['results'] as List? ?? [])
              .cast<Map<String, dynamic>>();
      total = (response['total'] as num?)?.toInt() ?? total;

      await _saveBatch(entityType, data);
      received += data.length;

      _progressController.add(SyncProgress(
        entityType: entityType,
        current: received,
        total: total,
        status: 'syncing',
      ));

      if (data.length < AppConfig.syncBatchSize) break;
      page++;

      await Future.delayed(const Duration(milliseconds: 100));
    }

    await _updateSyncState(entityType, received, total, true);
    _progressController.add(SyncProgress(
      entityType: entityType,
      current: received,
      total: total,
      status: 'complete',
    ));
  }

  Future<void> _incrementalSync(
      String entityType, DateTime? lastSynced) async {
    final endpoint = _getEndpointForEntity(entityType);
    int received = 0;

    while (true) {
      if (!await _connectivity.checkOnline()) {
        throw const NoConnectionException();
      }

      final params = <String, dynamic>{
        'page': 1,
        'pageSize': AppConfig.syncBatchSize,
      };
      if (lastSynced != null) {
        params['updatedSince'] = lastSynced.toIso8601String();
      }

      final response = await _dio.get<Map<String, dynamic>>(endpoint,
          queryParameters: params);
      final data =
          (response['items'] as List? ?? response['results'] as List? ?? [])
              .cast<Map<String, dynamic>>();

      if (data.isEmpty) break;

      await _applyIncrementalBatch(entityType, data);
      received += data.length;

      if (data.length < AppConfig.syncBatchSize) break;
    }

    await _updateSyncState(entityType, received, received, true,
        lastSynced: DateTime.now());
  }

  Future<void> _saveBatch(
      String entityType, List<Map<String, dynamic>> batch) async {
    await _db.transaction(() async {
      for (final item in batch) {
        final deletedAt = item['deletedAt'] != null
            ? DateTime.tryParse(item['deletedAt'].toString())
            : null;
        await _upsertEntity(entityType, item, deletedAt);
      }
    });
  }

  Future<void> _applyIncrementalBatch(
      String entityType, List<Map<String, dynamic>> batch) async {
    final deletions =
        batch.where((r) => r['deletedAt'] != null).length;

    if (deletions > 0) {
      final localCount = await _getLocalCount(entityType);
      if (localCount > 0 && deletions > (localCount * 0.10).toInt()) {
        _progressController.add(SyncProgress(
          entityType: entityType,
          current: 0,
          total: 0,
          status: 'error',
          message:
              'Unusual deletion count ($deletions). Sync paused for verification.',
        ));
        return;
      }
    }

    await _db.transaction(() async {
      for (final item in batch) {
        final deletedAt = item['deletedAt'] != null
            ? DateTime.tryParse(item['deletedAt'].toString())
            : null;
        await _upsertEntity(entityType, item, deletedAt);
      }
    });
  }

  Future<void> _syncUserEntity(String entityType) async {
    final endpoint = _getUserEndpointForEntity(entityType);
    try {
      final response = await _dio.get<Map<String, dynamic>>(endpoint);
      final items = (response['items'] as List? ?? [])
          .cast<Map<String, dynamic>>();
      await _saveUserBatch(entityType, items);
    } on ApiException {
      // Non-fatal
    }
  }

  Future<void> _processOutbox() async {
    final pending = await (_db.select(_db.outboxOperations)
          ..where((o) => o.status.equals('pending') | o.status.equals('failed'))
          ..orderBy([(o) => OrderingTerm.asc(o.createdAt)])
          ..limit(50))
        .get();

    for (final op in pending) {
      if (!await _connectivity.checkOnline()) break;

      try {
        await _processOutboxOp(op);
      } on ApiException catch (e) {
        await (_db.update(_db.outboxOperations)
              ..where((o) => o.operationId.equals(op.operationId)))
            .write(OutboxOperationsCompanion(
          status: const Value('failed'),
          retryCount: Value(op.retryCount + 1),
          lastAttemptAt: Value(DateTime.now()),
          lastError: Value(e.message),
        ));

        if (op.retryCount >= AppConfig.outboxMaxRetries) {
          break;
        }
      }
    }
  }

  Future<void> _processOutboxOp(OutboxOperation op) async {
    await (_db.update(_db.outboxOperations)
          ..where((o) => o.operationId.equals(op.operationId)))
        .write(const OutboxOperationsCompanion(status: Value('processing')));

    final payload = jsonDecode(op.payload) as Map<String, dynamic>;
    final endpoint = _getOutboxEndpoint(op.operationType);

    final response = await _dio.post<Map<String, dynamic>>(endpoint, data: {
      ...payload,
      'idempotencyKey': op.idempotencyKey ?? op.operationId,
    });

    await (_db.update(_db.outboxOperations)
          ..where((o) => o.operationId.equals(op.operationId)))
        .write(OutboxOperationsCompanion(
      status: const Value('synced'),
      lastAttemptAt: Value(DateTime.now()),
    ));

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
    if (opType.startsWith('create_bookmark') ||
        opType.startsWith('delete_bookmark')) {
      return AppConfig.bookmarksEndpoint;
    }
    if (opType.startsWith('create_favorite') ||
        opType.startsWith('delete_favorite')) {
      return AppConfig.favoritesEndpoint;
    }
    if (opType.startsWith('add_history')) {
      return AppConfig.historyEndpoint;
    }
    throw ArgumentError('Unknown operation: $opType');
  }

  /// Upsert a single entity into the local database.
  /// Handles remedies, rubrics, books.
  Future<void> _upsertEntity(
      String entityType, Map<String, dynamic> item, DateTime? deletedAt) async {
    final updatedAt = item['updatedAt'] != null
        ? DateTime.tryParse(item['updatedAt'].toString())
        : null;
    final lastSynced = DateTime.now();

    switch (entityType) {
      case 'remedies':
        await _db.into(_db.remedies).insertOnConflictUpdate(RemediesCompanion(
              serverId: Value(item['id'] ?? ''),
              name: Value(item['name'] ?? ''),
              author: Value(item['author'] ?? ''),
              sourceBook: Value(item['source_book'] ?? item['sourceBook']),
              keynote: Value(item['keynote']),
              full: Value(item['full']),
              updatedAt: Value(updatedAt),
              deletedAt: Value(deletedAt),
              syncStatus: const Value('synced'),
              lastSyncedAt: Value(lastSynced),
            ));
        break;
      case 'rubrics':
        await _db.into(_db.rubrics).insertOnConflictUpdate(RubricsCompanion(
              serverId: Value(item['id'] ?? ''),
              parentId: Value(item['parentId'] ?? item['parent_id']),
              source: Value(item['source'] ?? item['author'] ?? ''),
              chapter: Value(item['chapter'] ?? ''),
              title: Value(item['title'] ?? ''),
              fullPath: Value(item['fullPath'] ??
                  item['full_path'] ??
                  item['title'] ??
                  ''),
              level: Value(item['level'] ?? 0),
              remediesJson: Value(jsonEncode(item['remedies'] ?? [])),
              remedyCount: Value(item['remedyCount'] ?? 0),
              updatedAt: Value(updatedAt),
              deletedAt: Value(deletedAt),
              syncStatus: const Value('synced'),
              lastSyncedAt: Value(lastSynced),
            ));
        break;
      case 'books':
        await _db.into(_db.books).insertOnConflictUpdate(BooksCompanion(
              serverId: Value(item['id'] ?? ''),
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
            ));
        break;
    }
  }

  Future<void> _saveUserBatch(
      String entityType, List<Map<String, dynamic>> batch) async {
    await _db.transaction(() async {
      for (final item in batch) {
        final serverId = item['id']?.toString() ?? '';
        final entityId = item['entityId']?.toString() ?? '';
        final itemType = item['entityType']?.toString() ?? 'remedy';
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
            entityType: Value(itemType),
            title: Value(title),
            syncStatus: const Value('synced'),
            lastSyncedAt: Value(DateTime.now()),
            deletedAt: Value(deletedAt),
          ));
        } else if (entityType == 'favorite') {
          await _db.into(_db.favorites).insertOnConflictUpdate(
                  FavoritesCompanion(
                    serverId: Value(serverId),
                    userId: Value(userId),
                    entityId: Value(entityId),
                    entityType: Value(itemType),
                    title: Value(title),
                    syncStatus: const Value('synced'),
                    lastSyncedAt: Value(DateTime.now()),
                    deletedAt: Value(deletedAt),
                  ));
        } else if (entityType == 'history') {
          await _db.into(_db.readingHistory).insertOnConflictUpdate(
                  ReadingHistoryCompanion(
                    serverId: Value(serverId),
                    userId: Value(userId),
                    entityId: Value(entityId),
                    entityType: Value(itemType),
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
    final serverId = response?['id']?.toString();

    if (entityType == 'bookmark') {
      final localBookmarks = await (_db.select(_db.bookmarks)
            ..where((b) =>
                b.entityId.equals(entityId))
            ..where((b) => b.deletedAt.isNull()))
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
        return _db.remedyDao.countRemedies();
      case 'rubrics':
        return _db.rubricDao.countRubrics();
      case 'books':
        final countExp = _db.books.serverId.count();
        final query = _db.selectOnly(_db.books)
          ..addColumns([countExp])
          ..where(_db.books.deletedAt.isNull());
        return query.map((row) => row.read(countExp) ?? 0).getSingle();
      default:
        return 0;
    }
  }

  void dispose() {
    _progressController.close();
  }
}
