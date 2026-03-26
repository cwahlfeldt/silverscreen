import 'dart:convert';
import 'dart:io';

import '../models/session.dart';

class ScreenshotService {
  Future<Process> startCapture({
    required List<String> urls,
    required List<BrowserType> browsers,
    required List<ViewportSize> viewports,
    required int delayMs,
    required String outputDir,
  }) async {
    final scriptPath = _resolveScriptPath();
    return Process.start('node', [
      scriptPath,
      '--urls',
      jsonEncode(urls),
      '--browsers',
      jsonEncode(browsers.map((b) => b.name).toList()),
      '--viewports',
      jsonEncode(viewports.map((v) => '${v.width}x${v.height}').toList()),
      '--delay',
      delayMs.toString(),
      '--output',
      outputDir,
    ]);
  }

  String _resolveScriptPath() {
    // Walk up from the executable to find the project root's scripts/ dir.
    // In development, Platform.script points to the project.
    // As a fallback, check relative to cwd.
    final candidates = [
      // Development: relative to project root
      '${Directory.current.path}/scripts/capture.js',
      // Resolved from executable location
      '${File(Platform.resolvedExecutable).parent.path}/scripts/capture.js',
      // Up a few levels from executable (common in Flutter builds)
      '${File(Platform.resolvedExecutable).parent.parent.path}/scripts/capture.js',
    ];

    for (final path in candidates) {
      if (File(path).existsSync()) return path;
    }

    // Default to cwd-relative
    return '${Directory.current.path}/scripts/capture.js';
  }
}
