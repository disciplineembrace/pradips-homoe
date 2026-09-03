/// Main entry point for Pradip's Homeo Android App
///
/// Offline-First Architecture:
///   - SQLite (Drift) local database for all content
///   - SyncService pulls data from API on startup / reconnect
///   - All reads come from local DB (instant, works offline)
///   - All writes (bookmarks, notes) saved locally + queued for sync
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:flutter_dotenv/flutter_dotenv.dart';

import 'app.dart';
import 'data/services/api_client.dart';
import 'data/local/app_database.dart';
import 'features/auth/auth_provider.dart';
import 'features/sync/sync_provider.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();

  // Load environment variables
  try {
    await dotenv.load(fileName: '.env');
  } catch (_) {
    // .env file is optional - defaults are in ApiConstants
  }

  // Initialize API client and restore session
  await ApiClient().init();

  // Initialize local database (creates file if not exists, runs migrations)
  // The database is lazy-initialized on first access, but we can warm it up
  AppDatabase();

  // Initialize connectivity service
  // (Will be properly initialized by SyncProvider after login)

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider(create: (_) => AuthProvider()..init()),
        ChangeNotifierProvider(create: (_) => SyncProvider()),
      ],
      child: const PradipsHomeoApp(),
    ),
  );
}
