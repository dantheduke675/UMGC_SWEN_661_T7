import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/today_screen.dart';
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

  group('TodayScreen — content', () {
    testWidgets('renders patient greeting', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      expect(find.textContaining('Good morning, Maddy'), findsOneWidget);
    });

    testWidgets('renders a progress percentage', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      // Percentage text ends with '%'
      expect(find.textContaining('%'), findsOneWidget);
    });

    testWidgets('renders medication name Ropivacaine', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      expect(find.textContaining('Ropivacaine'), findsWidgets); // 2 slots (8 AM + 8 PM) both visible
    });

    testWidgets('renders appointment card with Dr. Chen', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      expect(find.textContaining('Dr. Chen'), findsOneWidget);
    });

    testWidgets('I took this button is present', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      expect(find.textContaining('I took this'), findsWidgets);
    });
  });

  // ── Interaction ───────────────────────────────────────────────────────────────

  group('TodayScreen — interaction', () {
    testWidgets('tapping I took this shows ✓ Taken', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.pump(); // commit scroll position before hit-testing
      await tester.tap(btn);
      await tester.pump();
      expect(find.textContaining('Taken'), findsWidgets);
    });

    testWidgets('tapping a taken tile\'s button again unmarks it, in the same tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final takeBtn = _takeButtonFor('Lisinopril');
      await tester.ensureVisible(takeBtn);
      await tester.pump();
      await tester.tap(takeBtn);
      await tester.pump();

      final card = find.ancestor(of: find.text('Lisinopril'), matching: find.byType(Container)).first;
      final untakeBtn = find.descendant(of: card, matching: find.textContaining('tap to undo'));
      expect(untakeBtn, findsOneWidget);
      await tester.ensureVisible(untakeBtn);
      await tester.pump();
      await tester.tap(untakeBtn);
      await tester.pump();

      expect(find.descendant(of: card, matching: find.textContaining('tap to undo')), findsNothing);
      expect(find.descendant(of: card, matching: find.textContaining('I took this')), findsOneWidget);
    });

    testWidgets('undo button appears (no auto-dismissing toast) after marking taken', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.pump(); // commit scroll position before hit-testing
      await tester.tap(btn);
      await tester.pump();
      // The persistent undo button (↺) appears instead of a snackbar...
      expect(find.text('↺'), findsOneWidget);
      // ...and stays after waiting, unlike the old 5s-auto-dismiss toast.
      await tester.pump(const Duration(seconds: 10));
      expect(find.text('↺'), findsOneWidget);
    });

    testWidgets('undo button opens a sheet listing the action, and undoing it reverts the dose', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.pump();
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

    testWidgets('sheet has a close button that dismisses it', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.pump();
      await tester.tap(btn);
      await tester.pump();

      await tester.tap(find.text('↺'));
      await tester.pumpAndSettle();
      expect(find.text('Recent actions'), findsOneWidget);

      await tester.tap(find.text('✕'));
      await tester.pumpAndSettle();
      expect(find.text('Recent actions'), findsNothing);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('TodayScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen(), isDark: true));
      expect(find.textContaining('Good morning'), findsOneWidget);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen(), isDark: false));
      expect(find.textContaining('Good morning'), findsOneWidget);
    });
  });
}
