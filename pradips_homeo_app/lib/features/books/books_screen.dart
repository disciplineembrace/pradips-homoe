/// Books Screen - reference library
import 'package:flutter/material.dart';
import 'package:url_launcher/url_launcher.dart';
import '../../core/theme/app_colors.dart';
import '../../core/constants/api_constants.dart';

class BooksScreen extends StatelessWidget {
  const BooksScreen({super.key});

  static const List<Map<String, dynamic>> books = [
    {
      'title': 'Allen\'s Keynotes',
      'author': 'Henry C. Allen',
      'description': 'Characteristics of 335+ remedies with keynotes',
      'remedyCount': '335+',
      'icon': Icons.menu_book,
      'color': AppColors.grade3,
    },
    {
      'title': 'S.R. Phatak Materia Medica',
      'author': 'S.R. Phatak',
      'description': 'Comprehensive materia medica with 395 verified remedies',
      'remedyCount': '395',
      'icon': Icons.medical_services,
      'color': AppColors.grade2,
    },
    {
      'title': 'Soul of Remedies',
      'author': 'Rajan Sankaran',
      'description': 'Soul-level understanding of 100+ remedies',
      'remedyCount': '100+',
      'icon': Icons.self_improvement,
      'color': AppColors.grade4,
    },
    {
      'title': 'Murphy\'s Materia Medica',
      'author': 'Robin Murphy',
      'description': 'Extensive clinical materia medica with 1,000+ entries',
      'remedyCount': '1,000+',
      'icon': Icons.library_books,
      'color': AppColors.accentDark,
    },
    {
      'title': 'Farrington\'s Materia Medica',
      'author': 'E.A. Farrington',
      'description': 'Comparative materia medica with clinical focus',
      'remedyCount': '200+',
      'icon': Icons.compare_arrows,
      'color': AppColors.info,
    },
    {
      'title': 'Boger\'s Synoptic Key',
      'author': 'Cyrus Maxwell Boger',
      'description': 'Synoptic key to materia medica with times of aggravation',
      'remedyCount': '300+',
      'icon': Icons.vpn_key,
      'color': AppColors.warning,
    },
    {
      'title': 'Kent\'s Repertory',
      'author': 'James Tyler Kent',
      'description': 'Classic repertory with 3-grade system',
      'remedyCount': '600+',
      'icon': Icons.account_tree,
      'color': AppColors.primaryLight,
    },
    {
      'title': 'Synthesis Repertory',
      'author': 'Frederik Schroyens',
      'description': 'Modern comprehensive repertory with 180,386 rubrics',
      'remedyCount': '180K+',
      'icon': Icons.hub,
      'color': AppColors.primary,
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: books.length,
      itemBuilder: (context, i) {
        final b = books[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: InkWell(
            borderRadius: BorderRadius.circular(12),
            onTap: () => _openWebsite(context),
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  Container(
                    width: 56, height: 56,
                    decoration: BoxDecoration(
                      color: (b['color'] as Color).withAlpha(30),
                      borderRadius: BorderRadius.circular(12),
                    ),
                    child: Icon(
                      b['icon'] as IconData,
                      color: b['color'] as Color, size: 28,
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(
                          b['title'] as String,
                          style: Theme.of(context).textTheme.titleMedium,
                          maxLines: 1, overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 2),
                        Text(
                          b['author'] as String,
                          style: const TextStyle(
                            fontSize: 12, color: AppColors.textSecondary, fontStyle: FontStyle.italic,
                          ),
                        ),
                        const SizedBox(height: 4),
                        Text(
                          b['description'] as String,
                          style: Theme.of(context).textTheme.bodySmall,
                          maxLines: 2, overflow: TextOverflow.ellipsis,
                        ),
                        const SizedBox(height: 6),
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 2),
                          decoration: BoxDecoration(
                            color: (b['color'] as Color).withAlpha(40),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Text(
                            '${b['remedyCount']} entries',
                            style: TextStyle(
                              color: b['color'] as Color,
                              fontSize: 10, fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                  const Icon(Icons.chevron_right, color: AppColors.textHint),
                ],
              ),
            ),
          ),
        );
      },
    );
  }

  Future<void> _openWebsite(BuildContext context) async {
    final uri = Uri.parse('${ApiConstants.websiteUrl}/books');
    if (!await launchUrl(uri, mode: LaunchMode.externalApplication)) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Could not open website')),
        );
      }
    }
  }
}
