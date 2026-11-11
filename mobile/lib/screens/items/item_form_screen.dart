import 'dart:io';
import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:image_picker/image_picker.dart';
import 'package:cached_network_image/cached_network_image.dart';
import '../../models/item.dart';
import '../../models/category.dart';
import '../../providers/service_providers.dart';
import 'items_list_screen.dart';

class ItemFormScreen extends ConsumerStatefulWidget {
  final String? id;
  const ItemFormScreen({super.key, this.id});

  @override
  ConsumerState<ItemFormScreen> createState() => _ItemFormScreenState();
}

class _ItemFormScreenState extends ConsumerState<ItemFormScreen> {
  final _formKey = GlobalKey<FormState>();
  final _skuController = TextEditingController();
  final _nameController = TextEditingController();
  final _descController = TextEditingController();
  final _unitController = TextEditingController(text: 'unité');
  final _purchasePriceController = TextEditingController(text: '0');
  final _salePriceController = TextEditingController(text: '0');
  final _thresholdController = TextEditingController(text: '0');
  String _trackingMode = 'BULK';
  String? _categoryId;
  bool _isActive = true;
  File? _imageFile;
  String? _existingImageUrl;
  bool _loading = false;
  bool _initialized = false;
  List<Category> _categories = [];

  bool get isEditing => widget.id != null;

  @override
  void initState() {
    super.initState();
    _loadCategories();
  }

  Future<void> _loadCategories() async {
    try {
      _categories = await ref.read(itemsServiceProvider).getCategories();
      if (mounted) setState(() {});
    } catch (_) {}
  }

  void _initFromItem(Item item) {
    if (_initialized) return;
    _initialized = true;
    _skuController.text = item.sku;
    _nameController.text = item.name;
    _descController.text = item.description;
    _unitController.text = item.unit;
    _purchasePriceController.text = item.purchasePrice;
    _salePriceController.text = item.salePrice;
    _thresholdController.text = item.lowStockThreshold;
    _trackingMode = item.trackingMode;
    _categoryId = item.categoryId;
    _isActive = item.isActive;
    _existingImageUrl = item.imageUrl;
  }

  @override
  void dispose() {
    _skuController.dispose();
    _nameController.dispose();
    _descController.dispose();
    _unitController.dispose();
    _purchasePriceController.dispose();
    _salePriceController.dispose();
    _thresholdController.dispose();
    super.dispose();
  }

  Future<void> _pickImage() async {
    final picker = ImagePicker();
    final source = await showModalBottomSheet<ImageSource>(
      context: context,
      builder: (ctx) => SafeArea(
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            ListTile(
              leading: const Icon(Icons.camera_alt),
              title: const Text('Caméra'),
              onTap: () => Navigator.pop(ctx, ImageSource.camera),
            ),
            ListTile(
              leading: const Icon(Icons.photo_library),
              title: const Text('Galerie'),
              onTap: () => Navigator.pop(ctx, ImageSource.gallery),
            ),
          ],
        ),
      ),
    );
    if (source == null) return;

    final picked = await picker.pickImage(source: source, maxWidth: 1024, imageQuality: 85);
    if (picked != null) {
      setState(() => _imageFile = File(picked.path));
    }
  }

  Future<void> _save() async {
    if (!_formKey.currentState!.validate()) return;
    setState(() => _loading = true);

    try {
      final service = ref.read(itemsServiceProvider);
      final data = {
        'sku': _skuController.text.trim(),
        'name': _nameController.text.trim(),
        'description': _descController.text.trim(),
        'item_type': 'product',
        'tracking_mode': _trackingMode,
        'unit': _unitController.text.trim(),
        'purchase_price': _purchasePriceController.text.trim(),
        'sale_price': _salePriceController.text.trim(),
        'low_stock_threshold': _thresholdController.text.trim(),
        'category_id': _categoryId,
      };

      Item result;
      if (isEditing) {
        data['is_active'] = _isActive;
        result = await service.updateItem(widget.id!, data);
      } else {
        result = await service.createItem(data);
      }

      // Upload image if selected
      if (_imageFile != null) {
        await service.uploadImage(result.id, _imageFile!);
      }

      ref.invalidate(itemsProvider);
      if (mounted) context.go('/items/${result.id}');
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
    // If editing, try to get the item from the list
    if (isEditing) {
      final itemsAsync = ref.watch(itemsProvider);
      itemsAsync.whenData((data) {
        final item = data.data.where((i) => i.id == widget.id).firstOrNull;
        if (item != null) _initFromItem(item);
      });
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(isEditing ? 'Modifier l\'article' : 'Nouvel article'),
      ),
      body: Form(
        key: _formKey,
        child: ListView(
          padding: const EdgeInsets.all(16),
          children: [
            // Image picker
            GestureDetector(
              onTap: _pickImage,
              child: Container(
                height: 200,
                decoration: BoxDecoration(
                  color: Colors.grey.shade100,
                  borderRadius: BorderRadius.circular(12),
                  border: Border.all(color: Colors.grey.shade300),
                ),
                child: _imageFile != null
                    ? ClipRRect(
                        borderRadius: BorderRadius.circular(12),
                        child: Image.file(_imageFile!, fit: BoxFit.cover,
                            width: double.infinity),
                      )
                    : _existingImageUrl != null
                        ? ClipRRect(
                            borderRadius: BorderRadius.circular(12),
                            child: CachedNetworkImage(
                              imageUrl: _existingImageUrl!,
                              fit: BoxFit.cover,
                              width: double.infinity,
                            ),
                          )
                        : Column(
                            mainAxisAlignment: MainAxisAlignment.center,
                            children: [
                              Icon(Icons.add_a_photo_outlined,
                                  size: 48, color: Colors.grey.shade400),
                              const SizedBox(height: 8),
                              Text('Ajouter une photo',
                                  style: TextStyle(color: Colors.grey.shade600)),
                            ],
                          ),
              ),
            ),
            const SizedBox(height: 20),

            // Name
            TextFormField(
              controller: _nameController,
              decoration: const InputDecoration(labelText: 'Nom *'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'Nom requis' : null,
            ),
            const SizedBox(height: 12),

            // SKU
            TextFormField(
              controller: _skuController,
              decoration: const InputDecoration(labelText: 'SKU *'),
              validator: (v) =>
                  v == null || v.trim().isEmpty ? 'SKU requis' : null,
            ),
            const SizedBox(height: 12),

            // Description
            TextFormField(
              controller: _descController,
              decoration: const InputDecoration(labelText: 'Description'),
              maxLines: 3,
            ),
            const SizedBox(height: 12),

            // Category
            if (_categories.isNotEmpty)
              DropdownButtonFormField<String?>(
                value: _categoryId,
                decoration: const InputDecoration(labelText: 'Catégorie'),
                items: [
                  const DropdownMenuItem(value: null, child: Text('Aucune')),
                  ..._categories
                      .map((c) => DropdownMenuItem(value: c.id, child: Text(c.name))),
                ],
                onChanged: (v) => setState(() => _categoryId = v),
              ),
            const SizedBox(height: 12),

            // Tracking mode
            if (!isEditing)
              SegmentedButton<String>(
                segments: const [
                  ButtonSegment(value: 'BULK', label: Text('En vrac')),
                  ButtonSegment(value: 'SERIALIZED', label: Text('Sérialisé')),
                ],
                selected: {_trackingMode},
                onSelectionChanged: (v) =>
                    setState(() => _trackingMode = v.first),
              ),
            const SizedBox(height: 12),

            // Unit
            TextFormField(
              controller: _unitController,
              decoration: const InputDecoration(labelText: 'Unité'),
            ),
            const SizedBox(height: 12),

            // Prices
            Row(
              children: [
                Expanded(
                  child: TextFormField(
                    controller: _purchasePriceController,
                    decoration: const InputDecoration(labelText: 'Prix d\'achat'),
                    keyboardType: TextInputType.number,
                  ),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: TextFormField(
                    controller: _salePriceController,
                    decoration: const InputDecoration(labelText: 'Prix de vente'),
                    keyboardType: TextInputType.number,
                  ),
                ),
              ],
            ),
            const SizedBox(height: 12),

            // Threshold
            TextFormField(
              controller: _thresholdController,
              decoration: const InputDecoration(labelText: 'Seuil stock bas'),
              keyboardType: TextInputType.number,
            ),
            const SizedBox(height: 12),

            // Active toggle (edit only)
            if (isEditing)
              SwitchListTile(
                title: const Text('Article actif'),
                value: _isActive,
                onChanged: (v) => setState(() => _isActive = v),
                contentPadding: EdgeInsets.zero,
              ),

            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _save,
              child: _loading
                  ? const SizedBox(
                      height: 20, width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2))
                  : Text(isEditing ? 'Enregistrer' : 'Créer l\'article'),
            ),
          ],
        ),
      ),
    );
  }
}
