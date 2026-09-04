/// Remedy Detail Screen - shows full remedy information
/// Reads from local SQLite DB (instant), saves bookmark locally + queues for sync
import 'package:flutter/material.dart';
import 'package:flutter_markdown/flutter_markdown.dart';
import 'package:drift/drift.dart' show Value;
import '../../core/theme/app_colors.dart';
import '../../core/utils/app_utils.dart';
import '../../data/local/app_database.dart';
import '../../data/models/models.dart' as models;
import '../../data/sync/sync_service.dart';

class RemedyDetailScreen extends StatefulWidget {
  final models.Remedy remedy;
  const RemedyDetailScreen({super.key, required this.remedy});

  @override
  State<RemedyDetailScreen> createState() => _RemedyDetailScreenState();
}

class _RemedyDetailScreenState extends State<RemedyDetailScreen> {
  bool _isBookmarked = false;
  bool _isFavorite = false;
  final AppDatabase _db = AppDatabase();
  final SyncService _syncService = SyncService();

  @override
  void initState() {
    super.initState();
    _loadBookmarkStatus();
    _addToHistory();
  }

  Future<void> _loadBookmarkStatus() async {
    final bookmark = await _db.getBookmark(widget.remedy.id, 'remedy');
    if (mounted) setState(() => _isBookmarked = bookmark != null);
  }

  Future<void> _addToHistory() async {
    await _db.addToHistory(ReadingHistoryCompanion.insert(
      itemId: widget.remedy.id,
      itemType: 'remedy',
      title: widget.remedy.name,
      href: Value('/remedy/${widget.remedy.id}'),
    ));
  }

  Future<void> _toggleBookmark() async {
    if (_isBookmarked) {
      await _db.removeBookmark(widget.remedy.id, 'remedy');
      if (mounted) setState(() => _isBookmarked = false);
      AppUtils.showSnackBar(context, 'Removed from bookmarks');
    } else {
      await _db.addBookmark(BookmarksCompanion.insert(
        itemId: widget.remedy.id,
        itemType: 'remedy',
        title: widget.remedy.name,
        href: Value('/remedy/${widget.remedy.id}'),
        author: Value(widget.remedy.author),
        pendingSync: const Value(true), // Mark for sync
      ));
      if (mounted) setState(() => _isBookmarked = true);
      AppUtils.showSnackBar(context, 'Added to bookmarks');

      // Trigger background sync to push to server
      _syncService.syncAll();
    }
  }

  @override
  Widget build(BuildContext context) {
    final r = widget.remedy;
    return Scaffold(
      appBar: AppBar(
        title: Text(r.name, maxLines: 1, overflow: TextOverflow.ellipsis),
        actions: [
          IconButton(
            icon: Icon(_isBookmarked ? Icons.bookmark : Icons.bookmark_border),
            onPressed: _toggleBookmark,
            tooltip: 'Bookmark',
          ),
          IconButton(
            icon: Icon(_isFavorite ? Icons.favorite : Icons.favorite_border),
            onPressed: () {
              setState(() => _isFavorite = !_isFavorite);
              AppUtils.showSnackBar(context,
                  _isFavorite ? 'Added to favorites' : 'Removed from favorites');
            },
            tooltip: 'Favorite',
          ),
        ],
      ),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            // Hero card
            Card(
              child: Padding(
                padding: const EdgeInsets.all(20),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Container(
                          width: 64, height: 64,
                          decoration: BoxDecoration(
                            color: AppColors.primary,
                            borderRadius: BorderRadius.circular(16),
                          ),
                          child: Center(
                            child: Text(
                              r.name.isNotEmpty ? r.name[0].toUpperCase() : '?',
                              style: const TextStyle(
                                color: AppColors.textOnPrimary,
                                fontSize: 28, fontWeight: FontWeight.bold,
                              ),
                            ),
                          ),
                        ),
                        const SizedBox(width: 16),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(r.name, style: Theme.of(context).textTheme.headlineMedium),
                              if (r.common.isNotEmpty) ...[
                                const SizedBox(height: 4),
                                Text(r.common, style: Theme.of(context).textTheme.bodyMedium?.copyWith(color: AppColors.textSecondary, fontStyle: FontStyle.italic)),
                              ],
                            ],
                          ),
                        ),
                      ],
                    ),
                    const SizedBox(height: 16),
                    Wrap(
                      spacing: 8, runSpacing: 8,
                      children: [
                        _InfoChip(label: 'Author', value: r.author, icon: Icons.person_outline),
                        if (r.chapter.isNotEmpty)
                          _InfoChip(label: 'Chapter', value: r.chapter, icon: Icons.book_outlined),
                        if (r.organ.isNotEmpty)
                          _InfoChip(label: 'Organ', value: r.organ, icon: Icons.accessibility_new),
                      ],
                    ),
                  ],
                ),
              ),
            ),
            const SizedBox(height: 16),

            // Keynotes section
            if (r.keynote.isNotEmpty) ...[
              _SectionTitle(title: 'Keynotes & Characteristics'),
              Card(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: MarkdownBody(
                    data: _formatContent(r.keynote),
                    styleSheet: MarkdownStyleSheet(
                      p: Theme.of(context).textTheme.bodyMedium,
                      h1: Theme.of(context).textTheme.headlineMedium,
                      h2: Theme.of(context).textTheme.headlineSmall,
                      h3: Theme.of(context).textTheme.titleLarge,
                      strong: const TextStyle(fontWeight: FontWeight.w700, color: AppColors.primary),
                      em: TextStyle(fontStyle: FontStyle.italic, color: AppColors.headingMaroon),
                      blockSpacing: 8,
                    ),
                  ),
                ),
              ),
              const SizedBox(height: 16),
            ],

            // Source info
            if (r.source != null && r.source!.isNotEmpty) ...[
              Card(
                color: AppColors.surfaceVariant.withAlpha(100),
                child: Padding(
                  padding: const EdgeInsets.all(12),
                  child: Row(
                    children: [
                      const Icon(Icons.source_outlined, size: 18, color: AppColors.accentDark),
                      const SizedBox(width: 8),
                      Expanded(
                        child: Text(
                          r.source!,
                          style: Theme.of(context).textTheme.bodySmall?.copyWith(color: AppColors.textSecondary),
                        ),
                      ),
                    ],
                  ),
                ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatContent(String content) {
    return content
        .replaceAll('\\n', '\n')
        .replaceAll(RegExp(r'<br\s*/?>'), '\n')
        .trim();
  }
}

class _SectionTitle extends StatelessWidget {
  final String title;
  const _SectionTitle({required this.title});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        children: [
          Container(
            width: 4, height: 22,
            decoration: BoxDecoration(
              color: AppColors.accent,
              borderRadius: BorderRadius.circular(2),
            ),
          ),
          const SizedBox(width: 10),
          Text(title, style: Theme.of(context).textTheme.headlineSmall),
        ],
      ),
    );
  }
}

class _InfoChip extends StatelessWidget {
  final String label;
  final String value;
  final IconData icon;
  const _InfoChip({required this.label, required this.value, required this.icon});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
      decoration: BoxDecoration(
        color: AppColors.surfaceVariant,
        borderRadius: BorderRadius.circular(8),
        border: Border.all(color: AppColors.borderLight, width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Icon(icon, size: 14, color: AppColors.accentDark),
          const SizedBox(width: 6),
          Text(
            '$label: ',
            style: const TextStyle(fontSize: 11, color: AppColors.textHint, fontWeight: FontWeight.w500),
          ),
          Text(
            value,
            style: const TextStyle(fontSize: 11, color: AppColors.textPrimary, fontWeight: FontWeight.w600),
          ),
        ],
      ),
    );
  }
}
