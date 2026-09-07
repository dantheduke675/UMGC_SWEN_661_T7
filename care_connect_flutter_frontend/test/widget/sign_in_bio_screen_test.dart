import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/sign_in_bio_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

// NOTE: SignInBioScreen contains AuthSpinner which runs an infinite
// AnimationController. All tests use pumpScreenWithAnimation() instead of
// pumpScreen() to avoid the pumpAndSettle() timeout.

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('SignInBioScreen — content', () {
    testWidgets('renders personalised welcome heading', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.text('Welcome back, Maddy'), findsOneWidget);
    });

    testWidgets('renders signing-in subtitle', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.textContaining('nothing to tap'), findsOneWidget);
    });

    testWidgets('renders spinner label', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.text('Looking for your face…'), findsOneWidget);
    });

    testWidgets('renders no-lockout disclaimer', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.textContaining('never locks your account'), findsOneWidget);
    });

    testWidgets('renders Use my password instead button', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.text('Use my password instead'), findsOneWidget);
    });

    testWidgets('renders 👤 in status ring', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.text('👤'), findsOneWidget);
    });

    testWidgets('renders logo pill emoji', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.text('💊'), findsOneWidget);
    });

    testWidgets('CircularProgressIndicator is present for spinner', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  group('SignInBioScreen — navigation', () {
    testWidgets('Use my password instead navigates to /sign-in-pass', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen()));
      final btn = find.text('Use my password instead');
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      // Use pump+settle only after navigation leaves the animated screen
      await tester.pump();
      await tester.pumpAndSettle();
      expect(find.text('stub:sign-in-pass'), findsOneWidget);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('SignInBioScreen — theming', () {
    testWidgets('Scaffold bg is dark in dark mode', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen(), isDark: true));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.dark.bg);
    });

    testWidgets('Scaffold bg is light in light mode', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen(), isDark: false));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });

    testWidgets('shows ☀️ in dark mode', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen(), isDark: true));
      expect(find.text('☀️'), findsOneWidget);
    });

    testWidgets('shows 🌙 in light mode', (tester) async {
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen(), isDark: false));
      expect(find.text('🌙'), findsOneWidget);
    });

    testWidgets('tapping toggle fires ThemeNotifier', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreenWithAnimation(tester, buildTestApp(child: const SignInBioScreen(), themeNotifier: notifier));
      await tester.tap(find.text('☀️'));
      expect(notifier.isDark, isFalse);
    });
  });
}
