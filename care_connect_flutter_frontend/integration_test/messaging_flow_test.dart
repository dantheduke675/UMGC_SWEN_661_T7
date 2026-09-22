// Integration test: reading and answering a caregiver's message.
//
// This flow leaves the tab screens for a nested route and comes back, which
// is where the app keeps its least durable state: the unread flag is cleared
// by the thread screen's `initState`, and a sent message is appended to a
// shared `Thread` rather than to the widget's own list. Neither survives a
// single-screen test honestly, because in one the trip never happens.
//
// The unread flag is also an accessibility fixture in its own right: it is
// drawn as a small red dot, so the only non-visual way to know a message is
// unread is the word "Unread" at the front of the row's accessible name
// (WCAG 2.1 SC 1.4.1, SC 1.3.1). The assertions below read that name.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

import 'e2e_harness.dart';

/// The conversation row for [contactName], whatever its preview text says.
Finder threadRow(String contactName) => find.byWidgetPredicate(
      (w) =>
          w is CTappable &&
          w.hint == 'Opens conversation' &&
          w.label.contains(contactName),
      description: 'conversation row for $contactName',
    );

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  tearDown(resetAppState);

  testWidgets('open an unread thread, reply, and see both stick',
      (tester) async {
    await launchApp(tester, route: '/messages');

    final joyce = contacts.firstWhere((c) => c.name == 'Aunt Joyce');

    // ── The unread state is announced, not just coloured ──────────────────
    expect(threadRow(joyce.name), findsOneWidget);
    expect(tester.widget<CTappable>(threadRow(joyce.name)).label,
        startsWith('Unread. '),
        reason: 'an unread conversation is distinguished only by a red dot');

    await tapAndSettle(tester, threadRow(joyce.name));

    // ── Inside the thread ─────────────────────────────────────────────────
    expect(find.text(joyce.role), findsWidgets);
    expect(find.text('Hi Maddy, did you take your morning medications?'),
        findsOneWidget);

    // ── Send a quick reply ────────────────────────────────────────────────
    await tester.tap(byAccessibleName('Send quick reply: Thank you!'));
    await tester.pumpAndSettle();

    expect(find.text('Thank you!'), findsWidgets);
    expect(threadById(1).messages.last.text, 'Thank you!');
    expect(threadById(1).messages.last.from, 'me');

    // ── Type one by hand and send it ──────────────────────────────────────
    const typed = 'Heading out for a walk';
    await tester.enterText(find.byType(TextField), typed);
    await tester.pumpAndSettle();
    await tester.tap(byAccessibleName('Send message'));
    await tester.pumpAndSettle();

    expect(threadById(1).messages.last.text, typed);

    // ── Leave and come back ───────────────────────────────────────────────
    await tester.tap(find.text('←'));
    await tester.pumpAndSettle();

    expect(find.text('Messages'), findsWidgets,
        reason: 'the back control did not return to the conversation list');
    expect(tester.widget<CTappable>(threadRow(joyce.name)).label,
        isNot(startsWith('Unread. ')),
        reason: 'reading the thread did not clear its unread state');

    await tapAndSettle(tester, threadRow(joyce.name));
    expect(find.text(typed), findsOneWidget,
        reason: 'the sent message did not survive leaving the thread');
  });

  testWidgets('the call button reaches the calling screen', (tester) async {
    await launchApp(tester, route: '/messages');

    final chen = contacts.firstWhere((c) => c.name == 'Dr. Sarah Chen');
    await tapAndSettle(tester, threadRow(chen.name));

    // The button draws a telephone emoji and nothing else, so its accessible
    // name is the only thing that says whom it calls (SC 1.1.1, SC 4.1.2).
    await tester.tap(byAccessibleName('Call ${chen.name}'));
    // The calling screen animates forever, so settle is not an option.
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 400));

    expect(find.text(chen.name), findsWidgets);
    expect(find.text('Calling…'), findsOneWidget);

    // The shell hides its bars on a call: a full-screen control should not be
    // competing with a navigation bar underneath it.
    expect(navTab('Today'), findsNothing,
        reason: 'the navigation bar is still present during a call');
  });
}
