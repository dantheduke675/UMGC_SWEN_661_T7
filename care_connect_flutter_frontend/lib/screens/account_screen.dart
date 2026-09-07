import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

class AccountScreen extends StatelessWidget {
  const AccountScreen({super.key});

  @override
  Widget build(BuildContext context) {
    final notifier = context.watch<ThemeNotifier>();
    final scheme   = notifier.scheme;

    return ListView(
      padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
      children: [
        // ── Header ─────────────────────────────────────────────────────────
        Text('Account',
            style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: scheme.text)),
        const SizedBox(height: 20),

        // ── Profile card ────────────────────────────────────────────────────
        _ProfileCard(scheme: scheme),
        const SizedBox(height: 20),

        // ── Care team ───────────────────────────────────────────────────────
        Text('Care team',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.text)),
        const SizedBox(height: 10),
        ...contacts.map((c) => Padding(
          padding: const EdgeInsets.only(bottom: 10),
          child: _CareTeamTile(contact: c, scheme: scheme,
              onMessage: () => context.go('/messages')),
        )),
        const SizedBox(height: 20),

        // ── Preferences ─────────────────────────────────────────────────────
        Text('Preferences',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.text)),
        const SizedBox(height: 10),
        _PrefTile(
          icon: notifier.isDark ? '🌙' : '☀️',
          label: 'Appearance',
          value: notifier.isDark ? 'Dark mode' : 'Light mode',
          scheme: scheme,
          trailing: _ThemeSwitch(notifier: notifier, scheme: scheme),
        ),
        const SizedBox(height: 8),
        _PrefTile(
          icon: '🔔',
          label: 'Medication reminders',
          value: 'On · 15 min before',
          scheme: scheme,
        ),
        const SizedBox(height: 8),
        _PrefTile(
          icon: '🔒',
          label: 'Face ID unlock',
          value: 'Enabled',
          scheme: scheme,
        ),
        const SizedBox(height: 8),
        _PrefTile(
          icon: '📤',
          label: 'Share health data',
          value: 'With care team',
          scheme: scheme,
        ),
        const SizedBox(height: 20),

        // ── App info ─────────────────────────────────────────────────────────
        Text('App info',
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.text)),
        const SizedBox(height: 10),
        _PrefTile(icon: 'ℹ️', label: 'Version', value: '1.0.0', scheme: scheme),
        const SizedBox(height: 8),
        _PrefTile(icon: '📄', label: 'Privacy policy', value: '', scheme: scheme),
        const SizedBox(height: 20),

        // ── Sign out ──────────────────────────────────────────────────────────
        GestureDetector(
          onTap: () => context.go('/landing'),
          child: Container(
            width: double.infinity, height: 56,
            decoration: BoxDecoration(
              color: const Color(0xFFC53030).withValues(alpha: 0.08),
              borderRadius: BorderRadius.circular(16),
              border: Border.all(color: const Color(0xFFC53030).withValues(alpha: 0.25), width: 2),
            ),
            child: const Center(
              child: Text('Sign out',
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: Color(0xFFC53030))),
            ),
          ),
        ),
      ],
    );
  }
}

// ── Profile card ──────────────────────────────────────────────────────────────

class _ProfileCard extends StatelessWidget {
  final CScheme scheme;
  const _ProfileCard({required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.border),
      ),
      child: Row(
        children: [
          // Avatar
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: scheme.primary,
              shape: BoxShape.circle,
            ),
            child: Center(
              child: Text(patient.initials,
                  style: const TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: Colors.white)),
            ),
          ),
          const SizedBox(width: 16),
          // Name + role
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(patient.full,
                    style: TextStyle(fontSize: 18, fontWeight: FontWeight.w800, color: scheme.text)),
                const SizedBox(height: 3),
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 4),
                  decoration: BoxDecoration(
                    color: const Color(0xFF2F7A6B).withValues(alpha: 0.13),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: const Text('Care recipient',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFF2F7A6B))),
                ),
                const SizedBox(height: 6),
                Text('maddy@example.com',
                    style: TextStyle(fontSize: 13, color: scheme.sub)),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

// ── Care team tile ────────────────────────────────────────────────────────────

class _CareTeamTile extends StatelessWidget {
  final Contact contact;
  final CScheme scheme;
  final VoidCallback onMessage;

  const _CareTeamTile({required this.contact, required this.scheme, required this.onMessage});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.border),
      ),
      child: Row(
        children: [
          CAvatarBadge(initials: contact.initials, color: Color(contact.color), size: 44),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(contact.name,
                    style: TextStyle(fontSize: 14, fontWeight: FontWeight.w700, color: scheme.text)),
                const SizedBox(height: 2),
                Text(contact.role,
                    style: TextStyle(fontSize: 12, color: scheme.sub)),
              ],
            ),
          ),
          GestureDetector(
            onTap: onMessage,
            child: Container(
              width: 40, height: 40,
              decoration: BoxDecoration(
                color: scheme.primary.withValues(alpha: 0.1),
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: Text('💬',
                    style: const TextStyle(fontSize: 18)),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Preference tile ───────────────────────────────────────────────────────────

class _PrefTile extends StatelessWidget {
  final String icon, label, value;
  final CScheme scheme;
  final Widget? trailing;

  const _PrefTile({
    required this.icon, required this.label, required this.value,
    required this.scheme, this.trailing,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 16, vertical: 14),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: scheme.border),
      ),
      child: Row(
        children: [
          Text(icon, style: const TextStyle(fontSize: 20)),
          const SizedBox(width: 14),
          Expanded(
            child: Text(label,
                style: TextStyle(fontSize: 14, fontWeight: FontWeight.w600, color: scheme.text)),
          ),
          if (trailing != null)
            trailing!
          else if (value.isNotEmpty)
            Text(value, style: TextStyle(fontSize: 13, color: scheme.sub)),
        ],
      ),
    );
  }
}

// ── Inline theme switch ───────────────────────────────────────────────────────

class _ThemeSwitch extends StatelessWidget {
  final ThemeNotifier notifier;
  final CScheme scheme;
  const _ThemeSwitch({required this.notifier, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: notifier.toggle,
      child: Container(
        width: 52, height: 28,
        decoration: BoxDecoration(
          color: notifier.isDark ? scheme.primary : scheme.border,
          borderRadius: BorderRadius.circular(14),
        ),
        child: AnimatedAlign(
          duration: const Duration(milliseconds: 200),
          curve: Curves.easeInOut,
          alignment: notifier.isDark ? Alignment.centerRight : Alignment.centerLeft,
          child: Container(
            width: 22, height: 22,
            margin: const EdgeInsets.symmetric(horizontal: 3),
            decoration: const BoxDecoration(color: Colors.white, shape: BoxShape.circle),
            child: Center(child: Text(notifier.isDark ? '🌙' : '☀️', style: const TextStyle(fontSize: 10))),
          ),
        ),
      ),
    );
  }
}
