/// Organon Screen - Hahnemann's Organon of Medicine
/// Static content - aphorisms of homeopathy
import 'package:flutter/material.dart';
import '../../core/theme/app_colors.dart';

class OrganonScreen extends StatelessWidget {
  const OrganonScreen({super.key});

  static const List<Map<String, dynamic>> aphorisms = [
    {
      'number': 1,
      'title': 'The Physician\'s Mission',
      'text': 'The physician\'s high and only mission is to restore the sick to health, to cure, as it is termed.',
    },
    {
      'number': 2,
      'title': 'The Ideal Cure',
      'text': 'The highest ideal of cure is rapid, gentle and permanent restoration of the health, or removal and annihilation of the disease in its whole extent, in the shortest, most reliable, and most harmless way, on easily comprehensible principles.',
    },
    {
      'number': 3,
      'title': 'Knowledge of the Physician',
      'text': 'If the physician clearly perceives what is to be cured in diseases, that is to say, in every individual case of disease, if he clearly perceives what is curative in medicines, and knows how to adapt what is curative in medicines to what he has perceived to be diseased in the patient, then he understands how to apply judiciously what is curative in medicines to what is diseased in the patient.',
    },
    {
      'number': 9,
      'title': 'Vital Force',
      'text': 'In the healthy condition of man, the spiritual vital force, the dynamis that animates the material body, rules with unbounded sway, and retains all the parts of the organism in admirable, harmonious, vital operation.',
    },
    {
      'number': 26,
      'title': 'Law of Similars',
      'text': 'A weaker dynamic affection is permanently extinguished in the living organism by a stronger one, if the latter (though differing in kind) is very similar to the former in its manifestations.',
    },
    {
      'number': 27,
      'title': 'Nature\'s Law of Cure',
      'text': 'The curative power of medicines, therefore, depends on their symptoms, similar to the disease but superior to it in strength, according to the law of nature discovered by experience, that a weaker dynamic affection is permanently extinguished by a stronger one.',
    },
    {
      'number': 53,
      'title': 'Methods of Treatment',
      'text': 'There are only two principal methods of treatment: the one based on the principle of contraria contrariis, and the other on that of similia similibus. The first is the allopathic, the second the homeopathic.',
    },
    {
      'number': 71,
      'title': 'Three Points of Practice',
      'text': 'As the practice of homeopathy rests upon three points of equal importance, namely: (1) the investigation of the tools destined for the cure of disease; (2) the investigation of the disease; (3) the application of the remedies to the disease.',
    },
    {
      'number': 100,
      'title': 'Investigating Epidemic Diseases',
      'text': 'In investigating the totality of symptoms of epidemics and sporadic diseases, the physician must consider each individual case as if it were a new and unknown disease.',
    },
    {
      'number': 153,
      'title': 'Striking Symptoms',
      'text': 'In the search for a homeopathic specific remedy, the more striking, singular, uncommon and peculiar signs and symptoms of the case are chiefly and almost solely to be kept in view.',
    },
    {
      'number': 211,
      'title': 'Mental & Emotional State',
      'text': 'The state of the disposition of the patient often chiefly determines the choice of the homeopathic remedy, as being a very decided symptom.',
    },
    {
      'number': 271,
      'title': 'Minimum Dose',
      'text': 'The dose of the medicine that experience teaches us to be the most suitable, is the smallest dose in dynamic practice.',
    },
    {
      'number': 282,
      'title': 'Spiritual Influence',
      'text': 'The dynamization of medicines is effected by triturating, shaking, etc., and it is in this way that the spiritual power of the medicines is developed.',
    },
    {
      'number': 291,
      'title': 'Olfaction',
      'text': 'Even the olfactory sense of the physician may be excited by certain medicines, but this mode of administration is not suitable for all.',
    },
  ];

  @override
  Widget build(BuildContext context) {
    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: aphorisms.length,
      itemBuilder: (context, i) {
        final a = aphorisms[i];
        return Card(
          margin: const EdgeInsets.only(bottom: 12),
          child: Padding(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Row(
                  children: [
                    Container(
                      width: 40, height: 40,
                      decoration: BoxDecoration(
                        color: AppColors.primary,
                        borderRadius: BorderRadius.circular(10),
                      ),
                      child: Center(
                        child: Text(
                          '§${a['number']}',
                          style: const TextStyle(
                            color: AppColors.textOnPrimary,
                            fontWeight: FontWeight.bold, fontSize: 11,
                          ),
                        ),
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Text(
                        a['title'],
                        style: Theme.of(context).textTheme.titleMedium,
                      ),
                    ),
                  ],
                ),
                const SizedBox(height: 12),
                Container(
                  padding: const EdgeInsets.all(12),
                  decoration: BoxDecoration(
                    color: AppColors.surfaceVariant.withAlpha(80),
                    borderRadius: BorderRadius.circular(8),
                    border: Border(
                      left: BorderSide(color: AppColors.accent, width: 3),
                    ),
                  ),
                  child: Text(
                    a['text'],
                    style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                          height: 1.6, fontStyle: FontStyle.italic,
                        ),
                  ),
                ),
              ],
            ),
          ),
        );
      },
    );
  }
}
