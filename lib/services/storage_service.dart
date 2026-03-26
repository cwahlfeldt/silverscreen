import 'dart:convert';
import 'dart:io';

import '../models/session.dart';

class StorageService {
  late final String _baseDir;

  StorageService() {
    final home = Platform.environment['HOME'] ??
        Platform.environment['USERPROFILE'] ??
        '.';
    _baseDir = '$home/.silverscreen';
  }

  String get _sessionsFile => '$_baseDir/sessions.json';

  String screenshotDir(String sessionId) => '$_baseDir/screenshots/$sessionId';

  Future<void> _ensureBaseDir() async {
    await Directory(_baseDir).create(recursive: true);
  }

  Future<List<Session>> loadSessions() async {
    final file = File(_sessionsFile);
    if (!await file.exists()) return [];
    final content = await file.readAsString();
    final list = jsonDecode(content) as List;
    return list
        .map((e) => Session.fromJson(e as Map<String, dynamic>))
        .toList();
  }

  Future<void> saveSessions(List<Session> sessions) async {
    await _ensureBaseDir();
    final file = File(_sessionsFile);
    final json = jsonEncode(sessions.map((s) => s.toJson()).toList());
    await file.writeAsString(json);
  }

  Future<void> ensureScreenshotDir(String sessionId) async {
    await Directory(screenshotDir(sessionId)).create(recursive: true);
  }

  Future<void> deleteSessionDir(String sessionId) async {
    final dir = Directory(screenshotDir(sessionId));
    if (await dir.exists()) {
      await dir.delete(recursive: true);
    }
  }
}
