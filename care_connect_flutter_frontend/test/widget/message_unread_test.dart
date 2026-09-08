import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

// The unread badge is a small red-filled Container drawn over the thread's
// avatar in _ThreadRow (see messages_screen.dart) — matched by its color
// since it isn't otherwise keyed or labeled.
Finder _unreadBadge() => find.byWidgetPredicate((w) {
  if (w is! Container) return false;
  final decoration = w.decoration;
  return decoration is BoxDecoration && decoration.color == const Color(0xFFEF4444);
});

void main() {
  testWidgets(
    'opening a thread clears its unread badge on the messages list',
    (tester) async {
      tester.view.physicalSize = const Size(800, 900);
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);

      await tester.pumpWidget(
        ChangeNotifierProvider(
          create: (_) => ThemeNotifier(),
          child: const CareConnectApp(),
        ),
      );
      await tester.pumpAndSettle();

      // Landing -> sign in -> today -> messages.
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Messages'));
      await tester.pumpAndSettle();

      // Aunt Joyce's thread starts unread.
      expect(_unreadBadge(), findsOneWidget);

      // Open it, then come back.
      await tester.tap(find.textContaining('Aunt Joyce').first);
      await tester.pumpAndSettle();
      await tester.tap(find.text('←'));
      await tester.pumpAndSettle();

      // The badge should be gone now that the thread has been read.
      expect(_unreadBadge(), findsNothing);
    },
  );
}
