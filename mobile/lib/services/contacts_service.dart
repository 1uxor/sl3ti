import '../models/contact.dart';
import 'api_client.dart';

class ContactsService {
  final ApiClient api;

  ContactsService({required this.api});

  Future<List<Contact>> getContacts(String kind) async {
    final response = await api.dio.get('/contacts/$kind');
    return (response.data as List)
        .map((e) => Contact.fromJson(e))
        .toList();
  }

  Future<Contact> createContact(String kind, Map<String, dynamic> data) async {
    final response = await api.dio.post('/contacts/$kind', data: data);
    return Contact.fromJson(response.data);
  }

  Future<Contact> updateContact(String kind, String id, Map<String, dynamic> data) async {
    final response = await api.dio.patch('/contacts/$kind/$id', data: data);
    return Contact.fromJson(response.data);
  }

  Future<void> deleteContact(String kind, String id) async {
    await api.dio.delete('/contacts/$kind/$id');
  }
}
