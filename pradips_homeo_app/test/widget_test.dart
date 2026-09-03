// Basic smoke test for Pradip's Homeo app
import 'package:flutter_test/flutter_test.dart';
import 'package:pradips_homeo/core/constants/api_constants.dart';

void main() {
  test('App constants are defined', () {
    expect(ApiConstants.appName, "Pradip's Homeo");
    expect(ApiConstants.appVersion, '1.0.0');
    expect(ApiConstants.apiBaseUrl, contains('pradips-homoe.vercel.app'));
    expect(ApiConstants.remedies, contains('/api/remedies'));
    expect(ApiConstants.rubricsTree, contains('/api/rubrics/tree'));
  });

  test('Grade labels map is complete', () {
    expect(ApiConstants.gradeLabels.length, 4);
    expect(ApiConstants.gradeLabels[4], contains('Highest'));
    expect(ApiConstants.gradeLabels[3], contains('Strong'));
    expect(ApiConstants.gradeLabels[2], contains('Moderate'));
    expect(ApiConstants.gradeLabels[1], contains('Lower'));
  });
}
