/// Dashboard screen — main hub with navigation to all sections.
///
/// Mirrors the existing website menu structure.
/// All sections work online and offline (after initial sync).
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/repositories/auth_repository.dart';
import '../../providers.dart';
import '../../widgets/offline_indicator.dart';
import '../../widgets/sync_progress.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final repo = ref.watch(authRepositoryProvider);
    final user = repo.currentUser;

    return Scaffold(
      appBar: AppBar(
        title: const Text("Pradip's Homeo"),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            tooltip: 'Sync now',
            onPressed: () {
              ref.read(syncEngineProvider).sync();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Sync started...'), duration: Duration(seconds: 2)),
              );
            },
          ),
          PopupMenuButton<String>(
            onSelected: (value) async {
              if (value == 'logout') {
                await repo.logout();
                if (context.mounted) {
                  Navigator.pushReplacementNamed(context, '/login');
                }
              }
            },
            itemBuilder: (context) => [
              const PopupMenuItem(value: 'logout', child: Text('Logout')),
            ],
          ),
        ],
      ),
      body: Column(
        children: [
          const OfflineIndicator(),
          const SyncProgressBar(),
          Expanded(
            child: ListView(
              padding: const EdgeInsets.all(16),
              children: [
                // Welcome
                if (user != null) ...[
                  Text(
                    'Welcome, ${user.name}',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 8),
                ],
                // Sections grid — mirrors website menu
                const SizedBox(height: 16),
                _SectionGrid(),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _SectionGrid extends StatelessWidget {
  const _SectionGrid();

  static const _sections = [
    _Section(icon: Icons.book, label: 'Materia Medica', route: '/materia-medica'),
    _Section(icon: Icons.library_books, label: 'Repertory', route: '/repertory'),
    _Section(icon: Icons.search, label: 'Quick Clinical Search', route: '/quick-search'),
    _Section(icon: Icons.bookmark, label: 'Bookmarks', route: '/bookmarks'),
    _Section(icon: Icons.settings, label: 'Settings', route: '/settings'),
  ];

  @override
  Widget build(BuildContext context) {
    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 3,
        childAspectRatio: 1,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
      ),
      itemCount: _sections.length,
      itemBuilder: (context, index) {
        final section = _sections[index];
        return Card(
          child: InkWell(
            onTap: () {
              Navigator.pushNamed(context, section.route);
            },
            child: Column(
              mainAxisAlignment: MainAxisAlignment.center,
              children: [
                Icon(section.icon, size: 32,
                    color: Theme.of(context).colorScheme.primary),
                const SizedBox(height: 8),
                Text(
                  section.label,
                  textAlign: TextAlign.center,
                  style: const TextStyle(fontSize: 11),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}

class _Section {
  final IconData icon;
  final String label;
  final String route;

  const _Section({
    required this.icon,
    required this.label,
    required this.route,
  });
}
