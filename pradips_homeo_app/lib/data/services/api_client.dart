/// API Client - handles all HTTP communication with backend
/// Backend: https://pradips-homoe.vercel.app/api
/// Shares session cookies with the Next.js website backend
import 'dart:convert';
import 'package:http/http.dart' as http;
import 'package:shared_preferences/shared_preferences.dart';
import '../../core/constants/api_constants.dart';

class ApiClient {
  ApiClient._();
  static final ApiClient _instance = ApiClient._();
  factory ApiClient() => _instance;

  final Map<String, String> _cookies = {};
  String? _sessionCookie;

  /// Initialize - load saved session
  Future<void> init() async {
    final prefs = await SharedPreferences.getInstance();
    _sessionCookie = prefs.getString(ApiConstants.sessionCookieKey);
    if (_sessionCookie != null) {
      _cookies['pradips_session'] = _sessionCookie!;
    }
  }

  /// Get cookies header for requests
  String get _cookieHeader {
    if (_cookies.isEmpty) return '';
    return _cookies.entries.map((e) => '${e.key}=${e.value}').join('; ');
  }

  /// Parse Set-Cookie headers from response
  void _parseCookies(http.Response response) {
    final setCookieHeaders = response.headers['set-cookie'];
    if (setCookieHeaders == null) return;

    // Multiple Set-Cookie headers may be combined with comma
    final cookies = setCookieHeaders.split(RegExp(r',(?=[^;]+;)'));
    for (final cookie in cookies) {
      final parts = cookie.split(';');
      if (parts.isEmpty) continue;
      final nv = parts[0].split('=');
      if (nv.length == 2) {
        final name = nv[0].trim();
        final value = nv[1].trim();
        _cookies[name] = value;
        // Save session cookie specifically
        if (name == 'pradips_session' || name.contains('session')) {
          _sessionCookie = value;
          _saveSession(name, value);
        }
      }
    }
  }

  Future<void> _saveSession(String name, String value) async {
    final prefs = await SharedPreferences.getInstance();
    await prefs.setString(ApiConstants.sessionCookieKey, value);
  }

  /// Save session manually (from login response)
  Future<void> saveSessionCookie(String cookieString) async {
    if (cookieString.isEmpty) return;
    // Parse cookie string like "name=value; Path=/; HttpOnly"
    final parts = cookieString.split(';');
    if (parts.isEmpty) return;
    final nv = parts[0].split('=');
    if (nv.length == 2) {
      final name = nv[0].trim();
      final value = nv[1].trim();
      _cookies[name] = value;
      _sessionCookie = value;
      await _saveSession(name, value);
    }
  }

  /// Clear session (logout)
  Future<void> clearSession() async {
    _cookies.clear();
    _sessionCookie = null;
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(ApiConstants.sessionCookieKey);
  }

  /// Check if we have a session
  bool get hasSession => _sessionCookie != null || _cookies.isNotEmpty;

  /// GET request
  Future<Map<String, dynamic>> get(
    String url, {
    Map<String, String>? queryParameters,
  }) async {
    Uri uri;
    if (queryParameters != null && queryParameters.isNotEmpty) {
      uri = Uri.parse(url).replace(queryParameters: queryParameters);
    } else {
      uri = Uri.parse(url);
    }

    final response = await http.get(
      uri,
      headers: {
        'Accept': 'application/json',
        'Cookie': _cookieHeader,
      },
    ).timeout(const Duration(seconds: 30));

    _parseCookies(response);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return json.decode(response.body) as Map<String, dynamic>;
    } else if (response.statusCode == 401) {
      throw ApiException('Unauthorized - please login again', 401);
    } else if (response.statusCode == 404) {
      throw ApiException('Resource not found', 404);
    } else {
      throw ApiException(
        'Request failed: ${response.statusCode}',
        response.statusCode,
        responseBody: response.body,
      );
    }
  }

  /// POST request
  Future<Map<String, dynamic>> post(
    String url, {
    Map<String, dynamic>? body,
    Map<String, String>? formData,
  }) async {
    final uri = Uri.parse(url);

    http.Response response;
    if (formData != null) {
      response = await http.post(
        uri,
        body: formData,
        headers: {
          'Accept': 'application/json',
          'Cookie': _cookieHeader,
        },
      ).timeout(const Duration(seconds: 30));
    } else {
      response = await http.post(
        uri,
        body: body != null ? json.encode(body) : '{}',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'Cookie': _cookieHeader,
        },
      ).timeout(const Duration(seconds: 30));
    }

    _parseCookies(response);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      try {
        return json.decode(response.body) as Map<String, dynamic>;
      } catch (e) {
        return {'raw': response.body};
      }
    } else if (response.statusCode == 401) {
      throw ApiException('Unauthorized - please login again', 401);
    } else {
      throw ApiException(
        'Request failed: ${response.statusCode}',
        response.statusCode,
        responseBody: response.body,
      );
    }
  }

  /// DELETE request
  Future<Map<String, dynamic>> delete(
    String url, {
    Map<String, dynamic>? body,
  }) async {
    final uri = Uri.parse(url);
    final response = await http.delete(
      uri,
      body: body != null ? json.encode(body) : null,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Cookie': _cookieHeader,
      },
    ).timeout(const Duration(seconds: 30));

    _parseCookies(response);

    if (response.statusCode >= 200 && response.statusCode < 300) {
      if (response.body.isEmpty) return {};
      return json.decode(response.body) as Map<String, dynamic>;
    } else {
      throw ApiException(
        'Delete failed: ${response.statusCode}',
        response.statusCode,
      );
    }
  }

  /// Get raw response (for file downloads)
  Future<http.Response> getRaw(String url) async {
    return http.get(
      Uri.parse(url),
      headers: {'Cookie': _cookieHeader},
    ).timeout(const Duration(seconds: 60));
  }
}

/// Custom API exception
class ApiException implements Exception {
  final String message;
  final int statusCode;
  final String? responseBody;

  ApiException(this.message, this.statusCode, {this.responseBody});

  @override
  String toString() => message;
}
