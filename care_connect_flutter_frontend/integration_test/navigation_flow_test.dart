// Integration test: moving around the app.
//
// The bottom navigation bar is the app's spine — six tabs, always on screen,
// and the only way most users reach anything. Two properties matter here and
// neither can be checked one screen at a time:
//
//   * every tab actually arrives at its own screen, through the real router
//     and the real shell rather than at a stub;
//   * exactly one tab reports itself as selected, and it is the right one.
//     The selected tab is drawn with a colour and a small bar, so `selected`
//     in the semantics tree is the only non-visual way to know where you are
//     (WCAG 2.1 SC 1.4.1, SC 4.1.2).

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
import 'package:provider/provider.dart';

import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

import 'e2e_harness.dart';

/// The six tabs, in bar order, with something only that screen renders.
const _tabs = <({String tab, String landmark})>[
  (tab: 'Today', landmark: 'Next appointment'),
  (tab: 'Meds', landmark: 'Total doses'),
  (tab: 'Messages', landmark: 'conversations'),
  (tab: 'Schedule', landmark: 'Schedule'),
  (tab: 'Symptoms', landmark: 'Recent logs'),
  (tab: 'Account', landmark: 'Care team'),
];

/// Every tab button in the navigation bar.
Iterable<CTappable> _navTabs(WidgetTester tester) => tester
    .widgetList<CTappable>(find.byType(CTappable))
    .where((w) => w.hint?.startsWith('Tab ') ?? false);

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  tearDown(resetAppState);

  testWidgets('every tab arrives, and only that tab reports itself selected',
      (tester) async {
    await launchApp(tester, route: '/today');

    for (final entry in _tabs) {
      await openTab(tester, entry.tab);

      final selected =
          _navTabs(tester).where((w) => w.selected == true).toList();
      expect(selected.length, 1,
          reason: 'on ${entry.tab}, ${selected.length} tabs claim to be '
              'selected: ${selected.map((w) => w.label).toList()}');
      expect(selected.single.label, entry.tab,
          reason: 'on ${entry.tab}, the bar says '
              '"${selected.single.label}" is selected');

      // And the screen behind the tab is genuinely that screen.
      if (entry.tab == 'Schedule') {
        expect(
            find.byWidgetPredicate(
                (w) => w is CScreenTitle && w.text == 'Schedule'),
            findsOneWidget);
      } else {
        expect(find.textContaining(entry.landmark), findsWidgets,
            reason: 'the ${entry.tab} tab did not show the ${entry.tab} '
                'screen');
      }
    }
  });

  testWidgets('every tab names its position in the bar', (tester) async {
    // "Tab 4 of 6" is how a screen reader user knows how far along the bar
    // they are; without it the six buttons are an undifferentiated row.
    await launchApp(tester, route: '/today');

    final hints = _navTabs(tester).map((w) => w.hint).toList();
    expect(hints.length, _tabs.length);
    for (var i = 0; i < _tabs.length; i++) {
      expect(hints[i], 'Tab ${i + 1} of ${_tabs.length}');
    }
  });

  testWidgets('the theme choice follows the user across tabs', (tester) async {
    await launchApp(tester, route: '/account');

    final toggle = byAccessibleName('Dark mode');
    await scrollTo(tester, toggle);
    final wasDark = tester.widget<CTappable>(toggle).toggled;
    expect(wasDark, isNotNull,
        reason: 'the theme switch does not expose its on/off state');

    await tester.tap(toggle);
    await tester.pumpAndSettle();
    expect(tester.widget<CTappable>(toggle).toggled, !wasDark!);

    // The scheme is app-wide state, so it has to survive a tab change.
    await openTab(tester, 'Today');
    final shell = tester.element(find.byType(Scaffold).first);
    expect(shell.read<ThemeNotifier>().isDark, !wasDark,
        reason: 'the theme reverted when the screen changed');

    await openTab(tester, 'Account');
    await scrollTo(tester, toggle);
    expect(tester.widget<CTappable>(toggle).toggled, !wasDark,
        reason: 'the switch forgot its own state');
  });

  testWidgets('signing out leaves the tab shell behind', (tester) async {
    await launchApp(tester, route: '/account');

    await tapAndSettle(tester, byAccessibleName('Sign out'));

    expect(find.text('CareConnect'), findsOneWidget,
        reason: 'signing out did not return to the landing screen');
    expect(navTab('Today'), findsNothing,
        reason: 'the navigation bar is still on screen after signing out');
  });
}
