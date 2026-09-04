/// Root MaterialApp with routing and auth gate.
/// All routes registered — no placeholder route comments.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import 'features/auth/login_screen.dart';
import 'features/bookmarks/bookmarks_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/materia_medica/materia_medica_screen.dart';
import 'features/repertory/repertory_screen.dart';
import 'features/search/quick_search_screen.dart';
import 'features/settings/settings_screen.dart';
import 'providers.dart';

class PradipsHomeoApp extends ConsumerWidget {
  const PradipsHomeoApp({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    return MaterialApp(
      title: "Pradip's Homeo",
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        useMaterial3: true,
        colorScheme: ColorScheme.fromSeed(
          seedColor: const Color(0xFF173B2D),
          primary: const Color(0xFF173B2D),
          secondary: const Color(0xFFC8A24A),
          surface: const Color(0xFFF5EFE0),
        ),
        fontFamily: 'Serif',
        appBarTheme: const AppBarTheme(
          backgroundColor: Color(0xFF173B2D),
          foregroundColor: Color(0xFFF5EFE0),
        ),
      ),
      home: const AuthGate(),
      routes: {
        '/login': (context) => const LoginScreen(),
        '/dashboard': (context) => const DashboardScreen(),
        '/materia-medica': (context) => const MateriaMedicaScreen(),
        '/repertory': (context) => const RepertoryScreen(),
        '/quick-search': (context) => const QuickSearchScreen(),
        '/bookmarks': (context) => const BookmarksScreen(),
        '/settings': (context) => const SettingsScreen(),
      },
    );
  }
}

/// Auth gate — shows login or dashboard based on auth state.
class AuthGate extends ConsumerStatefulWidget {
  const AuthGate({super.key});

  @override
  ConsumerState<AuthGate> createState() => _AuthGateState();
}

class _AuthGateState extends ConsumerState<AuthGate> {
  bool _checking = true;

  @override
  void initState() {
    super.initState();
    _checkSession();
  }

  Future<void> _checkSession() async {
    final repo = ref.read(authRepositoryProvider);
    await repo.restoreSession();
    if (mounted) {
      setState(() => _checking = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    if (_checking) {
      return const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      );
    }

    final repo = ref.watch(authRepositoryProvider);
    if (repo.isAuthenticated) {
      return const DashboardScreen();
    }
    return const LoginScreen();
  }
}
