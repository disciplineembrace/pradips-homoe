/// Outbox DAO — database access for pending offline operations.
library;

import 'dart:convert';
import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/outbox.dart';

part 'outbox_dao.g.dart';

@DriftAccessor(tables: [OutboxOperations])
class OutboxDao extends DatabaseAccessor<AppDatabase> with _$OutboxDaoMixin {
  OutboxDao(super.db);

  /// Get all pending operations (oldest first).
  Future<List<OutboxOperation>> getPending({int limit = 50}) {
    return (select(outboxOperations)
          ..where((o) => o.status.equals('pending') | o.status.equals('failed'))
          ..orderBy([(o) => OrderingTerm.asc(o.createdAt)])
          ..limit(limit))
        .get();
  }

  /// Enqueue a new operation.
  Future<void> enqueue({
    required String operationId,
    required String userId,
    required String entityId,
    required String entityType,
    required String operationType,
    Map<String, dynamic>? payload,
    String? idempotencyKey,
  }) async {
    await into(outboxOperations).insert(OutboxOperationsCompanion.insert(
      operationId: operationId,
      userId: userId,
      entityId: entityId,
      entityType: entityType,
      operationType: operationType,
      payload: Value(payload != null ? _encodeJson(payload) : '{}'),
      idempotencyKey: Value(idempotencyKey ?? operationId),
    ));
  }

  /// Mark as processing.
  Future<void> markProcessing(String operationId) async {
    await (update(outboxOperations)
          ..where((o) => o.operationId.equals(operationId)))
        .write(const OutboxOperationsCompanion(status: Value('processing')));
  }

  /// Mark as synced (success).
  Future<void> markSynced(String operationId) async {
    await (update(outboxOperations)
          ..where((o) => o.operationId.equals(operationId)))
        .write(OutboxOperationsCompanion(
      status: const Value('synced'),
      lastAttemptAt: Value(DateTime.now()),
    ));
  }

  /// Mark as failed + increment retry count.
  Future<void> markFailed(String operationId, String error) async {
    final current = await (select(outboxOperations)
          ..where((o) => o.operationId.equals(operationId)))
        .getSingleOrNull();
    await (update(outboxOperations)
          ..where((o) => o.operationId.equals(operationId)))
        .write(OutboxOperationsCompanion(
      status: const Value('failed'),
      retryCount: Value((current?.retryCount ?? 0) + 1),
      lastAttemptAt: Value(DateTime.now()),
      lastError: Value(error.substring(0, error.length > 500 ? 500 : error.length)),
    ));
  }

  /// Delete synced operations older than 7 days (cleanup).
  Future<void> cleanupOldSynced() async {
    final cutoff = DateTime.now().subtract(const Duration(days: 7));
    await (delete(outboxOperations)
          ..where((o) =>
              o.status.equals('synced') & o.createdAt.isSmallerThanValue(cutoff)))
        .go();
  }

  /// Count pending operations.
  Future<int> countPending() async {
    final countExp = outboxOperations.operationId.count();
    return (selectOnly(outboxOperations)
          ..addColumns([countExp])
          ..where(outboxOperations.status.equals('pending') |
              outboxOperations.status.equals('failed')))
        .map((row) => row.read(countExp) ?? 0)
        .getSingle();
  }

  String _encodeJson(Map<String, dynamic> map) {
    return jsonEncode(map);
  }
}
