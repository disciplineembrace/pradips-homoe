/// Remedy DAO — database access for Materia Medica remedies.
///
/// All methods are fully implemented using Drift queries.
/// No placeholders.
library;

import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/remedies.dart';

part 'remedy_dao.g.dart';

@DriftAccessor(tables: [Remedies])
class RemedyDao extends DatabaseAccessor<AppDatabase> with _$RemedyDaoMixin {
  RemedyDao(super.db);

  /// Get all remedies, optionally filtered by author.
  Future<List<Remedy>> getAllRemedies({String? author, int? limit, int? offset}) {
    final query = select(remedies);
    if (author != null && author != 'All') {
      query.where((r) => r.author.equals(author) & r.deletedAt.isNull());
    } else {
      query.where((r) => r.deletedAt.isNull());
    }
    query
      ..orderBy([(r) => OrderingTerm.asc(r.name)])
      ..limit(limit ?? 100, offset: offset ?? 0);
    return query.get();
  }

  /// Search remedies by name (case-insensitive LIKE).
  Future<List<Remedy>> searchRemedies(String query, {String? author, int limit = 50}) {
    final q = select(remedies);
    final pattern = '%${query.toLowerCase()}%';
    q.where((r) =>
      r.name.lower().like(pattern) &
      r.deletedAt.isNull() &
      (author == null || author == 'All' ? const Constant(true) : r.author.equals(author)));
    q
      ..orderBy([(r) => OrderingTerm.asc(r.name)])
      ..limit(limit);
    return q.get();
  }

  /// Get a single remedy by serverId.
  Future<Remedy?> getRemedy(String serverId) {
    return (select(remedies)..where((r) => r.serverId.equals(serverId))).getSingleOrNull();
  }

  /// Count total remedies (non-deleted).
  Future<int> countRemedies({String? author}) {
    final countExp = remedies.serverId.count();
    final query = selectOnly(remedies)
      ..addColumns([countExp])
      ..where(remedies.deletedAt.isNull());
    if (author != null && author != 'All') {
      query.where(remedies.author.equals(author));
    }
    return query.map((row) => row.read(countExp) ?? 0).getSingle();
  }

  /// Get all distinct authors.
  Future<List<String>> getAuthors() async {
    final query = selectOnly(remedies, distinct: true)
      ..addColumns([remedies.author])
      ..where(remedies.deletedAt.isNull() & remedies.author.isNotNull());
    final rows = await query.get();
    return rows.map((row) => row.read(remedies.author)!).toList()..sort();
  }

  /// Upsert a remedy (insert or replace on conflict).
  Future<void> upsertRemedy(RemediesCompanion remedy) async {
    await into(remedies).insertOnConflictUpdate(remedy);
  }

  /// Batch upsert remedies.
  Future<void> batchUpsert(List<RemediesCompanion> batch) async {
    await Future.wait(batch.map((r) => into(remedies).insertOnConflictUpdate(r)));
  }

  /// Soft-delete a remedy by serverId.
  Future<void> softDelete(String serverId, {DateTime? deletedAt}) async {
    await (update(remedies)..where((r) => r.serverId.equals(serverId)))
        .write(RemediesCompanion(deletedAt: Value(deletedAt ?? DateTime.now())));
  }

  /// Mark a remedy as synced.
  Future<void> markSynced(String serverId) async {
    await (update(remedies)..where((r) => r.serverId.equals(serverId)))
        .write(const RemediesCompanion(syncStatus: Value('synced'), lastSyncedAt: Value(null)));
  }

  /// Get remedies modified since a given date (for sync).
  Future<List<Remedy>> getModifiedSince(DateTime since) {
    return (select(remedies)
          ..where((r) => r.updatedAt.isBiggerOrEqualValue(since) | r.lastSyncedAt.isNull()))
        .get();
  }
}
