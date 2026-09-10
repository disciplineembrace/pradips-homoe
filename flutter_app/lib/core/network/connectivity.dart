/// Connectivity detection service.
///
/// Monitors network status and provides a stream of connectivity changes.
/// Used by the sync engine to trigger sync when connectivity returns.
library;

import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

enum ConnectivityStatus {
  online,
  offline,
}

/// Singleton connectivity monitor.
class ConnectivityService {
  static final ConnectivityService _instance = ConnectivityService._internal();
  factory ConnectivityService() => _instance;
  ConnectivityService._internal();

  final Connectivity _connectivity = Connectivity();

  final StreamController<ConnectivityStatus> _statusController =
      StreamController<ConnectivityStatus>.broadcast();
  Stream<ConnectivityStatus> get statusStream => _statusController.stream;

  ConnectivityStatus _currentStatus = ConnectivityStatus.online;
  ConnectivityStatus get currentStatus => _currentStatus;

  bool get isOnline => _currentStatus == ConnectivityStatus.online;
  bool get isOffline => _currentStatus == ConnectivityStatus.offline;

  /// Initialize and start monitoring.
  void init() {
    _connectivity.onConnectivityChanged.listen((List<ConnectivityResult> results) {
      final wasOffline = _currentStatus == ConnectivityStatus.offline;
      final hasConnection = results.any((r) =>
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.ethernet);

      _currentStatus =
          hasConnection ? ConnectivityStatus.online : ConnectivityStatus.offline;
      _statusController.add(_currentStatus);

      // If we just came back online, the sync engine will pick this up
      // via the status stream and trigger an incremental sync + outbox flush.
      if (wasOffline && isOnline) {
        // Stream event is enough; sync engine subscribes.
      }
    });

    // Check initial status synchronously
    _connectivity.checkConnectivity().then((results) {
      final hasConnection = results.any((r) =>
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.ethernet);
      _currentStatus =
          hasConnection ? ConnectivityStatus.online : ConnectivityStatus.offline;
      _statusController.add(_currentStatus);
    });
  }

  /// Manually check current connectivity (fresh query).
  Future<bool> checkOnline() async {
    final results = await _connectivity.checkConnectivity();
    final hasConnection = results.any((r) =>
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.ethernet);
    _currentStatus =
        hasConnection ? ConnectivityStatus.online : ConnectivityStatus.offline;
    return hasConnection;
  }

  void dispose() {
    _statusController.close();
  }
}
