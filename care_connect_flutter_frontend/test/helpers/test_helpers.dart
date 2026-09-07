import 'package:flutter/foundation.dart';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'package:care_connect_flutter_frontend/theme.dart';
import 'package:flutter_test/flutter_test.dart';

/// Stub screen rendered when a navigation target is reached in tests.
class NavStub extends StatelessWidget {
  final String name;
  const NavStub(this.name, {super.key});
  @override
  Widget build(BuildContext context) => Scaffold(body: Text('stub:$name'));
}

/// Wraps [child] with `Provider<ThemeNotifier>` and GoRouter stubs so widget
/// tests can render any screen without needing the full app shell.
///
/// If [themeNotifier] is supplied it is used directly; otherwise one is created
/// with [isDark].
Widget buildTestApp({
  required Widget child,
  ThemeNotifier? themeNotifier,
  bool isDark = true,
}) {
  final notifier = themeNotifier ?? ThemeNotifier(isDark: isDark);

  final router = GoRouter(
    initialLocation: '/',
    routes: [
      GoRoute(path: '/',              builder: (_, _) => child),
      GoRoute(path: '/landing',       builder: (_, _) => const NavStub('landing')),
      GoRoute(path: '/create-account',builder: (_, _) => const NavStub('create-account')),
      GoRoute(path: '/biometrics',    builder: (_, _) => const NavStub('biometrics')),
      GoRoute(path: '/sign-in-bio',   builder: (_, _) => const NavStub('sign-in-bio')),
      GoRoute(path: '/sign-in-pass',  builder: (_, _) => const NavStub('sign-in-pass')),
      GoRoute(path: '/today',         builder: (_, _) => const NavStub('today')),
      GoRoute(path: '/messages',      builder: (_, _) => const NavStub('messages')),
      GoRoute(path: '/messages/:id',  builder: (_, _) => const NavStub('messages-thread')),
      GoRoute(path: '/calling/:id',   builder: (_, _) => const NavStub('calling')),
    ],
  );

  return ChangeNotifierProvider<ThemeNotifier>.value(
    value: notifier,
    child: MaterialApp.router(
      routerConfig: router,
      theme: buildTheme(false),
      darkTheme: buildTheme(true),
      themeMode: notifier.isDark ? ThemeMode.dark : ThemeMode.light,
    ),
  );
}

/// Minimal wrapper without GoRouter — for isolated widget tests that don't navigate.
Widget wrapWidget(Widget child, {bool isDark = true, ThemeNotifier? notifier}) {
  final n = notifier ?? ThemeNotifier(isDark: isDark);
  return ChangeNotifierProvider<ThemeNotifier>.value(
    value: n,
    child: MaterialApp(
      theme: buildTheme(false),
      darkTheme: buildTheme(true),
      themeMode: n.isDark ? ThemeMode.dark : ThemeMode.light,
      home: Scaffold(body: Center(child: child)),
    ),
  );
}

/// The default flutter_test surface (800×600) is too short for several
/// screens at their tablet breakpoint (>=700 logical px wide), causing
/// RenderFlex overflows, and too short to lay out long ListViews in full —
/// which leaves off-screen items unbuilt and unfindable by `find.text`.
/// Widening the height (keeping width, so tablet/phone breakpoints are
/// unaffected) gives every screen room to lay out completely.
void _useTallSurface(WidgetTester tester) {
  final originalSize = tester.view.physicalSize;
  final originalRatio = tester.view.devicePixelRatio;
  tester.view.physicalSize = const Size(800, 5000);
  tester.view.devicePixelRatio = 1.0;
  addTearDown(() {
    tester.view.physicalSize = originalSize;
    tester.view.devicePixelRatio = originalRatio;
  });
}

/// Pumps the widget and waits for GoRouter to settle.
/// Use this for screens WITHOUT infinite animations.
Future<void> pumpScreen(WidgetTester tester, Widget app) async {
  _useTallSurface(tester);
  await tester.pumpWidget(app);
  await tester.pumpAndSettle();
}

/// Pumps the widget for screens WITH infinite animations (e.g. SignInBioScreen).
/// Does NOT call pumpAndSettle because that would time out.
Future<void> pumpScreenWithAnimation(WidgetTester tester, Widget app) async {
  _useTallSurface(tester);
  await tester.pumpWidget(app);
  await tester.pump();                              // first frame — GoRouter initialises
  await tester.pump(const Duration(milliseconds: 50)); // second frame — screen content renders
}

/// Substring of the google_fonts "unable to load font" warning that fires
/// from a fire-and-forget future kicked off by `GoogleFonts.interTextTheme`
/// (see google_fonts_base.dart's `loadFontIfNecessary`) whenever the font
/// isn't bundled as an asset. Expected and harmless under a sandboxed test
/// runner — the returned TextStyle already falls back to the pre-bundled
/// family — but it can't be caught with a try/catch around `buildTheme()`
/// since it's reported via `debugPrint`, not a thrown/rethrown exception the
/// caller observes.
///
/// Only plain `test()`/`setUpAll()` bodies (e.g. theme_test.dart) ever
/// observe this: they run on the real event loop, so the underlying asset
/// load future resolves and its rejection is reported before the group ends.
/// `testWidgets()` bodies run on `FakeAsync`, where that real I/O future
/// never resolves, so this is never needed (or safe to use) there.
const _googleFontsNoise = 'google_fonts was unable to load font';
DebugPrintCallback? _savedDebugPrint;
var _googleFontsFollowUpLinesToSuppress = 0;

/// Call from `setUpAll` before invoking `buildTheme()`. Pair with
/// [restoreGoogleFontsNoiseFilter] in `tearDownAll` of the same group.
void installGoogleFontsNoiseFilter() {
  final passthrough = debugPrint;
  _savedDebugPrint = passthrough;
  debugPrint = (String? message, {int? wrapWidth}) {
    if (message != null && message.contains(_googleFontsNoise)) {
      // google_fonts logs this as 3 separate debugPrint calls: the noise
      // line itself, then 2 "how to fix this" follow-up lines that don't
      // repeat the noise substring.
      _googleFontsFollowUpLinesToSuppress = 2;
      return;
    }
    if (_googleFontsFollowUpLinesToSuppress > 0) {
      _googleFontsFollowUpLinesToSuppress--;
      return;
    }
    passthrough(message, wrapWidth: wrapWidth);
  };
}

/// Call from `tearDownAll`, paired with [installGoogleFontsNoiseFilter].
void restoreGoogleFontsNoiseFilter() {
  final saved = _savedDebugPrint;
  if (saved != null) {
    debugPrint = saved;
    _savedDebugPrint = null;
  }
}
