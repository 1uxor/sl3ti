class Contact {
  final String id;
  final String kind;
  final String name;
  final String phone;
  final String email;
  final String address;

  Contact({
    required this.id,
    required this.kind,
    required this.name,
    this.phone = '',
    this.email = '',
    this.address = '',
  });

  factory Contact.fromJson(Map<String, dynamic> json) => Contact(
        id: json['id'] as String,
        kind: json['kind'] as String,
        name: json['name'] as String,
        phone: json['phone'] as String? ?? '',
        email: json['email'] as String? ?? '',
        address: json['address'] as String? ?? '',
      );

  Map<String, dynamic> toJson() => {
        'name': name,
        'phone': phone,
        'email': email,
        'address': address,
      };
}
