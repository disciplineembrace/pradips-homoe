/// Analysis Screen - case analysis with rubric input
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/models.dart';
import 'analysis_provider.dart';

class AnalysisScreen extends StatelessWidget {
  const AnalysisScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => AnalysisProvider(),
      child: const _AnalysisView(),
    );
  }
}

class _AnalysisView extends StatelessWidget {
  const _AnalysisView();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<AnalysisProvider>();
    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          // Header
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      const Icon(Icons.analytics, color: AppColors.primary),
                      const SizedBox(width: 8),
                      Text('Case Analysis', style: Theme.of(context).textTheme.headlineSmall),
                    ],
                  ),
                  const SizedBox(height: 8),
                  Text(
                    'Enter rubrics or symptoms to get ranked remedies. The analysis tool matches your input against the repertory database.',
                    style: Theme.of(context).textTheme.bodyMedium,
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Rubric input
          Card(
            child: Padding(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text('Add Rubrics / Symptoms', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 12),
                  Row(
                    children: [
                      Expanded(
                        child: TextField(
                          controller: provider.rubricController,
                          decoration: const InputDecoration(
                            hintText: 'e.g. headache, anxiety, restlessness...',
                            prefixIcon: Icon(Icons.add),
                          ),
                          onSubmitted: provider.addRubric,
                        ),
                      ),
                      const SizedBox(width: 8),
                      IconButton.filled(
                        onPressed: () => provider.addRubric(provider.rubricController.text),
                        icon: const Icon(Icons.add),
                      ),
                    ],
                  ),
                  const SizedBox(height: 12),
                  if (provider.rubrics.isNotEmpty) ...[
                    Wrap(
                      spacing: 6, runSpacing: 6,
                      children: provider.rubrics.asMap().entries.map((e) {
                        return Chip(
                          label: Text(e.value, style: const TextStyle(fontSize: 12)),
                          onDeleted: () => provider.removeRubric(e.key),
                          materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
                        );
                      }).toList(),
                    ),
                    const SizedBox(height: 12),
                  ],
                  Row(
                    children: [
                      Expanded(
                        child: ElevatedButton.icon(
                          onPressed: provider.rubrics.isEmpty || provider.isLoading
                              ? null
                              : provider.analyze,
                          icon: provider.isLoading
                              ? const SizedBox(
                                  width: 16, height: 16,
                                  child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                                )
                              : const Icon(Icons.insights),
                          label: Text(provider.isLoading ? 'Analyzing...' : 'Analyze'),
                        ),
                      ),
                      const SizedBox(width: 8),
                      OutlinedButton.icon(
                        onPressed: provider.rubrics.isEmpty ? null : provider.clear,
                        icon: const Icon(Icons.clear_all),
                        label: const Text('Clear'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const SizedBox(height: 16),

          // Results
          if (provider.hasResults) ...[
            Row(
              children: [
                Container(width: 4, height: 22, decoration: BoxDecoration(color: AppColors.accent, borderRadius: BorderRadius.circular(2))),
                const SizedBox(width: 10),
                Text('Top Remedies', style: Theme.of(context).textTheme.headlineSmall),
                const Spacer(),
                Text('${provider.analysis!.totalRubrics} rubrics analyzed',
                    style: Theme.of(context).textTheme.bodySmall),
              ],
            ),
            const SizedBox(height: 12),
            ...provider.analysis!.rankedRemedies.asMap().entries.map((e) {
              return _RemedyRankCard(
                rank: e.key + 1,
                result: e.value,
                maxScore: provider.maxScore,
              );
            }),

            // Explanation
            if (provider.analysis!.explanation.isNotEmpty) ...[
              const SizedBox(height: 16),
              Card(
                color: AppColors.surfaceVariant.withAlpha(80),
                child: Padding(
                  padding: const EdgeInsets.all(14),
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Row(
                        children: [
                          const Icon(Icons.info_outline, size: 18, color: AppColors.accentDark),
                          const SizedBox(width: 6),
                          Text('Analysis Notes', style: Theme.of(context).textTheme.titleSmall),
                        ],
                      ),
                      const SizedBox(height: 8),
                      Text(provider.analysis!.explanation,
                          style: Theme.of(context).textTheme.bodySmall),
                    ],
                  ),
                ),
              ),
            ],

            // Disclaimer
            const SizedBox(height: 12),
            Container(
              padding: const EdgeInsets.all(12),
              decoration: BoxDecoration(
                color: AppColors.warning.withAlpha(30),
                borderRadius: BorderRadius.circular(8),
                border: Border.all(color: AppColors.warning.withAlpha(120), width: 0.5),
              ),
              child: Row(
                children: [
                  const Icon(Icons.warning_amber_rounded, size: 18, color: AppColors.warning),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      provider.analysis!.disclaimer.isNotEmpty
                          ? provider.analysis!.disclaimer
                          : 'For educational and clinical assistance purposes only. Final remedy selection should be based on complete case analysis by a qualified practitioner.',
                      style: Theme.of(context).textTheme.bodySmall?.copyWith(
                            color: AppColors.warning, fontSize: 11,
                          ),
                    ),
                  ),
                ],
              ),
            ),
          ] else if (provider.errorMessage != null) ...[
            const SizedBox(height: 24),
            Center(
              child: Column(
                children: [
                  const Icon(Icons.error_outline, size: 48, color: AppColors.error),
                  const SizedBox(height: 12),
                  Text('Analysis failed', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text(provider.errorMessage!,
                      textAlign: TextAlign.center,
                      style: Theme.of(context).textTheme.bodySmall),
                  const SizedBox(height: 16),
                  ElevatedButton(onPressed: provider.analyze, child: const Text('Retry')),
                ],
              ),
            ),
          ] else ...[
            const SizedBox(height: 32),
            Center(
              child: Column(
                children: [
                  const Icon(Icons.analytics_outlined, size: 64, color: AppColors.textHint),
                  const SizedBox(height: 16),
                  Text('No Analysis Yet', style: Theme.of(context).textTheme.titleMedium),
                  const SizedBox(height: 8),
                  Text('Add rubrics above and tap Analyze to get started.',
                      style: Theme.of(context).textTheme.bodySmall),
                ],
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _RemedyRankCard extends StatelessWidget {
  final int rank;
  final AnalysisResult result;
  final int maxScore;
  const _RemedyRankCard({required this.rank, required this.result, required this.maxScore});

  @override
  Widget build(BuildContext context) {
    final percentage = maxScore > 0 ? (result.score / maxScore * 100).clamp(0, 100) : 0.0;
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            // Rank badge
            Container(
              width: 36, height: 36,
              decoration: BoxDecoration(
                color: rank == 1
                    ? AppColors.accent
                    : rank <= 3
                        ? AppColors.primary
                        : AppColors.textHint,
                borderRadius: BorderRadius.circular(10),
              ),
              child: Center(
                child: Text(
                  '$rank',
                  style: const TextStyle(
                    color: Colors.white, fontWeight: FontWeight.bold, fontSize: 16,
                  ),
                ),
              ),
            ),
            const SizedBox(width: 12),
            // Name & stats
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(
                    result.remedy,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15),
                  ),
                  const SizedBox(height: 4),
                  Row(
                    children: [
                      Text(
                        'Score: ${result.score}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary, fontWeight: FontWeight.w600),
                      ),
                      const SizedBox(width: 12),
                      Text(
                        'Matched: ${result.rubricsMatched}',
                        style: const TextStyle(fontSize: 11, color: AppColors.textSecondary),
                      ),
                    ],
                  ),
                  const SizedBox(height: 6),
                  // Progress bar
                  ClipRRect(
                    borderRadius: BorderRadius.circular(4),
                    child: LinearProgressIndicator(
                      value: percentage / 100,
                      minHeight: 6,
                      backgroundColor: AppColors.surfaceVariant,
                      valueColor: AlwaysStoppedAnimation<Color>(
                        rank == 1 ? AppColors.accent : AppColors.primary,
                      ),
                    ),
                  ),
                ],
              ),
            ),
            const SizedBox(width: 8),
            Text(
              '${percentage.toStringAsFixed(0)}%',
              style: TextStyle(
                color: rank == 1 ? AppColors.accentDark : AppColors.primary,
                fontWeight: FontWeight.bold, fontSize: 14,
              ),
            ),
          ],
        ),
      ),
    );
  }
}
