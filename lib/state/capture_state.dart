import 'dart:async';
import 'dart:convert';
import 'dart:io';

import 'package:flutter/foundation.dart';

import '../models/capture_result.dart';
import '../models/session.dart';
import '../services/screenshot_service.dart';
import '../services/storage_service.dart';

class CaptureState extends ChangeNotifier {
  final ScreenshotService _screenshotService;
  final StorageService _storage;

  bool _isRunning = false;
  int _totalCaptures = 0;
  int _completedCaptures = 0;
  List<CaptureResult> _results = [];
  String? _errorMessage;
  Process? _process;

  CaptureState(this._screenshotService, this._storage);

  bool get isRunning => _isRunning;
  int get totalCaptures => _totalCaptures;
  int get completedCaptures => _completedCaptures;
  List<CaptureResult> get results => List.unmodifiable(_results);
  String? get errorMessage => _errorMessage;

  Future<void> runCapture(Session session) async {
    if (_isRunning) return;

    _isRunning = true;
    _results = [];
    _errorMessage = null;
    _totalCaptures =
        session.urls.length * session.browsers.length * session.viewports.length;
    _completedCaptures = 0;
    notifyListeners();

    final outputDir = _storage.screenshotDir(session.id);
    await _storage.ensureScreenshotDir(session.id);

    try {
      _process = await _screenshotService.startCapture(
        urls: session.urls,
        browsers: session.browsers,
        viewports: session.viewports,
        delayMs: session.captureDelayMs,
        outputDir: outputDir,
      );

      final stdoutCompleter = Completer<void>();
      final stderrBuffer = StringBuffer();

      _process!.stdout.transform(utf8.decoder).transform(const LineSplitter()).listen(
        (line) {
          _handleOutputLine(line);
        },
        onDone: () => stdoutCompleter.complete(),
      );

      _process!.stderr.transform(utf8.decoder).listen((data) {
        stderrBuffer.write(data);
      });

      await stdoutCompleter.future;
      final exitCode = await _process!.exitCode;

      if (exitCode != 0 && _results.isEmpty) {
        _errorMessage = stderrBuffer.toString().trim();
        if (_errorMessage!.isEmpty) {
          _errorMessage = 'Playwright process exited with code $exitCode';
        }
      }
    } catch (e) {
      _errorMessage = e.toString();
    } finally {
      _isRunning = false;
      _process = null;
      notifyListeners();
    }
  }

  void cancel() {
    _process?.kill();
    _isRunning = false;
    _process = null;
    notifyListeners();
  }

  void _handleOutputLine(String line) {
    try {
      final json = jsonDecode(line) as Map<String, dynamic>;
      final status = json['status'] as String;

      if (status == 'done' || status == 'error') {
        final browser = BrowserType.values.byName(json['browser'] as String);
        final vpParts = (json['viewport'] as String).split('x');
        final viewport =
            ViewportSize(int.parse(vpParts[0]), int.parse(vpParts[1]));

        _results.add(CaptureResult(
          url: json['url'] as String,
          browser: browser,
          viewport: viewport,
          imagePath: json['path'] as String?,
          error: json['error'] as String?,
        ));
        _completedCaptures++;
        notifyListeners();
      }
    } catch (_) {
      // Ignore non-JSON lines (e.g. Playwright download progress)
    }
  }

  void loadExistingResults(Session session) {
    final dir = Directory(_storage.screenshotDir(session.id));
    if (!dir.existsSync()) return;

    _results = [];
    final files = dir.listSync().whereType<File>().where((f) => f.path.endsWith('.png'));

    for (final file in files) {
      final name = file.uri.pathSegments.last.replaceAll('.png', '');
      // Format: <urlHash>_<browser>_<width>x<height>
      final parts = name.split('_');
      if (parts.length < 3) continue;

      final vpStr = parts.last;
      final browserStr = parts[parts.length - 2];
      final vpParts = vpStr.split('x');

      try {
        final browser = BrowserType.values.byName(browserStr);
        final viewport =
            ViewportSize(int.parse(vpParts[0]), int.parse(vpParts[1]));

        // Reconstruct URL from the metadata file if it exists, otherwise use hash
        _results.add(CaptureResult(
          url: parts.sublist(0, parts.length - 2).join('_'),
          browser: browser,
          viewport: viewport,
          imagePath: file.path,
        ));
      } catch (_) {
        continue;
      }
    }
    notifyListeners();
  }
}
