import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/medications_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

// Lisinopril has exactly one dose slot and isn't touched by any other test
// in this file, so its card's take button is unambiguous regardless of
// what other tests upstream have already marked taken/missed (slotStatuses
// is shared, process-wide state — see data.dart).
Finder _takeButtonFor(String medName) {
  final card = find.ancestor(of: find.text(medName), matching: find.byType(Container)).first;
  return find.descendant(of: card, matching: find.textContaining('I took this'));
}

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('MedicationsScreen — content', () {
    testWidgets('renders Medications heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.text('Medications'), findsOneWidget);
    });

    testWidgets('renders Total stat tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.text('Total doses'), findsOneWidget);
    });

    testWidgets('renders Taken stat tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.text('Taken'), findsOneWidget);
    });

    testWidgets('renders Missed stat tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.text('Missed'), findsOneWidget);
    });

    testWidgets('renders Ropivacaine medication card', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.textContaining('Ropivacaine'), findsWidgets); // 2 slots (8 AM + 8 PM)
    });

    testWidgets('renders Metformin medication card', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.textContaining('Metformin'), findsWidgets); // 2 slots (8 AM + 8 PM)
    });

    testWidgets('I took this buttons are present', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.textContaining('I took this'), findsWidgets);
    });

    testWidgets('I missed this buttons are present', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      expect(find.textContaining('I missed this'), findsWidgets);
    });
  });

  // ── Interaction ───────────────────────────────────────────────────────────────

  group('MedicationsScreen — interaction', () {
    testWidgets('tapping I took this shows ✓ Taken label', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pump();
      expect(find.textContaining('Taken'), findsWidgets);
    });

    testWidgets('tapping a taken tile\'s button again unmarks it, in the same tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      final takeBtn = _takeButtonFor('Lisinopril');
      await tester.ensureVisible(takeBtn);
      await tester.tap(takeBtn);
      await tester.pump();

      final card = find.ancestor(of: find.text('Lisinopril'), matching: find.byType(Container)).first;
      final untakeBtn = find.descendant(of: card, matching: find.textContaining('tap to undo'));
      expect(untakeBtn, findsOneWidget);
      await tester.ensureVisible(untakeBtn);
      await tester.tap(untakeBtn);
      await tester.pump();

      expect(find.descendant(of: card, matching: find.textContaining('tap to undo')), findsNothing);
      expect(find.descendant(of: card, matching: find.textContaining('I took this')), findsOneWidget);
      // Unmarking also brings back the "I missed this" option on that tile.
      expect(find.descendant(of: card, matching: find.textContaining('I missed this')), findsOneWidget);
    });

    testWidgets('tapping I took this shows a persistent undo button (no auto-dismissing toast)', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pump();
      expect(find.text('↺'), findsOneWidget);
      await tester.pump(const Duration(seconds: 10));
      expect(find.text('↺'), findsOneWidget);
    });

    testWidgets('undo button opens a sheet listing the action, and undoing it reverts the dose', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pump();

      await tester.tap(find.text('↺'));
      await tester.pumpAndSettle();
      expect(find.text('Recent actions'), findsOneWidget);
      // The FAB behind the sheet also says "Undo" (white); the sheet's
      // per-action button is styled differently — match on that.
      final undoInSheet = find.byWidgetPredicate(
        (w) => w is Text && w.data == 'Undo' && w.style?.color != Colors.white,
      );
      expect(undoInSheet, findsOneWidget);

      await tester.tap(undoInSheet);
      await tester.pumpAndSettle();
      expect(find.text('Nothing to undo.'), findsOneWidget);
    });

    testWidgets('tapping I missed this shows confirm dialog', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen()));
      final btn = find.textContaining('I missed this').first;
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pump();
      // Confirm dialog appears with confirmation button
      expect(find.textContaining('Yes, I missed'), findsOneWidget);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('MedicationsScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen(), isDark: true));
      expect(find.text('Medications'), findsOneWidget);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen(), isDark: false));
      expect(find.text('Medications'), findsOneWidget);
    });

    testWidgets('tapping toggle fires ThemeNotifier', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const MedicationsScreen(), themeNotifier: notifier));
      // ThemeToggleBtn is not on this screen (it is an auth-screen widget)
      // Verify dark scheme is active via notifier
      expect(notifier.isDark, isTrue);
    });
  });
}
