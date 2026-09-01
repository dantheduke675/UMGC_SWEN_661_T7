import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'theme.dart';

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

class AuthBtn extends StatelessWidget {
  final String label;
  final VoidCallback? onPressed;
  final String variant; 
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

class AuthRoleTile extends StatelessWidget {
  final String role; 
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
        color: color.withOpacity(0.13),
        borderRadius: BorderRadius.circular(20),
      ),
      child: Text(label, style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: color)),
    );
  }
}

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
            color: i < level ? _color : scheme.muted.withOpacity(0.2),
            borderRadius: BorderRadius.circular(6),
          ),
        ),
      )),
    );
  }
}

class CBtn extends StatelessWidget {
  final Widget child;
  final VoidCallback? onPressed;
  final String variant; 
  final bool sm;
  final bool fullWidth;

  const CBtn({
    super.key,
    required this.child,
    this.onPressed,
    this.variant = 'primary',
    this.sm = false,
    this.fullWidth = true,
  });

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final h = sm ? 48.0 : 64.0;
    final fs = sm ? 15.0 : 17.0;

    Color bg, fg;
    Border? border;

    switch (variant) {
      case 'danger':   bg = const Color(0xFFC53030); fg = Colors.white; break;
      case 'secondary': bg = scheme.surface2; fg = scheme.text; border = Border.all(color: scheme.border, width: 2); break;
      case 'ghost':    bg = Colors.transparent; fg = scheme.primary; break;
      default:         bg = scheme.primary; fg = Colors.white;
    }

    final btn = GestureDetector(
      onTap: onPressed,
      child: Container(
        height: h,
        decoration: BoxDecoration(
          color: bg,
          borderRadius: BorderRadius.circular(16),
          border: border,
        ),
        child: Center(
          child: DefaultTextStyle(
            style: TextStyle(fontSize: fs, fontWeight: FontWeight.w700, color: fg),
            child: child,
          ),
        ),
      ),
    );

    return fullWidth ? SizedBox(width: double.infinity, child: btn) : btn;
  }
}

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
            color: notifier.isDark ? Colors.white.withOpacity(0.1) : Colors.black.withOpacity(0.07),
            shape: BoxShape.circle,
          ),
          child: Center(child: Text(notifier.isDark ? '☀️' : '🌙', style: const TextStyle(fontSize: 18))),
        ),
      ),
    );
  }
}
