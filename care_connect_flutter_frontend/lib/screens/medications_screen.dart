import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../action_history.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

class MedicationsScreen extends StatefulWidget {
  const MedicationsScreen({super.key});

  @override
  State<MedicationsScreen> createState() => _MedicationsScreenState();
}

class _MedicationsScreenState extends State<MedicationsScreen> {
  String? _pendingMissedKey; // key awaiting confirm dialog

  List<MedSlot> get _slots => buildSlots();

  void _markTaken(MedSlot slot) {
    final prev = slotStatuses[slot.key] ?? SlotStatus.none;
    if (prev == SlotStatus.taken) return;
    slotStatuses[slot.key] = SlotStatus.taken;
    context.read<ActionHistory>().push(
      'Marked ${slot.med.name} (${slot.time}) as taken',
      () => slotStatuses[slot.key] = prev,
    );
  }

  void _unmarkTaken(MedSlot slot) {
    if ((slotStatuses[slot.key] ?? SlotStatus.none) != SlotStatus.taken) return;
    slotStatuses[slot.key] = SlotStatus.none;
    context.read<ActionHistory>().push(
      'Unmarked ${slot.med.name} (${slot.time}) as taken',
      () => slotStatuses[slot.key] = SlotStatus.taken,
    );
  }

  void _confirmMissed(String key) => setState(() => _pendingMissedKey = key);

  void _markMissed(MedSlot slot) {
    final prev = slotStatuses[slot.key] ?? SlotStatus.none;
    setState(() {
      slotStatuses[slot.key] = SlotStatus.missed;
      _pendingMissedKey = null;
    });
    context.read<ActionHistory>().push(
      'Marked ${slot.med.name} (${slot.time}) as missed',
      () => slotStatuses[slot.key] = prev,
    );
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final scrollController = context.read<ScrollController>();
    // Rebuild whenever an action is pushed/undone (from this screen or
    // Today) so slotStatuses is always shown up to date here too.
    context.watch<ActionHistory>();
    final takenCount  = slotStatuses.values.where((s) => s == SlotStatus.taken).length;
    final missedCount = slotStatuses.values.where((s) => s == SlotStatus.missed).length;

    return Stack(
      children: [
        ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 16, 20, 24),
          children: [
            // ── Header ───────────────────────────────────────────────────────
            Text('Medications',
                style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: scheme.text)),
            const SizedBox(height: 4),
            Text('${_slots.length} doses today',
                style: TextStyle(fontSize: 13, color: scheme.sub)),
            const SizedBox(height: 16),
            // ── Summary row ──────────────────────────────────────────────────
            _SummaryRow(
              taken: takenCount,
              missed: missedCount,
              total: _slots.length,
              scheme: scheme,
            ),
            const SizedBox(height: 16),

            // ── Medication cards ─────────────────────────────────────────────
            ..._slots.map((slot) {
              final status = slotStatuses[slot.key] ?? SlotStatus.none;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _MedCard(
                  slot: slot,
                  status: status,
                  scheme: scheme,
                  onTake:   () => _markTaken(slot),
                  onUntake: () => _unmarkTaken(slot),
                  onMissed: () => _confirmMissed(slot.key),
                ),
              );
            }),
          ],
        ),

        // ── Confirm "missed" dialog ──────────────────────────────────────────
        if (_pendingMissedKey != null)
          _ConfirmDialog(
            scheme: scheme,
            onConfirm: () => _markMissed(_slots.firstWhere((s) => s.key == _pendingMissedKey)),
            onCancel:  () => setState(() => _pendingMissedKey = null),
          ),

        const UndoFab(),
      ],
    );
  }
}

// ── Summary row ───────────────────────────────────────────────────────────────

class _SummaryRow extends StatelessWidget {
  final int taken, missed, total;
  final CScheme scheme;
  const _SummaryRow({required this.taken, required this.missed, required this.total, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Row(
      children: [
        _Stat(label: 'Total doses', value: '$total', color: scheme.sub, scheme: scheme),
        const SizedBox(width: 10),
        _Stat(label: 'Taken',  value: '$taken',  color: scheme.primary,            scheme: scheme),
        const SizedBox(width: 10),
        _Stat(label: 'Missed', value: '$missed', color: const Color(0xFFC53030),   scheme: scheme),
      ],
    );
  }
}

class _Stat extends StatelessWidget {
  final String label, value;
  final Color color;
  final CScheme scheme;
  const _Stat({required this.label, required this.value, required this.color, required this.scheme});

  @override
  Widget build(BuildContext context) {
    return Expanded(
      child: Container(
        padding: const EdgeInsets.symmetric(vertical: 14, horizontal: 12),
        decoration: BoxDecoration(
          color: color.withValues(alpha: 0.1),
          borderRadius: BorderRadius.circular(16),
          border: Border.all(color: color.withValues(alpha: 0.25)),
        ),
        child: Column(
          children: [
            Text(value, style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800, color: color)),
            const SizedBox(height: 2),
            Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: scheme.sub),
                textAlign: TextAlign.center),
          ],
        ),
      ),
    );
  }
}

// ── Medication card ───────────────────────────────────────────────────────────

class _MedCard extends StatelessWidget {
  final MedSlot slot;
  final SlotStatus status;
  final CScheme scheme;
  final VoidCallback onTake, onUntake, onMissed;

  const _MedCard({
    required this.slot, required this.status,
    required this.scheme, required this.onTake, required this.onUntake, required this.onMissed,
  });

  Color get _leftBorderColor {
    if (status == SlotStatus.taken)  return scheme.primary;
    if (status == SlotStatus.missed) return const Color(0xFFC53030);
    return scheme.border;
  }

  @override
  Widget build(BuildContext context) {
    final isTaken  = status == SlotStatus.taken;
    final isMissed = status == SlotStatus.missed;

    return Container(
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.border),
      ),
      child: ClipRRect(
        borderRadius: BorderRadius.circular(20),
        child: IntrinsicHeight(
          child: Row(
            children: [
              // Coloured left accent stripe
              Container(width: 5, color: _leftBorderColor),
              Expanded(
                child: Padding(
                  padding: const EdgeInsets.all(16),
                  child: Column(
                    children: [
                      // Header
                      Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
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
                                Row(
                                  children: [
                                    Flexible(
                                      child: Text(
                                        slot.med.name,
                                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: scheme.text),
                                      ),
                                    ),
                                    const SizedBox(width: 8),
                                    CChip(label: slot.med.category, color: scheme.primary),
                                  ],
                                ),
                                const SizedBox(height: 3),
                                Text('${slot.med.dose} · ${slot.time}',
                                    style: TextStyle(fontSize: 13, color: scheme.sub)),
                                const SizedBox(height: 2),
                                Text(slot.med.freq,
                                    style: TextStyle(fontSize: 12, color: scheme.muted)),
                              ],
                            ),
                          ),
                        ],
                      ),
                      const SizedBox(height: 14),
                      // Action buttons
                      Row(
                        children: [
                          Expanded(
                            child: GestureDetector(
                              onTap: isTaken ? onUntake : onTake,
                              child: Container(
                                height: 52,
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
                          ),
                          if (!isTaken) ...[
                            const SizedBox(width: 10),
                            Expanded(
                              child: GestureDetector(
                                onTap: onMissed,
                                child: Container(
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: isMissed
                                        ? const Color(0xFFC53030).withValues(alpha: 0.1)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: const Color(0xFFC53030).withValues(alpha: 0.4),
                                      width: 2,
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(
                                      isMissed ? '✗ Missed' : 'I missed this',
                                      style: const TextStyle(
                                        fontSize: 15, fontWeight: FontWeight.w700,
                                        color: Color(0xFFC53030),
                                      ),
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ],
                        ],
                      ),
                    ],
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

// ── Confirm dialog ────────────────────────────────────────────────────────────

class _ConfirmDialog extends StatelessWidget {
  final CScheme scheme;
  final VoidCallback onConfirm, onCancel;
  const _ConfirmDialog({required this.scheme, required this.onConfirm, required this.onCancel});

  @override
  Widget build(BuildContext context) {
    return Container(
      color: Colors.black.withValues(alpha: 0.6),
      child: Center(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Container(
            padding: const EdgeInsets.all(24),
            decoration: BoxDecoration(
              color: scheme.surface,
              borderRadius: BorderRadius.circular(24),
              border: Border.all(color: scheme.border),
            ),
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: [
                Text(
                  'Mark this dose as missed?\nYour caregiver will be notified.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600,
                      color: scheme.text, height: 1.5),
                ),
                const SizedBox(height: 20),
                SizedBox(
                  width: double.infinity, height: 56,
                  child: ElevatedButton(
                    onPressed: onConfirm,
                    style: ElevatedButton.styleFrom(
                      backgroundColor: const Color(0xFFC53030),
                      foregroundColor: Colors.white,
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      elevation: 0,
                    ),
                    child: const Text('Yes, I missed this dose',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
                const SizedBox(height: 10),
                SizedBox(
                  width: double.infinity, height: 56,
                  child: OutlinedButton(
                    onPressed: onCancel,
                    style: OutlinedButton.styleFrom(
                      side: BorderSide(color: scheme.border, width: 2),
                      shape: RoundedRectangleBorder(borderRadius: BorderRadius.circular(16)),
                      foregroundColor: scheme.text,
                    ),
                    child: const Text('Cancel — go back',
                        style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700)),
                  ),
                ),
              ],
            ),
          ),
        ),
      ),
    );
  }
}
