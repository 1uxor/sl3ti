import '../models/asset.dart';
import 'api_client.dart';

class AssetsService {
  final ApiClient api;

  AssetsService({required this.api});

  Future<List<Asset>> getAssets() async {
    final response = await api.dio.get('/assets');
    return (response.data as List)
        .map((e) => Asset.fromJson(e))
        .toList();
  }

  Future<Asset> createAsset({
    required String itemId,
    required String serialNumber,
    required String locationId,
  }) async {
    final response = await api.dio.post('/assets', data: {
      'item_id': itemId,
      'serial_number': serialNumber,
      'location_id': locationId,
    });
    return Asset.fromJson(response.data);
  }

  Future<void> assignAsset(String id, String assignedTo) async {
    await api.dio.post('/assets/$id/assign', data: {'assigned_to': assignedTo});
  }

  Future<void> returnAsset(String id) async {
    await api.dio.post('/assets/$id/return');
  }

  Future<void> maintenanceAsset(String id) async {
    await api.dio.post('/assets/$id/maintenance');
  }

  Future<void> availableAsset(String id) async {
    await api.dio.post('/assets/$id/available');
  }
}
