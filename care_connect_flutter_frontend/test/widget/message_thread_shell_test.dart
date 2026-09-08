import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

void main() {
  // Single test: main.dart's `_router` is a top-level singleton shared across
  // the whole test isolate, so a second testWidgets in this file would start
  // from wherever the first one navigated to, not from `/landing`.
  testWidgets(
    'message thread screen keeps the shell chrome, and its scroll buttons scroll the message list',
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

      // Landing -> sign in -> today -> messages -> a thread.
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Messages'));
      await tester.pumpAndSettle();
      await tester.tap(find.textContaining('Aunt Joyce').first);
      await tester.pumpAndSettle();

      // Thread content is showing...
      expect(find.textContaining('Thank you'), findsOneWidget);

      // ...and so is the shell chrome (bottom nav + accessibility bar).
      expect(find.text('Today'), findsOneWidget);
      expect(find.text('Medications'), findsOneWidget);
      expect(find.text('Account'), findsOneWidget);
      expect(find.text('Scroll up'), findsOneWidget);
      expect(find.text('Scroll down'), findsOneWidget);
      expect(find.text('Voice'), findsOneWidget);

      // Shrink the viewport so the (short) message thread overflows and needs scrolling.
      tester.view.physicalSize = const Size(800, 380);
      await tester.pumpAndSettle();

      final scrollController = Provider.of<ScrollController>(
        tester.element(find.text('Scroll down')),
        listen: false,
      );
      expect(scrollController.hasClients, isTrue,
          reason: 'the thread message list should be attached to the shared controller');
      final before = scrollController.offset;

      await tester.tap(find.text('Scroll down'));
      await tester.pumpAndSettle();

      final after = scrollController.offset;
      expect(after, greaterThan(before),
          reason: 'tapping the scroll-down button should scroll the message list down');

      await tester.tap(find.text('Scroll up'));
      await tester.pumpAndSettle();

      final afterUp = scrollController.offset;
      expect(afterUp, lessThan(after),
          reason: 'tapping the scroll-up button should scroll the message list back up');
    },
  );
}
