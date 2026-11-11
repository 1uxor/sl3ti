import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'config/routes.dart';
import 'config/theme.dart';
import 'providers/auth_provider.dart';

class Sl3tiApp extends ConsumerStatefulWidget {
  const Sl3tiApp({super.key});

  @override
  ConsumerState<Sl3tiApp> createState() => _Sl3tiAppState();
}

class _Sl3tiAppState extends ConsumerState<Sl3tiApp> {
  @override
  void initState() {
    super.initState();
    // Check authentication on startup
    Future.microtask(() => ref.read(authProvider.notifier).checkAuth());
  }

  @override
  Widget build(BuildContext context) {
    final router = ref.watch(routerProvider);

    return MaterialApp.router(
      title: 'Sl3ti',
      debugShowCheckedModeBanner: false,
      theme: AppTheme.light(),
      darkTheme: AppTheme.dark(),
      themeMode: ThemeMode.system,
      routerConfig: router,
    );
  }
}
