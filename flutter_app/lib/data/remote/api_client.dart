/// API client — real endpoint calls to the existing website backend.
///
/// All methods are fully implemented. No placeholders.
/// Uses the existing Next.js API routes (same URLs as the website).
library;

import 'dart:convert';
import '../../core/config/app_config.dart';
import '../../core/network/api_exceptions.dart';
import '../../core/network/dio_client.dart';
import 'dtos/dtos.dart';

class ApiClient {
  final DioClient _dio;

  ApiClient(this._dio);

  // ============================================================
  // AUTH
  // ============================================================

  /// Login with email + PIN.
  Future<LoginResponse> login({required String email, required String pin}) async {
    final data = await _dio.post<Map<String, dynamic>>(
      AppConfig.loginEndpoint,
      data: {'email': email, 'pin': pin},
    );
    return LoginResponse.fromJson(data);
  }

  /// Check if session is valid.
  Future<SessionResponse> checkSession() async {
    final data = await _dio.get<Map<String, dynamic>>(AppConfig.sessionEndpoint);
    return SessionResponse.fromJson(data);
  }

  /// Get current user info.
  Future<AuthUserDto> getMe() async {
    final data = await _dio.get<Map<String, dynamic>>(AppConfig.meEndpoint);
    return AuthUserDto.fromJson(data);
  }

  /// Logout.
  Future<void> logout() async {
    await _dio.post(AppConfig.logoutEndpoint);
  }

  // ============================================================
  // REMEDIES (Materia Medica)
  // ============================================================

  /// Fetch remedies with pagination.
  Future<PaginatedResponse<RemedyDto>> fetchRemedies({
    int page = 1,
    int pageSize = 100,
    String? author,
    String? q,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (author != null && author != 'All') params['author'] = author;
    if (q != null && q.isNotEmpty) params['q'] = q;

    final data = await _dio.get<Map<String, dynamic>>(
      AppConfig.remediesEndpoint,
      queryParameters: params,
    );
    final items = (data['remedies'] as List? ?? [])
        .map((r) => RemedyDto.fromJson(r as Map<String, dynamic>))
        .toList();
    return PaginatedResponse(
      items: items,
      total: (data['total'] as num?)?.toInt() ?? 0,
      page: (data['page'] as num?)?.toInt() ?? page,
      pageSize: (data['pageSize'] as num?)?.toInt() ?? pageSize,
    );
  }

  // ============================================================
  // RUBRICS (Repertory)
  // ============================================================

  /// Fetch rubrics with pagination.
  Future<PaginatedResponse<RubricDto>> fetchRubrics({
    int page = 1,
    int pageSize = 100,
    String? author,
    String? chapter,
    String? q,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'pageSize': pageSize,
    };
    if (author != null) params['author'] = author;
    if (chapter != null && chapter.isNotEmpty) params['chapter'] = chapter;
    if (q != null && q.isNotEmpty) params['q'] = q;

    final data = await _dio.get<Map<String, dynamic>>(
      AppConfig.rubricsEndpoint,
      queryParameters: params,
    );
    final items = (data['items'] as List? ?? [])
        .map((r) => RubricDto.fromJson(r as Map<String, dynamic>))
        .toList();
    return PaginatedResponse(
      items: items,
      total: (data['total'] as num?)?.toInt() ?? 0,
      page: (data['page'] as num?)?.toInt() ?? page,
      pageSize: (data['pageSize'] as num?)?.toInt() ?? pageSize,
    );
  }

  /// Fetch rubric children (lazy loading — one level).
  Future<List<RubricDto>> fetchRubricChildren({
    required String author,
    String? parentId,
    String? chapter,
  }) async {
    final params = <String, dynamic>{'author': author};
    if (parentId != null) params['parentId'] = parentId;
    if (chapter != null) params['chapter'] = chapter;

    final data = await _dio.get<Map<String, dynamic>>(
      AppConfig.rubricsChildrenEndpoint,
      queryParameters: params,
    );
    return (data['children'] as List? ?? [])
        .map((r) => RubricDto.fromJson(r as Map<String, dynamic>))
        .toList();
  }

  /// Fetch chapters for a given author.
  Future<List<String>> fetchChapters(String author) async {
    final data = await _dio.get<Map<String, dynamic>>(
      AppConfig.rubricsChaptersEndpoint,
      queryParameters: {'author': author},
    );
    return (data['items'] as List? ?? [])
        .map((c) => (c as Map<String, dynamic>)['name'].toString())
        .toList();
  }

  // ============================================================
  // BOOKS
  // ============================================================

  Future<PaginatedResponse<BookDto>> fetchBooks({
    int page = 1,
    int pageSize = 100,
  }) async {
    final data = await _dio.get<Map<String, dynamic>>(
      AppConfig.booksEndpoint,
      queryParameters: {'page': page, 'pageSize': pageSize},
    );
    final items = (data['books'] as List? ?? [])
        .map((b) => BookDto.fromJson(b as Map<String, dynamic>))
        .toList();
    return PaginatedResponse(
      items: items,
      total: (data['total'] as num?)?.toInt() ?? 0,
      page: page,
      pageSize: pageSize,
    );
  }

  // ============================================================
  // CLINICAL SEARCH
  // ============================================================

  Future<PaginatedResponse<SearchResultDto>> clinicalSearch({
    required String q,
    String subject = 'all',
    String source = 'all',
    int page = 1,
    int pageSize = 20,
  }) async {
    final data = await _dio.get<Map<String, dynamic>>(
      AppConfig.clinicalSearchEndpoint,
      queryParameters: {
        'q': q,
        'subject': subject,
        'source': source,
        'page': page,
        'pageSize': pageSize,
      },
    );
    final items = (data['results'] as List? ?? [])
        .map((r) => SearchResultDto.fromJson(r as Map<String, dynamic>))
        .toList();
    return PaginatedResponse(
      items: items,
      total: (data['total'] as num?)?.toInt() ?? 0,
      page: (data['page'] as num?)?.toInt() ?? page,
      pageSize: (data['pageSize'] as num?)?.toInt() ?? pageSize,
    );
  }

  // ============================================================
  // USER FEATURES (bookmarks, favorites, history)
  // ============================================================

  /// Fetch user bookmarks.
  Future<List<Map<String, dynamic>>> fetchBookmarks() async {
    final data = await _dio.get<Map<String, dynamic>>(AppConfig.bookmarksEndpoint);
    return (data['items'] as List? ?? []).cast<Map<String, dynamic>>();
  }

  /// Create a bookmark on the server.
  Future<Map<String, dynamic>> createBookmark({
    required String entityId,
    required String entityType,
    required String title,
    required String idempotencyKey,
  }) async {
    return await _dio.post<Map<String, dynamic>>(
      AppConfig.bookmarksEndpoint,
      data: {
        'entityId': entityId,
        'entityType': entityType,
        'title': title,
        'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Delete a bookmark on the server.
  Future<void> deleteBookmark({required String entityId, required String idempotencyKey}) async {
    await _dio.delete(
      AppConfig.bookmarksEndpoint,
      queryParameters: {
        'entityId': entityId,
        'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Fetch user favorites.
  Future<List<Map<String, dynamic>>> fetchFavorites() async {
    final data = await _dio.get<Map<String, dynamic>>(AppConfig.favoritesEndpoint);
    return (data['items'] as List? ?? []).cast<Map<String, dynamic>>();
  }

  /// Create a favorite.
  Future<Map<String, dynamic>> createFavorite({
    required String entityId,
    required String entityType,
    required String title,
    String? author,
    required String idempotencyKey,
  }) async {
    return await _dio.post<Map<String, dynamic>>(
      AppConfig.favoritesEndpoint,
      data: {
        'entityId': entityId,
        'entityType': entityType,
        'title': title,
        'author': author,
        'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Delete a favorite.
  Future<void> deleteFavorite({required String entityId, required String idempotencyKey}) async {
    await _dio.delete(
      AppConfig.favoritesEndpoint,
      queryParameters: {
        'entityId': entityId,
        'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Add to reading history.
  Future<void> addHistory({
    required String entityId,
    required String entityType,
    required String title,
    String? author,
    required String idempotencyKey,
  }) async {
    await _dio.post<Map<String, dynamic>>(
      AppConfig.historyEndpoint,
      data: {
        'entityId': entityId,
        'entityType': entityType,
        'title': title,
        'author': author,
        'idempotencyKey': idempotencyKey,
      },
    );
  }

  /// Fetch reading history.
  Future<List<Map<String, dynamic>>> fetchHistory() async {
    final data = await _dio.get<Map<String, dynamic>>(AppConfig.historyEndpoint);
    return (data['items'] as List? ?? []).cast<Map<String, dynamic>>();
  }
}
