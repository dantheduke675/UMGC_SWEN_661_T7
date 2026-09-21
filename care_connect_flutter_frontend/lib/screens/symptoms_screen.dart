import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../action_history.dart';
import '../theme.dart';
import '../widgets.dart';

// ── Data models ───────────────────────────────────────────────────────────────

class _SymptomLog {
  final String name, time, notes;
  final int severity; // 1–5
  final String emoji;
  _SymptomLog({
    required this.name, required this.time, required this.severity,
    required this.emoji, this.notes = '',
  });
}

const _symptomOptions = [
  (emoji: '😣', label: 'Pain'),
  (emoji: '😵', label: 'Dizziness'),
  (emoji: '🤢', label: 'Nausea'),
  (emoji: '😴', label: 'Fatigue'),
  (emoji: '😤', label: 'Breathing'),
  (emoji: '🧠', label: 'Headache'),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class SymptomsScreen extends StatefulWidget {
  const SymptomsScreen({super.key});
  @override
  State<SymptomsScreen> createState() => _SymptomsScreenState();
}

class _SymptomsScreenState extends State<SymptomsScreen> {
  final List<_SymptomLog> _logs = [
    _SymptomLog(name: 'Pain', time: 'Today · 9:10 AM',    severity: 2, emoji: '😣', notes: 'Mild knee ache after morning walk'),
    _SymptomLog(name: 'Fatigue', time: 'Today · 7:30 AM', severity: 3, emoji: '😴', notes: 'Felt tired after waking up'),
    _SymptomLog(name: 'Dizziness', time: 'Yesterday · 3:45 PM', severity: 4, emoji: '😵', notes: 'Brief episode when standing'),
    _SymptomLog(name: 'Nausea', time: 'Yesterday · 12:00 PM', severity: 2, emoji: '🤢', notes: 'After lunch — passed quickly'),
    _SymptomLog(name: 'Headache', time: 'Mon · 8:00 PM',   severity: 3, emoji: '🧠', notes: ''),
  ];

  String? _selectedSymptom;
  int _severity = 3;
  bool _showLogger = false;

  void _logSymptom() {
    if (_selectedSymptom == null) return;
    final opt = _symptomOptions.firstWhere((o) => o.label == _selectedSymptom);
    final now = DateTime.now();
    final entry = _SymptomLog(
      name: _selectedSymptom!,
      time: 'Today · ${_formatTime(now)}',
      severity: _severity,
      emoji: opt.emoji,
    );
    setState(() {
      _logs.insert(0, entry);
      _selectedSymptom = null;
      _severity = 3;
      _showLogger = false;
    });
    context.read<ActionHistory>().push(
      'Logged ${entry.name} (severity ${entry.severity}/5)',
      // No setState here: this undo can also be triggered from another
      // tab's undo button, after this screen (and its State) is gone.
      // ActionHistory.notifyListeners() plus the context.watch below is
      // what refreshes this screen's list when it's still around.
      () => _logs.remove(entry),
    );
    announceStatus(context,
        '${entry.name} logged at severity ${entry.severity} of 5');
  }

  String _formatTime(DateTime d) {
    final h = d.hour > 12 ? d.hour - 12 : d.hour == 0 ? 12 : d.hour;
    final m = d.minute.toString().padLeft(2, '0');
    return '$h:$m ${d.hour >= 12 ? "PM" : "AM"}';
  }

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final scrollController = context.read<ScrollController>();
    // Rebuild whenever an action is pushed/undone (from this screen or any
    // other tab) so a symptom log undone via the shared undo button
    // disappears from this list too.
    context.watch<ActionHistory>();

    return Stack(
      children: [
        ListView(
          controller: scrollController,
          padding: const EdgeInsets.fromLTRB(20, 20, 20, 24),
          children: [
            // ── Header ─────────────────────────────────────────────────────
            CScreenTitle('Symptoms', scheme: scheme),
            const SizedBox(height: 2),
            Text('Track how you feel throughout the day',
                style: TextStyle(fontSize: 13, color: scheme.sub)),
            const SizedBox(height: 20),

            // ── Log new symptom card ──────────────────────────────────────
            _LogCard(
              scheme: scheme,
              expanded: _showLogger,
              selected: _selectedSymptom,
              severity: _severity,
              onToggle: () => setState(() => _showLogger = !_showLogger),
              onSelect: (s) => setState(() => _selectedSymptom = s),
              onSeverityChange: (v) => setState(() => _severity = v),
              onSubmit: _logSymptom,
            ),
            const SizedBox(height: 20),

            // ── Recent logs ───────────────────────────────────────────────
            // Live region: logging a symptom changes the count, which is how
            // TalkBack learns the entry landed (SC 4.1.3).
            Semantics(
              liveRegion: true,
              label: 'Recent logs, ${_logs.length} '
                  '${_logs.length == 1 ? 'entry' : 'entries'}',
              excludeSemantics: true,
              child: CSectionHeader('Recent logs', scheme: scheme),
            ),
            const SizedBox(height: 10),

            ..._logs.map((log) => Padding(
              padding: const EdgeInsets.only(bottom: 12),
              child: _LogTile(log: log, scheme: scheme),
            )),
          ],
        ),
        const UndoFab(),
      ],
    );
  }
}

// ── Log new symptom card ──────────────────────────────────────────────────────

//essentially the questionaire for the care recipients symptoms
class _LogCard extends StatelessWidget {
  final CScheme scheme;
  final bool expanded;
  final String? selected;
  final int severity;
  final VoidCallback onToggle;
  final void Function(String) onSelect;
  final void Function(int) onSeverityChange;
  final VoidCallback onSubmit;

  const _LogCard({
    required this.scheme, required this.expanded, required this.selected,
    required this.severity, required this.onToggle, required this.onSelect,
    required this.onSeverityChange, required this.onSubmit,
  });

  @override
  Widget build(BuildContext context) {
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.primary.withValues(alpha: 0.08),
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.primary.withValues(alpha: 0.2)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          // Header row
          CTappable(
            label: 'Log a symptom',
            hint: expanded
                ? 'Expanded. Activate to collapse'
                : 'Collapsed. Activate to expand',
            onTap: onToggle,
            child: Row(
              children: [
                Container(
                  width: 40, height: 40,
                  decoration: BoxDecoration(color: scheme.primary, shape: BoxShape.circle),
                  child: const Center(child: CGlyph('+', style: TextStyle(fontSize: 22, color: Colors.white, fontWeight: FontWeight.w700))),
                ),
                const SizedBox(width: 12),
                Expanded(
                  child: Text('Log a symptom',
                      style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: scheme.text)),
                ),
                CGlyph(expanded ? '▲' : '▼',
                    style: TextStyle(fontSize: 13, color: scheme.sub)),
              ],
            ),
          ),

          if (expanded) ...[
            const SizedBox(height: 16),
            // Symptom picker.
            //
            // `container: true` keeps this prompt as its own node. Without it
            // Flutter merges the loose labels in this card into one, and the
            // on-device tree read "What are you feeling? Severity Mild
            // Severe" as a single blob announced before any of the controls
            // it describes — the prompt detached from the chips, the slider's
            // scale detached from the slider (WCAG 2.1 SC 1.3.1).
            Semantics(
              container: true,
              child: Text('What are you feeling?',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: scheme.sub)),
            ),
            const SizedBox(height: 10),
            Wrap(
              spacing: 8, runSpacing: 8,
              children: _symptomOptions.map((opt) {
                final isSel = selected == opt.label;
                return CTappable(
                  label: opt.label,
                  selected: isSel,
                  borderRadius: BorderRadius.circular(12),
                  onTap: () => onSelect(opt.label),
                  child: Container(
                    padding: const EdgeInsets.symmetric(horizontal: 14, vertical: 10),
                    decoration: BoxDecoration(
                      color: isSel ? scheme.primary : scheme.surface,
                      borderRadius: BorderRadius.circular(12),
                      border: Border.all(
                        color: isSel ? scheme.primary : scheme.controlBorder, width: 2,
                      ),
                    ),
                    child: Row(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        CGlyph(opt.emoji, style: const TextStyle(fontSize: 16)),
                        const SizedBox(width: 6),
                        Text(opt.label,
                            style: TextStyle(
                              fontSize: 13, fontWeight: FontWeight.w700,
                              color: isSel ? Colors.white : scheme.text,
                            )),
                      ],
                    ),
                  ),
                );
              }).toList(),
            ),
            const SizedBox(height: 16),

            // Severity slider — same story as the prompt above.
            Semantics(
              container: true,
              child: Text('Severity',
                  style: TextStyle(fontSize: 13, fontWeight: FontWeight.w600, color: scheme.sub)),
            ),
            const SizedBox(height: 8),
            Row(
              children: [
                Text('Mild', style: TextStyle(fontSize: 12, color: scheme.muted)),
                Expanded(
                  child: Material(
                    type: MaterialType.transparency,
                    child: Slider(
                      value: severity.toDouble(),
                      min: 1, max: 5, divisions: 4,
                      // Without these the slider announced a bare number with
                      // no indication of what it measured (SC 3.3.2, 4.1.2).
                      label: 'Severity $severity of 5',
                      semanticFormatterCallback: (v) =>
                          'Severity ${v.round()} of 5',
                      activeColor: scheme.primary,
                      inactiveColor: scheme.surface2,
                      onChanged: (v) => onSeverityChange(v.round()),
                    ),
                  ),
                ),
                Text('Severe', style: TextStyle(fontSize: 12, color: scheme.muted)),
              ],
            ),
            const SizedBox(height: 12),

            // Submit
            CTappable(
              label: 'Log symptom',
              hint: selected == null
                  ? 'Choose what you are feeling first'
                  : 'Logs $selected at severity $severity of 5',
              borderRadius: BorderRadius.circular(14),
              onTap: selected != null ? onSubmit : null,
              child: Container(
                width: double.infinity, height: 52,
                decoration: BoxDecoration(
                  color: selected != null ? scheme.primary : scheme.surface2,
                  borderRadius: BorderRadius.circular(14),
                ),
                child: Center(
                  child: Text('Log symptom',
                      style: TextStyle(
                        fontSize: 15, fontWeight: FontWeight.w700,
                        color: selected != null ? Colors.white : scheme.muted,
                      )),
                ),
              ),
            ),
          ],
        ],
      ),
    );
  }
}

// ── Symptom log tile ──────────────────────────────────────────────────────────

class _LogTile extends StatelessWidget {
  final _SymptomLog log;
  final CScheme scheme;
  const _LogTile({required this.log, required this.scheme});

  Color get _severityColor {
    if (log.severity <= 2) return const Color(0xFF22C55E);
    if (log.severity == 3) return const Color(0xFFF59E0B);
    return const Color(0xFFEF4444);
  }

  @override
  Widget build(BuildContext context) {
    final col = _severityColor;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.border),
      ),
      child: Semantics(
        container: true,
        label: '${log.name}, severity ${log.severity} of 5, ${log.time}'
            '${log.notes.isNotEmpty ? '. ${log.notes}' : ''}',
        excludeSemantics: true,
        child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 44, height: 44,
                decoration: BoxDecoration(
                  color: col.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Center(child: CGlyph(log.emoji, style: const TextStyle(fontSize: 20))),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(log.name,
                        style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: scheme.text)),
                    const SizedBox(height: 2),
                    Text(log.time,
                        style: TextStyle(fontSize: 12, color: scheme.sub)),
                  ],
                ),
              ),
              Container(
                padding: const EdgeInsets.symmetric(horizontal: 10, vertical: 5),
                decoration: BoxDecoration(
                  color: col.withValues(alpha: 0.12),
                  borderRadius: BorderRadius.circular(20),
                ),
                child: Text('${log.severity}/5',
                    style: TextStyle(fontSize: 12, fontWeight: FontWeight.w700,
                        color: readableOnTint(col, scheme.surface, 0.12))),
              ),
            ],
          ),
          const SizedBox(height: 10),
          CSeverityBar(level: log.severity),
          if (log.notes.isNotEmpty) ...[
            const SizedBox(height: 8),
            Text(log.notes,
                style: TextStyle(fontSize: 13, color: scheme.sub, height: 1.4)),
          ],
        ],
      ),
      ),
    );
  }
}
