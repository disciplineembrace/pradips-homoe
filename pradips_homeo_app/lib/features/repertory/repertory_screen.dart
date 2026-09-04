/// Repertory Screen - browse rubrics by chapter with expandable tree
/// Offline-first: reads from local SQLite DB
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../../data/local/app_database.dart';
import '../../data/models/models.dart' as models;
import 'repertory_provider.dart';

class RepertoryScreen extends StatelessWidget {
  const RepertoryScreen({super.key});

  @override
  Widget build(BuildContext context) {
    return ChangeNotifierProvider(
      create: (_) => RepertoryProvider()..init(),
      child: const _RepertoryView(),
    );
  }
}

class _RepertoryView extends StatelessWidget {
  const _RepertoryView();

  @override
  Widget build(BuildContext context) {
    final provider = context.watch<RepertoryProvider>();
    return Column(
      children: [
        _ChapterBar(provider: provider),
        Expanded(
          child: provider.isLoading && provider.rubrics.isEmpty
              ? const Center(child: CircularProgressIndicator())
              : provider.rubrics.isEmpty
                  ? _buildEmpty(context)
                  : ListView.builder(
                      padding: const EdgeInsets.all(8),
                      itemCount: provider.rubrics.length,
                      itemBuilder: (_, i) => _RubricTile(
                        rubric: provider.rubrics[i],
                        depth: 0,
                      ),
                    ),
        ),
      ],
    );
  }

  Widget _buildEmpty(BuildContext context) {
    return Center(
      child: Column(
        mainAxisAlignment: MainAxisAlignment.center,
        children: [
          const Icon(Icons.account_tree_outlined, size: 64, color: AppColors.textHint),
          const SizedBox(height: 16),
          Text('No rubrics found', style: Theme.of(context).textTheme.titleMedium),
          const SizedBox(height: 8),
          Text('Try selecting a different chapter',
              style: Theme.of(context).textTheme.bodySmall),
        ],
      ),
    );
  }
}

class _ChapterBar extends StatelessWidget {
  final RepertoryProvider provider;
  const _ChapterBar({required this.provider});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 50,
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
      decoration: const BoxDecoration(
        color: AppColors.surface,
        border: Border(bottom: BorderSide(color: AppColors.borderLight)),
      ),
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        itemCount: provider.chapters.length,
        itemBuilder: (_, i) {
          final c = provider.chapters[i];
          final selected = provider.selectedChapter == c.name;
          return Padding(
            padding: const EdgeInsets.only(right: 6),
            child: Material(
              color: selected ? AppColors.primary : AppColors.surfaceVariant,
              borderRadius: BorderRadius.circular(16),
              child: InkWell(
                onTap: () => provider.setChapter(c.name),
                borderRadius: BorderRadius.circular(16),
                child: Padding(
                  padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                  child: Row(
                    mainAxisSize: MainAxisSize.min,
                    children: [
                      Text(
                        c.name,
                        style: TextStyle(
                          color: selected ? AppColors.textOnPrimary : AppColors.textSecondary,
                          fontSize: 12, fontWeight: FontWeight.w600,
                        ),
                      ),
                      const SizedBox(width: 6),
                      Container(
                        padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 1),
                        decoration: BoxDecoration(
                          color: selected ? AppColors.textOnPrimary.withAlpha(50) : AppColors.textHint.withAlpha(50),
                          borderRadius: BorderRadius.circular(8),
                        ),
                        child: Text(
                          '${c.rubricCount}',
                          style: TextStyle(
                            fontSize: 10,
                            color: selected ? AppColors.textOnPrimary : AppColors.textHint,
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ),
          );
        },
      ),
    );
  }
}

class _RubricTile extends StatefulWidget {
  final RubricRow rubric;
  final int depth;
  const _RubricTile({required this.rubric, required this.depth});

  @override
  State<_RubricTile> createState() => _RubricTileState();
}

class _RubricTileState extends State<_RubricTile> {
  bool _expanded = false;
  List<RubricRow>? _children;
  bool _loadingChildren = false;

  List<models.RemedyGrade> get _remedies {
    if (widget.rubric.remediesJson.isEmpty) return [];
    try {
      final list = json.decode(widget.rubric.remediesJson) as List<dynamic>;
      return list.map((e) {
        final m = e as Map<String, dynamic>;
        return models.RemedyGrade(
          name: m['name'] as String? ?? '',
          grade: (m['grade'] as num?)?.toInt() ?? 1,
        );
      }).toList();
    } catch (_) {
      return [];
    }
  }

  Future<void> _toggleExpand() async {
    if (!_expanded && _children == null && widget.rubric.parentId == null) {
      // Top-level rubric - load children on first expand
      setState(() => _loadingChildren = true);
      final provider = context.read<RepertoryProvider>();
      _children = await provider.getSubRubrics(widget.rubric.id);
      setState(() => _loadingChildren = false);
    }
    setState(() => _expanded = !_expanded);
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.rubric;
    final remedies = _remedies;
    final hasRemedies = remedies.isNotEmpty;
    final indent = widget.depth * 16.0;

    return Column(
      children: [
        InkWell(
          onTap: _toggleExpand,
          child: Container(
            margin: EdgeInsets.only(left: indent, bottom: 2, top: 2),
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
            decoration: BoxDecoration(
              color: widget.depth == 0
                  ? AppColors.primary.withAlpha(8)
                  : AppColors.surface,
              borderRadius: BorderRadius.circular(8),
              border: widget.depth == 0
                  ? Border.all(color: AppColors.borderLight, width: 0.5)
                  : null,
            ),
            child: Row(
              children: [
                if (_loadingChildren)
                  const SizedBox(
                    width: 18, height: 18,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else
                  Icon(
                    _expanded ? Icons.expand_more : Icons.chevron_right,
                    size: 18, color: AppColors.primary,
                  ),
                const SizedBox(width: 6),
                Expanded(
                  child: Text(
                    r.main,
                    style: TextStyle(
                      fontSize: widget.depth == 0 ? 14 : 13,
                      fontWeight: widget.depth == 0 ? FontWeight.w600 : FontWeight.normal,
                      color: widget.depth == 0 ? AppColors.primary : AppColors.textPrimary,
                    ),
                    maxLines: 2, overflow: TextOverflow.ellipsis,
                  ),
                ),
                if (hasRemedies)
                  Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 3),
                    decoration: BoxDecoration(
                      color: AppColors.accent.withAlpha(30),
                      borderRadius: BorderRadius.circular(10),
                    ),
                    child: Text(
                      '${remedies.length}',
                      style: const TextStyle(
                        color: AppColors.accentDark,
                        fontSize: 10, fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
              ],
            ),
          ),
        ),
        // Children
        if (_expanded && _children != null)
          ..._children!.map((sub) => _RubricTile(rubric: sub, depth: widget.depth + 1)),
        // Remedies list
        if (_expanded && hasRemedies)
          Container(
            margin: EdgeInsets.only(left: indent + 24, bottom: 4, top: 2),
            padding: const EdgeInsets.all(8),
            decoration: BoxDecoration(
              color: AppColors.surfaceVariant.withAlpha(100),
              borderRadius: BorderRadius.circular(8),
            ),
            child: Wrap(
              spacing: 6, runSpacing: 6,
              children: remedies.map((rg) => _RemedyGradeChip(remedyGrade: rg)).toList(),
            ),
          ),
      ],
    );
  }
}

class _RemedyGradeChip extends StatelessWidget {
  final models.RemedyGrade remedyGrade;
  const _RemedyGradeChip({required this.remedyGrade});

  @override
  Widget build(BuildContext context) {
    final color = AppUtils.getGradeColor(remedyGrade.grade);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: color.withAlpha(120), width: 1),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(
            remedyGrade.name,
            style: TextStyle(
              color: color, fontSize: 11, fontWeight: FontWeight.w600,
            ),
          ),
          const SizedBox(width: 4),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 0),
            decoration: BoxDecoration(
              color: color, borderRadius: BorderRadius.circular(4),
            ),
            child: Text(
              '${remedyGrade.grade}',
              style: const TextStyle(
                color: Colors.white, fontSize: 9, fontWeight: FontWeight.bold,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
