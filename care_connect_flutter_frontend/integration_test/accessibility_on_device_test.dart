// Integration test: accessibility properties of the assembled app, on a
// device.
//
// The suite under test/accessibility/ checks each screen in isolation on a
// synthetic surface. This file checks the same criteria on the real thing:
// the real screen size, the real shell with both of its bars competing for
// space, the real navigation, and the real text-scale pipeline coming from
// the platform rather than from an injected MediaQuery.
//
// That difference is not cosmetic. A 48x48 target can pass at a made-up
// 411x891 surface and fail on a device whose bars eat more of the height; a
// layout can survive an injected `TextScaler` and still overflow when the
// scale arrives from the platform at startup.
//
// Three of Flutter's four built-in AccessibilityGuideline checks run here as
// the floor. They are not the ceiling — `labeledTapTargetGuideline` accepts
// an emoji as a label, and `MinimumTextContrastGuideline` skips any text
// whose semantics label differs from what is drawn, which in this app is
// most of it. The stricter gates live in test/accessibility/.
//
// `textContrastGuideline` is deliberately not in the list. On a device it
// rasterises the whole semantics node and takes the extreme colours in that
// rectangle as foreground and background, so a rounded 2px border inside the
// node is read as if it were the text. It reported "Scroll up" at 2.51:1
// with a foreground of #4B5A76 — which is not the label colour at all, but
// exactly `darkControlBorder` #5D6F90 composited at 75% alpha over
// `darkSurface2` #141A27, i.e. one anti-aliased pixel of the button's own
// outline. The label is `darkSub` #9EA8BD on #141A27 = 7.28:1, and the
// border it actually sampled is 3.43:1, past the 3:1 that SC 1.4.11 asks of
// a non-text control boundary. It also reported "9 doses today" at 1.04:1
// between two background colours, having found no text in the rect at all.
// Both are false. Contrast is gated for real, per painted paragraph, in
// test/accessibility/contrast_test.dart.

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';

import 'e2e_harness.dart';

/// The six tab screens, reached the way a user reaches them.
const _tabs = ['Today', 'Meds', 'Messages', 'Schedule', 'Symptoms', 'Account'];

/// Emoji, arrows and other decorative glyphs the app draws as icons.
final _decorative = RegExp(
  r'^[\s -㌀\u{1F000}-\u{1FAFF}\u{FE00}-\u{FE0F}←-⇿'
  r'✓✔✕✗✘×•·+]*$',
  unicode: true,
);

List<SemanticsNode> _allNodes(WidgetTester tester) {
  // rootPipelineOwner exposes no semanticsOwner here; the deprecated accessor
  // is still the way to reach the compiled tree (same note as the widget-test
  // harness in test/accessibility/a11y_harness.dart).
  // ignore: deprecated_member_use
  final root = tester.binding.pipelineOwner.semanticsOwner?.rootSemanticsNode;
  if (root == null) return const [];
  final out = <SemanticsNode>[];
  void walk(SemanticsNode n) {
    out.add(n);
    n.visitChildren((c) {
      walk(c);
      return true;
    });
  }

  walk(root);
  return out;
}

/// Every control the user can activate, as assistive technology sees it.
List<SemanticsData> _controls(WidgetTester tester) => _allNodes(tester)
    .map((n) => n.getSemanticsData())
    .where((d) =>
        d.flagsCollection.isButton ||
        d.hasAction(SemanticsAction.tap) ||
        d.flagsCollection.isSlider)
    .toList();

Future<List<String>> _overflowsAt(
  WidgetTester tester,
  double scale,
  String route,
) async {
  final errors = <String>[];
  final previous = FlutterError.onError;
  FlutterError.onError = (details) => errors.add(details.exception.toString());
  try {
    tester.platformDispatcher.textScaleFactorTestValue = scale;
    await launchApp(tester, route: route);
    // Outlast the runtime font fetch. google_fonts resolves Inter over the
    // network, so the first layout uses a fallback with different metrics and
    // a label that fits on one line under one font can wrap under the other.
    // Judging the layout before the real font lands is how a 13px clip in the
    // navigation bar stayed invisible to the whole widget-test suite.
    await tester.pump(const Duration(seconds: 3));
    await tester.pumpAndSettle();
    // Scroll the whole page: a RenderFlex reports overflow when it paints, so
    // content below the fold has to be brought on screen to be judged.
    final scrollable = find.byType(Scrollable);
    if (scrollable.evaluate().isNotEmpty) {
      for (var i = 0; i < 12; i++) {
        await tester.drag(scrollable.first, const Offset(0, -400));
        await tester.pumpAndSettle();
      }
    }
  } finally {
    FlutterError.onError = previous;
    tester.platformDispatcher.clearTextScaleFactorTestValue();
  }
  return errors.where((e) => e.contains('overflowed')).toList();
}

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  tearDown(resetAppState);

  group('Flutter AccessibilityGuideline floor, on the device', () {
    for (final tab in _tabs) {
      testWidgets('$tab: tap targets and labels', (tester) async {
        final handle = tester.ensureSemantics();
        await launchApp(tester, route: '/today');
        await openTab(tester, tab);

        await expectLater(tester, meetsGuideline(androidTapTargetGuideline));
        await expectLater(tester, meetsGuideline(iOSTapTargetGuideline));
        await expectLater(tester, meetsGuideline(labeledTapTargetGuideline));

        handle.dispose();
      });
    }
  });

  group('SC 1.1.1 / 4.1.2 — controls are named, not drawn', () {
    for (final tab in _tabs) {
      testWidgets('$tab: no control announces only a glyph', (tester) async {
        final handle = tester.ensureSemantics();
        await launchApp(tester, route: '/today');
        await openTab(tester, tab);

        final controls = _controls(tester);
        expect(controls, isNotEmpty,
            reason: '$tab exposed no controls at all — the walk found '
                'nothing, so nothing below this is being checked');

        final unnamed = <String>[];
        for (final d in controls) {
          final name = d.label.trim().isNotEmpty ? d.label : d.tooltip;
          if (name.trim().isEmpty || _decorative.hasMatch(name)) {
            unnamed.add('"$name"');
          }
        }
        expect(unnamed, isEmpty,
            reason: '$tab has controls a screen reader can only read out as '
                'a glyph: ${unnamed.join(', ')}');
        handle.dispose();
      });
    }
  });

  testWidgets('SC 4.1.2 — the severity slider is operable without sight',
      (tester) async {
    // A slider that can only be dragged is unusable with a screen reader.
    // The increase/decrease actions are what TalkBack and VoiceOver invoke,
    // and the formatted value is what they read back.
    final handle = tester.ensureSemantics();
    await launchApp(tester, route: '/symptoms');
    await tapAndSettle(tester, byAccessibleName('Log a symptom'));
    await scrollTo(tester, find.byType(Slider));

    // Found by its role, the way assistive technology finds it, rather than
    // by walking up from the widget — which lands on whichever ancestor node
    // happens to exist and tells you nothing about what TalkBack can reach.
    SemanticsNode slider() => _allNodes(tester)
        .singleWhere((n) => n.getSemanticsData().flagsCollection.isSlider,
            orElse: () => fail('no node in the tree reports itself a slider'));

    var node = slider();
    expect(node.getSemanticsData().hasAction(SemanticsAction.increase), isTrue,
        reason: 'the slider offers no increase action, so it can only be '
            'dragged — unusable with a screen reader');
    expect(node.value, 'Severity 3 of 5',
        reason: 'the slider reads out a bare number with no units');

    // ignore: deprecated_member_use
    tester.binding.pipelineOwner.semanticsOwner!
        .performAction(node.id, SemanticsAction.increase);
    await tester.pumpAndSettle();

    expect(slider().value, 'Severity 4 of 5',
        reason: 'the screen reader action did not move the slider');

    handle.dispose();
  });

  testWidgets('SC 4.1.3 — the dose tally is a live region', (tester) async {
    // Android reports supportsAnnounce: false, so `liveRegion` on the visible
    // summary is the mechanism TalkBack actually honours. If this flag is
    // lost, marking a dose taken becomes silent on the rubric's own platform.
    final handle = tester.ensureSemantics();
    await launchApp(tester, route: '/today');

    final live = _allNodes(tester)
        .map((n) => n.getSemanticsData())
        .where((d) => d.flagsCollection.isLiveRegion)
        .toList();
    expect(live, isNotEmpty,
        reason: 'nothing on Today announces itself when it changes');
    expect(live.any((d) => d.label.contains('of $totalDoses taken')), isTrue,
        reason: 'the live region is not the dose tally: '
            '${live.map((d) => d.label).toList()}');

    handle.dispose();
  });

  group('SC 1.4.4 — text scaling on the real device', () {
    // 100% belongs in this list as much as 200% does: the clipped label in
    // the navigation bar happened at default size, once the real font loaded.
    for (final scale in const [1.0, 1.3, 2.0]) {
      for (final route in const [
        '/today',
        '/medications',
        '/symptoms',
        '/account'
      ]) {
        testWidgets('$route at ${(scale * 100).round()}%', (tester) async {
          final overflows = await _overflowsAt(tester, scale, route);
          expect(overflows, isEmpty,
              reason: '$route loses content at ${(scale * 100).round()}% '
                  'text scale:\n'
                  '${overflows.map((e) => '  $e').join('\n')}');
        });
      }
    }

    testWidgets('and the text really is bigger', (tester) async {
      // Guards the fix, not just the symptom: capping the scale would stop
      // the overflow above and defeat the user's setting at the same time.
      await launchApp(tester, route: '/today');
      final small = tester
          .renderObject<RenderParagraph>(find.text('Next appointment'))
          .size
          .height;

      tester.platformDispatcher.textScaleFactorTestValue = 2.0;
      addTearDown(tester.platformDispatcher.clearTextScaleFactorTestValue);
      await launchApp(tester, route: '/today');
      final large = tester
          .renderObject<RenderParagraph>(find.text('Next appointment'))
          .size
          .height;

      expect(large, greaterThan(small * 1.5),
          reason: 'text is being scaled back down: $small -> $large');
    });
  });

  testWidgets('SC 2.1.1 — the tab bar is reachable with a keyboard',
      (tester) async {
    await launchApp(tester, route: '/today');

    final unreachable = tester
        .widgetList<InkWell>(find.byType(InkWell))
        .where((w) => w.onTap != null && !w.canRequestFocus)
        .length;
    expect(unreachable, 0,
        reason: 'the assembled app has controls that cannot take focus');
  });
}
