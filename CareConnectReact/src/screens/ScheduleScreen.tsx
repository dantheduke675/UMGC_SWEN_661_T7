/**
 * ScheduleScreen
 * Week strip + filtered appointment cards. Mirrors Flutter's schedule_screen.dart.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ColorScheme, dark, accessibleAccentText } from '../constants/theme';
import { CChip } from '../components/AppComponents';
import { useScrollContext } from '../context/ScrollContext';

// ── Static appointment data ───────────────────────────────────────────────────

interface Appt {
  title:     string;
  subtitle:  string;
  time:      string;
  duration:  string;
  type:      string;
  dayOffset: number;
  confirmed: boolean;
}

const APPTS: Appt[] = [
  { title: 'Dr. Chen — Follow-up',   subtitle: 'Dr. Sarah Chen · Physician',         time: '2:30 PM',  duration: '45 min', type: 'Physician',  dayOffset: 0, confirmed: true  },
  { title: 'Physical Therapy',        subtitle: 'Valley Rehab Center',                time: '10:00 AM', duration: '60 min', type: 'Therapy',    dayOffset: 1, confirmed: false },
  { title: 'Blood Draw — Lab',        subtitle: 'LabCorp · Fasting required',         time: '8:15 AM',  duration: '15 min', type: 'Lab',        dayOffset: 1, confirmed: true  },
  { title: 'Home Aide Visit',         subtitle: 'James Rivera · Home Aide',           time: '9:00 AM',  duration: '2 hr',   type: 'Home Care',  dayOffset: 2, confirmed: true  },
  { title: 'Cardiology Check-in',     subtitle: 'Dr. Okonkwo · Cardiologist',         time: '3:00 PM',  duration: '30 min', type: 'Specialist', dayOffset: 4, confirmed: true  },
  { title: 'Pharmacy Pick-up',        subtitle: 'CVS Pharmacy · Refills ready',       time: '12:00 PM', duration: '10 min', type: 'Pharmacy',   dayOffset: 4, confirmed: true  },
];

const TYPE_META: Record<string, { color: string; icon: string }> = {
  Physician:  { color: '#6366F1', icon: '🏥' },
  Therapy:    { color: '#357C6F', icon: '🏋️' },
  Lab:        { color: '#F59E0B', icon: '🧪' },
  'Home Care':{ color: '#684BE6', icon: '🏠' },
  Specialist: { color: '#EF4444', icon: '❤️' },
  Pharmacy:   { color: '#22C55E', icon: '💊' },
};

// ── Week strip ────────────────────────────────────────────────────────────────

function WeekStrip({
  today,
  selectedOffset,
  scheme,
  onSelect,
}: {
  today:          Date;
  selectedOffset: number;
  scheme:         ColorScheme;
  onSelect:       (offset: number) => void;
}) {
  const DAY_LETTERS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];
  const todayWd = today.getDay(); // 0=Sun..6=Sat — convert to Mon-based
  const mondayOffset = todayWd === 0 ? -6 : 1 - todayWd;
  const monday = new Date(today);
  monday.setDate(today.getDate() + mondayOffset);

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.weekStrip}
    >
      {Array.from({ length: 7 }).map((_, i) => {
        const date   = new Date(monday);
        date.setDate(monday.getDate() + i);
        const offset = Math.round((date.getTime() - today.getTime()) / 86400000);
        const isSel  = offset === selectedOffset;
        const isToday = offset === 0;
        const hasDot = APPTS.some(a => a.dayOffset === offset);

        const fullLabel = date.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
        const a11yLabel = `${fullLabel}${isToday ? ', today' : ''}${hasDot ? ', has appointments' : ''}`;

        return (
          <TouchableOpacity
            key={i}
            onPress={() => onSelect(offset)}
            activeOpacity={0.7}
            style={[
              styles.dayCell,
              {
                backgroundColor: isSel ? scheme.primary : scheme.surface,
                borderColor: isSel
                  ? scheme.primary
                  : isToday
                  ? scheme.primary + '66'
                  : scheme.border,
                borderWidth: isSel ? 0 : 2,
              },
            ]}
            accessible
            accessibilityRole="button"
            accessibilityLabel={a11yLabel}
            accessibilityState={{ selected: isSel }}
          >
            <Text style={[styles.dayLetter, { color: isSel ? '#FFFFFF' : scheme.sub }]}>
              {DAY_LETTERS[i]}
            </Text>
            <Text
              style={[
                styles.dayNum,
                {
                  color: isSel
                    ? '#FFFFFF'
                    : isToday
                    ? scheme.primaryText
                    : scheme.text,
                },
              ]}
            >
              {date.getDate()}
            </Text>
            <View
              style={[
                styles.dayDot,
                {
                  backgroundColor: hasDot
                    ? isSel
                      ? 'rgba(255,255,255,0.8)'
                      : scheme.primary
                    : 'transparent',
                },
              ]}
            />
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

// ── Appointment card ──────────────────────────────────────────────────────────

function ApptCard({ appt, scheme }: { appt: Appt; scheme: ColorScheme }) {
  const meta  = TYPE_META[appt.type] ?? { color: '#6366F1', icon: '📅' };
  const col   = meta.color;
  const textCol = accessibleAccentText(col, scheme);

  const a11yLabel = `${appt.title}, ${appt.subtitle}, ${appt.time}, ${appt.duration}${appt.confirmed ? '' : ', pending confirmation'}`;

  return (
    <View
      style={[
        styles.apptCard,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
      accessible
      accessibilityLabel={a11yLabel}
    >
      <View style={[styles.apptIcon, { backgroundColor: col + '21' }]}>
        <Text style={{ fontSize: 22 }}>{meta.icon}</Text>
      </View>
      <View style={styles.apptDetails}>
        <Text style={[styles.apptTitle, { color: scheme.text }]}>{appt.title}</Text>
        <Text style={[styles.apptSub, { color: scheme.sub }]}>{appt.subtitle}</Text>
        <View style={styles.chipRow}>
          <CChip label={appt.time}     color={textCol} />
          <View style={{ width: 6 }} />
          <CChip label={appt.duration} color={scheme.sub} />
          {!appt.confirmed && (
            <>
              <View style={{ width: 6 }} />
              <CChip label="Pending" color={accessibleAccentText('#F59E0B', scheme)} />
            </>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

interface Props {
  scheme?: ColorScheme;
}

export default function ScheduleScreen({ scheme = dark }: Props) {
  const scrollRef  = useRef<ScrollView>(null);
  const offsetRef  = useRef(0);
  const { register } = useScrollContext();
  useEffect(() => {
    register((delta: number) => {
      const next = Math.max(0, offsetRef.current + delta);
      scrollRef.current?.scrollTo({ y: next, animated: true });
    });
    return () => register(null);
  }, [register]);

  const [selectedDay, setSelectedDay] = useState(0);
  const today    = new Date();
  const filtered = APPTS.filter(a => a.dayOffset === selectedDay);

  function dayLabel() {
    if (selectedDay === 0) return 'Today';
    if (selectedDay === 1) return 'Tomorrow';
    const d = new Date(today);
    d.setDate(today.getDate() + selectedDay);
    const names = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
    return names[d.getDay()];
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.root, { backgroundColor: scheme.bg }]}
      showsVerticalScrollIndicator={false}
      onScroll={e => { offsetRef.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.heading, { color: scheme.text }]} accessibilityRole="header">Schedule</Text>
        <Text style={[styles.subheading, { color: scheme.sub }]}>
          {APPTS.length} appointments this week
        </Text>
      </View>

      {/* Week strip */}
      <WeekStrip
        today={today}
        selectedOffset={selectedDay}
        scheme={scheme}
        onSelect={setSelectedDay}
      />
      <View style={{ height: 20 }} />

      {/* Day label */}
      <Text style={[styles.dayHeading, { color: scheme.text }]} accessibilityRole="header">{dayLabel()}</Text>
      <View style={{ height: 10 }} />

      {/* Appointments or empty state */}
      {filtered.length === 0 ? (
        <View style={styles.empty}>
          <Text
            style={{ fontSize: 40 }}
          >
            🗓️
          </Text>
          <View style={{ height: 12 }} />
          <Text style={[styles.emptyTitle, { color: scheme.text }]}>No appointments</Text>
          <Text style={[styles.emptySub, { color: scheme.sub }]}>Enjoy your free day.</Text>
        </View>
      ) : (
        filtered.map((appt, i) => (
          <View key={i} style={styles.cardWrap}>
            <ApptCard appt={appt} scheme={scheme} />
          </View>
        ))
      )}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     16,
  },
  heading:    { fontSize: 22, fontWeight: '800' },
  subheading: { fontSize: 13, marginTop: 2 },

  weekStrip: {
    paddingHorizontal: 12,
    gap: 8,
  },
  dayCell: {
    width:          52,
    minHeight:      44,
    borderRadius:   16,
    alignItems:     'center',
    paddingVertical: 8,
    marginHorizontal: 2,
  },
  dayLetter: { fontSize: 11, fontWeight: '700' },
  dayNum:    { fontSize: 16, fontWeight: '800', marginTop: 2 },
  dayDot: {
    width:        6,
    height:       6,
    borderRadius: 3,
    marginTop:    4,
  },

  dayHeading: {
    fontSize:          16,
    fontWeight:        '700',
    paddingHorizontal: 20,
  },
  cardWrap: { paddingHorizontal: 20, marginBottom: 12 },

  apptCard: {
    flexDirection: 'row',
    alignItems:    'flex-start',
    padding:       16,
    borderRadius:  20,
    borderWidth:   1,
  },
  apptIcon: {
    width:          48,
    height:         48,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  apptDetails: { flex: 1, marginLeft: 14 },
  apptTitle:   { fontSize: 15, fontWeight: '700' },
  apptSub:     { fontSize: 13, marginTop: 2 },
  chipRow:     { flexDirection: 'row', flexWrap: 'wrap', marginTop: 6 },

  empty: {
    alignItems:        'center',
    paddingVertical:   32,
    paddingHorizontal: 20,
  },
  emptyTitle: { fontSize: 16, fontWeight: '700' },
  emptySub:   { fontSize: 13, marginTop: 4 },
});
