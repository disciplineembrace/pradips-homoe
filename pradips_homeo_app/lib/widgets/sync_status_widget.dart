/// SyncStatusWidget - shows current sync status, online/offline indicator
import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../../core/theme/app_colors.dart';
import '../../data/sync/sync_service.dart';
import '../../features/sync/sync_provider.dart';

class SyncStatusWidget extends StatelessWidget {
  final bool compact;
  const SyncStatusWidget({super.key, this.compact = false});

  @override
  Widget build(BuildContext context) {
    final sync = context.watch<SyncProvider>();

    if (compact) {
      return _buildCompact(context, sync);
    }
    return _buildFull(context, sync);
  }

  Widget _buildCompact(BuildContext context, SyncProvider sync) {
    final isOnline = sync.isOnline;
    final isSyncing = sync.isSyncing;
    final color = !isOnline
        ? AppColors.warning
        : isSyncing
            ? AppColors.info
            : AppColors.success;

    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withAlpha(30),
        borderRadius: BorderRadius.circular(12),
        border: Border.all(color: color.withAlpha(120), width: 0.5),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          if (isSyncing)
            SizedBox(
              width: 12, height: 12,
              child: CircularProgressIndicator(
                strokeWidth: 1.5, valueColor: AlwaysStoppedAnimation<Color>(color),
              ),
            )
          else
            Icon(isOnline ? Icons.cloud_done : Icons.cloud_off, size: 14, color: color),
          const SizedBox(width: 4),
          Text(
            !isOnline ? 'Offline' : isSyncing ? 'Syncing...' : 'Synced',
            style: TextStyle(
              color: color, fontSize: 10, fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildFull(BuildContext context, SyncProvider sync) {
    final isOnline = sync.isOnline;
    final isSyncing = sync.isSyncing;
    final status = sync.status;
    final message = sync.message;

    Color color;
    IconData icon;
    String label;

    if (!isOnline) {
      color = AppColors.warning;
      icon = Icons.cloud_off;
      label = 'Offline Mode';
    } else if (isSyncing) {
      color = AppColors.info;
      icon = Icons.sync;
      label = 'Syncing...';
    } else if (status == SyncStatus.success) {
      color = AppColors.success;
      icon = Icons.cloud_done;
      label = 'All Synced';
    } else if (status == SyncStatus.failed) {
      color = AppColors.error;
      icon = Icons.sync_problem;
      label = 'Sync Failed';
    } else {
      color = AppColors.textHint;
      icon = Icons.cloud_queue;
      label = 'Not Synced';
    }

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(12),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                if (isSyncing)
                  SizedBox(
                    width: 20, height: 20,
                    child: CircularProgressIndicator(
                      strokeWidth: 2, valueColor: AlwaysStoppedAnimation<Color>(color),
                    ),
                  )
                else
                  Icon(icon, color: color, size: 20),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    label,
                    style: Theme.of(context).textTheme.titleMedium?.copyWith(
                          color: color, fontSize: 14,
                        ),
                  ),
                ),
                if (isOnline && !isSyncing)
                  IconButton(
                    icon: const Icon(Icons.refresh, size: 18),
                    onPressed: sync.syncNow,
                    tooltip: 'Sync now',
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
              ],
            ),
            if (message.isNotEmpty) ...[
              const SizedBox(height: 4),
              Text(
                message,
                style: Theme.of(context).textTheme.bodySmall?.copyWith(fontSize: 11),
              ),
            ],
            if (sync.lastSync != null) ...[
              const SizedBox(height: 4),
              Text(
                'Last sync: ${_formatDateTime(sync.lastSync!)}',
                style: Theme.of(context).textTheme.bodySmall?.copyWith(
                      fontSize: 10, color: AppColors.textHint,
                    ),
              ),
            ],
          ],
        ),
      ),
    );
  }

  String _formatDateTime(DateTime dt) {
    final now = DateTime.now();
    final diff = now.difference(dt);
    if (diff.inMinutes < 1) return 'just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    if (diff.inHours < 24) return '${diff.inHours}h ago';
    return '${diff.inDays}d ago';
  }
}
