# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Silverscreen is a Flutter desktop app for capturing browser screenshots across multiple browsers and viewports using Playwright. Users manage sessions containing URLs, select browsers (Chromium/Firefox/WebKit) and viewport sizes, then batch-capture screenshots.

## Commands

```bash
flutter pub get                # Install Flutter dependencies
cd scripts && npm install      # Install Node.js/Playwright dependencies
flutter analyze                # Lint (uses flutter_lints)
flutter test                   # Run tests
flutter test test/widget_test.dart  # Run a single test file
flutter run -d linux           # Run on Linux desktop
flutter run -d macos           # Run on macOS desktop
flutter run -d windows         # Run on Windows desktop
```

## Architecture

**State management:** Provider with ChangeNotifier. Two providers initialized in `main()` via `MultiProvider`:
- `SessionState` — manages sessions, URLs, browser/viewport settings; persists to disk via `StorageService`
- `CaptureState` — manages active capture execution; spawns Node.js process via `ScreenshotService`

**Capture pipeline:** Dart spawns `node scripts/capture.js` with CLI args (`--urls`, `--browsers`, `--viewports`, `--delay`, `--output`). The script uses Playwright to capture screenshots and emits JSON status lines on stdout (`done`/`error`/`complete`) which `CaptureState` parses to update results.

**Storage:** Sessions persist to `~/.silverscreen/sessions.json`. Screenshots are saved to `~/.silverscreen/screenshots/<sessionId>/`.

**UI layout (HomeScreen):** Fixed-width sidebar (SessionList) + main content area showing UrlList, SessionSettings, CaptureToolbar, and GalleryView when a session is selected.

## Key Dependencies

- `provider` — state management
- `window_manager` — desktop window control (hidden titlebar)
- `path_provider` — file system paths
- Playwright (Node.js, in `scripts/`) — browser automation
