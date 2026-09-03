/// Rubrics Service - fetch repertory rubrics from backend
import '../models/models.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

class RubricsService {
  final ApiClient _client = ApiClient();

  /// Get rubric tree (paginated)
  /// Returns top-level rubrics with their sub-rubrics
  Future<List<Rubric>> getRubricTree({
    int page = 1,
    int pageSize = 20,
    String? chapter,
    String? author,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };
    if (chapter != null && chapter.isNotEmpty) params['chapter'] = chapter;
    if (author != null && author.isNotEmpty) params['author'] = author;

    final response = await _client.get(ApiConstants.rubricsTree, queryParameters: params);
    final items = response['items'] as List<dynamic>? ?? [];
    return items.map((e) => Rubric.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Get total rubric count
  Future<int> getTotalCount() async {
    final response = await _client.get(ApiConstants.rubricsTree, queryParameters: {
      'page': '1', 'pageSize': '1',
    });
    return response['total'] as int? ?? 0;
  }

  /// Get list of chapters
  Future<List<Chapter>> getChapters() async {
    final response = await _client.get(ApiConstants.rubricsChapters);
    final items = response['items'] as List<dynamic>? ?? [];
    return items.map((e) => Chapter.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Get rubrics by chapter
  Future<List<Rubric>> getByChapter(String chapter, {int page = 1, int pageSize = 50}) async {
    return getRubricTree(page: page, pageSize: pageSize, chapter: chapter);
  }
}
