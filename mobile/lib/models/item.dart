class Item {
  final String id;
  final String? categoryId;
  final String sku;
  final String name;
  final String description;
  final String itemType;
  final String trackingMode;
  final String unit;
  final String purchasePrice;
  final String salePrice;
  final String lowStockThreshold;
  final bool isActive;
  final String? imageUrl;
  final String? createdAt;

  Item({
    required this.id,
    this.categoryId,
    required this.sku,
    required this.name,
    this.description = '',
    this.itemType = 'product',
    this.trackingMode = 'BULK',
    this.unit = 'unité',
    this.purchasePrice = '0',
    this.salePrice = '0',
    this.lowStockThreshold = '0',
    this.isActive = true,
    this.imageUrl,
    this.createdAt,
  });

  factory Item.fromJson(Map<String, dynamic> json) => Item(
        id: json['id'] as String,
        categoryId: json['category_id'] as String?,
        sku: json['sku'] as String,
        name: json['name'] as String,
        description: json['description'] as String? ?? '',
        itemType: json['item_type'] as String? ?? 'product',
        trackingMode: json['tracking_mode'] as String? ?? 'BULK',
        unit: json['unit'] as String? ?? 'unité',
        purchasePrice: json['purchase_price']?.toString() ?? '0',
        salePrice: json['sale_price']?.toString() ?? '0',
        lowStockThreshold: json['low_stock_threshold']?.toString() ?? '0',
        isActive: json['is_active'] as bool? ?? true,
        imageUrl: json['image_url'] as String?,
        createdAt: json['created_at'] as String?,
      );

  Map<String, dynamic> toCreateJson() => {
        if (categoryId != null) 'category_id': categoryId,
        'sku': sku,
        'name': name,
        'description': description,
        'item_type': itemType,
        'tracking_mode': trackingMode,
        'unit': unit,
        'purchase_price': purchasePrice,
        'sale_price': salePrice,
        'low_stock_threshold': lowStockThreshold,
      };

  Map<String, dynamic> toPatchJson() {
    final map = <String, dynamic>{};
    map['name'] = name;
    map['sku'] = sku;
    map['description'] = description;
    map['unit'] = unit;
    map['purchase_price'] = purchasePrice;
    map['sale_price'] = salePrice;
    map['low_stock_threshold'] = lowStockThreshold;
    map['is_active'] = isActive;
    map['category_id'] = categoryId;
    return map;
  }
}

class PaginatedItems {
  final List<Item> data;
  final int total;
  final int page;
  final int pageSize;

  PaginatedItems({
    required this.data,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  factory PaginatedItems.fromJson(Map<String, dynamic> json) => PaginatedItems(
        data: (json['data'] as List).map((e) => Item.fromJson(e)).toList(),
        total: json['total'] as int,
        page: json['page'] as int,
        pageSize: json['page_size'] as int,
      );
}
