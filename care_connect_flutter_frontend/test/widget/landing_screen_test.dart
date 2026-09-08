import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/landing_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {

  group('LandingScreen — content', () {
    //makes sure that the application renders its various widgets and components
    testWidgets('renders app name', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen()));
      expect(find.text('CareConnect'), findsOneWidget);
    });

    testWidgets('renders tagline', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen()));
      expect(find.textContaining('caregiver sets reminders'), findsOneWidget);
    });

    testWidgets('renders Create account button', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen()));
      expect(find.text('Create account'), findsOneWidget);
    });

    testWidgets('renders Sign in button', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen()));
      expect(find.text('Sign in'), findsOneWidget);
    });

    //tests to make sure the widgets renders and logos work in the various different modes 
    testWidgets('renders pill emoji in logo', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen()));
      expect(find.text('💊'), findsOneWidget);
    });

    testWidgets('shows ☀️ toggle in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen(), isDark: true));
      expect(find.text('☀️'), findsOneWidget);
    });

    testWidgets('shows 🌙 toggle in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen(), isDark: false));
      expect(find.text('🌙'), findsOneWidget);
    });
  });

  group('LandingScreen — navigation', () {
    testWidgets('Create account button navigates to /create-account', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen()));
      await tester.tap(find.text('Create account'));
      await tester.pumpAndSettle();
      expect(find.text('stub:create-account'), findsOneWidget);
    });

    testWidgets('Sign in button navigates to /sign-in-pass', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen()));
      await tester.tap(find.text('Sign in'));
      await tester.pumpAndSettle();
      expect(find.text('stub:sign-in-pass'), findsOneWidget);
    });
  });

  //this section of tests tests the themeing of the appication and the light vs dark mode 
  group('LandingScreen — theming', () {
    testWidgets('Scaffold background is dark bg in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen(), isDark: true));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.dark.bg);
    });

    testWidgets('Scaffold background is light bg in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const LandingScreen(), isDark: false));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });

    testWidgets('tapping theme toggle switches dark → light', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const LandingScreen(), themeNotifier: notifier));
      await tester.tap(find.text('☀️'));
      expect(notifier.isDark, isFalse);
    });

    testWidgets('tapping theme toggle switches light → dark', (tester) async {
      final notifier = ThemeNotifier(isDark: false);
      await pumpScreen(tester, buildTestApp(child: const LandingScreen(), themeNotifier: notifier));
      await tester.tap(find.text('🌙'));
      expect(notifier.isDark, isTrue);
    });

    testWidgets('Scaffold reflects light bg after toggle', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const LandingScreen(), themeNotifier: notifier));
      notifier.setDark(false);
      await tester.pumpAndSettle();
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });
  });
}
