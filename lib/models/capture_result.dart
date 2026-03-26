import 'session.dart';

class CaptureResult {
  final String url;
  final BrowserType browser;
  final ViewportSize viewport;
  final String? imagePath;
  final String? error;

  const CaptureResult({
    required this.url,
    required this.browser,
    required this.viewport,
    this.imagePath,
    this.error,
  });

  bool get succeeded => imagePath != null && error == null;
}
