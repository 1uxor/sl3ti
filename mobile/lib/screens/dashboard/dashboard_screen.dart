import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/dashboard_summary.dart';
import '../../providers/service_providers.dart';
import '../../providers/org_provider.dart';

final dashboardProvider = FutureProvider.autoDispose<DashboardSummary>((ref) async {
  final org = ref.watch(orgProvider).current;
  if (org == null) throw Exception('No organization');
  return ref.read(dashboardServiceProvider).getSummary();
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final summary = ref.watch(dashboardProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return RefreshIndicator(
      onRefresh: () async => ref.invalidate(dashboardProvider),
      child: summary.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              const Icon(Icons.error_outline, size: 48),
              const SizedBox(height: 16),
              Text('Erreur: $e'),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () => ref.invalidate(dashboardProvider),
                child: const Text('Réessayer'),
              ),
            ],
          ),
        ),
        data: (data) => ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Stats cards
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: 'Articles',
                    value: '${data.totalItems}',
                    icon: Icons.inventory_2,
                    color: colorScheme.primary,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    title: 'Quantité totale',
                    value: data.totalQuantity,
                    icon: Icons.numbers,
                    color: Colors.green,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),
            Row(
              children: [
                Expanded(
                  child: _StatCard(
                    title: 'Valeur estimée',
                    value: '${data.estimatedValue} MAD',
                    icon: Icons.attach_money,
                    color: Colors.amber.shade700,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: _StatCard(
                    title: 'Stock bas',
                    value: '${data.lowStock.length}',
                    icon: Icons.warning_amber,
                    color: data.lowStock.isNotEmpty ? Colors.red : Colors.grey,
                  ),
                ),
              ],
            ),
            // Low stock alerts
            if (data.lowStock.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text('Alertes stock bas',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...data.lowStock.map((item) => Card(
                    child: ListTile(
                      leading: const Icon(Icons.warning_amber, color: Colors.orange),
                      title: Text(item.name),
                      subtitle: Text('Quantité: ${item.quantity} / Seuil: ${item.threshold}'),
                    ),
                  )),
            ],
            // Recent movements
            if (data.recentMovements.isNotEmpty) ...[
              const SizedBox(height: 24),
              Text('Mouvements récents',
                  style: Theme.of(context).textTheme.titleMedium),
              const SizedBox(height: 8),
              ...data.recentMovements.take(5).map((m) => Card(
                    child: ListTile(
                      leading: Icon(_movementIcon(m.movementType),
                          color: _movementColor(m.movementType)),
                      title: Text(m.itemName),
                      subtitle: Text('${_movementLabel(m.movementType)} - Qté: ${m.quantity}'),
                      trailing: Text(
                        m.createdAt.substring(0, 10),
                        style: Theme.of(context).textTheme.bodySmall,
                      ),
                    ),
                  )),
            ],
          ],
        ),
      ),
    );
  }

  IconData _movementIcon(String type) {
    switch (type) {
      case 'RECEIPT': return Icons.arrow_downward;
      case 'ISSUE': return Icons.arrow_upward;
      case 'TRANSFER': return Icons.swap_horiz;
      case 'RETURN': return Icons.undo;
      default: return Icons.tune;
    }
  }

  Color _movementColor(String type) {
    switch (type) {
      case 'RECEIPT': return Colors.green;
      case 'ISSUE': return Colors.red;
      case 'TRANSFER': return Colors.blue;
      case 'RETURN': return Colors.orange;
      default: return Colors.grey;
    }
  }

  String _movementLabel(String type) {
    switch (type) {
      case 'RECEIPT': return 'Réception';
      case 'ISSUE': return 'Sortie';
      case 'TRANSFER': return 'Transfert';
      case 'RETURN': return 'Retour';
      case 'ADJUSTMENT_IN': return 'Ajustement +';
      case 'ADJUSTMENT_OUT': return 'Ajustement -';
      default: return type;
    }
  }
}

class _StatCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _StatCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Icon(icon, color: color, size: 28),
            const SizedBox(height: 12),
            Text(
              value,
              style: Theme.of(context).textTheme.titleLarge?.copyWith(
                    fontWeight: FontWeight.bold,
                  ),
              maxLines: 1,
              overflow: TextOverflow.ellipsis,
            ),
            const SizedBox(height: 4),
            Text(
              title,
              style: Theme.of(context).textTheme.bodySmall?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
          ],
        ),
      ),
    );
  }
}
