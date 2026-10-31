import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

void main() {
  // Single test: main.dart's router is a top-level singleton shared across
  // the test isolate (see message_thread_shell_test.dart).
  testWidgets(
    'a thread taller than the screen opens at its newest message',
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

      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.widgetWithText(AuthBtn, 'Sign in'));
      await tester.pumpAndSettle();
      await tester.tap(find.text('Messages'));
      await tester.pumpAndSettle();

      // Short, as in a landscape window or with large text: the thread overflows
      tester.view.physicalSize = const Size(800, 380);
      await tester.pumpAndSettle();
      // Opened from the Messages list, so that list's exit transition is
      // still attached to the shared scroll controller for a few frames
      await tester.tap(find.textContaining('Aunt Joyce').first);
      await tester.pumpAndSettle();

      final scrollController = Provider.of<ScrollController>(
        tester.element(find.text('Scroll down')),
        listen: false,
      );
      expect(scrollController.positions, hasLength(1));
      final position = scrollController.position;
      expect(position.maxScrollExtent, greaterThan(0),
          reason: 'the thread fits, so this test would not show anything');
      expect(position.pixels, position.maxScrollExtent,
          reason: 'the thread opened at its oldest message');
      expect(tester.takeException(), isNull);
    },
  );
}
