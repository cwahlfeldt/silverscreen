import 'package:uuid/uuid.dart';

enum BrowserType {
  chromium,
  firefox,
  webkit;

  String get displayName {
    switch (this) {
      case BrowserType.chromium:
        return 'Chrome';
      case BrowserType.firefox:
        return 'Firefox';
      case BrowserType.webkit:
        return 'Safari (WebKit)';
    }
  }
}

class ViewportSize {
  final int width;
  final int height;

  const ViewportSize(this.width, this.height);

  String get label => '$width×$height';

  Map<String, dynamic> toJson() => {'width': width, 'height': height};

  factory ViewportSize.fromJson(Map<String, dynamic> json) =>
      ViewportSize(json['width'] as int, json['height'] as int);

  @override
  bool operator ==(Object other) =>
      other is ViewportSize && other.width == width && other.height == height;

  @override
  int get hashCode => Object.hash(width, height);

  @override
  String toString() => label;

  static const presets = [
    ViewportSize(1920, 1080),
    ViewportSize(1440, 900),
    ViewportSize(1280, 720),
    ViewportSize(375, 812),
  ];
}

class Session {
  String id;
  String name;
  List<String> urls;
  List<ViewportSize> viewports;
  List<BrowserType> browsers;
  int captureDelayMs;
  DateTime createdAt;
  DateTime updatedAt;

  Session({
    String? id,
    required this.name,
    List<String>? urls,
    List<ViewportSize>? viewports,
    List<BrowserType>? browsers,
    this.captureDelayMs = 0,
    DateTime? createdAt,
    DateTime? updatedAt,
  })  : id = id ?? const Uuid().v4(),
        urls = urls ?? [],
        viewports = viewports ?? [const ViewportSize(1920, 1080)],
        browsers = browsers ?? [BrowserType.chromium],
        createdAt = createdAt ?? DateTime.now(),
        updatedAt = updatedAt ?? DateTime.now();

  Map<String, dynamic> toJson() => {
        'id': id,
        'name': name,
        'urls': urls,
        'viewports': viewports.map((v) => v.toJson()).toList(),
        'browsers': browsers.map((b) => b.name).toList(),
        'captureDelayMs': captureDelayMs,
        'createdAt': createdAt.toIso8601String(),
        'updatedAt': updatedAt.toIso8601String(),
      };

  factory Session.fromJson(Map<String, dynamic> json) => Session(
        id: json['id'] as String,
        name: json['name'] as String,
        urls: List<String>.from(json['urls'] as List),
        viewports: (json['viewports'] as List)
            .map((v) => ViewportSize.fromJson(v as Map<String, dynamic>))
            .toList(),
        browsers: (json['browsers'] as List)
            .map((b) => BrowserType.values.byName(b as String))
            .toList(),
        captureDelayMs: json['captureDelayMs'] as int? ?? 0,
        createdAt: DateTime.parse(json['createdAt'] as String),
        updatedAt: DateTime.parse(json['updatedAt'] as String),
      );
}
