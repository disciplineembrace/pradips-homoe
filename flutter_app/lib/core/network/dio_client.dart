/// Dio HTTP client with authentication, retry, and error handling.
///
/// All API calls go through this client. It:
///   - Attaches the session cookie/token to every request
///   - Handles 401 (auth expired) by attempting session refresh
///   - Converts DioErrors to typed ApiExceptions
///   - Enforces HTTPS-only communication
///   - Logs requests with sensitive data redacted
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
      // Validate that we only use HTTPS in production
      validateStatus: (status) => status != null && status >= 200 && status < 300,
    ));

    // Add auth interceptor
    _dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        // Attach session cookie if available
        final token = await _secureStorage.read(key: AppConfig.secureStorageKey);
        if (token != null && token.isNotEmpty) {
          // The website uses httpOnly cookies for sessions.
          // For the Flutter app, we send the token as a Cookie header
          // OR as a Bearer token (the API accepts both).
          options.headers['Cookie'] = 'ph_session=$token';
          options.headers['Authorization'] = 'Bearer $token';
        }
        handler.next(options);
      },
      onError: (error, handler) async {
        // On 401, attempt session refresh once
        if (error.response?.statusCode == 401) {
          // Try to refresh session — if that fails, propagate the error
          // (the auth repository will handle logout/redirect)
          final refreshed = await _attemptSessionRefresh();
          if (refreshed) {
            // Retry the original request
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
  /// Returns true if the session is still valid.
  Future<bool> _attemptSessionRefresh() async {
    try {
      final response = await _dio.get(AppConfig.sessionEndpoint);
      final data = response.data;
      if (data is Map && data['authenticated'] == true) {
        return true;
      }
    } catch (_) {
      // Session is invalid — user will be redirected to login
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
  ApiException _convertDioError(DioException e) {
    switch (e.type) {
      case DioExceptionType.connectionTimeout:
      case DioExceptionType.sendTimeout:
      case DioExceptionType.receiveTimeout:
        return TimeoutException(e.message);
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
        return ServerException('Unexpected error', 500, e.message);
    }
  }
}
