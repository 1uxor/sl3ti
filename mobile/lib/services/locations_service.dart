import '../models/location.dart';
import 'api_client.dart';

class LocationsService {
  final ApiClient api;

  LocationsService({required this.api});

  Future<List<Location>> getLocations() async {
    final response = await api.dio.get('/locations');
    return (response.data as List)
        .map((e) => Location.fromJson(e))
        .toList();
  }

  Future<Location> createLocation({
    required String name,
    String type = 'warehouse',
    String description = '',
  }) async {
    final response = await api.dio.post('/locations', data: {
      'name': name,
      'type': type,
      'description': description,
    });
    return Location.fromJson(response.data);
  }

  Future<void> deleteLocation(String id) async {
    await api.dio.delete('/locations/$id');
  }
}
