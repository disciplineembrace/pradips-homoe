/// ConnectivityService - monitors network state and triggers sync on reconnect.
import 'dart:async';
import 'package:connectivity_plus/connectivity_plus.dart';

class ConnectivityService {
  final Connectivity _connectivity = Connectivity();
  StreamSubscription<List<ConnectivityResult>>? _subscription;
  bool _isOnline = true;
  final _onlineController = StreamController<bool>.broadcast();

  /// Stream of online status (true = online, false = offline)
  Stream<bool> get onOnlineStatusChanged => _onlineController.stream;

  /// Current online status
  bool get isOnline => _isOnline;

  /// Initialize the service and start monitoring
  void init() {
    _subscription = _connectivity.onConnectivityChanged.listen((results) {
      final wasOnline = _isOnline;
      _isOnline = results.any((r) =>
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.ethernet);

      if (wasOnline != _isOnline) {
        _onlineController.add(_isOnline);
      }
    });

    // Check initial state
    _connectivity.checkConnectivity().then((results) {
      _isOnline = results.any((r) =>
          r == ConnectivityResult.wifi ||
          r == ConnectivityResult.mobile ||
          r == ConnectivityResult.ethernet);
      _onlineController.add(_isOnline);
    });
  }

  /// Manually check connectivity
  Future<bool> checkConnectivity() async {
    final results = await _connectivity.checkConnectivity();
    _isOnline = results.any((r) =>
        r == ConnectivityResult.wifi ||
        r == ConnectivityResult.mobile ||
        r == ConnectivityResult.ethernet);
    return _isOnline;
  }

  /// Dispose
  void dispose() {
    _subscription?.cancel();
    _onlineController.close();
  }
}
