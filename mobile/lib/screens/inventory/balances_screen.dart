import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/stock_balance.dart';
import '../../providers/service_providers.dart';
import '../../providers/org_provider.dart';

final balancesProvider = FutureProvider.autoDispose<List<StockBalance>>((ref) async {
  final org = ref.watch(orgProvider).current;
  if (org == null) throw Exception('No organization');
  return ref.read(inventoryServiceProvider).getBalances();
});

class BalancesScreen extends ConsumerWidget {
  const BalancesScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final balances = ref.watch(balancesProvider);

    return Scaffold(
      body: Column(
        children: [
          // Action buttons
          Padding(
            padding: const EdgeInsets.all(16),
            child: Wrap(
              spacing: 8,
              runSpacing: 8,
              children: [
                _ActionChip(
                  icon: Icons.arrow_downward,
                  label: 'Réception',
                  color: Colors.green,
                  onTap: () => context.go('/inventory/move/receipt'),
                ),
                _ActionChip(
                  icon: Icons.arrow_upward,
                  label: 'Sortie',
                  color: Colors.red,
                  onTap: () => context.go('/inventory/move/issue'),
                ),
                _ActionChip(
                  icon: Icons.swap_horiz,
                  label: 'Transfert',
                  color: Colors.blue,
                  onTap: () => context.go('/inventory/move/transfer'),
                ),
                _ActionChip(
                  icon: Icons.tune,
                  label: 'Ajustement',
                  color: Colors.orange,
                  onTap: () => context.go('/inventory/move/adjustment'),
                ),
              ],
            ),
          ),
          const Divider(height: 1),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async => ref.invalidate(balancesProvider),
              child: balances.when(
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Center(child: Text('Erreur: $e')),
                data: (data) {
                  if (data.isEmpty) {
                    return const Center(
                      child: Column(
                        mainAxisAlignment: MainAxisAlignment.center,
                        children: [
                          Icon(Icons.warehouse_outlined, size: 64, color: Colors.grey),
                          SizedBox(height: 16),
                          Text('Aucun stock'),
                        ],
                      ),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: data.length,
                    itemBuilder: (context, index) {
                      final b = data[index];
                      return Card(
                        margin: const EdgeInsets.only(bottom: 8),
                        child: ListTile(
                          title: Text(b.itemName,
                              style: const TextStyle(fontWeight: FontWeight.w600)),
                          subtitle: Text('${b.locationName} - SKU: ${b.sku}'),
                          trailing: Text(
                            b.quantity,
                            style: Theme.of(context).textTheme.titleMedium?.copyWith(
                                  fontWeight: FontWeight.bold,
                                ),
                          ),
                        ),
                      );
                    },
                  );
                },
              ),
            ),
          ),
        ],
      ),
    );
  }
}

class _ActionChip extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _ActionChip({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return ActionChip(
      avatar: Icon(icon, size: 18, color: color),
      label: Text(label),
      onPressed: onTap,
    );
  }
}
