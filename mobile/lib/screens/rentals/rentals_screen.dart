import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/rental.dart';
import '../../providers/service_providers.dart';
import '../../providers/org_provider.dart';

final rentalsProvider = FutureProvider.autoDispose<List<Rental>>((ref) async {
  final org = ref.watch(orgProvider).current;
  if (org == null) throw Exception('No organization');
  return ref.read(rentalsServiceProvider).getRentals();
});

class RentalsScreen extends ConsumerWidget {
  const RentalsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final rentals = ref.watch(rentalsProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Locations')),
      body: RefreshIndicator(
        onRefresh: () async => ref.invalidate(rentalsProvider),
        child: rentals.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erreur: $e')),
          data: (data) {
            if (data.isEmpty) {
              return const Center(child: Text('Aucune location'));
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: data.length,
              itemBuilder: (context, index) {
                final r = data[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: Icon(
                      _statusIcon(r.status),
                      color: _statusColor(r.status, r.overdue),
                    ),
                    title: Text('Location #${r.id.substring(0, 8)}'),
                    subtitle: Text(
                      '${r.startDate.substring(0, 10)} → ${r.expectedReturnDate.substring(0, 10)}'
                      '${r.overdue ? ' (En retard)' : ''}',
                    ),
                    trailing: PopupMenuButton<String>(
                      onSelected: (action) => _handleAction(context, ref, r, action),
                      itemBuilder: (ctx) => [
                        if (r.status == 'reserved')
                          const PopupMenuItem(value: 'activate', child: Text('Activer')),
                        if (r.status == 'active')
                          const PopupMenuItem(value: 'return', child: Text('Retourner')),
                        if (r.status == 'reserved')
                          const PopupMenuItem(value: 'cancel', child: Text('Annuler')),
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
      case 'reserved': return Icons.schedule;
      case 'active': return Icons.play_arrow;
      case 'returned': return Icons.check;
      case 'cancelled': return Icons.close;
      default: return Icons.help_outline;
    }
  }

  Color _statusColor(String status, bool overdue) {
    if (overdue) return Colors.red;
    switch (status) {
      case 'reserved': return Colors.blue;
      case 'active': return Colors.green;
      case 'returned': return Colors.grey;
      case 'cancelled': return Colors.grey;
      default: return Colors.grey;
    }
  }

  void _handleAction(BuildContext context, WidgetRef ref, Rental rental, String action) async {
    try {
      final service = ref.read(rentalsServiceProvider);
      switch (action) {
        case 'activate':
          await service.activateRental(rental.id);
        case 'return':
          await service.returnRental(rental.id);
        case 'cancel':
          await service.cancelRental(rental.id);
      }
      ref.invalidate(rentalsProvider);
    } catch (e) {
      if (context.mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    }
  }
}
