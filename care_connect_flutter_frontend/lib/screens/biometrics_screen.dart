import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

class BiometricsScreen extends StatelessWidget {
  const BiometricsScreen({super.key});

  //the building of the actual biometrics screen
  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final horizontalPadding = isTablet ? 65.0 : 26.0;
    final topPadding = isTablet ? 110.0 : 60.0;
    final bottomPadding = isTablet ? 130.0 : 50.0;

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

    //the list of actions being built into the buttons with the application
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
              padding: EdgeInsets.fromLTRB(horizontalPadding, topPadding, horizontalPadding, bottomPadding),
              child: SingleChildScrollView(
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
