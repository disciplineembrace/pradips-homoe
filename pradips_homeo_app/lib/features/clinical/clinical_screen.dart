/// Clinical Search Screen - search by symptoms
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../search/search_provider.dart';

class ClinicalScreen extends StatelessWidget {
  const ClinicalScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SearchProvider()..setMode(SearchMode.clinical),
      child: const _ClinicalView(),
    );
  }
}

class _ClinicalView extends StatelessWidget {
  const _ClinicalView();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<SearchProvider>();
    return Column(
      children: [
        // Search bar
        Padding(
          padding: const EdgeInsets.all(12),
          child: TextField(
            controller: provider.searchController,
            autofocus: true,
            decoration: InputDecoration(
              hintText: 'Search clinical symptoms...',
              prefixIcon: const Icon(Icons.healing),
              suffixIcon: provider.query.isNotEmpty
                  ? IconButton(icon: const Icon(Icons.clear), onPressed: provider.clear)
                  : null,
            ),
            onSubmitted: provider.search,
          ),
        ),

        // Common symptoms chips
        if (provider.query.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 12),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Common Symptoms', style: Theme.of(context).textTheme.titleSmall),
                const SizedBox(height: 8),
                Wrap(
                  spacing: 6, runSpacing: 6,
                  children: [
                    'Headache', 'Fever', 'Anxiety', 'Insomnia', 'Cough',
                    'Sore throat', 'Indigestion', 'Back pain', 'Joint pain',
                    'Nausea', 'Dizziness', 'Fatigue', 'Constipation', 'Diarrhea',
                  ].map((s) => ActionChip(
                    label: Text(s, style: const TextStyle(fontSize: 12)),
                    onPressed: () {
                      provider.searchController.text = s;
                      provider.search(s);
                    },
                  )).toList(),
                ),
              ],
            ),
          ),

        Expanded(
          child: provider.isLoading
              ? const Center(child: CircularProgressIndicator())
              : provider.results.isEmpty
                  ? provider.query.isEmpty
                      ? const SizedBox()
                      : Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.sentiment_dissatisfied, size: 64, color: AppColors.textHint),
                              const SizedBox(height: 16),
                              Text('No clinical matches',
                                  style: Theme.of(context).textTheme.titleMedium),
                            ],
                          ),
                        )
                  : ListView.builder(
                      padding: const EdgeInsets.all(12),
                      itemCount: provider.results.length,
                      itemBuilder: (_, i) {
                        final r = provider.results[i];
                        return Card(
                          margin: const EdgeInsets.only(bottom: 8),
                          child: Padding(
                            padding: const EdgeInsets.all(12),
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Row(
                                  children: [
                                    Container(
                                      padding: const EdgeInsets.all(8),
                                      decoration: BoxDecoration(
                                        color: AppColors.grade4.withAlpha(30),
                                        borderRadius: BorderRadius.circular(8),
                                      ),
                                      child: const Icon(Icons.healing, color: AppColors.grade4, size: 18),
                                    ),
                                    const SizedBox(width: 8),
                                    Expanded(
                                      child: Text(
                                        r.name,
                                        style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14),
                                        maxLines: 1, overflow: TextOverflow.ellipsis,
                                      ),
                                    ),
                                  ],
                                ),
                                if (r.snippet != null && r.snippet!.isNotEmpty) ...[
                                  const SizedBox(height: 8),
                                  Container(
                                    padding: const EdgeInsets.all(8),
                                    decoration: BoxDecoration(
                                      color: AppColors.surfaceVariant.withAlpha(80),
                                      borderRadius: BorderRadius.circular(6),
                                    ),
                                    child: Text(
                                      AppUtils.cleanContent(r.snippet!),
                                      style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 12),
                                      maxLines: 4, overflow: TextOverflow.ellipsis,
                                    ),
                                  ),
                                ],
                                if (r.source != null) ...[
                                  const SizedBox(height: 6),
                                  Row(
                                    children: [
                                      const Icon(Icons.source_outlined, size: 12, color: AppColors.textHint),
                                      const SizedBox(width: 4),
                                      Expanded(
                                        child: Text(
                                          r.source!,
                                          style: const TextStyle(fontSize: 10, color: AppColors.textHint, fontStyle: FontStyle.italic),
                                          maxLines: 1, overflow: TextOverflow.ellipsis,
                                        ),
                                      ),
                                    ],
                                  ),
                                ],
                              ],
                            ),
                          ),
                        );
                      },
                    ),
        ),
      ],
    );
  }
}
