/// Rubric DAO — database access for Repertory rubrics.
///
/// All methods fully implemented. No placeholders.
library;

import 'package:drift/drift.dart';
import '../database.dart';
import '../tables/rubrics.dart';

part 'rubric_dao.g.dart';

@DriftAccessor(tables: [Rubrics])
class RubricDao extends DatabaseAccessor<AppDatabase> with _$RubricDaoMixin {
  RubricDao(super.db);

  /// Get root rubrics (parentId is null) for a given source + optional chapter.
  Future<List<Rubric>> getRoots(String source, {String? chapter}) {
    final q = select(rubrics)
      ..where((r) =>
          r.source.equals(source) &
          r.parentId.isNull() &
          r.deletedAt.isNull() &
          (chapter == null || chapter.isEmpty ? const Constant(true) : r.chapter.equals(chapter)))
      ..orderBy([(r) => OrderingTerm.asc(r.title)]);
    return q.get();
  }

  /// Get children of a given parent (one level deep — for lazy loading).
  Future<List<Rubric>> getChildren(String parentId) {
    return (select(rubrics)
          ..where((r) => r.parentId.equals(parentId) & r.deletedAt.isNull())
          ..orderBy([(r) => OrderingTerm.asc(r.title)]))
        .get();
  }

  /// Search rubrics by title/path (case-insensitive).
  Future<List<Rubric>> searchRubrics(String query, {String? source, int limit = 50}) {
    final pattern = '%${query.toLowerCase()}%';
    final q = select(rubrics)
      ..where((r) =>
          (r.title.lower().like(pattern) | r.fullPath.lower().like(pattern)) &
          r.deletedAt.isNull() &
          (source == null || source.isEmpty ? const Constant(true) : r.source.equals(source)))
      ..limit(limit);
    return q.get();
  }

  /// Get a single rubric by serverId.
  Future<Rubric?> getRubric(String serverId) {
    return (select(rubrics)..where((r) => r.serverId.equals(serverId)))
        .getSingleOrNull();
  }

  /// Count rubrics for a given source.
  Future<int> countRubrics({String? source}) {
    final countExp = rubrics.serverId.count();
    final q = selectOnly(rubrics)
      ..addColumns([countExp])
      ..where(rubrics.deletedAt.isNull());
    if (source != null) {
      q.where(rubrics.source.equals(source));
    }
    return q.map((row) => row.read(countExp) ?? 0).getSingle();
  }

  /// Get distinct chapters for a source.
  Future<List<String>> getChapters(String source) async {
    final q = selectOnly(rubrics, distinct: true)
      ..addColumns([rubrics.chapter])
      ..where(rubrics.source.equals(source) &
          rubrics.deletedAt.isNull() &
          rubrics.chapter.isNotNull() &
          rubrics.chapter.isNotEmpty());
    final rows = await q.get();
    return rows.map((row) => row.read(rubrics.chapter)!).toList()..sort();
  }

  /// Upsert a rubric.
  Future<void> upsertRubric(RubricsCompanion rubric) async {
    await into(rubrics).insertOnConflictUpdate(rubric);
  }

  /// Batch upsert.
  Future<void> batchUpsert(List<RubricsCompanion> batch) async {
    await Future.wait(batch.map((r) => into(rubrics).insertOnConflictUpdate(r)));
  }

  /// Soft-delete.
  Future<void> softDelete(String serverId, {DateTime? deletedAt}) async {
    await (update(rubrics)..where((r) => r.serverId.equals(serverId)))
        .write(RubricsCompanion(deletedAt: Value(deletedAt ?? DateTime.now())));
  }
}
