// Shared harness for the accessibility suite.
//
// Every screen is mounted inside the real `AppShell`, at a real phone
// viewport, so the bottom navigation and the accessibility bar are part of
// what gets checked — testing screens in isolation would exempt the two bars
// that carry most of the app's controls.

import 'dart:typed_data';
import 'dart:ui' as ui show Image;
import 'dart:ui' show Tristate;

import 'package:flutter/material.dart';
import 'package:flutter/rendering.dart';
import 'package:flutter_test/flutter_test.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import 'package:care_connect_flutter_frontend/action_history.dart';
import 'package:care_connect_flutter_frontend/data.dart';
import 'package:care_connect_flutter_frontend/main.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:care_connect_flutter_frontend/screens/account_screen.dart';
import 'package:care_connect_flutter_frontend/screens/biometrics_screen.dart';
import 'package:care_connect_flutter_frontend/screens/calling_screen.dart';
import 'package:care_connect_flutter_frontend/screens/create_account_screen.dart';
import 'package:care_connect_flutter_frontend/screens/landing_screen.dart';
import 'package:care_connect_flutter_frontend/screens/medications_screen.dart';
import 'package:care_connect_flutter_frontend/screens/messages_screen.dart';
import 'package:care_connect_flutter_frontend/screens/msg_thread_screen.dart';
import 'package:care_connect_flutter_frontend/screens/schedule_screen.dart';
import 'package:care_connect_flutter_frontend/screens/sign_in_bio_screen.dart';
import 'package:care_connect_flutter_frontend/screens/sign_in_pass_screen.dart';
import 'package:care_connect_flutter_frontend/screens/symptoms_screen.dart';
import 'package:care_connect_flutter_frontend/screens/today_screen.dart';

/// One screen under test.
class Screen {
  final String name;
  final Widget Function() build;

  /// The screen's real route. It matters: `AppShell` reads the location to
  /// decide which tab is selected and whether to hide its bars on a call, so
  /// mounting everything at one placeholder path would both mis-report the
  /// selected tab and leave the bars on the full-screen call.
  final String path;

  /// Auth screens sit outside the tab shell.
  final bool inShell;

  /// Screens with a perpetual animation cannot be `pumpAndSettle`-ed.
  final bool animated;

  const Screen(this.name, this.path, this.build,
      {this.inShell = true, this.animated = false});
}

/// Every screen in the app. Anything added to the app should be added here, or
/// it escapes the entire accessibility suite.
const List<Screen> allScreens = [
  Screen('Landing', '/landing', LandingScreen.new, inShell: false),
  Screen('Create account', '/create-account', CreateAccountScreen.new, inShell: false),
  Screen('Biometrics', '/biometrics', BiometricsScreen.new, inShell: false),
  Screen('Sign in (Face ID)', '/sign-in-bio', SignInBioScreen.new,
      inShell: false, animated: true),
  Screen('Sign in (password)', '/sign-in-pass', SignInPassScreen.new, inShell: false),
  Screen('Today', '/today', TodayScreen.new),
  Screen('Medications', '/medications', MedicationsScreen.new),
  Screen('Schedule', '/schedule', ScheduleScreen.new),
  Screen('Symptoms', '/symptoms', SymptomsScreen.new),
  Screen('Messages', '/messages', MessagesScreen.new),
  Screen('Message thread', '/messages/1', _thread),
  Screen('Account', '/account', AccountScreen.new),
  // Calling sits inside the ShellRoute in main.dart; the shell hides its bars
  // for this route. Mounting it elsewhere leaves the bars on and overflows.
  Screen('Calling', '/calling/1', _calling, animated: true),
];

/// The tab paths `AppShell` knows about, in bar order.
const List<String> navPaths = [
  '/today', '/medications', '/messages', '/schedule', '/symptoms', '/account',
];

/// The text each tab carries in the bar, which is also its accessible name.
///
/// Mostly the same as the screen's own name, but not always: `/medications`
/// is headed "Medications" and tabbed **"Meds"**, because the full word
/// wrapped to two lines in the tab. Tests that check which tab is current
/// must compare against this, not against `Screen.name`.
const Map<String, String> navTabLabels = {
  '/today': 'Today',
  '/medications': 'Meds',
  '/messages': 'Messages',
  '/schedule': 'Schedule',
  '/symptoms': 'Symptoms',
  '/account': 'Account',
};

Widget _thread() => const MsgThreadScreen(threadId: 1);
Widget _calling() => const CallingScreen(contactId: 1);

/// Restores the shared, mutable app state the screens write into, so the order
/// tests run in cannot change their outcome.
void resetAppState() {
  slotStatuses
    ..clear()
    ..addAll({'1-0': SlotStatus.taken, '3-0': SlotStatus.taken});
  for (final t in threads) {
    t.unread = t.id == 1;
  }
  threads[0].messages.removeWhere((m) => m.time == 'Now');
}

/// Mounts [screen] in the shell with the given theme and text scale.
Widget buildApp(
  Screen screen, {
  bool isDark = true,
  double textScale = 1.0,
  bool supportsAnnounce = true,
}) {
  final notifier = ThemeNotifier(isDark: isDark);

  // Stub every other destination so navigation away from the screen under
  // test resolves, without colliding with the screen's own route.
  const stubs = <String>[
    '/landing', '/create-account', '/biometrics', '/sign-in-bio',
    '/sign-in-pass', '/today', '/medications', '/schedule', '/symptoms',
    '/messages', '/messages/:id', '/account', '/calling/:id',
  ];
  // '/messages/1' and the '/messages/:id' stub are the same route to GoRouter.
  final screenPattern = screen.path.replaceFirst(RegExp(r'/\d+$'), '/:id');

  final router = GoRouter(
    initialLocation: screen.path,
    routes: [
      if (screen.inShell)
        ShellRoute(
          builder: (_, _, child) => AppShell(child: child),
          routes: [GoRoute(path: screen.path, builder: (_, _) => screen.build())],
        )
      else
        GoRoute(path: screen.path, builder: (_, _) => screen.build()),
      for (final stub in stubs)
        if (stub != screenPattern && stub != screen.path)
          GoRoute(
            path: stub,
            builder: (_, _) => Scaffold(body: Text('stub:$stub')),
          ),
    ],
  );

  return ChangeNotifierProvider<ThemeNotifier>.value(
    value: notifier,
    child: ChangeNotifierProvider<ActionHistory>(
      create: (_) => ActionHistory(),
      child: MaterialApp.router(
        routerConfig: router,
        theme: buildTheme(false),
        darkTheme: buildTheme(true),
        themeMode: isDark ? ThemeMode.dark : ThemeMode.light,
        // The banner paints over the top-right corner and would be
        // sampled as if it were app content.
        debugShowCheckedModeBanner: false,
        builder: (context, child) => MediaQuery(
          data: MediaQuery.of(context).copyWith(
            textScaler: TextScaler.linear(textScale),
            supportsAnnounce: supportsAnnounce,
          ),
          child: child!,
        ),
      ),
    ),
  );
}

/// A realistic phone viewport. Tap-target and overflow checks are meaningless
/// at the 800x600 default, which would also trip the >=700px tablet branch on
/// the auth screens.
const Size phoneViewport = Size(411, 891);

/// Mounts the screen and settles it. Returns once the first frame is stable.
Future<void> pumpScreen(
  WidgetTester tester,
  Screen screen, {
  bool isDark = true,
  double textScale = 1.0,
  bool supportsAnnounce = true,
  Size viewport = phoneViewport,
}) async {
  tester.view.physicalSize = viewport;
  tester.view.devicePixelRatio = 1.0;
  addTearDown(() {
    tester.view.resetPhysicalSize();
    tester.view.resetDevicePixelRatio();
  });

  await tester.pumpWidget(buildApp(
    screen,
    isDark: isDark,
    textScale: textScale,
    supportsAnnounce: supportsAnnounce,
  ));

  if (screen.animated) {
    await tester.pump();
    await tester.pump(const Duration(milliseconds: 50));
  } else {
    await tester.pumpAndSettle();
  }
}

/// Unmounts cleanly so `State.dispose` cancels the periodic timers the calling
/// screen starts; otherwise FakeAsync fails the test on teardown.
Future<void> disposeScreen(WidgetTester tester) async {
  await tester.pump(const Duration(seconds: 3));
  await tester.pumpWidget(const SizedBox.shrink());
}

// ── Semantics helpers ───────────────────────────────────────────────────────

/// Every semantics node currently in the tree, depth first.
List<SemanticsNode> semanticsNodes(WidgetTester tester) {
  final out = <SemanticsNode>[];
  void walk(SemanticsNode n) {
    out.add(n);
    n.visitChildren((c) {
      walk(c);
      return true;
    });
  }

  // rootPipelineOwner exposes no semanticsOwner in a widget test; the
  // deprecated accessor is still the way to reach the compiled tree.
  // ignore: deprecated_member_use
  walk(tester.binding.pipelineOwner.semanticsOwner!.rootSemanticsNode!);
  return out;
}

/// Nodes a user can activate.
List<SemanticsNode> tappableNodes(WidgetTester tester) => semanticsNodes(tester)
    .where((n) => n.getSemanticsData().hasAction(SemanticsAction.tap))
    .toList();

/// Matches emoji, arrows, and the geometric/dingbat symbols the app draws as
/// icons. A label made only of these announces as a Unicode name
/// ("telephone receiver"), never as a purpose.
final RegExp decorativeGlyph = RegExp(
  r'[\u{1F300}-\u{1FAFF}\u{1F000}-\u{1F0FF}\u{2190}-\u{21FF}\u{2300}-\u{23FF}'
  r'\u{2460}-\u{24FF}\u{25A0}-\u{27BF}\u{2B00}-\u{2BFF}\u{FE0F}\u{200D}]',
  unicode: true,
);

/// Screen rects of controls that are disabled.
///
/// WCAG 2.1 SC 1.4.3 exempts "text that is part of an inactive user interface
/// component", so text inside these is not measured. Flutter's own contrast
/// guideline skips such nodes for the same reason.
List<Rect> disabledRegions(WidgetTester tester) {
  final out = <Rect>[];
  for (final n in semanticsNodes(tester)) {
    if (n.getSemanticsData().flagsCollection.isEnabled != Tristate.isFalse) continue;
    var rect = n.rect;
    SemanticsNode? cur = n;
    while (cur != null) {
      final t = cur.transform;
      if (t != null) rect = MatrixUtils.transformRect(t, rect);
      cur = cur.parent;
    }
    out.add(rect);
  }
  return out;
}

// ── Render-tree helpers ─────────────────────────────────────────────────────

/// A paragraph as it is actually painted on screen.
class PaintedText {
  final String text;
  final Rect bounds;
  final Color color;
  final double fontSize;
  final FontWeight weight;

  PaintedText(this.text, this.bounds, this.color, this.fontSize, this.weight);

  /// WCAG 2.1: 18pt (24px) normal, or 14pt (18.66px) bold, counts as large.
  bool get isLarge => fontSize >= 24.0 || (weight.value >= FontWeight.w700.value && fontSize >= 18.66);

  double get requiredRatio => isLarge ? 3.0 : 4.5;
}

/// Collects every paragraph that is actually visible on screen, with its
/// effective colour and size.
///
/// Walks the *render* tree rather than the semantics tree. The built-in
/// `MinimumTextContrastGuideline` locates text by matching a semantics label
/// back to a `Text` widget with `find.text(label)`, so any text whose node
/// carries a different label — every card in this app, since they merge their
/// contents into one sentence — is silently skipped by it.
///
/// Filtered by `hitTestable()`, because a `RenderParagraph` reports its layout
/// bounds whether or not those pixels were ever painted. A list item scrolled
/// under the bottom bars still has a rect, and sampling it reads the bar's
/// pixels instead of the text's.
List<PaintedText> paintedTexts(WidgetTester tester) {
  final view = tester.binding.renderViews.first;
  final rootTransform = Matrix4.identity();
  view.applyPaintTransform(view.child!, rootTransform);

  final elements = find
      .byElementPredicate((e) => e.renderObject is RenderParagraph)
      .hitTestable()
      .evaluate();

  final out = <PaintedText>[];
  final seen = <RenderParagraph>{};
  for (final element in elements) {
    final node = element.renderObject! as RenderParagraph;
    // A Text element and the RichText it builds both resolve to this same
    // render object; without this every paragraph is measured twice.
    if (!seen.add(node)) continue;
    final span = node.text;
    final style = span.style;
    final color = style?.color;
    final size = style?.fontSize;
    if (color == null || size == null || color.a == 0) continue;

    final t = Matrix4.copy(rootTransform)..multiply(node.getTransformTo(null));
    final rect = MatrixUtils.transformRect(t, node.paintBounds);
    final text = span.toPlainText(includeSemanticsLabels: false);
    if (text.trim().isEmpty || rect.width <= 0 || rect.height <= 0) continue;

    out.add(PaintedText(text, rect, color, size, style?.fontWeight ?? FontWeight.w400));
  }
  return out;
}

/// The rasterised screen, as RGBA bytes plus its dimensions.
class Raster {
  final ByteData bytes;
  final int width;
  final int height;
  Raster(this.bytes, this.width, this.height);

  Color? at(int x, int y) {
    if (x < 0 || y < 0 || x >= width || y >= height) return null;
    final i = (y * width + x) * 4;
    if (i + 3 >= bytes.lengthInBytes) return null;
    return Color.fromARGB(
      bytes.getUint8(i + 3),
      bytes.getUint8(i),
      bytes.getUint8(i + 1),
      bytes.getUint8(i + 2),
    );
  }
}

/// Rasterises the current frame so the *actual painted* background behind each
/// paragraph can be sampled — gradients, translucent tints and overlays
/// included, none of which can be derived from the widget tree alone.
Future<Raster> rasterize(WidgetTester tester) async {
  final view = tester.binding.renderViews.first;
  final layer = view.debugLayer! as OffsetLayer;
  late ui.Image image;
  final bytes = await tester.binding.runAsync<ByteData?>(() async {
    image = await layer.toImage(view.paintBounds, pixelRatio: 1.0);
    final data = await image.toByteData();
    image.dispose();
    return data;
  });
  return Raster(bytes!, view.paintBounds.width.round(), view.paintBounds.height.round());
}

/// What a paragraph actually measures once painted.
class ContrastSample {
  /// The glyph colour as painted — the style colour composited over the
  /// background when it is translucent.
  final Color foreground;
  final Color background;
  final double ratio;
  ContrastSample(this.foreground, this.background, this.ratio);
}

/// Measures the contrast a paragraph actually achieves on screen.
///
/// The background is sampled from a thin ring *just outside* the glyph box,
/// never from inside it. Two earlier attempts sampled inside and both were
/// wrong in ways that hid real failures:
///
///  * "the most common colour in the box is the background" — but `flutter
///    test` falls back to a font that draws glyphs as solid blocks, so the
///    glyph colour usually wins the vote and the text is measured against
///    itself, reporting a comfortable 1.0;
///  * "the most common colour that is not the glyph colour" — on a gradient
///    the background is hundreds of near-identical shades, none of which can
///    out-count the anti-aliased glyph edges, so an edge pixel wins instead.
///
/// Ring pixels are bucketed before the vote so that a gradient's shades count
/// as one background rather than splitting the vote, and the exact mean of the
/// winning bucket is used for the arithmetic.
ContrastSample? sampleContrast(Raster raster, PaintedText text) {
  final inner = text.bounds;
  final outer = inner.inflate(3.0);

  // Text scrolled out of the viewport cannot be read and must not be sampled;
  // clamping its rect to the edge measures pixels it never touched.
  final clamped = Rect.fromLTRB(
    outer.left.clamp(0, raster.width.toDouble()),
    outer.top.clamp(0, raster.height.toDouble()),
    outer.right.clamp(0, raster.width.toDouble()),
    outer.bottom.clamp(0, raster.height.toDouble()),
  );
  if (clamped.width * clamped.height < outer.width * outer.height * 0.9) {
    return null;
  }

  // Bucket the ring, 8 levels per channel, so gradient shades group together.
  final buckets = <int, List<int>>{};
  for (var y = clamped.top.floor(); y < clamped.bottom.ceil(); y++) {
    for (var x = clamped.left.floor(); x < clamped.right.ceil(); x++) {
      if (inner.contains(Offset(x.toDouble(), y.toDouble()))) continue;
      final c = raster.at(x, y);
      if (c == null || c.a == 0) continue;
      final argb = c.toARGB32();
      final key = ((argb >> 19) & 0x1F) << 10 |
          ((argb >> 11) & 0x1F) << 5 |
          ((argb >> 3) & 0x1F);
      (buckets[key] ??= <int>[]).add(argb);
    }
  }
  if (buckets.isEmpty) return null;

  var best = buckets.values.first;
  for (final v in buckets.values) {
    if (v.length > best.length) best = v;
  }
  var r = 0, g = 0, b = 0;
  for (final argb in best) {
    r += (argb >> 16) & 0xFF;
    g += (argb >> 8) & 0xFF;
    b += argb & 0xFF;
  }
  final background =
      Color.fromARGB(255, r ~/ best.length, g ~/ best.length, b ~/ best.length);

  // A translucent style colour is not what the eye sees; composite it over the
  // background it is actually drawn on.
  final foreground = Color.alphaBlend(text.color, background);
  return ContrastSample(
      foreground, background, contrastRatio(foreground, background));
}
