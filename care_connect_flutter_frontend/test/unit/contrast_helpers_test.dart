// Property tests for the contrast helpers in lib/theme.dart.
//
// These matter more than they look. Since the AA remediation, almost every
// accent colour in the app is computed at build time by `readableOn` rather
// than hand-picked, so a hole in this function is a hole in SC 1.4.3 across
// the whole product — and it would not show up as a compile error or as a
// wrong-looking screen, only as text nobody can read.
//
// `readableOn` walks lightness toward black or white, choosing the direction
// from the background's luminance with a threshold of 0.18. That constant is
// load-bearing: pick it wrong and there is a band of mid-tone backgrounds
// where neither direction reaches 4.5:1. The sweeps below exist to pin it.

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

import 'package:care_connect_flutter_frontend/theme.dart';

/// Every accent the app paints text or chips with.
const _accents = <Color>[
  Color(0xFFF59E0B), // amber
  Color(0xFF22C55E), // green
  Color(0xFFEF4444), // red
  CTokens.danger,
  Color(0xFF6366F1), // indigo
  CTokens.caregiverPurple,
  CTokens.primary,
  CTokens.primaryLight,
  CTokens.darkLink,
  CTokens.lightLink,
];

Color _hsl(double h, double s, double l) =>
    HSLColor.fromAHSL(1.0, h, s, l).toColor();

void main() {
  group('contrastRatio matches the WCAG definition', () {
    test('black on white is 21:1', () {
      expect(contrastRatio(const Color(0xFF000000), const Color(0xFFFFFFFF)),
          closeTo(21.0, 0.01));
    });

    test('a colour against itself is 1:1', () {
      for (final c in _accents) {
        expect(contrastRatio(c, c), closeTo(1.0, 0.0001));
      }
    });

    test('it is symmetric', () {
      for (final a in _accents) {
        for (final b in _accents) {
          expect(contrastRatio(a, b), closeTo(contrastRatio(b, a), 1e-9));
        }
      }
    });

    test('mid grey on white matches the published value', () {
      // #767676 on white is the canonical 4.54:1 example from the W3C
      // understanding document for SC 1.4.3.
      expect(contrastRatio(const Color(0xFF767676), const Color(0xFFFFFFFF)),
          closeTo(4.54, 0.02));
    });
  });

  group('compositeOver matches manual alpha maths', () {
    test('50% black over white is mid grey', () {
      final c = compositeOver(
          const Color(0x80000000), const Color(0xFFFFFFFF));
      expect((c.r * 255).round(), closeTo(128, 1));
      expect(c.a, 1.0);
    });

    test('a fully opaque colour composites to itself', () {
      for (final c in _accents) {
        expect(compositeOver(c, const Color(0xFFFFFFFF)), c);
      }
    });
  });

  group('readableOn never leaves text below the floor', () {
    test('on every grey background, for every accent', () {
      final failures = <String>[];
      for (var v = 0; v <= 255; v++) {
        final bg = Color.fromARGB(255, v, v, v);
        for (final accent in _accents) {
          final fixed = readableOn(accent, bg);
          final ratio = contrastRatio(fixed, bg);
          if (ratio < 4.5) {
            failures.add('grey $v vs $accent -> $fixed (${ratio.toStringAsFixed(2)})');
          }
        }
      }
      expect(failures, isEmpty,
          reason: 'readableOn cannot reach 4.5:1 for:\n${failures.take(10).join('\n')}');
    });

    test('on saturated backgrounds across the hue wheel', () {
      final failures = <String>[];
      for (var h = 0; h < 360; h += 15) {
        for (final s in const [0.2, 0.5, 0.8, 1.0]) {
          for (var l = 2; l <= 98; l += 4) {
            final bg = _hsl(h.toDouble(), s, l / 100);
            for (final accent in _accents) {
              final ratio = contrastRatio(readableOn(accent, bg), bg);
              if (ratio < 4.5) {
                failures.add('hsl($h,$s,${l / 100}) vs $accent '
                    '(${ratio.toStringAsFixed(2)})');
              }
            }
          }
        }
      }
      expect(failures, isEmpty,
          reason: 'readableOn cannot reach 4.5:1 for:\n${failures.take(10).join('\n')}');
    });

    test('including the mid-tone band where the direction flips', () {
      // The threshold is 0.18. Either side of it, only one direction works:
      // at luminance 0.19 white gives 4.38 and black gives 4.80. Walking the
      // band in fine steps is what would catch the constant being changed.
      final failures = <String>[];
      for (var v = 90; v <= 140; v++) {
        final bg = Color.fromARGB(255, v, v, v);
        for (final accent in _accents) {
          final ratio = contrastRatio(readableOn(accent, bg), bg);
          if (ratio < 4.5) {
            failures.add('grey $v (lum ${bg.computeLuminance().toStringAsFixed(3)}) '
                'vs $accent -> ${ratio.toStringAsFixed(2)}');
          }
        }
      }
      expect(failures, isEmpty, reason: failures.take(10).join('\n'));
    });

    test('and honours a relaxed ratio for large text', () {
      for (var v = 0; v <= 255; v += 3) {
        final bg = Color.fromARGB(255, v, v, v);
        for (final accent in _accents) {
          expect(contrastRatio(readableOn(accent, bg, minRatio: 3.0), bg),
              greaterThanOrEqualTo(3.0));
        }
      }
    });
  });

  group('readableOn is conservative', () {
    test('a colour that already passes is returned untouched', () {
      expect(readableOn(CTokens.lightText, CTokens.lightBg), CTokens.lightText);
      expect(readableOn(CTokens.darkText, CTokens.darkBg), CTokens.darkText);
      expect(readableOn(const Color(0xFFFFFFFF), CTokens.primary),
          const Color(0xFFFFFFFF));
    });

    test('it moves lightness, not hue', () {
      // The point of adjusting in HSL: an amber chip must stay amber, or the
      // fix becomes a redesign.
      for (final accent in _accents) {
        for (final bg in const [CTokens.lightSurface, CTokens.darkSurface]) {
          final fixed = readableOn(accent, bg);
          if (fixed == accent) continue;
          final before = HSLColor.fromColor(accent);
          final after = HSLColor.fromColor(fixed);
          expect((after.hue - before.hue).abs(), lessThan(2.0),
              reason: '$accent shifted hue on $bg');
        }
      }
    });

    test('it moves toward the background it is given', () {
      for (final accent in _accents) {
        final onLight = readableOn(accent, CTokens.lightSurface);
        final onDark = readableOn(accent, CTokens.darkSurface);
        if (onLight != accent) {
          expect(onLight.computeLuminance(), lessThan(accent.computeLuminance()),
              reason: '$accent should darken on a light surface');
        }
        if (onDark != accent) {
          expect(onDark.computeLuminance(), greaterThan(accent.computeLuminance()),
              reason: '$accent should lighten on a dark surface');
        }
      }
    });
  });

  group('readableOnTint fixes the tinted-pill pattern', () {
    test('for every accent, theme and tint strength the app uses', () {
      // 0.08 sign-out, 0.10 stat tiles, 0.12 severity/taken, 0.13 chips.
      for (final alpha in const [0.08, 0.10, 0.12, 0.13]) {
        for (final surface in const [
          CTokens.lightSurface,
          CTokens.lightBg,
          CTokens.darkSurface,
          CTokens.darkBg,
        ]) {
          for (final accent in _accents) {
            final label = readableOnTint(accent, surface, alpha);
            final pill = compositeOver(accent.withValues(alpha: alpha), surface);
            expect(contrastRatio(label, pill), greaterThanOrEqualTo(4.5),
                reason: '$accent at $alpha on $surface');
          }
        }
      }
    });
  });

  group('legibleOn keeps badges readable', () {
    test('every contact colour in the app yields a legible pair', () {
      for (final argb in const [0xFF6366F1, 0xFF357C6F, 0xFFF59E0B]) {
        final badge = legibleOn(Color(argb));
        expect(contrastRatio(badge.foreground, badge.fill),
            greaterThanOrEqualTo(4.5),
            reason: 'avatar ${Color(argb)}');
      }
    });

    test('for arbitrary fills across the hue wheel', () {
      for (var h = 0; h < 360; h += 10) {
        for (final l in const [0.25, 0.4, 0.5, 0.6, 0.75]) {
          final fill = _hsl(h.toDouble(), 0.7, l);
          final badge = legibleOn(fill);
          expect(contrastRatio(badge.foreground, badge.fill),
              greaterThanOrEqualTo(4.5),
              reason: 'fill $fill');
        }
      }
    });

    test('it leaves the fill alone when a label colour already works', () {
      // Amber reads fine with dark text, so James Rivera's avatar keeps its
      // identity colour rather than being darkened into brown.
      const amber = Color(0xFFF59E0B);
      final badge = legibleOn(amber);
      expect(badge.fill, amber);
      expect(badge.foreground, const Color(0xFF1A2133));
    });
  });

  group('the palette tokens themselves clear their floors', () {
    test('control borders reach 3:1 on every surface of their theme', () {
      for (final bg in const [
        CTokens.lightBg,
        CTokens.lightSurface,
        CTokens.lightSurface2
      ]) {
        expect(contrastRatio(CTokens.lightControlBorder, bg),
            greaterThanOrEqualTo(3.0));
        expect(contrastRatio(CTokens.lightInputBorder, bg),
            greaterThanOrEqualTo(3.0));
      }
      for (final bg in const [
        CTokens.darkBg,
        CTokens.darkSurface,
        CTokens.darkSurface2
      ]) {
        expect(contrastRatio(CTokens.darkControlBorder, bg),
            greaterThanOrEqualTo(3.0));
        expect(contrastRatio(CTokens.darkInputBorder, bg),
            greaterThanOrEqualTo(3.0));
      }
    });

    test('body, subtitle and muted text reach 4.5:1 on every surface', () {
      final light = <Color, String>{
        CTokens.lightText: 'lightText',
        CTokens.lightSub: 'lightSub',
        CTokens.lightMuted: 'lightMuted',
      };
      final dark = <Color, String>{
        CTokens.darkText: 'darkText',
        CTokens.darkSub: 'darkSub',
        CTokens.darkMuted: 'darkMuted',
      };
      for (final e in light.entries) {
        for (final bg in const [
          CTokens.lightBg,
          CTokens.lightSurface,
          CTokens.lightSurface2
        ]) {
          expect(contrastRatio(e.key, bg), greaterThanOrEqualTo(4.5),
              reason: '${e.value} on $bg');
        }
      }
      for (final e in dark.entries) {
        for (final bg in const [
          CTokens.darkBg,
          CTokens.darkSurface,
          CTokens.darkSurface2
        ]) {
          expect(contrastRatio(e.key, bg), greaterThanOrEqualTo(4.5),
              reason: '${e.value} on $bg');
        }
      }
    });

    test('white on the primary button reaches 4.5:1 in both themes', () {
      expect(contrastRatio(const Color(0xFFFFFFFF), CTokens.primary),
          greaterThanOrEqualTo(4.5));
      expect(contrastRatio(const Color(0xFFFFFFFF), CTokens.primaryLight),
          greaterThanOrEqualTo(4.5));
    });
  });
}
