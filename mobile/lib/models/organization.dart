class Organization {
  final String id;
  final String name;
  final String businessType;
  final List<String> enabledModules;
  final String role;

  Organization({
    required this.id,
    required this.name,
    required this.businessType,
    required this.enabledModules,
    required this.role,
  });

  factory Organization.fromJson(Map<String, dynamic> json) => Organization(
        id: json['id'] as String,
        name: json['name'] as String,
        businessType: json['business_type'] as String,
        enabledModules: (json['enabled_modules'] as List).cast<String>(),
        role: json['role'] as String,
      );

  bool hasModule(String module) => enabledModules.contains(module);
}
