import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';

import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

/// Checks the email field, returning the error to show or null when it is
/// usable.
///
/// Each message says what is wrong *and* what to type instead, with an
/// example, rather than a bare "invalid" (WCAG 2.1 SC 3.3.1 Error
/// Identification, SC 3.3.3 Error Suggestion).
String? validateEmail(String? value) {
  final v = (value ?? '').trim();
  if (v.isEmpty) {
    return 'Enter your email address, for example name@example.com';
  }
  if (!RegExp(r'^[^@\s]+@[^@\s]+\.[^@\s]+$').hasMatch(v)) {
    return 'Check your email address. It should look like name@example.com';
  }
  return null;
}

class SignInPassScreen extends StatefulWidget {
  const SignInPassScreen({super.key});

  @override
  State<SignInPassScreen> createState() => _SignInPassScreenState();
}

class _SignInPassScreenState extends State<SignInPassScreen> {
  final _formKey = GlobalKey<FormState>();
  final _email = TextEditingController(text: patient.email);
  final _emailFocus = FocusNode();
  // Errors are checked when Sign in is pressed, then live as the user types,
  // so a fixed field clears its error straight away.
  AutovalidateMode _autovalidate = AutovalidateMode.disabled;

  @override
  void dispose() {
    _email.dispose();
    _emailFocus.dispose();
    super.dispose();
  }

  /// Signs in, or — if the email cannot be used — stays put, shows the error
  /// under the field, moves focus to it and announces it, so the error is
  /// found whether the user is looking, tabbing or listening.
  void _signIn() {
    if (_formKey.currentState!.validate()) {
      context.go('/today');
      return;
    }
    setState(() => _autovalidate = AutovalidateMode.onUserInteraction);
    _emailFocus.requestFocus();
    announceStatus(context, 'Not signed in. ${validateEmail(_email.text)}');
  }

  //builds the normal sign in screen that allows the user to use their password to sign in
  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final isTablet = MediaQuery.of(context).size.width >= 700;
    final horizontalPadding = isTablet ? 65.0 : 26.0;
    final topPadding = isTablet ? 110.0 : 50.0;
    final bottomPadding = isTablet ? 130.0 : 50.0;

    //the user can go back to their landing screen
    final fields = Form(
      key: _formKey,
      autovalidateMode: _autovalidate,
      child: Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        AuthBtn(
          label: '← Back',
          semanticLabel: 'Back to welcome screen',
          variant: 'text',
          lg: isTablet,
          onPressed: () => context.go('/landing'),
        ),
        const SizedBox(height: 12),
        Semantics(
          header: true,
          headingLevel: 1,
          child: Text(
            'Sign in',
            style: TextStyle(
              fontSize: isTablet ? 36 : 28,
              fontWeight: FontWeight.w800,
              color: scheme.text,
            ),
          ),
        ),
        const SizedBox(height: 24),
        AuthField(
          label: 'Email address',
          value: patient.email,
          filled: true,
          controller: _email,
          focusNode: _emailFocus,
          validator: validateEmail,
          helper: 'We will never share this.',
          keyboardType: TextInputType.emailAddress,
          lg: isTablet,
        ),
        const SizedBox(height: 16),
        AuthField(
          label: 'Password',
          value: '••••••••',
          helper: 'Your password manager can fill this for you.',
          obscure: true,
          lg: isTablet,
        ),
        const SizedBox(height: 8),
      ],
      ),
    );

    // allows the user to sign in using their password or go to sign in using Face ID
    final actions = Column(
      children: [
        AuthBtn(
          label: 'Sign in',
          lg: isTablet,
          onPressed: _signIn,
        ),
        const SizedBox(height: 16),
        AuthBtn(
          label: 'Use Face ID instead',
          variant: 'text',
          lg: isTablet,
          onPressed: () => context.go('/sign-in-bio'),
        ),
      ],
    );

    return Scaffold(
      backgroundColor: scheme.bg,
      body: Stack(
        children: [
          SafeArea(
            child: SingleChildScrollView(
              padding: EdgeInsets.fromLTRB(
                horizontalPadding,
                topPadding,
                horizontalPadding,
                bottomPadding,
              ),
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
