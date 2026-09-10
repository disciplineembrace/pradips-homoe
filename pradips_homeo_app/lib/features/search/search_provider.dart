/// Search Provider - offline-first search using local SQLite FTS
/// Falls back to API search when online and local DB is empty
import 'package:flutter/foundation.dart';
import 'package:flutter/widgets.dart';
import 'package:shared_preferences/shared_preferences.dart';
import '../../data/local/app_database.dart';
import '../../data/models/models.dart';
import '../../data/services/search_service.dart';
import '../../data/sync/connectivity_service.dart';

enum SearchMode { global, clinical }

class SearchProvider extends ChangeNotifier {
  final SearchService _remoteService = SearchService();
  final AppDatabase _db = AppDatabase();
  final ConnectivityService _connectivity = ConnectivityService();

  final TextEditingController searchController = TextEditingController();

  String query = '';
  SearchMode mode = SearchMode.global;
  List<SearchResult> results = [];
  bool isLoading = false;
  String? errorMessage;
  List<String> recentSearches = [];
  bool _isOnline = true;

  static const String _recentKey = 'recent_searches';

  SearchProvider() {
    _loadRecent();
    _connectivity.init();
    _connectivity.onOnlineStatusChanged.listen((online) {
      _isOnline = online;
      notifyListeners();
    });
    _isOnline = _connectivity.isOnline;
    searchController.addListener(() {
      if (query != searchController.text) {
        query = searchController.text;
        notifyListeners();
      }
    });
  }

  Future<void> _loadRecent() async {
    final prefs = await SharedPreferences.getInstance();
    recentSearches = prefs.getStringList(_recentKey) ?? [];
    notifyListeners();
  }

  Future<void> _saveRecent(String q) async {
    final prefs = await SharedPreferences.getInstance();
    recentSearches.remove(q);
    recentSearches.insert(0, q);
    if (recentSearches.length > 10) recentSearches = recentSearches.sublist(0, 10);
    await prefs.setStringList(_recentKey, recentSearches);
    notifyListeners();
  }

  Future<void> search(String q) async {
    query = q.trim();
    if (query.isEmpty) {
      results = [];
      notifyListeners();
      return;
    }

    isLoading = true;
    notifyListeners();

    try {
      // First try local DB search (instant, works offline)
      final localRemedies = await _db.searchRemedies(query, limit: 50);

      if (localRemedies.isNotEmpty) {
        // Convert local DB remedies to SearchResult format
        results = localRemedies.map((r) => SearchResult(
              type: 'remedy',
              id: r.id,
              name: r.name,
              author: r.author,
              source: r.source,
              href: '/remedy/${r.id}',
            )).toList();
        await _saveRecent(query);
        errorMessage = null;
      } else if (_isOnline) {
        // Fall back to remote API search if local DB is empty
        if (mode == SearchMode.global) {
          results = await _remoteService.search(query);
        } else {
          results = await _remoteService.clinicalSearch(query);
        }
        await _saveRecent(query);
        errorMessage = null;
      } else {
        // Offline and no local results
        results = [];
        errorMessage = 'No results found offline. Connect to internet to search.';
      }
    } catch (e) {
      errorMessage = e.toString().replaceFirst('Exception: ', '');
      results = [];
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void setMode(SearchMode m) {
    if (mode == m) return;
    mode = m;
    if (query.isNotEmpty) {
      search(query);
    } else {
      notifyListeners();
    }
  }

  void clear() {
    searchController.clear();
    query = '';
    results = [];
    errorMessage = null;
    notifyListeners();
  }

  Future<void> removeRecent(String q) async {
    recentSearches.remove(q);
    final prefs = await SharedPreferences.getInstance();
    await prefs.setStringList(_recentKey, recentSearches);
    notifyListeners();
  }

  Future<void> clearRecent() async {
    recentSearches = [];
    final prefs = await SharedPreferences.getInstance();
    await prefs.remove(_recentKey);
    notifyListeners();
  }

  @override
  void dispose() {
    searchController.dispose();
    _connectivity.dispose();
    super.dispose();
  }
}
