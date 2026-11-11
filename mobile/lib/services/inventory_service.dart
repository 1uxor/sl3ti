import 'dart:math';
import 'package:dio/dio.dart' show Options;
import '../models/stock_balance.dart';
import '../models/stock_movement.dart';
import 'api_client.dart';

String _generateUuid() {
  final random = Random.secure();
  final bytes = List<int>.generate(16, (_) => random.nextInt(256));
  bytes[6] = (bytes[6] & 0x0f) | 0x40;
  bytes[8] = (bytes[8] & 0x3f) | 0x80;
  final hex = bytes.map((b) => b.toRadixString(16).padLeft(2, '0')).join();
  return '${hex.substring(0, 8)}-${hex.substring(8, 12)}-${hex.substring(12, 16)}-${hex.substring(16, 20)}-${hex.substring(20)}';
}

class InventoryService {
  final ApiClient api;

  InventoryService({required this.api});

  Future<List<StockBalance>> getBalances() async {
    final response = await api.dio.get('/inventory/balances');
    return (response.data as List)
        .map((e) => StockBalance.fromJson(e))
        .toList();
  }

  Future<PaginatedMovements> getMovements({int page = 1, int pageSize = 25}) async {
    final response = await api.dio.get('/movements', queryParameters: {
      'page': page,
      'page_size': pageSize,
    });
    return PaginatedMovements.fromJson(response.data);
  }

  Future<void> receipt({
    required String itemId,
    required String destinationLocationId,
    required String quantity,
    String reference = '',
    String note = '',
  }) async {
    await api.dio.post('/inventory/receipts',
        data: {
          'item_id': itemId,
          'destination_location_id': destinationLocationId,
          'quantity': quantity,
          'reference': reference,
          'note': note,
        },
        options: _idempotencyOptions());
  }

  Future<void> issue({
    required String itemId,
    required String sourceLocationId,
    required String quantity,
    String reference = '',
    String note = '',
  }) async {
    await api.dio.post('/inventory/issues',
        data: {
          'item_id': itemId,
          'source_location_id': sourceLocationId,
          'quantity': quantity,
          'reference': reference,
          'note': note,
        },
        options: _idempotencyOptions());
  }

  Future<void> transfer({
    required String itemId,
    required String sourceLocationId,
    required String destinationLocationId,
    required String quantity,
    String reference = '',
    String note = '',
  }) async {
    await api.dio.post('/inventory/transfers',
        data: {
          'item_id': itemId,
          'source_location_id': sourceLocationId,
          'destination_location_id': destinationLocationId,
          'quantity': quantity,
          'reference': reference,
          'note': note,
        },
        options: _idempotencyOptions());
  }

  Future<void> adjustment({
    required String itemId,
    required String locationId,
    required String quantity,
    required String reason,
  }) async {
    await api.dio.post('/inventory/adjustments',
        data: {
          'item_id': itemId,
          'location_id': locationId,
          'quantity': quantity,
          'reason': reason,
        },
        options: _idempotencyOptions());
  }

  Future<void> returnStock({
    required String itemId,
    required String destinationLocationId,
    required String quantity,
    String reference = '',
    String note = '',
  }) async {
    await api.dio.post('/inventory/returns',
        data: {
          'item_id': itemId,
          'destination_location_id': destinationLocationId,
          'quantity': quantity,
          'reference': reference,
          'note': note,
        },
        options: _idempotencyOptions());
  }

  Options _idempotencyOptions() => Options(
        headers: {'Idempotency-Key': _generateUuid()},
      );
}
