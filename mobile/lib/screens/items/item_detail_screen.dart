import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/item.dart';
import '../../providers/service_providers.dart';
import 'items_list_screen.dart';

class ItemDetailScreen extends ConsumerWidget {
  final String id;
  const ItemDetailScreen({super.key, required this.id});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final itemsAsync = ref.watch(itemsProvider);
    final colorScheme = Theme.of(context).colorScheme;

    return itemsAsync.when(
      loading: () => const Scaffold(
        body: Center(child: CircularProgressIndicator()),
      ),
      error: (e, _) => Scaffold(
        appBar: AppBar(),
        body: Center(child: Text('Erreur: $e')),
      ),
      data: (data) {
        final item = data.data.where((i) => i.id == id).firstOrNull;
        if (item == null) {
          return Scaffold(
            appBar: AppBar(),
            body: const Center(child: Text('Article introuvable')),
          );
        }

        return Scaffold(
          body: CustomScrollView(
            slivers: [
              // Image header
              SliverAppBar(
                expandedHeight: item.imageUrl != null ? 250 : 0,
                pinned: true,
                flexibleSpace: item.imageUrl != null
                    ? FlexibleSpaceBar(
                        background: CachedNetworkImage(
                          imageUrl: item.imageUrl!,
                          fit: BoxFit.cover,
                          placeholder: (_, __) => Container(
                            color: Colors.grey.shade200,
                            child: const Center(child: CircularProgressIndicator()),
                          ),
                          errorWidget: (_, __, ___) => Container(
                            color: Colors.grey.shade200,
                            child: const Icon(Icons.broken_image, size: 48),
                          ),
                        ),
                      )
                    : null,
                actions: [
                  IconButton(
                    icon: const Icon(Icons.edit),
                    onPressed: () => context.go('/items/$id/edit'),
                  ),
                  IconButton(
                    icon: const Icon(Icons.delete_outline),
                    onPressed: () => _confirmDelete(context, ref, item),
                  ),
                ],
              ),
              SliverPadding(
                padding: const EdgeInsets.all(16),
                sliver: SliverList(
                  delegate: SliverChildListDelegate([
                    Text(item.name,
                        style: Theme.of(context).textTheme.headlineSmall?.copyWith(
                              fontWeight: FontWeight.bold,
                            )),
                    const SizedBox(height: 4),
                    Text('SKU: ${item.sku}',
                        style: Theme.of(context).textTheme.bodyLarge?.copyWith(
                              color: colorScheme.onSurfaceVariant,
                            )),
                    if (item.description.isNotEmpty) ...[
                      const SizedBox(height: 12),
                      Text(item.description),
                    ],
                    const SizedBox(height: 24),
                    // Info cards
                    _InfoRow(label: 'Type', value: item.itemType),
                    _InfoRow(label: 'Mode de suivi', value: item.trackingMode),
                    _InfoRow(label: 'Unité', value: item.unit),
                    _InfoRow(label: 'Prix d\'achat', value: '${item.purchasePrice} MAD'),
                    _InfoRow(label: 'Prix de vente', value: '${item.salePrice} MAD'),
                    _InfoRow(label: 'Seuil d\'alerte', value: item.lowStockThreshold),
                    _InfoRow(
                      label: 'Statut',
                      value: item.isActive ? 'Actif' : 'Archivé',
                      valueColor: item.isActive ? Colors.green : Colors.grey,
                    ),
                    const SizedBox(height: 24),
                    // Quick action buttons
                    Row(
                      children: [
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => context.go('/inventory/move/receipt'),
                            icon: const Icon(Icons.arrow_downward),
                            label: const Text('Réception'),
                          ),
                        ),
                        const SizedBox(width: 8),
                        Expanded(
                          child: OutlinedButton.icon(
                            onPressed: () => context.go('/inventory/move/issue'),
                            icon: const Icon(Icons.arrow_upward),
                            label: const Text('Sortie'),
                          ),
                        ),
                      ],
                    ),
                  ]),
                ),
              ),
            ],
          ),
        );
      },
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Item item) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer l\'article ?'),
        content: Text('Voulez-vous supprimer "${item.name}" ?'),
        actions: [
          TextButton(
            onPressed: () => Navigator.pop(ctx),
            child: const Text('Annuler'),
          ),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(itemsServiceProvider).deleteItem(item.id);
                ref.invalidate(itemsProvider);
                if (context.mounted) context.go('/items');
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erreur: $e')),
                  );
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final String label;
  final String value;
  final Color? valueColor;

  const _InfoRow({required this.label, required this.value, this.valueColor});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 8),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(label,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  )),
          Text(value,
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                    color: valueColor,
                  )),
        ],
      ),
    );
  }
}
