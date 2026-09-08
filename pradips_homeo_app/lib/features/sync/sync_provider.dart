/// SyncProvider - exposes sync state to UI
import 'package:flutter/foundation.dart';
import '../../data/sync/sync_service.dart';
import '../../data/sync/connectivity_service.dart';

class SyncProvider extends ChangeNotifier {
  final SyncService _syncService = SyncService();
  final ConnectivityService _connectivity = ConnectivityService();

  SyncStatus _status = SyncStatus.idle;
  String _message = '';
  DateTime? _lastSync;
  bool _isOnline = true;
  int _pendingChanges = 0;

  SyncStatus get status => _status;
  String get message => _message;
  DateTime? get lastSync => _lastSync;
  bool get isOnline => _isOnline;
  bool get isSyncing => _status == SyncStatus.inProgress;
  int get pendingChanges => _pendingChanges;

  SyncProvider() {
    _syncService.onSyncStateChanged.listen((state) {
      _status = state.status;
      _message = state.message;
      if (state.status == SyncStatus.success) {
        _lastSync = state.timestamp;
      }
      notifyListeners();
    });

    _connectivity.onOnlineStatusChanged.listen((online) {
      _isOnline = online;
      notifyListeners();
    });

    init();
  }

  Future<void> init() async {
    _isOnline = await _connectivity.checkConnectivity();
    notifyListeners();
  }

  Future<void> syncNow() async {
    await _syncService.syncAll(force: true);
  }

  Future<void> forceFullResync() async {
    await _syncService.forceFullResync();
  }

  Future<bool> hasLocalData() => _syncService.hasLocalData();
}
