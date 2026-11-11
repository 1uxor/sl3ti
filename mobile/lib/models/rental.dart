class Rental {
  final String id;
  final String assetId;
  final String customerId;
  final String startDate;
  final String expectedReturnDate;
  final String? actualReturnDate;
  final String status;
  final bool overdue;

  Rental({
    required this.id,
    required this.assetId,
    required this.customerId,
    required this.startDate,
    required this.expectedReturnDate,
    this.actualReturnDate,
    required this.status,
    this.overdue = false,
  });

  factory Rental.fromJson(Map<String, dynamic> json) => Rental(
        id: json['id'] as String,
        assetId: json['asset_id'] as String,
        customerId: json['customer_id'] as String,
        startDate: json['start_date'] as String,
        expectedReturnDate: json['expected_return_date'] as String,
        actualReturnDate: json['actual_return_date'] as String?,
        status: json['status'] as String,
        overdue: json['overdue'] as bool? ?? false,
      );
}
