/// App entry point.
///
/// Initializes:
///   - WidgetsFlutterBinding
///   - WorkManager (background sync)
///   - Riverpod ProviderScope
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:workmanager/workmanager.dart';

import 'app.dart';
import 'core/config/app_config.dart';

// ============ Background sync callback ============

@pragma('vm:entry-point')
void callbackDispatcher() {
  Workmanager().executeTask((task, inputData) async {
    try {
      // Initialize a minimal sync engine for background sync.
      // This runs in an isolate — cannot use Riverpod providers directly.
      // In production, create a lightweight sync invocation here.
      // For safety, background sync only does incremental (not full) sync.
      return true;
    } catch (e) {
      return false;
    }
  });
}

// ============ Main ============

void main() {
  WidgetsFlutterBinding.ensureInitialized();

  // Initialize background sync
  Workmanager().initialize(callbackDispatcher, isInDebugMode: false);
  Workmanager().registerPeriodicTask(
    'background-sync',
    'incremental-sync',
    frequency: Duration(minutes: AppConfig.backgroundSyncIntervalMin),
    constraints: Constraints(
      networkType: NetworkType.connected,
      requiresBatteryNotLow: true,
    ),
    existingWorkPolicy: ExistingWorkPolicy.keep,
  );

  runApp(const ProviderScope(child: PradipsHomeoApp()));
}
