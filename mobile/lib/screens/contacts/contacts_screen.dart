import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../../models/contact.dart';
import '../../providers/service_providers.dart';
import '../../providers/org_provider.dart';

final customersProvider = FutureProvider.autoDispose<List<Contact>>((ref) async {
  final org = ref.watch(orgProvider).current;
  if (org == null) throw Exception('No organization');
  return ref.read(contactsServiceProvider).getContacts('customer');
});

final suppliersProvider = FutureProvider.autoDispose<List<Contact>>((ref) async {
  final org = ref.watch(orgProvider).current;
  if (org == null) throw Exception('No organization');
  return ref.read(contactsServiceProvider).getContacts('supplier');
});

class ContactsScreen extends ConsumerWidget {
  final String kind;
  const ContactsScreen({super.key, required this.kind});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final isCustomer = kind == 'customer';
    final contacts = ref.watch(isCustomer ? customersProvider : suppliersProvider);
    final title = isCustomer ? 'Clients' : 'Fournisseurs';

    return Scaffold(
      appBar: AppBar(title: Text(title)),
      body: RefreshIndicator(
        onRefresh: () async =>
            ref.invalidate(isCustomer ? customersProvider : suppliersProvider),
        child: contacts.when(
          loading: () => const Center(child: CircularProgressIndicator()),
          error: (e, _) => Center(child: Text('Erreur: $e')),
          data: (data) {
            if (data.isEmpty) {
              return Center(child: Text('Aucun ${isCustomer ? 'client' : 'fournisseur'}'));
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: data.length,
              itemBuilder: (context, index) {
                final c = data[index];
                return Card(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      child: Text(c.name.isNotEmpty ? c.name[0].toUpperCase() : '?'),
                    ),
                    title: Text(c.name),
                    subtitle: Text([c.phone, c.email].where((s) => s.isNotEmpty).join(' - ')),
                    trailing: IconButton(
                      icon: const Icon(Icons.delete_outline),
                      onPressed: () => _confirmDelete(context, ref, c),
                    ),
                  ),
                );
              },
            );
          },
        ),
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => _showAddDialog(context, ref),
        child: const Icon(Icons.add),
      ),
    );
  }

  void _showAddDialog(BuildContext context, WidgetRef ref) {
    final nameCtl = TextEditingController();
    final phoneCtl = TextEditingController();
    final emailCtl = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: Text('Nouveau ${kind == 'customer' ? 'client' : 'fournisseur'}'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            TextField(controller: nameCtl, decoration: const InputDecoration(labelText: 'Nom *')),
            TextField(controller: phoneCtl, decoration: const InputDecoration(labelText: 'Téléphone')),
            TextField(controller: emailCtl, decoration: const InputDecoration(labelText: 'Email')),
          ],
        ),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          TextButton(
            onPressed: () async {
              if (nameCtl.text.trim().isEmpty) return;
              Navigator.pop(ctx);
              try {
                await ref.read(contactsServiceProvider).createContact(kind, {
                  'name': nameCtl.text.trim(),
                  'phone': phoneCtl.text.trim(),
                  'email': emailCtl.text.trim(),
                });
                ref.invalidate(kind == 'customer' ? customersProvider : suppliersProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
                }
              }
            },
            child: const Text('Créer'),
          ),
        ],
      ),
    );
  }

  void _confirmDelete(BuildContext context, WidgetRef ref, Contact c) {
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Supprimer ?'),
        content: Text('Supprimer "${c.name}" ?'),
        actions: [
          TextButton(onPressed: () => Navigator.pop(ctx), child: const Text('Annuler')),
          TextButton(
            onPressed: () async {
              Navigator.pop(ctx);
              try {
                await ref.read(contactsServiceProvider).deleteContact(kind, c.id);
                ref.invalidate(kind == 'customer' ? customersProvider : suppliersProvider);
              } catch (e) {
                if (context.mounted) {
                  ScaffoldMessenger.of(context).showSnackBar(SnackBar(content: Text('Erreur: $e')));
                }
              }
            },
            style: TextButton.styleFrom(foregroundColor: Colors.red),
            child: const Text('Supprimer'),
          ),
        ],
      ),
    );
  }
}
