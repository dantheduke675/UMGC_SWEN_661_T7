import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'action_history.dart';
import 'theme.dart';

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
      child: Center(child: Text('💊', style: TextStyle(fontSize: lg ? 44 : 36))),
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
      child: Center(child: Text('💊', style: TextStyle(fontSize: lg ? 32 : 26))),
    );
  }
}

//the typical button created and built out for the application and for specific circumstances
class AuthBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final String variant; // 'primary' | 'secondary' | 'text'
  final bool lg;

  const AuthBtn({
    super.key,
    required this.label,
    this.onPressed,
    this.variant = 'primary',
    this.lg = false,
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
          child: Text(label, style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700, color: scheme.link)),
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
            side: BorderSide(color: scheme.border, width: 2),
            shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
            foregroundColor: scheme.text,
          ),
          child: Text(label, style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700)),
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
        child: Text(label, style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700)),
      ),
    );
  }
}

//the auhtorization access text fields
class AuthField extends StatelessWidget {
  final String label;
  final String value;
  final String? helper;
  final bool filled;
  final bool lg;

  const AuthField({
    super.key,
    required this.label,
    required this.value,
    this.helper,
    this.filled = false,
    this.lg = false,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final labelFs = lg ? 20.0 : 16.0;
    final inputH  = lg ? 80.0 : 64.0;
    final inputFs = lg ? 22.0 : 18.0;
    final helperFs = lg ? 18.0 : 14.0;
    final px = lg ? 25.0 : 20.0;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(label, style: TextStyle(fontSize: labelFs, fontWeight: FontWeight.w600, color: scheme.text)),
        const SizedBox(height: 8),
        Container(
          height: inputH,
          decoration: BoxDecoration(
            color: scheme.surface,
            borderRadius: BorderRadius.circular(16),
            border: Border.all(color: scheme.inputBorder, width: 2),
          ),
          padding: EdgeInsets.symmetric(horizontal: px),
          alignment: Alignment.centerLeft,
          child: Text(
            value,
            style: TextStyle(
              fontSize: inputFs, fontWeight: FontWeight.w400,
              color: filled ? scheme.text : scheme.muted,
            ),
          ),
        ),
        if (helper != null) ...[
          const SizedBox(height: 6),
          Text(helper!, style: TextStyle(fontSize: helperFs, color: scheme.muted)),
        ],
      ],
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
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(
        color: scheme.surface2,
        shape: BoxShape.circle,
        border: Border.all(color: scheme.primary, width: 5),
      ),
      child: Center(child: Text('👤', style: TextStyle(fontSize: lg ? 56 : 44))),
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
        child: Text(label, style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700)),
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
    return Container(
      width: size, height: size,
      decoration: BoxDecoration(color: color, shape: BoxShape.circle),
      child: Center(
        child: Text(
          initials,
          style: TextStyle(color: Colors.white, fontSize: size * 0.36, fontWeight: FontWeight.w700),
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
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.13),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
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
    return Row(
      children: List.generate(5, (i) => Expanded(
        child: Container(
          height: 12, margin: const EdgeInsets.only(right: 6),
          decoration: BoxDecoration(
            color: i < level ? _color : scheme.muted.withValues(alpha: 0.2),
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
      child: GestureDetector(
        onTap: notifier.toggle,
        child: Container(
          width: 44, height: 44,
          decoration: BoxDecoration(
            color: notifier.isDark ? Colors.white.withValues(alpha: 0.1) : Colors.black.withValues(alpha: 0.07),
            shape: BoxShape.circle,
          ),
          child: Center(child: Text(notifier.isDark ? '☀️' : '🌙', style: const TextStyle(fontSize: 18))),
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
      child: GestureDetector(
        onTap: () => showModalBottomSheet(
          context: context,
          backgroundColor: Colors.transparent,
          isScrollControlled: true,
          builder: (_) => _UndoSheet(scheme: scheme),
        ),
        child: Semantics(
          button: true,
          label: 'Undo, $count recent ${count == 1 ? 'action' : 'actions'}',
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
                  child: Text('Recent actions',
                      style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: scheme.text)),
                ),
                Semantics(
                  button: true,
                  label: 'Close',
                  child: GestureDetector(
                    onTap: () => Navigator.of(context).pop(),
                    child: Container(
                      width: 32, height: 32,
                      decoration: BoxDecoration(
                        color: scheme.surface2,
                        shape: BoxShape.circle,
                      ),
                      child: Center(
                        child: Text('✕', style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.sub)),
                      ),
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
                          GestureDetector(
                            onTap: () => context.read<ActionHistory>().undoAction(action.id),
                            child: Container(
                              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
                              decoration: BoxDecoration(
                                color: scheme.primary.withValues(alpha: 0.12),
                                borderRadius: BorderRadius.circular(12),
                              ),
                              child: Text('Undo',
                                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w700, color: scheme.primary)),
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
