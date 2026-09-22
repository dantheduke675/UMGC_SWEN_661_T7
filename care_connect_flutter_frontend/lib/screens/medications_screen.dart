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
  List<MedSlot> get _slots => buildSlots();

  void _markTaken(MedSlot slot) {
    final prev = slotStatuses[slot.key] ?? SlotStatus.none;
    if (prev == SlotStatus.taken) return;
    slotStatuses[slot.key] = SlotStatus.taken;
    context.read<ActionHistory>().push(
      'Marked ${slot.med.name} (${slot.time}) as taken',
      () => slotStatuses[slot.key] = prev,
    );
    announceStatus(context, '${slot.med.name} at ${slot.time} marked as taken');
  }

  void _unmarkTaken(MedSlot slot) {
    if ((slotStatuses[slot.key] ?? SlotStatus.none) != SlotStatus.taken) return;
    slotStatuses[slot.key] = SlotStatus.none;
    context.read<ActionHistory>().push(
      'Unmarked ${slot.med.name} (${slot.time}) as taken',
      () => slotStatuses[slot.key] = SlotStatus.taken,
    );
    announceStatus(context, '${slot.med.name} at ${slot.time} no longer marked as taken');
  }

  /// Opens the "are you sure?" step as a real dialog route.
  ///
  /// It used to be a plain `Container` laid over the screen inside a `Stack`.
  /// That overlay was never announced as a dialog, left the whole screen
  /// behind it exposed to screen readers, trapped neither focus nor pointers —
  /// a tap on the bottom nav went straight through the dim layer and silently
  /// abandoned the confirmation. `showDialog` gives a modal barrier, a focus
  /// scope and route semantics for free (WCAG 2.1 SC 2.4.3, SC 4.1.2).
  Future<void> _confirmMissed(MedSlot slot) async {
    final scheme = context.read<ThemeNotifier>().scheme;
    final confirmed = await showDialog<bool>(
      context: context,
      barrierColor: Colors.black.withValues(alpha: 0.6),
      barrierLabel: 'Confirm missed dose',
      builder: (_) => _ConfirmDialog(
        scheme: scheme,
        medName: slot.med.name,
        time: slot.time,
      ),
    );
    if (confirmed == true && mounted) _markMissed(slot);
  }

  void _markMissed(MedSlot slot) {
    final prev = slotStatuses[slot.key] ?? SlotStatus.none;
    setState(() => slotStatuses[slot.key] = SlotStatus.missed);
    context.read<ActionHistory>().push(
      'Marked ${slot.med.name} (${slot.time}) as missed',
      () => slotStatuses[slot.key] = prev,
    );
    announceStatus(context,
        '${slot.med.name} at ${slot.time} marked as missed. Your caregiver has been notified.');
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
            CScreenTitle('Medications', scheme: scheme),
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
                  onMissed: () => _confirmMissed(slot),
                ),
              );
            }),
          ],
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
    return Semantics(
      container: true,
      // Live region so marking a dose taken or missed is announced without
      // stealing focus from the button just pressed (SC 4.1.3).
      liveRegion: true,
      label: '$total doses today, $taken taken, $missed missed',
      excludeSemantics: true,
      child: Row(
      children: [
        _Stat(label: 'Total doses', value: '$total', color: scheme.sub, scheme: scheme),
        const SizedBox(width: 10),
        _Stat(label: 'Taken',  value: '$taken',  color: scheme.primary,            scheme: scheme),
        const SizedBox(width: 10),
        _Stat(label: 'Missed', value: '$missed', color: const Color(0xFFC53030),   scheme: scheme),
      ],
      ),
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
        child: Semantics(
          container: true,
          label: '$label: $value',
          excludeSemantics: true,
          child: Column(
            children: [
              Text(value,
                  style: TextStyle(fontSize: 24, fontWeight: FontWeight.w800,
                      color: readableOnTint(color, scheme.bg, 0.1, minRatio: 3.0))),
              const SizedBox(height: 2),
              Text(label, style: TextStyle(fontSize: 11, fontWeight: FontWeight.w600, color: scheme.sub),
                  textAlign: TextAlign.center),
            ],
          ),
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
                      // Header — announced as one sentence (SC 1.3.1).
                      Semantics(
                        container: true,
                        label: '${slot.med.name}, ${slot.med.category}, '
                            '${slot.med.dose}, due at ${slot.time}, ${slot.med.freq}'
                            '${isTaken ? ', taken' : isMissed ? ', missed' : ''}',
                        excludeSemantics: true,
                        child: Row(
                        crossAxisAlignment: CrossAxisAlignment.start,
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
                      ),
                      const SizedBox(height: 14),
                      // Action buttons — same visible text on every card, so
                      // each accessible name says which dose it acts on.
                      Row(
                        children: [
                          Expanded(
                            child: CTappable(
                              label: isTaken
                                  ? 'Undo: mark ${slot.med.name} at ${slot.time} as not taken'
                                  : 'Mark ${slot.med.name} at ${slot.time} as taken',
                              borderRadius: BorderRadius.circular(14),
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
                                      color: isTaken
                                          ? readableOnTint(scheme.primary, scheme.surface, 0.12)
                                          : Colors.white,
                                    ),
                                  ),
                                ),
                              ),
                            ),
                          ),
                          if (!isTaken) ...[
                            const SizedBox(width: 10),
                            Expanded(
                              child: CTappable(
                                label: 'Mark ${slot.med.name} at ${slot.time} as missed',
                                hint: 'Asks you to confirm',
                                borderRadius: BorderRadius.circular(14),
                                onTap: onMissed,
                                child: Container(
                                  height: 52,
                                  decoration: BoxDecoration(
                                    color: isMissed
                                        ? const Color(0xFFC53030).withValues(alpha: 0.1)
                                        : Colors.transparent,
                                    borderRadius: BorderRadius.circular(14),
                                    border: Border.all(
                                      color: readableOn(
                                          const Color(0xFFC53030), scheme.surface,
                                          minRatio: 3.0),
                                      width: 2,
                                    ),
                                  ),
                                  child: Center(
                                    child: Text(
                                      isMissed ? '✗ Missed' : 'I missed this',
                                      style: TextStyle(
                                        fontSize: 15, fontWeight: FontWeight.w700,
                                        color: readableOn(
                                            const Color(0xFFC53030), scheme.surface),
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
  final String medName, time;
  const _ConfirmDialog({required this.scheme, required this.medName, required this.time});

  @override
  Widget build(BuildContext context) {
    // The same wrapper AlertDialog uses: names the route so the screen reader
    // announces "Confirm missed dose, dialog" on open, and scopes it so focus
    // and exploration stay inside until it is dismissed.
    return Semantics(
      scopesRoute: true,
      namesRoute: true,
      explicitChildNodes: true,
      label: 'Confirm missed dose',
      child: Dialog(
        backgroundColor: Colors.transparent,
        elevation: 0,
        insetPadding: const EdgeInsets.symmetric(horizontal: 24),
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
                semanticsLabel: 'Mark $medName at $time as missed? '
                    'Your caregiver will be notified.',
                style: TextStyle(fontSize: 16, fontWeight: FontWeight.w600,
                    color: scheme.text, height: 1.5),
              ),
              const SizedBox(height: 20),
              SizedBox(
                width: double.infinity, height: 56,
                child: ElevatedButton(
                  onPressed: () => Navigator.of(context).pop(true),
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
                  // Focus opens on the non-destructive choice, so a keyboard
                  // user pressing Enter out of habit cannot confirm by accident.
                  autofocus: true,
                  onPressed: () => Navigator.of(context).pop(false),
                  style: OutlinedButton.styleFrom(
                    side: BorderSide(color: scheme.controlBorder, width: 2),
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
    );
  }
}
