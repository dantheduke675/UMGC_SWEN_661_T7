// WCAG 2.1 SC 1.4.3 Contrast (Minimum), Level AA.
//
// Why this exists alongside Flutter's MinimumTextContrastGuideline:
//
// That guideline finds text by taking a semantics node's label and looking up
// a matching widget with `find.text(label)`. Every card in this app merges its
// contents into one spoken sentence — "Ropivacaine, 10 mg, due at 8:00 AM" —
// which matches no single Text widget, so the guideline finds nothing and
// silently skips all of that text. Making the app more accessible to screen
// readers made it *less* visible to the contrast checker.
//
// These tests therefore enumerate text from the render tree, rasterise the
// frame, and sample the colour actually painted behind each paragraph. Nothing
// is exempted by how its semantics happen to be labelled.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';



import 'a11y_harness.dart';

class _Failure {
  final String screen;
  final String theme;
  final PaintedText text;
  final ContrastSample sample;
  _Failure(this.screen, this.theme, this.text, this.sample);

  @override
  String toString() =>
      '$screen [$theme]  "${text.text.replaceAll('\n', ' ')}"\n'
      '      ${text.fontSize.toStringAsFixed(0)}px ${text.weight}  '
      // The painted colour, not the style colour: a translucent style colour
      // is never what the eye sees, and printing it hides the real cause.
      'painted=${_hex(sample.foreground)} '
      '(style ${_hex(text.color)} @ alpha ${text.color.a.toStringAsFixed(2)})  '
      'bg=${_hex(sample.background)}  '
      'ratio ${sample.ratio.toStringAsFixed(2)} < ${text.requiredRatio}';
}

String _hex(Color c) => '#${c.toARGB32().toRadixString(16).padLeft(8, '0').substring(2).toUpperCase()}';

/// Text that is legitimately exempt from SC 1.4.3.
bool _exempt(PaintedText t) {
  // Placeholder glyphs in the password field are not text content.
  if (RegExp(r'^[•\s]+$').hasMatch(t.text)) return true;
  // Emoji drawn as icons carry no colour of their own worth measuring; they
  // are hidden from assistive tech and always paired with a real label.
  if (t.text.replaceAll(decorativeGlyph, '').trim().isEmpty) return true;
  return false;
}

Future<List<_Failure>> _check(
  WidgetTester tester,
  Screen screen, {
  required bool isDark,
  double textScale = 1.0,
}) async {
  await pumpScreen(tester, screen, isDark: isDark, textScale: textScale);
  final raster = await rasterize(tester);
  final disabled = disabledRegions(tester);
  final failures = <_Failure>[];
  var checked = 0;

  for (final text in paintedTexts(tester)) {
    if (_exempt(text)) continue;
    if (disabled.any((r) => r.overlaps(text.bounds))) continue;
    final sample = sampleContrast(raster, text);
    if (sample == null) continue;
    checked++;
    if (sample.ratio < text.requiredRatio - 0.01) {
      failures.add(_Failure(screen.name, isDark ? 'dark' : 'light', text, sample));
    }
  }

  expect(checked, greaterThan(0),
      reason: '${screen.name}: no text was measured — the walker is broken, '
          'and a silent zero would make this suite meaningless');

  await disposeScreen(tester);
  return failures;
}

void main() {
  setUp(resetAppState);
  tearDown(resetAppState);

  group('SC 1.4.3 Contrast (Minimum) — every painted paragraph', () {
    for (final screen in allScreens) {
      for (final isDark in const [true, false]) {
        testWidgets('${screen.name} (${isDark ? 'dark' : 'light'})', (tester) async {
          final failures = await _check(tester, screen, isDark: isDark);
          expect(
            failures,
            isEmpty,
            reason: 'text below the WCAG AA floor:\n'
                '${failures.map((f) => '  $f').join('\n')}',
          );
        });
      }
    }
  });

  group('SC 1.4.3 holds at 200% text scale', () {
    // Scaling changes which text counts as "large", and can move text onto a
    // different background as layout reflows — so the ratios must be
    // re-checked, not assumed.
    for (final screen in allScreens) {
      testWidgets('${screen.name} at 200%', (tester) async {
        final failures = await _check(tester, screen, isDark: true, textScale: 2.0);
        expect(failures, isEmpty,
            reason: 'text below the WCAG AA floor at 200% scale:\n'
                '${failures.map((f) => '  $f').join('\n')}');
      });
    }
  });

  group('the measurement itself is trustworthy', () {
    testWidgets('the walker finds text the built-in guideline skips',
        (tester) async {
      // Guards the premise of this file. The medication card's text is merged
      // into a single semantics label, so `find.text(label)` cannot reach it;
      // the render-tree walker must still see the individual paragraphs.
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Medications'));

      final painted = paintedTexts(tester).map((t) => t.text).toList();
      expect(painted, contains('Ropivacaine'));
      expect(painted.any((t) => t.contains('8:00 AM')), isTrue);

      // ...and that same string is not addressable as a labelled semantics
      // node, which is precisely why the built-in guideline misses it.
      final labels = semanticsNodes(tester).map((n) => n.getSemanticsData().label);
      expect(labels, isNot(contains('Ropivacaine')),
          reason: 'if this ever passes, the card stopped merging its label and '
              'this suite should be re-examined');

      await disposeScreen(tester);
    });

    testWidgets('a deliberately low-contrast widget is caught', (tester) async {
      // Negative control: if this does not fail, the detector is broken and
      // every passing test above is worthless.
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          backgroundColor: Color(0xFFF2F3F5),
          body: Center(
            child: Text('almost invisible',
                style: TextStyle(fontSize: 14, color: Color(0xFFE8EAED))),
          ),
        ),
      ));
      await tester.pumpAndSettle();

      final raster = await rasterize(tester);
      final texts = paintedTexts(tester).where((t) => t.text == 'almost invisible');
      expect(texts, hasLength(1));

      final sample = sampleContrast(raster, texts.first);
      expect(sample, isNotNull);
      expect(sample!.ratio, lessThan(1.5),
          reason: 'the sampler must report the real, terrible ratio here');
    });

    testWidgets('a known-good widget measures as good', (tester) async {
      // Positive control, so the sampler cannot pass everything by reporting
      // implausibly high ratios.
      await tester.pumpWidget(const MaterialApp(
        home: Scaffold(
          backgroundColor: Color(0xFFFFFFFF),
          body: Center(
            child: Text('clearly readable',
                style: TextStyle(fontSize: 14, color: Color(0xFF000000))),
          ),
        ),
      ));
      await tester.pumpAndSettle();

      final raster = await rasterize(tester);
      final t = paintedTexts(tester).firstWhere((t) => t.text == 'clearly readable');
      expect(sampleContrast(raster, t)!.ratio, closeTo(21.0, 0.5));
    });
  });
}
