/// Outbox processor — flushes pending offline operations to the server.
///
/// Processes each pending operation:
///   1. Mark as 'processing'
///   2. Send to API with idempotency key
///   3. On success: mark as 'synced'
///   4. On failure: mark as 'failed', increment retryCount, exponential backoff
///
/// Uses idempotency keys to prevent duplicate writes if the same operation
/// is processed multiple times (e.g., after a network recovery).
library;

import 'dart:async';
import 'dart:convert';
import '../core/config/app_config.dart';
import '../core/network/api_exceptions.dart';
import '../core/network/connectivity.dart';
import '../core/network/dio_client.dart';
import '../data/local/database.dart';

class OutboxProcessor {
  final AppDatabase _db;
  final DioClient _dio;
  final ConnectivityService _connectivity;

  bool _processing = false;
  Timer? _timer;

  OutboxProcessor(this._db, this._dio, this._connectivity);

  /// Start periodic processing.
  void start() {
    _timer?.cancel();
    _timer = Timer.periodic(
      Duration(seconds: AppConfig.outboxProcessIntervalSec),
      (_) => processPending(),
    );

    // Also process on connectivity change
    _connectivity.statusStream.listen((status) {
      if (status == ConnectivityStatus.online) {
        processPending();
      }
    });
  }

  /// Stop periodic processing.
  void stop() {
    _timer?.cancel();
    _timer = null;
  }

  /// Process all pending outbox operations.
  Future<void> processPending() async {
    if (_processing) return;
    if (!await _connectivity.checkOnline()) return;

    _processing = true;
    try {
      final pending = await _db.outboxDao.getPending(limit: 50);

      for (final op in pending) {
        if (!await _connectivity.checkOnline()) break;

        // Check retry limit
        if (op.retryCount >= AppConfig.outboxMaxRetries) {
          // Skip — will be logged for manual review
          continue;
        }

        await _processOperation(op);
      }

      // Cleanup old synced operations
      await _db.outboxDao.cleanupOldSynced();
    } finally {
      _processing = false;
    }
  }

  /// Process a single outbox operation.
  Future<void> _processOperation(OutboxOperation op) async {
    await _db.outboxDao.markProcessing(op.operationId);

    try {
      final payload = jsonDecode(op.payload) as Map<String, dynamic>;

      switch (op.operationType) {
        case 'create_bookmark':
          await _sendCreateBookmark(op, payload);
          break;
        case 'delete_bookmark':
          await _sendDeleteBookmark(op, payload);
          break;
        case 'create_favorite':
          await _sendCreateFavorite(op, payload);
          break;
        case 'delete_favorite':
          await _sendDeleteFavorite(op, payload);
          break;
        case 'add_history':
          await _sendAddHistory(op, payload);
          break;
        default:
          // Unknown operation type — mark as synced to prevent retries
          await _db.outboxDao.markSynced(op.operationId);
      }
    } on ApiException catch (e) {
      await _db.outboxDao.markFailed(op.operationId, e.message);
    } catch (e) {
      await _db.outboxDao.markFailed(op.operationId, e.toString());
    }
  }

  Future<void> _sendCreateBookmark(OutboxOperation op, Map<String, dynamic> payload) async {
    final response = await _dio.post<Map<String, dynamic>>(
      '/api/user/bookmarks',
      data: {
        ...payload,
        'idempotencyKey': op.idempotencyKey ?? op.operationId,
      },
    );

    // Mark outbox as synced
    await _db.outboxDao.markSynced(op.operationId);

    // Update the local bookmark's serverId + sync status
    final serverId = response['id']?.toString();
    if (serverId != null) {
      // Find the local bookmark by entityId and update it
      final localBookmarks = await (_db.select(_db.bookmarks)
            ..where((b) =>
                b.userId.equals(op.userId))
            ..where((b) => b.entityId.equals(op.entityId))
            ..where((b) => b.deletedAt.isNull()))
          .get();
      for (final bm in localBookmarks) {
        await _db.bookmarkDao.markSynced(bm.localId, serverId: serverId);
      }
    }
  }

  Future<void> _sendDeleteBookmark(OutboxOperation op, Map<String, dynamic> payload) async {
    await _dio.delete(
      '/api/user/bookmarks',
      queryParameters: {
        'entityId': op.entityId,
        'idempotencyKey': op.idempotencyKey ?? op.operationId,
      },
    );
    await _db.outboxDao.markSynced(op.operationId);
  }

  Future<void> _sendCreateFavorite(OutboxOperation op, Map<String, dynamic> payload) async {
    await _dio.post<Map<String, dynamic>>(
      '/api/user/favorites',
      data: {
        ...payload,
        'idempotencyKey': op.idempotencyKey ?? op.operationId,
      },
    );
    await _db.outboxDao.markSynced(op.operationId);
  }

  Future<void> _sendDeleteFavorite(OutboxOperation op, Map<String, dynamic> payload) async {
    await _dio.delete(
      '/api/user/favorites',
      queryParameters: {
        'entityId': op.entityId,
        'idempotencyKey': op.idempotencyKey ?? op.operationId,
      },
    );
    await _db.outboxDao.markSynced(op.operationId);
  }

  Future<void> _sendAddHistory(OutboxOperation op, Map<String, dynamic> payload) async {
    await _dio.post<Map<String, dynamic>>(
      '/api/user/history',
      data: {
        ...payload,
        'idempotencyKey': op.idempotencyKey ?? op.operationId,
      },
    );
    await _db.outboxDao.markSynced(op.operationId);
  }
}
