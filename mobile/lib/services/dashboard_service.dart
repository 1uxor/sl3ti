import '../models/dashboard_summary.dart';
import 'api_client.dart';

class DashboardService {
  final ApiClient api;

  DashboardService({required this.api});

  Future<DashboardSummary> getSummary() async {
    final response = await api.dio.get('/dashboard/summary');
    return DashboardSummary.fromJson(response.data);
  }

  Future<List<Map<String, dynamic>>> getStockReport() async {
    final response = await api.dio.get('/reports/stock');
    return (response.data as List).cast<Map<String, dynamic>>();
  }
}
