import 'dart:io';

import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../models/capture_result.dart';
import '../state/capture_state.dart';

class GalleryView extends StatelessWidget {
  const GalleryView({super.key});

  @override
  Widget build(BuildContext context) {
    final captureState = context.watch<CaptureState>();
    final results = captureState.results;

    if (results.isEmpty) {
      return const Padding(
        padding: EdgeInsets.symmetric(vertical: 32),
        child: Center(
          child: Text(
            'No screenshots yet. Run a capture to see results here.',
            style: TextStyle(color: Colors.grey),
          ),
        ),
      );
    }

    // Group results by URL, then by viewport size
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
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Container(
          width: double.infinity,
          padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
          decoration: BoxDecoration(
            color: Theme.of(context).colorScheme.surfaceContainerHighest,
            borderRadius: BorderRadius.circular(6),
          ),
          child: SelectableText(
            url,
            style: const TextStyle(
              fontSize: 13,
              fontWeight: FontWeight.w500,
              fontFamily: 'monospace',
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
              color: Colors.grey.shade400,
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

  @override
  Widget build(BuildContext context) {
    return Card(
      clipBehavior: Clip.antiAlias,
      elevation: 1,
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Browser + viewport label
          Container(
            width: double.infinity,
            padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
            color: _browserColor(result.browser).withAlpha(30),
            child: Row(
              children: [
                Container(
                  width: 8,
                  height: 8,
                  decoration: BoxDecoration(
                    color: _browserColor(result.browser),
                    shape: BoxShape.circle,
                  ),
                ),
                const SizedBox(width: 8),
                Text(
                  result.browser.displayName,
                  style: const TextStyle(
                    fontWeight: FontWeight.w600,
                    fontSize: 13,
                  ),
                ),
                const Spacer(),
                Text(
                  result.viewport.label,
                  style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
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
                        child: Icon(
                          Icons.broken_image,
                          size: 48,
                          color: Colors.grey,
                        ),
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
                    const Icon(
                      Icons.error_outline,
                      size: 36,
                      color: Colors.red,
                    ),
                    const SizedBox(height: 8),
                    Text(
                      result.error ?? 'Unknown error',
                      textAlign: TextAlign.center,
                      style: const TextStyle(
                        color: Colors.red,
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

  Color _browserColor(dynamic browser) {
    final name = browser.toString().toLowerCase();

    if (name.contains('chromium')) {
      return Colors.blue;
    } else if (name.contains('firefox')) {
      return Colors.orange;
    } else if (name.contains('webkit')) {
      return Colors.purple;
    } else {
      return Colors.grey;
    }
  }

  void _showFullScreen(BuildContext context, CaptureResult result) {
    final aspectRatio = result.viewport.width / result.viewport.height;

    showDialog(
      context: context,
      builder: (ctx) => Dialog(
        insetPadding: const EdgeInsets.all(24),
        clipBehavior: Clip.antiAlias,
        child: Column(
          children: [
            // Header
            Container(
              width: double.infinity,
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              color: _browserColor(result.browser).withAlpha(30),
              child: Row(
                children: [
                  Container(
                    width: 8,
                    height: 8,
                    decoration: BoxDecoration(
                      color: _browserColor(result.browser),
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Text(
                    result.browser.displayName,
                    style: const TextStyle(
                      fontWeight: FontWeight.w600,
                      fontSize: 13,
                    ),
                  ),
                  const Spacer(),
                  Text(
                    result.viewport.label,
                    style: TextStyle(fontSize: 12, color: Colors.grey.shade600),
                  ),
                  const SizedBox(width: 8),
                  IconButton(
                    icon: const Icon(Icons.close, size: 18),
                    onPressed: () => Navigator.of(ctx).pop(),
                    padding: EdgeInsets.zero,
                    constraints: const BoxConstraints(),
                  ),
                ],
              ),
            ),
            // Scrollable image at viewport width
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
