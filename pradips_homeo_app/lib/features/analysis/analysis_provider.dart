/// Analysis Provider - case analysis state
import 'package:flutter/widgets.dart';
import '../../data/models/models.dart';
import '../../data/services/analysis_service.dart';

class AnalysisProvider extends ChangeNotifier {
  final AnalysisService _service = AnalysisService();
  final TextEditingController rubricController = TextEditingController();

  List<String> rubrics = [];
  AnalysisResponse? analysis;
  bool isLoading = false;
  String? errorMessage;

  bool get hasResults => analysis != null && analysis!.rankedRemedies.isNotEmpty;
  int get maxScore => analysis?.rankedRemedies.isNotEmpty == true
      ? analysis!.rankedRemedies.first.score
      : 1;

  void addRubric(String value) {
    final r = value.trim();
    if (r.isEmpty) return;
    if (!rubrics.contains(r)) {
      rubrics.add(r);
      rubricController.clear();
      notifyListeners();
    } else {
      rubricController.clear();
      notifyListeners();
    }
  }

  void removeRubric(int index) {
    if (index >= 0 && index < rubrics.length) {
      rubrics.removeAt(index);
      notifyListeners();
    }
  }

  Future<void> analyze() async {
    if (rubrics.isEmpty) return;
    isLoading = true;
    errorMessage = null;
    notifyListeners();
    try {
      analysis = await _service.calculate(rubrics);
    } catch (e) {
      errorMessage = e.toString().replaceFirst('Exception: ', '');
    } finally {
      isLoading = false;
      notifyListeners();
    }
  }

  void clear() {
    rubrics.clear();
    analysis = null;
    errorMessage = null;
    rubricController.clear();
    notifyListeners();
  }

  @override
  void dispose() {
    rubricController.dispose();
    super.dispose();
  }
}
