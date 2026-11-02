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
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';

import 'a11y_harness.dart';

/// Renders [screen] at [scale] and returns every layout error Flutter raised.
Future<List<String>> _layoutErrors(
  WidgetTester tester,
  Screen screen,
  double scale, {
  bool isDark = true,
  Size viewport = phoneViewport,
  TextStyle? textSpacing,
  void Function()? whileMounted,
}) async {
  final errors = <String>[];
  final previous = FlutterError.onError;
  FlutterError.onError = (details) => errors.add(details.exception.toString());
  try {
    await pumpScreen(tester, screen,
        textScale: scale,
        isDark: isDark,
        viewport: viewport,
        textSpacing: textSpacing);
    whileMounted?.call();
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

  // WCAG 2.1 SC 1.4.10 Reflow (AA): content usable at 320 CSS px wide without
  // scrolling in two dimensions. On a phone that is a 320 dp viewport — the
  // width of the smallest phones still in use. Layout errors would mean
  // clipped content; a page that is wider than the viewport would mean the
  // user has to scroll sideways to read it.
  group('SC 1.4.10 — reflow at 320 px wide', () {
    const narrow = Size(320, 640);
    for (final screen in allScreens) {
      // 100% only: SC 1.4.10 already assumes 400% zoom in its 320 px figure,
      // so 320 px *and* 200% text together is beyond what it asks. SC 1.4.4
      // above covers 200% at a phone width.
      for (final scale in const [1.0]) {
        testWidgets('${screen.name} at 320 px, ${(scale * 100).round()}% text',
            (tester) async {
          final offscreen = <String>[];
          final errors = await _layoutErrors(tester, screen, scale,
              viewport: narrow, whileMounted: () {
            // No paragraph may sit past either side edge, which would mean
            // scrolling sideways (or not at all) to read it. Text inside a
            // horizontal rail — the week strip, the quick replies — is
            // exempt: that is a component scrolled on its own axis, and
            // every item in it is reachable by swipe, Tab and screen reader.
            for (final e in find
                .byElementPredicate((e) => e.renderObject is RenderParagraph)
                .evaluate()) {
              final inRail = e
                      .findAncestorWidgetOfExactType<Scrollable>()
                      ?.axisDirection ==
                  AxisDirection.right;
              if (inRail) continue;
              final p = e.renderObject! as RenderParagraph;
              if (!p.hasSize) continue;
              final rect = MatrixUtils.transformRect(
                  p.getTransformTo(null), Offset.zero & p.size);
              if (rect.left < -0.5 || rect.right > narrow.width + 0.5) {
                offscreen.add('"${p.text.toPlainText()}" at $rect');
              }
            }
          });
          expect(errors, isEmpty,
              reason: '${screen.name} loses content at 320 px:\n'
                  '${errors.map((e) => '  $e').join('\n')}');
          expect(offscreen, isEmpty,
              reason: '${screen.name}: text outside a 320 px viewport');
        });
      }
    }
  });

  // WCAG 2.1 SC 1.4.12 Text Spacing (AA): no loss of content when a user
  // raises letter, word and line spacing. Native Flutter has no user style
  // sheet, so the overrides are applied the only way they can be — through the
  // text theme every Text inherits from — and the test is the one the
  // criterion asks: does anything clip or overflow?
  group('SC 1.4.12 — no loss of content with increased text spacing', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name} with WCAG text spacing', (tester) async {
        final errors = await _layoutErrors(tester, screen, 1.0,
            textSpacing: wcagTextSpacing);
        expect(errors, isEmpty,
            reason: '${screen.name} loses content with increased spacing:\n'
                '${errors.map((e) => '  $e').join('\n')}');
      });
    }

    testWidgets('the spacing override is genuinely applied', (tester) async {
      // Control: if the override never reached the painted text, every test
      // in this group would pass without having changed anything.
      // Measured as the text's own size, not its box: the heading's box is
      // stretched to the list's width whatever the text inside it does.
      final screen = allScreens.firstWhere((s) => s.name == 'Today');
      Size measure() {
        final p = tester.renderObject<RenderParagraph>(find.descendant(
            of: find.text("Today's medications"),
            matching: find.byType(RichText)));
        return Size(p.getMaxIntrinsicWidth(double.infinity), p.size.height);
      }

      await pumpScreen(tester, screen);
      final plain = measure();
      await disposeScreen(tester);

      await pumpScreen(tester, screen, textSpacing: wcagTextSpacing);
      final spaced = measure();
      await disposeScreen(tester);

      expect(spaced.width, greaterThan(plain.width * 1.1),
          reason: 'letter and word spacing did not widen the heading');
      // The heading is 16 px, so a 1.5 line height is 24 px. (The test font's
      // own line height is already 1.44, so "grew by x%" would be too weak.)
      expect(spaced.height, greaterThanOrEqualTo(16 * 1.5),
          reason: 'line height is not 1.5x the font size');
      expect(plain.height, lessThan(16 * 1.5),
          reason: 'control: without the override the line is shorter');
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
