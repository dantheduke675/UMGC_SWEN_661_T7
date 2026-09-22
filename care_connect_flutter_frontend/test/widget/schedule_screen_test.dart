import 'dart:ui' show Tristate;

import 'package:flutter_test/flutter_test.dart';
import 'package:care_connect_flutter_frontend/screens/schedule_screen.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/widgets.dart';
import '../helpers/test_helpers.dart';

void main() {
  // The week strip runs Monday-to-Sunday of the *current* week, so which day
  // offsets exist on screen depends on what day the suite happens to run.
  // Pinning "today" to a Monday puts offsets 0-6 all on screen, which is what
  // makes the empty state, the weekday headings and every appointment type
  // reachable from a test. Real appointments sit on offsets 0, 1, 2 and 4.
  final monday = DateTime(2026, 9, 21, 9);

  /// Taps the week-strip cell for [dayName] and settles.
  Future<void> selectDay(WidgetTester tester, String dayName) async {
    final cell = find.bySemanticsLabel(RegExp('^$dayName, September'));
    expect(cell, findsOneWidget, reason: 'no week-strip cell for $dayName');
    await tester.tap(cell);
    await tester.pumpAndSettle();
  }

  // ── Content ──────────────────────────────────────────────────────────────────

  group('ScheduleScreen — content', () {
    testWidgets('renders Schedule heading', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const ScheduleScreen()));
      expect(find.text('Schedule'), findsOneWidget);
    });

    testWidgets('renders appointment count subtitle', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const ScheduleScreen()));
      expect(find.textContaining('appointments this week'), findsOneWidget);
    });

    testWidgets('renders today label by default', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.text('Today'), findsOneWidget);
    });

    testWidgets('renders Dr Chen appointment on today view', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.textContaining('Dr. Chen'), findsOneWidget);
    });

    testWidgets('renders appointment subtitle for today', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.textContaining('Dr. Sarah Chen'), findsOneWidget);
    });

    testWidgets('renders week strip with day letters', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const ScheduleScreen()));
      // Week strip shows M T W T F S S — at least M and F are present
      expect(find.text('M'), findsOneWidget);
      expect(find.text('F'), findsOneWidget);
    });

    testWidgets('renders appointment time chip', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.text('2:30 PM'), findsOneWidget);
    });

    testWidgets('renders appointment duration chip', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.text('45 min'), findsOneWidget);
    });
  });

  // ── Day selection ────────────────────────────────────────────────────────────

  group('ScheduleScreen — day selection', () {
    test('the pinned date really is a Monday', () {
      // Guards every test below: on any other weekday the strip would not
      // contain offsets 0-6 and the selections would silently miss.
      expect(monday.weekday, DateTime.monday);
    });

    testWidgets('a day with no appointments shows the empty state', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.text('No appointments'), findsNothing);

      await selectDay(tester, 'Thursday'); // nothing is booked on offset 3

      expect(find.text('No appointments'), findsOneWidget);
      expect(find.text('Enjoy your free day.'), findsOneWidget);
      expect(find.textContaining('Dr. Chen'), findsNothing);
    });

    testWidgets('the empty state replaces the cards rather than stacking with them',
        (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Saturday');
      expect(find.byType(CChip), findsNothing);
    });

    testWidgets('selecting tomorrow heads the day Tomorrow', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Tuesday'); // offset 1

      expect(find.text('Tomorrow'), findsOneWidget);
      expect(find.text('Today'), findsNothing);
    });

    testWidgets("selecting tomorrow shows both of tomorrow's appointments",
        (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Tuesday');

      expect(find.textContaining('Physical Therapy'), findsOneWidget);
      expect(find.textContaining('Blood Draw'), findsOneWidget);
    });

    testWidgets('a mid-week day is headed by its weekday name', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Wednesday'); // offset 2

      expect(find.text('Wednesday'), findsWidgets);
      expect(find.textContaining('Home Aide Visit'), findsOneWidget);
    });

    testWidgets('Friday shows both Friday appointments', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Friday'); // offset 4

      expect(find.textContaining('Cardiology Check-in'), findsOneWidget);
      expect(find.textContaining('Pharmacy Pick-up'), findsOneWidget);
    });

    testWidgets("leaving today and coming back restores today's card",
        (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Thursday');
      expect(find.textContaining('Dr. Chen'), findsNothing);

      await selectDay(tester, 'Monday');

      expect(find.text('Today'), findsOneWidget);
      expect(find.textContaining('Dr. Chen'), findsOneWidget);
    });
  });

  // ── Appointment cards ────────────────────────────────────────────────────────

  group('ScheduleScreen — appointment cards', () {
    testWidgets('an unconfirmed appointment is chipped Pending', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Tuesday');

      // Physical Therapy is the only appointment with confirmed: false.
      expect(find.text('Pending'), findsOneWidget);
    });

    testWidgets('a confirmed appointment carries no Pending chip', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.textContaining('Dr. Chen'), findsOneWidget);
      expect(find.text('Pending'), findsNothing);
    });

    testWidgets('pending confirmation is spoken, not only coloured', (tester) async {
      // The Pending chip is amber; colour alone would carry that meaning to
      // sighted users only (SC 1.4.1). The card's merged label must say it.
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Tuesday');

      expect(
        find.bySemanticsLabel(RegExp('Physical Therapy.*pending confirmation')),
        findsOneWidget,
      );
    });

    testWidgets('a confirmed card does not claim to be pending', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.bySemanticsLabel(RegExp('pending confirmation')), findsNothing);
    });

    testWidgets('each appointment type renders its own icon', (tester) async {
      // Exercises every arm of _typeIcon/_typeColor rather than only the
      // Physician card that happens to sit on today.
      const iconsByDay = {
        'Monday': ['🏥'], // Physician
        'Tuesday': ['🏋️', '🧪'], // Therapy, Lab
        'Wednesday': ['🏠'], // Home Care
        'Friday': ['❤️', '💊'], // Specialist, Pharmacy
      };

      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      for (final entry in iconsByDay.entries) {
        await selectDay(tester, entry.key);
        for (final icon in entry.value) {
          expect(find.text(icon), findsOneWidget,
              reason: 'expected $icon on ${entry.key}');
        }
      }
    });

    testWidgets('the card speaks one sentence, not its scattered parts',
        (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));

      expect(
        find.bySemanticsLabel(
          'Dr. Chen — Follow-up. Dr. Sarah Chen · Physician. '
          'Today at 2:30 PM, 45 min',
        ),
        findsOneWidget,
      );
    });
  });

  // ── Week strip ───────────────────────────────────────────────────────────────

  group('ScheduleScreen — week strip', () {
    final anyDayCell =
        RegExp(r'^(Mon|Tues|Wednes|Thurs|Fri|Satur|Sun)day, ');

    testWidgets('renders exactly 7 day cells', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.bySemanticsLabel(anyDayCell), findsNWidgets(7));
    });

    testWidgets('each cell spells out its date instead of a bare letter',
        (tester) async {
      // "M / 21" told a screen reader nothing (SC 1.1.1).
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.bySemanticsLabel('Monday, September 21, today'), findsOneWidget);
      expect(find.bySemanticsLabel('Sunday, September 27'), findsOneWidget);
    });

    testWidgets('only today is labelled today', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      expect(find.bySemanticsLabel(RegExp(r', today$')), findsOneWidget);
    });

    testWidgets('a cell says whether that day has anything booked', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      final node = tester.getSemantics(
        find.bySemanticsLabel('Wednesday, September 23'),
      );
      expect(node.hint, 'Has appointments');
    });

    testWidgets('a free day says so rather than staying silent', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      final node = tester.getSemantics(
        find.bySemanticsLabel('Thursday, September 24'),
      );
      expect(node.hint, 'No appointments');
    });

    testWidgets('the selected day is exposed as selected to assistive tech',
        (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      await selectDay(tester, 'Friday');

      final friday = tester
          .getSemantics(find.bySemanticsLabel('Friday, September 25'))
          .getSemanticsData()
          .flagsCollection;
      expect(friday.isSelected, Tristate.isTrue);

      final today = tester
          .getSemantics(find.bySemanticsLabel('Monday, September 21, today'))
          .getSemanticsData()
          .flagsCollection;
      expect(today.isSelected, Tristate.isFalse);
    });

    testWidgets('every day cell is a button assistive tech can activate',
        (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      final cells = find.bySemanticsLabel(anyDayCell);
      for (var i = 0; i < 7; i++) {
        final flags =
            tester.getSemantics(cells.at(i)).getSemanticsData().flagsCollection;
        expect(flags.isButton, isTrue);
        expect(flags.isEnabled, Tristate.isTrue);
      }
    });

    testWidgets('day cells keep a 48px tap target', (tester) async {
      await pumpScreen(tester, buildTestApp(child: ScheduleScreen(now: monday)));
      final size =
          tester.getSize(find.bySemanticsLabel('Thursday, September 24'));
      expect(size.width, greaterThanOrEqualTo(48.0));
      expect(size.height, greaterThanOrEqualTo(48.0));
    });
  });

  // ── Theming ───────────────────────────────────────────────────────────────────

  group('ScheduleScreen — theming', () {
    testWidgets('renders in dark mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const ScheduleScreen(), isDark: true));
      expect(find.text('Schedule'), findsOneWidget);
    });

    testWidgets('renders in light mode without error', (tester) async {
      await pumpScreen(tester, buildTestApp(child: const ScheduleScreen(), isDark: false));
      expect(find.text('Schedule'), findsOneWidget);
    });

    testWidgets('notifier is dark by default', (tester) async {
      final notifier = ThemeNotifier(isDark: true);
      await pumpScreen(tester, buildTestApp(child: const ScheduleScreen(), themeNotifier: notifier));
      expect(notifier.isDark, isTrue);
    });
  });
}
