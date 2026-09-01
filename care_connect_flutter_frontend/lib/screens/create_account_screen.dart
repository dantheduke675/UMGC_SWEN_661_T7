import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

class CreateAccountScreen extends StatelessWidget {
  const CreateAccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final px = isTablet ? 65.0 : 26.0;
    final pt = isTablet ? 110.0 : 16.0;
    final pb = isTablet ? 130.0 : 24.0;

    final topSection = Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AuthBtn(label: '← Back', variant: 'text', lg: isTablet, onPressed: () => context.go('/landing')),
        const SizedBox(height: 12),
        Text(
          'Create your account',
          style: TextStyle(fontSize: isTablet ? 30 : 24, fontWeight: FontWeight.w800, color: scheme.text),
        ),
        const SizedBox(height: 24),
        AuthField(label: 'Full name', value: 'Maddy Chen', filled: true, lg: isTablet),
        const SizedBox(height: 16),
        AuthField(label: 'Email address', value: 'maddy@example.com', filled: true, lg: isTablet),
        const SizedBox(height: 16),
        AuthField(label: 'Password', value: '••••••••••', helper: 'At least 8 characters.', lg: isTablet),
        const SizedBox(height: 24),
        Text(
          'I AM A…',
          style: TextStyle(
            fontSize: isTablet ? 20 : 16,
            fontWeight: FontWeight.w700,
            color: scheme.sub,
            letterSpacing: 0.96,
          ),
        ),
      ],
    );

    final roleTiles = Column(
      children: [
        AuthRoleTile(role: 'recipient', lg: isTablet, onPressed: () => context.go('/biometrics')),
        const SizedBox(height: 16),
        AuthRoleTile(role: 'caregiver', lg: isTablet),
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
                      children: [topSection, const SizedBox(height: 32), roleTiles],
                    )
                  : Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [topSection, const SizedBox(height: 16), roleTiles],
                    ),
            ),
          ),
          const ThemeToggleBtn(),
        ],
      ),
    );
  }
}
