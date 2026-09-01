import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

class LandingScreen extends StatelessWidget {
  const LandingScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final h = MediaQuery.of(context).size.height;

    return Scaffold(
      backgroundColor: scheme.bg,
      body: Stack(
        children: [
          SafeArea(
            child: Padding(
              padding: EdgeInsets.symmetric(
                horizontal: isTablet ? 65 : 26,
                vertical: isTablet ? 140 : 50,
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Brand block
                  Column(
                    children: [
                      AuthLogo(lg: isTablet),
                      SizedBox(height: h * 0.03),
                      Text(
                        'CareConnect',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: isTablet ? 40 : 32,
                          fontWeight: FontWeight.w800,
                          color: scheme.text,
                        ),
                      ),
                      const SizedBox(height: 16),
                      Text(
                        'Your caregiver sets reminders and appointments; you simply check things off. Everyone stays on the same page.',
                        textAlign: TextAlign.center,
                        style: TextStyle(
                          fontSize: isTablet ? 26 : 20,
                          color: scheme.sub,
                          height: 1.5,
                        ),
                      ),
                    ],
                  ),
                  Column(
                    children: [
                      AuthBtn(
                        label: 'Create account',
                        lg: isTablet,
                        onPressed: () => context.go('/create-account'),
                      ),
                      SizedBox(height: isTablet ? 30 : 24),
                      AuthBtn(
                        label: 'Sign in',
                        variant: 'secondary',
                        lg: isTablet,
                        onPressed: () => context.go('/sign-in-pass'),
                      ),
                    ],
                  ),
                ],
              ),
            ),
          ),
          const ThemeToggleBtn(),
        ],
      ),
    );
  }
}
