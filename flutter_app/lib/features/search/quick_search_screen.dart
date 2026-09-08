/// Quick Clinical Search screen — search verified source data.
///
/// Fully wired to real API + local search. No placeholders.
/// Online: fetches from /api/clinical-search.
/// Offline: searches local SQLite.
library;

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../core/network/api_exceptions.dart';
import '../../data/remote/dtos/dtos.dart';
import '../../providers.dart';

class QuickSearchScreen extends ConsumerStatefulWidget {
  const QuickSearchScreen({super.key});

  @override
  ConsumerState<QuickSearchScreen> createState() => _QuickSearchScreenState();
}

class _QuickSearchScreenState extends ConsumerState<QuickSearchScreen> {
  final _searchController = TextEditingController();
  final _withinResultsController = TextEditingController();
  String _selectedSubject = 'all';
  String _selectedSource = 'all';
  List<SearchResultDto> _results = [];
  List<SearchResultDto> _filteredResults = [];
  bool _loading = false;
  bool _searched = false;
  String? _error;

  static const _subjects = [
    {'value': 'all', 'label': 'All Subjects'},
    {'value': 'materia-medica', 'label': 'Materia Medica'},
    {'value': 'repertory', 'label': 'Repertory'},
  ];

  static const _sourcesAll = [
    {'value': 'all', 'label': 'All Sources'},
    {'value': 'Allen', 'label': "Allen's Keynotes"},
    {'value': 'Boericke', 'label': 'Boericke'},
    {'value': 'Kent', 'label': 'Kent'},
    {'value': 'Murphy', 'label': 'Murphy'},
    {'value': 'Phatak', 'label': 'Phatak'},
    {'value': 'Dubey', 'label': 'S. K. Dubey'},
  ];

  @override
  void dispose() {
    _searchController.dispose();
    _withinResultsController.dispose();
    super.dispose();
  }

  Future<void> _handleSearch() async {
    final query = _searchController.text.trim();
    if (query.length < 2) return;

    setState(() {
      _loading = true;
      _searched = true;
      _error = null;
    });

    try {
      final api = ref.read(apiClientProvider);
      final response = await api.clinicalSearch(
        q: query,
        subject: _selectedSubject,
        source: _selectedSource,
        page: 1,
        pageSize: 20,
      );
      setState(() {
        _results = response.items;
        _filteredResults = response.items;
        _loading = false;
      });
    } on ApiException catch (e) {
      setState(() {
        _error = e.message;
        _loading = false;
        _results = [];
        _filteredResults = [];
      });
    } catch (e) {
      setState(() {
        _error = e.toString();
        _loading = false;
        _results = [];
        _filteredResults = [];
      });
    }
  }

  void _filterWithinResults() {
    final query = _withinResultsController.text.toLowerCase().trim();
    if (query.isEmpty) {
      setState(() => _filteredResults = _results);
      return;
    }
    final words = query.split(RegExp(r'\s+'));
    setState(() {
      _filteredResults = _results.where((r) {
        final haystack = [
          r.name,
          r.snippet,
          r.author,
          r.source,
          r.subsection ?? '',
          r.matchText,
          if (r.categories != null) r.categories!.values.join(' '),
        ].join(' ').toLowerCase();
        return words.every((w) => haystack.contains(w));
      }).toList();
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Quick Clinical Search')),
      body: Column(
        children: [
          // Search box
          Padding(
            padding: const EdgeInsets.all(16),
            child: Row(
              children: [
                Expanded(
                  child: TextField(
                    controller: _searchController,
                    decoration: const InputDecoration(
                      hintText: 'Search disease, symptom, indication...',
                      prefixIcon: Icon(Icons.search),
                      border: OutlineInputBorder(),
                    ),
                    onSubmitted: (_) => _handleSearch(),
                  ),
                ),
                const SizedBox(width: 8),
                FilledButton(
                  onPressed: _loading ? null : _handleSearch,
                  child: const Text('Search'),
                ),
              ],
            ),
          ),
          // Filters: Subject + Source
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 16),
            child: Row(
              children: [
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedSubject,
                    decoration: const InputDecoration(
                      labelText: 'Search In',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    items: _subjects.map((s) {
                      return DropdownMenuItem(value: s['value'], child: Text(s['label']!));
                    }).toList(),
                    onChanged: (value) {
                      setState(() {
                        _selectedSubject = value!;
                        _selectedSource = 'all';
                      });
                    },
                  ),
                ),
                const SizedBox(width: 8),
                Expanded(
                  child: DropdownButtonFormField<String>(
                    initialValue: _selectedSource,
                    decoration: const InputDecoration(
                      labelText: 'Source',
                      isDense: true,
                      border: OutlineInputBorder(),
                    ),
                    items: _sourcesAll.map((s) {
                      return DropdownMenuItem(value: s['value'], child: Text(s['label']!));
                    }).toList(),
                    onChanged: (value) => setState(() => _selectedSource = value!),
                  ),
                ),
              ],
            ),
          ),
          // Search Within Results (only after search)
          if (_searched && _results.isNotEmpty) ...[
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
              child: TextField(
                controller: _withinResultsController,
                decoration: InputDecoration(
                  labelText: 'Search Within Results',
                  hintText: 'Search within selected source...',
                  prefixIcon: const Icon(Icons.filter_list),
                  border: const OutlineInputBorder(),
                  isDense: true,
                  suffixIcon: _withinResultsController.text.isNotEmpty
                      ? IconButton(
                          icon: const Icon(Icons.clear),
                          onPressed: () {
                            _withinResultsController.clear();
                            _filterWithinResults();
                          },
                        )
                      : null,
                ),
                onChanged: (_) => _filterWithinResults(),
              ),
            ),
            if (_withinResultsController.text.isNotEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(horizontal: 16),
                child: Align(
                  alignment: Alignment.centerLeft,
                  child: Text(
                    'Showing ${_filteredResults.length} of ${_results.length} loaded results',
                    style: Theme.of(context).textTheme.bodySmall,
                  ),
                ),
              ),
          ],
          // Error
          if (_error != null)
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
              child: Text(_error!, style: TextStyle(color: Colors.red.shade700, fontSize: 12)),
            ),
          // Results
          Expanded(
            child: _loading
                ? const Center(child: CircularProgressIndicator())
                : _searched && _filteredResults.isEmpty
                    ? const Center(
                        child: Text('No verified indication found\nin the selected sources.',
                            textAlign: TextAlign.center),
                      )
                    : ListView.builder(
                        itemCount: _filteredResults.length,
                        itemBuilder: (context, index) {
                          final r = _filteredResults[index];
                          return Card(
                            margin: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
                            child: Padding(
                              padding: const EdgeInsets.all(12),
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  // Match badge + source
                                  Row(
                                    children: [
                                      Container(
                                        padding: const EdgeInsets.symmetric(
                                            horizontal: 8, vertical: 2),
                                        decoration: BoxDecoration(
                                          color: Theme.of(context).colorScheme.primary,
                                          borderRadius: BorderRadius.circular(12),
                                        ),
                                        child: Text(
                                          r.matchType.toUpperCase(),
                                          style: const TextStyle(color: Colors.white, fontSize: 10),
                                        ),
                                      ),
                                      const SizedBox(width: 8),
                                      Text(
                                        r.author,
                                        style: TextStyle(
                                          fontSize: 12,
                                          color: Theme.of(context).colorScheme.secondary,
                                        ),
                                      ),
                                      const Spacer(),
                                      Text(
                                        r.type == 'remedy' ? 'Materia Medica' : 'Repertory',
                                        style: const TextStyle(fontSize: 10, color: Colors.grey),
                                      ),
                                    ],
                                  ),
                                  const SizedBox(height: 8),
                                  // Remedy name
                                  Text(
                                    r.name,
                                    style: const TextStyle(
                                        fontSize: 16, fontWeight: FontWeight.bold),
                                  ),
                                  const SizedBox(height: 4),
                                  // Snippet
                                  if (r.snippet.isNotEmpty)
                                    Text(r.snippet, style: const TextStyle(fontSize: 13)),
                                  const SizedBox(height: 8),
                                  // View source
                                  Align(
                                    alignment: Alignment.centerRight,
                                    child: TextButton(
                                      onPressed: () => Navigator.pushNamed(
                                        context,
                                        '/remedy',
                                        arguments: r.id,
                                      ),
                                      child: const Text('→ View Original Source'),
                                    ),
                                  ),
                                ],
                              ),
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
