import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/sign_in_pass_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('SignInPassScreen — content', () {
    testWidgets('renders Sign in heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      // The heading Text and button Text both say 'Sign in'; at least one found
      expect(find.text('Sign in'), findsAtLeastNWidgets(1));
    });

    testWidgets('renders Email address label', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.text('Email address'), findsOneWidget);
    });

    testWidgets('renders email privacy helper', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.text('We will never share this.'), findsOneWidget);
    });

    testWidgets('renders prefilled email value', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.text('maddy@example.com'), findsOneWidget);
    });

    testWidgets('renders Password label', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('renders password manager helper', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.textContaining('password manager'), findsOneWidget);
    });

    testWidgets('renders masked password value', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.text('••••••••'), findsOneWidget);
    });

    testWidgets('renders Use Face ID instead link', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.text('Use Face ID instead'), findsOneWidget);
    });

    testWidgets('renders Back button', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      expect(find.text('← Back'), findsOneWidget);
    });
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  group('SignInPassScreen — navigation', () {
    testWidgets('Back button navigates to /landing', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      await tester.tap(find.text('← Back'));
      await tester.pumpAndSettle();
      expect(find.text('stub:landing'), findsOneWidget);
    });

    testWidgets('primary Sign in ElevatedButton navigates to /today', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      final btn = find.widgetWithText(ElevatedButton, 'Sign in');
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pumpAndSettle();
      expect(find.text('stub:today'), findsOneWidget);
    });

    testWidgets('Use Face ID instead is not yet wired to navigation', (tester) async {
      // AuthBtn(onPressed: null) — this link has no navigation assigned yet
      // (see the TODO comment in sign_in_pass_screen.dart), so tapping it
      // is a no-op and the screen stays put.
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen()));
      final btn = find.text('Use Face ID instead');
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pumpAndSettle();
      expect(find.text('Use Face ID instead'), findsOneWidget);
      expect(find.text('stub:sign-in-bio'), findsNothing);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('SignInPassScreen — theming', () {
    testWidgets('Scaffold bg is dark in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen(), isDark: true));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.dark.bg);
    });

    testWidgets('Scaffold bg is light in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen(), isDark: false));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });

    testWidgets('shows ☀️ toggle in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen(), isDark: true));
      expect(find.text('☀️'), findsOneWidget);
    });

    testWidgets('shows 🌙 toggle in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen(), isDark: false));
      expect(find.text('🌙'), findsOneWidget);
    });

    testWidgets('tapping toggle fires ThemeNotifier', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen(), themeNotifier: notifier));
      await tester.tap(find.text('☀️'));
      expect(notifier.isDark, isFalse);
    });

    testWidgets('Scaffold bg updates when notifier changes', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const SignInPassScreen(), themeNotifier: notifier));
      notifier.setDark(false);
      await tester.pumpAndSettle();
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });
  });
}
