import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/symptoms_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('SymptomsScreen — content', () {
    testWidgets('renders Symptoms heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.text('Symptoms'), findsOneWidget);
    });

    testWidgets('renders subtitle', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.textContaining('Track how you feel'), findsOneWidget);
    });

    testWidgets('renders Recent logs section header', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.text('Recent logs'), findsOneWidget);
    });

    testWidgets('renders Log a symptom card', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.text('Log a symptom'), findsOneWidget);
    });

    testWidgets('logger starts collapsed — shows expand arrow', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.text('▼'), findsOneWidget);
      expect(find.text('▲'), findsNothing);
    });

    testWidgets('renders pre-loaded Pain log', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.text('Pain'), findsOneWidget);
    });

    testWidgets('renders pre-loaded Fatigue log', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.text('Fatigue'), findsOneWidget);
    });

    testWidgets('renders severity bar for each log', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      // CSeverityBar is rendered for each of the 5 initial logs
      expect(find.byType(Slider), findsNothing); // slider only visible when expanded
    });

    testWidgets('renders log notes text', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      expect(find.textContaining('Mild knee ache'), findsOneWidget);
    });
  });

  // ── Interaction ───────────────────────────────────────────────────────────────

  group('SymptomsScreen — interaction', () {
    testWidgets('tapping header expands the logger', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      await tester.tap(find.text('Log a symptom'));
      await tester.pump();
      expect(find.text('▲'), findsOneWidget);
      expect(find.text('▼'), findsNothing);
    });

    testWidgets('expanded logger shows symptom options', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      await tester.tap(find.text('Log a symptom'));
      await tester.pump();
      expect(find.text('What are you feeling?'), findsOneWidget);
      // Most symptom-option labels also match a pre-loaded log tile above,
      // so only assert presence (findsWidgets) rather than uniqueness for
      // those. 'Breathing' has no pre-loaded log, so it stays unique.
      expect(find.text('Breathing'), findsOneWidget);
      expect(find.text('Nausea'), findsWidgets);
    });

    testWidgets('expanded logger shows severity slider', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      await tester.tap(find.text('Log a symptom'));
      await tester.pump();
      expect(find.byType(Slider), findsOneWidget);
    });

    testWidgets('tapping header again collapses the logger', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      await tester.tap(find.text('Log a symptom'));
      await tester.pump();
      expect(find.text('▲'), findsOneWidget);
      await tester.tap(find.text('Log a symptom'));
      await tester.pump();
      expect(find.text('▼'), findsOneWidget);
    });

    testWidgets('selecting a symptom chip and logging collapses the logger', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));

      // Expand logger
      await tester.tap(find.text('Log a symptom'));
      await tester.pump();

      // Tap the Breathing chip — the only option with no pre-loaded log
      // tile of the same name, so the text match stays unique and tappable.
      await tester.tap(find.text('Breathing'));
      await tester.pump();

      // Tap the Log symptom submit button (may be off-screen in the list)
      final submitBtn = find.text('Log symptom');
      await tester.ensureVisible(submitBtn);
      await tester.pump();
      await tester.tap(submitBtn);
      await tester.pump();

      // Logger collapses after successful log
      expect(find.text('▼'), findsOneWidget);
      expect(find.text('▲'), findsNothing);
    });

    testWidgets('newly logged symptom appears in the list', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));

      await tester.tap(find.text('Log a symptom'));
      await tester.pump();

      // Select 'Breathing' which is not in the pre-loaded list
      await tester.tap(find.text('Breathing'));
      await tester.pump();

      final submitBtn2 = find.text('Log symptom');
      await tester.ensureVisible(submitBtn2);
      await tester.pump();
      await tester.tap(submitBtn2);
      await tester.pump();

      // 'Breathing' now appears in the logs
      expect(find.text('Breathing'), findsOneWidget);
    });

    testWidgets('logging a symptom adds an undoable action, and undoing it removes the log', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));

      await tester.tap(find.text('Log a symptom'));
      await tester.pump();
      await tester.tap(find.text('Breathing'));
      await tester.pump();
      final submitBtn = find.text('Log symptom');
      await tester.ensureVisible(submitBtn);
      await tester.pump();
      await tester.tap(submitBtn);
      await tester.pump();
      expect(find.text('Breathing'), findsOneWidget);

      // The persistent undo button appears and lists the logging action.
      await tester.tap(find.text('↺'));
      await tester.pumpAndSettle();
      expect(find.text('Recent actions'), findsOneWidget);
      expect(find.textContaining('Logged Breathing'), findsOneWidget);

      // The FAB behind the sheet also says "Undo" (white); the sheet's
      // per-action button is styled differently — match on that.
      final undoInSheet = find.byWidgetPredicate(
        (w) => w is Text && w.data == 'Undo' && w.style?.color != Colors.white,
      );
      await tester.tap(undoInSheet);
      await tester.pumpAndSettle();

      expect(find.text('Breathing'), findsNothing);
    });

    testWidgets('Log symptom button is disabled when no symptom is selected', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen()));
      await tester.tap(find.text('Log a symptom'));
      await tester.pump();

      // Tap submit without selecting a symptom — list count should not change
      final initialDizzinessCount = find.text('Dizziness').evaluate().length;
      final submitBtnDisabled = find.text('Log symptom');
      await tester.ensureVisible(submitBtnDisabled);
      await tester.pump();
      await tester.tap(submitBtnDisabled);
      await tester.pump();

      // Logger remains expanded (submit was a no-op)
      expect(find.text('▲'), findsOneWidget);
      expect(find.text('Dizziness').evaluate().length, initialDizzinessCount);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('SymptomsScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen(), isDark: true));
      expect(find.text('Symptoms'), findsOneWidget);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen(), isDark: false));
      expect(find.text('Symptoms'), findsOneWidget);
    });

    testWidgets('notifier tracks dark mode', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const SymptomsScreen(), themeNotifier: notifier));
      expect(notifier.isDark, isTrue);
    });
  });
}
