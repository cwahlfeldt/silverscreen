import 'package:flutter/material.dart';
import 'package:macos_ui/macos_ui.dart';
import 'package:provider/provider.dart';

import '../state/session_state.dart';
import '../widgets/capture_toolbar.dart';
import '../widgets/gallery_view.dart';
import '../widgets/session_list.dart';
import '../widgets/session_settings.dart';
import '../widgets/url_list.dart';

final _materialTheme = ThemeData(
  colorScheme: ColorScheme.fromSeed(
    seedColor: Colors.indigo,
    brightness: Brightness.dark,
  ),
  useMaterial3: true,
);

class HomeScreenMacos extends StatelessWidget {
  const HomeScreenMacos({super.key});

  @override
  Widget build(BuildContext context) {
    final sessionState = context.watch<SessionState>();
    final hasActiveSession = sessionState.activeSession != null;

    return MacosWindow(
      titleBar: const TitleBar(
        title: Text('Silverscreen'),
      ),
      sidebar: Sidebar(
        minWidth: 260,
        maxWidth: 350,
        startWidth: 260,
        builder: (context, scrollController) {
          return Theme(
            data: _materialTheme,
            child: const Material(
              type: MaterialType.transparency,
              child: SessionList(),
            ),
          );
        },
      ),
      child: Theme(
        data: _materialTheme,
        child: Material(
          type: MaterialType.transparency,
          child: hasActiveSession
              ? ListView(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
                  children: const [
                    UrlList(),
                    SizedBox(height: 8),
                    SessionSettings(),
                    SizedBox(height: 16),
                    CaptureToolbar(),
                    SizedBox(height: 20),
                    GalleryView(),
                  ],
                )
              : Center(
                  child: Text(
                    'Create or select a session to get started',
                    style: TextStyle(color: Colors.grey.shade500, fontSize: 16),
                  ),
                ),
        ),
      ),
    );
  }
}
