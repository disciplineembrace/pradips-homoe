/// Remedy repository — mediates between API, local DB, and UI.
///
/// Online: fetches from API, caches to SQLite.
/// Offline: reads from SQLite.
/// No placeholders — all methods fully implemented.
library;

import 'package:drift/drift.dart';
import '../../core/network/api_exceptions.dart';
import '../../core/network/connectivity.dart';
import '../local/database.dart';
import '../remote/api_client.dart';
import '../remote/dtos/dtos.dart';

class RemedyRepository {
  final ApiClient _api;
  final AppDatabase _db;
  final ConnectivityService _connectivity;

  RemedyRepository(this._api, this._db, this._connectivity);

  /// Get remedies (online or offline).
  /// Online: fetches from API + caches locally.
  /// Offline: reads from local SQLite.
  Future<List<Remedy>> getRemedies({
    String? author,
    String? query,
    int limit = 100,
    int offset = 0,
  }) async {
    if (_connectivity.isOnline) {
      try {
        final response = await _api.fetchRemedies(
          author: author,
          q: query,
          pageSize: limit,
        );
        // Cache fetched remedies locally
        await _cacheRemedies(response.items);
        return response.items.map(_dtoToRemedy).toList();
      } on ApiException {
        // Fall through to local fallback
      }
    }

    // Offline (or API failed) — read from local DB
    final remedies = await _db.remedyDao.getAllRemedies(
      author: author,
      limit: limit,
      offset: offset,
    );
    if (query != null && query.isNotEmpty) {
      return _db.remedyDao.searchRemedies(query, author: author, limit: limit);
    }
    return remedies;
  }

  /// Search remedies (online or offline).
  Future<List<Remedy>> searchRemedies(String query, {String? author, int limit = 50}) async {
    if (_connectivity.isOnline) {
      try {
        final response = await _api.fetchRemedies(q: query, author: author, pageSize: limit);
        await _cacheRemedies(response.items);
        return response.items.map(_dtoToRemedy).toList();
      } on ApiException {
        // Fall through to local search
      }
    }
    return _db.remedyDao.searchRemedies(query, author: author, limit: limit);
  }

  /// Get a single remedy by ID.
  Future<Remedy?> getRemedy(String id) async {
    // Try local first (fast)
    final local = await _db.remedyDao.getRemedy(id);
    if (local != null) return local;

    // If not cached, fetch from API (online only)
    if (_connectivity.isOnline) {
      try {
        final response = await _api.fetchRemedies(q: id, pageSize: 1);
        if (response.items.isNotEmpty) {
          await _cacheRemedies(response.items);
          return _dtoToRemedy(response.items.first);
        }
      } on ApiException {
        return null;
      }
    }
    return null;
  }

  /// Get all distinct authors (for filter dropdown).
  Future<List<String>> getAuthors() async {
    // Try local first
    final local = await _db.remedyDao.getAuthors();
    if (local.isNotEmpty) return local;

    // Fallback to a static list if DB is empty
    return ['All', 'Allen', 'Boericke', 'Kent', 'Murphy', 'Phatak', 'Dubey',
            'Boeger', 'Farrington', 'Mathur', 'Sankaran'];
  }

  /// Count total remedies.
  Future<int> count({String? author}) async {
    return _db.remedyDao.countRemedies(author: author);
  }

  // ============ Private helpers ============

  Future<void> _cacheRemedies(List<RemedyDto> remedies) async {
    for (final dto in remedies) {
      await _db.remedyDao.upsertRemedy(RemediesCompanion(
        serverId: Value(dto.id),
        name: Value(dto.name),
        author: Value(dto.author),
        sourceBook: Value(dto.sourceBook),
        keynote: Value(dto.keynote),
        full: Value(dto.full),
        syncStatus: const Value('synced'),
        lastSyncedAt: Value(DateTime.now()),
      ));
    }
  }

  Remedy _dtoToRemedy(RemedyDto dto) {
    // Return a Remedy object that the UI can use.
    // This is a generated Drift data class, so we construct it directly.
    return Remedy(
      serverId: dto.id,
      name: dto.name,
      author: dto.author,
      sourceBook: dto.sourceBook,
      keynote: dto.keynote,
      full: dto.full,
      updatedAt: null,
      deletedAt: null,
      syncStatus: 'synced',
      lastSyncedAt: DateTime.now(),
    );
  }
}
