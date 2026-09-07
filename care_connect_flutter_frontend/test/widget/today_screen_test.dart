import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/today_screen.dart';
import '../helpers/test_helpers.dart';

// Marking a dose taken schedules an untracked Future.delayed(5s) toast
// dismissal; advance the fake clock past it before the test ends so the
// timer fires instead of leaking into the next test's invariant check.
Future<void> _flushToastTimer(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 6));
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
      await _flushToastTimer(tester);
    });

    testWidgets('undo toast appears after marking taken', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.pump(); // commit scroll position before hit-testing
      await tester.tap(btn);
      await tester.pump();
      expect(find.textContaining('Marked as taken'), findsOneWidget);
      await _flushToastTimer(tester);
    });

    testWidgets('undo button is present in toast', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const TodayScreen()));
      final btn = find.textContaining('I took this').first;
      await tester.ensureVisible(btn);
      await tester.pump(); // commit scroll position before hit-testing
      await tester.tap(btn);
      await tester.pump();
      expect(find.text('Undo'), findsOneWidget);
      await _flushToastTimer(tester);
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
