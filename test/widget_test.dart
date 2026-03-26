import 'package:flutter_test/flutter_test.dart';

import 'package:silverscreen/main.dart';

void main() {
  testWidgets('App renders without errors', (WidgetTester tester) async {
    await tester.pumpWidget(const SilverscreenApp());
    expect(find.text('Create or select a session to get started'), findsOneWidget);
  });
}
