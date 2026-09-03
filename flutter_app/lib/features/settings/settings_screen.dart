/// Settings screen — sync, storage, about.
library;

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';

import '../../providers.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final connectivity = ref.watch(connectivityProvider);
    final repo = ref.watch(authRepositoryProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Settings')),
      body: ListView(
        children: [
          // Sync status
          ListTile(
            leading: Icon(connectivity.isOnline ? Icons.cloud_done : Icons.cloud_off),
            title: const Text('Connection'),
            subtitle: Text(connectivity.isOnline ? 'Online' : 'Offline'),
          ),
          ListTile(
            leading: const Icon(Icons.sync),
            title: const Text('Sync Now'),
            subtitle: const Text('Manually trigger synchronization'),
            onTap: () {
              ref.read(syncEngineProvider).sync();
              ScaffoldMessenger.of(context).showSnackBar(
                const SnackBar(content: Text('Sync started...')),
              );
            },
          ),
          const Divider(),
          // User info
          if (repo.currentUser != null) ...[
            ListTile(
              leading: const Icon(Icons.person),
              title: Text(repo.currentUser!.name),
              subtitle: Text(repo.currentUser!.email),
            ),
            ListTile(
              leading: const Icon(Icons.badge),
              title: const Text('Role'),
              subtitle: Text(repo.currentUser!.role),
            ),
          ],
          const Divider(),
          // About
          const ListTile(
            leading: Icon(Icons.info),
            title: Text('About'),
            subtitle: Text("Pradip's Homeo v1.0.0\nOffline-first homoeopathy library"),
          ),
          const Divider(),
          // Logout
          ListTile(
            leading: const Icon(Icons.logout, color: Colors.red),
            title: const Text('Logout', style: TextStyle(color: Colors.red)),
            onTap: () async {
              await repo.logout();
              if (context.mounted) {
                Navigator.pushReplacementNamed(context, '/login');
              }
            },
          ),
        ],
      ),
    );
  }
}
