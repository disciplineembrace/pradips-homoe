/// Search Service - global search and clinical search
import '../models/models.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

class SearchService {
  final ApiClient _client = ApiClient();

  /// Global search across remedies, rubrics, etc.
  Future<List<SearchResult>> search(String query, {int limit = 50}) async {
    if (query.trim().isEmpty) return [];
    final response = await _client.get(
      ApiConstants.search,
      queryParameters: {'q': query.trim(), 'limit': limit.toString()},
    );
    final results = response['results'] as List<dynamic>? ?? [];
    return results.map((e) => SearchResult.fromJson(e as Map<String, dynamic>)).toList();
  }

  /// Clinical search - searches within clinical content
  Future<List<SearchResult>> clinicalSearch(String query, {int limit = 50}) async {
    if (query.trim().isEmpty) return [];
    final response = await _client.get(
      ApiConstants.clinicalSearch,
      queryParameters: {'q': query.trim(), 'limit': limit.toString()},
    );
    final results = response['results'] as List<dynamic>? ?? [];
    return results.map((e) => SearchResult.fromJson(e as Map<String, dynamic>)).toList();
  }
}
