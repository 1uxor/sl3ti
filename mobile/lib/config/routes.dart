import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../providers/auth_provider.dart';
import '../screens/auth/login_screen.dart';
import '../screens/auth/register_screen.dart';
import '../screens/home/home_screen.dart';
import '../screens/dashboard/dashboard_screen.dart';
import '../screens/items/items_list_screen.dart';
import '../screens/items/item_form_screen.dart';
import '../screens/items/item_detail_screen.dart';
import '../screens/inventory/balances_screen.dart';
import '../screens/inventory/stock_movement_screen.dart';
import '../screens/locations/locations_screen.dart';
import '../screens/contacts/contacts_screen.dart';
import '../screens/assets/assets_screen.dart';
import '../screens/rentals/rentals_screen.dart';
import '../screens/reports/stock_report_screen.dart';
import '../screens/settings/settings_screen.dart';

final routerProvider = Provider<GoRouter>((ref) {
  final authState = ref.watch(authProvider);

  return GoRouter(
    initialLocation: '/login',
    redirect: (context, state) {
      final isLoggedIn = authState.isAuthenticated;
      final isAuthRoute = state.matchedLocation == '/login' ||
          state.matchedLocation == '/register';

      if (!isLoggedIn && !isAuthRoute) return '/login';
      if (isLoggedIn && isAuthRoute) return '/dashboard';
      return null;
    },
    routes: [
      GoRoute(
        path: '/login',
        builder: (context, state) => const LoginScreen(),
      ),
      GoRoute(
        path: '/register',
        builder: (context, state) => const RegisterScreen(),
      ),
      ShellRoute(
        builder: (context, state, child) => HomeScreen(child: child),
        routes: [
          GoRoute(
            path: '/dashboard',
            builder: (context, state) => const DashboardScreen(),
          ),
          GoRoute(
            path: '/items',
            builder: (context, state) => const ItemsListScreen(),
          ),
          GoRoute(
            path: '/items/new',
            builder: (context, state) => const ItemFormScreen(),
          ),
          GoRoute(
            path: '/items/:id',
            builder: (context, state) =>
                ItemDetailScreen(id: state.pathParameters['id']!),
          ),
          GoRoute(
            path: '/items/:id/edit',
            builder: (context, state) =>
                ItemFormScreen(id: state.pathParameters['id']),
          ),
          GoRoute(
            path: '/inventory',
            builder: (context, state) => const BalancesScreen(),
          ),
          GoRoute(
            path: '/inventory/move/:type',
            builder: (context, state) =>
                StockMovementScreen(type: state.pathParameters['type']!),
          ),
          GoRoute(
            path: '/locations',
            builder: (context, state) => const LocationsScreen(),
          ),
          GoRoute(
            path: '/contacts/:kind',
            builder: (context, state) =>
                ContactsScreen(kind: state.pathParameters['kind']!),
          ),
          GoRoute(
            path: '/assets',
            builder: (context, state) => const AssetsScreen(),
          ),
          GoRoute(
            path: '/rentals',
            builder: (context, state) => const RentalsScreen(),
          ),
          GoRoute(
            path: '/reports',
            builder: (context, state) => const StockReportScreen(),
          ),
          GoRoute(
            path: '/settings',
            builder: (context, state) => const SettingsScreen(),
          ),
        ],
      ),
    ],
  );
});
