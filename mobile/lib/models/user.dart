class User {
  final String id;
  final String email;
  final String fullName;
  final String preferredLanguage;

  User({
    required this.id,
    required this.email,
    required this.fullName,
    required this.preferredLanguage,
  });

  factory User.fromJson(Map<String, dynamic> json) => User(
        id: json['id'] as String,
        email: json['email'] as String,
        fullName: json['full_name'] as String,
        preferredLanguage: json['preferred_language'] as String? ?? 'fr',
      );
}
