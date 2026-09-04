/// Materia Medica Screen - browse homeopathic remedies
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../../data/models/models.dart';
import 'remedy_detail_screen.dart';
import 'materia_medica_provider.dart';

class MateriaMedicaScreen extends StatelessWidget {
  const MateriaMedicaScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => MateriaMedicaProvider()..init(),
      child: const _MateriaMedicaView(),
    );
  }
}

class _MateriaMedicaView extends StatelessWidget {
  const _MateriaMedicaView();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<MateriaMedicaProvider>();
    return Column(
      children: [
        // Filter bar
        _FilterBar(provider: provider),
        // List
        Expanded(
          child: provider.isLoading && provider.remedies.isEmpty
              ? _buildLoading()
              : provider.errorMessage != null
                  ? _buildError(context, provider)
                  : provider.remedies.isEmpty
                      ? _buildEmpty(context)
                      : _buildList(context, provider),
        ),
      ],
    );
  }

  Widget _buildLoading() {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: 8,
      itemBuilder: (_, __) => const _RemedyCardSkeleton(),
    );
  }

  Widget _buildError(BuildContext context, MateriaMedicaProvider provider) {
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          mainAxisAlignment: MainAxisAlignment.center,
          children: [
            const Icon(Icons.error_outline, size: 64, color: AppColors.error),
            const SizedBox(height: 16),
            Text('Failed to load', style: Theme.of(context).textTheme.titleMedium),
            const SizedBox(height: 8),
            Text(provider.errorMessage!, textAlign: TextAlign.center,
                style: Theme.of(context).textTheme.bodySmall),
            const SizedBox(height: 16),
            ElevatedButton.icon(
              onPressed: provider.refresh,
              icon: const Icon(Icons.refresh),
              label: const Text('Retry'),
            ),
          ],
        ),
      ),
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.menu_book_outlined, size: 64, color: AppColors.textHint),
          const SizedBox(height: 16),
          Text('No remedies found', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('Try a different filter or letter',
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }

  Widget _buildList(BuildContext context, MateriaMedicaProvider provider) {
    return NotificationListener<ScrollNotification>(
      onNotification: (notification) {
        if (notification is ScrollEndNotification &&
            notification.metrics.pixels >= notification.metrics.maxScrollExtent - 200 &&
            !provider.isLoading &&
            provider.hasMore) {
          provider.loadMore();
        }
        return false;
      },
      child: ListView.builder(
        padding: const EdgeInsets.all(12),
        itemCount: provider.remedies.length + (provider.hasMore ? 1 : 0),
        itemBuilder: (context, i) {
          if (i >= provider.remedies.length) {
            return const Padding(
              padding: EdgeInsets.all(16),
              child: Center(child: CircularProgressIndicator()),
            );
          }
          final r = provider.remedies[i];
          final remedy = Remedy(
            id: r.id, name: r.name, common: r.common, author: r.author,
            letter: r.letter, chapter: r.chapter, organ: r.organ,
            keynote: r.keynote, source: r.source, version: r.version,
          );
          return _RemedyCard(
            remedy: remedy,
            onTap: () => Navigator.push(
              context,
              SlidePageRoute(page: RemedyDetailScreen(remedy: remedy)),
            ),
          );
        },
      ),
    );
  }
}

class _FilterBar extends StatelessWidget {
  final MateriaMedicaProvider provider;
  const _FilterBar({required this.provider});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(12),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.borderLight)),
      ),
      child: Column(
        children: [
          // Author filter
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _FilterChip(
                  label: 'All',
                  selected: provider.selectedAuthor == null,
                  onTap: () => provider.setAuthor(null),
                ),
                const SizedBox(width: 6),
                ...provider.authors.map((a) => Padding(
                      padding: const EdgeInsets.only(right: 6),
                      child: _FilterChip(
                        label: a,
                        selected: provider.selectedAuthor == a,
                        onTap: () => provider.setAuthor(a),
                      ),
                    )),
              ],
            ),
          ),
          const SizedBox(height: 8),
          // Letter filter
          SizedBox(
            height: 36,
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: [
                _FilterChip(
                  label: 'A-Z',
                  selected: provider.selectedLetter == null,
                  onTap: () => provider.setLetter(null),
                ),
                const SizedBox(width: 6),
                ...List.generate(26, (i) {
                  final letter = String.fromCharCode(65 + i);
                  return Padding(
                    padding: const EdgeInsets.only(right: 6),
                    child: _FilterChip(
                      label: letter,
                      selected: provider.selectedLetter == letter,
                      onTap: () => provider.setLetter(letter),
                    ),
                  );
                }),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onTap;
  const _FilterChip({required this.label, required this.selected, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Material(
      color: selected ? AppColors.primary : AppColors.surfaceVariant,
      borderRadius: BorderRadius.circular(18),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(18),
        child: Container(
          padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
          child: Text(
            label,
            style: TextStyle(
              color: selected ? AppColors.textOnPrimary : AppColors.textSecondary,
              fontSize: 12, fontWeight: FontWeight.w600,
            ),
          ),
        ),
      ),
    );
  }
}

class _RemedyCard extends StatelessWidget {
  final Remedy remedy;
  final VoidCallback onTap;
  const _RemedyCard({required this.remedy, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: InkWell(
        borderRadius: BorderRadius.circular(12),
        onTap: onTap,
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              // Letter avatar
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: AppColors.primary.withAlpha(20),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(
                  child: Text(
                    remedy.name.isNotEmpty ? remedy.name[0].toUpperCase() : '?',
                    style: Theme.of(context).textTheme.headlineMedium?.copyWith(
                          color: AppColors.primary, fontSize: 22,
                        ),
                  ),
                ),
              ),
              const SizedBox(width: 12),
              // Content
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      remedy.name,
                      style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 15),
                      maxLines: 1, overflow: TextOverflow.ellipsis,
                    ),
                    const SizedBox(height: 2),
                    Row(
                      children: [
                        Container(
                          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                          decoration: BoxDecoration(
                            color: AppColors.accent.withAlpha(30),
                            borderRadius: BorderRadius.circular(4),
                          ),
                          child: Text(
                            remedy.author,
                            style: const TextStyle(
                              color: AppColors.accentDark,
                              fontSize: 10, fontWeight: FontWeight.w600,
                            ),
                          ),
                        ),
                        if (remedy.common.isNotEmpty) ...[
                          const SizedBox(width: 6),
                          Flexible(
                            child: Text(
                              remedy.common,
                              style: Theme.of(context).textTheme.bodySmall,
                              maxLines: 1, overflow: TextOverflow.ellipsis,
                            ),
                          ),
                        ],
                      ],
                    ),
                  ],
                ),
              ),
              const Icon(Icons.chevron_right, color: AppColors.textHint, size: 22),
            ],
          ),
        ),
      ),
    );
  }
}

class _RemedyCardSkeleton extends StatelessWidget {
  const _RemedyCardSkeleton();
  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: Padding(
        padding: const EdgeInsets.all(14),
        child: Row(
          children: [
            Container(width: 48, height: 48, decoration: BoxDecoration(color: AppColors.shimmerBase, borderRadius: BorderRadius.circular(12))),
            const SizedBox(width: 12),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Container(height: 14, width: 150, decoration: BoxDecoration(color: AppColors.shimmerBase, borderRadius: BorderRadius.circular(4))),
                  const SizedBox(height: 6),
                  Container(height: 10, width: 80, decoration: BoxDecoration(color: AppColors.shimmerBase, borderRadius: BorderRadius.circular(4))),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
