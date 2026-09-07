import 'dart:async';
import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:provider/provider.dart';
import '../data.dart';
import '../theme.dart';
// ignore: unused_import
import '../widgets.dart';

class CallingScreen extends StatefulWidget {
  final int contactId;
  const CallingScreen({super.key, required this.contactId});

  @override
  State<CallingScreen> createState() => _CallingScreenState();
}

class _CallingScreenState extends State<CallingScreen>
    with TickerProviderStateMixin {
  late final Contact _contact;

  // Pulse animation
  late final AnimationController _pulseCtrl;
  late final Animation<double> _pulseScale;
  late final Animation<double> _pulseOpacity;

  // Call state
  bool _isMuted    = false;
  bool _isSpeaker  = false;
  bool _connected  = false;

  // Duration
  final _stopwatch = Stopwatch();
  late final Timer _clockTimer;
  String _elapsed  = '0:00';

  @override
  void initState() {
    super.initState();
    _contact = contactById(widget.contactId);

    // Pulsing ring animation
    _pulseCtrl = AnimationController(
      vsync: this,
      duration: const Duration(milliseconds: 1600),
    )..repeat();
    _pulseScale   = Tween(begin: 1.0, end: 1.55).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeOut));
    _pulseOpacity = Tween(begin: 0.5, end: 0.0).animate(
      CurvedAnimation(parent: _pulseCtrl, curve: Curves.easeOut));

    // Simulate call connecting after 2 s
    Future.delayed(const Duration(seconds: 2), () {
      if (mounted) {
        setState(() => _connected = true);
        _stopwatch.start();
      }
    });

    // Tick the on-screen timer every second
    _clockTimer = Timer.periodic(const Duration(seconds: 1), (_) {
      if (_connected && mounted) {
        final s = _stopwatch.elapsed.inSeconds;
        setState(() {
          final m = s ~/ 60;
          final sec = (s % 60).toString().padLeft(2, '0');
          _elapsed = '$m:$sec';
        });
      }
    });
  }

  @override
  void dispose() {
    _pulseCtrl.dispose();
    _clockTimer.cancel();
    _stopwatch.stop();
    super.dispose();
  }

  void _endCall() => context.go('/messages');

  @override
  Widget build(BuildContext context) {
    // ignore: unused_local_variable
    final scheme = context.watch<ThemeNotifier>().scheme;
    final contactColor = Color(_contact.color);
    final screenH = MediaQuery.of(context).size.height;

    return Container(
      width: double.infinity,
      height: double.infinity,
      // Deep gradient using the contact's brand color
      decoration: BoxDecoration(
        gradient: LinearGradient(
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
          colors: [
            contactColor.withValues(alpha: 0.9),
            const Color(0xFF0E131D),
            const Color(0xFF0E131D),
          ],
          stops: const [0.0, 0.45, 1.0],
        ),
      ),
      child: SafeArea(
        child: Column(
          children: [
            // ── Top bar ───────────────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Back / minimise
                  SizedBox(
                    width: 48, height: 48,
                    child: TextButton(
                      onPressed: _endCall,
                      style: TextButton.styleFrom(
                        padding: EdgeInsets.zero,
                        foregroundColor: Colors.white70,
                      ),
                      child: const Text('←',
                          style: TextStyle(fontSize: 22, fontWeight: FontWeight.w700)),
                    ),
                  ),
                  Text(_connected ? 'On call' : 'Calling…',
                      style: const TextStyle(fontSize: 14, color: Colors.white60,
                          fontWeight: FontWeight.w600)),
                  const SizedBox(width: 48), // balance
                ],
              ),
            ),

            SizedBox(height: screenH * 0.06),

            // ── Avatar with pulsing rings ─────────────────────────────────
            SizedBox(
              width: 200, height: 200,
              child: Stack(
                alignment: Alignment.center,
                children: [
                  // Outer pulse ring
                  AnimatedBuilder(
                    animation: _pulseCtrl,
                    builder: (_, _) => Transform.scale(
                      scale: _pulseScale.value,
                      child: Container(
                        width: 150, height: 150,
                        decoration: BoxDecoration(
                          shape: BoxShape.circle,
                          border: Border.all(
                            color: Colors.white.withValues(alpha: _pulseOpacity.value),
                            width: 2,
                          ),
                        ),
                      ),
                    ),
                  ),
                  // Inner ring (offset phase)
                  AnimatedBuilder(
                    animation: _pulseCtrl,
                    builder: (_, _) {
                      final t = (_pulseCtrl.value + 0.4) % 1.0;
                      final scale = 1.0 + t * 0.55;
                      final opacity = 0.5 * (1.0 - t);
                      return Transform.scale(
                        scale: scale,
                        child: Container(
                          width: 150, height: 150,
                          decoration: BoxDecoration(
                            shape: BoxShape.circle,
                            border: Border.all(
                              color: Colors.white.withValues(alpha: opacity),
                              width: 2,
                            ),
                          ),
                        ),
                      );
                    },
                  ),
                  // Avatar
                  Container(
                    width: 130, height: 130,
                    decoration: BoxDecoration(
                      color: contactColor,
                      shape: BoxShape.circle,
                      border: Border.all(color: Colors.white.withValues(alpha: 0.25), width: 3),
                    ),
                    child: Center(
                      child: Text(_contact.initials,
                          style: const TextStyle(fontSize: 44, fontWeight: FontWeight.w800,
                              color: Colors.white)),
                    ),
                  ),
                ],
              ),
            ),

            const SizedBox(height: 24),

            // ── Name + role ───────────────────────────────────────────────
            Text(_contact.name,
                style: const TextStyle(fontSize: 28, fontWeight: FontWeight.w800,
                    color: Colors.white)),
            const SizedBox(height: 6),
            Text(_contact.role,
                style: const TextStyle(fontSize: 15, color: Colors.white60,
                    fontWeight: FontWeight.w500)),

            const SizedBox(height: 16),

            // ── Status / timer ────────────────────────────────────────────
            AnimatedSwitcher(
              duration: const Duration(milliseconds: 400),
              child: _connected
                  ? Text(_elapsed,
                      key: const ValueKey('timer'),
                      style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w700,
                          color: Colors.white))
                  : const _CallingDots(key: ValueKey('dots')),
            ),

            const Spacer(),

            // ── Control buttons ───────────────────────────────────────────
            Padding(
              padding: const EdgeInsets.fromLTRB(40, 0, 40, 40),
              child: Row(
                mainAxisAlignment: MainAxisAlignment.spaceBetween,
                children: [
                  // Mute
                  _CtrlBtn(
                    icon: _isMuted ? '🔇' : '🎙️',
                    label: _isMuted ? 'Unmute' : 'Mute',
                    active: _isMuted,
                    onTap: () => setState(() => _isMuted = !_isMuted),
                  ),
                  // End call
                  _EndCallBtn(onTap: _endCall),
                  // Speaker
                  _CtrlBtn(
                    icon: _isSpeaker ? '🔊' : '🔈',
                    label: _isSpeaker ? 'Speaker' : 'Earpiece',
                    active: _isSpeaker,
                    onTap: () => setState(() => _isSpeaker = !_isSpeaker),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}

// ── Animated "calling…" dots ──────────────────────────────────────────────────

class _CallingDots extends StatefulWidget {
  const _CallingDots({super.key});
  @override
  State<_CallingDots> createState() => _CallingDotsState();
}

class _CallingDotsState extends State<_CallingDots>
    with SingleTickerProviderStateMixin {
  late final AnimationController _ctrl;
  int _dotCount = 1;
  late final Timer _timer;

  @override
  void initState() {
    super.initState();
    _ctrl = AnimationController(vsync: this, duration: const Duration(milliseconds: 500))
      ..repeat(reverse: true);
    _timer = Timer.periodic(const Duration(milliseconds: 500), (_) {
      if (mounted) setState(() => _dotCount = (_dotCount % 3) + 1);
    });
  }

  @override
  void dispose() {
    _ctrl.dispose();
    _timer.cancel();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Text('Connecting${'.' * _dotCount}',
        style: const TextStyle(fontSize: 16, color: Colors.white60, fontWeight: FontWeight.w500));
  }
}

// ── Control button ────────────────────────────────────────────────────────────

class _CtrlBtn extends StatelessWidget {
  final String icon, label;
  final bool active;
  final VoidCallback onTap;

  const _CtrlBtn({
    required this.icon, required this.label,
    required this.active, required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 64, height: 64,
            decoration: BoxDecoration(
              color: active
                  ? Colors.white.withValues(alpha: 0.9)
                  : Colors.white.withValues(alpha: 0.15),
              shape: BoxShape.circle,
            ),
            child: Center(child: Text(icon, style: const TextStyle(fontSize: 26))),
          ),
          const SizedBox(height: 8),
          Text(label,
              style: TextStyle(
                fontSize: 12, fontWeight: FontWeight.w600,
                color: active ? Colors.white : Colors.white60,
              )),
        ],
      ),
    );
  }
}

// ── End call button ───────────────────────────────────────────────────────────

class _EndCallBtn extends StatelessWidget {
  final VoidCallback onTap;
  const _EndCallBtn({required this.onTap});

  @override
  Widget build(BuildContext context) {
    return GestureDetector(
      onTap: onTap,
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          Container(
            width: 72, height: 72,
            decoration: const BoxDecoration(
              color: Color(0xFFC53030),
              shape: BoxShape.circle,
            ),
            child: const Center(
              child: Text('📵', style: TextStyle(fontSize: 28)),
            ),
          ),
          const SizedBox(height: 8),
          const Text('End',
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                  color: Color(0xFFFF6B6B))),
        ],
      ),
    );
  }
}
