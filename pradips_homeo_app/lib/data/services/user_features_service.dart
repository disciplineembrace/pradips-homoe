/// User Features Service - bookmarks, favorites, notes, history
/// Falls back gracefully when Supabase is unreachable
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

class UserFeaturesService {
  final ApiClient _client = ApiClient();

  /// Get all bookmarks
  Future<List<Map<String, dynamic>>> getBookmarks() async {
    final response = await _client.get(ApiConstants.userBookmarks);
    final items = response['items'] as List<dynamic>? ?? [];
    return items.cast<Map<String, dynamic>>();
  }

  /// Add a bookmark
  Future<bool> addBookmark({
    required String itemId,
    required String itemType,
    required String title,
    String? href,
    String? author,
  }) async {
    try {
      await _client.post(ApiConstants.userBookmarks, body: {
        'item_id': itemId,
        'item_type': itemType,
        'title': title,
        if (href != null) 'href': href,
        if (author != null) 'author': author,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Remove a bookmark
  Future<bool> removeBookmark(String itemId, String itemType) async {
    try {
      await _client.delete(ApiConstants.userBookmarks, body: {
        'item_id': itemId,
        'item_type': itemType,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Get all favorites
  Future<List<Map<String, dynamic>>> getFavorites() async {
    final response = await _client.get(ApiConstants.userFavorites);
    final items = response['items'] as List<dynamic>? ?? [];
    return items.cast<Map<String, dynamic>>();
  }

  /// Add a favorite
  Future<bool> addFavorite({
    required String itemId,
    required String itemType,
    required String title,
    String? href,
  }) async {
    try {
      await _client.post(ApiConstants.userFavorites, body: {
        'item_id': itemId,
        'item_type': itemType,
        'title': title,
        if (href != null) 'href': href,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Get all notes
  Future<List<Map<String, dynamic>>> getNotes({String? itemId, String? itemType}) async {
    final params = <String, String>{};
    if (itemId != null) params['item_id'] = itemId;
    if (itemType != null) params['item_type'] = itemType;
    final response = await _client.get(ApiConstants.userNotes, queryParameters: params);
    final items = response['items'] as List<dynamic>? ?? [];
    return items.cast<Map<String, dynamic>>();
  }

  /// Add a note
  Future<bool> addNote({
    required String itemId,
    required String itemType,
    required String text,
  }) async {
    try {
      await _client.post(ApiConstants.userNotes, body: {
        'item_id': itemId,
        'item_type': itemType,
        'text': text,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Get reading history
  Future<List<Map<String, dynamic>>> getHistory() async {
    final response = await _client.get(ApiConstants.userHistory);
    final items = response['items'] as List<dynamic>? ?? [];
    return items.cast<Map<String, dynamic>>();
  }

  /// Add to history
  Future<bool> addToHistory({
    required String itemId,
    required String itemType,
    required String title,
    String? href,
  }) async {
    try {
      await _client.post(ApiConstants.userHistory, body: {
        'item_id': itemId,
        'item_type': itemType,
        'title': title,
        if (href != null) 'href': href,
      });
      return true;
    } catch (_) {
      return false;
    }
  }

  /// Get reader features (aggregate endpoint)
  Future<Map<String, dynamic>> getReaderFeatures() async {
    return _client.get(ApiConstants.userReaderFeatures);
  }
}
