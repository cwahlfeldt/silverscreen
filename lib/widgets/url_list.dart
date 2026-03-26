import 'package:flutter/material.dart';
import 'package:provider/provider.dart';

import '../state/session_state.dart';

class UrlList extends StatelessWidget {
  const UrlList({super.key});

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
            TextButton.icon(
              icon: const Icon(Icons.add, size: 18),
              label: const Text('Add URL'),
              onPressed: () => _showAddUrlDialog(context, state),
            ),
          ],
        ),
        const SizedBox(height: 4),
        if (urls.isEmpty)
          const Padding(
            padding: EdgeInsets.symmetric(vertical: 12),
            child: Text(
              'No URLs added yet. Click "Add URL" to get started.',
              style: TextStyle(color: Colors.grey),
            ),
          )
        else
          ReorderableListView.builder(
            shrinkWrap: true,
            physics: const NeverScrollableScrollPhysics(),
            itemCount: urls.length,
            onReorder: state.reorderUrl,
            itemBuilder: (context, index) {
              return ListTile(
                key: ValueKey('$index-${urls[index]}'),
                dense: true,
                leading: Icon(
                  Icons.drag_handle,
                  size: 18,
                  color: Colors.grey.shade600,
                ),
                title: Text(
                  urls[index],
                  overflow: TextOverflow.ellipsis,
                  style: const TextStyle(fontSize: 13),
                ),
                trailing: IconButton(
                  icon: const Icon(Icons.close, size: 18),
                  tooltip: 'Remove URL',
                  onPressed: () => state.removeUrl(index),
                ),
              );
            },
          ),
      ],
    );
  }

  void _showAddUrlDialog(BuildContext context, SessionState state) {
    final controller = TextEditingController(text: 'https://');
    showDialog(
      context: context,
      builder: (ctx) => AlertDialog(
        title: const Text('Add URL'),
        content: TextField(
          controller: controller,
          autofocus: true,
          decoration: const InputDecoration(
            labelText: 'URL',
            hintText: 'https://example.com',
          ),
          onSubmitted: (_) {
            final url = controller.text.trim();
            if (_isValidUrl(url)) {
              state.addUrl(url);
              Navigator.of(ctx).pop();
            }
          },
        ),
        actions: [
          TextButton(
            onPressed: () => Navigator.of(ctx).pop(),
            child: const Text('Cancel'),
          ),
          TextButton(
            onPressed: () {
              final url = controller.text.trim();
              if (_isValidUrl(url)) {
                state.addUrl(url);
                Navigator.of(ctx).pop();
              }
            },
            child: const Text('Add'),
          ),
        ],
      ),
    );
  }

  bool _isValidUrl(String url) {
    return Uri.tryParse(url)?.hasScheme ?? false;
  }
}
