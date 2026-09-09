import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

class SignInBioScreen extends StatelessWidget {
  const SignInBioScreen({super.key});

  //this is the screen that occurrs when the care recipient tries to sign in with their facial scan 
  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final horizontalPadding = isTablet ? 65.0 : 26.0;
    final topPadding = isTablet ? 140.0 : 70.0;
    final bottomPadding = isTablet ? 140.0 : 50.0;

    //the application triggers the facial spin animation to show the user that it is scanning their face
    //and attempts to sign them in
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

    //if the user gets frustrated they are able to go back and their use their password to sign in instead
    return Scaffold(
      backgroundColor: scheme.bg,
      body: Stack(
        children: [
          SafeArea(
            child: Padding(
              padding: EdgeInsets.fromLTRB(horizontalPadding, topPadding, horizontalPadding, bottomPadding),
              child: SingleChildScrollView(
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
