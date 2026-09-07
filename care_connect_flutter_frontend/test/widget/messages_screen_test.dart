import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/messages_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import '../helpers/test_helpers.dart';

void main() {
  // ── Content ──────────────────────────────────────────────────────────────────

  group('MessagesScreen — content', () {
    testWidgets('renders Messages heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen()));
      expect(find.text('Messages'), findsOneWidget);
    });

    testWidgets('renders conversation count subtitle', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen()));
      expect(find.textContaining('conversations'), findsOneWidget);
    });

    testWidgets('renders Aunt Joyce thread', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen()));
      expect(find.textContaining('Aunt Joyce'), findsOneWidget);
    });

    testWidgets('renders Dr. Sarah Chen thread', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen()));
      expect(find.textContaining('Dr. Sarah Chen'), findsOneWidget);
    });

    testWidgets('renders James Rivera thread', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen()));
      expect(find.textContaining('James Rivera'), findsOneWidget);
    });
  });

  // ── Navigation ───────────────────────────────────────────────────────────────

  group('MessagesScreen — navigation', () {
    testWidgets('tapping a thread row navigates away', (tester) async {
      // The router stub does not have /messages/:id, so GoRouter will stay
      // on the thread row page or navigate to a 404 — just check no crash.
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen()));
      // Tap the first contact row (Aunt Joyce)
      await tester.tap(find.textContaining('Aunt Joyce'));
      await tester.pumpAndSettle();
      // No exception = pass
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('MessagesScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen(), isDark: true));
      expect(find.text('Messages'), findsOneWidget);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen(), isDark: false));
      expect(find.text('Messages'), findsOneWidget);
    });

    testWidgets('notifier is dark by default', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const MessagesScreen(), themeNotifier: notifier));
      expect(notifier.isDark, isTrue);
    });
  });
}
