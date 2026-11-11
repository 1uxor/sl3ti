import 'package:dio/dio.dart';
import '../config/api_config.dart';
import 'storage_service.dart';

class ApiClient {
  late final Dio dio;
  final StorageService storage;
  String? currentOrgId;

  ApiClient({required this.storage}) {
    dio = Dio(BaseOptions(
      baseUrl: '${ApiConfig.baseUrl}${ApiConfig.apiPrefix}',
      connectTimeout: ApiConfig.connectTimeout,
      receiveTimeout: ApiConfig.receiveTimeout,
      headers: {'Content-Type': 'application/json'},
    ));

    dio.interceptors.add(InterceptorsWrapper(
      onRequest: (options, handler) async {
        final token = await storage.getToken();
        if (token != null) {
          options.headers['Authorization'] = 'Bearer $token';
        }
        if (currentOrgId != null) {
          options.headers['X-Organization-ID'] = currentOrgId;
        }
        return handler.next(options);
      },
      onError: (error, handler) async {
        if (error.response?.statusCode == 401) {
          await storage.clearToken();
        }
        return handler.next(error);
      },
    ));
  }

  void setOrganization(String? orgId) {
    currentOrgId = orgId;
  }

  /// Extract error message from API response
  static String errorMessage(DioException e) {
    final data = e.response?.data;
    if (data is Map && data.containsKey('detail')) {
      return data['detail'] as String;
    }
    return 'Erreur de connexion';
  }
}
