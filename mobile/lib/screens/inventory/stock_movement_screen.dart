import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../models/item.dart';
import '../../models/location.dart';
import '../../providers/service_providers.dart';
import 'balances_screen.dart';

class StockMovementScreen extends ConsumerStatefulWidget {
  final String type;
  const StockMovementScreen({super.key, required this.type});

  @override
  ConsumerState<StockMovementScreen> createState() => _StockMovementScreenState();
}

class _StockMovementScreenState extends ConsumerState<StockMovementScreen> {
  String? _itemId;
  String? _sourceLocationId;
  String? _destinationLocationId;
  final _quantityController = TextEditingController();
  final _referenceController = TextEditingController();
  final _noteController = TextEditingController();
  final _reasonController = TextEditingController();
  bool _loading = false;

  List<Item> _items = [];
  List<Location> _locations = [];

  @override
  void initState() {
    super.initState();
    _loadData();
  }

  Future<void> _loadData() async {
    try {
      final items = await ref.read(itemsServiceProvider).getItems(pageSize: 100);
      final locations = await ref.read(locationsServiceProvider).getLocations();
      if (mounted) {
        setState(() {
          _items = items.data;
          _locations = locations;
        });
      }
    } catch (_) {}
  }

  @override
  void dispose() {
    _quantityController.dispose();
    _referenceController.dispose();
    _noteController.dispose();
    _reasonController.dispose();
    super.dispose();
  }

  String get _title {
    switch (widget.type) {
      case 'receipt': return 'Réception de stock';
      case 'issue': return 'Sortie de stock';
      case 'transfer': return 'Transfert de stock';
      case 'adjustment': return 'Ajustement de stock';
      default: return 'Mouvement';
    }
  }

  bool get _needsSource => widget.type == 'issue' || widget.type == 'transfer';
  bool get _needsDest => widget.type == 'receipt' || widget.type == 'transfer' || widget.type == 'return';

  Future<void> _submit() async {
    if (_itemId == null || _quantityController.text.isEmpty) {
      ScaffoldMessenger.of(context).showSnackBar(
        const SnackBar(content: Text('Article et quantité requis')),
      );
      return;
    }

    setState(() => _loading = true);
    try {
      final service = ref.read(inventoryServiceProvider);
      switch (widget.type) {
        case 'receipt':
          await service.receipt(
            itemId: _itemId!,
            destinationLocationId: _destinationLocationId!,
            quantity: _quantityController.text,
            reference: _referenceController.text,
            note: _noteController.text,
          );
        case 'issue':
          await service.issue(
            itemId: _itemId!,
            sourceLocationId: _sourceLocationId!,
            quantity: _quantityController.text,
            reference: _referenceController.text,
            note: _noteController.text,
          );
        case 'transfer':
          await service.transfer(
            itemId: _itemId!,
            sourceLocationId: _sourceLocationId!,
            destinationLocationId: _destinationLocationId!,
            quantity: _quantityController.text,
            reference: _referenceController.text,
            note: _noteController.text,
          );
        case 'adjustment':
          await service.adjustment(
            itemId: _itemId!,
            locationId: _sourceLocationId ?? _destinationLocationId ?? '',
            quantity: _quantityController.text,
            reason: _reasonController.text,
          );
      }
      ref.invalidate(balancesProvider);
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          const SnackBar(content: Text('Mouvement enregistré')),
        );
        context.go('/inventory');
      }
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: Text(_title)),
      body: ListView(
        padding: const EdgeInsets.all(16),
        children: [
          // Item selector
          DropdownButtonFormField<String>(
            value: _itemId,
            decoration: const InputDecoration(labelText: 'Article *'),
            items: _items
                .map((i) => DropdownMenuItem(
                      value: i.id,
                      child: Text('${i.name} (${i.sku})'),
                    ))
                .toList(),
            onChanged: (v) => setState(() => _itemId = v),
          ),
          const SizedBox(height: 12),

          // Source location
          if (_needsSource || widget.type == 'adjustment')
            DropdownButtonFormField<String>(
              value: _sourceLocationId,
              decoration: InputDecoration(
                labelText: widget.type == 'adjustment'
                    ? 'Emplacement *'
                    : 'Emplacement source *',
              ),
              items: _locations
                  .map((l) => DropdownMenuItem(value: l.id, child: Text(l.name)))
                  .toList(),
              onChanged: (v) => setState(() => _sourceLocationId = v),
            ),
          if (_needsSource || widget.type == 'adjustment')
            const SizedBox(height: 12),

          // Destination location
          if (_needsDest)
            DropdownButtonFormField<String>(
              value: _destinationLocationId,
              decoration: const InputDecoration(labelText: 'Emplacement destination *'),
              items: _locations
                  .map((l) => DropdownMenuItem(value: l.id, child: Text(l.name)))
                  .toList(),
              onChanged: (v) => setState(() => _destinationLocationId = v),
            ),
          if (_needsDest) const SizedBox(height: 12),

          // Quantity
          TextFormField(
            controller: _quantityController,
            decoration: const InputDecoration(labelText: 'Quantité *'),
            keyboardType: TextInputType.number,
          ),
          const SizedBox(height: 12),

          // Reason (adjustment only)
          if (widget.type == 'adjustment')
            TextFormField(
              controller: _reasonController,
              decoration: const InputDecoration(labelText: 'Raison *'),
            ),

          // Reference & note
          if (widget.type != 'adjustment') ...[
            TextFormField(
              controller: _referenceController,
              decoration: const InputDecoration(labelText: 'Référence'),
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _noteController,
              decoration: const InputDecoration(labelText: 'Note'),
              maxLines: 2,
            ),
          ],

          const SizedBox(height: 24),
          ElevatedButton(
            onPressed: _loading ? null : _submit,
            child: _loading
                ? const SizedBox(
                    height: 20, width: 20,
                    child: CircularProgressIndicator(strokeWidth: 2))
                : const Text('Enregistrer'),
          ),
        ],
      ),
    );
  }
}
