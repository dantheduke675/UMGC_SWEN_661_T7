// All group() calls MUST be inside main(). Top-level group() calls are a
// Dart compile error in the test runner.
import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
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

    // AuthField used to be a `Text` inside a `Container` — a picture of an
    // input. It is now a real TextFormField, so a filled value lives in an
    // EditableText rather than a Text.
    testWidgets('filled value text uses scheme.text colour in dark mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Name', value: 'Jo', filled: true)));
      final field = tester.widget<EditableText>(find.text('Jo'));
      expect(field.style.color, CScheme.dark.text);
    });

    testWidgets('unfilled value text uses scheme.muted colour in dark mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Name', value: 'placeholder')));
      final text = tester.widget<Text>(find.text('placeholder'));
      expect(text.style?.color, CScheme.dark.muted);
    });

    testWidgets('filled value uses light scheme.text in light mode', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'X', value: 'val', filled: true), isDark: false));
      final field = tester.widget<EditableText>(find.text('val'));
      expect(field.style.color, CScheme.light.text);
    });

    // ── Accessibility (WCAG 2.1 SC 1.3.1, 3.3.2, 4.1.2) ──────────────────────

    testWidgets('is a real, editable text field — not a styled Text', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Email', value: '')));
      expect(find.byType(TextField), findsOneWidget);
    });

    testWidgets('accepts typed input', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Email', value: '')));
      await tester.enterText(find.byType(TextField), 'typed@test.com');
      await tester.pump();
      expect(find.text('typed@test.com'), findsOneWidget);
    });

    testWidgets('is keyboard focusable', (tester) async {
      await tester.pumpWidget(wrap(const AuthField(label: 'Email', value: '')));
      final node = tester.widget<EditableText>(find.byType(EditableText)).focusNode;
      expect(node.canRequestFocus, isTrue);
      node.requestFocus();
      await tester.pump();
      expect(node.hasFocus, isTrue);
    });

    testWidgets('label is exposed to assistive tech as the field name', (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(wrap(const AuthField(label: 'Email address', value: '')));
      expect(
        tester.getSemantics(find.byType(EditableText)),
        matchesSemantics(
          label: 'Email address',
          isTextField: true,
          isEnabled: true,
          isFocusable: true,
          hasEnabledState: true,
          hasTapAction: true,
          hasFocusAction: true,
          validationResult: SemanticsValidationResult.valid,
        ),
      );
      handle.dispose();
    });

    testWidgets('obscure field hides its contents', (tester) async {
      await tester.pumpWidget(wrap(
        const AuthField(label: 'Password', value: 'hunter2', filled: true, obscure: true),
      ));
      expect(tester.widget<EditableText>(find.byType(EditableText)).obscureText, isTrue);
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

    // The label used to be painted in exactly the chip's own colour, on a 13%
    // tint of that same colour — as low as 1.77:1 for amber. It is now derived
    // from the composited tint, so the assertion is the contrast guarantee.
    testWidgets('label colour clears 4.5:1 against the tinted chip', (tester) async {
      for (final col in const [
        Color(0xFF357C6F), Color(0xFFF59E0B), Color(0xFF22C55E),
        Color(0xFFEF4444), Color(0xFF6366F1), Color(0xFF684BE6),
      ]) {
        for (final isDark in const [true, false]) {
          await tester.pumpWidget(wrap(CChip(label: 'Pain', color: col), isDark: isDark));
          final surface = isDark ? CScheme.dark.surface : CScheme.light.surface;
          final labelColor = tester.widget<Text>(find.text('Pain')).style!.color!;
          final pill = compositeOver(col.withValues(alpha: 0.13), surface);
          expect(
            contrastRatio(labelColor, pill),
            greaterThanOrEqualTo(4.5),
            reason: 'chip $col in ${isDark ? 'dark' : 'light'} mode',
          );
        }
      }
    });

    testWidgets('keeps the designed colour when it already passes', (tester) async {
      // Amber on a dark chip was already 5.67:1, so it must not be shifted.
      const amber = Color(0xFFF59E0B);
      await tester.pumpWidget(wrap(const CChip(label: 'Pending', color: amber), isDark: true));
      expect(tester.widget<Text>(find.text('Pending')).style?.color, amber);
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

    // The badge used to paint the contact's colour verbatim with white
    // initials on top, which measured 2.15:1 on the amber contact. The fill is
    // now only adjusted when neither white nor near-black can read on it, so
    // the assertion is the contrast guarantee plus "stay as close to the
    // given colour as legibility allows".
    testWidgets('initials stay legible on every contact colour', (tester) async {
      for (final col in const [
        Color(0xFF6366F1), // Aunt Joyce — indigo
        Color(0xFF357C6F), // Dr. Chen — teal
        Color(0xFFF59E0B), // James Rivera — amber
      ]) {
        await tester.pumpWidget(wrap(CAvatarBadge(initials: 'AJ', color: col)));
        final container = tester.widget<Container>(
          find.descendant(of: find.byType(CAvatarBadge), matching: find.byType(Container)).first,
        );
        final fill = (container.decoration as BoxDecoration).color!;
        final initials = tester.widget<Text>(find.text('AJ')).style!.color!;
        expect(contrastRatio(initials, fill), greaterThanOrEqualTo(4.5),
            reason: 'initials on $col');
      }
    });

    testWidgets('keeps the contact colour when a label colour already works',
        (tester) async {
      // Amber reads fine with dark initials, so the identity colour survives.
      const amber = Color(0xFFF59E0B);
      await tester.pumpWidget(wrap(const CAvatarBadge(initials: 'JR', color: amber)));
      final container = tester.widget<Container>(
        find.descendant(of: find.byType(CAvatarBadge), matching: find.byType(Container)).first,
      );
      expect((container.decoration as BoxDecoration).color, amber);
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
