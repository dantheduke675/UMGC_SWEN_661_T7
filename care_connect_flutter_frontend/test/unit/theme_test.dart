import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {
  //this is a series of unit tests testing the theme of the website specific values and how they respond to
  //certain situations essentially test the theme.dart
  //while also testing the light vs darkmode
  group('CTokens — dark palette', () {
    test('darkBg matches Figma dark background token', () {
      expect(CTokens.darkBg, const Color(0xFF0E131D));
    });

    test('darkSurface matches Figma surface token', () {
      expect(CTokens.darkSurface, const Color(0xFF1D2534));
    });

    test('darkSurface2 matches Figma inner surface token', () {
      expect(CTokens.darkSurface2, const Color(0xFF141A27));
    });

    test('darkText is near-white (high contrast on dark bg)', () {
      expect(CTokens.darkText, const Color(0xFFF5F7FA));
    });

    test('darkSub is mid-grey subtitle colour', () {
      expect(CTokens.darkSub, const Color(0xFF9EA8BD));
    });
  });

  group('CTokens — light palette', () {
    test('lightBg matches Figma light background token', () {
      expect(CTokens.lightBg, const Color(0xFFF6F7F9));
    });

    test('lightSurface matches Figma light surface token', () {
      expect(CTokens.lightSurface, const Color(0xFFF2F3F5));
    });

    test('lightText is near-black (high contrast on light bg)', () {
      expect(CTokens.lightText, const Color(0xFF1A2133));
    });

    test('lightSub matches Figma subtitle token', () {
      expect(CTokens.lightSub, const Color(0xFF5A6478));
    });

    test('lightInputBorder matches Figma border token', () {
      expect(CTokens.lightInputBorder, const Color(0xFFE0E2E6));
    });
  });

  group('CTokens — brand colours', () {
    test('primary teal differs from light-mode teal', () {
      expect(CTokens.primary, isNot(equals(CTokens.primaryLight)));
    });

    test('danger red is #C53030', () {
      expect(CTokens.danger, const Color(0xFFC53030));
    });

    test('caregiver purple is #684BE6', () {
      expect(CTokens.caregiverPurple, const Color(0xFF684BE6));
    });

    test('planIndigo is #6366F1', () {
      expect(CTokens.planIndigo, const Color(0xFF6366F1));
    });
  });

  group('CScheme.dark fields', () {
    const s = CScheme.dark;

    test('bg is darkBg', ()       => expect(s.bg,      CTokens.darkBg));
    test('surface is darkSurface', () => expect(s.surface, CTokens.darkSurface));
    test('surface2 is darkSurface2', () => expect(s.surface2, CTokens.darkSurface2));
    test('text is darkText', ()   => expect(s.text,    CTokens.darkText));
    test('sub is darkSub', ()     => expect(s.sub,     CTokens.darkSub));
    test('muted is darkMuted', () => expect(s.muted,   CTokens.darkMuted));
    test('link is darkLink', ()   => expect(s.link,    CTokens.darkLink));
    test('primary is standard teal', () => expect(s.primary, CTokens.primary));
    test('inputBorder is darkInputBorder', () => expect(s.inputBorder, CTokens.darkInputBorder));
  });

  group('CScheme.light fields', () {
    const s = CScheme.light;

    test('bg is lightBg', ()       => expect(s.bg,      CTokens.lightBg));
    test('surface is lightSurface', () => expect(s.surface, CTokens.lightSurface));
    test('surface2 is lightSurface2', () => expect(s.surface2, CTokens.lightSurface2));
    test('text is lightText', ()   => expect(s.text,    CTokens.lightText));
    test('sub is lightSub', ()     => expect(s.sub,     CTokens.lightSub));
    test('muted is lightMuted', () => expect(s.muted,   CTokens.lightMuted));
    test('link is lightLink', ()   => expect(s.link,    CTokens.lightLink));
    test('primary is light-mode teal', () => expect(s.primary, CTokens.primaryLight));
    test('inputBorder is lightInputBorder', () => expect(s.inputBorder, CTokens.lightInputBorder));
  });

  group('CScheme equality', () {
    test('CScheme.dark equals itself', () {
      expect(CScheme.dark, equals(CScheme.dark));
    });

    test('CScheme.light equals itself', () {
      expect(CScheme.light, equals(CScheme.light));
    });

    test('dark and light schemes are not equal', () {
      expect(CScheme.dark, isNot(equals(CScheme.light)));
    });
  });

  group('ThemeNotifier — initial state', () {
    test('defaults to dark mode', () {
      expect(ThemeNotifier().isDark, isTrue);
    });

    test('can be initialised in light mode', () {
      expect(ThemeNotifier(isDark: false).isDark, isFalse);
    });

    test('scheme returns dark scheme when isDark', () {
      expect(ThemeNotifier().scheme, equals(CScheme.dark));
    });

    test('scheme returns light scheme when not isDark', () {
      expect(ThemeNotifier(isDark: false).scheme, equals(CScheme.light));
    });
  });

  group('ThemeNotifier — toggle()', () {
    test('toggle switches dark → light', () {
      final n = ThemeNotifier();
      n.toggle();
      expect(n.isDark, isFalse);
    });

    test('toggle switches light → dark', () {
      final n = ThemeNotifier(isDark: false);
      n.toggle();
      expect(n.isDark, isTrue);
    });

    test('double toggle returns to original state', () {
      final n = ThemeNotifier();
      n.toggle();
      n.toggle();
      expect(n.isDark, isTrue);
    });

    test('toggle notifies listeners exactly once per call', () {
      final n = ThemeNotifier();
      var calls = 0;
      n.addListener(() => calls++);
      n.toggle();
      expect(calls, 1);
      n.toggle();
      expect(calls, 2);
    });
  });

  group('ThemeNotifier — setDark()', () {
    test('setDark(true) forces dark mode', () {
      final n = ThemeNotifier(isDark: false);
      n.setDark(true);
      expect(n.isDark, isTrue);
    });

    test('setDark(false) forces light mode', () {
      final n = ThemeNotifier();
      n.setDark(false);
      expect(n.isDark, isFalse);
    });

    test('setDark notifies listeners', () {
      final n = ThemeNotifier();
      var calls = 0;
      n.addListener(() => calls++);
      n.setDark(false);
      expect(calls, 1);
    });

    test('scheme reflects setDark change immediately', () {
      final n = ThemeNotifier();
      n.setDark(false);
      expect(n.scheme, equals(CScheme.light));
    });
  });

  group('buildTheme(true) — dark', () {
    late ThemeData theme;
    setUpAll(() {
      installGoogleFontsNoiseFilter();
      theme = buildTheme(true);
    });
    tearDownAll(restoreGoogleFontsNoiseFilter);

    test('brightness is dark', () => expect(theme.brightness, Brightness.dark));
    test('scaffold bg matches dark token', () => expect(theme.scaffoldBackgroundColor, CTokens.darkBg));
    test('primary colour matches dark scheme primary', () => expect(theme.colorScheme.primary, CScheme.dark.primary));
    test('error colour is danger red', () => expect(theme.colorScheme.error, CTokens.danger));
    test('onPrimary is white', () => expect(theme.colorScheme.onPrimary, Colors.white));
  });

  group('buildTheme(false) — light', () {
    late ThemeData theme;
    setUpAll(() {
      installGoogleFontsNoiseFilter();
      theme = buildTheme(false);
    });
    tearDownAll(restoreGoogleFontsNoiseFilter);

    test('brightness is light', () => expect(theme.brightness, Brightness.light));
    test('scaffold bg matches light token', () => expect(theme.scaffoldBackgroundColor, CTokens.lightBg));
    test('primary colour matches light scheme primary', () => expect(theme.colorScheme.primary, CScheme.light.primary));
    test('error colour is danger red', () => expect(theme.colorScheme.error, CTokens.danger));
    test('onPrimary is white', () => expect(theme.colorScheme.onPrimary, Colors.white));
  });
}
