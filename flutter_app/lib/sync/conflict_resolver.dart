/// Conflict resolver — resolves sync conflicts between local and server data.
///
/// Rules:
///   - Server-owned content (remedies, rubrics, books): server wins.
///     The latest valid server version replaces local.
///   - User-owned data (bookmarks, favorites, history): version-based.
///     Non-conflicting changes are merged. Never duplicate. Never lose data.
///   - Unresolved conflicts are logged safely (redacted, no sensitive content).
library;

/// Conflict resolver — resolves sync conflicts between local and server data.
///
/// Rules:
///   - Server-owned content (remedies, rubrics, books): server wins.
///     The latest valid server version replaces local.
///   - User-owned data (bookmarks, favorites, history): version-based.
///     Non-conflicting changes are merged. Never duplicate. Never lose data.
///   - Unresolved conflicts are logged safely (redacted, no sensitive content).
class ConflictResolver {
  ConflictResolver();

  /// Resolve a conflict for server-owned content (remedies, rubrics, books).
  /// Server wins — latest server version replaces local.
  ///
  /// [serverRecord] must have: serverId, updatedAt
  /// [localRecord] is the current local row (may be null if not yet cached)
  ///
  /// Returns true if the local record was updated.
  Future<bool> resolveServerOwned({
    required String entityType,
    required Map<String, dynamic> serverRecord,
    Map<String, dynamic>? localRecord,
  }) async {
    final serverUpdatedAt = serverRecord['updatedAt'] != null
        ? DateTime.tryParse(serverRecord['updatedAt'].toString())
        : null;
    final localUpdatedAt = localRecord?['updatedAt'] != null
        ? DateTime.tryParse(localRecord!['updatedAt'].toString())
        : null;

    // If server has a newer version (or local doesn't exist), server wins
    if (localUpdatedAt == null ||
        (serverUpdatedAt != null && serverUpdatedAt.isAfter(localUpdatedAt))) {
      // The actual upsert is handled by the sync engine's _saveBatch method.
      // This method just signals that the server version should be applied.
      return true;
    }

    // Local is newer or same — keep local (shouldn't happen for server-owned,
    // but we keep local to be safe)
    return false;
  }

  /// Resolve a conflict for user-owned data (bookmarks, favorites, history).
  /// Version-based conflict detection with safe merge.
  ///
  /// Returns a ConflictResolution indicating what action to take.
  ConflictResolution resolveUserOwned({
    required Map<String, dynamic> serverRecord,
    required Map<String, dynamic> localRecord,
  }) {
    final serverDeletedAt = serverRecord['deletedAt'] != null
        ? DateTime.tryParse(serverRecord['deletedAt'].toString())
        : null;
    final localDeletedAt = localRecord['deletedAt'] != null
        ? DateTime.tryParse(localRecord['deletedAt'].toString())
        : null;

    // If server says deleted, honor the deletion
    if (serverDeletedAt != null && localDeletedAt == null) {
      return ConflictResolution.applyServerDelete;
    }

    // If local says deleted but server doesn't — keep local deletion
    // (the outbox will push the delete to the server)
    if (localDeletedAt != null && serverDeletedAt == null) {
      return ConflictResolution.keepLocal;
    }

    // Both deleted — already in sync
    if (serverDeletedAt != null && localDeletedAt != null) {
      return ConflictResolution.alreadyInSync;
    }

    // Neither deleted — compare timestamps
    final serverUpdatedAt = serverRecord['updatedAt'] != null
        ? DateTime.tryParse(serverRecord['updatedAt'].toString())
        : null;
    final localUpdatedAt = localRecord['updatedAt'] != null
        ? DateTime.tryParse(localRecord['updatedAt'].toString())
        : null;

    // If local has unsynced changes (syncStatus = 'pending'), preserve them
    final localSyncStatus = localRecord['syncStatus']?.toString();
    if (localSyncStatus == 'pending') {
      // Local has changes that haven't been synced yet — keep local
      // The outbox will push these changes to the server
      return ConflictResolution.keepLocal;
    }

    // If server is newer, apply server version
    if (serverUpdatedAt != null &&
        (localUpdatedAt == null || serverUpdatedAt.isAfter(localUpdatedAt))) {
      return ConflictResolution.applyServer;
    }

    // Local is newer or same — keep local
    return ConflictResolution.keepLocal;
  }

  /// Detect if a mass-deletion event is suspicious.
  /// Returns true if the deletion count exceeds the safety threshold.
  ///
  /// [deletionCount] = number of records marked deleted in this sync batch
  /// [localCount] = total local records of this entity type
  bool isMassDeletionSuspicious({required int deletionCount, required int localCount}) {
    if (localCount == 0) return false;
    final threshold = (localCount * 0.10).toInt(); // 10% threshold
    return deletionCount > threshold;
  }

  /// Log an unresolved conflict safely (no sensitive content).
  void logUnresolvedConflict({
    required String entityType,
    required String entityId,
    required String reason,
  }) {
    // In production, this would write to a conflicts log table or send to
    // a monitoring endpoint. For now, we use a safe print with redacted data.
    // No tokens, passwords, or user PII are included.
    // ignore: avoid_print
    print('CONFLICT: entity=$entityType id=$entityId reason=$reason');
  }
}

/// Result of conflict resolution.
enum ConflictResolution {
  /// Apply the server version (server is newer or local doesn't exist)
  applyServer,
  /// Apply a server-side deletion
  applyServerDelete,
  /// Keep the local version (local has unsynced changes or is newer)
  keepLocal,
  /// Local and server are already in sync
  alreadyInSync,
}
