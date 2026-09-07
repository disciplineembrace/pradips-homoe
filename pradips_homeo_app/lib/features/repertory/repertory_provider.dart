/// Repertory Provider - offline-first state management
import 'package:flutter/foundation.dart';
import '../../data/local/app_database.dart';
import '../../data/sync/sync_service.dart';

class RepertoryProvider extends ChangeNotifier {
  final AppDatabase _db = AppDatabase();
  final SyncService _syncService = SyncService();

  List<RubricRow> rubrics = [];
  List<Chapter> chapters = [];
  String? selectedChapter;
  bool isLoading = false;
  String? errorMessage;

  Future<void> init() async {
    await loadChapters();
    await loadRubrics();
  }

  Future<void> loadChapters() async {
    try {
      chapters = await _db.getAllChapters();
      notifyListeners();
    } catch (e) {
      debugPrint('Failed to load chapters: $e');
    }
  }

  Future<void> loadRubrics() async {
    isLoading = true;
    notifyListeners();
    try {
      rubrics = await _db.getTopLevelRubrics(chapter: selectedChapter, limit: 100);
      errorMessage = null;

      if (rubrics.isEmpty) {
        if (await _syncService.hasLocalData() == false) {
          await _syncService.syncAll();
          rubrics = await _db.getTopLevelRubrics(chapter: selectedChapter, limit: 100);
        }
      }
    } catch (e) {
      errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  Future<void> setChapter(String? chapter) async {
    if (selectedChapter == chapter) return;
    selectedChapter = chapter;
    await loadRubrics();
  }

  /// Get sub-rubrics for a parent (for expansion in tree)
  Future<List<RubricRow>> getSubRubrics(String parentId) async {
    return _db.getSubRubrics(parentId);
  }
}
