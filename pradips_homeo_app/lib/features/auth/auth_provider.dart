/// Auth Provider - manages auth state across the app
/// Also integrates with sync service to trigger sync after login
import 'package:flutter/foundation.dart';
import '../../data/models/models.dart';
import '../../data/services/auth_service.dart';
import '../../data/sync/sync_service.dart';

class AuthProvider extends ChangeNotifier {
  final AuthService _authService = AuthService();
  final SyncService _syncService = SyncService();

  AppUser? _user;
  bool _isLoading = true;
  bool _isAuthenticated = false;
  String? _errorMessage;

  AppUser? get user => _user;
  bool get isLoading => _isLoading;
  bool get isAuthenticated => _isAuthenticated;
  String? get errorMessage => _errorMessage;

  /// Initialize on app start
  Future<void> init() async {
    _isLoading = true;
    notifyListeners();
    try {
      _user = await _authService.restoreSession();
      _isAuthenticated = _user != null;

      // Start sync service if authenticated
      if (_isAuthenticated) {
        await _syncService.init();
      }
    } catch (e) {
      _isAuthenticated = false;
      _user = null;
    } finally {
      _isLoading = false;
      notifyListeners();
    }
  }

  /// Login with email + PIN
  Future<bool> login(String email, String pin) async {
    _isLoading = true;
    _errorMessage = null;
    notifyListeners();
    try {
      _user = await _authService.login(email: email, pin: pin);
      _isAuthenticated = _user != null;

      // Start sync service after login
      if (_isAuthenticated) {
        await _syncService.init();
      }

      _isLoading = false;
      notifyListeners();
      return true;
    } catch (e) {
      _errorMessage = e.toString().replaceFirst('Exception: ', '');
      _isAuthenticated = false;
      _isLoading = false;
      notifyListeners();
      return false;
    }
  }

  /// Logout
  Future<void> logout() async {
    _isLoading = true;
    notifyListeners();
    _syncService.dispose();
    await _authService.logout();
    _user = null;
    _isAuthenticated = false;
    _isLoading = false;
    notifyListeners();
  }

  /// Clear error
  void clearError() {
    _errorMessage = null;
    notifyListeners();
  }
}
