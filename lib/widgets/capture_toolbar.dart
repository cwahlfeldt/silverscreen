import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/capture_state.dart';
import '../state/session_state.dart';

class CaptureToolbar extends StatelessWidget {
  const CaptureToolbar({super.key});

  @override
  Widget build(BuildContext context) {
    final sessionState = context.watch<SessionState>();
    final captureState = context.watch<CaptureState>();
    final session = sessionState.activeSession;

    if (session == null) return const SizedBox.shrink();

    final canRun =
        !captureState.isRunning && session.urls.isNotEmpty && session.browsers.isNotEmpty;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Row(
          children: [
            if (captureState.isRunning) ...[
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Row(
                      children: [
                        Text(
                          'Capturing ${captureState.completedCaptures}/${captureState.totalCaptures}',
                          style: const TextStyle(fontSize: 13),
                        ),
                        const Spacer(),
                        TextButton(
                          onPressed: captureState.cancel,
                          child: const Text('Cancel'),
                        ),
                      ],
                    ),
                    const SizedBox(height: 4),
                    LinearProgressIndicator(
                      value: captureState.totalCaptures > 0
                          ? captureState.completedCaptures /
                              captureState.totalCaptures
                          : null,
                    ),
                  ],
                ),
              ),
            ] else ...[
              ElevatedButton.icon(
                icon: const Icon(Icons.play_arrow),
                label: const Text('Run Capture'),
                onPressed: canRun
                    ? () => captureState.runCapture(session)
                    : null,
              ),
              if (!canRun && session.urls.isEmpty)
                const Padding(
                  padding: EdgeInsets.only(left: 12),
                  child: Text(
                    'Add URLs to capture',
                    style: TextStyle(color: Colors.grey, fontSize: 12),
                  ),
                ),
            ],
          ],
        ),
        if (captureState.errorMessage != null)
          Padding(
            padding: const EdgeInsets.only(top: 8),
            child: Text(
              captureState.errorMessage!,
              style: const TextStyle(color: Colors.red, fontSize: 12),
            ),
          ),
      ],
    );
  }
}
