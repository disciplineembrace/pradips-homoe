/// Search Screen - global search across remedies, rubrics, clinical content
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../../data/models/models.dart';
import 'search_provider.dart';
import '../materia_medica/remedy_detail_screen.dart';

class SearchScreen extends StatelessWidget {
  const SearchScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => SearchProvider(),
      child: const _SearchView(),
    );
  }
}

class _SearchView extends StatelessWidget {
  const _SearchView();

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
              hintText: 'Search remedies, rubrics, symptoms...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: provider.query.isNotEmpty
                  ? IconButton(
                      icon: const Icon(Icons.clear),
                      onPressed: provider.clear,
                    )
                  : null,
            ),
            onSubmitted: provider.search,
          ),
        ),

        // Mode tabs
        Row(
          children: [
            Expanded(
              child: _ModeTab(
                label: 'Global',
                icon: Icons.search,
                selected: provider.mode == SearchMode.global,
                onTap: () => provider.setMode(SearchMode.global),
              ),
            ),
            Expanded(
              child: _ModeTab(
                label: 'Clinical',
                icon: Icons.healing,
                selected: provider.mode == SearchMode.clinical,
                onTap: () => provider.setMode(SearchMode.clinical),
              ),
            ),
          ],
        ),

        // Recent searches (when no query)
        if (provider.query.isEmpty && provider.recentSearches.isNotEmpty)
          _RecentSearches(provider: provider),

        // Results
        Expanded(
          child: provider.isLoading
              ? const Center(child: CircularProgressIndicator())
              : provider.results.isEmpty && provider.query.isNotEmpty
                  ? _buildNoResults(context, provider.query)
                  : provider.results.isEmpty
                      ? _buildHint(context)
                      : _buildResults(context, provider),
        ),
      ],
    );
  }

  Widget _buildHint(BuildContext context) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.search, size: 80, color: AppColors.textHint),
            const SizedBox(height: 16),
            Text('Search Homeopathic Database', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(
              'Find remedies by name, rubrics by keyword, or search clinical symptoms. Try "arnica", "headache", or "anxiety".',
              textAlign: TextAlign.center,
              style: Theme.of(context).textTheme.bodySmall,
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildNoResults(BuildContext context, String query) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.sentiment_dissatisfied, size: 64, color: AppColors.textHint),
            const SizedBox(height: 16),
            Text('No results for "$query"', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text('Try a different keyword or check spelling.',
                style: Theme.of(context).textTheme.bodySmall),
          ],
        ),
      ),
    );
  }

  Widget _buildResults(BuildContext context, SearchProvider provider) {
    return ListView.builder(
      padding: const EdgeInsets.all(12),
      itemCount: provider.results.length,
      itemBuilder: (_, i) {
        final r = provider.results[i];
        return _SearchResultCard(result: r, onTap: () => _onResultTap(context, r));
      },
    );
  }

  void _onResultTap(BuildContext context, SearchResult r) {
    if (r.type == 'remedy') {
      // Build a Remedy object and navigate
      final remedy = Remedy(
        id: r.id,
        name: r.name,
        author: r.author ?? '',
        source: r.source,
      );
      Navigator.push(
        context,
        SlidePageRoute(page: RemedyDetailScreen(remedy: remedy)),
      );
    } else if (r.href != null) {
      AppUtils.showSnackBar(context, 'Opening ${r.type}: ${r.name}');
    }
  }
}

class _ModeTab extends StatelessWidget {
  final String label;
  final IconData icon;
  final bool selected;
  final VoidCallback onTap;
  const _ModeTab({required this.label, required this.icon, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primary.withAlpha(20) : Colors.transparent,
      child: InkWell(
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.symmetric(vertical: 10),
          child: Row(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Icon(icon, size: 18, color: selected ? AppColors.primary : AppColors.textHint),
              const SizedBox(width: 6),
              Text(
                label,
                style: TextStyle(
                  color: selected ? AppColors.primary : AppColors.textHint,
                  fontSize: 13, fontWeight: FontWeight.w600,
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

class _RecentSearches extends StatelessWidget {
  final SearchProvider provider;
  const _RecentSearches({required this.provider});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.history, size: 16, color: AppColors.textHint),
              const SizedBox(width: 6),
              Text('Recent Searches',
                  style: Theme.of(context).textTheme.labelMedium),
              const Spacer(),
              TextButton(
                onPressed: provider.clearRecent,
                child: const Text('Clear', style: TextStyle(fontSize: 12)),
              ),
            ],
          ),
          Wrap(
            spacing: 6, runSpacing: 6,
            children: provider.recentSearches.map((q) => Chip(
              label: Text(q, style: const TextStyle(fontSize: 12)),
              materialTapTargetSize: MaterialTapTargetSize.shrinkWrap,
              visualDensity: VisualDensity.compact,
              onDeleted: () => provider.removeRecent(q),
            )).toList(),
          ),
        ],
      ),
    );
  }
}

class _SearchResultCard extends StatelessWidget {
  final SearchResult result;
  final VoidCallback onTap;
  const _SearchResultCard({required this.result, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(12),
          child: Row(
            children: [
              Container(
                padding: const EdgeInsets.all(10),
                decoration: BoxDecoration(
                  color: _getTypeColor(result.type).withAlpha(30),
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(_getTypeIcon(result.type), color: _getTypeColor(result.type), size: 20),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      result.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        if (result.author != null && result.author!.isNotEmpty)
                          Flexible(
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                              decoration: BoxDecoration(
                                color: AppColors.accent.withAlpha(30),
                                borderRadius: BorderRadius.circular(4),
                              ),
                              child: Text(
                                result.author!,
                                style: const TextStyle(
                                  color: AppColors.accentDark,
                                  fontSize: 10, fontWeight: FontWeight.w600,
                                ),
                              ),
                            ),
                          ),
                        if (result.matchType != null) ...[
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              result.matchType!,
                              style: const TextStyle(fontSize: 10, color: AppColors.textHint),
                              maxLines: 1, overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                    if (result.snippet != null && result.snippet!.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
        AppUtils.cleanContent(result.snippet!),
        style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
        maxLines: 2, overflow: TextOverflow.ellipsis,
      ),
                    ],
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, size: 20, color: AppColors.textHint),
            ],
          ),
        ),
      ),
    );
  }

  Color _getTypeColor(String type) {
    switch (type) {
      case 'remedy': return AppColors.grade3;
      case 'rubric': return AppColors.grade2;
      case 'clinical': return AppColors.grade4;
      default: return AppColors.textSecondary;
    }
  }

  IconData _getTypeIcon(String type) {
    switch (type) {
      case 'remedy': return Icons.medical_services;
      case 'rubric': return Icons.account_tree;
      case 'clinical': return Icons.healing;
      default: return Icons.article;
    }
  }
}
