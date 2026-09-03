/// Authentication repository — PIN-based login via existing website API.
///
/// The website uses httpOnly cookies (ph_session) for auth:
///   1. POST /api/auth/login → server sets Set-Cookie: ph_session=<JWT>
///   2. DioClient captures Set-Cookie header and stores it in secure storage
///   3. On subsequent requests, DioClient sends Cookie: ph_session=<JWT>
///   4. POST /api/auth/logout → server clears the cookie
///
/// No passwords are stored. No service keys. No database credentials.
/// The JWT token is stored ONLY in flutter_secure_storage (Android Keystore).
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

  /// Restore session on app launch.
  ///
  /// The DioClient stores the ph_session cookie in secure storage.
  /// On app restart, we check if the session is still valid by calling
  /// /api/auth/session. If valid, we fetch user info from /api/me.
  Future<bool> restoreSession() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(AppConfig.sessionEndpoint);
      if (response['authenticated'] == true) {
        // Try to fetch user data
        try {
          final userResponse = await _dio.get<Map<String, dynamic>>(AppConfig.meEndpoint);
          _currentUser = AuthUser.fromJson(userResponse);
        } catch (_) {
          // /api/me failed — try stored user data
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
      // Session expired
      await _dio.clearSession();
      return false;
    } catch (_) {
      return false;
    }
  }

  /// Login with email + 6-digit PIN.
  ///
  /// The website API:
  ///   1. Validates email + PIN
  ///   2. Sets httpOnly cookie via Set-Cookie header
  ///   3. Returns JSON: { success, user, redirect }
  ///
  /// The DioClient's onResponse interceptor captures the Set-Cookie header
  /// and stores the ph_session cookie in flutter_secure_storage.
  /// On subsequent requests, the cookie is automatically attached.
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

  /// Logout — clear session + local database + encryption key.
  Future<void> logout() async {
    try {
      await _dio.post(AppConfig.logoutEndpoint);
    } catch (_) {}

    await _dio.clearSession();
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
