/// App entry point.
///
/// Initializes:
///   - WidgetsFlutterBinding
///   - Riverpod ProviderScope
///
/// Background sync is handled by the OutboxProcessor which runs on
/// app launch, app resume, and when connectivity is restored.
/// This avoids the need for workmanager (which uses obsolete Flutter
/// embedding APIs incompatible with current Flutter stable).
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'app.dart';

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  runApp(const ProviderScope(child: PradipsHomeoApp()));
}
