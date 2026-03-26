import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:provider/provider.dart';

import '../models/session.dart';
import '../state/session_state.dart';

class SessionSettings extends StatelessWidget {
  const SessionSettings({super.key});

  @override
  Widget build(BuildContext context) {
    final state = context.watch<SessionState>();
    final session = state.activeSession;
    if (session == null) return const SizedBox.shrink();

    return ExpansionTile(
      title: const Text(
        'Settings',
        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w600),
      ),
      initiallyExpanded: true,
      childrenPadding: const EdgeInsets.symmetric(horizontal: 16, vertical: 8),
      children: [
        _buildBrowserSection(context, state, session),
        const SizedBox(height: 16),
        _buildViewportSection(context, state, session),
        const SizedBox(height: 16),
        _buildDelaySection(context, state, session),
        const SizedBox(height: 8),
      ],
    );
  }

  Widget _buildBrowserSection(
      BuildContext context, SessionState state, Session session) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        const Text('Browsers', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        const SizedBox(height: 8),
        Wrap(
          spacing: 8,
          children: BrowserType.values.map((browser) {
            final selected = session.browsers.contains(browser);
            return FilterChip(
              label: Text(browser.displayName),
              selected: selected,
              onSelected: (_) => state.toggleBrowser(browser),
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
            const Text('Viewports', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
            const Spacer(),
            IconButton(
              icon: const Icon(Icons.add, size: 18),
              tooltip: 'Add viewport',
              onPressed: () => _showAddViewportDialog(context, state, session),
            ),
          ],
        ),
        Wrap(
          spacing: 8,
          runSpacing: 4,
          children: session.viewports.map((vp) {
            return Chip(
              label: Text(vp.label, style: const TextStyle(fontSize: 12)),
              deleteIcon: session.viewports.length > 1
                  ? const Icon(Icons.close, size: 16)
                  : null,
              onDeleted: session.viewports.length > 1
                  ? () => state.removeViewport(vp)
                  : null,
            );
          }).toList(),
        ),
      ],
    );
  }

  Widget _buildDelaySection(
      BuildContext context, SessionState state, Session session) {
    return Row(
      children: [
        const Text('Capture delay', style: TextStyle(fontSize: 13, fontWeight: FontWeight.w500)),
        const SizedBox(width: 12),
        SizedBox(
          width: 80,
          child: TextField(
            controller:
                TextEditingController(text: session.captureDelayMs.toString()),
            decoration: const InputDecoration(
              isDense: true,
              suffixText: 'ms',
              contentPadding: EdgeInsets.symmetric(horizontal: 8, vertical: 8),
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
    // Show preset viewports that aren't already added
    final available = ViewportSize.presets
        .where((vp) => !session.viewports.contains(vp))
        .toList();

    final widthController = TextEditingController();
    final heightController = TextEditingController();

    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
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
                  return ActionChip(
                    label: Text(vp.label),
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
                  child: TextField(
                    controller: widthController,
                    decoration: const InputDecoration(
                      labelText: 'Width',
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  ),
                ),
                const Padding(
                  padding: EdgeInsets.symmetric(horizontal: 8),
                  child: Text('×'),
                ),
                Expanded(
                  child: TextField(
                    controller: heightController,
                    decoration: const InputDecoration(
                      labelText: 'Height',
                      isDense: true,
                    ),
                    keyboardType: TextInputType.number,
                    inputFormatters: [FilteringTextInputFormatter.digitsOnly],
                  ),
                ),
              ],
            ),
          ],
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final w = int.tryParse(widthController.text);
              final h = int.tryParse(heightController.text);
              if (w != null && h != null && w > 0 && h > 0) {
                state.addViewport(ViewportSize(w, h));
                Navigator.of(ctx).pop();
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }
}
