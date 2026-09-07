/// App Drawer - navigation drawer with all sections
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../auth/auth_provider.dart';

class AppDrawer extends StatelessWidget {
  const AppDrawer({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;

    return Drawer(
      child: Column(
        children: [
          // Header
          Container(
            width: double.infinity,
            padding: EdgeInsets.only(
              top: MediaQuery.of(context).padding.top + 16,
              bottom: 16, left: 20, right: 20,
            ),
            decoration: const BoxDecoration(
              gradient: LinearGradient(
                colors: [AppColors.primary, AppColors.primaryLight],
                begin: Alignment.topLeft,
                end: Alignment.bottomRight,
              ),
            ),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                CircleAvatar(
                  radius: 28,
                  backgroundColor: AppColors.accent,
                  child: Text(
                    _getInitials(user?.name ?? 'U'),
                    style: const TextStyle(
                      color: AppColors.primary,
                      fontWeight: FontWeight.bold,
                      fontSize: 22,
                    ),
                  ),
                ),
                const SizedBox(height: 12),
                Text(
                  user?.name ?? 'User',
                  style: const TextStyle(
                    color: AppColors.textOnPrimary,
                    fontSize: 18, fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 2),
                Text(
                  user?.email ?? '',
                  style: TextStyle(
                    color: AppColors.textOnPrimary.withAlpha(180),
                    fontSize: 13,
                  ),
                ),
                const SizedBox(height: 6),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 3),
                  decoration: BoxDecoration(
                    color: AppColors.accent.withAlpha(80),
                    borderRadius: BorderRadius.circular(12),
                  ),
                  child: Text(
                    (user?.role ?? 'user').toUpperCase(),
                    style: const TextStyle(
                      color: AppColors.textOnPrimary,
                      fontSize: 10, fontWeight: FontWeight.w600,
                      letterSpacing: 0.5,
                    ),
                  ),
                ),
              ],
            ),
          ),

          // Menu items
          Expanded(
            child: ListView(
              padding: EdgeInsets.zero,
              children: [
                _DrawerSection(title: 'REFERENCE'),
                _DrawerItem(
                  icon: Icons.menu_book_outlined,
                  title: 'Materia Medica',
                  subtitle: '3,658 remedies',
                  onTap: () => _navigate(context, '/materia-medica'),
                ),
                _DrawerItem(
                  icon: Icons.account_tree_outlined,
                  title: 'Repertory',
                  subtitle: '19,389 rubrics',
                  onTap: () => _navigate(context, '/repertory'),
                ),
                _DrawerItem(
                  icon: Icons.library_books_outlined,
                  title: 'Synthesis Repertory',
                  subtitle: '180,386 rubrics',
                  onTap: () => _navigate(context, '/synthesis'),
                ),
                _DrawerItem(
                  icon: Icons.school_outlined,
                  title: 'Organon',
                  subtitle: 'Hahnemann\'s principles',
                  onTap: () => _navigate(context, '/organon'),
                ),
                _DrawerItem(
                  icon: Icons.book_outlined,
                  title: 'Books',
                  subtitle: 'Reference library',
                  onTap: () => _navigate(context, '/books'),
                ),

                _DrawerSection(title: 'TOOLS'),
                _DrawerItem(
                  icon: Icons.search,
                  title: 'Quick Search',
                  subtitle: 'Find remedies & rubrics',
                  onTap: () => _navigate(context, '/search'),
                ),
                _DrawerItem(
                  icon: Icons.healing,
                  title: 'Clinical Search',
                  subtitle: 'Search by symptoms',
                  onTap: () => _navigate(context, '/clinical'),
                ),
                _DrawerItem(
                  icon: Icons.analytics_outlined,
                  title: 'Analysis Tools',
                  subtitle: 'Case analysis & rubrics',
                  onTap: () => _navigate(context, '/analysis'),
                ),
                _DrawerItem(
                  icon: Icons.quiz_outlined,
                  title: 'Exam Hub',
                  subtitle: 'Question bank',
                  onTap: () => _navigate(context, '/question-bank'),
                ),

                _DrawerSection(title: 'ACCOUNT'),
                _DrawerItem(
                  icon: Icons.person_outline,
                  title: 'Profile',
                  subtitle: 'Account settings',
                  onTap: () => _navigate(context, '/profile'),
                ),
                _DrawerItem(
                  icon: Icons.bookmark_outline,
                  title: 'Bookmarks',
                  subtitle: 'Saved items',
                  onTap: () => _navigate(context, '/bookmarks'),
                ),
                _DrawerItem(
                  icon: Icons.history,
                  title: 'History',
                  subtitle: 'Recently viewed',
                  onTap: () => _navigate(context, '/history'),
                ),
                _DrawerItem(
                  icon: Icons.public,
                  title: 'Visit Website',
                  subtitle: 'pradips-homoe.vercel.app',
                  onTap: () => _launchWebsite(context),
                ),

                const Divider(),
                _DrawerItem(
                  icon: Icons.logout,
                  title: 'Logout',
                  iconColor: AppColors.error,
                  onTap: () => _logout(context),
                ),
                const SizedBox(height: 16),

                // Version info
                Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 16),
                  child: Text(
                    '${ApiConstants.appName} v${ApiConstants.appVersion}',
                    style: Theme.of(context).textTheme.bodySmall?.copyWith(
                          color: AppColors.textHint, fontSize: 11,
                        ),
                    textAlign: TextAlign.center,
                  ),
                ),
                const SizedBox(height: 8),
              ],
            ),
          ),
        ],
      ),
    );
  }

  String _getInitials(String name) {
    if (name.isEmpty) return '?';
    final parts = name.split(' ').where((p) => p.isNotEmpty).toList();
    if (parts.isEmpty) return '?';
    if (parts.length == 1) return parts[0][0].toUpperCase();
    return '${parts[0][0]}${parts[1][0]}'.toUpperCase();
  }

  void _navigate(BuildContext context, String route) {
    Navigator.pop(context); // Close drawer
    if (ModalRoute.of(context)?.settings.name != route) {
      Navigator.pushNamed(context, route);
    }
  }

  Future<void> _launchWebsite(BuildContext context) async {
    Navigator.pop(context);
    final uri = Uri.parse(ApiConstants.websiteUrl);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open website')),
        );
      }
    }
  }

  Future<void> _logout(BuildContext context) async {
    Navigator.pop(context);
    final confirmed = await showDialog<bool>(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Logout'),
        content: const Text('Are you sure you want to logout?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx, false), child: const Text('Cancel')),
          ElevatedButton(
            onPressed: () => Navigator.pop(ctx, true),
            style: ElevatedButton.styleFrom(backgroundColor: AppColors.error),
            child: const Text('Logout'),
          ),
        ],
      ),
    );
    if (confirmed == true) {
      await context.read<AuthProvider>().logout();
    }
  }
}

class _DrawerSection extends StatelessWidget {
  final String title;
  const _DrawerSection({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(16, 16, 16, 4),
      child: Text(
        title,
        style: TextStyle(
          color: AppColors.accentDark,
          fontSize: 11,
          fontWeight: FontWeight.w700,
          letterSpacing: 1.0,
        ),
      ),
    );
  }
}

class _DrawerItem extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? iconColor;
  const _DrawerItem({
    required this.icon, required this.title, this.subtitle, required this.onTap, this.iconColor,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: iconColor ?? AppColors.primary, size: 22),
      title: Text(title, style: const TextStyle(fontSize: 14, fontWeight: FontWeight.w500)),
      subtitle: subtitle != null
          ? Text(subtitle!, style: TextStyle(fontSize: 11, color: AppColors.textHint))
          : null,
      trailing: const Icon(Icons.chevron_right, size: 18, color: AppColors.textHint),
      onTap: onTap,
      dense: true,
      contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 0),
    );
  }
}
