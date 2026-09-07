// CallingScreen has two AnimationController.repeat() calls (pulse rings +
// _CallingDots), so every test MUST use pumpScreenWithAnimation and must NOT
// call pumpAndSettle — that would hang on the infinite animations.
//
// CallingScreen also starts an untracked Future.delayed(2s) in initState to
// simulate the call connecting; since it isn't cancelled on dispose, every
// test must advance the fake clock past that delay before finishing so the
// timer fires (and stops being "pending") instead of leaking into the next
// test's invariant check.
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/calling_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';
import 'package:flutter/material.dart';

Future<void> _flushConnectTimer(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 3));
}

void main() {
  Widget callingApp({int contactId = 1, bool isDark = true, ThemeNotifier? themeNotifier}) =>
      buildTestApp(
        child: CallingScreen(contactId: contactId),
        isDark: isDark,
        themeNotifier: themeNotifier,
      );

  // ── Content ──────────────────────────────────────────────────────────────────

  group('CallingScreen — content', () {
    testWidgets('renders contact name Aunt Joyce', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('Aunt Joyce'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders contact role Caregiver', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('Caregiver'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders contact initials AJ in avatar', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('AJ'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('shows Connecting status before call connects', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      // Future.delayed(2s) hasn't fired — still in connecting state
      expect(find.textContaining('Connecting'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders Mute control button', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('Mute'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders Earpiece control button', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('Earpiece'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders End call button', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('End'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders back arrow in top bar', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('←'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders for Dr. Sarah Chen (contactId 2)', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp(contactId: 2));
      expect(find.text('Dr. Sarah Chen'), findsOneWidget);
      expect(find.text('Physician'), findsOneWidget);
      expect(find.text('SC'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders for James Rivera (contactId 3)', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp(contactId: 3));
      expect(find.text('James Rivera'), findsOneWidget);
      expect(find.text('Home Aide'), findsOneWidget);
      expect(find.text('JR'), findsOneWidget);
      await _flushConnectTimer(tester);
    });
  });

  // ── Interaction ───────────────────────────────────────────────────────────────

  group('CallingScreen — interaction', () {
    testWidgets('tapping Mute toggles to Unmute', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('Mute'), findsOneWidget);
      await tester.tap(find.text('Mute'));
      await tester.pump();
      expect(find.text('Unmute'), findsOneWidget);
      expect(find.text('Mute'), findsNothing);
      await _flushConnectTimer(tester);
    });

    testWidgets('tapping Unmute toggles back to Mute', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      await tester.tap(find.text('Mute'));
      await tester.pump();
      await tester.tap(find.text('Unmute'));
      await tester.pump();
      expect(find.text('Mute'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('tapping Earpiece toggles to Speaker', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      expect(find.text('Earpiece'), findsOneWidget);
      await tester.tap(find.text('Earpiece'));
      await tester.pump();
      expect(find.text('Speaker'), findsOneWidget);
      expect(find.text('Earpiece'), findsNothing);
      await _flushConnectTimer(tester);
    });

    testWidgets('tapping Speaker toggles back to Earpiece', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      await tester.tap(find.text('Earpiece'));
      await tester.pump();
      await tester.tap(find.text('Speaker'));
      await tester.pump();
      expect(find.text('Earpiece'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('mute and speaker states are independent', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp());
      await tester.tap(find.text('Mute'));
      await tester.pump();
      await tester.tap(find.text('Earpiece'));
      await tester.pump();
      // Both toggled
      expect(find.text('Unmute'), findsOneWidget);
      expect(find.text('Speaker'), findsOneWidget);
      await _flushConnectTimer(tester);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('CallingScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp(isDark: true));
      expect(find.text('Aunt Joyce'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreenWithAnimation(tester, callingApp(isDark: false));
      expect(find.text('Aunt Joyce'), findsOneWidget);
      await _flushConnectTimer(tester);
    });

    testWidgets('notifier tracks dark mode', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreenWithAnimation(tester, callingApp(themeNotifier: notifier));
      expect(notifier.isDark, isTrue);
      await _flushConnectTimer(tester);
    });
  });
}
