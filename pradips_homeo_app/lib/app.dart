/// Main App Widget - configures Material 3 theme and routing
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import 'core/theme/app_theme.dart';
import 'features/auth/auth_provider.dart';
import 'features/auth/login_screen.dart';
import 'features/dashboard/dashboard_screen.dart';
import 'features/materia_medica/materia_medica_screen.dart';
import 'features/repertory/repertory_screen.dart';
import 'features/synthesis/synthesis_screen.dart';
import 'features/clinical/clinical_screen.dart';
import 'features/analysis/analysis_screen.dart';
import 'features/organon/organon_screen.dart';
import 'features/books/books_screen.dart';
import 'features/profile/profile_screen.dart';
import 'features/question_bank/question_bank_screen.dart';
import 'features/search/search_screen.dart';

class PradipsHomeoApp extends StatelessWidget {
  const PradipsHomeoApp({super.key});

  @override
  Widget build(BuildContext context) {
    return MaterialApp(
      title: "Pradip's Homeo",
      debugShowCheckedModeBanner: false,
      theme: AppTheme.lightTheme,
      darkTheme: AppTheme.darkTheme,
      themeMode: ThemeMode.light,
      initialRoute: '/',
      onGenerateRoute: _onGenerateRoute,
    );
  }

  Route<dynamic>? _onGenerateRoute(RouteSettings settings) {
    switch (settings.name) {
      case '/':
        return MaterialPageRoute(builder: (_) => const _AuthGate());
      case '/materia-medica':
        return _wrap('Materia Medica', const MateriaMedicaScreen());
      case '/repertory':
        return _wrap('Repertory', const RepertoryScreen());
      case '/synthesis':
        return _wrap('Synthesis Repertory', const SynthesisScreen());
      case '/clinical':
        return _wrap('Clinical Search', const ClinicalScreen());
      case '/analysis':
        return _wrap('Analysis Tools', const AnalysisScreen());
      case '/organon':
        return _wrap('Organon of Medicine', const OrganonScreen());
      case '/books':
        return _wrap('Reference Books', const BooksScreen());
      case '/profile':
        return _wrap('Profile', const ProfileScreen());
      case '/question-bank':
        return _wrap('Exam Hub', const QuestionBankScreen());
      case '/search':
        return _wrap('Quick Search', const SearchScreen());
      case '/bookmarks':
        return _wrap('Bookmarks', const _ComingSoon());
      case '/history':
        return _wrap('History', const _ComingSoon());
      default:
        return _wrap('Page Not Found', const _ComingSoon());
    }
  }

  Route<dynamic> _wrap(String title, Widget child) {
    return MaterialPageRoute(
      builder: (_) => Scaffold(
        appBar: AppBar(title: Text(title)),
        body: child,
      ),
    );
  }
}

/// Auth gate - shows login or dashboard based on auth state
class _AuthGate extends StatelessWidget {
  const _AuthGate();

  @override
  Widget build(BuildContext context) {
    final auth = context.watch<AuthProvider>();
    if (auth.isLoading) {
      return Scaffold(
        body: Container(
          decoration: const BoxDecoration(
            gradient: LinearGradient(
              begin: Alignment.topCenter,
              end: Alignment.bottomCenter,
              colors: [Color(0xFF173B2D), Color(0xFF0E2A20)],
            ),
          ),
          child: const Center(
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(Icons.local_hospital, size: 80, color: Color(0xFFC8A24A)),
                SizedBox(height: 24),
                Text(
                  "Pradip's Homeo",
                  style: TextStyle(
                    color: Colors.white, fontSize: 28, fontWeight: FontWeight.bold,
                  ),
                ),
                SizedBox(height: 32),
                CircularProgressIndicator(color: Color(0xFFC8A24A)),
                SizedBox(height: 16),
                Text('Loading...', style: TextStyle(color: Colors.white70, fontSize: 14)),
              ],
            ),
          ),
        ),
      );
    }
    return auth.isAuthenticated ? const DashboardScreen() : const LoginScreen();
  }
}

class _ComingSoon extends StatelessWidget {
  const _ComingSoon();
  @override
  Widget build(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.construction, size: 64, color: Color(0xFF8A8A8A)),
          const SizedBox(height: 16),
          Text('Coming Soon', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('This feature is under development',
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}
