// WCAG 2.1 SC 2.1.1 Keyboard (A), SC 2.1.2 No Keyboard Trap (A), SC 2.4.1
// Bypass Blocks (A), SC 2.4.3 Focus Order (A), SC 2.4.5 Multiple Ways (AA),
// SC 2.5.3 Label in Name (A), SC 3.3.1 Error Identification (A) and SC 3.3.3
// Error Suggestion (AA).
//
// keyboard_and_targets_test.dart proves controls *can* take focus. This file
// proves the user can actually get to them: that Tab walks the whole screen
// and comes back round, in reading order, without stalling anywhere — and it
// covers the criteria that are about getting around the app and recovering
// from mistakes.

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:provider/provider.dart';

import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/screens/sign_in_pass_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';

import 'a11y_harness.dart';

// ── Helpers ─────────────────────────────────────────────────────────────────

Future<void> _settle(WidgetTester tester, Screen screen) async {
  if (screen.animated) {
    await tester.pump(const Duration(milliseconds: 400));
  } else {
    await tester.pumpAndSettle();
  }
}

Future<void> _tab(WidgetTester tester, Screen screen, {bool back = false}) async {
  if (back) await tester.sendKeyDownEvent(LogicalKeyboardKey.shift);
  await tester.sendKeyEvent(LogicalKeyboardKey.tab);
  if (back) await tester.sendKeyUpEvent(LogicalKeyboardKey.shift);
  await _settle(tester, screen);
}

/// What a focus stop is, for failure messages and order checks.
String _describe(FocusNode? node) {
  final ctx = node?.context;
  if (ctx == null) return '(nothing)';
  final tappable = ctx.findAncestorWidgetOfExactType<CTappable>();
  if (tappable != null) return tappable.label;
  final field = ctx.findAncestorWidgetOfExactType<TextField>();
  if (field != null) return 'field: ${field.decoration?.labelText}';
  // Not findAncestorWidgetOfExactType: the buttons are its subclasses.
  ButtonStyleButton? button;
  ctx.visitAncestorElements((a) {
    if (a.widget is ButtonStyleButton) button = a.widget as ButtonStyleButton;
    return button == null;
  });
  if (button != null) {
    final texts = <String>[];
    void visit(Element e) {
      final w = e.widget;
      if (w is Text && w.data != null) texts.add(w.data!);
      e.visitChildElements(visit);
    }
    (ctx as Element).visitChildElements(visit);
    return 'button: ${texts.join(' ')}';
  }
  return ctx.widget.runtimeType.toString();
}

/// Presses Tab (or Shift+Tab) until focus comes back to where it started, and
/// returns one lap. Fails if focus ever stalls — the same node twice in a row
/// on a screen with more than one stop is a keyboard trap.
Future<List<FocusNode>> _lap(WidgetTester tester, Screen screen,
    {bool back = false}) async {
  final lap = <FocusNode>[];
  for (var i = 0; i < 120; i++) {
    await _tab(tester, screen, back: back);
    final node = FocusManager.instance.primaryFocus!;
    if (lap.isNotEmpty && identical(node, lap.first)) return lap;
    if (lap.isNotEmpty && identical(node, lap.last)) {
      fail('${screen.name}: focus stuck on "${_describe(node)}"');
    }
    lap.add(node);
  }
  fail('${screen.name}: Tab never came back round to "${_describe(lap.first)}" '
      'after 120 presses');
}

/// Every enabled control in the tree — including those scrolled out of view,
/// which are the ones most likely to be skipped — as the focus node keyboard
/// focus would land on.
Set<FocusNode> _enabledControls(WidgetTester tester) {
  final out = <FocusNode>{};
  Finder below(Widget w, Type t) => find
      .descendant(
          of: find.byWidget(w, skipOffstage: false),
          matching: find.byType(t, skipOffstage: false))
      .first;
  for (final e in find.byType(CTappable, skipOffstage: false).evaluate()) {
    if ((e.widget as CTappable).onTap == null) continue;
    // The InkWell's own DecoratedBox is the first one below the CTappable.
    out.add(Focus.of(tester.element(below(e.widget, DecoratedBox))));
  }
  for (final e in find
      .byWidgetPredicate((w) => w is ButtonStyleButton && w.enabled,
          skipOffstage: false)
      .evaluate()) {
    out.add(Focus.of(tester.element(below(e.widget, Text))));
  }
  for (final e in find.byType(EditableText, skipOffstage: false).evaluate()) {
    out.add((e.widget as EditableText).focusNode);
  }
  return out;
}

/// SC 2.5.3: every word drawn on a control must appear in its accessible name.
///
/// Checked paragraph by paragraph against the nearest control that contains
/// it, ignoring case, punctuation and glyphs — WCAG treats "✓ Taken — tap to
/// undo" and "Taken, tap to undo" as the same label.
///
/// One allowance, and it is reported by name: a short abbreviation drawn on a
/// control is accepted when it abbreviates words of the name — the week
/// strip's "M" for "Monday", an avatar's "AJ" for "Aunt Joyce". Speaking
/// the full word still matches, which is what voice control needs.
List<String> _labelInNameViolations(WidgetTester tester,
    {List<String>? abbreviations}) {
  String norm(String s) => s
      .toLowerCase()
      .replaceAll(decorativeGlyph, ' ')
      .replaceAll(RegExp(r'[^a-z0-9]+'), ' ')
      .trim();

  bool abbreviates(String token, List<String> words) {
    if (token.length > 3) return false;
    if (words.any((w) => w.startsWith(token) && w != token)) return true;
    for (var i = 0; i + token.length <= words.length; i++) {
      final initials = words.sublist(i, i + token.length).map((w) => w[0]).join();
      if (initials == token) return true;
    }
    return false;
  }

  final out = <String>[];
  final seen = <RenderParagraph>{};
  for (final e in find
      .byElementPredicate((e) => e.renderObject is RenderParagraph,
          skipOffstage: false)
      .evaluate()) {
    // A Text and the RichText it builds share one render object.
    if (!seen.add(e.renderObject! as RenderParagraph)) continue;
    // Text inside an inactive control is exempt nowhere in 2.5.3, but text
    // inside a text field is the field's value or label, which the field
    // owns; and text outside any control has no name to match.
    Element? control;
    e.visitAncestorElements((a) {
      final w = a.widget;
      if (w is EditableText || w is InputDecorator) return false;
      if (w is CTappable || w is ButtonStyleButton) {
        control = a;
        return false;
      }
      return true;
    });
    if (control == null) continue;

    final visible = norm((e.renderObject! as RenderParagraph)
        .text
        .toPlainText(includeSemanticsLabels: false));
    if (visible.isEmpty) continue;

    final name = norm(tester
        .getSemantics(find.byWidget(control!.widget, skipOffstage: false))
        .label);
    if (' $name '.contains(' $visible ')) continue;
    // Only a single short token can pass as an abbreviation: words that are
    // all in the name but out of order are still a mismatch.
    final words = name.split(' ');
    if (!visible.contains(' ') && abbreviates(visible, words)) {
      abbreviations?.add('"$visible" for "$name"');
      continue;
    }
    out.add('"$visible" is drawn on a control named "$name"');
  }
  return out;
}

/// Captures announcements posted to the accessibility channel.
List<String> _spyOnAnnouncements(WidgetTester tester) {
  final messages = <String>[];
  tester.binding.defaultBinaryMessenger.setMockDecodedMessageHandler<dynamic>(
    SystemChannels.accessibility,
    (dynamic message) async {
      if (message is Map && message['type'] == 'announce') {
        messages.add((message['data'] as Map)['message'].toString());
      }
      return null;
    },
  );
  addTearDown(() => tester.binding.defaultBinaryMessenger
      .setMockDecodedMessageHandler<dynamic>(SystemChannels.accessibility, null));
  return messages;
}

Screen _screen(String name) => allScreens.firstWhere((s) => s.name == name);

/// Whether focusing [node] changes any pixel on or just around it, compared
/// with the same frame unfocused — same scroll position, so the only
/// difference can be the focus indicator.
Future<bool> _focusIsVisible(WidgetTester tester, FocusNode node) async {
  await Scrollable.ensureVisible(node.context!);
  node.requestFocus();
  await tester.pumpAndSettle();
  final rect = node.rect.inflate(2);
  final focused = await rasterize(tester);
  node.unfocus();
  await tester.pumpAndSettle();
  final unfocused = await rasterize(tester);

  for (var y = rect.top.floor(); y < rect.bottom.ceil(); y++) {
    for (var x = rect.left.floor(); x < rect.right.ceil(); x++) {
      if (focused.at(x, y) != unfocused.at(x, y)) return true;
    }
  }
  return false;
}

void main() {
  setUp(resetAppState);
  tearDown(resetAppState);

  // ── SC 2.1.1 / 2.1.2 ──────────────────────────────────────────────────────
  group('SC 2.1.1 / 2.1.2 — Tab reaches every control and never gets stuck', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: a full lap forwards and backwards',
          (tester) async {
        await pumpScreen(tester, screen);
        final controls = _enabledControls(tester);

        final forward = await _lap(tester, screen);
        final missed = controls.difference(forward.toSet());
        expect(missed.map(_describe), isEmpty,
            reason: '${screen.name}: Tab never reaches these');

        // A second lap must be the same as the first. Before every list was
        // built in full, the doses scrolled off the top had been disposed by
        // the time Tab wrapped round, and the second lap started half-way
        // down the Medications list.
        // Focus is on the first stop now, so the next lap starts one along.
        final again = await _lap(tester, screen);
        expect(again.map(_describe).toList(),
            [...forward.skip(1), forward.first].map(_describe).toList(),
            reason: '${screen.name}: the second lap differs from the first');

        // Shift+Tab visits the same stops, so the user can always back out.
        final backward = await _lap(tester, screen, back: true);
        expect(backward.toSet().map(_describe).toSet(),
            forward.toSet().map(_describe).toSet(),
            reason: '${screen.name}: Shift+Tab does not cover the same stops');

        await disposeScreen(tester);
      });
    }

    testWidgets('Tab leaves the message field rather than being captured by it',
        (tester) async {
      final screen = _screen('Message thread');
      await pumpScreen(tester, screen);
      final field = tester.widget<EditableText>(find.byType(EditableText)).focusNode;
      field.requestFocus();
      await tester.pumpAndSettle();
      await tester.enterText(find.byType(TextField), 'Hello');
      await _tab(tester, screen);
      expect(FocusManager.instance.primaryFocus, isNot(same(field)));
      expect(_describe(FocusManager.instance.primaryFocus), 'Send message');
      await disposeScreen(tester);
    });

    testWidgets('Escape closes the missed-dose dialog and frees focus',
        (tester) async {
      // Inside a modal, Tab deliberately stays in the dialog (SC 2.4.3), so
      // the standard way out must work: Escape, as well as Cancel.
      final screen = _screen('Medications');
      await pumpScreen(tester, screen);
      await tester.tap(find.text('I missed this').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      expect(find.byType(Dialog), findsOneWidget);

      await tester.sendKeyEvent(LogicalKeyboardKey.escape);
      await tester.pumpAndSettle();
      expect(find.byType(Dialog), findsNothing);
      expect(slotStatuses.values, isNot(contains(SlotStatus.missed)));

      // ...and the screen behind is reachable by keyboard again.
      await _tab(tester, screen);
      expect(find.byType(Dialog), findsNothing);
      expect(FocusManager.instance.primaryFocus?.context, isNotNull);
      await disposeScreen(tester);
    });
  });

  // ── SC 2.4.7 ──────────────────────────────────────────────────────────────
  group('SC 2.4.7 — every focus stop is visibly marked', () {
    // keyboard_and_targets_test.dart checks the first stop on Today. This
    // checks every stop on a lap, on the screens that between them use every
    // kind of control the app has: CTappable, Material buttons, text fields.
    for (final name in const ['Today', 'Sign in (password)', 'Message thread', 'Account']) {
      testWidgets(name, (tester) async {
        final screen = _screen(name);
        await pumpScreen(tester, screen);
        final lap = await _lap(tester, screen);
        final invisible = <String>[];

        for (final node in lap) {
          if (!await _focusIsVisible(tester, node)) invisible.add(_describe(node));
        }
        expect(invisible, isEmpty,
            reason: '$name: focus on these changes nothing on screen');
        await disposeScreen(tester);
      });
    }
  });

  // ── SC 2.4.3 ──────────────────────────────────────────────────────────────
  group('SC 2.4.3 — focus moves in reading order', () {
    for (final name in const ['Today', 'Medications']) {
      testWidgets('$name: doses in list order, then the bars, then the tabs',
          (tester) async {
        final screen = _screen(name);
        await pumpScreen(tester, screen);
        final lap = (await _lap(tester, screen)).map(_describe).toList();

        // The dose controls, in the order they were met, reduced to the dose
        // each acts on — must match the order the cards are drawn in.
        final doseOrder = <String>[];
        for (final stop in lap) {
          final m = RegExp(r': (.+ at \d+:\d+ [AP]M)$').firstMatch(stop);
          if (m != null && (doseOrder.isEmpty || doseOrder.last != m[1])) {
            doseOrder.add(m[1]!);
          }
        }
        expect(doseOrder,
            buildSlots().map((s) => '${s.med.name} at ${s.time}').toList());

        final firstBar = lap.indexOf('Scroll up');
        expect(firstBar, greaterThan(lap.lastIndexWhere((s) => s.contains(' at '))),
            reason: 'the shell bars came before the end of the content');
        final tabs = lap.sublist(lap.indexOf('Today', firstBar));
        expect(tabs.take(6).toList(),
            ['Today', 'Meds', 'Messages', 'Schedule', 'Symptoms', 'Account']);
        await disposeScreen(tester);
      });
    }

    testWidgets('Sign in: back, fields top to bottom, then the actions',
        (tester) async {
      final screen = _screen('Sign in (password)');
      await pumpScreen(tester, screen);
      final lap = (await _lap(tester, screen)).map(_describe).toList();
      final order = [
        'button: ← Back',
        'field: Email address',
        'field: Password',
        'button: Sign in',
        'button: Use Face ID instead',
      ];
      expect(order.map(lap.indexOf), everyElement(greaterThanOrEqualTo(0)),
          reason: 'missing stops in $lap');
      final positions = order.map(lap.indexOf).toList();
      expect(positions, orderedEquals([...positions]..sort()),
          reason: 'focus order was $lap');
      await disposeScreen(tester);
    });
  });

  // ── SC 2.4.1 ──────────────────────────────────────────────────────────────
  group('SC 2.4.1 — repeated blocks can be bypassed', () {
    for (final screen in allScreens.where((s) => navPaths.contains(s.path))) {
      testWidgets('${screen.name}: the first Tab lands in the content, not '
          'the repeated bars', (tester) async {
        // The scroll bar and tab bar repeat on every screen. They come after
        // the content in focus and reading order, so nobody has to get
        // through them to reach what is new on a screen.
        await pumpScreen(tester, screen);
        await _tab(tester, screen);
        final first = _describe(FocusManager.instance.primaryFocus);
        expect(['Scroll up', 'Scroll down', ...navTabLabels.values],
            isNot(contains(first)));
        await disposeScreen(tester);
      });
    }

    for (final name in const ['Today', 'Medications']) {
      testWidgets('$name: every dose is a heading a screen reader can jump to',
          (tester) async {
        // Heading navigation is how TalkBack and VoiceOver users skip
        // through a long list — dose to dose, past the buttons on each card.
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, _screen(name));
        final headings = semanticsNodes(tester)
            .where((n) => n.getSemanticsData().flagsCollection.isHeader)
            .map((n) => n.getSemanticsData().label)
            .toList();
        for (final s in buildSlots()) {
          expect(headings.where((h) => h.startsWith('${s.med.name},') &&
                  h.contains('due at ${s.time}')),
              hasLength(1),
              reason: '$name: no heading for ${s.med.name} at ${s.time}; '
                  'headings were $headings');
        }
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  // ── SC 2.4.5 ──────────────────────────────────────────────────────────────
  group('SC 2.4.5 — a second way to every main screen', () {
    const links = {
      'Medications': '/medications',
      'Schedule': '/schedule',
      'Symptoms': '/symptoms',
      'Messages': '/messages',
      'Account': '/account',
    };
    for (final entry in links.entries) {
      testWidgets('Today links to ${entry.key}', (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, _screen('Today'));
        // The links sit at the end of the list, below the fold.
        final link = find.byWidgetPredicate(
            (w) => w is CTappable && w.link && w.label == entry.key,
            skipOffstage: false);
        expect(link, findsOneWidget);
        expect(tester.getSemantics(link).getSemanticsData().flagsCollection.isLink,
            isTrue, reason: 'it navigates, so it is announced as a link');

        await tester.ensureVisible(link);
        await tester.pumpAndSettle();
        await tester.tap(link);
        await tester.pumpAndSettle();
        expect(find.text('stub:${entry.value}'), findsOneWidget,
            reason: 'the ${entry.key} link went somewhere else');
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  // ── SC 2.5.3 ──────────────────────────────────────────────────────────────
  group('SC 2.5.3 — the accessible name contains the visible label', () {
    for (final screen in allScreens) {
      testWidgets(screen.name, (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);
        final abbreviations = <String>[];
        final bad = _labelInNameViolations(tester, abbreviations: abbreviations);
        expect(bad, isEmpty,
            reason: '${screen.name}: a voice-control user saying what they '
                'see would not match: ${bad.join('; ')}');
        if (abbreviations.isNotEmpty) {
          // ignore: avoid_print
          print('${screen.name}: abbreviations accepted: '
              '${abbreviations.join(', ')}');
        }
        await disposeScreen(tester);
        handle.dispose();
      });
    }

    testWidgets('control: a name that does not match its label is caught',
        (tester) async {
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => ThemeNotifier(),
        child: MaterialApp(
          home: Scaffold(
            body: CTappable(
              label: 'Confirm order',
              onTap: () {},
              child: const Text('Save changes'),
            ),
          ),
        ),
      ));
      expect(_labelInNameViolations(tester), hasLength(1));
      handle.dispose();
    });

    testWidgets('control: the abbreviation allowance is narrow', (tester) async {
      final handle = tester.ensureSemantics();
      Widget app(String visible, String name) => ChangeNotifierProvider(
            create: (_) => ThemeNotifier(),
            child: MaterialApp(
              home: Scaffold(
                body: CTappable(label: name, onTap: () {}, child: Text(visible)),
              ),
            ),
          );
      // An initial standing for a word of the name is allowed...
      await tester.pumpWidget(app('M', 'Monday, November 2'));
      final allowed = <String>[];
      expect(_labelInNameViolations(tester, abbreviations: allowed), isEmpty);
      expect(allowed, hasLength(1));
      // ...a short word that abbreviates nothing in the name is not...
      await tester.pumpWidget(app('Go', 'Monday, November 2'));
      expect(_labelInNameViolations(tester), hasLength(1));
      // ...and nor are real words in the wrong order.
      await tester.pumpWidget(app('Tap to undo', 'Undo: tap to confirm'));
      expect(_labelInNameViolations(tester), hasLength(1));
      handle.dispose();
    });
  });

  // ── SC 3.3.1 / 3.3.3 ──────────────────────────────────────────────────────
  group('SC 3.3.1 / 3.3.3 — errors are identified, described and fixable', () {
    test('the email check explains what is wrong and what to type', () {
      expect(validateEmail('maddy@example.com'), isNull);
      expect(validateEmail('  maddy@example.com '), isNull);
      for (final bad in const ['', '   ', 'maddy', 'maddy@', 'maddy@example',
          '@example.com', 'mad dy@example.com']) {
        final msg = validateEmail(bad);
        expect(msg, isNotNull, reason: '"$bad" was accepted');
        expect(msg, contains('name@example.com'),
            reason: 'the error for "$bad" gives no example to follow');
      }
    });

    testWidgets('sign in with no email: stays put, says why, focuses the field',
        (tester) async {
      final handle = tester.ensureSemantics();
      final said = _spyOnAnnouncements(tester);
      await pumpScreen(tester, _screen('Sign in (password)'));

      final email = find.widgetWithText(TextFormField, 'Email address');
      await tester.enterText(email, '');
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign in'));
      await tester.pumpAndSettle();

      const error = 'Enter your email address, for example name@example.com';
      expect(find.text('stub:/today'), findsNothing,
          reason: 'signed in with no email address');
      expect(find.text(error), findsOneWidget, reason: 'no visible error');

      // The error belongs to the field: it is part of the field's own
      // semantics, so a screen reader reads it with the field.
      final field = tester.getSemantics(find.descendant(
          of: email, matching: find.byType(EditableText)));
      expect(field.getSemanticsData().hint, contains(error));

      // Focus goes to the field in error, and the failure is announced.
      final focused = FocusManager.instance.primaryFocus!;
      expect(_describe(focused), 'field: Email address');
      expect(said.join(' | '), contains(error));

      // A malformed address gets its own, specific suggestion...
      await tester.enterText(email, 'maddy@example');
      await tester.pumpAndSettle();
      expect(find.textContaining('should look like name@example.com'),
          findsOneWidget);

      // ...and fixing it clears the error and lets the user through.
      await tester.enterText(email, 'maddy@example.com');
      await tester.pumpAndSettle();
      expect(find.textContaining('name@example.com'), findsNothing);
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign in'));
      await tester.pumpAndSettle();
      expect(find.text('stub:/today'), findsOneWidget);

      await disposeScreen(tester);
      handle.dispose();
    });

    testWidgets('the error is a live region where announcements are off',
        (tester) async {
      // Android reports supportsAnnounce: false, so TalkBack learns of the
      // error through a live region on the error text instead.
      final handle = tester.ensureSemantics();
      await pumpScreen(tester, _screen('Sign in (password)'),
          supportsAnnounce: false);
      await tester.enterText(find.widgetWithText(TextFormField, 'Email address'), '');
      await tester.tap(find.widgetWithText(ElevatedButton, 'Sign in'));
      await tester.pumpAndSettle();
      final live = semanticsNodes(tester).where((n) {
        final d = n.getSemanticsData();
        return d.flagsCollection.isLiveRegion &&
            d.label.contains('Enter your email address');
      });
      expect(live, isNotEmpty);
      await disposeScreen(tester);
      handle.dispose();
    });

    testWidgets('sending an empty message says so instead of doing nothing',
        (tester) async {
      final handle = tester.ensureSemantics();
      final said = _spyOnAnnouncements(tester);
      await pumpScreen(tester, _screen('Message thread'));
      final before = threadById(1).messages.length;

      await tester.tap(find.byWidgetPredicate(
          (w) => w is CTappable && w.label == 'Send message'));
      await tester.pumpAndSettle();

      const error = 'Type a message before sending, or choose a quick reply above';
      expect(threadById(1).messages.length, before);
      expect(find.text(error), findsOneWidget);
      final field = tester.getSemantics(find.byType(EditableText));
      expect(field.getSemanticsData().hint, contains(error));
      expect(_describe(FocusManager.instance.primaryFocus), 'field: Message');
      expect(said.join(' | '), contains(error));

      // Typing clears it; sending then works.
      await tester.enterText(find.byType(TextField), 'On my way');
      await tester.pumpAndSettle();
      expect(find.text(error), findsNothing);
      await tester.tap(find.byWidgetPredicate(
          (w) => w is CTappable && w.label == 'Send message'));
      await tester.pumpAndSettle();
      expect(threadById(1).messages.length, before + 1);
      await disposeScreen(tester);
      handle.dispose();
    });

    for (final isDark in const [true, false]) {
      testWidgets('error text is legible (${isDark ? 'dark' : 'light'})',
          (tester) async {
        await pumpScreen(tester, _screen('Sign in (password)'), isDark: isDark);
        await tester.enterText(find.widgetWithText(TextFormField, 'Email address'), '');
        await tester.tap(find.widgetWithText(ElevatedButton, 'Sign in'));
        await tester.pumpAndSettle();
        final raster = await rasterize(tester);
        final text = paintedTexts(tester)
            .firstWhere((t) => t.text.startsWith('Enter your email'));
        final sample = sampleContrast(raster, text);
        expect(sample, isNotNull);
        expect(sample!.ratio, greaterThanOrEqualTo(4.5));
        await disposeScreen(tester);
      });
    }
  });

  group('the focus walker is not vacuous', () {
    testWidgets('it finds a real number of controls to check', (tester) async {
      final screen = _screen('Medications');
      await pumpScreen(tester, screen);
      // 9 doses: 2 taken (one button), 7 open (two each) = 16, plus the bars.
      expect(_enabledControls(tester).length, greaterThanOrEqualTo(16 + 8));
      expect((await _lap(tester, screen)).length, greaterThanOrEqualTo(16 + 8));
      await disposeScreen(tester);
    });

    testWidgets('a control that cannot take focus is reported as missed',
        (tester) async {
      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => ThemeNotifier(),
        child: MaterialApp(
          home: Scaffold(
            body: Column(children: [
              CTappable(label: 'One', onTap: () {}, child: const Text('One')),
              ExcludeFocus(
                child: CTappable(label: 'Two', onTap: () {}, child: const Text('Two')),
              ),
            ]),
          ),
        ),
      ));
      const screen = Screen('control', '/', SizedBox.new);
      final lap = await _lap(tester, screen);
      final missed = _enabledControls(tester).difference(lap.toSet());
      expect(missed.map(_describe), ['Two']);
    });

    testWidgets('a focusable box with no indicator is reported as invisible',
        (tester) async {
      final plain = FocusNode();
      addTearDown(plain.dispose);
      // 1:1 pixels, as pumpScreen sets up: the raster is compared against
      // logical coordinates.
      tester.view.physicalSize = phoneViewport;
      tester.view.devicePixelRatio = 1.0;
      addTearDown(tester.view.reset);
      await tester.pumpWidget(ChangeNotifierProvider(
        create: (_) => ThemeNotifier(),
        child: MaterialApp(
          home: Scaffold(
            body: Column(children: [
              Focus(
                focusNode: plain,
                child: const SizedBox(
                    width: 100, height: 50,
                    child: ColoredBox(color: Color(0xFF336699))),
              ),
              CTappable(label: 'Ringed', onTap: () {}, child: const Text('Ringed')),
            ]),
          ),
        ),
      ));
      // A key press first, as on the screens: it switches Flutter into
      // keyboard highlight mode, the state a keyboard user is in.
      await tester.sendKeyEvent(LogicalKeyboardKey.tab);
      await tester.pumpAndSettle();
      expect(await _focusIsVisible(tester, plain), isFalse);
      final ringed = Focus.of(tester.element(find.text('Ringed')));
      expect(await _focusIsVisible(tester, ringed), isTrue);
    });
  });
}
