import 'package:flutter/foundation.dart';

import '../models/session.dart';
import '../services/storage_service.dart';

class SessionState extends ChangeNotifier {
  final StorageService _storage;
  List<Session> _sessions = [];
  String? _activeSessionId;

  SessionState(this._storage);

  List<Session> get sessions => _sessions;
  String? get activeSessionId => _activeSessionId;

  Session? get activeSession {
    if (_activeSessionId == null) return null;
    try {
      return _sessions.firstWhere((s) => s.id == _activeSessionId);
    } catch (_) {
      return null;
    }
  }

  Future<void> loadFromDisk() async {
    _sessions = await _storage.loadSessions();
    if (_sessions.isNotEmpty && _activeSessionId == null) {
      _activeSessionId = _sessions.first.id;
    }
    notifyListeners();
  }

  Future<void> createSession(String name) async {
    final session = Session(name: name);
    _sessions.add(session);
    _activeSessionId = session.id;
    await _save();
  }

  Future<void> renameSession(String id, String name) async {
    _findSession(id).name = name;
    await _save();
  }

  Future<void> deleteSession(String id) async {
    _sessions.removeWhere((s) => s.id == id);
    await _storage.deleteSessionDir(id);
    if (_activeSessionId == id) {
      _activeSessionId = _sessions.isNotEmpty ? _sessions.first.id : null;
    }
    await _save();
  }

  void setActiveSession(String id) {
    _activeSessionId = id;
    notifyListeners();
  }

  Future<void> addUrl(String url) async {
    activeSession?.urls.add(url);
    await _save();
  }

  Future<void> removeUrl(int index) async {
    activeSession?.urls.removeAt(index);
    await _save();
  }

  Future<void> reorderUrl(int oldIndex, int newIndex) async {
    final urls = activeSession?.urls;
    if (urls == null) return;
    if (newIndex > oldIndex) newIndex--;
    final url = urls.removeAt(oldIndex);
    urls.insert(newIndex, url);
    await _save();
  }

  Future<void> updateUrl(int index, String url) async {
    final urls = activeSession?.urls;
    if (urls == null || index >= urls.length) return;
    urls[index] = url;
    await _save();
  }

  Future<void> toggleBrowser(BrowserType browser) async {
    final session = activeSession;
    if (session == null) return;
    if (session.browsers.contains(browser)) {
      if (session.browsers.length > 1) {
        session.browsers.remove(browser);
      }
    } else {
      session.browsers.add(browser);
    }
    await _save();
  }

  Future<void> addViewport(ViewportSize viewport) async {
    final session = activeSession;
    if (session == null) return;
    if (!session.viewports.contains(viewport)) {
      session.viewports.add(viewport);
      await _save();
    }
  }

  Future<void> removeViewport(ViewportSize viewport) async {
    final session = activeSession;
    if (session == null || session.viewports.length <= 1) return;
    session.viewports.remove(viewport);
    await _save();
  }

  Future<void> setCaptureDelay(int delayMs) async {
    final session = activeSession;
    if (session == null) return;
    session.captureDelayMs = delayMs;
    await _save();
  }

  Session _findSession(String id) => _sessions.firstWhere((s) => s.id == id);

  Future<void> _save() async {
    for (final s in _sessions) {
      s.updatedAt = DateTime.now();
    }
    await _storage.saveSessions(_sessions);
    notifyListeners();
  }
}
