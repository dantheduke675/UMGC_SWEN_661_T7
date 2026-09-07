import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../data.dart';
import '../theme.dart';
import '../widgets.dart';

// ── Medication slot status ────────────────────────────────────────────────────

enum SlotStatus { none, taken, missed }

class MedicationsScreen extends StatefulWidget {
  const MedicationsScreen({super.key});

  @override
  State<MedicationsScreen> createState() => _MedicationsScreenState();
}

class _MedicationsScreenState extends State<MedicationsScreen> {
  final Map<String, SlotStatus> _status = {
    '1-0': SlotStatus.taken,
    '3-0': SlotStatus.taken,
  };
  String? _pendingMissedKey; // key awaiting confirm dialog
  final List<_Toast> _toasts = [];
  int _toastId = 0;

  List<MedSlot> get _slots => buildSlots();

  void _markTaken(String key) {
    final prev = _status[key] ?? SlotStatus.none;
    setState(() => _status[key] = SlotStatus.taken);
    _addToast('Marked as taken', () => setState(() => _status[key] = prev));
  }

  void _confirmMissed(String key) => setState(() => _pendingMissedKey = key);

  void _markMissed(String key) {
    final prev = _status[key] ?? SlotStatus.none;
    setState(() {
      _status[key] = SlotStatus.missed;
      _pendingMissedKey = null;
    });
    _addToast('Marked as missed', () => setState(() => _status[key] = prev));
  }

  void _addToast(String msg, VoidCallback undo) {
    final id = ++_toastId;
    setState(() => _toasts.add(_Toast(id: id, msg: msg, undo: undo)));
    Future.delayed(const Duration(seconds: 5), () {
      if (mounted) setState(() => _toasts.removeWhere((t) => t.id == id));
    });
  }

  void _dismissToast(int id) => setState(() => _toasts.removeWhere((t) => t.id == id));

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final takenCount  = _status.values.where((s) => s == SlotStatus.taken).length;
    final missedCount = _status.values.where((s) => s == SlotStatus.missed).length;

    return Stack(
      children: [
        ListView(
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
              final status = _status[slot.key] ?? SlotStatus.none;
              return Padding(
                padding: const EdgeInsets.only(bottom: 12),
                child: _MedCard(
                  slot: slot,
                  status: status,
                  scheme: scheme,
                  onTake:   () => _markTaken(slot.key),
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
            onConfirm: () => _markMissed(_pendingMissedKey!),
            onCancel:  () => setState(() => _pendingMissedKey = null),
          ),

        // ── Undo toasts ──────────────────────────────────────────────────────
        if (_toasts.isNotEmpty)
          Positioned(
            bottom: 16, left: 20, right: 20,
            child: Column(
              mainAxisSize: MainAxisSize.min,
              children: _toasts.map((t) => _UndoToast(
                toast: t,
                scheme: scheme,
                onUndo: () { t.undo(); _dismissToast(t.id); },
                onDismiss: () => _dismissToast(t.id),
              )).toList(),
            ),
          ),
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
  final VoidCallback onTake, onMissed;

  const _MedCard({
    required this.slot, required this.status,
    required this.scheme, required this.onTake, required this.onMissed,
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
                              onTap: isTaken ? null : onTake,
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
                                    isTaken ? '✓ Taken' : 'I took this',
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

// ── Toast model + widget ──────────────────────────────────────────────────────

class _Toast {
  final int id;
  final String msg;
  final VoidCallback undo;
  const _Toast({required this.id, required this.msg, required this.undo});
}

class _UndoToast extends StatelessWidget {
  final _Toast toast;
  final CScheme scheme;
  final VoidCallback onUndo, onDismiss;
  const _UndoToast({required this.toast, required this.scheme, required this.onUndo, required this.onDismiss});

  @override
  Widget build(BuildContext context) {
    return Container(
      margin: const EdgeInsets.only(bottom: 8),
      padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 14),
      decoration: BoxDecoration(
        color: const Color(0xFF1D2534),
        borderRadius: BorderRadius.circular(18),
        boxShadow: [BoxShadow(color: Colors.black.withValues(alpha: 0.25), blurRadius: 12, offset: const Offset(0, 4))],
      ),
      child: Row(
        mainAxisAlignment: MainAxisAlignment.spaceBetween,
        children: [
          Text(toast.msg,
              style: const TextStyle(color: Color(0xFFF5F7FA), fontWeight: FontWeight.w600, fontSize: 15)),
          const SizedBox(width: 12),
          GestureDetector(
            onTap: onUndo,
            child: Container(
              padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 8),
              decoration: BoxDecoration(
                color: const Color(0xFF357C6F), borderRadius: BorderRadius.circular(12)),
              child: const Text('Undo',
                  style: TextStyle(color: Colors.white, fontWeight: FontWeight.w700, fontSize: 14)),
            ),
          ),
        ],
      ),
    );
  }
}
