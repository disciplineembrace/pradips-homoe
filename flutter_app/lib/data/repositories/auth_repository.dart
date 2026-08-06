/// Authentication repository — PIN-based login via existing website API.
///
/// Uses the EXISTING /api/auth/login endpoint. No separate auth system.
/// Session token stored in flutter_secure_storage (Android Keystore).
/// No passwords are stored. No service keys. No database credentials.
library;

import 'dart:convert';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../core/config/app_config.dart';
import '../../core/network/api_exceptions.dart';
import '../../core/network/dio_client.dart';

class AuthUser {
  final String id;
  final String name;
  final String email;
  final String role; // 'admin', 'staff', 'user'

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
  Future<bool> restoreSession() async {
    try {
      final token = await _secureStorage.read(key: AppConfig.secureStorageKey);
      if (token == null || token.isEmpty) return false;

      // Verify session is still valid
      final response = await _dio.get<Map<String, dynamic>>(AppConfig.sessionEndpoint);
      if (response['authenticated'] == true) {
        // Fetch user data
        final userResponse = await _dio.get<Map<String, dynamic>>(AppConfig.meEndpoint);
        _currentUser = AuthUser.fromJson(userResponse);
        return true;
      }
      // Session expired — clear storage
      await _secureStorage.delete(key: AppConfig.secureStorageKey);
      return false;
    } on ApiException {
      return false;
    }
  }

  /// Login with email + 6-digit PIN.
  /// Uses the existing /api/auth/login endpoint.
  Future<AuthUser> login({
    required String email,
    required String pin,
  }) async {
    // Validate PIN format locally before sending
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
      // Extract session token from response (the API sets an httpOnly cookie,
      // but for the Flutter app we also accept a token in the response body)
      final token = response['token'] as String? ?? _extractTokenFromHeaders(response);
      if (token != null && token.isNotEmpty) {
        await _secureStorage.write(key: AppConfig.secureStorageKey, value: token);
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
  ///
  /// Security policy on logout:
  ///   1. Call server logout API (non-fatal if it fails)
  ///   2. Delete session token from secure storage
  ///   3. Delete user data from secure storage
  ///   4. Close + delete the encrypted SQLite database
  ///   5. Delete the SQLCipher encryption key from secure storage
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

  /// Check if session is still valid (for periodic checks).
  Future<bool> checkSession() async {
    try {
      final response = await _dio.get<Map<String, dynamic>>(AppConfig.sessionEndpoint);
      return response['authenticated'] == true;
    } catch (_) {
      return false;
    }
  }

  String? _extractTokenFromHeaders(Map<String, dynamic> response) {
    // The website API sets an httpOnly cookie, which the Dio client
    // captures in its cookie jar. For the Flutter app, we also check
    // if a token is returned in the response body.
    return response['token'] as String?;
  }
}

// Note: authRepositoryProvider is defined in lib/main.dart
// (it wires together DioClient + FlutterSecureStorage).

abstract class AuthState {}

class AuthInitialState extends AuthState {}
class AuthLoadingState extends AuthState {}
class AuthenticatedState extends AuthState {
  final AuthUser user;
  AuthenticatedState(this.user);
}
class UnauthenticatedState extends AuthState {}
class AuthErrorState extends AuthState {
  final String message;
  AuthErrorState(this.message);
}

class AuthNotifier extends StateNotifier<AuthState> {
  final AuthRepository _repo;
  AuthNotifier(this._repo) : super(AuthInitialState());

  Future<void> checkSession() async {
    state = AuthLoadingState();
    final restored = await _repo.restoreSession();
    if (restored && _repo.currentUser != null) {
      state = AuthenticatedState(_repo.currentUser!);
    } else {
      state = UnauthenticatedState();
    }
  }

  Future<void> login(String email, String pin) async {
    state = AuthLoadingState();
    try {
      final user = await _repo.login(email: email, pin: pin);
      state = AuthenticatedState(user);
    } on ApiException catch (e) {
      state = AuthErrorState(e.message);
    }
  }

  Future<void> logout() async {
    await _repo.logout();
    state = UnauthenticatedState();
  }
}
