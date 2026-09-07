/// Synthesis Repertory Screen - 180,386 rubrics
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';
import '../../data/models/models.dart';
import '../../data/services/api_client.dart';

class SynthesisScreen extends StatefulWidget {
  const SynthesisScreen({super.key});

  @override
  State<SynthesisScreen> createState() => _SynthesisScreenState();
}

class _SynthesisScreenState extends State<SynthesisScreen> {
  final _searchController = TextEditingController();
  List<Rubric> _rubrics = [];
  bool _isLoading = false;
  String? _error;
  String _selectedChapter = 'Mind';

  static const List<String> chapters = [
    'Mind', 'Vertigo', 'Head', 'Eye', 'Vision', 'Ear', 'Hearing',
    'Nose', 'Face', 'Mouth', 'Teeth', 'Throat', 'Stomach', 'Abdomen',
    'Rectum', 'Stool', 'Urinary', 'Genitalia', 'Larynx', 'Respiration',
    'Cough', 'Chest', 'Back', 'Extremities', 'Sleep', 'Dreams',
    'Fever', 'Skin', 'Generalities',
  ];

  @override
  void initState() {
    super.initState();
    _loadRubrics();
  }

  Future<void> _loadRubrics() async {
    setState(() {
      _isLoading = true;
      _error = null;
    });
    try {
      final response = await ApiClient().get(
        'https://pradips-homoe.vercel.app/api/synthesis',
        queryParameters: {'chapter': _selectedChapter, 'limit': '50'},
      );
      final results = response['results'] as List<dynamic>? ?? [];
      _rubrics = results.map((e) => Rubric.fromJson(e as Map<String, dynamic>)).toList();
    } catch (e) {
      _error = e.toString().replaceFirst('Exception: ', '');
    } finally {
      setState(() => _isLoading = false);
    }
  }

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      children: [
        // Header info
        Container(
          padding: const EdgeInsets.all(12),
          color: AppColors.primary.withAlpha(20),
          child: Row(
            children: [
              const Icon(Icons.hub, color: AppColors.primary, size: 20),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Synthesis Repertory - 180,386 rubrics',
                  style: Theme.of(context).textTheme.titleSmall,
                ),
              ),
            ],
          ),
        ),

        // Chapter selector
        SizedBox(
          height: 50,
          child: ListView.builder(
            scrollDirection: Axis.horizontal,
            padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 8),
            itemCount: chapters.length,
            itemBuilder: (_, i) {
              final c = chapters[i];
              final selected = c == _selectedChapter;
              return Padding(
                padding: const EdgeInsets.only(right: 6),
                child: Material(
                  color: selected ? AppColors.primary : AppColors.surfaceVariant,
                  borderRadius: BorderRadius.circular(16),
                  child: InkWell(
                    onTap: () {
                      setState(() => _selectedChapter = c);
                      _loadRubrics();
                    },
                    borderRadius: BorderRadius.circular(16),
                    child: Padding(
                      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 6),
                      child: Text(
                        c,
                        style: TextStyle(
                          color: selected ? AppColors.textOnPrimary : AppColors.textSecondary,
                          fontSize: 12, fontWeight: FontWeight.w600,
                        ),
                      ),
                    ),
                  ),
                ),
              );
            },
          ),
        ),

        // Content
        Expanded(
          child: _isLoading
              ? const Center(child: CircularProgressIndicator())
              : _error != null
                  ? Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          const Icon(Icons.error_outline, color: AppColors.error, size: 48),
                          const SizedBox(height: 12),
                          Text(_error!, style: Theme.of(context).textTheme.bodySmall),
                          const SizedBox(height: 12),
                          ElevatedButton(onPressed: _loadRubrics, child: const Text('Retry')),
                        ],
                      ),
                    )
                  : _rubrics.isEmpty
                      ? Center(
                          child: Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              const Icon(Icons.library_books, size: 64, color: AppColors.textHint),
                              const SizedBox(height: 16),
                              Text('No rubrics in $_selectedChapter',
                                  style: Theme.of(context).textTheme.titleMedium),
                              const SizedBox(height: 8),
                              const Text('Try another chapter',
                                  style: TextStyle(color: AppColors.textHint)),
                            ],
                          ),
                        )
                      : ListView.builder(
                          padding: const EdgeInsets.all(8),
                          itemCount: _rubrics.length,
                          itemBuilder: (_, i) => _SynthesisRubricCard(rubric: _rubrics[i]),
                        ),
        ),
      ],
    );
  }
}

class _SynthesisRubricCard extends StatelessWidget {
  final Rubric rubric;
  const _SynthesisRubricCard({required this.rubric});

  @override
  Widget build(BuildContext context) {
    return Card(
      margin: const EdgeInsets.only(bottom: 8),
      child: ExpansionTile(
        tilePadding: const EdgeInsets.symmetric(horizontal: 12, vertical: 0),
        title: Text(
          rubric.main,
          style: Theme.of(context).textTheme.titleMedium?.copyWith(fontSize: 14),
          maxLines: 2, overflow: TextOverflow.ellipsis,
        ),
        subtitle: rubric.chapter.isNotEmpty
            ? Text(rubric.chapter, style: const TextStyle(fontSize: 11, color: AppColors.textHint))
            : null,
        children: [
          if (rubric.hasRemedies && rubric.remedies!.isNotEmpty)
            Padding(
              padding: const EdgeInsets.all(12),
              child: Wrap(
                spacing: 6, runSpacing: 6,
                children: rubric.remedies!.map((rg) {
                  final color = AppColors.getGradeColor(rg.grade);
                  return Container(
                    padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
                    decoration: BoxDecoration(
                      color: color.withAlpha(30),
                      borderRadius: BorderRadius.circular(6),
                      border: Border.all(color: color.withAlpha(120), width: 1),
                    ),
                    child: Text(
                      '${rg.name} (${rg.grade})',
                      style: TextStyle(
                        color: color, fontSize: 11, fontWeight: FontWeight.w600,
                      ),
                    ),
                  );
                }).toList(),
              ),
            )
          else
            const Padding(
              padding: EdgeInsets.all(12),
              child: Text('No remedy data', style: TextStyle(color: AppColors.textHint, fontSize: 12)),
            ),
        ],
      ),
    );
  }
}
