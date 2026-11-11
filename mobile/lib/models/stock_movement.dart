class StockMovement {
  final String id;
  final String itemId;
  final String itemName;
  final String movementType;
  final String quantity;
  final String? sourceLocationId;
  final String? destinationLocationId;
  final String createdAt;
  final String reference;
  final String note;

  StockMovement({
    required this.id,
    required this.itemId,
    required this.itemName,
    required this.movementType,
    required this.quantity,
    this.sourceLocationId,
    this.destinationLocationId,
    required this.createdAt,
    this.reference = '',
    this.note = '',
  });

  factory StockMovement.fromJson(Map<String, dynamic> json) => StockMovement(
        id: json['id'] as String,
        itemId: json['item_id'] as String,
        itemName: json['item_name'] as String? ?? '',
        movementType: json['movement_type'] as String,
        quantity: json['quantity']?.toString() ?? '0',
        sourceLocationId: json['source_location_id'] as String?,
        destinationLocationId: json['destination_location_id'] as String?,
        createdAt: json['created_at'] as String,
        reference: json['reference'] as String? ?? '',
        note: json['note'] as String? ?? '',
      );
}

class PaginatedMovements {
  final List<StockMovement> data;
  final int total;
  final int page;
  final int pageSize;

  PaginatedMovements({
    required this.data,
    required this.total,
    required this.page,
    required this.pageSize,
  });

  factory PaginatedMovements.fromJson(Map<String, dynamic> json) =>
      PaginatedMovements(
        data: (json['data'] as List)
            .map((e) => StockMovement.fromJson(e))
            .toList(),
        total: json['total'] as int,
        page: json['page'] as int,
        pageSize: json['page_size'] as int,
      );
}
