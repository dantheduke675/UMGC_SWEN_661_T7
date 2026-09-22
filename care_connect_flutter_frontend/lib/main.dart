import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'action_history.dart';
import 'theme.dart';
import 'widgets.dart';
import 'screens/landing_screen.dart';
import 'screens/create_account_screen.dart';
import 'screens/biometrics_screen.dart';
import 'screens/sign_in_bio_screen.dart';
import 'screens/sign_in_pass_screen.dart';
import 'screens/today_screen.dart';
import 'screens/medications_screen.dart';
import 'screens/schedule_screen.dart';
import 'screens/symptoms_screen.dart';
import 'screens/messages_screen.dart';
import 'screens/msg_thread_screen.dart';
import 'screens/account_screen.dart';
import 'screens/calling_screen.dart';

/// Set by the end-to-end build: `--dart-define=E2E_SEMANTICS=true`.
///
/// Flutter does not publish an accessibility tree to Android or iOS until
/// something asks for one. In normal use TalkBack or VoiceOver asks, and the
/// tree appears. A UI automation tool reads that same tree but does not
/// trigger it, so to Maestro the app looked like a single blank
/// FlutterView — every label, role and state invisible.
///
/// Turning semantics on for the E2E build is what makes the flows in
/// .maestro/ meaningful: they assert against precisely the nodes a screen
/// reader would read, on the device, after they have crossed out of the
/// framework. It stays off by default because keeping the tree built and
/// updated costs work on every frame, and real users get it for free the
/// moment their screen reader is switched on.
const _e2eSemantics = bool.fromEnvironment('E2E_SEMANTICS');

void main() {
  WidgetsFlutterBinding.ensureInitialized();
  if (_e2eSemantics) {
    // Deliberately never disposed: the handle keeps semantics alive for the
    // life of the process.
    SemanticsBinding.instance.ensureSemantics();
  }
  SystemChrome.setPreferredOrientations([
    DeviceOrientation.portraitUp,
    DeviceOrientation.landscapeLeft,
    DeviceOrientation.landscapeRight,
  ]);
  runApp(
    ChangeNotifierProvider(
      create: (_) => ThemeNotifier(),
      child: const CareConnectApp(),
    ),
  );
}

//this is all the page naviagtion between screens as well as building all the possible routes
//
// Public, and deliberately so: it is a top-level singleton, so its location
// survives a second `runApp`. The integration tests under integration_test/
// launch the real app once per test and need to return it to a known route
// between them; without a handle on the router each test would start wherever
// the previous one finished.
final appRouter = GoRouter(
  initialLocation: '/landing',
  routes: [
    GoRoute(path: '/landing',         builder: (_, _) => const LandingScreen()),
    GoRoute(path: '/create-account',  builder: (_, _) => const CreateAccountScreen()),
    GoRoute(path: '/biometrics',      builder: (_, _) => const BiometricsScreen()),
    GoRoute(path: '/sign-in-bio',     builder: (_, _) => const SignInBioScreen()),
    GoRoute(path: '/sign-in-pass',    builder: (_, _) => const SignInPassScreen()),
    ShellRoute(
      builder: (context, state, child) => AppShell(child: child),
      routes: [
        GoRoute(path: '/today',       builder: (_, _) => const TodayScreen()),
        GoRoute(path: '/medications', builder: (_, _) => const MedicationsScreen()),
        GoRoute(path: '/schedule',    builder: (_, _) => const ScheduleScreen()),
        GoRoute(path: '/symptoms',    builder: (_, _) => const SymptomsScreen()),
        GoRoute(path: '/messages',    builder: (_, _) => const MessagesScreen()),
        GoRoute(
          path: '/messages/:threadId',
          builder: (_, state) => MsgThreadScreen(threadId: int.parse(state.pathParameters['threadId']!)),
        ),
        GoRoute(path: '/account',     builder: (_, _) => const AccountScreen()),
        GoRoute(
          path: '/calling/:contactId',
          builder: (_, state) => CallingScreen(contactId: int.parse(state.pathParameters['contactId']!)),
        ),
      ],
    ),
  ],
);

// this of course actually builds the care connect application
class CareConnectApp extends StatelessWidget {
  const CareConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeNotifier = context.watch<ThemeNotifier>();
    return ChangeNotifierProvider<ActionHistory>(
      create: (_) => ActionHistory(),
      child: MaterialApp.router(
        title: 'CareConnect',
        debugShowCheckedModeBanner: false,
        theme: buildTheme(false),
        darkTheme: buildTheme(true),
        themeMode: themeNotifier.isDark ? ThemeMode.dark : ThemeMode.light,
        routerConfig: appRouter,
      ),
    );
  }
}

// ── Shared nav items ────────────────────────────────────────────────────────────

const _navItems = [
  (path: '/today',       label: 'Today',       icon: '🏠'),
  // "Meds", not "Medications": the full word wrapped to two lines in the tab
  // and had to be given a taller bar to survive (see _BottomNav). This label
  // is the tab's accessible name as well as its visible text, so the two
  // cannot drift apart — the screen reader says what the tab says
  // (SC 2.5.3 Label in Name). The screen's own heading stays "Medications".
  (path: '/medications', label: 'Meds',         icon: '💊'),
  (path: '/messages',    label: 'Messages',     icon: '💬'),
  (path: '/schedule',    label: 'Schedule',     icon: '📅'),
  (path: '/symptoms',    label: 'Symptoms',     icon: '📊'),
  (path: '/account',     label: 'Account',      icon: '👤'),
];

// ── App shell with adaptive bottom nav ─────────────────────────────────────────

class AppShell extends StatefulWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  State<AppShell> createState() => _AppShellState();
}

class _AppShellState extends State<AppShell> {
  final ScrollController _scrollController = ScrollController();

  @override
  void dispose() {
    _scrollController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final location = GoRouterState.of(context).matchedLocation;
    final isCalling  = location.startsWith('/calling/');
    final isFullScreen = isCalling;
    final currentIdx = _navItems.indexWhere((n) => location.startsWith(n.path));

    // A plain Provider (not PrimaryScrollController) so each nested route's
    // own ModalRoute-provided PrimaryScrollController can't shadow it - tab
    // screens read this directly and pass it to their top-level ListView.
    return ChangeNotifierProvider<ScrollController>.value(
      value: _scrollController,
      child: Scaffold(
        backgroundColor: scheme.bg,
        body: widget.child,
        bottomNavigationBar: isFullScreen ? null : Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            // Accessibility bar
            _AccessBar(scheme: scheme),
            // Bottom nav
            _BottomNav(
              scheme: scheme,
              currentIdx: currentIdx < 0 ? 0 : currentIdx,
              onTap: (i) => context.go(_navItems[i].path),
            ),
          ],
        ),
      ),
    );
  }
}

//this builds the bottom navigation bar and allows for naviagtion between the pages 
class _BottomNav extends StatelessWidget {
  final CScheme scheme;
  final int currentIdx;
  final void Function(int) onTap;
  const _BottomNav({required this.scheme, required this.currentIdx, required this.onTap});

  @override
  Widget build(BuildContext context) {
    // No fixed height: at 130% text scale a 76px bar already clipped its
    // labels, and at 200% it overflowed by 72px (WCAG 2.1 SC 1.4.4). The bar
    // now sizes to its content and keeps a floor only.
    //
    // That floor is 92 rather than 76 because of a second, subtler failure
    // the on-device integration tests turned up. `google_fonts` fetches Inter
    // at runtime, so the first layout happens with the fallback font, where
    // the longest label fits on one line by a hair; when Inter lands it wraps
    // to two. `IntrinsicHeight` gives its child tight constraints, which makes
    // that subtree a relayout boundary, so the height measured against the
    // fallback font is never recomputed and the second line is clipped — 13px
    // of overflow, on every launch, at default text size.
    //
    // The label that did this was "Medications", now shortened to "Meds", so
    // nothing wraps at default size any more. The floor stays: it is what
    // keeps the bar from resizing between the fallback font and Inter, and it
    // is still the headroom the remaining labels need as text scales up.
    // Above ~120% they wrap under the fallback font too, so IntrinsicHeight
    // sees it coming and the floor stops mattering.
    return Container(
      constraints: const BoxConstraints(minHeight: 92),
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.border)),
      ),
      // IntrinsicHeight bounds the row so `stretch` can make every tab the
      // same height without the unbounded parent forcing an infinite one.
      child: IntrinsicHeight(
        child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: List.generate(_navItems.length, (i) {
          final active = i == currentIdx;
          final item = _navItems[i];
          return Expanded(
            // The active tab was previously signalled by colour and a small
            // bar only. `selected` puts that state in the semantics tree so a
            // screen reader announces which tab you are on, and the hint
            // gives position within the bar (SC 4.1.2, SC 1.3.1).
            child: CTappable(
              label: item.label,
              hint: 'Tab ${i + 1} of ${_navItems.length}',
              selected: active,
              borderRadius: BorderRadius.zero,
              onTap: () => onTap(i),
              child: Stack(
                alignment: Alignment.topCenter,
                children: [
                  // The indicator is positioned so it takes no part in sizing
                  // the Stack; the label column alone decides the height.
                  if (active)
                    Positioned(
                      top: 0, left: 0, right: 0,
                      child: Center(
                        child: Container(
                          width: 36, height: 4,
                          decoration: BoxDecoration(
                            color: scheme.primary,
                            borderRadius: const BorderRadius.vertical(bottom: Radius.circular(4)),
                          ),
                        ),
                      ),
                    ),
                  Padding(
                    padding: const EdgeInsets.symmetric(horizontal: 2, vertical: 10),
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      mainAxisAlignment: MainAxisAlignment.center,
                      children: [
                        CGlyph(item.icon, style: const TextStyle(fontSize: 24)),
                        const SizedBox(height: 2),
                        Text(
                          item.label,
                          textAlign: TextAlign.center,
                          style: TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w700,
                            // The active tab measured 3.12:1 before this.
                            color: active
                                ? readableOn(scheme.primary, scheme.surface)
                                : scheme.sub,
                          ),
                        ),
                      ],
                    ),
                  ),
                ],
              ),
            ),
          );
        }),
      ),
      ),
    );
  }
}

//this is the bar on which the options for scrolling and other accesibility options sit and are built
class _AccessBar extends StatelessWidget {
  final CScheme scheme;
  const _AccessBar({required this.scheme});

  @override
  Widget build(BuildContext context) {
    // Same story as the nav bar: a fixed 64px clipped at 130% scale.
    return Container(
      constraints: const BoxConstraints(minHeight: 64),
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: IntrinsicHeight(
        child: Row(
        crossAxisAlignment: CrossAxisAlignment.stretch,
        children: [
          _accessBtn(context, '↑', 'Scroll up', scheme, onTap: () => _scroll(context, -220)),
          const SizedBox(width: 8),
          // Voice input is not implemented. Announcing it as an enabled button
          // told screen reader users a control existed that did nothing; it is
          // now explicitly disabled and says so (SC 4.1.2).
          CTappable(
            label: 'Voice input',
            hint: 'Not available yet',
            onTap: null,
            borderRadius: BorderRadius.circular(16),
            child: Container(
              // minWidth/minHeight rather than fixed: keeps the 48x48 floor
              // while letting the control grow with the user's text size.
              constraints: const BoxConstraints(minWidth: 72, minHeight: 48),
              padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
              decoration: BoxDecoration(
                color: scheme.primary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisSize: MainAxisSize.min,
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const CGlyph('🎤', style: TextStyle(fontSize: 20)),
                  Text('Voice',
                      textAlign: TextAlign.center,
                      style: const TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          _accessBtn(context, '↓', 'Scroll down', scheme, onTap: () => _scroll(context, 220)),
        ],
      ),
      ),
    );
  }

  //this helps to build the scroll buttons and allows for the buttons to actually scroll on the application
  void _scroll(BuildContext context, double delta) {
    final ctrl = context.read<ScrollController>();
    if (!ctrl.hasClients) return;
    final target = (ctrl.offset + delta).clamp(
      ctrl.position.minScrollExtent,
      ctrl.position.maxScrollExtent,
    );
    ctrl.animateTo(target,
        duration: const Duration(milliseconds: 300), curve: Curves.easeInOut);
  }

  //this is the button that allows for the user to access the application.
  Widget _accessBtn(BuildContext context, String icon, String label, CScheme scheme, {required VoidCallback onTap}) {
    return Expanded(
      child: CTappable(
        label: label,
        borderRadius: BorderRadius.circular(16),
        onTap: onTap,
        child: Container(
          constraints: const BoxConstraints(minHeight: 48),
          padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 4),
          decoration: BoxDecoration(
            color: scheme.surface2,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: scheme.controlBorder, width: 2),
          ),
          // The FittedBox that used to wrap this shrank the label back down
          // as the user scaled text up, actively defeating their setting
          // (SC 1.4.4). The column simply grows instead.
          child: Column(
            mainAxisSize: MainAxisSize.min,
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              CGlyph(icon, style: TextStyle(fontSize: 20, color: scheme.sub)),
              Text(label,
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 11, color: scheme.sub, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
