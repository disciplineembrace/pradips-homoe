/// SyncService - orchestrates synchronization between local SQLite DB and remote API.
///
/// Sync flow:
///   1. Check connectivity (online/offline)
///   2. Pull: Download latest data from API → upsert into local DB
///   3. Push: Send pending local changes (bookmarks, notes) to API
///   4. Update sync metadata (last sync time, status, record count)
///
/// Sync triggers:
///   - App startup (if online)
///   - User-initiated "refresh" action
///   - Background (via Workmanager - every 6 hours when online)
///   - On network reconnect (via ConnectivityService)
import 'dart:async';
import 'dart:convert';
import 'package:drift/drift.dart';
import '../local/app_database.dart';
import '../services/remedies_service.dart';
import '../services/rubrics_service.dart';
import '../services/user_features_service.dart';
import 'connectivity_service.dart';

class SyncService {
  static final SyncService _instance = SyncService._internal();
  factory SyncService() => _instance;
  SyncService._internal();

  final AppDatabase _db = AppDatabase();
  final RemediesService _remediesService = RemediesService();
  final RubricsService _rubricsService = RubricsService();
  final UserFeaturesService _userFeatures = UserFeaturesService();
  final ConnectivityService _connectivity = ConnectivityService();

  StreamSubscription<bool>? _connectivitySub;
  Timer? _periodicSyncTimer;
  bool _isSyncing = false;

  final _syncStateController = StreamController<SyncState>.broadcast();
  Stream<SyncState> get onSyncStateChanged => _syncStateController.stream;

  bool get isSyncing => _isSyncing;

  /// Initialize - call on app startup
  Future<void> init() async {
    _connectivity.init();

    _connectivitySub = _connectivity.onOnlineStatusChanged.listen((isOnline) {
      if (isOnline) {
        Future.delayed(const Duration(seconds: 2), () => syncAll());
      }
    });

    _periodicSyncTimer = Timer.periodic(const Duration(hours: 6), (_) {
      if (_connectivity.isOnline) {
        syncAll();
      }
    });

    if (await _connectivity.checkConnectivity()) {
      await syncAll();
    }
  }

  void dispose() {
    _connectivitySub?.cancel();
    _periodicSyncTimer?.cancel();
    _connectivity.dispose();
    _syncStateController.close();
  }

  /// Full sync: pull all data from server + push pending changes
  Future<SyncResult> syncAll({bool force = false}) async {
    if (_isSyncing && !force) {
      return SyncResult(status: SyncStatus.alreadyRunning);
    }

    final isOnline = await _connectivity.checkConnectivity();
    if (!isOnline) {
      _emitState(SyncState(status: SyncStatus.offline));
      return SyncResult(status: SyncStatus.offline);
    }

    _isSyncing = true;
    _emitState(SyncState(status: SyncStatus.inProgress, message: 'Starting sync...'));

    final results = <String, SyncResultItem>{};
    var totalPulled = 0;
    var totalPushed = 0;

    try {
      _emitState(SyncState(status: SyncStatus.inProgress, message: 'Syncing remedies...'));
      final remedyResult = await _syncRemedies(force: force);
      results['remedies'] = remedyResult;
      totalPulled += remedyResult.pulled;

      _emitState(SyncState(status: SyncStatus.inProgress, message: 'Syncing rubrics...'));
      final rubricResult = await _syncRubrics(force: force);
      results['rubrics'] = rubricResult;
      totalPulled += rubricResult.pulled;

      _emitState(SyncState(status: SyncStatus.inProgress, message: 'Syncing chapters...'));
      final chapterResult = await _syncChapters();
      results['chapters'] = chapterResult;
      totalPulled += chapterResult.pulled;

      _emitState(SyncState(status: SyncStatus.inProgress, message: 'Pushing local changes...'));
      final pushResult = await _pushPendingChanges();
      results['pendingChanges'] = pushResult;
      totalPushed += pushResult.pushed;

      _emitState(SyncState(status: SyncStatus.inProgress, message: 'Syncing bookmarks...'));
      final bookmarkResult = await _pullBookmarks();
      results['bookmarks'] = bookmarkResult;
      totalPulled += bookmarkResult.pulled;

      _emitState(SyncState(status: SyncStatus.inProgress, message: 'Syncing favorites...'));
      final favoriteResult = await _pullFavorites();
      results['favorites'] = favoriteResult;
      totalPulled += favoriteResult.pulled;

      _isSyncing = false;
      _emitState(SyncState(
        status: SyncStatus.success,
        message: 'Sync complete. $totalPulled items pulled, $totalPushed pushed.',
      ));

      return SyncResult(
        status: SyncStatus.success,
        items: results,
        totalPulled: totalPulled,
        totalPushed: totalPushed,
      );
    } catch (e) {
      _isSyncing = false;
      _emitState(SyncState(
        status: SyncStatus.failed,
        message: 'Sync failed: ${e.toString()}',
      ));
      return SyncResult(status: SyncStatus.failed, error: e.toString());
    }
  }

  Future<SyncResultItem> _syncRemedies({bool force = false}) async {
    try {
      final existingMeta = await _db.getSyncMetadata('remedies');
      final shouldSync = force ||
          existingMeta == null ||
          existingMeta.status != 'success' ||
          (DateTime.now().difference(existingMeta.lastSyncAt ?? DateTime(2000)).inHours > 24);

      if (!shouldSync) {
        return SyncResultItem(pulled: 0, message: 'Already up to date');
      }

      final currentCount = await _db.getRemedyCount();
      final needsFullSync = force || currentCount == 0;

      if (!needsFullSync) {
        return SyncResultItem(pulled: 0, message: 'Already up to date');
      }

      var page = 1;
      var total = 0;
      var pulled = 0;
      do {
        final list = await _remediesService.getRemedies(page: page, pageSize: 200);
        total = list.total;

        final entries = list.items.map((r) => RemediesCompanion.insert(
              id: r.id,
              name: r.name,
              common: Value(r.common),
              author: r.author,
              letter: Value(r.letter),
              chapter: Value(r.chapter),
              organ: Value(r.organ),
              keynote: Value(r.keynote),
              source: Value(r.source),
              version: Value(r.version),
            )).toList();

        await _db.upsertRemedies(entries);
        pulled += entries.length;
        page++;
      } while (pulled < total && page <= 50);

      await _db.upsertSyncMetadata(SyncMetadataCompanion.insert(
        dataType: 'remedies',
        lastSyncAt: Value(DateTime.now()),
        totalRecords: Value(total),
        status: const Value('success'),
      ));

      return SyncResultItem(pulled: pulled, message: '$pulled remedies synced');
    } catch (e) {
      await _db.upsertSyncMetadata(SyncMetadataCompanion.insert(
        dataType: 'remedies',
        lastSyncAt: Value(DateTime.now()),
        status: const Value('failed'),
        lastError: Value(e.toString()),
      ));
      return SyncResultItem(pulled: 0, error: e.toString());
    }
  }

  Future<SyncResultItem> _syncRubrics({bool force = false}) async {
    try {
      final existingMeta = await _db.getSyncMetadata('rubrics');
      final shouldSync = force ||
          existingMeta == null ||
          existingMeta.status != 'success' ||
          (DateTime.now().difference(existingMeta.lastSyncAt ?? DateTime(2000)).inHours > 24);

      if (!shouldSync) {
        return SyncResultItem(pulled: 0, message: 'Already up to date');
      }

      var page = 1;
      var total = 0;
      var pulled = 0;
      do {
        final list = await _rubricsService.getRubricTree(page: page, pageSize: 100);
        if (list.isEmpty && page == 1) break;
        total = await _rubricsService.getTotalCount();

        final entries = list.map((r) => RubricsCompanion.insert(
              id: r.id,
              main: r.main,
              chapter: Value(r.chapter),
              author: Value(r.author),
              parentId: Value(r.parentId),
              remediesJson: Value(json.encode((r.remedies ?? [])
                  .map((rg) => {'name': rg.name, 'grade': rg.grade})
                  .toList())),
              version: const Value(1),
            )).toList();

        await _db.upsertRubrics(entries);
        pulled += entries.length;
        page++;
      } while (pulled < total && page <= 50);

      await _db.upsertSyncMetadata(SyncMetadataCompanion.insert(
        dataType: 'rubrics',
        lastSyncAt: Value(DateTime.now()),
        totalRecords: Value(total),
        status: const Value('success'),
      ));

      return SyncResultItem(pulled: pulled, message: '$pulled rubrics synced');
    } catch (e) {
      return SyncResultItem(pulled: 0, error: e.toString());
    }
  }

  Future<SyncResultItem> _syncChapters() async {
    try {
      final chapters = await _rubricsService.getChapters();
      final entries = chapters.map((c) => ChaptersCompanion.insert(
            name: c.name,
            rubricCount: Value(c.rubricCount),
          )).toList();
      await _db.upsertChapters(entries);
      await _db.upsertSyncMetadata(SyncMetadataCompanion.insert(
        dataType: 'chapters',
        lastSyncAt: Value(DateTime.now()),
        totalRecords: Value(entries.length),
        status: const Value('success'),
      ));
      return SyncResultItem(pulled: entries.length, message: '${entries.length} chapters synced');
    } catch (e) {
      return SyncResultItem(pulled: 0, error: e.toString());
    }
  }

  Future<SyncResultItem> _pullBookmarks() async {
    try {
      final bookmarks = await _userFeatures.getBookmarks();
      for (final b in bookmarks) {
        await _db.addBookmark(BookmarksCompanion.insert(
          itemId: b['item_id'] as String? ?? '',
          itemType: b['item_type'] as String? ?? '',
          title: b['title'] as String? ?? '',
          href: Value(b['href'] as String?),
          author: Value(b['author'] as String?),
          pendingSync: const Value(false),
        ));
      }
      return SyncResultItem(pulled: bookmarks.length, message: '${bookmarks.length} bookmarks pulled');
    } catch (e) {
      return SyncResultItem(pulled: 0, error: e.toString());
    }
  }

  Future<SyncResultItem> _pullFavorites() async {
    try {
      final favorites = await _userFeatures.getFavorites();
      for (final f in favorites) {
        await _db.addFavorite(FavoritesCompanion.insert(
          itemId: f['item_id'] as String? ?? '',
          itemType: f['item_type'] as String? ?? '',
          title: f['title'] as String? ?? '',
          href: Value(f['href'] as String?),
          pendingSync: const Value(false),
        ));
      }
      return SyncResultItem(pulled: favorites.length, message: '${favorites.length} favorites pulled');
    } catch (e) {
      return SyncResultItem(pulled: 0, error: e.toString());
    }
  }

  Future<SyncResultItem> _pushPendingChanges() async {
    var pushed = 0;
    final errors = <String>[];

    try {
      final pendingBookmarks = await _db.getPendingBookmarks();
      for (final b in pendingBookmarks) {
        try {
          await _userFeatures.addBookmark(
            itemId: b.itemId,
            itemType: b.itemType,
            title: b.title,
            href: b.href,
            author: b.author,
          );
          await _db.addBookmark(BookmarksCompanion.insert(
            itemId: b.itemId,
            itemType: b.itemType,
            title: b.title,
            href: Value(b.href),
            author: Value(b.author),
            pendingSync: const Value(false),
          ));
          pushed++;
        } catch (e) {
          errors.add('bookmark ${b.itemId}: $e');
        }
      }
    } catch (e) {
      errors.add('bookmarks: $e');
    }

    return SyncResultItem(
      pushed: pushed,
      message: pushed > 0 ? '$pushed changes pushed' : 'No pending changes',
      error: errors.isEmpty ? null : errors.join('; '),
    );
  }

  void _emitState(SyncState state) {
    _syncStateController.add(state);
  }

  Future<bool> hasLocalData() async {
    final remedyCount = await _db.getRemedyCount();
    final rubricCount = await _db.getRubricCount();
    return remedyCount > 0 || rubricCount > 0;
  }

  Future<SyncMetadataData?> getSyncInfo(String dataType) {
    return _db.getSyncMetadata(dataType);
  }

  Future<void> forceFullResync() async {
    await _db.clearAllContent();
    await syncAll(force: true);
  }
}

enum SyncStatus { idle, inProgress, success, failed, offline, alreadyRunning }

class SyncState {
  final SyncStatus status;
  final String message;
  final DateTime timestamp;

  SyncState({
    required this.status,
    this.message = '',
    DateTime? timestamp,
  }) : timestamp = timestamp ?? DateTime.now();
}

class SyncResult {
  final SyncStatus status;
  final Map<String, SyncResultItem> items;
  final int totalPulled;
  final int totalPushed;
  final String? error;

  SyncResult({
    required this.status,
    this.items = const {},
    this.totalPulled = 0,
    this.totalPushed = 0,
    this.error,
  });
}

class SyncResultItem {
  final int pulled;
  final int pushed;
  final String message;
  final String? error;

  SyncResultItem({
    this.pulled = 0,
    this.pushed = 0,
    this.message = '',
    this.error,
  });
}
