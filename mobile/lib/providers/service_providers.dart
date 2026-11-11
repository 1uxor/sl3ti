import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../services/api_client.dart';
import '../services/auth_service.dart';
import '../services/storage_service.dart';
import '../services/items_service.dart';
import '../services/inventory_service.dart';
import '../services/locations_service.dart';
import '../services/contacts_service.dart';
import '../services/organizations_service.dart';
import '../services/assets_service.dart';
import '../services/rentals_service.dart';
import '../services/dashboard_service.dart';

final storageServiceProvider = Provider<StorageService>((ref) => StorageService());

final apiClientProvider = Provider<ApiClient>((ref) {
  final storage = ref.watch(storageServiceProvider);
  return ApiClient(storage: storage);
});

final authServiceProvider = Provider<AuthService>((ref) {
  final api = ref.watch(apiClientProvider);
  final storage = ref.watch(storageServiceProvider);
  return AuthService(api: api, storage: storage);
});

final itemsServiceProvider = Provider<ItemsService>((ref) {
  return ItemsService(api: ref.watch(apiClientProvider));
});

final inventoryServiceProvider = Provider<InventoryService>((ref) {
  return InventoryService(api: ref.watch(apiClientProvider));
});

final locationsServiceProvider = Provider<LocationsService>((ref) {
  return LocationsService(api: ref.watch(apiClientProvider));
});

final contactsServiceProvider = Provider<ContactsService>((ref) {
  return ContactsService(api: ref.watch(apiClientProvider));
});

final organizationsServiceProvider = Provider<OrganizationsService>((ref) {
  return OrganizationsService(api: ref.watch(apiClientProvider));
});

final assetsServiceProvider = Provider<AssetsService>((ref) {
  return AssetsService(api: ref.watch(apiClientProvider));
});

final rentalsServiceProvider = Provider<RentalsService>((ref) {
  return RentalsService(api: ref.watch(apiClientProvider));
});

final dashboardServiceProvider = Provider<DashboardService>((ref) {
  return DashboardService(api: ref.watch(apiClientProvider));
});
