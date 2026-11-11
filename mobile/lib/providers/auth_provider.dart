import 'package:flutter_riverpod/flutter_riverpod.dart';
import '../models/user.dart';
import 'service_providers.dart';

class AuthState {
  final User? user;
  final bool isLoading;
  final String? error;

  const AuthState({this.user, this.isLoading = false, this.error});

  bool get isAuthenticated => user != null;

  AuthState copyWith({User? user, bool? isLoading, String? error}) => AuthState(
        user: user ?? this.user,
        isLoading: isLoading ?? this.isLoading,
        error: error,
      );
}

class AuthNotifier extends StateNotifier<AuthState> {
  final Ref ref;

  AuthNotifier(this.ref) : super(const AuthState());

  Future<void> checkAuth() async {
    state = state.copyWith(isLoading: true);
    try {
      final auth = ref.read(authServiceProvider);
      final loggedIn = await auth.isLoggedIn();
      if (loggedIn) {
        final user = await auth.getProfile();
        state = AuthState(user: user);
      } else {
        state = const AuthState();
      }
    } catch (_) {
      state = const AuthState();
    }
  }

  Future<void> login(String email, String password) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await ref.read(authServiceProvider).login(email, password);
      state = AuthState(user: user);
    } catch (e) {
      state = AuthState(error: _extractError(e));
    }
  }

  Future<void> register({
    required String email,
    required String password,
    required String fullName,
    String preferredLanguage = 'fr',
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await ref.read(authServiceProvider).register(
            email: email,
            password: password,
            fullName: fullName,
            preferredLanguage: preferredLanguage,
          );
      state = AuthState(user: user);
    } catch (e) {
      state = AuthState(error: _extractError(e));
    }
  }

  Future<void> logout() async {
    await ref.read(authServiceProvider).logout();
    ref.read(apiClientProvider).setOrganization(null);
    state = const AuthState();
  }

  Future<void> updateProfile({
    String? fullName,
    String? preferredLanguage,
    String? currentPassword,
    String? newPassword,
  }) async {
    state = state.copyWith(isLoading: true, error: null);
    try {
      final user = await ref.read(authServiceProvider).updateProfile(
            fullName: fullName,
            preferredLanguage: preferredLanguage,
            currentPassword: currentPassword,
            newPassword: newPassword,
          );
      state = AuthState(user: user);
    } catch (e) {
      state = state.copyWith(isLoading: false, error: _extractError(e));
    }
  }

  String _extractError(dynamic e) {
    if (e is Exception) {
      final msg = e.toString();
      if (msg.contains('detail')) {
        // Try to parse DioException
        return msg.replaceAll('Exception: ', '');
      }
    }
    return 'Erreur de connexion';
  }
}

final authProvider = StateNotifierProvider<AuthNotifier, AuthState>((ref) {
  return AuthNotifier(ref);
});
