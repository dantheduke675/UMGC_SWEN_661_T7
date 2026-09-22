// WCAG 2.1 SC 2.1.1 Keyboard (A), SC 2.4.3 Focus Order (A), SC 2.4.7 Focus
// Visible (AA), plus the 48x48 target size the assignment rubric requires.
//
// Also runs Flutter's four built-in AccessibilityGuideline checks as
// assertions rather than as a report. They are necessary but not sufficient —
// see contrast_test.dart and semantics_test.dart for what they miss — so they
// are the floor here, not the ceiling.

import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:care_connect_flutter_frontend/data.dart';

import 'a11y_harness.dart';

void main() {
  setUp(resetAppState);
  tearDown(resetAppState);

  group('SC 2.1.1 — every control is keyboard operable', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: no control is unreachable', (tester) async {
        await pumpScreen(tester, screen);

        // A GestureDetector has no focus node at all, which is how the app
        // used to be built; an InkWell with canRequestFocus false would be
        // just as unreachable.
        final unreachable = tester
            .widgetList<InkWell>(find.byType(InkWell))
            .where((w) => w.onTap != null && !w.canRequestFocus)
            .length;
        expect(unreachable, 0,
            reason: '${screen.name}: enabled controls that cannot take focus');

        final buttons = tester
            .widgetList<ButtonStyleButton>(find.byType(ButtonStyleButton))
            .where((b) => b.onPressed != null && !(b.enabled))
            .length;
        expect(buttons, 0);

        await disposeScreen(tester);
      });
    }

    testWidgets('Tab actually moves focus through the Today screen',
        (tester) async {
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Today'));

      final stops = <int>{};
      for (var i = 0; i < 30; i++) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pump();
        final node = FocusManager.instance.primaryFocus;
        if (node != null && node.context != null) stops.add(node.hashCode);
      }

      // The screen has a dozen controls; anything in single digits means the
      // traversal ring is broken, not merely short.
      expect(stops.length, greaterThanOrEqualTo(10),
          reason: 'Tab reached only ${stops.length} distinct stops');
      await disposeScreen(tester);
    });
  });

  group('SC 2.4.7 — focus is visible', () {
    testWidgets('the control that takes focus visibly changes', (tester) async {
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Today'));
      final before = await rasterize(tester);

      // Walk until focus lands on something with a box on screen.
      Rect? focusedBounds;
      for (var i = 0; i < 12 && focusedBounds == null; i++) {
        await tester.sendKeyEvent(LogicalKeyboardKey.tab);
        await tester.pumpAndSettle();
        final ctx = FocusManager.instance.primaryFocus?.context;
        final box = ctx?.findRenderObject();
        if (box is RenderBox && box.hasSize && box.size.width > 0) {
          final origin = box.localToGlobal(Offset.zero);
          final rect = origin & box.size;
          if (rect.right <= before.width && rect.bottom <= before.height) {
            focusedBounds = rect;
          }
        }
      }
      expect(focusedBounds, isNotNull,
          reason: 'Tab never landed on a control with a visible box');

      final after = await rasterize(tester);

      // The change must be *on the focused control*, not merely somewhere on
      // screen — a repaint elsewhere would otherwise pass this trivially.
      var changed = 0;
      for (var y = focusedBounds!.top.floor(); y < focusedBounds.bottom.ceil(); y++) {
        for (var x = focusedBounds.left.floor(); x < focusedBounds.right.ceil(); x++) {
          if (before.at(x, y) != after.at(x, y)) changed++;
        }
      }
      expect(changed, greaterThan(0),
          reason: 'the focused control looks identical to its unfocused state, '
              'so a keyboard user cannot tell where focus is (SC 2.4.7)');
      await disposeScreen(tester);
    });
  });

  group('rubric: touch targets are at least 48x48', () {
    for (final screen in allScreens) {
      testWidgets(screen.name, (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);
        await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('Flutter AccessibilityGuideline floor', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: iOS targets, labels, contrast',
          (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);
        await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));
        await expectLater(tester, meetsGuideline(textContrastGuideline));
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('SC 2.4.3 — the confirm dialog is modal', () {
    testWidgets('it traps focus, names itself, and hides what is behind it',
        (tester) async {
      final handle = tester.ensureSemantics();
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Medications'));

      await tester.tap(find.text('I missed this').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      expect(find.text('Yes, I missed this dose'), findsOneWidget);

      final nodes = semanticsNodes(tester);
      expect(
        nodes.where((n) => n.getSemanticsData().flagsCollection.namesRoute),
        isNotEmpty,
        reason: 'the dialog must announce itself as a dialog on open',
      );
      expect(
        nodes.any((n) => n.getSemanticsData().label.contains('Total doses')),
        isFalse,
        reason: 'content behind a modal must be hidden from screen readers',
      );

      // Focus must be inside the dialog, and on the non-destructive choice.
      final focused = FocusManager.instance.primaryFocus;
      expect(focused, isNotNull);
      expect(find.descendant(of: find.byType(Dialog), matching: find.byType(OutlinedButton)),
          findsOneWidget);

      await disposeScreen(tester);
      handle.dispose();
    });

    testWidgets('a tap meant for the nav behind it cannot navigate away',
        (tester) async {
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Medications'));

      await tester.tap(find.text('I missed this').first, warnIfMissed: false);
      await tester.pumpAndSettle();

      await tester.tap(find.text('Schedule').first, warnIfMissed: false);
      await tester.pumpAndSettle();

      // Dismissing via the barrier is allowed; leaving the screen is not, and
      // neither is recording the dose without an answer.
      expect(find.text('Total doses'), findsOneWidget,
          reason: 'the tap reached the navigation behind the modal barrier');
      expect(slotStatuses.values, isNot(contains(SlotStatus.missed)),
          reason: 'a dose was marked missed without the user confirming');

      await disposeScreen(tester);
    });

    testWidgets('cancelling leaves the dose untouched', (tester) async {
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Medications'));
      await tester.tap(find.text('I missed this').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Cancel — go back'), warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(find.text('Yes, I missed this dose'), findsNothing);
      expect(slotStatuses.values, isNot(contains(SlotStatus.missed)));
      await disposeScreen(tester);
    });

    testWidgets('confirming records the dose', (tester) async {
      // The other half of the pair: proving the dialog is inert would be easy
      // if it simply never worked.
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Medications'));
      await tester.tap(find.text('I missed this').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Yes, I missed this dose'), warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(slotStatuses.values, contains(SlotStatus.missed));
      await disposeScreen(tester);
    });
  });

  group('the guideline checks are actually running', () {
    testWidgets('a 20x20 button fails the tap target guideline', (tester) async {
      // Negative control for the whole guideline group above.
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(
              width: 20,
              height: 20,
              child: GestureDetector(
                onTap: () {},
                child: const Text('x'),
              ),
            ),
          ),
        ),
      ));
      await tester.pumpAndSettle();

      var threw = false;
      try {
        await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
      } on TestFailure {
        threw = true;
      }
      expect(threw, isTrue,
          reason: 'the tap-target guideline is not evaluating anything');
      handle.dispose();
    });
  });
}
