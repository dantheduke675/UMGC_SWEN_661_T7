import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

class SignInPassScreen extends StatelessWidget {
  const SignInPassScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final px = isTablet ? 65.0 : 26.0;
    final pt = isTablet ? 110.0 : 50.0;
    final pb = isTablet ? 130.0 : 50.0;

    final fields = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AuthBtn(label: '← Back', variant: 'text', lg: isTablet, onPressed: () => context.go('/landing')),
        const SizedBox(height: 12),
        Text(
          'Sign in',
          style: TextStyle(fontSize: isTablet ? 36 : 28, fontWeight: FontWeight.w800, color: scheme.text),
        ),
        const SizedBox(height: 24),
        AuthField(
          label: 'Email address',
          value: 'maddy@example.com',
          filled: true,
          helper: 'We will never share this.',
          lg: isTablet,
        ),
        const SizedBox(height: 16),
        AuthField(
          label: 'Password',
          value: '••••••••',
          helper: 'Your password manager can fill this for you.',
          lg: isTablet,
        ),
        const SizedBox(height: 8),
      ],
    );

    final actions = Column(
      children: [
        AuthBtn(label: 'Sign in', lg: isTablet, onPressed: () => context.go('/today')),
        const SizedBox(height: 16),
        AuthBtn(label: 'Use Face ID instead', variant: 'text', lg: isTablet, onPressed: null), // we will have to assing the onpressed to an actual go route navigation once we work on those screens
      ],
    );

    return Scaffold(
      backgroundColor: scheme.bg,
      body: Stack(
        children: [
          SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(px, pt, px, pb),
              child: isTablet
                  ? Column(
                      mainAxisAlignment: MainAxisAlignment.spaceBetween,
                      children: [fields, const SizedBox(height: 32), actions],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [fields, const SizedBox(height: 16), actions],
                    ),
            ),
          ),
          const ThemeToggleBtn(),
        ],
      ),
    );
  }
}
