import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../services/api_service.dart';
import '../theme/app_theme.dart';

class MateriaMedicaScreen extends StatefulWidget {
  const MateriaMedicaScreen({super.key});

  @override
  State<MateriaMedicaScreen> createState() => _MateriaMedicaScreenState();
}

class _MateriaMedicaScreenState extends State<MateriaMedicaScreen> {
  String _selectedAuthor = '';
  final _authors = ['', 'Murphy', 'Boericke', 'Phatak', 'Kent', 'Allen', 'Sankaran', 'Boeger', 'Dubey', 'Mathur', 'Farrington'];
  List<dynamic> _remedies = [];
  bool _isLoading = false;
  int _total = 0;

  Future<void> _loadRemedies() async {
    setState(() => _isLoading = true);
    final api = context.read<ApiService>();
    final result = await api.getRemedies(author: _selectedAuthor, pageSize: 100);
    setState(() {
      _remedies = result['items'] ?? [];
      _total = result['total'] ?? 0;
      _isLoading = false;
    });
  }

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) => _loadRemedies());
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Author filter
        Container(
          height: 50,
          padding: const EdgeInsets.symmetric(horizontal: 12),
          child: ListView(
            scrollDirection: Axis.horizontal,
            children: _authors.map((a) {
              final isSelected = _selectedAuthor == a;
              return Padding(
                padding: const EdgeInsets.only(right: 8),
                child: FilterChip(
                  label: Text(a.isEmpty ? 'All' : a),
                  selected: isSelected,
                  onSelected: (_) {
                    setState(() => _selectedAuthor = a);
                    _loadRemedies();
                  },
                  selectedColor: AppTheme.primaryGreen,
                  labelStyle: TextStyle(color: isSelected ? Colors.white : Colors.black54),
                ),
              );
            }).toList(),
          ),
        ),
        if (_isLoading)
          const Expanded(child: Center(child: CircularProgressIndicator()))
        else
          Expanded(
            child: ListView.builder(
              padding: const EdgeInsets.all(12),
              itemCount: _remedies.length,
              itemBuilder: (context, i) {
                final r = _remedies[i];
                return Card(
                  child: ListTile(
                    title: Text(r['name'] ?? '', style: const TextStyle(fontWeight: FontWeight.w600)),
                    subtitle: Text(r['author'] ?? '', style: TextStyle(fontSize: 12, color: Colors.grey[600])),
                    trailing: Text(r['letter'] ?? '', style: TextStyle(color: AppTheme.gold, fontWeight: FontWeight.bold)),
                    onTap: () {
                      Navigator.push(context, MaterialPageRoute(
                        builder: (_) => RemedyDetailScreen(remedyId: r['id'], remedyName: r['name']),
                      ));
                    },
                  ),
                );
              },
            ),
          ),
      ],
    );
  }
}

class RemedyDetailScreen extends StatefulWidget {
  final String remedyId;
  final String remedyName;
  
  const RemedyDetailScreen({super.key, required this.remedyId, required this.remedyName});

  @override
  State<RemedyDetailScreen> createState() => _RemedyDetailScreenState();
}

class _RemedyDetailScreenState extends State<RemedyDetailScreen> {
  Map<String, dynamic>? _remedy;
  bool _isLoading = true;

  @override
  void initState() {
    super.initState();
    _loadRemedy();
  }

  Future<void> _loadRemedy() async {
    final api = context.read<ApiService>();
    final result = await api.getRemedy(widget.remedyId);
    setState(() {
      _remedy = result;
      _isLoading = false;
    });
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(widget.remedyName)),
      body: _isLoading
          ? const Center(child: CircularProgressIndicator())
          : SingleChildScrollView(
              padding: const EdgeInsets.all(16),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Text(_remedy?['name'] ?? '', style: Theme.of(context).textTheme.headlineMedium),
                  if (_remedy?['common'] != null)
                    Text(_remedy!['common'], style: TextStyle(color: Colors.grey[600], fontStyle: FontStyle.italic)),
                  const SizedBox(height: 16),
                  if (_remedy?['keynote'] != null) ...[
                    const Text('Keynote', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.darkMaroon, fontSize: 18)),
                    const SizedBox(height: 4),
                    Text(_remedy!['keynote'], style: const TextStyle(fontSize: 15)),
                    const SizedBox(height: 16),
                  ],
                  if (_remedy?['full'] != null) ...[
                    const Text('Full Description', style: TextStyle(fontWeight: FontWeight.bold, color: AppTheme.darkMaroon, fontSize: 18)),
                    const SizedBox(height: 4),
                    Text(_remedy!['full'], style: const TextStyle(fontSize: 15, height: 1.6)),
                  ],
                ],
              ),
            ),
    );
  }
}
