import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/asset.dart';
import '../../providers/service_providers.dart';
import '../../providers/org_provider.dart';

final assetsProvider = FutureProvider.autoDispose<List<Asset>>((ref) async {
  final org = ref.watch(orgProvider).current;
  if (org == null) throw Exception('No organization');
  return ref.read(assetsServiceProvider).getAssets();
});

class AssetsScreen extends ConsumerWidget {
  const AssetsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final assets = ref.watch(assetsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Équipements')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(assetsProvider),
        child: assets.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erreur: $e')),
          data: (data) {
            if (data.isEmpty) {
              return const Center(child: Text('Aucun équipement'));
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: data.length,
              itemBuilder: (context, index) {
                final a = data[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(
                      _statusIcon(a.status),
                      color: _statusColor(a.status),
                    ),
                    title: Text(a.serialNumber),
                    subtitle: Text(
                      a.assignedTo != null
                          ? 'Assigné à: ${a.assignedTo}'
                          : 'Statut: ${_statusLabel(a.status)}',
                    ),
                    trailing: PopupMenuButton<String>(
                      onSelected: (action) => _handleAction(context, ref, a, action),
                      itemBuilder: (ctx) => [
                        if (a.status == 'available')
                          const PopupMenuItem(value: 'assign', child: Text('Assigner')),
                        if (a.status == 'assigned')
                          const PopupMenuItem(value: 'return', child: Text('Retourner')),
                        if (a.status == 'available' || a.status == 'assigned')
                          const PopupMenuItem(value: 'maintenance', child: Text('Maintenance')),
                        if (a.status == 'maintenance')
                          const PopupMenuItem(value: 'available', child: Text('Disponible')),
                      ],
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
    );
  }

  IconData _statusIcon(String status) {
    switch (status) {
      case 'available': return Icons.check_circle_outline;
      case 'assigned': return Icons.person;
      case 'maintenance': return Icons.build;
      case 'rented': return Icons.key;
      default: return Icons.help_outline;
    }
  }

  Color _statusColor(String status) {
    switch (status) {
      case 'available': return Colors.green;
      case 'assigned': return Colors.blue;
      case 'maintenance': return Colors.orange;
      case 'rented': return Colors.purple;
      default: return Colors.grey;
    }
  }

  String _statusLabel(String status) {
    switch (status) {
      case 'available': return 'Disponible';
      case 'assigned': return 'Assigné';
      case 'maintenance': return 'Maintenance';
      case 'rented': return 'Loué';
      default: return status;
    }
  }

  void _handleAction(BuildContext context, WidgetRef ref, Asset asset, String action) async {
    final service = ref.read(assetsServiceProvider);
    try {
      switch (action) {
        case 'assign':
          final controller = TextEditingController();
          final result = await showDialog<String>(
            context: context,
            builder: (ctx) => AlertDialog(
              title: const Text('Assigner à'),
              content: TextField(
                controller: controller,
                decoration: const InputDecoration(labelText: 'Nom de la personne'),
              ),
              actions: [
                TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
                TextButton(
                  onPressed: () => Navigator.pop(ctx, controller.text.trim()),
                  child: const Text('Assigner'),
                ),
              ],
            ),
          );
          if (result != null && result.isNotEmpty) {
            await service.assignAsset(asset.id, result);
          }
        case 'return':
          await service.returnAsset(asset.id);
        case 'maintenance':
          await service.maintenanceAsset(asset.id);
        case 'available':
          await service.availableAsset(asset.id);
      }
      ref.invalidate(assetsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }
}
