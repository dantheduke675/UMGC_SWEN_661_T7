import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../action_history.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

class TodayScreen extends StatelessWidget {
  const TodayScreen({super.key});

  // Same full slot list as the Medications screen, so the two stay in sync.
  List<MedSlot> get _slots => buildSlots();

  void _markTaken(BuildContext context, MedSlot slot) {
    final prev = slotStatuses[slot.key] ?? SlotStatus.none;
    if (prev == SlotStatus.taken) return;
    slotStatuses[slot.key] = SlotStatus.taken;
    context.read<ActionHistory>().push(
      'Marked ${slot.med.name} (${slot.time}) as taken',
      () => slotStatuses[slot.key] = prev,
    );
  }

  void _unmarkTaken(BuildContext context, MedSlot slot) {
    if ((slotStatuses[slot.key] ?? SlotStatus.none) != SlotStatus.taken) return;
    slotStatuses[slot.key] = SlotStatus.none;
    context.read<ActionHistory>().push(
      'Unmarked ${slot.med.name} (${slot.time}) as taken',
      () => slotStatuses[slot.key] = SlotStatus.taken,
    );
  }

  String _formatDate(DateTime d) {
    const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    const months = ['January','February','March','April','May','June','July','August','September','October','November','December'];
    return '${days[d.weekday % 7]}, ${months[d.month - 1]} ${d.day}';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final scrollController = context.read<ScrollController>();
    // Rebuild whenever an action is pushed/undone (from this screen or
    // Medications) so slotStatuses is always shown up to date here too.
    context.watch<ActionHistory>();
    final now = DateTime.now();
    final taken  = slotStatuses.values.where((s) => s == SlotStatus.taken).length;
    final total  = _slots.length;
    final pct    = total > 0 ? (taken / total * 100).round() : 0;

    return Stack(
      children: [
        ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            // ── Date + greeting ──────────────────────────────────────────────
            Text(
              _formatDate(now).toUpperCase(),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                  color: scheme.primary, letterSpacing: 1.2),
            ),
            const SizedBox(height: 4),
            Text(
              'Good morning, ${patient.name} 👋',
              style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: scheme.text),
            ),
            const SizedBox(height: 20),

            // ── Progress card ────────────────────────────────────────────────
            _ProgressCard(taken: taken, total: total, pct: pct, scheme: scheme),
            const SizedBox(height: 20),

            // ── Upcoming appointment ─────────────────────────────────────────
            _SectionLabel('Next appointment', scheme: scheme),
            const SizedBox(height: 10),
            _AppointmentCard(scheme: scheme),
            const SizedBox(height: 20),

            // ── Today's medications ──────────────────────────────────────────
            _SectionLabel("Today's medications", scheme: scheme),
            const SizedBox(height: 10),
            ..._slots.map((slot) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _MedCard(
                slot: slot,
                isTaken: (slotStatuses[slot.key] ?? SlotStatus.none) == SlotStatus.taken,
                scheme: scheme,
                onTake: () => _markTaken(context, slot),
                onUntake: () => _unmarkTaken(context, slot),
              ),
            )),
          ],
        ),

        const UndoFab(),
      ],
    );
  }
}

// ── Progress card ─────────────────────────────────────────────────────────────

class _ProgressCard extends StatelessWidget {
  final int taken, total, pct;
  final CScheme scheme;
  const _ProgressCard({required this.taken, required this.total, required this.pct, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(20),
      decoration: BoxDecoration(
        color: scheme.primary,
        borderRadius: BorderRadius.circular(20),
      ),
      child: Row(
        children: [
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  "TODAY'S MEDICATIONS",
                  style: const TextStyle(fontSize: 11, fontWeight: FontWeight.w700,
                      color: Colors.white70, letterSpacing: 1.2),
                ),
                const SizedBox(height: 6),
                Text(
                  '$taken of $total taken',
                  style: const TextStyle(fontSize: 20, fontWeight: FontWeight.w800, color: Colors.white),
                ),
                const SizedBox(height: 14),
                ClipRRect(
                  borderRadius: BorderRadius.circular(4),
                  child: LinearProgressIndicator(
                    value: total > 0 ? taken / total : 0,
                    backgroundColor: Colors.white30,
                    valueColor: const AlwaysStoppedAnimation(Colors.white),
                    minHeight: 8,
                  ),
                ),
              ],
            ),
          ),
          const SizedBox(width: 20),
          Text(
            '$pct%',
            style: const TextStyle(fontSize: 44, fontWeight: FontWeight.w800, color: Colors.white),
          ),
        ],
      ),
    );
  }
}

// ── Appointment card ──────────────────────────────────────────────────────────

class _AppointmentCard extends StatelessWidget {
  final CScheme scheme;
  const _AppointmentCard({required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.border),
      ),
      child: Row(
        children: [
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: const Color(0xFF6366F1).withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(14),
            ),
            child: const Center(child: Text('🏥', style: TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 14),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text('Dr. Chen — Follow-up',
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: scheme.text)),
                const SizedBox(height: 2),
                Text('Today at 2:30 PM · 45 min',
                    style: TextStyle(fontSize: 13, color: scheme.sub)),
              ],
            ),
          ),
          Container(
            padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
            decoration: BoxDecoration(
              color: const Color(0xFFF59E0B).withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(20),
            ),
            child: const Text('2:30 PM',
                style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700, color: Color(0xFFF59E0B))),
          ),
        ],
      ),
    );
  }
}

// ── Medication card ───────────────────────────────────────────────────────────

class _MedCard extends StatelessWidget {
  final MedSlot slot;
  final bool isTaken;
  final CScheme scheme;
  final VoidCallback onTake, onUntake;

  const _MedCard({
    required this.slot, required this.isTaken,
    required this.scheme, required this.onTake, required this.onUntake,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.border),
      ),
      child: Column(
        children: [
          // Header row
          Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: scheme.surface2,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(child: Text('💊', style: TextStyle(fontSize: 22))),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      slot.med.name,
                      style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700,
                        color: scheme.text.withValues(alpha: isTaken ? 0.55 : 1),
                      ),
                    ),
                    const SizedBox(height: 2),
                    Text('${slot.med.dose} · ${slot.time}',
                        style: TextStyle(fontSize: 13, color: scheme.sub)),
                  ],
                ),
              ),
              if (isTaken)
                Container(
                  padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                  decoration: BoxDecoration(
                    color: scheme.primary.withValues(alpha: 0.12),
                    borderRadius: BorderRadius.circular(20),
                  ),
                  child: Text('✓ Taken',
                      style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                          color: scheme.primary)),
                ),
            ],
          ),
          const SizedBox(height: 14),
          // Take / undo-take button
          GestureDetector(
            onTap: isTaken ? onUntake : onTake,
            child: Container(
              width: double.infinity, height: 52,
              decoration: BoxDecoration(
                color: isTaken
                    ? scheme.primary.withValues(alpha: 0.12)
                    : scheme.primary,
                borderRadius: BorderRadius.circular(14),
              ),
              child: Center(
                child: Text(
                  isTaken ? '✓ Taken — tap to undo' : 'I took this',
                  style: TextStyle(
                    fontSize: 15, fontWeight: FontWeight.w700,
                    color: isTaken ? scheme.primary : Colors.white,
                  ),
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }
}

// ── Section label ─────────────────────────────────────────────────────────────

class _SectionLabel extends StatelessWidget {
  final String text;
  final CScheme scheme;
  const _SectionLabel(this.text, {required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Text(text,
        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.text));
  }
}
