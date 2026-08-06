/// Data Transfer Objects (DTOs) for API responses.
///
/// These mirror the JSON structure returned by the existing website API.
/// Used for parsing API responses before storing in local SQLite.
library;

import 'dart:convert';

// ============================================================
// REMEDY DTO
// ============================================================
class RemedyDto {
  final String id;
  final String name;
  final String author;
  final String? sourceBook;
  final String? keynote;
  final String? full;
  final String? sourcePages;

  RemedyDto({
    required this.id,
    required this.name,
    required this.author,
    this.sourceBook,
    this.keynote,
    this.full,
    this.sourcePages,
  });

  factory RemedyDto.fromJson(Map<String, dynamic> json) => RemedyDto(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        author: json['author']?.toString() ?? json['source_book']?.toString() ?? '',
        sourceBook: json['source_book']?.toString(),
        keynote: json['keynote']?.toString(),
        full: json['full']?.toString(),
        sourcePages: json['source_pages']?.toString(),
      );

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'author': author,
        'source_book': sourceBook,
        'keynote': keynote,
        'full': full,
        'source_pages': sourcePages,
      };
}

// ============================================================
// RUBRIC DTO
// ============================================================
class RubricDto {
  final String id;
  final String? parentId;
  final String source;
  final String chapter;
  final String title;
  final String fullPath;
  final int level;
  final List<ParsedRemedyDto> remedies;
  final int remedyCount;
  final Map<String, List<String>> byGrade;

  RubricDto({
    required this.id,
    this.parentId,
    required this.source,
    required this.chapter,
    required this.title,
    required this.fullPath,
    required this.level,
    required this.remedies,
    required this.remedyCount,
    required this.byGrade,
  });

  factory RubricDto.fromJson(Map<String, dynamic> json) {
    final remediesRaw = json['remedies'] as List? ?? [];
    final remedies = remediesRaw.map((r) {
      if (r is Map) {
        return ParsedRemedyDto(
          abbrev: r['abbrev']?.toString() ?? '',
          grade: (r['grade'] as num?)?.toInt() ?? 1,
        );
      }
      // Format: "abbrev|grade"
      final parts = r.toString().split('|');
      return ParsedRemedyDto(
        abbrev: parts[0],
        grade: parts.length > 1 ? int.tryParse(parts[1]) ?? 1 : 1,
      );
    }).toList();

    final byGrade = <String, List<String>>{};
    final bg = json['byGrade'] as Map? ?? {};
    for (final entry in bg.entries) {
      byGrade[entry.key] = (entry.value as List).map((e) => e.toString()).toList();
    }

    return RubricDto(
      id: json['id']?.toString() ?? '',
      parentId: json['parentId']?.toString() ?? json['parent_id']?.toString(),
      source: json['source']?.toString() ?? json['author']?.toString() ?? '',
      chapter: json['chapter']?.toString() ?? '',
      title: json['title']?.toString() ?? '',
      fullPath: json['fullPath']?.toString() ?? json['full_path']?.toString() ?? json['title']?.toString() ?? '',
      level: (json['level'] as num?)?.toInt() ?? 0,
      remedies: remedies,
      remedyCount: (json['remedyCount'] as num?)?.toInt() ?? remedies.length,
      byGrade: byGrade,
    );
  }

  String get remediesJson => jsonEncode(remedies.map((r) => {'abbrev': r.abbrev, 'grade': r.grade}).toList());
}

class ParsedRemedyDto {
  final String abbrev;
  final int grade;
  const ParsedRemedyDto({required this.abbrev, required this.grade});
}

// ============================================================
// BOOK DTO
// ============================================================
class BookDto {
  final String id;
  final String title;
  final String? subtitle;
  final String? author;
  final String? category;
  final String? description;
  final int totalChapters;

  BookDto({
    required this.id,
    required this.title,
    this.subtitle,
    this.author,
    this.category,
    this.description,
    required this.totalChapters,
  });

  factory BookDto.fromJson(Map<String, dynamic> json) => BookDto(
        id: json['id']?.toString() ?? '',
        title: json['title']?.toString() ?? '',
        subtitle: json['subtitle']?.toString(),
        author: json['author']?.toString(),
        category: json['category']?.toString(),
        description: json['description']?.toString(),
        totalChapters: (json['totalChapters'] as num?)?.toInt() ?? 0,
      );
}

// ============================================================
// SEARCH RESULT DTO
// ============================================================
class SearchResultDto {
  final String type; // 'remedy' | 'rubric'
  final String id;
  final String name;
  final String author;
  final String source;
  final String? subsection;
  final String matchType; // 'exact' | 'close' | 'related'
  final String matchText;
  final String snippet;
  final String href;
  final String? sourcePages;
  final Map<String, String>? categories;

  SearchResultDto({
    required this.type,
    required this.id,
    required this.name,
    required this.author,
    required this.source,
    this.subsection,
    required this.matchType,
    required this.matchText,
    required this.snippet,
    required this.href,
    this.sourcePages,
    this.categories,
  });

  factory SearchResultDto.fromJson(Map<String, dynamic> json) => SearchResultDto(
        type: json['type']?.toString() ?? 'remedy',
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        author: json['author']?.toString() ?? '',
        source: json['source']?.toString() ?? '',
        subsection: json['subsection']?.toString(),
        matchType: json['matchType']?.toString() ?? 'related',
        matchText: json['matchText']?.toString() ?? '',
        snippet: json['snippet']?.toString() ?? '',
        href: json['href']?.toString() ?? '',
        sourcePages: json['sourcePages']?.toString(),
        categories: (json['categories'] as Map?)?.map(
          (k, v) => MapEntry(k.toString(), v.toString()),
        ),
      );
}

// ============================================================
// API RESPONSE WRAPPERS
// ============================================================
class PaginatedResponse<T> {
  final List<T> items;
  final int total;
  final int page;
  final int pageSize;
  final String? nextCursor;

  PaginatedResponse({
    required this.items,
    required this.total,
    required this.page,
    required this.pageSize,
    this.nextCursor,
  });
}

class LoginResponse {
  final bool success;
  final String? error;
  final String? token;
  final AuthUserDto? user;
  final String? redirect;

  LoginResponse({
    required this.success,
    this.error,
    this.token,
    this.user,
    this.redirect,
  });

  factory LoginResponse.fromJson(Map<String, dynamic> json) => LoginResponse(
        success: json['success'] == true,
        error: json['error']?.toString(),
        token: json['token']?.toString(),
        user: json['user'] != null ? AuthUserDto.fromJson(json['user']) : null,
        redirect: json['redirect']?.toString(),
      );
}

class AuthUserDto {
  final String id;
  final String name;
  final String email;
  final String role;

  AuthUserDto({
    required this.id,
    required this.name,
    required this.email,
    required this.role,
  });

  factory AuthUserDto.fromJson(Map<String, dynamic> json) => AuthUserDto(
        id: json['id']?.toString() ?? '',
        name: json['name']?.toString() ?? '',
        email: json['email']?.toString() ?? '',
        role: json['role']?.toString() ?? 'user',
      );
}

class SessionResponse {
  final bool authenticated;

  SessionResponse({required this.authenticated});

  factory SessionResponse.fromJson(Map<String, dynamic> json) =>
      SessionResponse(authenticated: json['authenticated'] == true);
}
