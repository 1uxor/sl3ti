class Asset {
  final String id;
  final String itemId;
  final String serialNumber;
  final String status;
  final String currentLocationId;
  final String? assignedTo;

  Asset({
    required this.id,
    required this.itemId,
    required this.serialNumber,
    required this.status,
    required this.currentLocationId,
    this.assignedTo,
  });

  factory Asset.fromJson(Map<String, dynamic> json) => Asset(
        id: json['id'] as String,
        itemId: json['item_id'] as String,
        serialNumber: json['serial_number'] as String,
        status: json['status'] as String,
        currentLocationId: json['current_location_id'] as String,
        assignedTo: json['assigned_to'] as String?,
      );
}
