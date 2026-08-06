/// Offline indicator — small banner shown when device is offline.
///
/// Non-intrusive: appears at top of screen, dismissible.
/// Does not repeatedly show intrusive network-error dialogs.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';

class OfflineIndicator extends ConsumerWidget {
  const OfflineIndicator({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivity = ref.watch(connectivityProvider);

    if (connectivity.isOnline) return const SizedBox.shrink();

    return Container(
      width: double.infinity,
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      color: Colors.orange.shade100,
      child: Row(
        children: [
          Icon(Icons.cloud_off, size: 16, color: Colors.orange.shade800),
          const SizedBox(width: 8),
          Expanded(
            child: Text(
              'Offline — showing synced content',
              style: TextStyle(
                fontSize: 12,
                color: Colors.orange.shade900,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
