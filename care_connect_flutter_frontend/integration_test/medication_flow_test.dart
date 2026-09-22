// Integration test: the medication workflow, end to end on a device.
//
// This is the app's primary job — a care recipient recording that they have
// taken a dose — and it spans four things no single-screen widget test can
// put together at once: the sign-in route, the tab shell, two screens that
// share one dose record, and the app-wide undo history.
//
// The dose is always addressed by the button's accessible name, never by the
// words printed on it: every one of the nine cards says "I took this", so
// only the name distinguishes them. That is exactly the property a screen
// reader user depends on (WCAG 2.1 SC 4.1.2), and testing through it means a
// regression in labelling fails here instead of silently shipping.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

import 'e2e_harness.dart';

/// The undo button carries a live count in its name, so match on the stem.
Finder get _undoFab => find.byWidgetPredicate(
      (w) => w is CTappable && w.label.startsWith('Undo, '),
      description: 'the persistent undo button',
    );

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  tearDown(resetAppState);

  testWidgets('sign in, take a dose, and see it on both screens',
      (tester) async {
    await launchApp(tester);

    // ── Sign in ───────────────────────────────────────────────────────────
    expect(find.text('CareConnect'), findsOneWidget,
        reason: 'the app did not start on the landing screen');

    await tester.tap(find.widgetWithText(OutlinedButton, 'Sign in'));
    await tester.pumpAndSettle();

    // The email field is a real input, not a picture of one — it should carry
    // the account's address as its value.
    expect(find.text(patient.email), findsOneWidget);

    await tester.tap(find.widgetWithText(ElevatedButton, 'Sign in'));
    await tester.pumpAndSettle();

    // ── Today ─────────────────────────────────────────────────────────────
    expect(find.text('Good morning, ${patient.name} 👋'), findsOneWidget,
        reason: 'signing in did not land on the Today screen');
    expect(find.text('$takenDoses of $totalDoses taken'), findsOneWidget);

    // ── Take the first dose that is still outstanding ─────────────────────
    final slot = buildSlots().firstWhere(
        (s) => (slotStatuses[s.key] ?? SlotStatus.none) != SlotStatus.taken);
    final takeName = 'Mark ${slot.med.name} at ${slot.time} as taken';
    final undoName =
        'Undo: mark ${slot.med.name} at ${slot.time} as not taken';

    final before = takenDoses;
    await tapAndSettle(tester, byAccessibleName(takeName));

    expect(slotStatuses[slot.key], SlotStatus.taken);
    expect(takenDoses, before + 1);

    // The control must now offer the reverse action, under a name that says
    // so — a button whose meaning changed but whose name did not would leave
    // a screen reader user pressing "mark as taken" to un-take it.
    expect(byAccessibleName(undoName), findsOneWidget);
    expect(byAccessibleName(takeName), findsNothing);

    await scrollToTop(tester);
    expect(find.text('${before + 1} of $totalDoses taken'), findsOneWidget,
        reason: 'the progress card did not follow the dose');

    // ── The other screen shows the same dose ──────────────────────────────
    await openTab(tester, 'Meds');
    expect(find.text('$totalDoses doses today'), findsOneWidget);

    await scrollTo(tester, byAccessibleName(undoName));
    expect(byAccessibleName(undoName), findsOneWidget,
        reason: 'Medications does not reflect a dose taken on Today');
  });

  testWidgets('an action taken on one screen can be undone from another',
      (tester) async {
    // The undo history is app-wide; this is the part of it that a per-screen
    // test cannot reach.
    await launchApp(tester, route: '/today');

    final slot = buildSlots().firstWhere(
        (s) => (slotStatuses[s.key] ?? SlotStatus.none) != SlotStatus.taken);
    await tapAndSettle(
        tester, byAccessibleName('Mark ${slot.med.name} at ${slot.time} as taken'));
    expect(slotStatuses[slot.key], SlotStatus.taken);

    // Leave the screen the action was performed on.
    await openTab(tester, 'Meds');

    expect(_undoFab, findsOneWidget,
        reason: 'the undo history did not survive the tab change');
    await tester.tap(_undoFab);
    await tester.pumpAndSettle();

    expect(find.text('Recent actions'), findsOneWidget);
    final description = 'Marked ${slot.med.name} (${slot.time}) as taken';
    expect(find.text(description), findsOneWidget);

    await tester.tap(byAccessibleName('Undo $description'));
    await tester.pumpAndSettle();

    expect(slotStatuses[slot.key], isNot(SlotStatus.taken),
        reason: 'undoing from another screen did not revert the dose');
  });

  testWidgets('marking a dose missed asks first, and cancelling changes nothing',
      (tester) async {
    await launchApp(tester, route: '/medications');

    final slot = buildSlots().firstWhere(
        (s) => (slotStatuses[s.key] ?? SlotStatus.none) == SlotStatus.none);
    final missName = 'Mark ${slot.med.name} at ${slot.time} as missed';

    await tapAndSettle(tester, byAccessibleName(missName));

    // A real dialog route, not an overlay painted on top of the screen.
    expect(find.byType(Dialog), findsOneWidget);
    expect(find.text('Yes, I missed this dose'), findsOneWidget);

    await tester.tap(find.text('Cancel — go back'));
    await tester.pumpAndSettle();

    expect(find.byType(Dialog), findsNothing);
    expect(slotStatuses[slot.key] ?? SlotStatus.none, SlotStatus.none,
        reason: 'cancelling the dialog still recorded the dose as missed');

    // And the other half of the pair: confirming does record it. A dialog
    // that never worked would pass the assertion above.
    await tapAndSettle(tester, byAccessibleName(missName));
    await tester.tap(find.text('Yes, I missed this dose'));
    await tester.pumpAndSettle();

    expect(slotStatuses[slot.key], SlotStatus.missed);
  });

  testWidgets('a recorded dose survives leaving and returning to the tab',
      (tester) async {
    await launchApp(tester, route: '/today');

    final slot = buildSlots().firstWhere(
        (s) => (slotStatuses[s.key] ?? SlotStatus.none) != SlotStatus.taken);
    final undoName =
        'Undo: mark ${slot.med.name} at ${slot.time} as not taken';

    await tapAndSettle(
        tester, byAccessibleName('Mark ${slot.med.name} at ${slot.time} as taken'));

    // Round-trip through two other tabs, then come back.
    await openTab(tester, 'Schedule');
    await openTab(tester, 'Symptoms');
    await openTab(tester, 'Today');

    await scrollTo(tester, byAccessibleName(undoName));
    expect(byAccessibleName(undoName), findsOneWidget,
        reason: 'the dose was forgotten while the tab was off screen');
  });
}
