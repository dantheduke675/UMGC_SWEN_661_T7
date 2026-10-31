import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/screens/calling_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

void main() {
  // Single test: main.dart's router is a top-level singleton shared across
  // the test isolate (see message_thread_shell_test.dart).
  testWidgets(
    'the call button in a thread calls that contact, and ending the call returns to Messages',
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
      await tester.tap(find.textContaining('Aunt Joyce').first);
      await tester.pumpAndSettle();

      await tester.tap(find.byWidgetPredicate((w) => w is CTappable && w.label == 'Call Aunt Joyce'));
      await tester.pump();
      await tester.pump(const Duration(milliseconds: 500));

      // The calling route was given the right contact from its URL
      final calling = tester.widget<CallingScreen>(find.byType(CallingScreen));
      expect(calling.contactId, contacts.firstWhere((c) => c.name == 'Aunt Joyce').id);

      await tester.tap(find.byWidgetPredicate((w) => w is CTappable && w.label == 'End call'));
      // The call screen pulses until it's gone, so settle only after leaving it
      await tester.pumpAndSettle();
      expect(find.byType(CallingScreen), findsNothing);
      expect(find.text('Messages'), findsWidgets);
      // Ended before "connected": its 2 s delay still runs out (harmlessly, the
      // screen is gone), so let it, or the test ends with a timer pending
      await tester.pump(const Duration(seconds: 2));
    },
  );
}
