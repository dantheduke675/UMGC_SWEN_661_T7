import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

class CTokens {
  static const primary = Color(0xFF357C6F);
  static const primaryLight = Color(0xFF2F7A6B);
  static const caregiverPurple = Color(0xFF684BE6);
  static const danger = Color(0xFFC53030);
  static const planIndigo = Color(0xFF6366F1);

  static const darkBg       = Color(0xFF0E131D);
  static const darkSurface  = Color(0xFF1D2534);
  static const darkSurface2 = Color(0xFF141A27);
  static const darkBorder   = Color(0xFF333D4F);
  static const darkInputBorder = Color(0xFF7A8599);
  static const darkText     = Color(0xFFF5F7FA);
  static const darkSub      = Color(0xFF9EA8BD);
  static const darkMuted    = Color(0xFF828DA1);
  static const darkLink     = Color(0xFF59AD9E);

  static const lightBg       = Color(0xFFF6F7F9);
  static const lightSurface  = Color(0xFFF2F3F5);
  static const lightSurface2 = Color(0xFFE8EAED);
  static const lightBorder   = Color(0xFFE0E2E6);
  static const lightInputBorder = Color(0xFFE0E2E6);
  static const lightText     = Color(0xFF1A2133);
  static const lightSub      = Color(0xFF5A6478);
  static const lightMuted    = Color(0xFF666E7D);
  static const lightLink     = Color(0xFF2F7A6B);
}

class CScheme {
  final Color bg, surface, surface2, border, inputBorder;
  final Color text, sub, muted, link, primary;

  const CScheme({
    required this.bg, required this.surface, required this.surface2,
    required this.border, required this.inputBorder, required this.text,
    required this.sub, required this.muted, required this.link, required this.primary,
  });

  static const dark = CScheme(
    bg: CTokens.darkBg, surface: CTokens.darkSurface, surface2: CTokens.darkSurface2,
    border: CTokens.darkBorder, inputBorder: CTokens.darkInputBorder,
    text: CTokens.darkText, sub: CTokens.darkSub, muted: CTokens.darkMuted,
    link: CTokens.darkLink, primary: CTokens.primary,
  );

  static const light = CScheme(
    bg: CTokens.lightBg, surface: CTokens.lightSurface, surface2: CTokens.lightSurface2,
    border: CTokens.lightBorder, inputBorder: CTokens.lightInputBorder,
    text: CTokens.lightText, sub: CTokens.lightSub, muted: CTokens.lightMuted,
    link: CTokens.lightLink, primary: CTokens.primaryLight,
  );
}

class ThemeNotifier extends ChangeNotifier {
  bool _isDark = true;

  bool get isDark => _isDark;
  CScheme get scheme => _isDark ? CScheme.dark : CScheme.light;

  void toggle() { _isDark = !_isDark; notifyListeners(); }
}

ThemeData buildTheme(bool isDark) {
  final s = isDark ? CScheme.dark : CScheme.light;
  final base = isDark ? ThemeData.dark() : ThemeData.light();
  return base.copyWith(
    scaffoldBackgroundColor: s.bg,
    colorScheme: ColorScheme(
      brightness: isDark ? Brightness.dark : Brightness.light,
      primary: s.primary,
      onPrimary: Colors.white,
      secondary: CTokens.planIndigo,
      onSecondary: Colors.white,
      surface: s.surface,
      onSurface: s.text,
      error: CTokens.danger,
      onError: Colors.white,
    ),
    textTheme: GoogleFonts.interTextTheme(base.textTheme).apply(
      bodyColor: s.text,
      displayColor: s.text,
    ),
    dividerColor: s.border,
    cardColor: s.surface,
  );
}
