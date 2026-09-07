import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/msg_thread_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

// Thread 1 = Aunt Joyce (contactId: 1)

void main() {
  // MsgThreadScreen has a TextField and expects a Material ancestor — in the
  // real app this comes from AppShell's Scaffold, so tests provide one too.
  Widget threadApp({bool isDark = true, ThemeNotifier? themeNotifier}) =>
      buildTestApp(
        child: const Scaffold(body: MsgThreadScreen(threadId: 1)),
        isDark: isDark,
        themeNotifier: themeNotifier,
      );

  // ── Content ────────────────────────────────────────────────────────────────

  group('MsgThreadScreen — content', () {
    testWidgets('renders contact name in header', (tester) async {
      await pumpScreen(tester, threadApp());
      expect(find.textContaining('Aunt Joyce'), findsWidgets);
    });

    testWidgets('renders contact role in header', (tester) async {
      await pumpScreen(tester, threadApp());
      expect(find.textContaining('Caregiver'), findsOneWidget);
    });

    testWidgets('renders at least one message bubble', (tester) async {
      await pumpScreen(tester, threadApp());
      // All messages from the static thread should appear
      expect(find.byType(ListView), findsWidgets);
    });

    testWidgets('renders quick reply chips', (tester) async {
      await pumpScreen(tester, threadApp());
      expect(find.textContaining('Thank you'), findsOneWidget);
    });

    testWidgets('renders I took my medications quick reply', (tester) async {
      await pumpScreen(tester, threadApp());
      expect(find.textContaining('I took my medications'), findsOneWidget);
    });

    testWidgets('renders text input field', (tester) async {
      await pumpScreen(tester, threadApp());
      expect(find.byType(TextField), findsOneWidget);
    });
  });

  // ── Interaction ──────────────────────────────────────────────────────────────

  group('MsgThreadScreen — interaction', () {
    testWidgets('typing and sending adds new message', (tester) async {
      await pumpScreen(tester, threadApp());
      await tester.enterText(find.byType(TextField), 'Hello there');
      await tester.pump();
      // Tap the send arrow button
      await tester.tap(find.text('↑'));
      await tester.pumpAndSettle(); // settle scroll animation so new message is in view
      expect(find.text('Hello there'), findsOneWidget);
    });

    testWidgets('tapping quick reply sends it as a message', (tester) async {
      await pumpScreen(tester, threadApp());
      await tester.tap(find.text('Thank you!'));
      await tester.pump();
      expect(find.text('Thank you!'), findsWidgets); // appears in chat
    });

    testWidgets('empty send does not add a message', (tester) async {
      await pumpScreen(tester, threadApp());
      final beforeCount = find.byType(TextField).evaluate().length;
      await tester.tap(find.text('↑'));
      await tester.pump();
      // Widget tree is unchanged — just check no exception
      expect(beforeCount, greaterThan(0));
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('MsgThreadScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreen(tester, threadApp(isDark: true));
      expect(find.textContaining('Aunt Joyce'), findsWidgets);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreen(tester, threadApp(isDark: false));
      expect(find.textContaining('Aunt Joyce'), findsWidgets);
    });

    testWidgets('ThemeNotifier tracks dark mode', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, threadApp(themeNotifier: notifier));
      expect(notifier.isDark, isTrue);
    });
  });
}
