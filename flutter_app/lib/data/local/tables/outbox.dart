/// Outbox table — pending offline operations waiting to sync.
///
/// Each row represents a user action (bookmark add/remove, favorite toggle,
/// history visit) that was performed offline and needs to be synced to
/// the server when connectivity returns.
///
/// Processed by OutboxProcessor with:
///   - Idempotency keys (prevent duplicates)
///   - Retry with exponential backoff
///   - Failed ops preserved for later retry
library;

import 'package:drift/drift.dart';

class OutboxOperations extends Table {
  /// Unique operation ID (UUID generated locally)
  TextColumn get operationId => text()();
  TextColumn get userId => text()();

  /// Entity details
  TextColumn get entityId => text()();
  TextColumn get entityType => text()();

  /// Operation type: 'create_bookmark', 'delete_bookmark',
  /// 'create_favorite', 'delete_favorite', 'add_history', etc.
  TextColumn get operationType => text()();

  /// Operation payload as JSON
  TextColumn get payload => text().withDefault(const Constant('{}'))();

  /// Idempotency key — prevents duplicate writes if the same op
  /// is processed multiple times.
  TextColumn get idempotencyKey => text().nullable()();

  /// Status: 'pending', 'processing', 'synced', 'failed'
  TextColumn get status => text().withDefault(const Constant('pending'))();

  /// Local timestamp when operation was created
  DateTimeColumn get createdAt => dateTime().withDefault(currentDateAndTime)();

  /// Last attempt timestamp
  DateTimeColumn get lastAttemptAt => dateTime().nullable()();

  /// Retry count (exponential backoff)
  IntColumn get retryCount => integer().withDefault(const Constant(0))();

  /// Error message if failed (redacted, no sensitive data)
  TextColumn get lastError => text().nullable()();

  @override
  Set<Column> get primaryKey => {operationId};
}
