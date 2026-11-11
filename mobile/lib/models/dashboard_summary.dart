import 'stock_movement.dart';

class LowStockItem {
  final String id;
  final String name;
  final String quantity;
  final String threshold;

  LowStockItem({
    required this.id,
    required this.name,
    required this.quantity,
    required this.threshold,
  });

  factory LowStockItem.fromJson(Map<String, dynamic> json) => LowStockItem(
        id: json['id'] as String,
        name: json['name'] as String,
        quantity: json['quantity']?.toString() ?? '0',
        threshold: json['threshold']?.toString() ?? '0',
      );
}

class DashboardSummary {
  final int totalItems;
  final String totalQuantity;
  final String estimatedValue;
  final List<LowStockItem> lowStock;
  final List<StockMovement> recentMovements;

  DashboardSummary({
    required this.totalItems,
    required this.totalQuantity,
    required this.estimatedValue,
    required this.lowStock,
    required this.recentMovements,
  });

  factory DashboardSummary.fromJson(Map<String, dynamic> json) =>
      DashboardSummary(
        totalItems: json['total_items'] as int? ?? 0,
        totalQuantity: json['total_quantity']?.toString() ?? '0',
        estimatedValue: json['estimated_value']?.toString() ?? '0',
        lowStock: (json['low_stock'] as List?)
                ?.map((e) => LowStockItem.fromJson(e))
                .toList() ??
            [],
        recentMovements: (json['recent_movements'] as List?)
                ?.map((e) => StockMovement.fromJson(e))
                .toList() ??
            [],
      );
}
