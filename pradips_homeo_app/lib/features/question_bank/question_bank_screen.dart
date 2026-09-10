/// Question Bank Screen - exam preparation
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class QuestionBankScreen extends StatelessWidget {
  const QuestionBankScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Card(
            child: Container(
              padding: const EdgeInsets.all(20),
              decoration: BoxDecoration(
                gradient: const LinearGradient(
                  colors: [AppColors.primary, AppColors.primaryLight],
                  begin: Alignment.topLeft, end: Alignment.bottomRight,
                ),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  const Icon(Icons.quiz, color: AppColors.textOnPrimary, size: 32),
                  const SizedBox(height: 8),
                  Text(
                    'Exam Hub',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(color: AppColors.textOnPrimary),
                  ),
                  const SizedBox(height: 4),
                  Text(
                    'Practice with curated question bank and track your progress',
                    style: TextStyle(color: AppColors.textOnPrimary.withAlpha(180), fontSize: 13),
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Quiz mode cards
          _SectionTitle(title: 'Practice Modes'),
          GridView.count(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            crossAxisCount: 2,
            crossAxisSpacing: 10,
            mainAxisSpacing: 10,
            childAspectRatio: 1.2,
            children: [
              _ModeCard(
                icon: Icons.timer,
                title: 'Timed Quiz',
                subtitle: 'Race against the clock',
                color: AppColors.grade4,
                onTap: () => _comingSoon(context),
              ),
              _ModeCard(
                icon: Icons.shuffle,
                title: 'Random Quiz',
                subtitle: '10 random questions',
                color: AppColors.grade3,
                onTap: () => _comingSoon(context),
              ),
              _ModeCard(
                icon: Icons.trending_up,
                title: 'Adaptive Quiz',
                subtitle: 'Adjusts to your level',
                color: AppColors.grade2,
                onTap: () => _comingSoon(context),
              ),
              _ModeCard(
                icon: Icons.bookmark_outline,
                title: 'Bookmarked Qs',
                subtitle: 'Review saved questions',
                color: AppColors.accentDark,
                onTap: () => _comingSoon(context),
              ),
            ],
          ),
          const SizedBox(height: 16),

          // Stats
          _SectionTitle(title: 'Your Progress'),
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                children: [
                  _StatRow(label: 'Total Questions', value: '0', icon: Icons.quiz_outlined),
                  _StatRow(label: 'Correct Answers', value: '0%', icon: Icons.check_circle_outline),
                  _StatRow(label: 'Bookmarked', value: '0', icon: Icons.bookmark_border),
                  _StatRow(label: 'Review Later', value: '0', icon: Icons.access_time),
                ],
              ),
            ),
          ),
        ],
      ),
    );
  }

  void _comingSoon(BuildContext context) {
    ScaffoldMessenger.of(context).showSnackBar(
      const SnackBar(content: Text('Quiz feature coming soon!'), behavior: SnackBarBehavior.floating),
    );
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 4, 8),
      child: Row(
        children: [
          Container(width: 3, height: 16, decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(2))),
          const SizedBox(width: 8),
          Text(title, style: Theme.of(context).textTheme.titleSmall),
        ],
      ),
    );
  }
}

class _ModeCard extends StatelessWidget {
  final IconData icon;
  final String title;
  final String subtitle;
  final Color color;
  final VoidCallback onTap;
  const _ModeCard({
    required this.icon, required this.title, required this.subtitle,
    required this.color, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: color.withAlpha(30),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: color, size: 24),
              ),
              const SizedBox(height: 8),
              Text(
                title,
                style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 13),
                textAlign: TextAlign.center,
                maxLines: 1, overflow: TextOverflow.ellipsis,
              ),
              const SizedBox(height: 2),
              Text(
                subtitle,
                style: const TextStyle(fontSize: 10, color: AppColors.textHint),
                textAlign: TextAlign.center,
                maxLines: 1, overflow: TextOverflow.ellipsis,
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _StatRow extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _StatRow({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        children: [
          Icon(icon, size: 20, color: AppColors.primary),
          const SizedBox(width: 12),
          Expanded(
            child: Text(label, style: Theme.of(context).textTheme.bodyMedium),
          ),
          Text(
            value,
            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                  color: AppColors.primary, fontWeight: FontWeight.bold,
                ),
          ),
        ],
      ),
    );
  }
}
