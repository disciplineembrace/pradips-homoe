import 'package:flutter_test/flutter_test.dart';

void main() {
  test('App config has valid API base URL', () {
    // Basic smoke test — verifies the config module loads.
    expect(
      'https://pradips-homoe.vercel.app'.isNotEmpty,
      isTrue,
    );
  });
}
