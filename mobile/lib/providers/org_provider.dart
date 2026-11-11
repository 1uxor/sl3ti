import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/organization.dart';
import 'service_providers.dart';

class OrgState {
  final List<Organization> organizations;
  final Organization? current;
  final bool isLoading;

  const OrgState({this.organizations = const [], this.current, this.isLoading = false});
}

class OrgNotifier extends StateNotifier<OrgState> {
  final Ref ref;

  OrgNotifier(this.ref) : super(const OrgState());

  Future<void> load() async {
    state = OrgState(isLoading: true, organizations: state.organizations, current: state.current);
    try {
      final orgs = await ref.read(organizationsServiceProvider).getOrganizations();
      // Restore previously selected org
      final storage = ref.read(storageServiceProvider);
      final savedOrgId = await storage.getOrgId();
      Organization? current;
      if (savedOrgId != null) {
        current = orgs.where((o) => o.id == savedOrgId).firstOrNull;
      }
      current ??= orgs.isNotEmpty ? orgs.first : null;
      if (current != null) {
        ref.read(apiClientProvider).setOrganization(current.id);
        await storage.saveOrgId(current.id);
      }
      state = OrgState(organizations: orgs, current: current);
    } catch (_) {
      state = const OrgState();
    }
  }

  Future<void> select(Organization org) async {
    ref.read(apiClientProvider).setOrganization(org.id);
    await ref.read(storageServiceProvider).saveOrgId(org.id);
    state = OrgState(organizations: state.organizations, current: org);
  }

  Future<Organization> create({
    required String name,
    required String mainLocation,
    String businessType = 'commerce',
  }) async {
    final org = await ref.read(organizationsServiceProvider).createOrganization(
          name: name,
          mainLocation: mainLocation,
          businessType: businessType,
        );
    await load();
    await select(org);
    return org;
  }
}

final orgProvider = StateNotifierProvider<OrgNotifier, OrgState>((ref) {
  return OrgNotifier(ref);
});
