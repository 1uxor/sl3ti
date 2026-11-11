import 'package:dio/dio.dart';
import '../models/user.dart';
import 'api_client.dart';
import 'storage_service.dart';

class AuthResult {
  final String token;
  final User user;

  AuthResult({required this.token, required this.user});

  factory AuthResult.fromJson(Map<String, dynamic> json) => AuthResult(
        token: json['token'] as String,
        user: User.fromJson(json['user'] as Map<String, dynamic>),
      );
}

class AuthService {
  final ApiClient api;
  final StorageService storage;

  AuthService({required this.api, required this.storage});

  Future<User> login(String email, String password) async {
    final response = await api.dio.post('/auth/login/mobile', data: {
      'email': email,
      'password': password,
    });
    final result = AuthResult.fromJson(response.data);
    await storage.saveToken(result.token);
    return result.user;
  }

  Future<User> register({
    required String email,
    required String password,
    required String fullName,
    String preferredLanguage = 'fr',
  }) async {
    final response = await api.dio.post('/auth/register/mobile', data: {
      'email': email,
      'password': password,
      'full_name': fullName,
      'preferred_language': preferredLanguage,
    });
    final result = AuthResult.fromJson(response.data);
    await storage.saveToken(result.token);
    return result.user;
  }

  Future<User> getProfile() async {
    final response = await api.dio.get('/auth/me');
    return User.fromJson(response.data);
  }

  Future<User> updateProfile({
    String? fullName,
    String? preferredLanguage,
    String? currentPassword,
    String? newPassword,
  }) async {
    final data = <String, dynamic>{};
    if (fullName != null) data['full_name'] = fullName;
    if (preferredLanguage != null) data['preferred_language'] = preferredLanguage;
    if (currentPassword != null) data['current_password'] = currentPassword;
    if (newPassword != null) data['new_password'] = newPassword;
    final response = await api.dio.patch('/auth/me', data: data);
    return User.fromJson(response.data);
  }

  Future<void> logout() async {
    try {
      await api.dio.post('/auth/logout/mobile');
    } catch (_) {
      // Ignore errors on logout
    } finally {
      await storage.clearAll();
    }
  }

  Future<bool> isLoggedIn() async {
    final token = await storage.getToken();
    return token != null;
  }
}
