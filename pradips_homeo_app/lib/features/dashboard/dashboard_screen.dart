/// Dashboard Screen - main app shell with bottom navigation
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../../widgets/sync_status_widget.dart';
import '../auth/auth_provider.dart';
import '../materia_medica/materia_medica_screen.dart';
import '../repertory/repertory_screen.dart';
import '../search/search_screen.dart';
import '../analysis/analysis_screen.dart';
import 'app_drawer.dart';

class DashboardScreen extends StatefulWidget {
  const DashboardScreen({super.key});

  @override
  State<DashboardScreen> createState() => _DashboardScreenState();
}

class _DashboardScreenState extends State<DashboardScreen> {
  int _currentIndex = 0;

  final List<Widget> _screens = [
    const HomeScreen(),
    const MateriaMedicaScreen(),
    const RepertoryScreen(),
    const SearchScreen(),
    const AnalysisScreen(),
  ];

  final List<NavigationItem> _navItems = [
    NavigationItem(icon: Icons.home_outlined, activeIcon: Icons.home, label: 'Home'),
    NavigationItem(icon: Icons.menu_book_outlined, activeIcon: Icons.menu_book, label: 'Materia Medica'),
    NavigationItem(icon: Icons.account_tree_outlined, activeIcon: Icons.account_tree, label: 'Repertory'),
    NavigationItem(icon: Icons.search, activeIcon: Icons.search, label: 'Search'),
    NavigationItem(icon: Icons.analytics_outlined, activeIcon: Icons.analytics, label: 'Analysis'),
  ];

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      drawer: const AppDrawer(),
      appBar: AppBar(
        title: Text(_navItems[_currentIndex].label),
        actions: [
          const SyncStatusWidget(compact: true),
          const SizedBox(width: 8),
          IconButton(
            icon: const Icon(Icons.notifications_outlined),
            onPressed: () {
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('No new notifications'), behavior: SnackBarBehavior.floating),
              );
            },
          ),
        ],
      ),
      body: IndexedStack(
        index: _currentIndex,
        children: _screens,
      ),
      bottomNavigationBar: Container(
        decoration: BoxDecoration(
          boxShadow: [
            BoxShadow(
              color: AppColors.primary.withAlpha(20),
              blurRadius: 8,
              offset: const Offset(0, -2),
            ),
          ],
        ),
        child: BottomNavigationBar(
          currentIndex: _currentIndex,
          onTap: (i) => setState(() => _currentIndex = i),
          items: _navItems
              .map((item) => BottomNavigationBarItem(
                    icon: Icon(item.icon),
                    activeIcon: Icon(item.activeIcon),
                    label: item.label,
                  ))
              .toList(),
        ),
      ),
    );
  }
}

class NavigationItem {
  final IconData icon;
  final IconData activeIcon;
  final String label;

  NavigationItem({
    required this.icon,
    required this.activeIcon,
    required this.label,
  });
}

/// Home Screen - dashboard with quick access cards
class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Welcome card
          _buildWelcomeCard(context, user?.name ?? 'Doctor'),
          const SizedBox(height: 12),

          // Sync status card
          const SyncStatusWidget(),
          const SizedBox(height: 16),

          // Stats grid
          _buildStatsGrid(context),
          const SizedBox(height: 16),

          // Quick access
          _buildQuickAccess(context),
          const SizedBox(height: 16),

          // Recent / featured
          _buildFeaturedSection(context),
        ],
      ),
    );
  }

  Widget _buildWelcomeCard(BuildContext context, String name) {
    return Card(
      child: Container(
        padding: const EdgeInsets.all(20),
        decoration: BoxDecoration(
          gradient: const LinearGradient(
            colors: [AppColors.primary, AppColors.primaryLight],
            begin: Alignment.topLeft,
            end: Alignment.bottomRight,
          ),
          borderRadius: BorderRadius.circular(12),
        ),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Welcome back,',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: AppColors.textOnPrimary.withAlpha(200),
                  ),
            ),
            const SizedBox(height: 4),
            Text(
              name,
              style: Theme.of(context).textTheme.displaySmall?.copyWith(
                    color: AppColors.textOnPrimary,
                    fontSize: 22,
                  ),
            ),
            const SizedBox(height: 8),
            Text(
              'Explore ${ApiConstants.appName} - your complete homeopathic reference',
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: AppColors.textOnPrimary.withAlpha(180),
                  ),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildStatsGrid(BuildContext context) {
    final stats = [
      StatData(icon: Icons.medical_services, label: 'Remedies', value: '3,658', color: AppColors.grade3),
      StatData(icon: Icons.account_tree, label: 'Rubrics', value: '19,389', color: AppColors.grade2),
      StatData(icon: Icons.book, label: 'Sources', value: '10', color: AppColors.accentDark),
      StatData(icon: Icons.library_books, label: 'Synthesis', value: '180K', color: AppColors.grade4),
    ];

    return GridView.builder(
      shrinkWrap: true,
      physics: const NeverScrollableScrollPhysics(),
      gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
        crossAxisCount: 2,
        crossAxisSpacing: 12,
        mainAxisSpacing: 12,
        childAspectRatio: 1.4,
      ),
      itemCount: stats.length,
      itemBuilder: (context, i) => _StatCard(stat: stats[i]),
    );
  }

  Widget _buildQuickAccess(BuildContext context) {
    final items = [
      QuickItem(icon: Icons.menu_book, title: 'Materia Medica', subtitle: 'Browse remedies', route: '/materia-medica'),
      QuickItem(icon: Icons.account_tree, title: 'Repertory', subtitle: 'Browse rubrics', route: '/repertory'),
      QuickItem(icon: Icons.search, title: 'Quick Search', subtitle: 'Find remedies & rubrics', route: '/search'),
      QuickItem(icon: Icons.healing, title: 'Clinical Search', subtitle: 'Search by symptoms', route: '/clinical'),
      QuickItem(icon: Icons.analytics, title: 'Analysis Tools', subtitle: 'Case analysis', route: '/analysis'),
      QuickItem(icon: Icons.school, title: 'Organon', subtitle: 'Hahnemann\'s principles', route: '/organon'),
    ];

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Text('Quick Access', style: Theme.of(context).textTheme.headlineSmall),
        ),
        GridView.builder(
          shrinkWrap: true,
          physics: const NeverScrollableScrollPhysics(),
          gridDelegate: const SliverGridDelegateWithFixedCrossAxisCount(
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 2.0,
          ),
          itemCount: items.length,
          itemBuilder: (context, i) => _QuickAccessCard(item: items[i]),
        ),
      ],
    );
  }

  Widget _buildFeaturedSection(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 8),
          child: Text('Featured', style: Theme.of(context).textTheme.headlineSmall),
        ),
        Card(
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.accent.withAlpha(40),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.star, color: AppColors.accentDark),
            ),
            title: const Text('Murphy\'s Repertory'),
            subtitle: const Text('Complete clinical repertory with 4-grade system'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.pushNamed(context, '/repertory'),
          ),
        ),
        Card(
          child: ListTile(
            leading: Container(
              padding: const EdgeInsets.all(8),
              decoration: BoxDecoration(
                color: AppColors.grade2.withAlpha(40),
                borderRadius: BorderRadius.circular(8),
              ),
              child: const Icon(Icons.book_outlined, color: AppColors.grade2),
            ),
            title: const Text('Synthesis Repertory'),
            subtitle: const Text('180,386 rubrics with remedy relationships'),
            trailing: const Icon(Icons.chevron_right),
            onTap: () => Navigator.pushNamed(context, '/synthesis'),
          ),
        ),
      ],
    );
  }
}

class StatData {
  final IconData icon;
  final String label;
  final String value;
  final Color color;
  StatData({required this.icon, required this.label, required this.value, required this.color});
}

class _StatCard extends StatelessWidget {
  final StatData stat;
  const _StatCard({required this.stat});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          mainAxisAlignment: MainAxisAlignment.spaceBetween,
          children: [
            Row(
              mainAxisAlignment: MainAxisAlignment.spaceBetween,
              children: [
                Icon(stat.icon, color: stat.color, size: 24),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                  decoration: BoxDecoration(
                    color: stat.color.withAlpha(30),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    stat.value,
                    style: TextStyle(
                      color: stat.color, fontSize: 12, fontWeight: FontWeight.bold,
                    ),
                  ),
                ),
              ],
            ),
            const Spacer(),
            Text(stat.label, style: Theme.of(context).textTheme.titleMedium),
          ],
        ),
      ),
    );
  }
}

class QuickItem {
  final IconData icon;
  final String title;
  final String subtitle;
  final String route;
  QuickItem({required this.icon, required this.title, required this.subtitle, required this.route});
}

class _QuickAccessCard extends StatelessWidget {
  final QuickItem item;
  const _QuickAccessCard({required this.item});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: () => Navigator.pushNamed(context, item.route),
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(20),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(item.icon, color: AppColors.primary, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  mainAxisAlignment: MainAxisAlignment.center,
                  children: [
                    Text(
                      item.title,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    Text(
                      item.subtitle,
                      style: Theme.of(context).textTheme.bodySmall,
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                  ],
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
