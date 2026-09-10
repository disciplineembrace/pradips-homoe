/// Analysis Service - case analysis with rubric-based remedy ranking
import '../models/models.dart';
import 'api_client.dart';
import '../../core/constants/api_constants.dart';

class AnalysisService {
  final ApiClient _client = ApiClient();

  /// Calculate analysis from list of rubric IDs or symptom keywords
  Future<AnalysisResponse> calculate(List<String> rubrics) async {
    final response = await _client.post(
      ApiConstants.analysisCalculate,
      body: {'rubrics': rubrics},
    );
    return AnalysisResponse.fromJson(response);
  }
}
