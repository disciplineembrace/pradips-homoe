/// Remedies Service - fetch homeopathic remedies from backend
import '../models/models.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

class RemediesService {
  final ApiClient _client = ApiClient();

  /// Get paginated list of remedies
  /// [page] starts at 1
  /// [pageSize] default 50
  /// [letter] filter by first letter (A, B, C, ...)
  /// [author] filter by author (Allen, Phatak, Sankaran, Murphy, Farrington, Boger)
  Future<RemedyList> getRemedies({
    int page = 1,
    int pageSize = 50,
    String? letter,
    String? author,
  }) async {
    final params = <String, String>{
      'page': page.toString(),
      'pageSize': pageSize.toString(),
    };
    if (letter != null && letter.isNotEmpty) params['letter'] = letter;
    if (author != null && author.isNotEmpty) params['author'] = author;

    final response = await _client.get(ApiConstants.remedies, queryParameters: params);
    return RemedyList.fromJson(response);
  }

  /// Get a specific remedy by ID
  /// Note: The website serves remedy pages as full HTML, not JSON.
  /// For the app, we use the remedies list and find by ID.
  Future<Remedy?> getRemedyById(String id) async {
    // Search through remedies to find this one
    // The API doesn't have a direct /api/remedies/:id endpoint
    // We need to fetch by letter or author and filter
    final letter = id.isNotEmpty ? id[0].toUpperCase() : 'A';

    // Try fetching by first letter
    try {
      final list = await getRemedies(page: 1, pageSize: 100, letter: letter);
      for (final r in list.items) {
        if (r.id == id) return r;
      }
      // If not found in first page, try more pages
      final totalPages = (list.total / 100).ceil();
      for (var p = 2; p <= totalPages && p <= 10; p++) {
        final more = await getRemedies(page: p, pageSize: 100, letter: letter);
        for (final r in more.items) {
          if (r.id == id) return r;
        }
      }
    } catch (_) {}

    return null;
  }

  /// Get total count of remedies
  Future<int> getTotalCount() async {
    final list = await getRemedies(page: 1, pageSize: 1);
    return list.total;
  }
}
