import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/account_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('AccountScreen — content', () {
    testWidgets('renders Account heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Account'), findsOneWidget);
    });

    testWidgets('renders patient full name', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Madison Hughes'), findsOneWidget);
    });

    testWidgets('renders patient initials in avatar', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('MH'), findsOneWidget);
    });

    testWidgets('renders patient email', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('maddy@example.com'), findsOneWidget);
    });

    testWidgets('renders Care recipient role badge', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Care recipient'), findsOneWidget);
    });

    testWidgets('renders Care team section header', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Care team'), findsOneWidget);
    });

    testWidgets('renders Aunt Joyce in care team', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Aunt Joyce'), findsOneWidget);
    });

    testWidgets('renders Dr. Sarah Chen in care team', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Dr. Sarah Chen'), findsOneWidget);
    });

    testWidgets('renders James Rivera in care team', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('James Rivera'), findsOneWidget);
    });

    testWidgets('renders Preferences section', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Preferences'), findsOneWidget);
    });

    testWidgets('renders Appearance preference tile', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      expect(find.text('Appearance'), findsOneWidget);
    });

    testWidgets('renders Sign out button', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      final btn = find.text('Sign out');
      await tester.ensureVisible(btn);
      expect(btn, findsOneWidget);
    });
  });

  // ── Interaction ───────────────────────────────────────────────────────────────

  group('AccountScreen — interaction', () {
    // The Appearance row's leading icon AND the inline _ThemeSwitch thumb
    // both render the mode emoji, so two matches are expected — the switch
    // (the interactive one) is the last widget in tree order.
    testWidgets('dark mode shows moon emoji on theme toggle', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen(), isDark: true));
      expect(find.text('🌙'), findsNWidgets(2));
    });

    testWidgets('light mode shows sun emoji on theme toggle', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen(), isDark: false));
      expect(find.text('☀️'), findsNWidgets(2));
    });

    testWidgets('tapping theme toggle changes notifier from dark to light', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const AccountScreen(), themeNotifier: notifier));
      await tester.tap(find.text('🌙').last);
      expect(notifier.isDark, isFalse);
    });

    testWidgets('tapping theme toggle changes notifier from light to dark', (tester) async {
      final notifier = ThemeNotifier(isDark: false);
      await pumpScreen(tester, buildTestApp(child: const AccountScreen(), themeNotifier: notifier));
      await tester.tap(find.text('☀️').last);
      expect(notifier.isDark, isTrue);
    });

    testWidgets('Sign out navigates to /landing', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      final btn = find.text('Sign out');
      await tester.ensureVisible(btn);
      await tester.tap(btn);
      await tester.pumpAndSettle();
      expect(find.text('stub:landing'), findsOneWidget);
    });

    testWidgets('message button on care team tile is present', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      // Each care team tile has a 💬 message button
      expect(find.text('💬'), findsWidgets);
    });

    testWidgets('tapping message button navigates to /messages', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen()));
      await tester.tap(find.text('💬').first);
      await tester.pumpAndSettle();
      expect(find.text('stub:messages'), findsOneWidget);
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('AccountScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen(), isDark: true));
      expect(find.text('Account'), findsOneWidget);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const AccountScreen(), isDark: false));
      expect(find.text('Account'), findsOneWidget);
    });

    testWidgets('notifier updates screen when theme changes', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const AccountScreen(), themeNotifier: notifier));
      notifier.setDark(false);
      await tester.pumpAndSettle();
      expect(find.text('Account'), findsOneWidget);
    });
  });
}
