class Location {
  final String id;
  final String name;
  final String type;
  final String description;
  final bool isActive;

  Location({
    required this.id,
    required this.name,
    this.type = 'warehouse',
    this.description = '',
    this.isActive = true,
  });

  factory Location.fromJson(Map<String, dynamic> json) => Location(
        id: json['id'] as String,
        name: json['name'] as String,
        type: json['type'] as String? ?? 'warehouse',
        description: json['description'] as String? ?? '',
        isActive: json['is_active'] as bool? ?? true,
      );
}
