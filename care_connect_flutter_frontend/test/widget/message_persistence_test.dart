import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

void main() {
  testWidgets(
    'a sent message survives leaving the thread and coming back',
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

      // Landing -> sign in -> today -> messages -> Aunt Joyce's thread.
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Messages'));
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Aunt Joyce').first);
      await tester.pumpAndSettle();

      // Send a new message. (The accessibility bar's "Scroll up" button also
      // renders '↑' — its white, bold copy in the input row is the send
      // button; match on that styling instead of relying on tree order.)
      final sendButton = find.byWidgetPredicate(
        (w) => w is Text && w.data == '↑' && w.style?.color == Colors.white,
      );
      await tester.enterText(find.byType(TextField), 'See you at 3pm!');
      await tester.tap(sendButton);
      await tester.pumpAndSettle();
      expect(find.text('See you at 3pm!'), findsOneWidget);

      // Leave the thread (back to the messages list — which now also shows
      // the new message as the thread's latest-message preview)...
      await tester.tap(find.text('←'));
      await tester.pumpAndSettle();
      expect(find.textContaining('See you at 3pm!'), findsOneWidget);

      // ...and come back to the thread itself.
      await tester.tap(find.textContaining('Aunt Joyce').first);
      await tester.pumpAndSettle();

      expect(find.text('See you at 3pm!'), findsOneWidget,
          reason: 'the sent message should still be there after re-entering the thread');
    },
  );
}
