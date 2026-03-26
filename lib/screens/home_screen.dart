import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:window_manager/window_manager.dart';

import '../state/session_state.dart';
import '../widgets/capture_toolbar.dart';
import '../widgets/gallery_view.dart';
import '../widgets/session_list.dart';
import '../widgets/session_settings.dart';
import '../widgets/url_list.dart';

class HomeScreen extends StatelessWidget {
  const HomeScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final sessionState = context.watch<SessionState>();
    final hasActiveSession = sessionState.activeSession != null;

    return Scaffold(
      body: Column(
        children: [
          // Custom draggable titlebar
          GestureDetector(
            onPanStart: (_) => windowManager.startDragging(),
            child: Container(
              height: 38,
              color: Theme.of(context).colorScheme.surfaceContainerLow,
              child: Row(
                children: [
                  const SizedBox(width: 12),
                  Text(
                    'Silverscreen',
                    style: TextStyle(
                      fontSize: 13,
                      fontWeight: FontWeight.w500,
                      color: Colors.grey.shade400,
                    ),
                  ),
                  const Spacer(),
                  _TitleBarButton(
                    icon: Icons.minimize,
                    onPressed: () => windowManager.minimize(),
                  ),
                  _TitleBarButton(
                    icon: Icons.crop_square,
                    onPressed: () async {
                      if (await windowManager.isMaximized()) {
                        windowManager.unmaximize();
                      } else {
                        windowManager.maximize();
                      }
                    },
                  ),
                  _TitleBarButton(
                    icon: Icons.close,
                    onPressed: () => windowManager.close(),
                    isClose: true,
                  ),
                ],
              ),
            ),
          ),
          const Divider(height: 1),
          // Main content
          Expanded(
            child: Row(
              children: [
                // Sidebar
                SizedBox(
                  width: 260,
                  child: Material(
                    color: Theme.of(context).colorScheme.surfaceContainerLow,
                    child: const SessionList(),
                  ),
                ),
                const VerticalDivider(width: 1),
                // Main content
                Expanded(
                  child: hasActiveSession
                      ? const _MainContent()
                      : const Center(
                          child: Text(
                            'Create or select a session to get started',
                            style: TextStyle(color: Colors.grey, fontSize: 16),
                          ),
                        ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _TitleBarButton extends StatelessWidget {
  final IconData icon;
  final VoidCallback onPressed;
  final bool isClose;

  const _TitleBarButton({
    required this.icon,
    required this.onPressed,
    this.isClose = false,
  });

  @override
  Widget build(BuildContext context) {
    return SizedBox(
      width: 46,
      height: 38,
      child: Material(
        color: Colors.transparent,
        child: InkWell(
          onTap: onPressed,
          hoverColor: isClose ? Colors.red.withAlpha(180) : Colors.white.withAlpha(20),
          child: Icon(icon, size: 16, color: Colors.grey.shade400),
        ),
      ),
    );
  }
}

class _MainContent extends StatelessWidget {
  const _MainContent();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 20),
      children: const [
        UrlList(),
        SizedBox(height: 8),
        SessionSettings(),
        SizedBox(height: 16),
        CaptureToolbar(),
        SizedBox(height: 20),
        GalleryView(),
      ],
    );
  }
}
