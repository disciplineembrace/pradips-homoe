/// Profile Screen - user account info and settings
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/api_constants.dart';
import '../auth/auth_provider.dart';

class ProfileScreen extends StatelessWidget {
  const ProfileScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final user = context.watch<AuthProvider>().user;
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          // Profile header
          Card(
            child: Padding(
              padding: const EdgeInsets.all(20),
              child: Column(
                children: [
                  CircleAvatar(
                    radius: 48,
                    backgroundColor: AppColors.primary,
                    child: Text(
                      _getInitials(user?.name ?? 'U'),
                      style: const TextStyle(
                        color: AppColors.textOnPrimary,
                        fontSize: 32, fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  const SizedBox(height: 16),
                  Text(
                    user?.name ?? 'User',
                    style: Theme.of(context).textTheme.headlineSmall,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    user?.email ?? '',
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          color: AppColors.textSecondary,
                        ),
                  ),
                  const SizedBox(height: 12),
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 6),
                    decoration: BoxDecoration(
                      color: user?.isAdmin == true
                          ? AppColors.accent
                          : AppColors.primaryLight,
                      borderRadius: BorderRadius.circular(16),
                    ),
                    child: Text(
                      (user?.role ?? 'user').toUpperCase(),
                      style: const TextStyle(
                        color: AppColors.textOnPrimary,
                        fontSize: 12, fontWeight: FontWeight.bold,
                        letterSpacing: 0.5,
                      ),
                    ),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Account section
          _SectionTitle(title: 'Account'),
          _SettingTile(
            icon: Icons.person_outline,
            title: 'Personal Information',
            subtitle: 'Update name and email',
            onTap: () => _showComingSoon(context),
          ),
          _SettingTile(
            icon: Icons.lock_outline,
            title: 'Change PIN',
            subtitle: 'Update your 6-digit PIN',
            onTap: () => _showComingSoon(context),
          ),
          _SettingTile(
            icon: Icons.bookmark_outline,
            title: 'My Bookmarks',
            subtitle: 'View saved remedies and rubrics',
            onTap: () => _showComingSoon(context),
          ),
          _SettingTile(
            icon: Icons.history,
            title: 'Reading History',
            subtitle: 'Recently viewed items',
            onTap: () => _showComingSoon(context),
          ),

          const SizedBox(height: 16),

          // App info section
          _SectionTitle(title: 'About'),
          _SettingTile(
            icon: Icons.info_outline,
            title: 'About Pradip\'s Homeo',
            subtitle: 'App version ${ApiConstants.appVersion}',
            onTap: () => _showAbout(context),
          ),
          _SettingTile(
            icon: Icons.public,
            title: 'Visit Website',
            subtitle: ApiConstants.websiteUrl,
            onTap: () => _launchUrl(context, ApiConstants.websiteUrl),
          ),
          _SettingTile(
            icon: Icons.code,
            title: 'Open Source',
            subtitle: 'View on GitHub',
            onTap: () => _launchUrl(context, 'https://github.com/disciplineembrace/pradips-homoe'),
          ),
          _SettingTile(
            icon: Icons.privacy_tip_outlined,
            title: 'Privacy Policy',
            subtitle: 'How we handle your data',
            onTap: () => _showComingSoon(context),
          ),

          const SizedBox(height: 16),

          // Logout
          _SettingTile(
            icon: Icons.logout,
            title: 'Logout',
            iconColor: AppColors.error,
            titleColor: AppColors.error,
            onTap: () => _logout(context),
          ),

          const SizedBox(height: 24),

          // Footer
          Text(
            '${ApiConstants.appName} v${ApiConstants.appVersion}',
            style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textHint),
          ),
          const SizedBox(height: 4),
          Text(
            'Built with Flutter & Material 3',
            style: TextStyle(fontSize: 11, color: AppColors.textHint.withAlpha(180)),
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

  void _showComingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Feature coming soon!'), behavior: SnackBarBehavior.floating),
    );
  }

  void _showAbout(BuildContext context) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Row(
          children: [
            const Icon(Icons.local_hospital, color: AppColors.primary),
            const SizedBox(width: 8),
            Text(ApiConstants.appName),
          ],
        ),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text('Version: ${ApiConstants.appVersion}+${ApiConstants.appBuildNumber}',
                style: const TextStyle(fontWeight: FontWeight.w600)),
            const SizedBox(height: 12),
            const Text(
              'Pradip\'s Homeo is a comprehensive homeopathic reference application featuring Materia Medica, Repertory, Synthesis, Clinical Search, Analysis Tools, and more.',
            ),
            const SizedBox(height: 12),
            const Text(
              'Backend: Next.js on Vercel\nDatabase: Neon PostgreSQL\nUser Data: Supabase\nMobile: Flutter + Material 3',
              style: TextStyle(fontSize: 12, color: AppColors.textSecondary, height: 1.5),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Close')),
        ],
      ),
    );
  }

  Future<void> _launchUrl(BuildContext context, String url) async {
    final uri = Uri.parse(url);
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Could not open $url')),
        );
      }
    }
  }

  Future<void> _logout(BuildContext context) async {
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

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(8, 16, 8, 8),
      child: Row(
        children: [
          Container(width: 3, height: 14, decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Text(
            title.toUpperCase(),
            style: const TextStyle(
              color: AppColors.accentDark,
              fontSize: 11, fontWeight: FontWeight.w700,
              letterSpacing: 1.0,
            ),
          ),
        ],
      ),
    );
  }
}

class _SettingTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final String? subtitle;
  final VoidCallback onTap;
  final Color? iconColor;
  final Color? titleColor;
  const _SettingTile({
    required this.icon, required this.title, this.subtitle,
    required this.onTap, this.iconColor, this.titleColor,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 6),
      child: ListTile(
        leading: Icon(icon, color: iconColor ?? AppColors.primary, size: 22),
        title: Text(
          title,
          style: TextStyle(
            fontSize: 14, fontWeight: FontWeight.w500,
            color: titleColor ?? AppColors.textPrimary,
          ),
        ),
        subtitle: subtitle != null
            ? Text(subtitle!, style: const TextStyle(fontSize: 11, color: AppColors.textHint))
            : null,
        trailing: const Icon(Icons.chevron_right, size: 18, color: AppColors.textHint),
        onTap: onTap,
        contentPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      ),
    );
  }
}
