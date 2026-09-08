/// Bookmarks screen — user's saved bookmarks.
///
/// Fully wired to BookmarkRepository.
/// Reads from local SQLite (instant), syncs via outbox when online.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local/database.dart';
import '../../providers.dart';

class BookmarksScreen extends ConsumerStatefulWidget {
  const BookmarksScreen({super.key});

  @override
  ConsumerState<BookmarksScreen> createState() => _BookmarksScreenState();
}

class _BookmarksScreenState extends ConsumerState<BookmarksScreen> {
  List<Bookmark> _bookmarks = [];
  bool _loading = false;

  @override
  void initState() {
    super.initState();
    _loadBookmarks();
  }

  Future<void> _loadBookmarks() async {
    final repo = ref.read(bookmarkRepositoryProvider);
    final authRepo = ref.read(authRepositoryProvider);
    final userId = authRepo.currentUser?.id ?? '';

    setState(() => _loading = true);
    try {
      final bookmarks = await repo.getBookmarks(userId);
      if (mounted) setState(() => _bookmarks = bookmarks);
    } catch (_) {
      // Show empty on error
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  Future<void> _removeBookmark(Bookmark bookmark) async {
    final repo = ref.read(bookmarkRepositoryProvider);
    final authRepo = ref.read(authRepositoryProvider);
    final userId = authRepo.currentUser?.id ?? '';

    await repo.removeBookmark(userId: userId, entityId: bookmark.entityId);
    _loadBookmarks();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bookmarks'),
        actions: [
          IconButton(
            icon: const Icon(Icons.refresh),
            onPressed: _loadBookmarks,
          ),
        ],
      ),
      body: _loading
          ? const Center(child: CircularProgressIndicator())
          : _bookmarks.isEmpty
              ? const Center(
                  child: Column(
                    mainAxisAlignment: MainAxisAlignment.center,
                    children: [
                      Icon(Icons.bookmark_border, size: 64, color: Colors.grey),
                      SizedBox(height: 16),
                      Text('No bookmarks yet'),
                      SizedBox(height: 8),
                      Text(
                        'Bookmarks you add will appear here.\n'
                        'Works offline — syncs when online.',
                        textAlign: TextAlign.center,
                        style: TextStyle(color: Colors.grey, fontSize: 12),
                      ),
                    ],
                  ),
                )
              : ListView.builder(
                  itemCount: _bookmarks.length,
                  itemBuilder: (context, index) {
                    final bookmark = _bookmarks[index];
                    return Card(
                      margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                      child: ListTile(
                        leading: Icon(
                          bookmark.entityType == 'remedy'
                              ? Icons.medical_services
                              : bookmark.entityType == 'rubric'
                                  ? Icons.library_books
                                  : Icons.bookmark,
                          color: Theme.of(context).colorScheme.primary,
                        ),
                        title: Text(bookmark.title),
                        subtitle: Text(bookmark.entityType),
                        trailing: IconButton(
                          icon: const Icon(Icons.delete_outline, color: Colors.red),
                          onPressed: () => _removeBookmark(bookmark),
                        ),
                        onTap: () {
                          Navigator.pushNamed(
                            context,
                            '/${bookmark.entityType}',
                            arguments: bookmark.entityId,
                          );
                        },
                      ),
                    );
                  },
                ),
    );
  }
}
