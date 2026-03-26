import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:window_manager/window_manager.dart';

import 'screens/home_screen.dart';
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
