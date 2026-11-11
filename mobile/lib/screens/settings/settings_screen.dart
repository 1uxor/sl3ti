import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import '../../providers/auth_provider.dart';
import '../../providers/org_provider.dart';

class SettingsScreen extends ConsumerWidget {
  const SettingsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final auth = ref.watch(authProvider);
    final org = ref.watch(orgProvider);

    return Scaffold(
      appBar: AppBar(title: const Text('Plus')),
      body: ListView(
        children: [
          // User info
          if (auth.user != null)
            Padding(
              padding: const EdgeInsets.all(16),
              child: Row(
                children: [
                  CircleAvatar(
                    radius: 28,
                    child: Text(
                      auth.user!.fullName.isNotEmpty
                          ? auth.user!.fullName[0].toUpperCase()
                          : '?',
                      style: const TextStyle(fontSize: 24),
                    ),
                  ),
                  const SizedBox(width: 16),
                  Expanded(
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Text(auth.user!.fullName,
                            style: Theme.of(context).textTheme.titleMedium),
                        Text(auth.user!.email,
                            style: Theme.of(context).textTheme.bodySmall),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          const Divider(),

          // Navigation
          _NavTile(
            icon: Icons.location_on_outlined,
            title: 'Emplacements',
            onTap: () => context.go('/locations'),
          ),
          _NavTile(
            icon: Icons.people_outline,
            title: 'Clients',
            onTap: () => context.go('/contacts/customer'),
          ),
          _NavTile(
            icon: Icons.local_shipping_outlined,
            title: 'Fournisseurs',
            onTap: () => context.go('/contacts/supplier'),
          ),
          if (org.current?.hasModule('equipment') ?? false)
            _NavTile(
              icon: Icons.build_outlined,
              title: 'Équipements',
              onTap: () => context.go('/assets'),
            ),
          if (org.current?.hasModule('rental') ?? false)
            _NavTile(
              icon: Icons.key_outlined,
              title: 'Locations',
              onTap: () => context.go('/rentals'),
            ),
          _NavTile(
            icon: Icons.bar_chart_outlined,
            title: 'Rapports',
            onTap: () => context.go('/reports'),
          ),
          const Divider(),

          // Settings actions
          _NavTile(
            icon: Icons.language,
            title: 'Langue: ${_langLabel(auth.user?.preferredLanguage ?? 'fr')}',
            onTap: () => _changeLanguage(context, ref),
          ),
          _NavTile(
            icon: Icons.lock_outline,
            title: 'Changer le mot de passe',
            onTap: () => _changePassword(context, ref),
          ),
          const Divider(),
          _NavTile(
            icon: Icons.logout,
            title: 'Se déconnecter',
            color: Colors.red,
            onTap: () => ref.read(authProvider.notifier).logout(),
          ),
        ],
      ),
    );
  }

  String _langLabel(String lang) {
    switch (lang) {
      case 'fr': return 'Français';
      case 'en': return 'English';
      case 'ar': return 'العربية';
      default: return lang;
    }
  }

  void _changeLanguage(BuildContext context, WidgetRef ref) {
    showDialog(
      context: context,
      builder: (ctx) => SimpleDialog(
        title: const Text('Choisir la langue'),
        children: [
          SimpleDialogOption(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).updateProfile(preferredLanguage: 'fr');
            },
            child: const Text('Français'),
          ),
          SimpleDialogOption(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).updateProfile(preferredLanguage: 'en');
            },
            child: const Text('English'),
          ),
          SimpleDialogOption(
            onPressed: () {
              Navigator.pop(ctx);
              ref.read(authProvider.notifier).updateProfile(preferredLanguage: 'ar');
            },
            child: const Text('العربية'),
          ),
        ],
      ),
    );
  }

  void _changePassword(BuildContext context, WidgetRef ref) {
    final currentCtl = TextEditingController();
    final newCtl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Changer le mot de passe'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(
              controller: currentCtl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Mot de passe actuel'),
            ),
            const SizedBox(height: 12),
            TextField(
              controller: newCtl,
              obscureText: true,
              decoration: const InputDecoration(labelText: 'Nouveau mot de passe'),
            ),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(authProvider.notifier).updateProfile(
                      currentPassword: currentCtl.text,
                      newPassword: newCtl.text,
                    );
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('Mot de passe modifié')),
                  );
                }
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(
                    SnackBar(content: Text('Erreur: $e')),
                  );
                }
              }
            },
            child: const Text('Confirmer'),
          ),
        ],
      ),
    );
  }
}

class _NavTile extends StatelessWidget {
  final IconData icon;
  final String title;
  final VoidCallback onTap;
  final Color? color;

  const _NavTile({
    required this.icon,
    required this.title,
    required this.onTap,
    this.color,
  });

  @override
  Widget build(BuildContext context) {
    return ListTile(
      leading: Icon(icon, color: color),
      title: Text(title, style: color != null ? TextStyle(color: color) : null),
      trailing: const Icon(Icons.chevron_right),
      onTap: onTap,
    );
  }
}
