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
    announceStatus(context, '${slot.med.name} at ${slot.time} marked as taken');
  }

  void _unmarkTaken(BuildContext context, MedSlot slot) {
    if ((slotStatuses[slot.key] ?? SlotStatus.none) != SlotStatus.taken) return;
    slotStatuses[slot.key] = SlotStatus.none;
    context.read<ActionHistory>().push(
      'Unmarked ${slot.med.name} (${slot.time}) as taken',
      () => slotStatuses[slot.key] = SlotStatus.taken,
    );
    announceStatus(context, '${slot.med.name} at ${slot.time} no longer marked as taken');
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
              // The all-caps form is a visual style; announce the readable one.
              semanticsLabel: _formatDate(now),
              style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                  color: readableOn(scheme.primary, scheme.bg), letterSpacing: 1.2),
            ),
            const SizedBox(height: 4),
            Semantics(
              header: true,
              headingLevel: 1,
              child: Text(
                'Good morning, ${patient.name} 👋',
                semanticsLabel: 'Good morning, ${patient.name}',
                style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: scheme.text),
              ),
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
    return Semantics(
      container: true,
      // A live region: marking a dose taken changes this label, and TalkBack
      // reads the change without moving focus (SC 4.1.3 Status Messages).
      liveRegion: true,
      label: "Today's medications: $taken of $total taken, $pct percent complete",
      excludeSemantics: true,
      child: Container(
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
                      color: Colors.white, letterSpacing: 1.2),
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
                    // white30 left only 1.74:1 between track and fill.
                    backgroundColor: Colors.white.withValues(alpha: 0.18),
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
    return Semantics(
      container: true,
      // Left to merge on its own, this card announced as
      // "Dr. Chen — Follow-up / Today at 2:30 PM · 45 min / 2:30 PM": the
      // trailing time chip repeats a time the line above has already given.
      // Found by the TalkBack pass; the schedule screen's card was already
      // spelled out this way (SC 1.3.1).
      label: 'Dr. Chen — Follow-up. Today at 2:30 PM, 45 min',
      excludeSemantics: true,
      child: Container(
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
              child: const Center(child: CGlyph('🏥', style: TextStyle(fontSize: 22))),
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
              // Hand-rolled rather than a CChip, so it needs the same treatment
              // the chip gets: amber on an amber tint was 1.77:1 (SC 1.4.3).
              child: Text('2:30 PM',
                  style: TextStyle(
                      fontSize: 12,
                      fontWeight: FontWeight.w700,
                      color: readableOnTint(
                          const Color(0xFFF59E0B), scheme.surface, 0.13))),
            ),
          ],
        ),
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
          // Header row — announced as one coherent sentence rather than as
          // loose fragments merged in with the button below it (SC 1.3.1).
          Semantics(
            container: true,
            label: '${slot.med.name}, ${slot.med.dose}, due at ${slot.time}'
                '${isTaken ? ', taken' : ''}',
            excludeSemantics: true,
            child: Row(
            children: [
              Container(
                width: 48, height: 48,
                decoration: BoxDecoration(
                  color: scheme.surface2,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: const Center(child: CGlyph('💊', style: TextStyle(fontSize: 22))),
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
                        // A taken dose is de-emphasised with the muted text
                        // colour rather than 55% opacity, which composited to
                        // 3.59:1 against the card (SC 1.4.3).
                        color: isTaken ? scheme.sub : scheme.text,
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
                          color: readableOnTint(scheme.primary, scheme.surface, 0.12))),
                ),
            ],
          ),
          ),
          const SizedBox(height: 14),
          // Take / undo-take button. The on-screen text repeats on every card,
          // so the accessible name names the dose it applies to (SC 4.1.2).
          CTappable(
            label: isTaken
                ? 'Undo: mark ${slot.med.name} at ${slot.time} as not taken'
                : 'Mark ${slot.med.name} at ${slot.time} as taken',
            borderRadius: BorderRadius.circular(14),
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
                    color: isTaken
                        ? readableOnTint(scheme.primary, scheme.surface, 0.12)
                        : Colors.white,
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
  Widget build(BuildContext context) => CSectionHeader(text, scheme: scheme);
}
