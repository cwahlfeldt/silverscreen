import 'dart:io' show Platform;

import 'package:fluent_ui/fluent_ui.dart' as fluent;
import 'package:flutter/material.dart';
import 'package:flutter_localizations/flutter_localizations.dart';
import 'package:macos_ui/macos_ui.dart' as macos;
import 'package:provider/provider.dart';
import 'package:window_manager/window_manager.dart';

import 'screens/home_screen.dart';
import 'screens/home_screen_macos.dart';
import 'screens/home_screen_windows.dart';
import 'services/screenshot_service.dart';
import 'services/storage_service.dart';
import 'state/capture_state.dart';
import 'state/session_state.dart';

void main() async {
  WidgetsFlutterBinding.ensureInitialized();

  final storage = StorageService();
  final sessionState = SessionState(storage);
  await sessionState.loadFromDisk();
  await windowManager.ensureInitialized();

  windowManager.waitUntilReadyToShow().then((_) async {
    await windowManager.setTitleBarStyle(TitleBarStyle.hidden);
    await windowManager.show();
  });

  runApp(
    MultiProvider(
      providers: [
        ChangeNotifierProvider.value(value: sessionState),
        ChangeNotifierProvider(
          create: (_) => CaptureState(ScreenshotService(), storage),
        ),
      ],
      child: const SilverscreenApp(),
    ),
  );
}

class SilverscreenApp extends StatelessWidget {
  const SilverscreenApp({super.key});

  @override
  Widget build(BuildContext context) {
    if (Platform.isMacOS) {
      return macos.MacosApp(
        title: 'Silverscreen',
        debugShowCheckedModeBanner: false,
        darkTheme: macos.MacosThemeData.dark(),
        themeMode: ThemeMode.dark,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
        ],
        home: const HomeScreenMacos(),
      );
    }

    if (Platform.isWindows) {
      return fluent.FluentApp(
        title: 'Silverscreen',
        debugShowCheckedModeBanner: false,
        darkTheme: fluent.FluentThemeData(brightness: Brightness.dark),
        themeMode: ThemeMode.dark,
        localizationsDelegates: const [
          GlobalMaterialLocalizations.delegate,
          GlobalWidgetsLocalizations.delegate,
          GlobalCupertinoLocalizations.delegate,
          fluent.FluentLocalizations.delegate,
        ],
        home: const HomeScreenWindows(),
      );
    }

    // Linux fallback — Material
    return MaterialApp(
      title: 'Silverscreen',
      debugShowCheckedModeBanner: false,
      theme: ThemeData(
        colorScheme: ColorScheme.fromSeed(
          seedColor: Colors.indigo,
          brightness: Brightness.dark,
        ),
        useMaterial3: true,
      ),
      home: const HomeScreen(),
    );
  }
}
