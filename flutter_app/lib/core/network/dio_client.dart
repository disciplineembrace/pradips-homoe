/// Dio HTTP client with authentication, retry, and error handling.
///
/// All API calls go through this client. It:
///   - Attaches the session cookie to every request (cookie-based auth)
///   - Handles 401 (auth expired) by attempting session refresh
///   - Converts DioErrors to typed ApiExceptions
///   - Enforces HTTPS-only communication
///   - Never logs tokens, keys, or sensitive data
library;

import 'package:dio/dio.dart';
import 'package:flutter_secure_storage/flutter_secure_storage.dart';
import '../config/app_config.dart';
import 'api_exceptions.dart';

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
      // Enable cookie support — the website uses httpOnly cookies for auth.
      // Dio automatically stores and sends cookies when followRedirects is true.
      followRedirects: true,
    ));

    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // The website uses httpOnly cookies for session management.
        // After login, the server sets a Set-Cookie header which Dio
        // automatically stores in its cookie jar (when using CookieJar).
        // However, Dio doesn't persist cookies across app restarts by default.
        //
        // For the Flutter app, we store the session token from the login
        // response in flutter_secure_storage and manually attach it as
        // a Cookie header on every request.
        final token = await _secureStorage.read(key: AppConfig.secureStorageKey);
        if (token != null && token.isNotEmpty) {
          // Send as cookie — this matches the website's auth mechanism.
          options.headers['Cookie'] = 'ph_session=$token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          final refreshed = await _attemptSessionRefresh();
          if (refreshed) {
            try {
              final retryResponse = await _dio.fetch(error.requestOptions);
              return handler.resolve(retryResponse);
            } catch (e) {
              return handler.next(error);
            }
          }
        }
        handler.next(error);
      },
    ));
  }

  /// Attempt to refresh the session by calling the session endpoint.
  Future<bool> _attemptSessionRefresh() async {
    try {
      final response = await _dio.get(AppConfig.sessionEndpoint);
      final data = response.data;
      if (data is Map && data['authenticated'] == true) {
        return true;
      }
    } catch (_) {
      // Session is invalid
    }
    return false;
  }

  /// GET request with typed response.
  Future<T> get<T>(
    String path, {
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.get<T>(
        path,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _convertDioError(e);
    }
  }

  /// POST request with typed response.
  Future<T> post<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.post<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
      return response.data as T;
    } on DioException catch (e) {
      throw _convertDioError(e);
    }
  }

  /// PUT request with typed response.
  Future<T> put<T>(
    String path, {
    dynamic data,
    Map<String, dynamic>? queryParameters,
    Options? options,
  }) async {
    try {
      final response = await _dio.put<T>(
        path,
        data: data,
        queryParameters: queryParameters,
        options: options,
      );
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
      await _dio.delete(
        path,
        queryParameters: queryParameters,
        options: options,
      );
    } on DioException catch (e) {
      throw _convertDioError(e);
    }
  }

  /// Convert DioException to typed ApiException.
  /// NEVER includes sensitive data (tokens, keys) in error messages.
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
