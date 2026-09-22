import 'package:flutter/material.dart';
import 'package:flutter/semantics.dart';
import 'package:provider/provider.dart';
import 'action_history.dart';
import 'theme.dart';

// ── Accessibility primitives ────────────────────────────────────────────────────
//
// The app draws its icons with emoji glyphs and used to build its controls out
// of bare GestureDetectors. Both choices broke assistive technology:
//
//   * an emoji left in the semantics tree is announced by its Unicode name —
//     the call button read out as "telephone receiver", the tab bar as
//     "house with garden, Today" (WCAG 2.1 SC 1.1.1 Non-text Content);
//   * a GestureDetector exposes no button role and creates no focus node, so
//     nothing was reachable with a keyboard (SC 2.1.1) and nothing announced
//     itself as a control (SC 4.1.2).
//
// CGlyph and CTappable below are the two replacements used app-wide.

/// A purely decorative glyph — an emoji used as an icon.
///
/// Hidden from assistive technology so its Unicode name never leaks into an
/// announcement; the meaning is carried by the label of whatever control or
/// row contains it (WCAG 2.1 SC 1.1.1).
class CGlyph extends StatelessWidget {
  final String glyph;
  final TextStyle? style;
  const CGlyph(this.glyph, {super.key, this.style});

  @override
  Widget build(BuildContext context) =>
      ExcludeSemantics(child: Text(glyph, style: style));
}

/// Speaks [message] through the screen reader without moving focus.
///
/// Marking a dose taken, logging a symptom and sending a message all change
/// state silently: the screen updates, but a screen reader user gets no
/// confirmation that anything happened. This is the Flutter equivalent of an
/// ARIA live region (WCAG 2.1 SC 4.1.3 Status Messages).
///
/// Guarded by [MediaQuery.supportsAnnounceOf]: Android deprecated
/// announcement events because they force TalkBack to flush its speech queue,
/// and reports `supportsAnnounce: false`. So this call covers iOS and the web
/// only, and the screens pair it with `liveRegion: true` on the visible
/// summary each action changes — that is the mechanism TalkBack honours.
/// Both together are what actually satisfies SC 4.1.3 on both platforms.
void announceStatus(BuildContext context, String message) {
  if (!MediaQuery.supportsAnnounceOf(context)) return;
  SemanticsService.sendAnnouncement(
    View.of(context),
    message,
    Directionality.of(context),
  );
}

/// The focus ring colour — deliberately the highest-contrast neutral in the
/// active theme so the indicator stays visible on brand-coloured, surface and
/// transparent backgrounds alike (WCAG 2.1 SC 2.4.7 Focus Visible).
Color focusRingColor(bool isDark) =>
    isDark ? const Color(0xFFF5F7FA) : const Color(0xFF1A2133);

/// An accessible, keyboard-operable tap target — the replacement for every
/// bare `GestureDetector` the app used as a button.
///
/// Supplies the four things a GestureDetector does not:
///   * a button role and an explicit, human-meaningful [label] (SC 4.1.2),
///   * a focus node, so the control is reachable with Tab (SC 2.1.1),
///   * a visible focus ring drawn as a foreground decoration, so gaining
///     focus never shifts layout (SC 2.4.7),
///   * [selected] / [toggled] state for tabs and switches (SC 4.1.2).
///
/// The visual subtree is wrapped in [ExcludeSemantics] by default so the emoji
/// and raw strings inside it stay out of the announcement; pass
/// [excludeChildSemantics] `false` when the child's own text should be read.
class CTappable extends StatefulWidget {
  final String label;
  final String? hint;
  final bool? selected;
  final bool? toggled;
  final VoidCallback? onTap;
  final BorderRadius? borderRadius;
  final bool excludeChildSemantics;
  final Widget child;

  const CTappable({
    super.key,
    required this.label,
    required this.child,
    this.onTap,
    this.hint,
    this.selected,
    this.toggled,
    this.borderRadius,
    this.excludeChildSemantics = true,
  });

  @override
  State<CTappable> createState() => _CTappableState();
}

class _CTappableState extends State<CTappable> {
  bool _focused = false;

  @override
  Widget build(BuildContext context) {
    final isDark = context.watch<ThemeNotifier>().isDark;
    final radius = widget.borderRadius ?? BorderRadius.circular(12);
    final content = widget.excludeChildSemantics
        ? ExcludeSemantics(child: widget.child)
        : widget.child;

    return Semantics(
      button: true,
      enabled: widget.onTap != null,
      label: widget.label,
      hint: widget.hint,
      selected: widget.selected,
      toggled: widget.toggled,
      child: Material(
        type: MaterialType.transparency,
        child: InkWell(
          onTap: widget.onTap,
          borderRadius: radius,
          onFocusChange: (f) => setState(() => _focused = f),
          child: DecoratedBox(
            // Foreground so the ring paints over the child without taking
            // part in layout — no reflow when focus arrives.
            position: DecorationPosition.foreground,
            decoration: BoxDecoration(
              borderRadius: radius,
              border: _focused
                  ? Border.all(color: focusRingColor(isDark), width: 3)
                  : null,
            ),
            child: content,
          ),
        ),
      ),
    );
  }
}

/// The title at the top of a screen, exposed as a level-1 heading so screen
/// reader users can jump between landmarks (WCAG 2.1 SC 1.3.1).
class CScreenTitle extends StatelessWidget {
  final String text;
  final CScheme scheme;
  const CScreenTitle(this.text, {super.key, required this.scheme});

  @override
  Widget build(BuildContext context) => Semantics(
        header: true,
        headingLevel: 1,
        child: Text(
          text,
          style: TextStyle(
            fontSize: 22,
            fontWeight: FontWeight.w800,
            color: scheme.text,
          ),
        ),
      );
}

/// A section heading within a screen ("Care team", "Recent logs"), exposed as
/// a level-2 heading (WCAG 2.1 SC 1.3.1).
class CSectionHeader extends StatelessWidget {
  final String text;
  final CScheme scheme;
  const CSectionHeader(this.text, {super.key, required this.scheme});

  @override
  Widget build(BuildContext context) => Semantics(
        header: true,
        headingLevel: 2,
        child: Text(
          text,
          style: TextStyle(
            fontSize: 16,
            fontWeight: FontWeight.w700,
            color: scheme.text,
          ),
        ),
      );
}

// ── Auth shared widgets ─────────────────────────────────────────────────────────

//the careconnect logo
class AuthLogo extends StatelessWidget {
  final bool lg;
  const AuthLogo({super.key, this.lg = false});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final size = 96.0;
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(28)),
      // Decorative: the "CareConnect" wordmark sits directly beneath it, so
      // announcing the glyph would only repeat the brand name (SC 1.1.1).
      child: Center(child: CGlyph('💊', style: TextStyle(fontSize: lg ? 44 : 36))),
    );
  }
}

//smaller version of the logo
class AuthLogoSmall extends StatelessWidget {
  final bool lg;
  const AuthLogoSmall({super.key, this.lg = false});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    return Container(
      width: 72, height: lg ? 80 : 72,
      decoration: BoxDecoration(color: scheme.primary, borderRadius: BorderRadius.circular(21)),
      child: Center(child: CGlyph('💊', style: TextStyle(fontSize: lg ? 32 : 26))),
    );
  }
}

//the typical button created and built out for the application and for specific circumstances
class AuthBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final String variant; // 'primary' | 'secondary' | 'text'
  final bool lg;

  /// What a screen reader announces, when that should differ from the drawn
  /// [label] — used for labels carrying a decorative glyph, e.g. "← Back",
  /// which would otherwise be read as "leftwards arrow, Back" (SC 1.1.1).
  final String? semanticLabel;

  const AuthBtn({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = 'primary',
    this.lg = false,
    this.semanticLabel,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final h = lg ? 80.0 : 64.0;
    final fs = lg ? 22.0 : 18.0;

    if (variant == 'text') {
      return SizedBox(
        width: double.infinity, height: h,
        child: TextButton(
          onPressed: onPressed,
          child: Text(label,
              semanticsLabel: semanticLabel,
              style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700, color: scheme.link)),
        ),
      );
    }
    if (variant == 'secondary') {
      return SizedBox(
        width: double.infinity, height: h,
        child: OutlinedButton(
          onPressed: onPressed,
          style: OutlinedButton.styleFrom(
            backgroundColor: scheme.surface,
            side: BorderSide(color: scheme.controlBorder, width: 2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            foregroundColor: scheme.text,
          ),
          child: Text(label,
              semanticsLabel: semanticLabel,
              style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700)),
        ),
      );
    }
    return SizedBox(
      width: double.infinity, height: h,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: scheme.primary,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
        child: Text(label,
            semanticsLabel: semanticLabel,
            style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

//the auhtorization access text fields
///
/// A real, focusable, labelled text input.
///
/// This used to be a `Text` inside a `Container` — a picture of a field. A
/// screen reader announced it as loose prose with no role, it could not be
/// focused or typed into, and the visible label was not programmatically
/// associated with anything (WCAG 2.1 SC 1.3.1, 3.3.2, 4.1.2). It is now a
/// `TextFormField` whose `labelText` and `helperText` are owned by the field
/// itself, so assistive tech announces "Email address, edit box" and reads the
/// helper as the field's description.
///
/// [filled] keeps its original meaning: `true` supplies [value] as the field's
/// initial content, `false` treats it as placeholder text.
class AuthField extends StatelessWidget {
  final String label;
  final String value;
  final String? helper;
  final bool filled;
  final bool lg;
  final bool obscure;
  final TextInputType? keyboardType;

  const AuthField({
    super.key,
    required this.label,
    required this.value,
    this.helper,
    this.filled = false,
    this.lg = false,
    this.obscure = false,
    this.keyboardType,
  });

  @override
  Widget build(BuildContext context) {
    final notifier = context.watch<ThemeNotifier>();
    final scheme = notifier.scheme;
    final labelFs = lg ? 20.0 : 16.0;
    final inputFs = lg ? 22.0 : 18.0;
    final helperFs = lg ? 18.0 : 14.0;
    final px = lg ? 25.0 : 20.0;
    final vy = lg ? 25.0 : 18.0;

    final border = OutlineInputBorder(
      borderRadius: BorderRadius.circular(16),
      borderSide: BorderSide(color: scheme.inputBorder, width: 2),
    );

    return TextFormField(
      initialValue: filled ? value : null,
      obscureText: obscure,
      keyboardType: keyboardType,
      style: TextStyle(
        fontSize: inputFs,
        fontWeight: FontWeight.w400,
        color: scheme.text,
      ),
      decoration: InputDecoration(
        labelText: label,
        // Keep the label pinned above the box: it is the field's visible name
        // as well as its accessible one, so it must not vanish on focus.
        floatingLabelBehavior: FloatingLabelBehavior.always,
        labelStyle: TextStyle(
          fontSize: labelFs,
          fontWeight: FontWeight.w600,
          color: scheme.text,
        ),
        hintText: filled ? null : value,
        hintStyle: TextStyle(fontSize: inputFs, color: scheme.muted),
        helperText: helper,
        helperStyle: TextStyle(fontSize: helperFs, color: scheme.muted),
        filled: true,
        fillColor: scheme.surface,
        contentPadding: EdgeInsets.symmetric(horizontal: px, vertical: vy),
        border: border,
        enabledBorder: border,
        focusedBorder: OutlineInputBorder(
          borderRadius: BorderRadius.circular(16),
          borderSide: BorderSide(color: focusRingColor(notifier.isDark), width: 3),
        ),
      ),
    );
  }
}

class AuthStatusRing extends StatelessWidget {
  final bool lg;
  const AuthStatusRing({super.key, this.lg = false});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    const size = 150.0;
    return Semantics(
      image: true,
      label: 'Face scan preview',
      child: Container(
        width: size, height: size,
        decoration: BoxDecoration(
          color: scheme.surface2,
          shape: BoxShape.circle,
          border: Border.all(color: scheme.primary, width: 5),
        ),
        child: Center(child: CGlyph('👤', style: TextStyle(fontSize: lg ? 56 : 44))),
      ),
    );
  }
}

class AuthSpinner extends StatefulWidget {
  final String label;
  final bool lg;
  const AuthSpinner({super.key, required this.label, this.lg = false});

  @override
  State<AuthSpinner> createState() => _AuthSpinnerState();
}

//the spinning anitmation seene when used by the biometrics screen
class _AuthSpinnerState extends State<AuthSpinner> with SingleTickerProviderStateMixin {
  late AnimationController _ctrl;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(seconds: 1))..repeat();
  }

  @override
  void dispose() { _ctrl.dispose(); super.dispose(); }

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final fs = widget.lg ? 22.0 : 18.0;
    return Row(
      children: [
        RotationTransition(
          turns: _ctrl,
          child: SizedBox(
            width: 40, height: 40,
            child: CircularProgressIndicator(
              color: scheme.primary,
              backgroundColor: scheme.surface2,
              strokeWidth: 4,
              value: 0.75,
            ),
          ),
        ),
        SizedBox(width: widget.lg ? 20 : 16),
        Expanded(
          child: Text(widget.label, style: TextStyle(fontSize: fs, fontWeight: FontWeight.w600, color: scheme.text)),
        ),
      ],
    );
  }
}

//determines the roll in this application though you can only be the care recipient
class AuthRoleTile extends StatelessWidget {
  final String role; // 'recipient' | 'caregiver'
  final VoidCallback? onPressed;
  final bool lg;

  const AuthRoleTile({super.key, required this.role, this.onPressed, this.lg = false});

  @override
  Widget build(BuildContext context) {
    final isCaregiver = role == 'caregiver';
    final h = lg ? 80.0 : 88.0;
    final fs = lg ? 22.0 : 18.0;
    final bg = isCaregiver ? const Color(0xFF684BE6) : const Color(0xFF2F7A6B);
    final label = isCaregiver ? '👤  Caregiver' : '🙂  Care recipient';
    // The leading emoji is decoration: announce the role, not "bust in
    // silhouette, Caregiver" (SC 1.1.1).
    final spokenLabel = isCaregiver ? 'Caregiver' : 'Care recipient';
    return SizedBox(
      width: double.infinity, height: h,
      child: ElevatedButton(
        onPressed: onPressed,
        style: ElevatedButton.styleFrom(
          backgroundColor: bg,
          foregroundColor: Colors.white,
          shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
          elevation: 0,
        ),
        // `semanticsLabel` swaps what is announced without touching what is
        // drawn, so the button keeps its native role, focus node and tap
        // action while the emoji stays out of the announcement.
        child: Text(
          label,
          semanticsLabel: spokenLabel,
          style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700),
        ),
      ),
    );
  }
}

// ── App shared widgets ──────────────────────────────────────────────────────────

//avatar logo that appears representing the user
class CAvatarBadge extends StatelessWidget {
  final String initials;
  final Color color;
  final double size;

  const CAvatarBadge({super.key, required this.initials, required this.color, this.size = 40});

  @override
  Widget build(BuildContext context) {
    // The fill is the contact's identity colour, so the label adapts to it
    // rather than the other way round (SC 1.4.3).
    final badge = legibleOn(color);
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(color: badge.fill, shape: BoxShape.circle),
      child: Center(
        // Decorative: the badge is only ever drawn beside the person's full
        // name, so announcing "A J" first just doubles the name (SC 1.1.1).
        child: ExcludeSemantics(
          child: Text(
            initials,
            style: TextStyle(
                color: badge.foreground,
                fontSize: size * 0.36,
                fontWeight: FontWeight.w700),
          ),
        ),
      ),
    );
  }
}

class CChip extends StatelessWidget {
  final String label;
  final Color color;
  const CChip({super.key, required this.label, required this.color});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    // 12px bold is not "large text", so the label needs the full 4.5:1
    // against the tint it sits on. Amber measured 1.77:1 before this.
    final labelColor = readableOnTint(color, scheme.surface, 0.13);
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label,
          style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: labelColor)),
    );
  }
}

//this is the coloring for symptom severity and the bar of how bad the symtpom is
class CSeverityBar extends StatelessWidget {
  final int level;
  const CSeverityBar({super.key, required this.level});

  Color get _color => level <= 2 ? const Color(0xFF22C55E) : level <= 3 ? const Color(0xFFF59E0B) : const Color(0xFFEF4444);

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    // Non-text indicator: 3:1 against the card it sits on (SC 1.4.11).
    // Light-theme green measured 2.05:1 and amber 1.93:1 before this.
    final fill = readableOn(_color, scheme.surface, minRatio: 3.0);
    return Row(
      children: List.generate(5, (i) => Expanded(
        child: Container(
          height: 12, margin: const EdgeInsets.only(right: 6),
          decoration: BoxDecoration(
            color: i < level ? fill : scheme.muted.withValues(alpha: 0.2),
            borderRadius: BorderRadius.circular(6),
          ),
        ),
      )),
    );
  }
}


// ── Floating theme toggle used on auth screens ──────────────────────────────────

class ThemeToggleBtn extends StatelessWidget {
  const ThemeToggleBtn({super.key});

  @override
  Widget build(BuildContext context) {
    final notifier = context.watch<ThemeNotifier>();
    return Positioned(
      top: 16, right: 16,
      child: CTappable(
        label: notifier.isDark ? 'Switch to light theme' : 'Switch to dark theme',
        toggled: notifier.isDark,
        borderRadius: BorderRadius.circular(22),
        onTap: notifier.toggle,
        child: Container(
          width: 48, height: 48,
          decoration: BoxDecoration(
            color: notifier.isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.07),
            shape: BoxShape.circle,
          ),
          child: Center(child: CGlyph(notifier.isDark ? '☀️' : '🌙', style: const TextStyle(fontSize: 18))),
        ),
      ),
    );
  }
}

// ── Persistent undo button ───────────────────────────────────────────────────
// Place inside a Stack (alongside the screen's main scroll view). Renders
// nothing when there's no history. Tapping it opens a sheet listing every
// undoable action — most recent first — so the user can undo any of them,
// not just the last one.

class UndoFab extends StatelessWidget {
  const UndoFab({super.key});

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final count = context.watch<ActionHistory>().actions.length;
    if (count == 0) return const SizedBox.shrink();

    return Positioned(
      right: 20, bottom: 16,
      child: CTappable(
        label: 'Undo, $count recent ${count == 1 ? 'action' : 'actions'}',
        hint: 'Opens a list of your recent changes',
        borderRadius: BorderRadius.circular(28),
        onTap: () => showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => _UndoSheet(scheme: scheme),
        ),
        child: Stack(
            clipBehavior: Clip.none,
            children: [
              Container(
                height: 56,
                padding: const EdgeInsets.symmetric(horizontal: 20),
                decoration: BoxDecoration(
                  color: scheme.primary,
                  borderRadius: BorderRadius.circular(28),
                  boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 4))],
                ),
                child: Row(
                  mainAxisSize: MainAxisSize.min,
                  children: const [
                    Text('↺', style: TextStyle(fontSize: 24, color: Colors.white)),
                    SizedBox(width: 8),
                    Text('Undo', style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: Colors.white)),
                  ],
                ),
              ),
              Positioned(
                top: -4, right: -4,
                child: Container(
                  padding: const EdgeInsets.symmetric(horizontal: 6, vertical: 2),
                  constraints: const BoxConstraints(minWidth: 20),
                  decoration: BoxDecoration(
                    color: const Color(0xFFC53030),
                    borderRadius: BorderRadius.circular(10),
                    border: Border.all(color: scheme.bg, width: 2),
                  ),
                  child: Text(
                    '$count',
                    textAlign: TextAlign.center,
                    style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700, color: Colors.white),
                  ),
                ),
              ),
            ],
          ),
      ),
    );
  }
}

//when the undo button is clicked it builds this sheet which allows for 
class _UndoSheet extends StatelessWidget {
  final CScheme scheme;
  const _UndoSheet({required this.scheme});

  String _timeAgo(DateTime t) {
    final diff = DateTime.now().difference(t);
    if (diff.inSeconds < 60) return 'Just now';
    if (diff.inMinutes < 60) return '${diff.inMinutes}m ago';
    return '${diff.inHours}h ago';
  }

  @override
  Widget build(BuildContext context) {
    final actions = context.watch<ActionHistory>().actions;

    return SafeArea(
      child: Container(
        margin: const EdgeInsets.all(12),
        padding: const EdgeInsets.all(20),
        constraints: const BoxConstraints(maxHeight: 480),
        decoration: BoxDecoration(
          color: scheme.surface,
          borderRadius: BorderRadius.circular(24),
          border: Border.all(color: scheme.border),
        ),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Semantics(
                    header: true,
                    headingLevel: 2,
                    child: Text('Recent actions',
                        style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: scheme.text)),
                  ),
                ),
                CTappable(
                  label: 'Close recent actions',
                  borderRadius: BorderRadius.circular(16),
                  onTap: () => Navigator.of(context).pop(),
                  child: Container(
                    width: 32, height: 32,
                    decoration: BoxDecoration(
                      color: scheme.surface2,
                      shape: BoxShape.circle,
                    ),
                    child: Center(
                      child: CGlyph('✕', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.sub)),
                    ),
                  ),
                ),
              ],
            ),
            const SizedBox(height: 4),
            Text('Undo any of your recent changes.',
                style: TextStyle(fontSize: 13, color: scheme.sub)),
            const SizedBox(height: 12),
            if (actions.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: 24),
                child: Text('Nothing to undo.',
                    style: TextStyle(fontSize: 14, color: scheme.sub)),
              )
            else
              Flexible(
                child: ListView.separated(
                  shrinkWrap: true,
                  itemCount: actions.length,
                  separatorBuilder: (_, _) => Divider(color: scheme.border, height: 1),
                  itemBuilder: (_, i) {
                    final action = actions[i];
                    return Padding(
                      padding: const EdgeInsets.symmetric(vertical: 10),
                      child: Row(
                        children: [
                          Expanded(
                            child: Column(
                              crossAxisAlignment: CrossAxisAlignment.start,
                              children: [
                                Text(action.description,
                                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: scheme.text)),
                                const SizedBox(height: 2),
                                Text(_timeAgo(action.timestamp),
                                    style: TextStyle(fontSize: 12, color: scheme.muted)),
                              ],
                            ),
                          ),
                          const SizedBox(width: 12),
                          CTappable(
                            // Every row's button reads "Undo" on screen; the
                            // accessible name names the action it undoes so
                            // the buttons are told apart out of context.
                            label: 'Undo ${action.description}',
                            borderRadius: BorderRadius.circular(12),
                            onTap: () {
                              context.read<ActionHistory>().undoAction(action.id);
                              announceStatus(context, 'Undone: ${action.description}');
                            },
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: scheme.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text('Undo',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700,
                                      color: readableOnTint(scheme.primary, scheme.surface, 0.12))),
                            ),
                          ),
                        ],
                      ),
                    );
                  },
                ),
              ),
          ],
        ),
      ),
    );
  }
}
