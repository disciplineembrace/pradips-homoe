/// Auth Service - handles login, logout, session management
/// Uses the same PIN-based auth as the website (email + 6-digit PIN)
import 'package:shared_preferences/shared_preferences.dart';
import '../models/models.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

class AuthService {
  final ApiClient _client = ApiClient();

  AppUser? _currentUser;
  AppUser? get currentUser => _currentUser;

  /// Check if user is logged in
  Future<bool> isLoggedIn() async {
    if (!_client.hasSession) return false;
    try {
      final response = await _client.get(ApiConstants.session);
      return response['authenticated'] == true;
    } catch (_) {
      return false;
    }
  }

  /// Login with email and PIN
  Future<AppUser> login({
    required String email,
    required String pin,
  }) async {
    final response = await _client.post(
      ApiConstants.login,
      body: {
        'email': email.trim().toLowerCase(),
        'pin': pin.trim(),
      },
    );

    if (response['success'] != true) {
      throw Exception(response['error'] ?? 'Login failed');
    }

    final user = AppUser.fromJson(response['user'] as Map<String, dynamic>);
    _currentUser = user;

    // Save user info
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConstants.userEmailKey, user.email);
    await prefs.setString(ApiConstants.userNameKey, user.name);
    await prefs.setString(ApiConstants.userRoleKey, user.role);

    return user;
  }

  /// Logout
  Future<void> logout() async {
    try {
      await _client.post(ApiConstants.logout);
    } catch (_) {
      // Ignore logout errors
    }
    _currentUser = null;
    await _client.clearSession();
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConstants.userEmailKey);
    await prefs.remove(ApiConstants.userNameKey);
    await prefs.remove(ApiConstants.userRoleKey);
  }

  /// Restore session on app start
  Future<AppUser?> restoreSession() async {
    final prefs = await SharedPreferences.getInstance();
    final email = prefs.getString(ApiConstants.userEmailKey);
    final name = prefs.getString(ApiConstants.userNameKey);
    final role = prefs.getString(ApiConstants.userRoleKey);

    if (!_client.hasSession || email == null || name == null || role == null) {
      return null;
    }

    try {
      final response = await _client.get(ApiConstants.session);
      if (response['authenticated'] == true) {
        _currentUser = AppUser(name: name, email: email, role: role);
        return _currentUser;
      } else {
        // Session expired
        await _client.clearSession();
        return null;
      }
    } catch (_) {
      return null;
    }
  }

  /// Get current session info
  Future<Map<String, dynamic>> getSession() async {
    return _client.get(ApiConstants.session);
  }
}
