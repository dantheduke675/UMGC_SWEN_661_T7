import 'dart:math' as math;

import 'package:flutter/material.dart';
import 'package:google_fonts/google_fonts.dart';

// ── Design tokens ──────────────────────────────────────────────────────────────

class CTokens {
  // Shared brand
  static const primary = Color(0xFF357C6F);
  static const primaryLight = Color(0xFF2F7A6B);
  static const caregiverPurple = Color(0xFF684BE6);
  static const danger = Color(0xFFC53030);
  static const planIndigo = Color(0xFF6366F1);

  // Dark palette (matches Figma dark imports)
  static const darkBg       = Color(0xFF0E131D);
  static const darkSurface  = Color(0xFF1D2534);
  static const darkSurface2 = Color(0xFF141A27);
  static const darkBorder   = Color(0xFF333D4F);
  // Boundary of an interactive control (button outline, chip, switch track,
  // input). Clears 3:1 against darkBg, darkSurface and darkSurface2, which
  // darkBorder (1.70:1 on darkBg) never did — WCAG 2.1 SC 1.4.11.
  static const darkControlBorder = Color(0xFF5D6F90);
  static const darkInputBorder = Color(0xFF7A8599);
  static const darkText     = Color(0xFFF5F7FA);
  static const darkSub      = Color(0xFF9EA8BD);
  static const darkMuted    = Color(0xFF828DA1);
  static const darkLink     = Color(0xFF59AD9E);

  // Light palette (matches Figma light imports)
  static const lightBg       = Color(0xFFF6F7F9);
  static const lightSurface  = Color(0xFFF2F3F5);
  static const lightSurface2 = Color(0xFFE8EAED);
  static const lightBorder   = Color(0xFFE0E2E6);
  // See darkControlBorder. The old value was 1.17:1 against lightSurface,
  // leaving inputs and outlined buttons with no detectable boundary.
  static const lightControlBorder = Color(0xFF7E8697);
  static const lightInputBorder = Color(0xFF7E8697);
  static const lightText     = Color(0xFF1A2133);
  static const lightSub      = Color(0xFF5A6478);
  // Nudged one step darker: the old #666E7D was 4.26:1 on lightSurface2,
  // just under the 4.5:1 floor for the message hint and disabled button text.
  static const lightMuted    = Color(0xFF626A78);
  static const lightLink     = Color(0xFF2F7A6B);
}

//this enables the changing of the theme between light and dark mode
class CScheme {
  final Color bg, surface, surface2, border, inputBorder;
  final Color text, sub, muted, link, primary;

  /// Boundary colour for interactive controls, guaranteed to clear 3:1 against
  /// every surface in this scheme (SC 1.4.11). [border] stays the lighter,
  /// decorative outline used for cards and dividers, which the success
  /// criterion does not cover.
  final Color controlBorder;

  const CScheme({
    required this.bg, required this.surface, required this.surface2,
    required this.border, required this.inputBorder, required this.text,
    required this.sub, required this.muted, required this.link, required this.primary,
    required this.controlBorder,
  });

  @override
  bool operator ==(Object other) =>
      identical(this, other) ||
      other is CScheme &&
          bg == other.bg && surface == other.surface && surface2 == other.surface2 &&
          border == other.border && inputBorder == other.inputBorder &&
          text == other.text && sub == other.sub && muted == other.muted &&
          link == other.link && primary == other.primary &&
          controlBorder == other.controlBorder;

  @override
  int get hashCode => Object.hash(bg, surface, surface2, border, inputBorder, text, sub, muted, link,
      primary, controlBorder);

  static const dark = CScheme(
    bg: CTokens.darkBg, surface: CTokens.darkSurface, surface2: CTokens.darkSurface2,
    border: CTokens.darkBorder, inputBorder: CTokens.darkInputBorder,
    controlBorder: CTokens.darkControlBorder,
    text: CTokens.darkText, sub: CTokens.darkSub, muted: CTokens.darkMuted,
    link: CTokens.darkLink, primary: CTokens.primary,
  );

  static const light = CScheme(
    bg: CTokens.lightBg, surface: CTokens.lightSurface, surface2: CTokens.lightSurface2,
    border: CTokens.lightBorder, inputBorder: CTokens.lightInputBorder,
    controlBorder: CTokens.lightControlBorder,
    text: CTokens.lightText, sub: CTokens.lightSub, muted: CTokens.lightMuted,
    link: CTokens.lightLink, primary: CTokens.primaryLight,
  );
}

// ── Contrast helpers (WCAG 2.1 SC 1.4.3 / 1.4.11) ─────────────────────
//
// The design leans on a "tinted pill" pattern everywhere: a chip, badge or
// secondary button painted with `accent.withValues(alpha: 0.12)` and then
// labelled in that same `accent`. That is text on a tint of itself, and it
// measured as low as 1.77:1 against the required 4.5:1.
//
// Rather than hand-pick a second colour for every accent in both themes -
// and get it wrong again the next time someone adds one - `readableOn`
// derives the label colour at build time. Appointment type colours are
// arbitrary, so a runtime rule is the only thing that covers them all.

/// Contrast ratio between two opaque colours, per the WCAG 2.1 definition.
double contrastRatio(Color a, Color b) {
  final la = a.computeLuminance();
  final lb = b.computeLuminance();
  final hi = math.max(la, lb);
  final lo = math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
}

/// Composites a translucent [fg] over an opaque [bg], giving the colour a
/// reader actually sees. Needed because the tint backgrounds are semi
/// transparent, and contrast must be measured against the composite.
Color compositeOver(Color fg, Color bg) => Color.alphaBlend(fg, bg);

/// Returns [base] shifted in lightness — hue and saturation untouched — until
/// it reaches [minRatio] against [background].
///
/// Darkens when the background is light and lightens when it is dark, and
/// returns [base] unchanged when it already passes, so colours that were
/// already compliant keep their exact designed value.
///
/// [minRatio] defaults to the 4.5:1 floor for body text; pass 3.0 for large
/// text (SC 1.4.3) or for non-text boundaries and indicators (SC 1.4.11).
Color readableOn(Color base, Color background, {double minRatio = 4.5}) {
  if (contrastRatio(base, background) >= minRatio) return base;

  final hsl = HSLColor.fromColor(base);
  final lighten = background.computeLuminance() <= 0.18;
  var best = base;

  for (var i = 1; i <= 100; i++) {
    final t = i / 100;
    final l = lighten
        ? hsl.lightness + (1 - hsl.lightness) * t
        : hsl.lightness * (1 - t);
    final candidate = hsl.withLightness(l.clamp(0.0, 1.0)).toColor();
    best = candidate;
    if (contrastRatio(candidate, background) >= minRatio) return candidate;
  }
  return best;
}

/// Chooses a legible label colour for a solid [fill], and nudges the fill
/// itself only when neither white nor near-black can reach [minRatio] on it.
///
/// Needed for avatar badges, whose fill is a person's identity colour chosen
/// for recognition rather than contrast: white initials on the amber contact
/// measured 2.15:1. Flipping the label to near-black fixes that one outright
/// and keeps the identity colour intact; only a fill that defeats both label
/// colours (mid-tone indigo, 4.47:1) gets adjusted.
({Color fill, Color foreground}) legibleOn(Color fill, {double minRatio = 4.5}) {
  const dark = Color(0xFF1A2133);
  final useWhite =
      contrastRatio(const Color(0xFFFFFFFF), fill) >= contrastRatio(dark, fill);
  final foreground = useWhite ? const Color(0xFFFFFFFF) : dark;
  return (
    fill: readableOn(fill, foreground, minRatio: minRatio),
    foreground: foreground,
  );
}

/// Convenience for the tinted-pill pattern: given the [accent] a pill is
/// tinted with, the [surface] it sits on and the tint [alpha], returns the
/// label colour that clears [minRatio] against the composited pill.
Color readableOnTint(Color accent, Color surface, double alpha,
        {double minRatio = 4.5}) =>
    readableOn(accent, compositeOver(accent.withValues(alpha: alpha), surface),
        minRatio: minRatio);

// ── Theme notifier ──────────────────────────────────────────────────────────────

class ThemeNotifier extends ChangeNotifier {
  bool _dark;

  ThemeNotifier({bool isDark = true}) : _dark = isDark;

  bool get isDark => _dark;
  CScheme get scheme => _dark ? CScheme.dark : CScheme.light;

  void toggle() { _dark = !_dark; notifyListeners(); }
  void setDark(bool value) { _dark = value; notifyListeners(); }
}

// ── Material ThemeData helpers ──────────────────────────────────────────────────

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
