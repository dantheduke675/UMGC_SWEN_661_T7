import 'package:flutter/material.dart';
import 'package:flutter/services.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import 'theme.dart';
import 'screens/landing_screen.dart';
import 'screens/create_account_screen.dart';
import 'screens/biometrics_screen.dart';
import 'screens/sign_in_bio_screen.dart';
import 'screens/sign_in_pass_screen.dart';


void main() {
  WidgetsFlutterBinding.ensureInitialized();
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

final _router = GoRouter(
  initialLocation: '/landing',
  routes: [
    GoRoute(path: '/landing',         builder: (_, __) => const LandingScreen()),
    GoRoute(path: '/create-account',  builder: (_, __) => const CreateAccountScreen()),
    GoRoute(path: '/biometrics',      builder: (_, __) => const BiometricsScreen()),
    GoRoute(path: '/sign-in-bio',     builder: (_, __) => const SignInBioScreen()),
    GoRoute(path: '/sign-in-pass',    builder: (_, __) => const SignInPassScreen()),
  ],
);

class CareConnectApp extends StatelessWidget {
  const CareConnectApp({super.key});

  @override
  Widget build(BuildContext context) {
    final themeNotifier = context.watch<ThemeNotifier>();
    return MaterialApp.router(
      title: 'CareConnect',
      debugShowCheckedModeBanner: false,
      theme: buildTheme(false),
      darkTheme: buildTheme(true),
      themeMode: themeNotifier.isDark ? ThemeMode.dark : ThemeMode.light,
      routerConfig: _router,
    );
  }
}

const _navItems = [
  (path: '/today',       label: 'Today',       icon: '🏠'),
  (path: '/medications', label: 'Medications',  icon: '💊'),
  (path: '/messages',    label: 'Messages',     icon: '💬'),
  (path: '/schedule',    label: 'Schedule',     icon: '📅'),
  (path: '/symptoms',    label: 'Symptoms',     icon: '📊'),
  (path: '/account',     label: 'Account',      icon: '👤'),
];

class AppShell extends StatelessWidget {
  final Widget child;
  const AppShell({super.key, required this.child});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final location = GoRouterState.of(context).matchedLocation;
    final isThread   = location.startsWith('/messages/');
    final isCalling  = location.startsWith('/calling/');
    final isFullScreen = isThread || isCalling;
    final currentIdx = _navItems.indexWhere((n) => location.startsWith(n.path));

    return Scaffold(
      backgroundColor: scheme.bg,
      body: child,
      bottomNavigationBar: isFullScreen ? null : Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          _AccessBar(scheme: scheme),
          _BottomNav(
            scheme: scheme,
            currentIdx: currentIdx < 0 ? 0 : currentIdx,
            onTap: (i) => context.go(_navItems[i].path),
          ),
        ],
      ),
    );
  }
}

class _BottomNav extends StatelessWidget {
  final CScheme scheme;
  final int currentIdx;
  final void Function(int) onTap;
  const _BottomNav({required this.scheme, required this.currentIdx, required this.onTap});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 76,
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.border)),
      ),
      child: Row(
        children: List.generate(_navItems.length, (i) {
          final active = i == currentIdx;
          final item = _navItems[i];
          return Expanded(
            child: GestureDetector(
              onTap: () => onTap(i),
              behavior: HitTestBehavior.opaque,
              child: Stack(
                alignment: Alignment.topCenter,
                children: [
                  if (active)
                    Container(
                      width: 36, height: 4,
                      decoration: BoxDecoration(
                        color: scheme.primary,
                        borderRadius: const BorderRadius.vertical(bottom: Radius.circular(4)),
                      ),
                    ),
                  Center(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        Text(item.icon, style: const TextStyle(fontSize: 24)),
                        const SizedBox(height: 2),
                        Text(
                          item.label,
                          style: TextStyle(
                            fontSize: 11, fontWeight: FontWeight.w700,
                            color: active ? scheme.primary : scheme.sub,
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
    );
  }
}

class _AccessBar extends StatelessWidget {
  final CScheme scheme;
  const _AccessBar({required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Container(
      height: 64,
      decoration: BoxDecoration(
        color: scheme.surface,
        border: Border(top: BorderSide(color: scheme.border)),
      ),
      padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
      child: Row(
        children: [
          _accessBtn(context, '↑', 'Scroll up', scheme, onTap: () {}),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {},
            child: Container(
              width: 72, height: 48,
              decoration: BoxDecoration(
                color: scheme.primary,
                borderRadius: BorderRadius.circular(16),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  const Text('🎤', style: TextStyle(fontSize: 20)),
                  Text('Voice', style: TextStyle(fontSize: 11, color: Colors.white, fontWeight: FontWeight.w700)),
                ],
              ),
            ),
          ),
          const SizedBox(width: 8),
          _accessBtn(context, '↓', 'Scroll down', scheme, onTap: () {}),
        ],
      ),
    );
  }

  Widget _accessBtn(BuildContext context, String icon, String label, CScheme scheme, {required VoidCallback onTap}) {
    return Expanded(
      child: GestureDetector(
        onTap: onTap,
        child: Container(
          height: 48,
          decoration: BoxDecoration(
            color: scheme.surface2,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: scheme.border, width: 2),
          ),
          child: Column(
            mainAxisAlignment: MainAxisAlignment.center,
            children: [
              Text(icon, style: TextStyle(fontSize: 20, color: scheme.sub)),
              Text(label, style: TextStyle(fontSize: 11, color: scheme.sub, fontWeight: FontWeight.w700)),
            ],
          ),
        ),
      ),
    );
  }
}
