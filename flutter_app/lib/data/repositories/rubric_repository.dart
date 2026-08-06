/// Rubric repository — mediates between API, local DB, and UI for repertory.
///
/// Supports lazy-loading of rubric hierarchy (parent → children).
/// Online: fetches from API, caches to SQLite.
/// Offline: reads from SQLite.
library;

import 'package:drift/drift.dart';
import '../../core/network/api_exceptions.dart';
import '../../core/network/connectivity.dart';
import '../local/database.dart';
import '../remote/api_client.dart';
import '../remote/dtos/dtos.dart';

class RubricRepository {
  final ApiClient _api;
  final AppDatabase _db;
  final ConnectivityService _connectivity;

  RubricRepository(this._api, this._db, this._connectivity);

  /// Get root rubrics (level 0) for a source + optional chapter.
  Future<List<Rubric>> getRoots(String source, {String? chapter}) async {
    if (_connectivity.isOnline) {
      try {
        final roots = await _api.fetchRubricChildren(author: source, chapter: chapter);
        await _cacheRubrics(roots);
        return roots.map(_dtoToRubric).toList();
      } on ApiException {
        // Fall through to local
      }
    }
    return _db.rubricDao.getRoots(source, chapter: chapter);
  }

  /// Get children of a rubric (lazy loading — one level).
  Future<List<Rubric>> getChildren(String parentId) async {
    // Try local cache first (fast)
    final local = await _db.rubricDao.getChildren(parentId);
    if (local.isNotEmpty) return local;

    // If not cached, fetch from API
    if (_connectivity.isOnline) {
      try {
        // Extract source from a parent lookup
        final parent = await _db.rubricDao.getRubric(parentId);
        if (parent == null) return [];
        final children = await _api.fetchRubricChildren(
          author: parent.source,
          parentId: parentId,
        );
        await _cacheRubrics(children);
        return children.map(_dtoToRubric).toList();
      } on ApiException {
        return [];
      }
    }
    return [];
  }

  /// Search rubrics.
  Future<List<Rubric>> searchRubrics(String query, {String? source, int limit = 50}) async {
    if (_connectivity.isOnline) {
      try {
        final response = await _api.fetchRubrics(q: query, author: source, pageSize: limit);
        await _cacheRubrics(response.items);
        return response.items.map(_dtoToRubric).toList();
      } on ApiException {
        // Fall through to local search
      }
    }
    return _db.rubricDao.searchRubrics(query, source: source, limit: limit);
  }

  /// Get chapters for a source.
  Future<List<String>> getChapters(String source) async {
    // Try local first
    final local = await _db.rubricDao.getChapters(source);
    if (local.isNotEmpty) return local;

    // Fetch from API
    if (_connectivity.isOnline) {
      try {
        return await _api.fetchChapters(source);
      } on ApiException {
        return [];
      }
    }
    return [];
  }

  /// Count rubrics.
  Future<int> count({String? source}) {
    return _db.rubricDao.countRubrics(source: source);
  }

  // ============ Private helpers ============

  Future<void> _cacheRubrics(List<RubricDto> rubrics) async {
    for (final dto in rubrics) {
      await _db.rubricDao.upsertRubric(RubricsCompanion(
        serverId: Value(dto.id),
        parentId: Value(dto.parentId),
        source: Value(dto.source),
        chapter: Value(dto.chapter),
        title: Value(dto.title),
        fullPath: Value(dto.fullPath),
        level: Value(dto.level),
        remediesJson: Value(dto.remediesJson),
        remedyCount: Value(dto.remedyCount),
        syncStatus: const Value('synced'),
        lastSyncedAt: Value(DateTime.now()),
      ));
    }
  }

  Rubric _dtoToRubric(RubricDto dto) {
    return Rubric(
      serverId: dto.id,
      parentId: dto.parentId,
      source: dto.source,
      chapter: dto.chapter,
      title: dto.title,
      fullPath: dto.fullPath,
      level: dto.level,
      remediesJson: dto.remediesJson,
      remedyCount: dto.remedyCount,
      updatedAt: null,
      deletedAt: null,
      syncStatus: 'synced',
      lastSyncedAt: DateTime.now(),
    );
  }
}
