import 'dart:io';
import 'package:dio/dio.dart';
import '../models/item.dart';
import '../models/category.dart';
import 'api_client.dart';

class ItemsService {
  final ApiClient api;

  ItemsService({required this.api});

  Future<PaginatedItems> getItems({
    String query = '',
    String? categoryId,
    String? trackingMode,
    int page = 1,
    int pageSize = 25,
  }) async {
    final params = <String, dynamic>{
      'page': page,
      'page_size': pageSize,
    };
    if (query.isNotEmpty) params['q'] = query;
    if (categoryId != null) params['category_id'] = categoryId;
    if (trackingMode != null) params['tracking_mode'] = trackingMode;

    final response = await api.dio.get('/items', queryParameters: params);
    return PaginatedItems.fromJson(response.data);
  }

  Future<Item> getItem(String id) async {
    final response = await api.dio.get('/items/$id');
    return Item.fromJson(response.data);
  }

  Future<Item> createItem(Map<String, dynamic> data) async {
    final response = await api.dio.post('/items', data: data);
    return Item.fromJson(response.data);
  }

  Future<Item> updateItem(String id, Map<String, dynamic> data) async {
    final response = await api.dio.patch('/items/$id', data: data);
    return Item.fromJson(response.data);
  }

  Future<void> deleteItem(String id) async {
    await api.dio.delete('/items/$id');
  }

  Future<String> uploadImage(String itemId, File imageFile) async {
    final formData = FormData.fromMap({
      'file': await MultipartFile.fromFile(
        imageFile.path,
        filename: imageFile.path.split('/').last,
      ),
    });
    final response = await api.dio.post(
      '/items/$itemId/image',
      data: formData,
      options: Options(contentType: 'multipart/form-data'),
    );
    return response.data['image_url'] as String;
  }

  Future<void> deleteImage(String itemId) async {
    await api.dio.delete('/items/$itemId/image');
  }

  Future<List<Category>> getCategories() async {
    final response = await api.dio.get('/categories');
    return (response.data as List)
        .map((e) => Category.fromJson(e))
        .toList();
  }

  Future<Category> createCategory(String name, {String description = ''}) async {
    final response = await api.dio.post('/categories', data: {
      'name': name,
      'description': description,
    });
    return Category.fromJson(response.data);
  }

  Future<void> deleteCategory(String id) async {
    await api.dio.delete('/categories/$id');
  }
}
