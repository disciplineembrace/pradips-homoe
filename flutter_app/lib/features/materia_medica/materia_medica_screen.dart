/// Materia Medica screen — browse remedies by author.
///
/// Fully wired to real data sources:
///   - Online: fetches from /api/remedies via RemedyRepository
///   - Offline: reads from local SQLite via RemedyRepository
/// No placeholders.
library;

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../data/local/database.dart';
import '../../providers.dart';

class MateriaMedicaScreen extends ConsumerStatefulWidget {
  const MateriaMedicaScreen({super.key});

  @override
  ConsumerState<MateriaMedicaScreen> createState() => _MateriaMedicaScreenState();
}

class _MateriaMedicaScreenState extends ConsumerState<MateriaMedicaScreen> {
  final _searchController = TextEditingController();
  String _selectedAuthor = 'All';
  List<Remedy> _remedies = [];
  List<String> _authors = ['All'];
  bool _loading = false;
  String? _error;
  Timer? _debounce;

  @override
  void initState() {
    super.initState();
    _loadAuthors();
    _loadRemedies();
  }

  @override
  void dispose() {
    _searchController.dispose();
    _debounce?.cancel();
    super.dispose();
  }

  Future<void> _loadAuthors() async {
    final repo = ref.read(remedyRepositoryProvider);
    final authors = await repo.getAuthors();
    if (mounted) {
      setState(() {
        _authors = ['All', ...authors.where((a) => a != 'All')];
      });
    }
  }

  Future<void> _loadRemedies() async {
    setState(() {
      _loading = true;
      _error = null;
    });

    try {
      final repo = ref.read(remedyRepositoryProvider);
      final query = _searchController.text.trim();
      final remedies = await repo
          .getRemedies(
            author: _selectedAuthor == 'All' ? null : _selectedAuthor,
            query: query.isNotEmpty ? query : null,
            limit: 100,
          )
          .timeout(const Duration(seconds: 15));
      if (mounted) {
        setState(() {
          _remedies = remedies;
          _loading = false;
        });
      }
    } catch (e) {
      if (mounted) {
        setState(() {
          // Never expose raw exception details (may contain SQL, keys, etc.)
          _error = 'Unable to load remedies. Please check your connection and try again.';
          _loading = false;
        });
      }
    }
  }

  void _onSearchChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), _loadRemedies);
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Materia Medica')),
      body: Column(
        children: [
          // Search bar
          Padding(
            padding: const EdgeInsets.all(16),
            child: TextField(
              controller: _searchController,
              decoration: InputDecoration(
                hintText: 'Search remedies...',
                prefixIcon: const Icon(Icons.search),
                border: const OutlineInputBorder(),
                suffixIcon: _searchController.text.isNotEmpty
                    ? IconButton(
                        icon: const Icon(Icons.clear),
                        onPressed: () {
                          _searchController.clear();
                          _loadRemedies();
                        },
                      )
                    : null,
              ),
              onChanged: _onSearchChanged,
            ),
          ),
          // Author filter
          SizedBox(
            height: 40,
            child: ListView.builder(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              itemCount: _authors.length,
              itemBuilder: (context, index) {
                final author = _authors[index];
                return Padding(
                  padding: const EdgeInsets.only(right: 8),
                  child: FilterChip(
                    label: Text(author),
                    selected: _selectedAuthor == author,
                    onSelected: (selected) {
                      setState(() => _selectedAuthor = author);
                      _loadRemedies();
                    },
                  ),
                );
              },
            ),
          ),
          const SizedBox(height: 8),
          // Error
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16),
              child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 12)),
            ),
          // Remedies list
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _remedies.isEmpty
                    ? const Center(
                        child: Text('No remedies found.\nTry a different search or sync.'),
                      )
                    : ListView.builder(
                        itemCount: _remedies.length,
                        itemBuilder: (context, index) {
                          final remedy = _remedies[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            child: ListTile(
                              title: Text(remedy.name),
                              subtitle: Text(remedy.author),
                              trailing: const Icon(Icons.chevron_right),
                              onTap: () {
                                // Navigate to remedy detail
                                Navigator.pushNamed(
                                  context,
                                  '/remedy',
                                  arguments: remedy.serverId,
                                );
                              },
                            ),
                          );
                        },
                      ),
          ),
        ],
      ),
    );
  }
}
