import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/org_provider.dart';

class HomeScreen extends ConsumerStatefulWidget {
  final Widget child;
  const HomeScreen({super.key, required this.child});

  @override
  ConsumerState<HomeScreen> createState() => _HomeScreenState();
}

class _HomeScreenState extends ConsumerState<HomeScreen> {
  @override
  void initState() {
    super.initState();
    Future.microtask(() => ref.read(orgProvider.notifier).load());
  }

  int _currentIndex(BuildContext context) {
    final location = GoRouterState.of(context).matchedLocation;
    if (location.startsWith('/dashboard')) return 0;
    if (location.startsWith('/items')) return 1;
    if (location.startsWith('/inventory')) return 2;
    if (location.startsWith('/settings') ||
        location.startsWith('/locations') ||
        location.startsWith('/contacts') ||
        location.startsWith('/assets') ||
        location.startsWith('/rentals') ||
        location.startsWith('/reports')) return 3;
    return 0;
  }

  @override
  Widget build(BuildContext context) {
    final orgState = ref.watch(orgProvider);

    // Show org selector if no org is selected
    if (orgState.current == null && !orgState.isLoading) {
      return _OrgSetupScreen();
    }

    return Scaffold(
      appBar: AppBar(
        title: Text(orgState.current?.name ?? 'Sl3ti'),
        actions: [
          if (orgState.organizations.length > 1)
            PopupMenuButton<String>(
              icon: const Icon(Icons.swap_horiz),
              onSelected: (orgId) {
                final org = orgState.organizations.firstWhere((o) => o.id == orgId);
                ref.read(orgProvider.notifier).select(org);
              },
              itemBuilder: (context) => orgState.organizations
                  .map((o) => PopupMenuItem(
                        value: o.id,
                        child: Row(
                          children: [
                            if (o.id == orgState.current?.id)
                              const Icon(Icons.check, size: 18),
                            if (o.id == orgState.current?.id)
                              const SizedBox(width: 8),
                            Text(o.name),
                          ],
                        ),
                      ))
                  .toList(),
            ),
        ],
      ),
      body: widget.child,
      bottomNavigationBar: NavigationBar(
        selectedIndex: _currentIndex(context),
        onDestinationSelected: (index) {
          switch (index) {
            case 0:
              context.go('/dashboard');
            case 1:
              context.go('/items');
            case 2:
              context.go('/inventory');
            case 3:
              context.go('/settings');
          }
        },
        destinations: const [
          NavigationDestination(
            icon: Icon(Icons.dashboard_outlined),
            selectedIcon: Icon(Icons.dashboard),
            label: 'Tableau de bord',
          ),
          NavigationDestination(
            icon: Icon(Icons.inventory_2_outlined),
            selectedIcon: Icon(Icons.inventory_2),
            label: 'Articles',
          ),
          NavigationDestination(
            icon: Icon(Icons.warehouse_outlined),
            selectedIcon: Icon(Icons.warehouse),
            label: 'Stock',
          ),
          NavigationDestination(
            icon: Icon(Icons.more_horiz),
            selectedIcon: Icon(Icons.more_horiz),
            label: 'Plus',
          ),
        ],
      ),
    );
  }
}

class _OrgSetupScreen extends ConsumerStatefulWidget {
  @override
  ConsumerState<_OrgSetupScreen> createState() => _OrgSetupScreenState();
}

class _OrgSetupScreenState extends ConsumerState<_OrgSetupScreen> {
  final _nameController = TextEditingController();
  final _locationController = TextEditingController(text: 'Entrepôt principal');
  bool _loading = false;

  @override
  void dispose() {
    _nameController.dispose();
    _locationController.dispose();
    super.dispose();
  }

  Future<void> _create() async {
    if (_nameController.text.trim().length < 2) return;
    setState(() => _loading = true);
    try {
      await ref.read(orgProvider.notifier).create(
            name: _nameController.text.trim(),
            mainLocation: _locationController.text.trim(),
          );
    } catch (e) {
      if (mounted) {
        ScaffoldMessenger.of(context).showSnackBar(
          SnackBar(content: Text('Erreur: $e')),
        );
      }
    } finally {
      if (mounted) setState(() => _loading = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: const Text('Bienvenue'),
        actions: [
          IconButton(
            icon: const Icon(Icons.logout),
            onPressed: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
      body: Padding(
        padding: const EdgeInsets.all(24),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.stretch,
          children: [
            Text(
              'Créez votre organisation',
              style: Theme.of(context).textTheme.headlineSmall,
            ),
            const SizedBox(height: 8),
            Text(
              'Pour commencer, donnez un nom à votre espace de travail.',
              style: Theme.of(context).textTheme.bodyMedium?.copyWith(
                    color: Theme.of(context).colorScheme.onSurfaceVariant,
                  ),
            ),
            const SizedBox(height: 32),
            TextField(
              controller: _nameController,
              decoration: const InputDecoration(
                labelText: 'Nom de l\'organisation',
                prefixIcon: Icon(Icons.business),
              ),
            ),
            const SizedBox(height: 16),
            TextField(
              controller: _locationController,
              decoration: const InputDecoration(
                labelText: 'Emplacement principal',
                prefixIcon: Icon(Icons.location_on_outlined),
              ),
            ),
            const SizedBox(height: 24),
            ElevatedButton(
              onPressed: _loading ? null : _create,
              child: _loading
                  ? const SizedBox(
                      height: 20,
                      width: 20,
                      child: CircularProgressIndicator(strokeWidth: 2),
                    )
                  : const Text('Créer'),
            ),
          ],
        ),
      ),
    );
  }
}
