/// Data Models for Pradip's Homeo App
/// Mirrors the JSON structure returned by the Next.js backend APIs

/// Remedy model - represents a homeopathic remedy
class Remedy {
  final String id;
  final String name;
  final String common;
  final String author;
  final String letter;
  final String chapter;
  final String organ;
  final String keynote;
  final String? source;
  final int version;

  Remedy({
    required this.id,
    required this.name,
    this.common = '',
    required this.author,
    this.letter = '',
    this.chapter = '',
    this.organ = '',
    this.keynote = '',
    this.source,
    this.version = 1,
  });

  factory Remedy.fromJson(Map<String, dynamic> json) {
    return Remedy(
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      common: json['common'] as String? ?? '',
      author: json['author'] as String? ?? '',
      letter: json['letter'] as String? ?? '',
      chapter: json['chapter'] as String? ?? '',
      organ: json['organ'] as String? ?? '',
      keynote: json['keynote'] as String? ?? '',
      source: json['source'] as String?,
      version: (json['version'] as num?)?.toInt() ?? 1,
    );
  }

  Map<String, dynamic> toJson() => {
    'id': id, 'name': name, 'common': common, 'author': author,
    'letter': letter, 'chapter': chapter, 'organ': organ,
    'keynote': keynote, 'source': source,
  };
}

/// Paginated list of remedies
class RemedyList {
  final int total;
  final int page;
  final int pageSize;
  final List<Remedy> items;

  RemedyList({
    required this.total,
    required this.page,
    required this.pageSize,
    required this.items,
  });

  factory RemedyList.fromJson(Map<String, dynamic> json) {
    return RemedyList(
      total: json['total'] as int? ?? 0,
      page: json['page'] as int? ?? 1,
      pageSize: json['pageSize'] as int? ?? 50,
      items: (json['items'] as List<dynamic>?)
          ?.map((e) => Remedy.fromJson(e as Map<String, dynamic>))
          .toList() ??
          [],
    );
  }
}

/// Rubric model - represents a repertory rubric
class Rubric {
  final String id;
  final String main;
  final String chapter;
  final String author;
  final String? parentId;
  final List<Rubric> subRubrics;
  final List<RemedyGrade>? remedies;

  Rubric({
    required this.id,
    required this.main,
    this.chapter = '',
    this.author = '',
    this.parentId,
    this.subRubrics = const [],
    this.remedies,
  });

  factory Rubric.fromJson(Map<String, dynamic> json) {
    return Rubric(
      id: json['id'] as String? ?? '',
      main: json['main'] as String? ?? '',
      chapter: json['chapter'] as String? ?? '',
      author: json['author'] as String? ?? '',
      parentId: json['parentId'] as String? ?? json['parent_id'] as String?,
      subRubrics: (json['subRubrics'] as List<dynamic>?)
          ?.map((e) => Rubric.fromJson(e as Map<String, dynamic>))
          .toList() ??
          [],
      remedies: (json['remedies'] as List<dynamic>?)
          ?.map((e) => RemedyGrade.fromString(e as String))
          .toList(),
    );
  }

  bool get hasSubRubrics => subRubrics.isNotEmpty;
  bool get hasRemedies => remedies != null && remedies!.isNotEmpty;
}

/// Remedy with grade - used in rubric remedy lists
/// Format from API: "Remedy Name|grade" e.g. "Arnica|3"
class RemedyGrade {
  final String name;
  final int grade;

  RemedyGrade({required this.name, required this.grade});

  factory RemedyGrade.fromString(String input) {
    // Handle "Name|grade" format
    if (input.contains('|')) {
      final parts = input.split('|');
      final name = parts[0].trim();
      final gradeStr = parts.length > 1 ? parts[1].trim() : '';
      int grade = 1;
      // Try to parse grade as int, or map roman numerals
      final gradeInt = int.tryParse(gradeStr);
      if (gradeInt != null) {
        grade = gradeInt;
      } else {
        switch (gradeStr.toUpperCase()) {
          case 'IV': grade = 4; break;
          case 'III': grade = 3; break;
          case 'II': grade = 2; break;
          case 'I': grade = 1; break;
          default: grade = 1;
        }
      }
      return RemedyGrade(name: name, grade: grade);
    }
    return RemedyGrade(name: input.trim(), grade: 1);
  }
}

/// Chapter info for repertory
class Chapter {
  final String name;
  final int rubricCount;

  Chapter({required this.name, required this.rubricCount});

  factory Chapter.fromJson(Map<String, dynamic> json) {
    return Chapter(
      name: json['name'] as String? ?? '',
      rubricCount: json['rubricCount'] as int? ?? 0,
    );
  }
}

/// Search result item
class SearchResult {
  final String type;  // 'remedy', 'rubric', 'clinical', etc.
  final String id;
  final String name;
  final String? author;
  final String? source;
  final String? subsection;
  final String? matchType;
  final String? matchText;
  final String? snippet;
  final String? href;

  SearchResult({
    required this.type,
    required this.id,
    required this.name,
    this.author,
    this.source,
    this.subsection,
    this.matchType,
    this.matchText,
    this.snippet,
    this.href,
  });

  factory SearchResult.fromJson(Map<String, dynamic> json) {
    return SearchResult(
      type: json['type'] as String? ?? '',
      id: json['id'] as String? ?? '',
      name: json['name'] as String? ?? '',
      author: json['author'] as String?,
      source: json['source'] as String?,
      subsection: json['subsection'] as String?,
      matchType: json['matchType'] as String?,
      matchText: json['matchText'] as String?,
      snippet: json['snippet'] as String?,
      href: json['href'] as String?,
    );
  }
}

/// User model
class AppUser {
  final String name;
  final String email;
  final String role;

  AppUser({
    required this.name,
    required this.email,
    required this.role,
  });

  factory AppUser.fromJson(Map<String, dynamic> json) {
    return AppUser(
      name: json['name'] as String? ?? '',
      email: json['email'] as String? ?? '',
      role: json['role'] as String? ?? 'user',
    );
  }

  bool get isAdmin => role == 'admin';
}

/// Bookmark item
class Bookmark {
  final String itemId;
  final String itemType;
  final String title;
  final String? href;
  final String? author;

  Bookmark({
    required this.itemId,
    required this.itemType,
    required this.title,
    this.href,
    this.author,
  });

  factory Bookmark.fromJson(Map<String, dynamic> json) {
    return Bookmark(
      itemId: json['item_id'] as String? ?? '',
      itemType: json['item_type'] as String? ?? '',
      title: json['title'] as String? ?? '',
      href: json['href'] as String?,
      author: json['author'] as String?,
    );
  }
}

/// Analysis result - ranked remedy
class AnalysisResult {
  final String remedy;
  final int score;
  final int rubricsMatched;
  final double? percentage;

  AnalysisResult({
    required this.remedy,
    required this.score,
    required this.rubricsMatched,
    this.percentage,
  });

  factory AnalysisResult.fromJson(Map<String, dynamic> json) {
    return AnalysisResult(
      remedy: json['remedy'] as String? ?? '',
      score: (json['score'] as num?)?.toInt() ?? 0,
      rubricsMatched: (json['rubricsMatched'] as num?)?.toInt() ?? 0,
      percentage: (json['percentage'] as num?)?.toDouble(),
    );
  }
}

/// Analysis response
class AnalysisResponse {
  final bool success;
  final int totalRubrics;
  final int totalRemedies;
  final List<AnalysisResult> rankedRemedies;
  final String explanation;
  final String disclaimer;

  AnalysisResponse({
    required this.success,
    required this.totalRubrics,
    required this.totalRemedies,
    required this.rankedRemedies,
    required this.explanation,
    required this.disclaimer,
  });

  factory AnalysisResponse.fromJson(Map<String, dynamic> json) {
    return AnalysisResponse(
      success: json['success'] as bool? ?? false,
      totalRubrics: (json['totalRubrics'] as num?)?.toInt() ?? 0,
      totalRemedies: (json['totalRemedies'] as num?)?.toInt() ?? 0,
      rankedRemedies: (json['rankedRemedies'] as List<dynamic>?)
          ?.map((e) => AnalysisResult.fromJson(e as Map<String, dynamic>))
          .toList() ??
          [],
      explanation: json['explanation'] as String? ?? '',
      disclaimer: json['disclaimer'] as String? ?? '',
    );
  }
}
