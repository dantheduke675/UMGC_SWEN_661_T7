// WCAG 2.1 SC 1.4.4 Resize Text, Level AA.
//
// "Text can be resized without assistive technology up to 200 percent without
// loss of content or functionality."
//
// Clipped text is lost content and a clipped button is lost functionality, so
// a RenderFlex overflow at any scale up to 200% is a failure of this
// criterion, not a cosmetic warning. The old version of this file printed the
// overflow count and passed regardless; it now fails.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'a11y_harness.dart';

/// Renders [screen] at [scale] and returns every layout error Flutter raised.
Future<List<String>> _layoutErrors(
  WidgetTester tester,
  Screen screen,
  double scale, {
  bool isDark = true,
}) async {
  final errors = <String>[];
  final previous = FlutterError.onError;
  FlutterError.onError = (details) => errors.add(details.exception.toString());
  try {
    await pumpScreen(tester, screen, textScale: scale, isDark: isDark);
    await disposeScreen(tester);
  } finally {
    FlutterError.onError = previous;
  }
  return errors.where((e) => e.contains('overflowed')).toList();
}

void main() {
  setUp(resetAppState);
  tearDown(resetAppState);

  // 100% is the control: a screen that overflows already tells you nothing
  // about scaling. 130% is where this app used to break, and 200% is the
  // criterion itself.
  const scales = <double>[1.0, 1.3, 1.5, 2.0];

  group('SC 1.4.4 — no content is lost when text is scaled', () {
    for (final screen in allScreens) {
      for (final scale in scales) {
        testWidgets('${screen.name} at ${(scale * 100).round()}%', (tester) async {
          final errors = await _layoutErrors(tester, screen, scale);
          expect(errors, isEmpty,
              reason: '${screen.name} loses content at '
                  '${(scale * 100).round()}% text scale:\n'
                  '${errors.map((e) => '  $e').join('\n')}');
        });
      }
    }
  });

  group('SC 1.4.4 — light theme scales too', () {
    // The themes have different token widths, so one passing does not imply
    // the other.
    for (final screen in allScreens) {
      testWidgets('${screen.name} at 200% (light)', (tester) async {
        final errors = await _layoutErrors(tester, screen, 2.0, isDark: false);
        expect(errors, isEmpty,
            reason: '${screen.name} loses content at 200% in light theme:\n'
                '${errors.map((e) => '  $e').join('\n')}');
      });
    }
  });

  group('SC 1.4.4 — text genuinely grows', () {
    testWidgets('scaling actually enlarges the rendered text', (tester) async {
      // Guards against a fix that "passes" by capping the scale, which is what
      // the FittedBox in the accessibility bar used to do: it shrank labels
      // back down as the user scaled them up, so nothing ever overflowed and
      // nothing ever got bigger either.
      final screen = allScreens.firstWhere((s) => s.name == 'Today');

      await pumpScreen(tester, screen);
      final small = {
        for (final t in paintedTexts(tester)) t.text: t.bounds.height,
      };
      await disposeScreen(tester);

      await pumpScreen(tester, screen, textScale: 2.0);
      final large = {
        for (final t in paintedTexts(tester)) t.text: t.bounds.height,
      };
      await disposeScreen(tester);

      final shared = small.keys.where(large.containsKey).toList();
      expect(shared, isNotEmpty, reason: 'no comparable text between scales');

      final notGrown = shared.where((k) => large[k]! <= small[k]! * 1.5).toList();
      expect(notGrown, isEmpty,
          reason: 'these did not grow with the user setting: $notGrown');
    });

    testWidgets('the accessibility bar labels grow with the setting',
        (tester) async {
      // Named explicitly because this is where the regression would land.
      final screen = allScreens.firstWhere((s) => s.name == 'Today');

      await pumpScreen(tester, screen);
      final before = paintedTexts(tester)
          .firstWhere((t) => t.text == 'Scroll up')
          .bounds
          .height;
      await disposeScreen(tester);

      await pumpScreen(tester, screen, textScale: 2.0);
      final after = paintedTexts(tester)
          .firstWhere((t) => t.text == 'Scroll up')
          .bounds
          .height;
      await disposeScreen(tester);

      expect(after, greaterThan(before * 1.5),
          reason: 'the scroll button label is being scaled back down');
    });
  });

  group('the overflow detector works', () {
    testWidgets('a deliberately overflowing layout is caught', (tester) async {
      // Negative control for the groups above.
      final errors = <String>[];
      final previous = FlutterError.onError;
      FlutterError.onError = (d) => errors.add(d.exception.toString());
      // The children need a non-zero width: RenderFlex reports overflow from
      // paint(), and a zero-sized box is never painted, so a width-less
      // version of this control silently reports nothing.
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          body: Center(
            child: SizedBox(
              height: 40,
              width: 100,
              child: Column(
                children: [
                  SizedBox(height: 30, width: 100, child: ColoredBox(color: Color(0xFF112233))),
                  SizedBox(height: 30, width: 100, child: ColoredBox(color: Color(0xFF332211))),
                ],
              ),
            ),
          ),
        ),
      ));
      await tester.pump();
      FlutterError.onError = previous;

      expect(errors.where((e) => e.contains('overflowed')), isNotEmpty,
          reason: 'the detector is not observing layout errors at all');
    });
  });
}
