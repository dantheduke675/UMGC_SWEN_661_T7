// WCAG 2.1 SC 1.1.1 Non-text Content, SC 1.3.1 Info and Relationships,
// SC 4.1.2 Name, Role, Value — all Level A.
//
// Flutter's `labeledTapTargetGuideline` only asks whether a tappable node has
// *a* label. It passed this app when the call button announced as "telephone
// receiver" and the send button as "upwards arrow", because an emoji is a
// label. None of the checks below can be satisfied by an emoji, a duplicate,
// or a string that happens to be non-empty.

import 'dart:ui' show Tristate;

import 'package:flutter/semantics.dart';
import 'package:flutter_test/flutter_test.dart';

import 'a11y_harness.dart';

/// Reads as a human-meaningful name: at least two letters that are not part of
/// an emoji or symbol.
bool _meaningful(String label) {
  final words = label.replaceAll(decorativeGlyph, ' ').trim();
  return RegExp(r'[A-Za-z]{2,}').hasMatch(words);
}

void main() {
  setUp(resetAppState);
  tearDown(resetAppState);

  group('SC 4.1.2 — every control announces a role', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: tappable nodes are buttons', (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);

        final offenders = <String>[];
        for (final node in tappableNodes(tester)) {
          final d = node.getSemanticsData();
          final f = d.flagsCollection;
          // A text field is a control too, just not a button.
          if (f.isButton || f.isTextField || f.isSlider || f.isLink) continue;
          offenders.add('"${d.label}"');
        }

        expect(offenders, isEmpty,
            reason: '${screen.name}: activatable with no role, so a screen '
                'reader announces content but never says it can be used: '
                '${offenders.join(', ')}');
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('SC 1.1.1 / 4.1.2 — every control has a meaningful name', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: no empty or emoji-only names', (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);

        final empty = <String>[];
        final glyphOnly = <String>[];
        for (final node in tappableNodes(tester)) {
          final d = node.getSemanticsData();
          if (d.flagsCollection.isTextField) continue; // named by its label
          final label = d.label.trim();
          if (label.isEmpty) {
            empty.add(node.toString());
          } else if (!_meaningful(label)) {
            glyphOnly.add('"$label"');
          }
        }

        expect(empty, isEmpty, reason: '${screen.name}: unlabelled controls');
        expect(glyphOnly, isEmpty,
            reason: '${screen.name}: names a screen reader would read out as '
                'Unicode character names rather than a purpose: '
                '${glyphOnly.join(', ')}');
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('SC 1.1.1 — decorative glyphs stay out of announcements', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: no emoji leak into any label', (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);

        final leaked = <String>[];
        for (final node in semanticsNodes(tester)) {
          final label = node.getSemanticsData().label;
          if (label.isEmpty) continue;
          if (decorativeGlyph.hasMatch(label)) leaked.add('"$label"');
        }

        expect(leaked, isEmpty,
            reason: '${screen.name}: these are announced with the glyph\'s '
                'Unicode name embedded in them: ${leaked.join(', ')}');
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('SC 4.1.2 — controls are distinguishable from one another', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: no two controls share a name', (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);

        // Nine "I took this" buttons that all announce "I took this" are
        // individually labelled but collectively useless: out of context a
        // screen reader user cannot tell which dose they are confirming.
        final counts = <String, int>{};
        for (final node in tappableNodes(tester)) {
          final d = node.getSemanticsData();
          if (d.flagsCollection.isTextField) continue;
          final key = '${d.label}|${d.hint}';
          counts[key] = (counts[key] ?? 0) + 1;
        }
        final dupes = counts.entries.where((e) => e.value > 1).toList();

        expect(dupes, isEmpty,
            reason: '${screen.name}: ambiguous names — '
                '${dupes.map((e) => '${e.value}x "${e.key}"').join(', ')}');
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('SC 1.3.1 — structure is exposed', () {
    for (final screen in allScreens) {
      testWidgets('${screen.name}: exposes at least one heading', (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);

        final headings = semanticsNodes(tester)
            .where((n) => n.getSemanticsData().flagsCollection.isHeader)
            .map((n) => n.getSemanticsData().label)
            .toList();

        expect(headings, isNotEmpty,
            reason: '${screen.name}: no headings, so a screen reader user has '
                'no way to jump between sections');
        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('SC 4.1.2 — the tab bar reports which tab is current', () {
    for (final screen in allScreens.where((s) => navPaths.contains(s.path))) {
      testWidgets('${screen.name}: exactly one tab is selected', (tester) async {
        final handle = tester.ensureSemantics();
        await pumpScreen(tester, screen);

        // Scoped by the position hint: the week strip and the symptom chips
        // also carry a selected state, and counting those here would make the
        // assertion meaningless.
        final tabs = tappableNodes(tester)
            .where((n) => n.getSemanticsData().hint.startsWith('Tab '))
            .toList();
        final selected = tabs
            .where((n) =>
                n.getSemanticsData().flagsCollection.isSelected == Tristate.isTrue)
            .map((n) => n.getSemanticsData().label)
            .toList();

        expect(tabs.length, navPaths.length,
            reason: '${screen.name}: every tab must carry a selected state, '
                'not just the active one');
        expect(selected, hasLength(1),
            reason: '${screen.name}: expected exactly one selected tab, got '
                '$selected');
        // ...and it must be the tab for the screen actually on display.
        // Compared against the tab's own label rather than the screen's name:
        // "/medications" is headed "Medications" but tabbed "Meds".
        final expected = navTabLabels[screen.path]!;
        expect(selected.single.toLowerCase(), contains(expected.toLowerCase()));

        await disposeScreen(tester);
        handle.dispose();
      });
    }
  });

  group('SC 4.1.2 — toggles report their state', () {
    testWidgets('the appearance switch exposes on/off, not just a label',
        (tester) async {
      final handle = tester.ensureSemantics();
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Account'));

      final toggles = tappableNodes(tester)
          .where((n) =>
              n.getSemanticsData().flagsCollection.isToggled != Tristate.none)
          .toList();
      expect(toggles, isNotEmpty,
          reason: 'the dark-mode switch must expose a toggled state');
      expect(
        toggles.map((n) => n.getSemanticsData().flagsCollection.isToggled),
        everyElement(isNot(Tristate.none)),
      );
      await disposeScreen(tester);
      handle.dispose();
    });
  });

  group('SC 4.1.2 — a control that does nothing says so', () {
    testWidgets('voice input is exposed as disabled, not as a working button',
        (tester) async {
      final handle = tester.ensureSemantics();
      await pumpScreen(tester, allScreens.firstWhere((s) => s.name == 'Today'));

      final voice = semanticsNodes(tester).where(
          (n) => n.getSemanticsData().label.toLowerCase().contains('voice'));
      expect(voice, isNotEmpty);
      for (final n in voice) {
        final d = n.getSemanticsData();
        expect(d.flagsCollection.isEnabled, Tristate.isFalse,
            reason: 'voice input is not implemented; announcing it as enabled '
                'promises a control that does nothing');
        expect(d.hasAction(SemanticsAction.tap), isFalse);
      }
      await disposeScreen(tester);
      handle.dispose();
    });
  });

  group('evidence: what a screen reader announces', () {
    // Prints the announcement table for every screen, and asserts the three
    // headline counts are zero. Doubles as the submission evidence that used
    // to come from a separate report-only audit file — the difference being
    // that this one fails when the numbers are wrong.
    testWidgets('announcement table for every screen', (tester) async {
      final handle = tester.ensureSemantics();
      final buf = StringBuffer()
        ..writeln('')
        ..writeln('=' * 74)
        ..writeln('SCREEN READER OUTPUT — every activatable control')
        ..writeln('=' * 74);

      var totalControls = 0;
      var totalUnlabelled = 0;
      var totalGlyphOnly = 0;
      var totalNoRole = 0;

      for (final screen in allScreens) {
        await pumpScreen(tester, screen);
        buf.writeln('');
        buf.writeln(screen.name);

        for (final node in tappableNodes(tester)) {
          final d = node.getSemanticsData();
          final f = d.flagsCollection;
          final role = f.isButton
              ? 'button'
              : f.isTextField
                  ? 'text field'
                  : f.isSlider
                      ? 'slider'
                      : 'NO ROLE';
          final state = f.isSelected == Tristate.isTrue
              ? ', selected'
              : f.isToggled == Tristate.isTrue
                  ? ', on'
                  : '';
          final label = d.label.replaceAll('\n', ' / ');
          buf.writeln('  [$role$state] "$label"'
              '${d.hint.isEmpty ? '' : '  hint: "${d.hint}"'}');

          totalControls++;
          if (label.trim().isEmpty) {
            totalUnlabelled++;
          } else if (!_meaningful(label) && !f.isTextField) {
            totalGlyphOnly++;
          }
          if (role == 'NO ROLE') totalNoRole++;
        }
        await disposeScreen(tester);
      }

      buf
        ..writeln('')
        ..writeln('-' * 74)
        ..writeln('controls: $totalControls | unlabelled: $totalUnlabelled | '
            'emoji-only: $totalGlyphOnly | missing role: $totalNoRole')
        ..writeln('=' * 74);
      // ignore: avoid_print
      print(buf.toString());

      expect(totalControls, greaterThan(50));
      expect(totalUnlabelled, 0);
      expect(totalGlyphOnly, 0);
      expect(totalNoRole, 0);
      handle.dispose();
    });
  });

  group('the checks themselves are not vacuous', () {
    testWidgets('an emoji-only label is rejected', (tester) async {
      // Guards the meaningfulness rule: these are exactly the labels the app
      // used to ship, and every one passed labeledTapTargetGuideline.
      for (final label in const ['📞', '↑', '←', '☀️', '💊 ', '▲']) {
        expect(_meaningful(label), isFalse, reason: '"$label" must be rejected');
      }
    });

    testWidgets('a real label is accepted', (tester) async {
      for (final label in const [
        'Call Dr. Sarah Chen',
        'Send message',
        'Scroll up',
        'Mark Metformin at 8:00 AM as taken',
      ]) {
        expect(_meaningful(label), isTrue, reason: '"$label" must be accepted');
      }
    });

    testWidgets('every screen actually produced controls to check',
        (tester) async {
      // If pumpScreen ever silently rendered nothing, every group above would
      // pass on an empty list.
      final handle = tester.ensureSemantics();
      for (final screen in allScreens) {
        await pumpScreen(tester, screen);
        expect(tappableNodes(tester).length, greaterThanOrEqualTo(2),
            reason: '${screen.name} produced almost no controls — the harness '
                'is probably not rendering it');
        await disposeScreen(tester);
      }
      handle.dispose();
    });
  });
}
