import 'dart:io';

import 'package:fluent_ui/fluent_ui.dart';
import 'package:flutter/material.dart' as m;
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';
import 'package:window_manager/window_manager.dart';

import '../models/capture_result.dart';
import '../models/session.dart';
import '../state/capture_state.dart';
import '../state/session_state.dart';

class HomeScreenWindows extends StatelessWidget {
  const HomeScreenWindows({super.key});

  @override
  Widget build(BuildContext context) {
    final sessionState = context.watch<SessionState>();
    final hasActiveSession = sessionState.activeSession != null;
    final theme = FluentTheme.of(context);

    return Column(
      children: [
        // Title bar
        _TitleBar(theme: theme),
        const Divider(),
        // Main layout
        Expanded(
          child: Row(
            children: [
              // Sidebar
              SizedBox(
                width: 260,
                child: ColoredBox(
                  color: theme.micaBackgroundColor,
                  child: const _SessionSidebar(),
                ),
              ),
              const Divider(direction: Axis.vertical),
              // Content
              Expanded(
                child: hasActiveSession
                    ? const _ContentArea()
                    : Center(
                        child: Text(
                          'Create or select a session to get started',
                          style: TextStyle(
                            color: m.Colors.grey.shade500,
                            fontSize: 16,
                          ),
                        ),
                      ),
              ),
            ],
          ),
        ),
      ],
    );
  }
}

// =============================================================================
// Title bar
// =============================================================================

class _TitleBar extends StatelessWidget {
  final FluentThemeData theme;
  const _TitleBar({required this.theme});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onPanStart: (_) => windowManager.startDragging(),
      child: Container(
        height: 32,
        color: theme.micaBackgroundColor,
        child: Row(
          children: [
            const SizedBox(width: 12),
            Text(
              'Silverscreen',
              style: TextStyle(
                fontSize: 12,
                fontWeight: FontWeight.w400,
                color: m.Colors.grey.shade400,
              ),
            ),
            const Spacer(),
            _WindowButton(
              icon: const Icon(FluentIcons.chrome_minimize, size: 10),
              onPressed: () => windowManager.minimize(),
            ),
            _WindowButton(
              icon: const Icon(FluentIcons.checkbox_composite, size: 10),
              onPressed: () async {
                if (await windowManager.isMaximized()) {
                  windowManager.unmaximize();
                } else {
                  windowManager.maximize();
                }
              },
            ),
            _WindowButton(
              icon: const Icon(FluentIcons.chrome_close, size: 10),
              onPressed: () => windowManager.close(),
              isClose: true,
            ),
          ],
        ),
      ),
    );
  }
}

class _WindowButton extends StatefulWidget {
  final Widget icon;
  final VoidCallback onPressed;
  final bool isClose;

  const _WindowButton({
    required this.icon,
    required this.onPressed,
    this.isClose = false,
  });

  @override
  State<_WindowButton> createState() => _WindowButtonState();
}

class _WindowButtonState extends State<_WindowButton> {
  bool _hovering = false;

  @override
  Widget build(BuildContext context) {
    return MouseRegion(
      onEnter: (_) => setState(() => _hovering = true),
      onExit: (_) => setState(() => _hovering = false),
      child: GestureDetector(
        onTap: widget.onPressed,
        child: Container(
          width: 46,
          height: 32,
          color: _hovering
              ? (widget.isClose
                  ? const Color(0xFFC42B1C)
                  : m.Colors.white.withAlpha(15))
              : Colors.transparent,
          alignment: Alignment.center,
          child: IconTheme(
            data: IconThemeData(
              size: 10,
              color: _hovering && widget.isClose
                  ? m.Colors.white
                  : m.Colors.grey.shade400,
            ),
            child: widget.icon,
          ),
        ),
      ),
    );
  }
}

// =============================================================================
// Session sidebar
// =============================================================================

class _SessionSidebar extends StatelessWidget {
  const _SessionSidebar();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<SessionState>();
    final sessions = state.sessions;
    final theme = FluentTheme.of(context);

    return Column(
      children: [
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
          child: Row(
            children: [
              const Text(
                'Sessions',
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600),
              ),
              const Spacer(),
              IconButton(
                icon: const Icon(FluentIcons.add, size: 14),
                onPressed: () => _showCreateDialog(context, state),
              ),
            ],
          ),
        ),
        const Divider(),
        Expanded(
          child: sessions.isEmpty
              ? Center(
                  child: Text(
                    'No sessions yet',
                    style: TextStyle(color: m.Colors.grey.shade500),
                  ),
                )
              : ListView.builder(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
                  itemCount: sessions.length,
                  itemBuilder: (context, index) {
                    final session = sessions[index];
                    final isActive = session.id == state.activeSessionId;
                    return _SessionItem(
                      session: session,
                      isActive: isActive,
                      accentColor: theme.accentColor,
                      onTap: () => state.setActiveSession(session.id),
                      onRename: () => _showRenameDialog(
                          context, state, session.id, session.name),
                      onDelete: () => _showDeleteConfirm(
                          context, state, session.id, session.name),
                    );
                  },
                ),
        ),
      ],
    );
  }

  void _showCreateDialog(BuildContext context, SessionState state) {
    final controller = TextEditingController();
    showDialog(
      context: context,
      builder: (ctx) => ContentDialog(
        title: const Text('New Session'),
        content: TextBox(
          controller: controller,
          placeholder: 'e.g. Homepage Redesign',
          autofocus: true,
          onSubmitted: (_) {
            if (controller.text.trim().isNotEmpty) {
              state.createSession(controller.text.trim());
              Navigator.of(ctx).pop();
            }
          },
        ),
        actions: [
          Button(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          FilledButton(
            child: const Text('Create'),
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                state.createSession(controller.text.trim());
                Navigator.of(ctx).pop();
              }
            },
          ),
        ],
      ),
    );
  }

  void _showRenameDialog(
      BuildContext context, SessionState state, String id, String currentName) {
    final controller = TextEditingController(text: currentName);
    showDialog(
      context: context,
      builder: (ctx) => ContentDialog(
        title: const Text('Rename Session'),
        content: TextBox(
          controller: controller,
          autofocus: true,
          onSubmitted: (_) {
            if (controller.text.trim().isNotEmpty) {
              state.renameSession(id, controller.text.trim());
              Navigator.of(ctx).pop();
            }
          },
        ),
        actions: [
          Button(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          FilledButton(
            child: const Text('Rename'),
            onPressed: () {
              if (controller.text.trim().isNotEmpty) {
                state.renameSession(id, controller.text.trim());
                Navigator.of(ctx).pop();
              }
            },
          ),
        ],
      ),
    );
  }

  void _showDeleteConfirm(
      BuildContext context, SessionState state, String id, String name) {
    showDialog(
      context: context,
      builder: (ctx) => ContentDialog(
        title: const Text('Delete Session'),
        content: Text('Delete "$name" and all its screenshots?'),
        actions: [
          Button(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          FilledButton(
            style: ButtonStyle(
              backgroundColor: WidgetStatePropertyAll(m.Colors.red.shade700),
            ),
            child: const Text('Delete'),
            onPressed: () {
              state.deleteSession(id);
              Navigator.of(ctx).pop();
            },
          ),
        ],
      ),
    );
  }
}

class _SessionItem extends StatelessWidget {
  final Session session;
  final bool isActive;
  final AccentColor accentColor;
  final VoidCallback onTap;
  final VoidCallback onRename;
  final VoidCallback onDelete;

  const _SessionItem({
    required this.session,
    required this.isActive,
    required this.accentColor,
    required this.onTap,
    required this.onRename,
    required this.onDelete,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.only(bottom: 2),
      child: HoverButton(
        onPressed: onTap,
        builder: (context, states) {
          final isHovered = states.isHovered;
          return Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 8),
            decoration: BoxDecoration(
              color: isActive
                  ? accentColor.withAlpha(30)
                  : isHovered
                      ? m.Colors.white.withAlpha(10)
                      : Colors.transparent,
              borderRadius: BorderRadius.circular(4),
            ),
            child: Row(
              children: [
                // Active indicator bar
                Container(
                  width: 3,
                  height: 18,
                  decoration: BoxDecoration(
                    color: isActive ? accentColor : Colors.transparent,
                    borderRadius: BorderRadius.circular(2),
                  ),
                ),
                const SizedBox(width: 10),
                // Session info
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        session.name,
                        overflow: TextOverflow.ellipsis,
                        style: const TextStyle(fontSize: 13),
                      ),
                      const SizedBox(height: 2),
                      Text(
                        '${session.urls.length} URLs',
                        style: TextStyle(
                          fontSize: 11,
                          color: m.Colors.grey.shade500,
                        ),
                      ),
                    ],
                  ),
                ),
                // Actions menu
                if (isHovered || isActive)
                  DropDownButton(
                    title: Icon(
                      FluentIcons.more,
                      size: 12,
                      color: m.Colors.grey.shade400,
                    ),
                    items: [
                      MenuFlyoutItem(
                        text: const Text('Rename'),
                        leading: const Icon(FluentIcons.rename, size: 14),
                        onPressed: onRename,
                      ),
                      MenuFlyoutItem(
                        text: const Text('Delete'),
                        leading: Icon(FluentIcons.delete, size: 14,
                            color: m.Colors.red.shade400),
                        onPressed: onDelete,
                      ),
                    ],
                  ),
              ],
            ),
          );
        },
      ),
    );
  }
}

// =============================================================================
// Content area
// =============================================================================

class _ContentArea extends StatelessWidget {
  const _ContentArea();

  @override
  Widget build(BuildContext context) {
    return ListView(
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 20),
      children: const [
        _UrlSection(),
        SizedBox(height: 12),
        _SettingsSection(),
        SizedBox(height: 16),
        _CaptureSection(),
        SizedBox(height: 20),
        _GallerySection(),
      ],
    );
  }
}

// =============================================================================
// URL section
// =============================================================================

class _UrlSection extends StatelessWidget {
  const _UrlSection();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<SessionState>();
    final session = state.activeSession;
    if (session == null) return const SizedBox.shrink();
    final urls = session.urls;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text(
              'URLs',
              style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
            ),
            const Spacer(),
            Button(
              child: const Row(
                mainAxisSize: MainAxisSize.min,
                children: [
                  Icon(FluentIcons.add, size: 12),
                  SizedBox(width: 6),
                  Text('Add URL'),
                ],
              ),
              onPressed: () => _showAddUrlDialog(context, state),
            ),
          ],
        ),
        const SizedBox(height: 8),
        if (urls.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(vertical: 12),
            child: Text(
              'No URLs added yet. Click "Add URL" to get started.',
              style: TextStyle(color: m.Colors.grey.shade500),
            ),
          )
        else
          ...List.generate(urls.length, (index) {
            return Padding(
              padding: const EdgeInsets.only(bottom: 4),
              child: HoverButton(
                onPressed: () {},
                builder: (context, states) => Container(
                  padding:
                      const EdgeInsets.symmetric(horizontal: 10, vertical: 6),
                  decoration: BoxDecoration(
                    color: states.isHovered
                        ? m.Colors.white.withAlpha(8)
                        : Colors.transparent,
                    borderRadius: BorderRadius.circular(4),
                  ),
                  child: Row(
                    children: [
                      Icon(FluentIcons.globe, size: 14,
                          color: m.Colors.grey.shade500),
                      const SizedBox(width: 10),
                      Expanded(
                        child: Text(
                          urls[index],
                          overflow: TextOverflow.ellipsis,
                          style: const TextStyle(fontSize: 13),
                        ),
                      ),
                      IconButton(
                        icon: Icon(FluentIcons.chrome_close, size: 10,
                            color: m.Colors.grey.shade500),
                        onPressed: () => state.removeUrl(index),
                      ),
                    ],
                  ),
                ),
              ),
            );
          }),
      ],
    );
  }

  void _showAddUrlDialog(BuildContext context, SessionState state) {
    final controller = TextEditingController(text: 'https://');
    showDialog(
      context: context,
      builder: (ctx) => ContentDialog(
        title: const Text('Add URL'),
        content: TextBox(
          controller: controller,
          autofocus: true,
          placeholder: 'https://example.com',
          onSubmitted: (_) {
            final url = controller.text.trim();
            if (_isValidUrl(url)) {
              state.addUrl(url);
              Navigator.of(ctx).pop();
            }
          },
        ),
        actions: [
          Button(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          FilledButton(
            child: const Text('Add'),
            onPressed: () {
              final url = controller.text.trim();
              if (_isValidUrl(url)) {
                state.addUrl(url);
                Navigator.of(ctx).pop();
              }
            },
          ),
        ],
      ),
    );
  }

  bool _isValidUrl(String url) {
    return Uri.tryParse(url)?.hasScheme ?? false;
  }
}

// =============================================================================
// Settings section
// =============================================================================

class _SettingsSection extends StatelessWidget {
  const _SettingsSection();

  @override
  Widget build(BuildContext context) {
    final state = context.watch<SessionState>();
    final session = state.activeSession;
    if (session == null) return const SizedBox.shrink();

    return Expander(
      header: const Text(
        'Settings',
        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
      initiallyExpanded: true,
      content: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          _buildBrowserSection(state, session),
          const SizedBox(height: 16),
          _buildViewportSection(context, state, session),
          const SizedBox(height: 16),
          _buildDelaySection(state, session),
        ],
      ),
    );
  }

  Widget _buildBrowserSection(SessionState state, Session session) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Browsers',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 16,
          runSpacing: 8,
          children: BrowserType.values.map((browser) {
            final selected = session.browsers.contains(browser);
            return Checkbox(
              checked: selected,
              onChanged: (_) => state.toggleBrowser(browser),
              content: Text(browser.displayName),
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildViewportSection(
      BuildContext context, SessionState state, Session session) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            const Text('Viewports',
                style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            const Spacer(),
            IconButton(
              icon: const Icon(FluentIcons.add, size: 14),
              onPressed: () => _showAddViewportDialog(context, state, session),
            ),
          ],
        ),
        const SizedBox(height: 4),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: session.viewports.map((vp) {
            return _ViewportChip(
              label: vp.label,
              onRemove: session.viewports.length > 1
                  ? () => state.removeViewport(vp)
                  : null,
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildDelaySection(SessionState state, Session session) {

    return Row(
      children: [
        const Text('Capture delay',
            style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        const SizedBox(width: 12),
        SizedBox(
          width: 100,
          child: TextBox(
            controller:
                TextEditingController(text: session.captureDelayMs.toString()),
            suffix: const Padding(
              padding: EdgeInsets.only(right: 8),
              child: Text('ms'),
            ),
            keyboardType: TextInputType.number,
            inputFormatters: [FilteringTextInputFormatter.digitsOnly],
            onSubmitted: (value) {
              final delay = int.tryParse(value) ?? 0;
              state.setCaptureDelay(delay);
            },
          ),
        ),
      ],
    );
  }

  void _showAddViewportDialog(
      BuildContext context, SessionState state, Session session) {
    final available = ViewportSize.presets
        .where((vp) => !session.viewports.contains(vp))
        .toList();
    final widthController = TextEditingController();
    final heightController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => ContentDialog(
        title: const Text('Add Viewport'),
        content: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            if (available.isNotEmpty) ...[
              const Text('Presets:', style: TextStyle(fontSize: 13)),
              const SizedBox(height: 8),
              Wrap(
                spacing: 8,
                runSpacing: 4,
                children: available.map((vp) {
                  return Button(
                    child: Text(vp.label),
                    onPressed: () {
                      state.addViewport(vp);
                      Navigator.of(ctx).pop();
                    },
                  );
                }).toList(),
              ),
              const SizedBox(height: 16),
              const Text('Custom:', style: TextStyle(fontSize: 13)),
              const SizedBox(height: 8),
            ],
            Row(
              children: [
                Expanded(
                  child: TextBox(
                    controller: widthController,
                    placeholder: 'Width',
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('\u00d7'),
                ),
                Expanded(
                  child: TextBox(
                    controller: heightController,
                    placeholder: 'Height',
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          Button(
            child: const Text('Cancel'),
            onPressed: () => Navigator.of(ctx).pop(),
          ),
          FilledButton(
            child: const Text('Add'),
            onPressed: () {
              final w = int.tryParse(widthController.text);
              final h = int.tryParse(heightController.text);
              if (w != null && h != null && w > 0 && h > 0) {
                state.addViewport(ViewportSize(w, h));
                Navigator.of(ctx).pop();
              }
            },
          ),
        ],
      ),
    );
  }
}

class _ViewportChip extends StatelessWidget {
  final String label;
  final VoidCallback? onRemove;

  const _ViewportChip({required this.label, this.onRemove});

  @override
  Widget build(BuildContext context) {
    final theme = FluentTheme.of(context);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(4),
        border: Border.all(color: m.Colors.white.withAlpha(15)),
      ),
      child: Row(
        mainAxisSize: MainAxisSize.min,
        children: [
          Text(label, style: const TextStyle(fontSize: 12)),
          if (onRemove != null) ...[
            const SizedBox(width: 6),
            GestureDetector(
              onTap: onRemove,
              child: Icon(FluentIcons.chrome_close, size: 8,
                  color: m.Colors.grey.shade500),
            ),
          ],
        ],
      ),
    );
  }
}

// =============================================================================
// Capture section
// =============================================================================

class _CaptureSection extends StatelessWidget {
  const _CaptureSection();

  @override
  Widget build(BuildContext context) {
    final sessionState = context.watch<SessionState>();
    final captureState = context.watch<CaptureState>();
    final session = sessionState.activeSession;
    if (session == null) return const SizedBox.shrink();

    final canRun = !captureState.isRunning &&
        session.urls.isNotEmpty &&
        session.browsers.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        if (captureState.isRunning) ...[
          Row(
            children: [
              Text(
                'Capturing ${captureState.completedCaptures}/${captureState.totalCaptures}',
                style: const TextStyle(fontSize: 13),
              ),
              const Spacer(),
              Button(
                onPressed: captureState.cancel,
                child: const Text('Cancel'),
              ),
            ],
          ),
          const SizedBox(height: 8),
          ProgressBar(
            value: captureState.totalCaptures > 0
                ? captureState.completedCaptures /
                    captureState.totalCaptures *
                    100
                : null,
          ),
        ] else ...[
          Row(
            children: [
              FilledButton(
                onPressed: canRun
                    ? () => captureState.runCapture(session)
                    : null,
                child: const Row(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(FluentIcons.play, size: 14),
                    SizedBox(width: 8),
                    Text('Run Capture'),
                  ],
                ),
              ),
              if (!canRun && session.urls.isEmpty)
                Padding(
                  padding: const EdgeInsets.only(left: 12),
                  child: Text(
                    'Add URLs to capture',
                    style: TextStyle(
                      color: m.Colors.grey.shade500,
                      fontSize: 12,
                    ),
                  ),
                ),
            ],
          ),
        ],
        if (captureState.errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: InfoBar(
              title: const Text('Error'),
              content: Text(captureState.errorMessage!),
              severity: InfoBarSeverity.error,
            ),
          ),
      ],
    );
  }
}

// =============================================================================
// Gallery section (wraps Material GalleryView for the image grid)
// =============================================================================

class _GallerySection extends StatelessWidget {
  const _GallerySection();

  @override
  Widget build(BuildContext context) {
    final captureState = context.watch<CaptureState>();
    final results = captureState.results;

    if (results.isEmpty) {
      return Padding(
        padding: const EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text(
            'No screenshots yet. Run a capture to see results here.',
            style: TextStyle(color: m.Colors.grey.shade500),
          ),
        ),
      );
    }

    // Group results by URL, then by viewport
    final grouped = <String, Map<String, List<CaptureResult>>>{};
    for (final r in results) {
      grouped.putIfAbsent(r.url, () => {});
      grouped[r.url]!.putIfAbsent(r.viewport.label, () => []).add(r);
    }

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Padding(
          padding: EdgeInsets.only(bottom: 12),
          child: Text(
            'Results',
            style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
          ),
        ),
        ...grouped.entries.map((urlEntry) {
          return _UrlResultGroup(
            url: urlEntry.key,
            resultsByViewport: urlEntry.value,
          );
        }),
      ],
    );
  }
}

class _UrlResultGroup extends StatelessWidget {
  final String url;
  final Map<String, List<CaptureResult>> resultsByViewport;

  const _UrlResultGroup({
    required this.url,
    required this.resultsByViewport,
  });

  @override
  Widget build(BuildContext context) {
    final theme = FluentTheme.of(context);
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: theme.cardColor,
            borderRadius: BorderRadius.circular(4),
          ),
          child: Text(
            url,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              fontFamily: 'Consolas',
            ),
          ),
        ),
        const SizedBox(height: 8),
        ...resultsByViewport.entries.map((vpEntry) {
          return _ViewportRow(
            viewportLabel: vpEntry.key,
            results: vpEntry.value,
          );
        }),
        const SizedBox(height: 16),
      ],
    );
  }
}

class _ViewportRow extends StatefulWidget {
  final String viewportLabel;
  final List<CaptureResult> results;

  const _ViewportRow({required this.viewportLabel, required this.results});

  @override
  State<_ViewportRow> createState() => _ViewportRowState();
}

class _ViewportRowState extends State<_ViewportRow> {
  final List<ScrollController> _controllers = [];
  final List<VoidCallback> _listeners = [];

  @override
  void initState() {
    super.initState();
    _initControllers();
  }

  void _initControllers() {
    for (var i = 0; i < _controllers.length; i++) {
      _controllers[i].removeListener(_listeners[i]);
      _controllers[i].dispose();
    }
    _controllers.clear();
    _listeners.clear();
    for (var i = 0; i < widget.results.length; i++) {
      final controller = ScrollController();
      void listener() => _syncScroll(controller);
      controller.addListener(listener);
      _controllers.add(controller);
      _listeners.add(listener);
    }
  }

  @override
  void didUpdateWidget(_ViewportRow oldWidget) {
    super.didUpdateWidget(oldWidget);
    if (oldWidget.results.length != widget.results.length) {
      _initControllers();
    }
  }

  bool _syncing = false;

  void _syncScroll(ScrollController source) {
    if (_syncing) return;
    _syncing = true;
    for (final c in _controllers) {
      if (c != source && c.hasClients) {
        final maxExtent = c.position.maxScrollExtent;
        final sourceMax = source.position.maxScrollExtent;
        if (sourceMax > 0 && maxExtent > 0) {
          final ratio = source.offset / sourceMax;
          c.jumpTo((ratio * maxExtent).clamp(0.0, maxExtent));
        }
      }
    }
    _syncing = false;
  }

  @override
  void dispose() {
    for (var i = 0; i < _controllers.length; i++) {
      _controllers[i].removeListener(_listeners[i]);
      _controllers[i].dispose();
    }
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Padding(
          padding: const EdgeInsets.only(left: 4, top: 8, bottom: 6),
          child: Text(
            widget.viewportLabel,
            style: TextStyle(
              fontSize: 12,
              fontWeight: FontWeight.w500,
              color: m.Colors.grey.shade400,
            ),
          ),
        ),
        Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            for (var i = 0; i < widget.results.length; i++) ...[
              if (i > 0) const SizedBox(width: 8),
              Expanded(
                child: _ScreenshotCard(
                  result: widget.results[i],
                  scrollController: _controllers[i],
                ),
              ),
            ],
          ],
        ),
        const SizedBox(height: 8),
      ],
    );
  }
}

class _ScreenshotCard extends StatelessWidget {
  final CaptureResult result;
  final ScrollController scrollController;

  const _ScreenshotCard({
    required this.result,
    required this.scrollController,
  });

  Color _browserColor(BrowserType browser) {
    switch (browser) {
      case BrowserType.chromium:
        return const Color(0xFF4285F4);
      case BrowserType.firefox:
        return const Color(0xFFFF9500);
      case BrowserType.webkit:
        return const Color(0xFF9B59B6);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = FluentTheme.of(context);
    final color = _browserColor(result.browser);

    return Container(
      clipBehavior: Clip.antiAlias,
      decoration: BoxDecoration(
        color: theme.cardColor,
        borderRadius: BorderRadius.circular(6),
        border: Border.all(color: m.Colors.white.withAlpha(10)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Browser + viewport label
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: color.withAlpha(25),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                ),
                const SizedBox(width: 8),
                Text(
                  result.browser.displayName,
                  style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                ),
                const Spacer(),
                Text(
                  result.viewport.label,
                  style: TextStyle(fontSize: 12, color: m.Colors.grey.shade500),
                ),
              ],
            ),
          ),
          // Image or error
          if (result.succeeded && result.imagePath != null)
            GestureDetector(
              onTap: () => _showFullScreen(context, result),
              child: MouseRegion(
                cursor: SystemMouseCursors.zoomIn,
                child: AspectRatio(
                  aspectRatio: result.viewport.width / result.viewport.height,
                  child: SingleChildScrollView(
                    controller: scrollController,
                    child: Image.file(
                      File(result.imagePath!),
                      width: double.infinity,
                      fit: BoxFit.fitWidth,
                      errorBuilder: (_, _, _) => const Center(
                        child: Icon(FluentIcons.photo_error, size: 48,
                            color: Color(0xFF666666)),
                      ),
                    ),
                  ),
                ),
              ),
            )
          else
            AspectRatio(
              aspectRatio: result.viewport.width / result.viewport.height,
              child: Center(
                child: Column(
                  mainAxisSize: MainAxisSize.min,
                  children: [
                    Icon(FluentIcons.error_badge, size: 36,
                        color: m.Colors.red.shade400),
                    const SizedBox(height: 8),
                    Text(
                      result.error ?? 'Unknown error',
                      textAlign: TextAlign.center,
                      style: TextStyle(
                        color: m.Colors.red.shade400,
                        fontSize: 12,
                      ),
                    ),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }

  void _showFullScreen(BuildContext context, CaptureResult result) {
    final aspectRatio = result.viewport.width / result.viewport.height;
    final color = _browserColor(result.browser);

    showDialog(
      context: context,
      builder: (ctx) => ContentDialog(
        constraints: const BoxConstraints(maxWidth: 1200, maxHeight: 900),
        content: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: color.withAlpha(25),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(color: color, shape: BoxShape.circle),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    result.browser.displayName,
                    style: const TextStyle(fontWeight: FontWeight.w600, fontSize: 13),
                  ),
                  const Spacer(),
                  Text(
                    result.viewport.label,
                    style: TextStyle(fontSize: 12, color: m.Colors.grey.shade500),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(FluentIcons.chrome_close, size: 12),
                    onPressed: () => Navigator.of(ctx).pop(),
                  ),
                ],
              ),
            ),
            // Scrollable image
            Expanded(
              child: LayoutBuilder(
                builder: (context, constraints) {
                  final imageWidth = constraints.maxHeight * aspectRatio;
                  return SingleChildScrollView(
                    child: Center(
                      child: SizedBox(
                        width: imageWidth.clamp(0.0, constraints.maxWidth),
                        child: Image.file(
                          File(result.imagePath!),
                          width: double.infinity,
                          fit: BoxFit.fitWidth,
                        ),
                      ),
                    ),
                  );
                },
              ),
            ),
          ],
        ),
      ),
    );
  }
}
