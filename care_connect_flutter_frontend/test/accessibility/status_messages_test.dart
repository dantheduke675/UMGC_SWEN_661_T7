// WCAG 2.1 SC 4.1.3 Status Messages (Level AA) — real assertions, not a probe.
//
// The app confirms state changes two ways, because no single mechanism works
// on both platforms:
//
//   * `SemanticsService.sendAnnouncement`, which iOS and the web deliver, and
//     which `announceStatus` gates behind MediaQuery.supportsAnnounceOf;
//   * `liveRegion: true` on the visible summary each action changes, which is
//     what Android/TalkBack honours — Android deprecated announcement events.
//
// These tests cover both paths, so removing either one fails the suite.

import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:care_connect_flutter_frontend/action_history.dart';
import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/screens/medications_screen.dart';
import 'package:care_connect_flutter_frontend/screens/symptoms_screen.dart';
import 'package:care_connect_flutter_frontend/screens/today_screen.dart';

/// Captures the announcements the app posts to the accessibility channel.
class _AnnouncementSpy {
  final List<String> messages = [];

  void install(WidgetTester tester) {
    tester.binding.defaultBinaryMessenger.setMockDecodedMessageHandler<dynamic>(
      SystemChannels.accessibility,
      (dynamic message) async {
        if (message is Map && message['type'] == 'announce') {
          final data = message['data'];
          if (data is Map && data['message'] != null) {
            messages.add(data['message'].toString());
          }
        }
        return null;
      },
    );
    addTearDown(() {
      tester.binding.defaultBinaryMessenger
          .setMockDecodedMessageHandler<dynamic>(SystemChannels.accessibility, null);
    });
  }
}

/// Builds a screen inside the real shell, with announcement support switched
/// on so the iOS/web path is exercised (it is off by default in tests, as it
/// is on Android).
Widget _appWith(Widget screen, {bool supportsAnnounce = true}) {
  final notifier = ThemeNotifier(isDark: true);
  final router = GoRouter(
    initialLocation: '/target',
    routes: [
      ShellRoute(
        builder: (_, _, child) => AppShell(child: child),
        routes: [GoRoute(path: '/target', builder: (_, _) => screen)],
      ),
      GoRoute(path: '/landing', builder: (_, _) => const Scaffold(body: Text('landing'))),
      GoRoute(path: '/messages', builder: (_, _) => const Scaffold(body: Text('messages'))),
    ],
  );
  return ChangeNotifierProvider<ThemeNotifier>.value(
    value: notifier,
    child: ChangeNotifierProvider<ActionHistory>(
      create: (_) => ActionHistory(),
      child: MaterialApp.router(
        routerConfig: router,
        darkTheme: buildTheme(true),
        themeMode: ThemeMode.dark,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(supportsAnnounce: supportsAnnounce),
          child: child!,
        ),
      ),
    ),
  );
}

void _resetDoses() {
  slotStatuses
    ..clear()
    ..addAll({'1-0': SlotStatus.taken, '3-0': SlotStatus.taken});
}

/// The default 800x600 surface is too short to lay out the medication list, so
/// the cards never build and `find.text` cannot reach them. Same trick the
/// existing widget tests use.
void _tallSurface(WidgetTester tester) {
  tester.view.physicalSize = const Size(800, 5000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });
}

/// Every live-region label currently in the semantics tree.
List<String> _liveRegions(WidgetTester tester) {
  final out = <String>[];
  void walk(SemanticsNode n) {
    final d = n.getSemanticsData();
    if (d.flagsCollection.isLiveRegion && d.label.isNotEmpty) out.add(d.label);
    n.visitChildren((c) {
      walk(c);
      return true;
    });
  }

  // ignore: deprecated_member_use
  walk(tester.binding.pipelineOwner.semanticsOwner!.rootSemanticsNode!);
  return out;
}

void main() {
  setUp(_resetDoses);
  tearDown(_resetDoses);

  group('announcement path (iOS / web)', () {
    testWidgets('marking a dose taken announces which dose', (tester) async {
      _tallSurface(tester);
      final spy = _AnnouncementSpy()..install(tester);
      await tester.pumpWidget(_appWith(const TodayScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('I took this').first, warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(spy.messages, isNotEmpty,
          reason: 'a dose change must produce a status announcement');
      expect(spy.messages.last, contains('marked as taken'));
      expect(spy.messages.last, contains('Ropivacaine'));
    });

    testWidgets('un-marking a dose announces the reversal', (tester) async {
      _tallSurface(tester);
      final spy = _AnnouncementSpy()..install(tester);
      await tester.pumpWidget(_appWith(const TodayScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.textContaining('tap to undo').first, warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(spy.messages.last, contains('no longer marked as taken'));
    });

    testWidgets('confirming a missed dose announces the caregiver notice',
        (tester) async {
      _tallSurface(tester);
      final spy = _AnnouncementSpy()..install(tester);
      await tester.pumpWidget(_appWith(const MedicationsScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('I missed this').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Yes, I missed this dose'), warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(spy.messages.last, contains('marked as missed'));
      expect(spy.messages.last, contains('caregiver'));
    });

    testWidgets('logging a symptom announces name and severity', (tester) async {
      _tallSurface(tester);
      final spy = _AnnouncementSpy()..install(tester);
      await tester.pumpWidget(_appWith(const SymptomsScreen()));
      await tester.pumpAndSettle();

      await tester.tap(find.text('Log a symptom'), warnIfMissed: false);
      await tester.pumpAndSettle();
      // The seeded log list also contains a 'Nausea' entry; the picker
      // chip is the first of the two in tree order.
      await tester.tap(find.text('Nausea').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Log symptom'), warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(spy.messages.last, contains('Nausea'));
      expect(spy.messages.last, contains('severity'));
    });

    testWidgets('nothing is posted when the platform does not support it',
        (tester) async {
      // Android reports supportsAnnounce: false; announceStatus must no-op
      // there rather than firing events TalkBack would mishandle.
      _tallSurface(tester);
      final spy = _AnnouncementSpy()..install(tester);
      await tester.pumpWidget(_appWith(const TodayScreen(), supportsAnnounce: false));
      await tester.pumpAndSettle();

      await tester.tap(find.text('I took this').first, warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(spy.messages, isEmpty);
    });
  });

  group('live-region path (Android / TalkBack)', () {
    testWidgets('Today progress summary is a live region and tracks the count',
        (tester) async {
      _tallSurface(tester);
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_appWith(const TodayScreen()));
      await tester.pumpAndSettle();

      expect(_liveRegions(tester).any((l) => l.contains('2 of 9 taken')), isTrue,
          reason: 'progress card must be a live region');

      await tester.tap(find.text('I took this').first, warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(_liveRegions(tester).any((l) => l.contains('3 of 9 taken')), isTrue,
          reason: 'its label must change so TalkBack re-announces it');
      handle.dispose();
    });

    testWidgets('Medications tally is a live region and tracks taken/missed',
        (tester) async {
      _tallSurface(tester);
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_appWith(const MedicationsScreen()));
      await tester.pumpAndSettle();

      expect(_liveRegions(tester).any((l) => l.contains('2 taken, 0 missed')), isTrue);

      await tester.tap(find.text('I missed this').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Yes, I missed this dose'), warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(_liveRegions(tester).any((l) => l.contains('1 missed')), isTrue);
      handle.dispose();
    });

    testWidgets('Symptoms log heading is a live region carrying the count',
        (tester) async {
      _tallSurface(tester);
      final handle = tester.ensureSemantics();
      await tester.pumpWidget(_appWith(const SymptomsScreen()));
      await tester.pumpAndSettle();

      expect(_liveRegions(tester).any((l) => l.contains('5 entries')), isTrue);

      await tester.tap(find.text('Log a symptom'), warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Pain').first, warnIfMissed: false);
      await tester.pumpAndSettle();
      await tester.tap(find.text('Log symptom'), warnIfMissed: false);
      await tester.pumpAndSettle();

      expect(_liveRegions(tester).any((l) => l.contains('6 entries')), isTrue);
      handle.dispose();
    });
  });
}
