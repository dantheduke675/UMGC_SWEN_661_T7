// Integration test: logging a symptom, end to end on a device.
//
// The symptom logger is the app's one multi-step form — expand, choose,
// grade, submit — so it is where an inaccessible control does the most
// damage. The flow below exercises it the way the form is meant to work,
// including the part that is easy to get wrong: the submit button must stay
// genuinely disabled, not merely look disabled, until a symptom is chosen
// (WCAG 2.1 SC 3.3.2, SC 4.1.2).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:care_connect_flutter_frontend/widgets.dart';

import 'e2e_harness.dart';

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  tearDown(resetAppState);

  testWidgets('log a symptom, grade it, and see it in the list',
      (tester) async {
    await launchApp(tester, route: '/symptoms');

    expect(find.text('Symptoms'), findsWidgets);
    expect(find.text('Recent logs'), findsOneWidget);

    // ── The form starts collapsed ─────────────────────────────────────────
    expect(find.text('What are you feeling?'), findsNothing);

    await tapAndSettle(tester, byAccessibleName('Log a symptom'));
    expect(find.text('What are you feeling?'), findsOneWidget,
        reason: 'the logger did not expand');

    // ── Submit is inert until a symptom is chosen ─────────────────────────
    // `onTap: null` is what makes this true for a keyboard and a screen
    // reader as well as for a pointer; a button that merely looked grey
    // would still be announced and activated.
    final submit = byAccessibleName('Log symptom');
    expect(tester.widget<CTappable>(submit).onTap, isNull,
        reason: 'the submit button is live before anything is selected');

    await tester.tap(submit);
    await tester.pumpAndSettle();
    expect(find.text('What are you feeling?'), findsOneWidget,
        reason: 'the inert submit button still did something');

    // ── Choose, grade, submit ─────────────────────────────────────────────
    await tapAndSettle(tester, byAccessibleName('Nausea'));
    expect(tester.widget<CTappable>(byAccessibleName('Nausea')).selected, isTrue,
        reason: 'the chosen symptom does not report itself as selected');
    expect(tester.widget<CTappable>(submit).onTap, isNotNull);

    // Drag the severity slider to its maximum.
    await tester.drag(find.byType(Slider), const Offset(500, 0));
    await tester.pumpAndSettle();

    await tapAndSettle(tester, byAccessibleName('Log symptom'));

    // ── The entry lands, and the form resets ──────────────────────────────
    expect(find.text('What are you feeling?'), findsNothing,
        reason: 'the logger stayed open after submitting');
    expect(find.text('5/5'), findsOneWidget,
        reason: 'the graded severity did not reach the new entry');

    await scrollTo(tester, find.text('Nausea'));
    expect(find.text('Nausea'), findsWidgets);
  });

  testWidgets('a logged symptom can be undone from another tab',
      (tester) async {
    await launchApp(tester, route: '/symptoms');

    await tapAndSettle(tester, byAccessibleName('Log a symptom'));
    await tapAndSettle(tester, byAccessibleName('Headache'));
    await tapAndSettle(tester, byAccessibleName('Log symptom'));

    // Severity defaults to 3, so this is the description that should appear
    // in the shared history.
    const description = 'Logged Headache (severity 3/5)';

    await openTab(tester, 'Today');
    final undo = find.byWidgetPredicate(
        (w) => w is CTappable && w.label.startsWith('Undo, '));
    expect(undo, findsOneWidget,
        reason: 'the symptom log did not reach the app-wide undo history');

    await tester.tap(undo);
    await tester.pumpAndSettle();
    expect(find.text(description), findsOneWidget);

    await tester.tap(byAccessibleName('Undo $description'));
    await tester.pumpAndSettle();
    await tester.tap(byAccessibleName('Close recent actions'));
    await tester.pumpAndSettle();

    // Back on Symptoms, the entry should be gone — the screen was rebuilt
    // from the shared history, not from its own local copy.
    await openTab(tester, 'Symptoms');
    await scrollToTop(tester);
    expect(find.text('Recent logs'), findsOneWidget);
  });
}
