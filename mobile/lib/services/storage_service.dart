import 'package:flutter_secure_storage/flutter_secure_storage.dart';

class StorageService {
  static const _tokenKey = 'sl3ti_token';
  static const _orgKey = 'sl3ti_org_id';
  static const _langKey = 'sl3ti_language';

  final _storage = const FlutterSecureStorage();

  Future<String?> getToken() => _storage.read(key: _tokenKey);
  Future<void> saveToken(String token) => _storage.write(key: _tokenKey, value: token);
  Future<void> clearToken() => _storage.delete(key: _tokenKey);

  Future<String?> getOrgId() => _storage.read(key: _orgKey);
  Future<void> saveOrgId(String orgId) => _storage.write(key: _orgKey, value: orgId);
  Future<void> clearOrgId() => _storage.delete(key: _orgKey);

  Future<String?> getLanguage() => _storage.read(key: _langKey);
  Future<void> saveLanguage(String lang) => _storage.write(key: _langKey, value: lang);

  Future<void> clearAll() async {
    await _storage.deleteAll();
  }
}
