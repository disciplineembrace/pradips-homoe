/// Authentication repository — PIN-based login via existing website API.
///
/// Uses the EXISTING /api/auth/login endpoint. No separate auth system.
/// Session token stored in flutter_secure_storage (Android Keystore).
/// The website uses httpOnly cookies — the app stores the JWT token
/// from the login response and sends it as a Cookie header.
///
/// No passwords are stored. No service keys. No database credentials.
library;

import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_exceptions.dart';
import '../../core/network/dio_client.dart';

class AuthUser {
  final String id;
  final String name;
  final String email;
  final String role;

  const AuthUser({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  bool get isAdmin => role == 'admin';
  bool get isStaff => role == 'staff' || role == 'admin';

  factory AuthUser.fromJson(Map<String, dynamic> json) => AuthUser(
        id: json['id'] ?? '',
        name: json['name'] ?? '',
        email: json['email'] ?? '',
        role: json['role'] ?? 'user',
      );

  Map<String, dynamic> toJson() =>
      {'id': id, 'name': name, 'email': email, 'role': role};
}

class AuthRepository {
  final DioClient _dio;
  final FlutterSecureStorage _secureStorage;

  AuthUser? _currentUser;
  AuthUser? get currentUser => _currentUser;
  bool get isAuthenticated => _currentUser != null;

  AuthRepository(this._dio, this._secureStorage);

  /// Restore session from secure storage on app launch.
  ///
  /// The app stores the JWT token from the login response in
  /// flutter_secure_storage. On app restart, we read the token
  /// and verify it's still valid by calling /api/auth/session.
  Future<bool> restoreSession() async {
    try {
      final token = await _secureStorage.read(key: AppConfig.secureStorageKey);
      if (token == null || token.isEmpty) return false;

      // Verify session is still valid
      final response = await _dio.get<Map<String, dynamic>>(AppConfig.sessionEndpoint);
      if (response['authenticated'] == true) {
        // Fetch user data
        try {
          final userResponse = await _dio.get<Map<String, dynamic>>(AppConfig.meEndpoint);
          _currentUser = AuthUser.fromJson(userResponse);
        } catch (_) {
          // Session is valid but /api/me failed — still authenticated
          // Try to restore from stored user data
          final storedUser = await _secureStorage.read(key: AppConfig.secureStorageUserKey);
          if (storedUser != null && storedUser.isNotEmpty) {
            try {
              _currentUser = AuthUser.fromJson(jsonDecode(storedUser));
            } catch (_) {
              _currentUser = const AuthUser(id: '', name: 'User', email: '', role: 'user');
            }
          }
        }
        return true;
      }
      // Session expired — clear storage
      await _secureStorage.delete(key: AppConfig.secureStorageKey);
      return false;
    } on ApiException {
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Login with email + 6-digit PIN.
  ///
  /// The website API at /api/auth/login:
  ///   1. Validates email + PIN
  ///   2. Sets an httpOnly cookie (ph_session) containing the JWT
  ///   3. Returns JSON with { success, user, redirect }
  ///
  /// For the Flutter app:
  ///   - Dio captures the Set-Cookie header automatically
  ///   - We ALSO store the JWT token from the response for persistence
  ///   - On subsequent requests, DioClient sends it as Cookie: ph_session=<token>
  Future<AuthUser> login({
    required String email,
    required String pin,
  }) async {
    if (!RegExp(r'^\d{6}$').hasMatch(pin)) {
      throw const AuthException('PIN must be exactly 6 digits.');
    }
    if (!email.contains('@')) {
      throw const AuthException('Valid email required.');
    }

    final response = await _dio.post<Map<String, dynamic>>(
      AppConfig.loginEndpoint,
      data: {
        'email': email.trim().toLowerCase(),
        'pin': pin,
      },
    );

    if (response['success'] == true) {
      // The website sets an httpOnly cookie. Dio captures Set-Cookie headers
      // automatically. However, Dio doesn't persist cookies across app restarts.
      // So we extract the JWT from the response (if available) and store it
      // in flutter_secure_storage for persistence.
      //
      // The JWT token may be in:
      //   1. response['token'] — if the API returns it directly
      //   2. response headers Set-Cookie — Dio captures this automatically
      //
      // If no token is in the response body, we generate a session ID
      // from the user data to use as a persistent key. The actual auth
      // is handled by the cookie that Dio sends on subsequent requests.
      final token = response['token'] as String?;
      if (token != null && token.isNotEmpty) {
        await _secureStorage.write(key: AppConfig.secureStorageKey, value: token);
      } else {
        // The API doesn't return a token in the body — it only sets a cookie.
        // Dio will send the cookie on subsequent requests within this session.
        // For persistence across app restarts, we store a marker that
        // indicates the user is logged in. The actual JWT is in the cookie
        // which Dio manages.
        //
        // However, since Dio doesn't persist cookies, we need to handle
        // session restoration differently. We'll store the user data
        // and on restore, check /api/auth/session. If the cookie has
        // expired (server-side), the user will need to re-login.
        //
        // For now, store a session marker.
        await _secureStorage.write(
          key: AppConfig.secureStorageKey,
          value: 'session_active',
        );
      }

      // Store user data
      final userJson = response['user'] as Map<String, dynamic>? ?? {};
      _currentUser = AuthUser.fromJson(userJson);
      await _secureStorage.write(
        key: AppConfig.secureStorageUserKey,
        value: jsonEncode(_currentUser!.toJson()),
      );

      return _currentUser!;
    }

    throw AuthException(response['error']?.toString() ?? 'Login failed.');
  }

  /// Logout — clear local session + encrypted database + encryption key.
  Future<void> logout() async {
    try {
      await _dio.post(AppConfig.logoutEndpoint);
    } catch (_) {}

    await _secureStorage.delete(key: AppConfig.secureStorageKey);
    await _secureStorage.delete(key: AppConfig.secureStorageUserKey);

    _onLogout?.call();

    _currentUser = null;
  }

  void Function()? _onLogout;
  set onLogout(void Function()? callback) => _onLogout = callback;

  /// Check if session is still valid.
  Future<bool> checkSession() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(AppConfig.sessionEndpoint);
      return response['authenticated'] == true;
    } catch (_) {
      return false;
    }
  }
}
