import '../models/organization.dart';
import 'api_client.dart';

class OrganizationsService {
  final ApiClient api;

  OrganizationsService({required this.api});

  Future<List<Organization>> getOrganizations() async {
    final response = await api.dio.get('/organizations');
    return (response.data as List)
        .map((e) => Organization.fromJson(e))
        .toList();
  }

  Future<Organization> createOrganization({
    required String name,
    required String mainLocation,
    String businessType = 'commerce',
  }) async {
    final response = await api.dio.post('/organizations', data: {
      'name': name,
      'main_location': mainLocation,
      'business_type': businessType,
    });
    // Return with default role since we just created it
    final data = response.data as Map<String, dynamic>;
    data['role'] = 'owner';
    return Organization.fromJson(data);
  }

  Future<void> updateModules(List<String> modules) async {
    await api.dio.patch('/organizations/current/modules', data: {
      'enabled_modules': modules,
    });
  }

  Future<void> updateName(String name) async {
    await api.dio.patch('/organizations/current', data: {'name': name});
  }

  Future<List<Map<String, dynamic>>> getMembers() async {
    final response = await api.dio.get('/members');
    return (response.data as List).cast<Map<String, dynamic>>();
  }

  Future<void> addMember(String email, String role) async {
    await api.dio.post('/members', data: {'email': email, 'role': role});
  }
}
