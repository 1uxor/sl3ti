import '../models/rental.dart';
import 'api_client.dart';

class RentalsService {
  final ApiClient api;

  RentalsService({required this.api});

  Future<List<Rental>> getRentals() async {
    final response = await api.dio.get('/rentals');
    return (response.data as List)
        .map((e) => Rental.fromJson(e))
        .toList();
  }

  Future<Rental> createRental({
    required String assetId,
    required String customerId,
    required String startDate,
    required String expectedReturnDate,
    String notes = '',
  }) async {
    final response = await api.dio.post('/rentals', data: {
      'asset_id': assetId,
      'customer_id': customerId,
      'start_date': startDate,
      'expected_return_date': expectedReturnDate,
      'notes': notes,
    });
    return Rental.fromJson(response.data);
  }

  Future<void> activateRental(String id) async {
    await api.dio.post('/rentals/$id/activate');
  }

  Future<void> returnRental(String id) async {
    await api.dio.post('/rentals/$id/return');
  }

  Future<void> cancelRental(String id) async {
    await api.dio.post('/rentals/$id/cancel');
  }
}
