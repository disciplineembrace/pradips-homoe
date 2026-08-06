/// Sync progress bar — shows sync progress when active.
///
/// Subscribes to SyncEngine.progressStream and displays a linear
/// progress indicator with entity name and percent.
/// No placeholders — fully wired to the sync engine.
library;

import 'dart:async';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../providers.dart';
import '../sync/sync_engine.dart';

class SyncProgressBar extends ConsumerStatefulWidget {
  const SyncProgressBar({super.key});

  @override
  ConsumerState<SyncProgressBar> createState() => _SyncProgressBarState();
}

class _SyncProgressBarState extends ConsumerState<SyncProgressBar> {
  SyncProgress? _progress;
  StreamSubscription<SyncProgress>? _subscription;

  @override
  void initState() {
    super.initState();
    // Subscribe to sync progress stream from the SyncEngine.
    final syncEngine = ref.read(syncEngineProvider);
    _subscription = syncEngine.progressStream.listen((progress) {
      if (mounted) {
        setState(() => _progress = progress);
      }
    });
  }

  @override
  void dispose() {
    _subscription?.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    if (_progress == null || _progress!.status == 'complete') {
      return const SizedBox.shrink();
    }

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 4),
      child: Column(
        children: [
          Row(
            children: [
              const SizedBox(
                width: 12,
                height: 12,
                child: CircularProgressIndicator(strokeWidth: 2),
              ),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Syncing ${_progress!.entityType}...',
                  style: const TextStyle(fontSize: 11),
                ),
              ),
              Text(
                '${(_progress!.percent * 100).toInt()}%',
                style: const TextStyle(fontSize: 11),
              ),
            ],
          ),
          const SizedBox(height: 4),
          LinearProgressIndicator(
            value: _progress!.percent,
            minHeight: 2,
          ),
          if (_progress!.message != null)
            Padding(
              padding: const EdgeInsets.only(top: 2),
              child: Text(
                _progress!.message!,
                style: TextStyle(
                  fontSize: 10,
                  color: _progress!.status == 'error' ? Colors.red : Colors.grey,
                ),
              ),
            ),
        ],
      ),
    );
  }
}
