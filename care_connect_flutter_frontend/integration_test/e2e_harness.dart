// Shared harness for the on-device integration tests.
//
// What separates these from the widget tests under test/:
//
//   * those mount one screen at a time behind stub routes, on a synthetic
//     800x5000 surface, with FakeAsync standing in for the clock;
//   * these launch the real application — the real GoRouter, the real
//     AppShell, the real provider graph — on a real device, at that device's
//     real size, with real frame scheduling and real animation timing.
//
// A workflow that crosses screens is only genuinely exercised here. A widget
// test that "navigates" from Today to Medications is really navigating to a
// stub; this one navigates to the actual screen, through the actual shell,
// and can therefore catch state that fails to survive the trip.
//
// Every interaction below is driven by a control's *accessible name* rather
// than by the pixels or the text inside it. That is deliberate: it is the
// same handle TalkBack and VoiceOver use, and the same handle the Maestro
// flows in .maestro/ use, so a control that loses its label fails these
// tests rather than quietly becoming unreachable for screen reader users.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/main.dart' as app;
import 'package:care_connect_flutter_frontend/main.dart' show appRouter;
import 'package:care_connect_flutter_frontend/widgets.dart';

// ── State ────────────────────────────────────────────────────────────────────

/// Restores the mutable globals in data.dart to their seeded values.
///
/// `slotStatuses` and `threads` are top-level and mutable, so without this
/// each test would inherit whatever the previous one did to them.
void resetAppState() {
  slotStatuses
    ..clear()
    ..addAll({'1-0': SlotStatus.taken, '3-0': SlotStatus.taken});
  for (final t in threads) {
    t.unread = t.id == 1;
  }
  for (final t in threads) {
    t.messages.removeWhere((m) => m.time == 'Now');
  }
}

/// The number of medication doses in a day, derived rather than hard-coded so
/// these tests keep meaning something if the seed data changes.
int get totalDoses => buildSlots().length;

int get takenDoses =>
    slotStatuses.values.where((s) => s == SlotStatus.taken).length;

// ── Launching ────────────────────────────────────────────────────────────────

/// Launches the real app and leaves it settled at [route].
///
/// `appRouter` is a top-level singleton, so it survives a second `runApp` and
/// remembers where the previous test finished. Resetting it here is what
/// makes these tests independent of each other and of their order.
Future<void> launchApp(
  WidgetTester tester, {
  String route = '/landing',
}) async {
  resetAppState();
  app.main();
  await tester.pump();
  appRouter.go(route);
  await tester.pumpAndSettle();
}

// ── Finders ──────────────────────────────────────────────────────────────────

/// A control addressed by the name assistive technology would announce.
///
/// Using this instead of `find.text` is the point: the visible text on a
/// medication button is "I took this" on all seven of them, so only the
/// accessible name distinguishes one dose from another (SC 4.1.2).
Finder byAccessibleName(String name) => find.byWidgetPredicate(
      (w) => w is CTappable && w.label == name,
      description: 'control named "$name"',
    );

/// A bottom-navigation tab, scoped by the positional hint so it cannot be
/// confused with a same-named heading or card elsewhere on the screen.
Finder navTab(String label) => find.byWidgetPredicate(
      (w) =>
          w is CTappable &&
          w.label == label &&
          (w.hint?.startsWith('Tab ') ?? false),
      description: 'bottom nav tab "$label"',
    );

// ── Interactions ─────────────────────────────────────────────────────────────

/// Scrolls the screen's main list until [finder] is built and on screen.
///
/// The tab screens are long `ListView`s, so a control further down the page
/// has not been built yet and is invisible to any finder until scrolled to.
Future<Finder> scrollTo(
  WidgetTester tester,
  Finder finder, {
  double step = 260,
  int maxScrolls = 40,
}) async {
  final scrollable = find.byType(Scrollable).first;
  for (var i = 0; i < maxScrolls; i++) {
    if (finder.evaluate().isNotEmpty) {
      await tester.ensureVisible(finder.first);
      await tester.pumpAndSettle();
      return finder;
    }
    await tester.drag(scrollable, Offset(0, -step));
    await tester.pumpAndSettle();
  }
  if (finder.evaluate().isEmpty) {
    fail('never found $finder after $maxScrolls scrolls');
  }
  return finder;
}

/// Scrolls [finder] into view and taps it.
Future<void> tapAndSettle(WidgetTester tester, Finder finder) async {
  await scrollTo(tester, finder);
  await tester.tap(finder.first);
  await tester.pumpAndSettle();
}

/// Switches to the tab named [label] through the bottom navigation bar, the
/// way a user would, rather than by calling `router.go`.
Future<void> openTab(WidgetTester tester, String label) async {
  final tab = navTab(label);
  expect(tab, findsOneWidget, reason: 'no "$label" tab in the navigation bar');
  await tester.tap(tab);
  await tester.pumpAndSettle();
}

/// Scrolls the current screen back to the top.
Future<void> scrollToTop(WidgetTester tester) async {
  final scrollable = find.byType(Scrollable).first;
  for (var i = 0; i < 40; i++) {
    await tester.drag(scrollable, const Offset(0, 400));
    await tester.pumpAndSettle();
    final position = tester.widget<Scrollable>(scrollable).controller?.position;
    if (position != null && position.pixels <= position.minScrollExtent) break;
  }
}
