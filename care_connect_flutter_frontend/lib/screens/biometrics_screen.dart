import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

class BiometricsScreen extends StatelessWidget {
  const BiometricsScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final px = isTablet ? 65.0 : 26.0;
    final pt = isTablet ? 110.0 : 60.0;
    final pb = isTablet ? 130.0 : 50.0;

    final content = Column(
      children: [
        AuthLogoSmall(lg: isTablet),
        const SizedBox(height: 24),
        Text(
          'Sign in with your face?',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: isTablet ? 36 : 28, fontWeight: FontWeight.w800, color: scheme.text),
        ),
        const SizedBox(height: 16),
        Text(
          'You would open CareConnect just by looking at it. No password, no keyboard.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: isTablet ? 22 : 18, color: scheme.sub, height: 1.5),
        ),
        const SizedBox(height: 24),
        AuthStatusRing(lg: isTablet),
        const SizedBox(height: 24),
        Text(
          'Your face is never sent anywhere. It stays on this phone and is handled by iOS. You can change this at any time from the menu.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: isTablet ? 20 : 16, color: scheme.muted, height: 1.5),
        ),
      ],
    );

    final actions = Column(
      children: [
        AuthBtn(label: 'Yes, use Face ID', lg: isTablet, onPressed: () => context.go('/sign-in-bio')),
        const SizedBox(height: 16),
        AuthBtn(label: 'No, use my password', variant: 'secondary', lg: isTablet, onPressed: () => context.go('/sign-in-pass')),
      ],
    );

    return Scaffold(
      backgroundColor: scheme.bg,
      body: Stack(
        children: [
          SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(px, pt, px, pb),
              child: isTablet
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [content, actions],
                    )
                  : SingleChildScrollView(
                      child: Column(
                        children: [content, const SizedBox(height: 24), actions],
                      ),
                    ),
            ),
          ),
          const ThemeToggleBtn(),
        ],
      ),
    );
  }
}
