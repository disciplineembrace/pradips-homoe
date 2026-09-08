/// Repertory screen — browse rubrics by author + chapter.
///
/// Fully wired to real data sources via RubricRepository.
/// Lazy-loads rubric children on expand.
/// Grade-colored remedy badges: G4=Red, G3=Green, G2=Blue, G1=Black.
/// Includes timeout + error handling to prevent infinite spinners.
library;

import 'dart:async';
import 'dart:convert';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local/database.dart';
import '../../providers.dart';

class RepertoryScreen extends ConsumerStatefulWidget {
  const RepertoryScreen({super.key});

  @override
  ConsumerState<RepertoryScreen> createState() => _RepertoryScreenState();
}

class _RepertoryScreenState extends ConsumerState<RepertoryScreen> {
  String _selectedAuthor = 'Kent';
  String _selectedChapter = '';
  List<String> _chapters = [];
  List<Rubric> _roots = [];
  final _expandedNodes = <String>{};
  final _childrenCache = <String, List<Rubric>>{};
  final _loadingChildren = <String>{};
  bool _loading = false;
  String? _error;

  static const _authors = ['Kent', 'Phatak', 'Murphy', 'Boericke'];

  static const _gradeColors = {
    4: Color(0xFFDC2626),
    3: Color(0xFF166534),
    2: Color(0xFF1E40AF),
    1: Color(0xFF374151),
  };

  @override
  void initState() {
    super.initState();
    _loadChapters();
    _loadRoots();
  }

  Future<void> _loadChapters() async {
    try {
      final repo = ref.read(rubricRepositoryProvider);
      final chapters = await repo
          .getChapters(_selectedAuthor)
          .timeout(const Duration(seconds: 15));
      if (mounted) setState(() => _chapters = chapters);
    } catch (_) {
      // Non-fatal — chapters will be empty
    }
  }

  Future<void> _loadRoots() async {
    setState(() {
      _loading = true;
      _error = null;
    });
    try {
      final repo = ref.read(rubricRepositoryProvider);
      final roots = await repo
          .getRoots(
            _selectedAuthor,
            chapter: _selectedChapter.isEmpty ? null : _selectedChapter,
          )
          .timeout(const Duration(seconds: 15));
      if (mounted) {
        setState(() {
          _roots = roots;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          _loading = false;
          _error = 'Unable to load rubrics. Please check your connection and try again.';
        });
      }
    }
  }

  Future<void> _toggleExpand(Rubric node) async {
    final id = node.serverId;
    if (_expandedNodes.contains(id)) {
      setState(() => _expandedNodes.remove(id));
    } else {
      setState(() => _expandedNodes.add(id));
      if (!_childrenCache.containsKey(id)) {
        setState(() => _loadingChildren.add(id));
        try {
          final repo = ref.read(rubricRepositoryProvider);
          final children = await repo
              .getChildren(id)
              .timeout(const Duration(seconds: 10));
          if (mounted) {
            setState(() {
              _childrenCache[id] = children;
              _loadingChildren.remove(id);
            });
          }
        } catch (_) {
          if (mounted) {
            setState(() {
              _loadingChildren.remove(id);
              _childrenCache[id] = [];
            });
          }
        }
      }
    }
  }

  List<Map<String, dynamic>> _parseRemedies(String remediesJson) {
    try {
      final list = jsonDecode(remediesJson) as List;
      return list.cast<Map<String, dynamic>>();
    } catch (_) {
      return [];
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Repertory')),
      body: Column(
        children: [
          // Author tabs
          Container(
            height: 48,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
            child: ListView(
              scrollDirection: Axis.horizontal,
              children: _authors.map((author) {
                return Padding(
                  padding: const EdgeInsets.only(right: 4),
                  child: ChoiceChip(
                    label: Text(author),
                    selected: _selectedAuthor == author,
                    onSelected: (selected) {
                      if (selected) {
                        setState(() {
                          _selectedAuthor = author;
                          _selectedChapter = '';
                          _expandedNodes.clear();
                          _childrenCache.clear();
                          _error = null;
                        });
                        _loadChapters();
                        _loadRoots();
                      }
                    },
                  ),
                );
              }).toList(),
            ),
          ),
          // Chapter filter
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: DropdownButton<String>(
              value: _selectedChapter.isEmpty ? 'All Chapters' : _selectedChapter,
              isExpanded: true,
              hint: const Text('All Chapters'),
              items: [
                const DropdownMenuItem(value: 'All Chapters', child: Text('All Chapters')),
                ..._chapters.map((ch) => DropdownMenuItem(value: ch, child: Text(ch))),
              ],
              onChanged: (value) {
                setState(() {
                  _selectedChapter = value == 'All Chapters' ? '' : value!;
                  _expandedNodes.clear();
                  _childrenCache.clear();
                  _error = null;
                });
                _loadRoots();
              },
            ),
          ),
          // Grade legend
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
            child: Row(
              children: [
                Text('Grades:', style: Theme.of(context).textTheme.bodySmall),
                const SizedBox(width: 8),
                ..._gradeColors.entries.map((entry) {
                  return Padding(
                    padding: const EdgeInsets.only(right: 8),
                    child: Row(
                      children: [
                        Container(
                          width: 12, height: 12,
                          decoration: BoxDecoration(color: entry.value, shape: BoxShape.circle),
                        ),
                        const SizedBox(width: 4),
                        Text('G${entry.key}', style: const TextStyle(fontSize: 10)),
                      ],
                    ),
                  );
                }),
              ],
            ),
          ),
          // Rubric tree
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _error != null
                    ? Center(
                        child: Column(
                          mainAxisAlignment: MainAxisAlignment.center,
                          children: [
                            const Icon(Icons.error_outline, size: 48, color: Colors.grey),
                            const SizedBox(height: 16),
                            Text(_error!, textAlign: TextAlign.center,
                                style: const TextStyle(color: Colors.grey)),
                            const SizedBox(height: 16),
                            FilledButton(
                              onPressed: _loadRoots,
                              child: const Text('Retry'),
                            ),
                          ],
                        ),
                      )
                    : _roots.isEmpty
                        ? Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                const Icon(Icons.library_books, size: 48, color: Colors.grey),
                                const SizedBox(height: 16),
                                const Text('No rubrics found.',
                                    style: TextStyle(color: Colors.grey)),
                                const SizedBox(height: 8),
                                const Text('Sync from Settings to load data.',
                                    style: TextStyle(color: Colors.grey, fontSize: 12)),
                              ],
                            ),
                          )
                        : ListView.builder(
                            itemCount: _roots.length,
                            itemBuilder: (context, index) => _buildNode(_roots[index], 0),
                          ),
          ),
        ],
      ),
    );
  }

  Widget _buildNode(Rubric node, int level) {
    final isExpanded = _expandedNodes.contains(node.serverId);
    final isLoading = _loadingChildren.contains(node.serverId);
    final children = _childrenCache[node.serverId];
    final remedies = _parseRemedies(node.remediesJson);

    return Column(
      children: [
        InkWell(
          onTap: () => _toggleExpand(node),
          child: Padding(
            padding: EdgeInsets.only(left: level * 16.0, top: 8, bottom: 8, right: 8),
            child: Row(
              children: [
                if (isLoading)
                  const SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(strokeWidth: 2),
                  )
                else if (children != null && children.isNotEmpty)
                  Icon(
                    isExpanded ? Icons.expand_more : Icons.chevron_right,
                    size: 20, color: Colors.grey,
                  )
                else
                  const SizedBox(width: 20),
                const SizedBox(width: 4),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(node.title, style: const TextStyle(fontSize: 14)),
                      if (node.fullPath.isNotEmpty && node.fullPath != node.title)
                        Text(node.fullPath,
                            style: const TextStyle(fontSize: 10, color: Colors.grey),
                            maxLines: 1, overflow: TextOverflow.ellipsis),
                      Text(
                        '${node.remedyCount} ${node.remedyCount == 1 ? "remedy" : "remedies"}',
                        style: const TextStyle(fontSize: 10, color: Colors.grey),
                      ),
                    ],
                  ),
                ),
                ...remedies.take(5).map((r) {
                  final grade = (r['grade'] as num?)?.toInt() ?? 1;
                  final abbrev = r['abbrev']?.toString() ?? '';
                  return Padding(
                    padding: const EdgeInsets.only(left: 2),
                    child: Container(
                      padding: const EdgeInsets.symmetric(horizontal: 4, vertical: 1),
                      decoration: BoxDecoration(
                        color: _gradeColors[grade] ?? Colors.grey,
                        borderRadius: BorderRadius.circular(3),
                      ),
                      child: Text(
                        abbrev,
                        style: const TextStyle(color: Colors.white, fontSize: 9),
                      ),
                    ),
                  );
                }),
              ],
            ),
          ),
        ),
        if (isExpanded && children != null)
          ...children.map((child) => _buildNode(child, level + 1)),
      ],
    );
  }
}
