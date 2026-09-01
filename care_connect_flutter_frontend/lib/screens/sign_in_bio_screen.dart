import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

class SignInBioScreen extends StatelessWidget {
  const SignInBioScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final px = isTablet ? 65.0 : 26.0;
    final pt = isTablet ? 140.0 : 70.0;
    final pb = isTablet ? 140.0 : 50.0;

    final content = Column(
      children: [
        AuthLogoSmall(lg: isTablet),
        const SizedBox(height: 24),
        Text(
          'Welcome back, Maddy',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: isTablet ? 36 : 28, fontWeight: FontWeight.w800, color: scheme.text),
        ),
        const SizedBox(height: 16),
        Text(
          'Signing you in now. Look at your phone — there is nothing to tap.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: isTablet ? 22 : 18, color: scheme.sub, height: 1.5),
        ),
        const SizedBox(height: 24),
        AuthStatusRing(lg: isTablet),
        const SizedBox(height: 24),
        AuthSpinner(label: 'Looking for your face…', lg: isTablet),
        const SizedBox(height: 20),
        Text(
          'A failed attempt never locks your account and never makes you wait. You will stay signed in afterwards.',
          textAlign: TextAlign.center,
          style: TextStyle(fontSize: isTablet ? 20 : 16, color: scheme.muted, height: 1.5),
        ),
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
                      children: [
                        content,
                        AuthBtn(
                          label: 'Use my password instead',
                          variant: 'secondary',
                          lg: isTablet,
                          onPressed: () => context.go('/sign-in-pass'),
                        ),
                      ],
                    )
                  : SingleChildScrollView(
                      child: Column(
                        children: [
                          content,
                          const SizedBox(height: 24),
                          AuthBtn(
                            label: 'Use my password instead',
                            variant: 'secondary',
                            lg: isTablet,
                            onPressed: () => context.go('/sign-in-pass'),
                          ),
                        ],
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
