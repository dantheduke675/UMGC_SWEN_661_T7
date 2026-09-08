import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import '../theme.dart';
import '../widgets.dart';

// ── Static appointment data ───────────────────────────────────────────────────

class _Appt {
  final String title, subtitle, time, duration, type, dayLabel;
  final int dayOffset; // 0 = today, 1 = tomorrow, etc.
  final bool confirmed;
  const _Appt({
    required this.title, required this.subtitle, required this.time,
    required this.duration, required this.type, required this.dayLabel,
    required this.dayOffset, this.confirmed = true,
  });
}

const _appts = [
  _Appt(
    title: 'Dr. Chen — Follow-up',
    subtitle: 'Dr. Sarah Chen · Physician',
    time: '2:30 PM', duration: '45 min', type: 'Physician',
    dayLabel: 'Today', dayOffset: 0,
  ),
  _Appt(
    title: 'Physical Therapy',
    subtitle: 'Valley Rehab Center',
    time: '10:00 AM', duration: '60 min', type: 'Therapy',
    dayLabel: 'Tomorrow', dayOffset: 1, confirmed: false,
  ),
  _Appt(
    title: 'Blood Draw — Lab',
    subtitle: 'LabCorp · Fasting required',
    time: '8:15 AM', duration: '15 min', type: 'Lab',
    dayLabel: 'Tomorrow', dayOffset: 1,
  ),
  _Appt(
    title: 'Home Aide Visit',
    subtitle: 'James Rivera · Home Aide',
    time: '9:00 AM', duration: '2 hr', type: 'Home Care',
    dayLabel: 'Wednesday', dayOffset: 2,
  ),
  _Appt(
    title: 'Cardiology Check-in',
    subtitle: 'Dr. Okonkwo · Cardiologist',
    time: '3:00 PM', duration: '30 min', type: 'Specialist',
    dayLabel: 'Friday', dayOffset: 4,
  ),
  _Appt(
    title: 'Pharmacy Pick-up',
    subtitle: 'CVS Pharmacy · Refills ready',
    time: '12:00 PM', duration: '10 min', type: 'Pharmacy',
    dayLabel: 'Friday', dayOffset: 4,
  ),
];

// ── Screen ────────────────────────────────────────────────────────────────────

class ScheduleScreen extends StatefulWidget {
  const ScheduleScreen({super.key});
  @override
  State<ScheduleScreen> createState() => _ScheduleScreenState();
}

class _ScheduleScreenState extends State<ScheduleScreen> {
  int _selectedDay = 0; // 0 = today

  @override
  Widget build(BuildContext context) {
    final scheme = context.watch<ThemeNotifier>().scheme;
    final scrollController = context.read<ScrollController>();
    final now    = DateTime.now();
    final filtered = _appts.where((a) => a.dayOffset == _selectedDay).toList();

    return ListView(
      controller: scrollController,
      padding: const EdgeInsets.fromLTRB(0, 20, 0, 24),
      children: [
        // ── Header ─────────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Text('Schedule',
                  style: TextStyle(fontSize: 22, fontWeight: FontWeight.w800, color: scheme.text)),
              const SizedBox(height: 2),
              Text('${_appts.length} appointments this week',
                  style: TextStyle(fontSize: 13, color: scheme.sub)),
            ],
          ),
        ),
        const SizedBox(height: 16),

        // ── Week strip ──────────────────────────────────────────────────────
        _WeekStrip(
          today: now,
          selectedOffset: _selectedDay,
          appointments: _appts,
          scheme: scheme,
          onSelect: (i) => setState(() => _selectedDay = i),
        ),
        const SizedBox(height: 20),

        // ── Day label ───────────────────────────────────────────────────────
        Padding(
          padding: const EdgeInsets.symmetric(horizontal: 20),
          child: Text(
            _selectedDay == 0 ? 'Today' : _selectedDay == 1 ? 'Tomorrow'
                : _weekdayName(now.add(Duration(days: _selectedDay)).weekday),
            style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.text),
          ),
        ),
        const SizedBox(height: 10),

        // ── Appointment cards ───────────────────────────────────────────────
        if (filtered.isEmpty)
          Padding(
            padding: const EdgeInsets.symmetric(horizontal: 20, vertical: 32),
            child: Center(
              child: Column(
                children: [
                  Text('🗓️', style: const TextStyle(fontSize: 40)),
                  const SizedBox(height: 12),
                  Text('No appointments',
                      style: TextStyle(fontSize: 16, fontWeight: FontWeight.w700, color: scheme.text)),
                  const SizedBox(height: 4),
                  Text('Enjoy your free day.',
                      style: TextStyle(fontSize: 13, color: scheme.sub)),
                ],
              ),
            ),
          )
        else
          ...filtered.map((a) => Padding(
            padding: const EdgeInsets.fromLTRB(20, 0, 20, 12),
            child: _ApptCard(appt: a, scheme: scheme),
          )),
      ],
    );
  }

  String _weekdayName(int wd) {
    const days = ['Monday','Tuesday','Wednesday','Thursday','Friday','Saturday','Sunday'];
    return days[(wd - 1).clamp(0, 6)];
  }
}

// ── Week strip ────────────────────────────────────────────────────────────────

class _WeekStrip extends StatelessWidget {
  final DateTime today;
  final int selectedOffset;
  final List<_Appt> appointments;
  final CScheme scheme;
  final void Function(int) onSelect;

  const _WeekStrip({
    required this.today, required this.selectedOffset,
    required this.appointments, required this.scheme, required this.onSelect,
  });

  @override
  Widget build(BuildContext context) {
    const days = ['M','T','W','T','F','S','S'];
    // Monday = weekday 1; we show Mon–Sun relative to today's week
    final todayWd = today.weekday; // 1=Mon..7=Sun
    // Build 7 day entries starting from Monday of this week
    final mondayDate = today.subtract(Duration(days: todayWd - 1));

    return SizedBox(
      height: 72,
      child: ListView.builder(
        scrollDirection: Axis.horizontal,
        padding: const EdgeInsets.symmetric(horizontal: 12),
        itemCount: 7,
        itemBuilder: (_, i) {
          final date    = mondayDate.add(Duration(days: i));
          final offset  = date.difference(today).inDays;
          final label   = days[i];
          final dayNum  = date.day;
          final isToday = offset == 0;
          final isSel   = offset == selectedOffset;
          final hasDot  = appointments.any((a) => a.dayOffset == offset);

          return GestureDetector(
            onTap: () => onSelect(offset),
            child: Container(
              width: 52,
              margin: const EdgeInsets.symmetric(horizontal: 4, vertical: 4),
              decoration: BoxDecoration(
                color: isSel ? scheme.primary : scheme.surface,
                borderRadius: BorderRadius.circular(16),
                border: Border.all(
                  color: isSel ? scheme.primary : isToday ? scheme.primary.withValues(alpha: 0.4) : scheme.border,
                  width: isSel ? 0 : 2,
                ),
              ),
              child: Column(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Text(label,
                      style: TextStyle(
                        fontSize: 11, fontWeight: FontWeight.w700,
                        color: isSel ? Colors.white : scheme.sub,
                      )),
                  const SizedBox(height: 2),
                  Text('$dayNum',
                      style: TextStyle(
                        fontSize: 16, fontWeight: FontWeight.w800,
                        color: isSel ? Colors.white : isToday ? scheme.primary : scheme.text,
                      )),
                  const SizedBox(height: 4),
                  Container(
                    width: 6, height: 6,
                    decoration: BoxDecoration(
                      shape: BoxShape.circle,
                      color: hasDot
                          ? (isSel ? Colors.white.withValues(alpha: 0.8) : scheme.primary)
                          : Colors.transparent,
                    ),
                  ),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

// ── Appointment card ──────────────────────────────────────────────────────────

class _ApptCard extends StatelessWidget {
  final _Appt appt;
  final CScheme scheme;
  const _ApptCard({required this.appt, required this.scheme});

  Color get _typeColor {
    switch (appt.type) {
      case 'Physician':  return const Color(0xFF6366F1);
      case 'Therapy':    return const Color(0xFF357C6F);
      case 'Lab':        return const Color(0xFFF59E0B);
      case 'Home Care':  return const Color(0xFF684BE6);
      case 'Specialist': return const Color(0xFFEF4444);
      case 'Pharmacy':   return const Color(0xFF22C55E);
      default:           return const Color(0xFF6366F1);
    }
  }

  String get _typeIcon {
    switch (appt.type) {
      case 'Physician':  return '🏥';
      case 'Therapy':    return '🏋️';
      case 'Lab':        return '🧪';
      case 'Home Care':  return '🏠';
      case 'Specialist': return '❤️';
      case 'Pharmacy':   return '💊';
      default:           return '📅';
    }
  }

  @override
  Widget build(BuildContext context) {
    final col = _typeColor;
    return Container(
      padding: const EdgeInsets.all(16),
      decoration: BoxDecoration(
        color: scheme.surface,
        borderRadius: BorderRadius.circular(20),
        border: Border.all(color: scheme.border),
      ),
      child: Row(
        children: [
          // Icon
          Container(
            width: 48, height: 48,
            decoration: BoxDecoration(
              color: col.withValues(alpha: 0.13),
              borderRadius: BorderRadius.circular(14),
            ),
            child: Center(child: Text(_typeIcon, style: const TextStyle(fontSize: 22))),
          ),
          const SizedBox(width: 14),
          // Details
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(appt.title,
                    style: TextStyle(fontSize: 15, fontWeight: FontWeight.w700, color: scheme.text)),
                const SizedBox(height: 2),
                Text(appt.subtitle,
                    style: TextStyle(fontSize: 13, color: scheme.sub)),
                const SizedBox(height: 6),
                Row(
                  children: [
                    CChip(label: appt.time, color: col),
                    const SizedBox(width: 6),
                    CChip(label: appt.duration, color: scheme.sub),
                    const SizedBox(width: 6),
                    if (!appt.confirmed)
                      CChip(label: 'Pending', color: const Color(0xFFF59E0B)),
                  ],
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}
