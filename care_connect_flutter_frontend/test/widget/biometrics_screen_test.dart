import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/biometrics_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('BiometricsScreen — content', () {
    testWidgets('renders heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      expect(find.text('Sign in with your face?'), findsOneWidget);
    });

    testWidgets('renders no-password subtitle', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      expect(find.textContaining('No password, no keyboard'), findsOneWidget);
    });

    testWidgets('renders privacy disclaimer', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      expect(find.textContaining('never sent anywhere'), findsOneWidget);
    });

    testWidgets('renders Yes, use Face ID button', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      expect(find.text('Yes, use Face ID'), findsOneWidget);
    });

    testWidgets('renders No, use my password button', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      expect(find.text('No, use my password'), findsOneWidget);
    });

    testWidgets('renders 👤 in status ring', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      expect(find.text('👤'), findsOneWidget);
    });

    testWidgets('renders logo pill emoji', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      expect(find.text('💊'), findsOneWidget);
    });
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  group('BiometricsScreen — navigation', () {
    testWidgets('Yes, use Face ID navigates to /sign-in-bio', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      final btn = find.text('Yes, use Face ID');
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pumpAndSettle();
      expect(find.text('stub:sign-in-bio'), findsOneWidget);
    });

    testWidgets('No, use my password navigates to /sign-in-pass', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen()));
      final btn = find.text('No, use my password');
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pumpAndSettle();
      expect(find.text('stub:sign-in-pass'), findsOneWidget);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('BiometricsScreen — theming', () {
    testWidgets('Scaffold bg is dark in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen(), isDark: true));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.dark.bg);
    });

    testWidgets('Scaffold bg is light in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen(), isDark: false));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });

    testWidgets('shows ☀️ in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen(), isDark: true));
      expect(find.text('☀️'), findsOneWidget);
    });

    testWidgets('shows 🌙 in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen(), isDark: false));
      expect(find.text('🌙'), findsOneWidget);
    });

    testWidgets('tapping toggle fires ThemeNotifier', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen(), themeNotifier: notifier));
      await tester.tap(find.text('☀️'));
      expect(notifier.isDark, isFalse);
    });

    testWidgets('Scaffold bg updates after setDark(false)', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const BiometricsScreen(), themeNotifier: notifier));
      notifier.setDark(false);
      await tester.pumpAndSettle();
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });
  });
}
