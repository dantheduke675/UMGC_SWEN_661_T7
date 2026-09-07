import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/create_account_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('CreateAccountScreen — content', () {
    testWidgets('renders page heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('Create your account'), findsOneWidget);
    });

    testWidgets('renders Full name label', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('Full name'), findsOneWidget);
    });

    testWidgets('renders prefilled name value', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('Maddy Chen'), findsOneWidget);
    });

    testWidgets('renders Email address label', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('Email address'), findsOneWidget);
    });

    testWidgets('renders prefilled email value', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('maddy@example.com'), findsOneWidget);
    });

    testWidgets('renders Password label', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('Password'), findsOneWidget);
    });

    testWidgets('renders password helper text', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('At least 8 characters.'), findsOneWidget);
    });

    testWidgets('renders I AM A… label', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('I AM A…'), findsOneWidget);
    });

    testWidgets('renders Care recipient tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('🙂  Care recipient'), findsOneWidget);
    });

    testWidgets('renders Caregiver tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('👤  Caregiver'), findsOneWidget);
    });

    testWidgets('renders Back button', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      expect(find.text('← Back'), findsOneWidget);
    });
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  group('CreateAccountScreen — navigation', () {
    testWidgets('Back navigates to /landing', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      await tester.tap(find.text('← Back'));
      await tester.pumpAndSettle();
      expect(find.text('stub:landing'), findsOneWidget);
    });

    testWidgets('Care recipient tile navigates to /biometrics', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen()));
      final tile = find.text('🙂  Care recipient');
      await tester.ensureVisible(tile);
      await tester.tap(tile);
      await tester.pumpAndSettle();
      expect(find.text('stub:biometrics'), findsOneWidget);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('CreateAccountScreen — theming', () {
    testWidgets('shows ☀️ toggle in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen(), isDark: true));
      expect(find.text('☀️'), findsOneWidget);
    });

    testWidgets('shows 🌙 toggle in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen(), isDark: false));
      expect(find.text('🌙'), findsOneWidget);
    });

    testWidgets('Scaffold background is dark bg in dark mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen(), isDark: true));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.dark.bg);
    });

    testWidgets('Scaffold background is light bg in light mode', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen(), isDark: false));
      final scaffold = tester.widget<Scaffold>(find.byType(Scaffold).first);
      expect(scaffold.backgroundColor, CScheme.light.bg);
    });

    testWidgets('tapping toggle fires ThemeNotifier', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const CreateAccountScreen(), themeNotifier: notifier));
      await tester.tap(find.text('☀️'));
      expect(notifier.isDark, isFalse);
    });
  });
}
