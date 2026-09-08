// All group() calls MUST be inside main(). Top-level group() calls are a
// Dart compile error in the test runner.
import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

/// Minimal wrapper — no GoRouter needed for isolated widget tests.
Widget wrap(Widget child, {bool isDark = true, ThemeNotifier? notifier}) {
  final n = notifier ?? ThemeNotifier(isDark: isDark);
  return ChangeNotifierProvider<ThemeNotifier>.value(
    value: n,
    child: MaterialApp(
      theme: buildTheme(false),
      darkTheme: buildTheme(true),
      themeMode: n.isDark ? ThemeMode.dark : ThemeMode.light,
      home: Scaffold(
        // SizedBox constrains infinite-width widgets so they can be measured
        body: SizedBox(width: 375, child: Center(child: child)),
      ),
    ),
  );
}

void main() {
  // ── AuthLogo ────────────────────────────────────────────────────────────────

  group('AuthLogo', () {
    testWidgets('renders pill emoji', (tester) async {
      await tester.pumpWidget(wrap(const AuthLogo()));
      expect(find.text('💊'), findsOneWidget);
    });

    testWidgets('is sized 96×96', (tester) async {
      await tester.pumpWidget(wrap(const AuthLogo()));
      final size = tester.getSize(find.byType(AuthLogo));
      expect(size.width,  96.0);
      expect(size.height, 96.0);
    });

    testWidgets('background uses dark primary in dark mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthLogo(), isDark: true));
      final container = tester.widget<Container>(
        find.descendant(of: find.byType(AuthLogo), matching: find.byType(Container)).first,
      );
      expect((container.decoration as BoxDecoration).color, CScheme.dark.primary);
    });

    testWidgets('background uses light primary in light mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthLogo(), isDark: false));
      final container = tester.widget<Container>(
        find.descendant(of: find.byType(AuthLogo), matching: find.byType(Container)).first,
      );
      expect((container.decoration as BoxDecoration).color, CScheme.light.primary);
    });
  });

  // ── AuthLogoSmall ────────────────────────────────────────────────────────────

  group('AuthLogoSmall', () {
    testWidgets('renders pill emoji', (tester) async {
      await tester.pumpWidget(wrap(const AuthLogoSmall()));
      expect(find.text('💊'), findsOneWidget);
    });

    testWidgets('phone height is 72', (tester) async {
      await tester.pumpWidget(wrap(const AuthLogoSmall(lg: false)));
      final size = tester.getSize(find.byType(AuthLogoSmall));
      expect(size.height, 72.0);
    });

    testWidgets('tablet height is 80', (tester) async {
      await tester.pumpWidget(wrap(const AuthLogoSmall(lg: true)));
      final size = tester.getSize(find.byType(AuthLogoSmall));
      expect(size.height, 80.0);
    });
  });

  // ── AuthBtn ──────────────────────────────────────────────────────────────────
  //this series of tests test the general widgets and ensures they work correctly in this case buttons
  group('AuthBtn — primary variant', () {
    testWidgets('renders label text', (tester) async {
      await tester.pumpWidget(wrap(AuthBtn(label: 'Continue', onPressed: () {})));
      expect(find.text('Continue'), findsOneWidget);
    });

    testWidgets('renders as ElevatedButton', (tester) async {
      await tester.pumpWidget(wrap(AuthBtn(label: 'Go', onPressed: () {})));
      expect(find.byType(ElevatedButton), findsOneWidget);
    });

    testWidgets('phone height is 64', (tester) async {
      await tester.pumpWidget(wrap(AuthBtn(label: 'Go', lg: false, onPressed: () {})));
      expect(tester.getSize(find.byType(ElevatedButton)).height, 64.0);
    });

    testWidgets('tablet height is 80', (tester) async {
      await tester.pumpWidget(wrap(AuthBtn(label: 'Go', lg: true, onPressed: () {})));
      expect(tester.getSize(find.byType(ElevatedButton)).height, 80.0);
    });

    testWidgets('onPressed fires on tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(wrap(AuthBtn(label: 'Go', onPressed: () => tapped = true)));
      await tester.tap(find.text('Go'));
      expect(tapped, isTrue);
    });
  });

  group('AuthBtn — secondary variant', () {
    testWidgets('renders as OutlinedButton', (tester) async {
      await tester.pumpWidget(wrap(AuthBtn(label: 'Back', variant: 'secondary', onPressed: () {})));
      expect(find.byType(OutlinedButton), findsOneWidget);
    });

    testWidgets('onPressed fires on tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(wrap(
        AuthBtn(label: 'Skip', variant: 'secondary', onPressed: () => tapped = true),
      ));
      await tester.tap(find.text('Skip'));
      expect(tapped, isTrue);
    });
  });

  group('AuthBtn — text variant', () {
    testWidgets('renders as TextButton', (tester) async {
      await tester.pumpWidget(wrap(AuthBtn(label: '← Back', variant: 'text', onPressed: () {})));
      expect(find.byType(TextButton), findsOneWidget);
    });

    testWidgets('onPressed fires on tap', (tester) async {
      var tapped = false;
      await tester.pumpWidget(wrap(
        AuthBtn(label: '← Back', variant: 'text', onPressed: () => tapped = true),
      ));
      await tester.tap(find.text('← Back'));
      expect(tapped, isTrue);
    });
  });

  // ── AuthField ────────────────────────────────────────────────────────────────
  //this series of tests test the general widgets and ensures they work correctly in this case textfields
  group('AuthField', () {
    testWidgets('renders label', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Email', value: '')));
      expect(find.text('Email'), findsOneWidget);
    });

    testWidgets('renders value', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Email', value: 'user@test.com', filled: true)));
      expect(find.text('user@test.com'), findsOneWidget);
    });

    testWidgets('renders helper text when supplied', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Pw', value: '', helper: 'Min 8 chars')));
      expect(find.text('Min 8 chars'), findsOneWidget);
    });

    testWidgets('no helper rendered when omitted', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Name', value: 'Jo')));
      expect(find.text('Min 8 chars'), findsNothing);
    });

    testWidgets('filled value text uses scheme.text colour in dark mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Name', value: 'Jo', filled: true)));
      final text = tester.widget<Text>(find.text('Jo'));
      expect(text.style?.color, CScheme.dark.text);
    });

    testWidgets('unfilled value text uses scheme.muted colour in dark mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Name', value: 'placeholder')));
      final text = tester.widget<Text>(find.text('placeholder'));
      expect(text.style?.color, CScheme.dark.muted);
    });

    testWidgets('filled value uses light scheme.text in light mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'X', value: 'val', filled: true), isDark: false));
      final text = tester.widget<Text>(find.text('val'));
      expect(text.style?.color, CScheme.light.text);
    });
  });

  // ── AuthStatusRing ────────────────────────────────────────────────────────────
 //this series of tests test the general widgets and ensures they work correctly in this case the animation rings
  group('AuthStatusRing', () {
    testWidgets('renders 👤 emoji', (tester) async {
      await tester.pumpWidget(wrap(const AuthStatusRing()));
      expect(find.text('👤'), findsOneWidget);
    });

    testWidgets('is 150×150', (tester) async {
      await tester.pumpWidget(wrap(const AuthStatusRing()));
      final size = tester.getSize(find.byType(AuthStatusRing));
      expect(size.width,  150.0);
      expect(size.height, 150.0);
    });

    testWidgets('outer container is circular', (tester) async {
      await tester.pumpWidget(wrap(const AuthStatusRing()));
      final container = tester.widget<Container>(
        find.descendant(of: find.byType(AuthStatusRing), matching: find.byType(Container)).first,
      );
      final deco = container.decoration as BoxDecoration;
      expect(deco.shape, BoxShape.circle);
    });

    testWidgets('ring border colour is scheme.primary in dark mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthStatusRing(), isDark: true));
      final container = tester.widget<Container>(
        find.descendant(of: find.byType(AuthStatusRing), matching: find.byType(Container)).first,
      );
      final deco = container.decoration as BoxDecoration;
      final border = deco.border! as Border;
      expect(border.top.color, CScheme.dark.primary);
    });
  });

  // ── AuthSpinner ──────────────────────────────────────────────────────────────

  group('AuthSpinner', () {
    // Do NOT call pumpAndSettle — AuthSpinner runs an infinite animation
    testWidgets('renders label text', (tester) async {
      await tester.pumpWidget(wrap(const AuthSpinner(label: 'Loading…')));
      await tester.pump(); // one frame — content visible, animation not settled
      expect(find.text('Loading…'), findsOneWidget);
    });

    testWidgets('renders a CircularProgressIndicator', (tester) async {
      await tester.pumpWidget(wrap(const AuthSpinner(label: 'Loading…')));
      await tester.pump();
      expect(find.byType(CircularProgressIndicator), findsOneWidget);
    });

    testWidgets('renders a RotationTransition', (tester) async {
      await tester.pumpWidget(wrap(const AuthSpinner(label: 'Test')));
      await tester.pump();
      // CircularProgressIndicator also uses RotationTransition internally
      expect(find.byType(RotationTransition), findsAtLeastNWidgets(1));
    });
  });

  // ── AuthRoleTile ─────────────────────────────────────────────────────────────

  group('AuthRoleTile', () {
    testWidgets('recipient renders correct label', (tester) async {
      await tester.pumpWidget(wrap(const AuthRoleTile(role: 'recipient')));
      expect(find.text('🙂  Care recipient'), findsOneWidget);
    });

    testWidgets('caregiver renders correct label', (tester) async {
      await tester.pumpWidget(wrap(const AuthRoleTile(role: 'caregiver')));
      expect(find.text('👤  Caregiver'), findsOneWidget);
    });

    testWidgets('recipient fires onPressed', (tester) async {
      var pressed = false;
      await tester.pumpWidget(wrap(AuthRoleTile(role: 'recipient', onPressed: () => pressed = true)));
      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, isTrue);
    });

    testWidgets('caregiver fires onPressed', (tester) async {
      var pressed = false;
      await tester.pumpWidget(wrap(AuthRoleTile(role: 'caregiver', onPressed: () => pressed = true)));
      await tester.tap(find.byType(ElevatedButton));
      expect(pressed, isTrue);
    });

    testWidgets('phone height is 88', (tester) async {
      await tester.pumpWidget(wrap(const AuthRoleTile(role: 'recipient', lg: false)));
      expect(tester.getSize(find.byType(ElevatedButton)).height, 88.0);
    });

    testWidgets('tablet height is 80', (tester) async {
      await tester.pumpWidget(wrap(const AuthRoleTile(role: 'recipient', lg: true)));
      expect(tester.getSize(find.byType(ElevatedButton)).height, 80.0);
    });
  });

  // ── CChip ─────────────────────────────────────────────────────────────────────

  group('CChip', () {
    testWidgets('renders label', (tester) async {
      await tester.pumpWidget(wrap(const CChip(label: 'Pain', color: Color(0xFF357C6F))));
      expect(find.text('Pain'), findsOneWidget);
    });

    testWidgets('label text colour matches the given colour', (tester) async {
      const col = Color(0xFF357C6F);
      await tester.pumpWidget(wrap(const CChip(label: 'Pain', color: col)));
      final text = tester.widget<Text>(find.text('Pain'));
      expect(text.style?.color, col);
    });
  });

  // ── CAvatarBadge ──────────────────────────────────────────────────────────────

  group('CAvatarBadge', () {
    testWidgets('renders initials', (tester) async {
      await tester.pumpWidget(wrap(const CAvatarBadge(initials: 'MH', color: Color(0xFF357C6F))));
      expect(find.text('MH'), findsOneWidget);
    });

    testWidgets('default size is 40×40', (tester) async {
      await tester.pumpWidget(wrap(const CAvatarBadge(initials: 'MH', color: Color(0xFF357C6F))));
      final size = tester.getSize(find.byType(CAvatarBadge));
      expect(size.width,  40.0);
      expect(size.height, 40.0);
    });

    testWidgets('respects custom size', (tester) async {
      await tester.pumpWidget(wrap(const CAvatarBadge(initials: 'MH', color: Color(0xFF357C6F), size: 64)));
      final size = tester.getSize(find.byType(CAvatarBadge));
      expect(size.width,  64.0);
      expect(size.height, 64.0);
    });

    testWidgets('background colour matches given colour', (tester) async {
      const col = Color(0xFF6366F1);
      await tester.pumpWidget(wrap(const CAvatarBadge(initials: 'AJ', color: col)));
      final container = tester.widget<Container>(
        find.descendant(of: find.byType(CAvatarBadge), matching: find.byType(Container)).first,
      );
      expect((container.decoration as BoxDecoration).color, col);
    });
  });

  // ── CSeverityBar ──────────────────────────────────────────────────────────────

  group('CSeverityBar', () {
    testWidgets('renders 5 segments', (tester) async {
      await tester.pumpWidget(wrap(const CSeverityBar(level: 3)));
      // Each segment is a Container inside a Row; find all children of the Row
      expect(
        tester.widgetList(
          find.descendant(of: find.byType(CSeverityBar), matching: find.byType(Container)),
        ).length,
        5,
      );
    });
  });

  // ── ThemeToggleBtn ────────────────────────────────────────────────────────────

  group('ThemeToggleBtn', () {
    testWidgets('shows ☀️ in dark mode', (tester) async {
      await tester.pumpWidget(
        wrap(const Stack(children: [ThemeToggleBtn()]), isDark: true),
      );
      expect(find.text('☀️'), findsOneWidget);
    });

    testWidgets('shows 🌙 in light mode', (tester) async {
      await tester.pumpWidget(
        wrap(const Stack(children: [ThemeToggleBtn()]), isDark: false),
      );
      expect(find.text('🌙'), findsOneWidget);
    });

    testWidgets('tap toggles notifier from dark to light', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await tester.pumpWidget(
        wrap(const Stack(children: [ThemeToggleBtn()]), notifier: notifier),
      );
      await tester.tap(find.text('☀️'));
      expect(notifier.isDark, isFalse);
    });

    testWidgets('tap toggles notifier from light to dark', (tester) async {
      final notifier = ThemeNotifier(isDark: false);
      await tester.pumpWidget(
        wrap(const Stack(children: [ThemeToggleBtn()]), notifier: notifier),
      );
      await tester.tap(find.text('🌙'));
      expect(notifier.isDark, isTrue);
    });
  });
}
