class StockBalance {
  final String itemId;
  final String itemName;
  final String sku;
  final String locationId;
  final String locationName;
  final String quantity;

  StockBalance({
    required this.itemId,
    required this.itemName,
    required this.sku,
    required this.locationId,
    required this.locationName,
    required this.quantity,
  });

  factory StockBalance.fromJson(Map<String, dynamic> json) => StockBalance(
        itemId: json['item_id'] as String,
        itemName: json['item_name'] as String,
        sku: json['sku'] as String? ?? '',
        locationId: json['location_id'] as String,
        locationName: json['location_name'] as String,
        quantity: json['quantity']?.toString() ?? '0',
      );
}
