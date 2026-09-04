/// Materia Medica Provider - offline-first state management
///
/// Reads from local SQLite database (instant response, works offline).
/// Triggers background sync if data is missing or stale.
import 'package:flutter/foundation.dart';
import '../../data/local/app_database.dart';
import '../../data/sync/sync_service.dart';

class MateriaMedicaProvider extends ChangeNotifier {
  final AppDatabase _db = AppDatabase();
  final SyncService _syncService = SyncService();

  List<RemedyRow> remedies = [];
  bool isLoading = false;
  bool hasMore = true;
  String? errorMessage;
  int _page = 1;
  int _pageSize = 50;
  int _total = 0;
  String? selectedLetter;
  String? selectedAuthor;
  List<String> authors = [];

  Future<void> init() async {
    await refresh();
    authors = await _db.getAuthors();
    if (authors.isEmpty) {
      authors = ['Allen', 'Phatak', 'Sankaran', 'Murphy', 'Farrington', 'Boger',
        'Kent', 'Clarke', 'Nash', 'Boericke'];
    }
    notifyListeners();
  }

  Future<void> refresh() async {
    _page = 1;
    hasMore = true;
    remedies = [];
    await loadMore();
  }

  Future<void> loadMore() async {
    if (isLoading || !hasMore) return;
    isLoading = true;
    notifyListeners();
    try {
      final offset = (_page - 1) * _pageSize;
      final items = await _db.getRemedies(
        limit: _pageSize,
        offset: offset,
        letter: selectedLetter,
        author: selectedAuthor,
      );

      if (_page == 1) {
        _total = await _db.getRemedyCount(letter: selectedLetter, author: selectedAuthor);
      }

      remedies.addAll(items);
      hasMore = remedies.length < _total && items.isNotEmpty;
      _page++;
      errorMessage = null;

      if (items.isEmpty && _page == 2) {
        if (await _syncService.hasLocalData() == false) {
          await _syncService.syncAll();
          final retryItems = await _db.getRemedies(
            limit: _pageSize,
            offset: 0,
            letter: selectedLetter,
            author: selectedAuthor,
          );
          remedies.addAll(retryItems);
          _total = await _db.getRemedyCount(letter: selectedLetter, author: selectedAuthor);
          hasMore = remedies.length < _total && retryItems.isNotEmpty;
          _page++;
        }
      }
    } catch (e) {
      errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<List<RemedyRow>> search(String query) async {
    if (query.trim().isEmpty) return [];
    return _db.searchRemedies(query.trim());
  }

  void setLetter(String? letter) {
    if (selectedLetter == letter) return;
    selectedLetter = letter;
    refresh();
  }

  void setAuthor(String? author) {
    if (selectedAuthor == author) return;
    selectedAuthor = author;
    refresh();
  }
}
