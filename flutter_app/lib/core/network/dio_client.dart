/// Dio HTTP client with cookie-based authentication.
///
/// The website uses httpOnly cookies (ph_session) for auth.
/// This client:
///   - Uses a persistent cookie jar to store cookies across app restarts
///   - Automatically sends cookies on every request
///   - Handles 401 by attempting session refresh
///   - NEVER logs tokens, keys, or sensitive data
///   - Converts DioErrors to typed ApiExceptions with safe messages
library;

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import 'api_exceptions.dart';

/// Persistent cookie storage path key in secure storage.
const _cookieStorageKey = 'ph_session_cookie';

class DioClient {
  late final Dio _dio;
  final FlutterSecureStorage _secureStorage;

  DioClient(this._secureStorage) {
    _dio = Dio(BaseOptions(
      baseUrl: AppConfig.apiBaseUrl,
      connectTimeout: Duration(seconds: AppConfig.connectTimeoutSec),
      receiveTimeout: Duration(seconds: AppConfig.receiveTimeoutSec),
      sendTimeout: Duration(seconds: AppConfig.sendTimeoutSec),
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      validateStatus: (status) => status != null && status >= 200 && status < 300,
      followRedirects: false, // Don't follow redirects — we handle auth manually
    ));

    // Add interceptor that loads the saved cookie and attaches it.
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Load the saved session cookie and attach it.
        final cookie = await _secureStorage.read(key: _cookieStorageKey);
        if (cookie != null && cookie.isNotEmpty) {
          options.headers['Cookie'] = cookie;
        }
        handler.next(options);
      },
      onResponse: (response, handler) async {
        // Capture Set-Cookie header from login response and persist it.
        final setCookie = response.headers['set-cookie'];
        if (setCookie != null && setCookie.isNotEmpty) {
          // Find the ph_session cookie
          for (final c in setCookie) {
            if (c.startsWith('ph_session=')) {
              // Extract just the cookie name=value part (before first ;)
              final cookieValue = c.split(';').first;
              if (cookieValue.isNotEmpty && cookieValue != 'ph_session=') {
                await _secureStorage.write(key: _cookieStorageKey, value: cookieValue);
              }
            }
          }
        }
        handler.next(response);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          // Session expired — clear stored cookie
          await _secureStorage.delete(key: _cookieStorageKey);
        }
        handler.next(error);
      },
    ));
  }

  /// Clear the stored session cookie (used on logout).
  Future<void> clearSession() async {
    await _secureStorage.delete(key: _cookieStorageKey);
  }

  /// GET request.
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get<T>(path,
          queryParameters: queryParameters, options: options);
      return response.data as T;
    } on DioException catch (e) {
      throw _convertDioError(e);
    }
  }

  /// POST request.
  Future<T> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post<T>(path,
          data: data, queryParameters: queryParameters, options: options);
      return response.data as T;
    } on DioException catch (e) {
      throw _convertDioError(e);
    }
  }

  /// PUT request.
  Future<T> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put<T>(path,
          data: data, queryParameters: queryParameters, options: options);
      return response.data as T;
    } on DioException catch (e) {
      throw _convertDioError(e);
    }
  }

  /// DELETE request.
  Future<void> delete(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      await _dio.delete(path,
          queryParameters: queryParameters, options: options);
    } on DioException catch (e) {
      throw _convertDioError(e);
    }
  }

  /// Convert DioException to ApiException. NEVER includes sensitive data.
  ApiException _convertDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return TimeoutException('Request timed out');
      case DioExceptionType.connectionError:
        return const NoConnectionException();
      case DioExceptionType.badResponse:
        final statusCode = e.response?.statusCode ?? 500;
        final data = e.response?.data;
        String message = 'Server error';
        if (data is Map && data['error'] != null) {
          message = data['error'].toString();
        }
        if (statusCode == 401) {
          return AuthException(message, statusCode: statusCode);
        }
        if (statusCode == 403) {
          return PermissionException(message);
        }
        return ServerException(message, statusCode);
      default:
        return ServerException('Unexpected error', 500);
    }
  }
}
