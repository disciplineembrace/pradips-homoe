import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class AboutScreen extends StatefulWidget {
  const AboutScreen({super.key});

  @override
  State<AboutScreen> createState() => _AboutScreenState();
}

class _AboutScreenState extends State<AboutScreen> {
  List<dynamic> _results = [];
  bool _isLoading = false;
  final _searchController = TextEditingController();
  String _selectedAuthor = 'Kent';
  final _authors = ['Kent', 'Phatak', 'Murphy', 'Boericke'];

  Future<void> _search() async {
    if (_searchController.text.isEmpty) return;
    setState(() => _isLoading = true);
    final api = context.read<ApiService>();
    
    Map<String, dynamic> result;
    if ('about' == 'repertory') {
      result = await api.getRubricTree(author: _selectedAuthor, q: _searchController.text, pageSize: 50);
    } else if ('about' == 'search') {
      result = await api.search(_searchController.text);
    } else {
      result = {};
    }
    
    setState(() {
      _results = result['items'] ?? result['results'] ?? [];
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.all(12),
      child: Column(
        children: [
          TextField(
            controller: _searchController,
            decoration: InputDecoration(
              hintText: 'Search...',
              prefixIcon: const Icon(Icons.search),
              suffixIcon: IconButton(
                icon: const Icon(Icons.send),
                onPressed: _search,
              ),
            ),
            onSubmitted: (_) => _search(),
          ),
          if ('about' == 'repertory') ...[
            const SizedBox(height: 8),
            Wrap(
              spacing: 8,
              children: _authors.map((a) => ChoiceChip(
                label: Text(a),
                selected: _selectedAuthor == a,
                onSelected: (_) => setState(() => _selectedAuthor = a),
              )).toList(),
            ),
          ],
          const SizedBox(height: 12),
          if (_isLoading)
            const Expanded(child: Center(child: CircularProgressIndicator()))
          else if (_results.isEmpty)
            Expanded(child: Center(child: Text('No results', style: TextStyle(color: Colors.grey[400]))))
          else
            Expanded(
              child: ListView.builder(
                itemCount: _results.length,
                itemBuilder: (context, i) {
                  final r = _results[i];
                  return Card(
                    child: ListTile(
                      title: Text(r['name'] ?? r['title'] ?? r['main'] ?? '', style: const TextStyle(fontWeight: FontWeight.w500)),
                      subtitle: Text(r['author'] ?? r['chapter'] ?? '', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
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
