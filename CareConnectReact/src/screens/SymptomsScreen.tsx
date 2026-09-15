/**
 * SymptomsScreen
 * Symptom chip picker, severity selector (1–5 tappable dots), log history.
 * Mirrors Flutter's symptoms_screen.dart exactly.
 */
import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ColorScheme, dark } from '../constants/theme';
import { useScrollContext } from '../context/ScrollContext';

// ── Data ──────────────────────────────────────────────────────────────────────

interface SymptomOpt { emoji: string; label: string }
const SYMPTOM_OPTS: SymptomOpt[] = [
  { emoji: '😣', label: 'Pain'      },
  { emoji: '😵', label: 'Dizziness' },
  { emoji: '🤢', label: 'Nausea'    },
  { emoji: '😴', label: 'Fatigue'   },
  { emoji: '😤', label: 'Breathing' },
  { emoji: '🧠', label: 'Headache'  },
];

interface SymptomLog {
  name:     string;
  time:     string;
  severity: number;
  emoji:    string;
  notes:    string;
}

const INITIAL_LOGS: SymptomLog[] = [
  { name: 'Pain',      time: 'Today · 9:10 AM',        severity: 2, emoji: '😣', notes: 'Mild knee ache after morning walk' },
  { name: 'Fatigue',   time: 'Today · 7:30 AM',        severity: 3, emoji: '😴', notes: 'Felt tired after waking up'        },
  { name: 'Dizziness', time: 'Yesterday · 3:45 PM',    severity: 4, emoji: '😵', notes: 'Brief episode when standing'       },
  { name: 'Nausea',    time: 'Yesterday · 12:00 PM',   severity: 2, emoji: '🤢', notes: 'After lunch — passed quickly'      },
  { name: 'Headache',  time: 'Mon · 8:00 PM',          severity: 3, emoji: '🧠', notes: ''                                  },
];

// ── Severity bar ──────────────────────────────────────────────────────────────

function SeverityBar({ level, scheme }: { level: number; scheme: ColorScheme }) {
  const col =
    level <= 2 ? '#22C55E' :
    level === 3 ? '#F59E0B' :
    '#EF4444';

  return (
    <View style={styles.severityBarTrack}>
      {Array.from({ length: 5 }).map((_, i) => (
        <View
          key={i}
          style={[
            styles.severityBarSeg,
            { backgroundColor: i < level ? col : scheme.border },
          ]}
        />
      ))}
    </View>
  );
}

// ── Severity picker (5 tappable dots) ────────────────────────────────────────

function SeverityPicker({
  value,
  scheme,
  onChange,
}: {
  value:    number;
  scheme:   ColorScheme;
  onChange: (v: number) => void;
}) {
  const col =
    value <= 2 ? '#22C55E' :
    value === 3 ? '#F59E0B' :
    '#EF4444';

  return (
    <View style={styles.severityPicker}>
      <Text style={[styles.severityEdge, { color: scheme.muted }]}>Mild</Text>
      <View style={styles.severityDots}>
        {[1, 2, 3, 4, 5].map(v => (
          <TouchableOpacity
            key={v}
            onPress={() => onChange(v)}
            activeOpacity={0.7}
            style={[
              styles.severityDot,
              {
                backgroundColor: v <= value ? col : scheme.surface2,
                borderColor:     v <= value ? col : scheme.border,
                width:  v === value ? 36 : 28,
                height: v === value ? 36 : 28,
              },
            ]}
          >
            {v === value && (
              <Text style={{ fontSize: 12, fontWeight: '800', color: '#FFFFFF' }}>
                {v}
              </Text>
            )}
          </TouchableOpacity>
        ))}
      </View>
      <Text style={[styles.severityEdge, { color: scheme.muted }]}>Severe</Text>
    </View>
  );
}

// ── Log card (expandable logger) ──────────────────────────────────────────────

function LogCard({
  scheme,
  expanded,
  selected,
  severity,
  onToggle,
  onSelect,
  onSeverityChange,
  onSubmit,
}: {
  scheme:          ColorScheme;
  expanded:        boolean;
  selected:        string | null;
  severity:        number;
  onToggle:        () => void;
  onSelect:        (s: string) => void;
  onSeverityChange:(v: number) => void;
  onSubmit:        () => void;
}) {
  return (
    <View
      style={[
        styles.logCard,
        {
          backgroundColor: scheme.primary + '14',
          borderColor:     scheme.primary + '33',
        },
      ]}
    >
      {/* Header row */}
      <TouchableOpacity onPress={onToggle} activeOpacity={0.8} style={styles.logCardHeader}>
        <View style={[styles.logCardPlus, { backgroundColor: scheme.primary }]}>
          <Text style={styles.logCardPlusText}>+</Text>
        </View>
        <Text style={[styles.logCardTitle, { color: scheme.text }]}>Log a symptom</Text>
        <Text style={[styles.logCardChevron, { color: scheme.sub }]}>
          {expanded ? '▲' : '▼'}
        </Text>
      </TouchableOpacity>

      {expanded && (
        <>
          <View style={{ height: 16 }} />

          {/* What are you feeling? */}
          <Text style={[styles.logSectionLabel, { color: scheme.sub }]}>
            What are you feeling?
          </Text>
          <View style={{ height: 10 }} />
          <View style={styles.chipWrap}>
            {SYMPTOM_OPTS.map(opt => {
              const isSel = selected === opt.label;
              return (
                <TouchableOpacity
                  key={opt.label}
                  onPress={() => onSelect(opt.label)}
                  activeOpacity={0.7}
                  style={[
                    styles.symptomChip,
                    {
                      backgroundColor: isSel ? scheme.primary : scheme.surface,
                      borderColor:     isSel ? scheme.primary : scheme.border,
                    },
                  ]}
                >
                  <Text style={{ fontSize: 16 }}>{opt.emoji}</Text>
                  <Text
                    style={[
                      styles.symptomChipLabel,
                      { color: isSel ? '#FFFFFF' : scheme.text },
                    ]}
                  >
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
          <View style={{ height: 16 }} />

          {/* Severity */}
          <Text style={[styles.logSectionLabel, { color: scheme.sub }]}>Severity</Text>
          <View style={{ height: 8 }} />
          <SeverityPicker value={severity} scheme={scheme} onChange={onSeverityChange} />
          <View style={{ height: 14 }} />

          {/* Submit */}
          <TouchableOpacity
            onPress={selected ? onSubmit : undefined}
            activeOpacity={selected ? 0.85 : 1}
            style={[
              styles.submitBtn,
              { backgroundColor: selected ? scheme.primary : scheme.surface2 },
            ]}
          >
            <Text
              style={[
                styles.submitBtnText,
                { color: selected ? '#FFFFFF' : scheme.muted },
              ]}
            >
              Log symptom
            </Text>
          </TouchableOpacity>
        </>
      )}
    </View>
  );
}

// ── Log tile ──────────────────────────────────────────────────────────────────

function LogTile({ log, scheme }: { log: SymptomLog; scheme: ColorScheme }) {
  const col =
    log.severity <= 2 ? '#22C55E' :
    log.severity === 3 ? '#F59E0B' :
    '#EF4444';

  return (
    <View
      style={[
        styles.logTile,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
    >
      <View style={styles.logTileTop}>
        <View
          style={[
            styles.logTileIcon,
            { backgroundColor: col + '1F' },
          ]}
        >
          <Text style={{ fontSize: 20 }}>{log.emoji}</Text>
        </View>
        <View style={styles.logTileInfo}>
          <Text style={[styles.logTileName, { color: scheme.text }]}>{log.name}</Text>
          <Text style={[styles.logTileTime, { color: scheme.sub }]}>{log.time}</Text>
        </View>
        <View style={[styles.severityBadge, { backgroundColor: col + '1F' }]}>
          <Text style={[styles.severityBadgeText, { color: col }]}>{log.severity}/5</Text>
        </View>
      </View>
      <View style={{ height: 10 }} />
      <SeverityBar level={log.severity} scheme={scheme} />
      {log.notes.length > 0 && (
        <>
          <View style={{ height: 8 }} />
          <Text style={[styles.logTileNotes, { color: scheme.sub }]}>{log.notes}</Text>
        </>
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

interface Props {
  scheme?: ColorScheme;
}

export default function SymptomsScreen({ scheme = dark }: Props) {
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

  const [logs, setLogs] = useState<SymptomLog[]>(INITIAL_LOGS);
  const [selected, setSelected] = useState<string | null>(null);
  const [severity, setSeverity] = useState(3);
  const [showLogger, setShowLogger] = useState(false);

  function logSymptom() {
    if (!selected) return;
    const opt  = SYMPTOM_OPTS.find(o => o.label === selected)!;
    const now  = new Date();
    const h    = now.getHours();
    const hh   = h > 12 ? h - 12 : h === 0 ? 12 : h;
    const mm   = now.getMinutes().toString().padStart(2, '0');
    const ampm = h >= 12 ? 'PM' : 'AM';

    setLogs(prev => [
      {
        name: selected,
        time: `Today · ${hh}:${mm} ${ampm}`,
        severity,
        emoji: opt.emoji,
        notes: '',
      },
      ...prev,
    ]);
    setSelected(null);
    setSeverity(3);
    setShowLogger(false);
  }

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.root, { backgroundColor: scheme.bg }]}
      showsVerticalScrollIndicator={false}
      onScroll={e => { offsetRef.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.heading, { color: scheme.text }]}>Symptoms</Text>
      <Text style={[styles.subheading, { color: scheme.sub }]}>
        Track how you feel throughout the day
      </Text>
      <View style={{ height: 20 }} />

      <LogCard
        scheme={scheme}
        expanded={showLogger}
        selected={selected}
        severity={severity}
        onToggle={() => setShowLogger(v => !v)}
        onSelect={setSelected}
        onSeverityChange={setSeverity}
        onSubmit={logSymptom}
      />
      <View style={{ height: 20 }} />

      <Text style={[styles.sectionLabel, { color: scheme.text }]}>Recent logs</Text>
      <View style={{ height: 10 }} />

      {logs.map((log, i) => (
        <View key={i} style={{ marginBottom: 12 }}>
          <LogTile log={log} scheme={scheme} />
        </View>
      ))}
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  heading:      { fontSize: 22, fontWeight: '800' },
  subheading:   { fontSize: 13, marginTop: 2 },
  sectionLabel: { fontSize: 16, fontWeight: '700' },

  // Log card
  logCard: {
    padding:      16,
    borderRadius: 20,
    borderWidth:  1,
  },
  logCardHeader: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  logCardPlus: {
    width:          40,
    height:         40,
    borderRadius:   20,
    alignItems:     'center',
    justifyContent: 'center',
  },
  logCardPlusText: {
    fontSize:   22,
    color:      '#FFFFFF',
    fontWeight: '700',
    lineHeight: 26,
  },
  logCardTitle:   { flex: 1, marginLeft: 12, fontSize: 15, fontWeight: '700' },
  logCardChevron: { fontSize: 13 },
  logSectionLabel: { fontSize: 13, fontWeight: '600' },
  chipWrap: {
    flexDirection: 'row',
    flexWrap:      'wrap',
    gap:           8,
  },
  symptomChip: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:   12,
    borderWidth:    2,
    gap:            6,
  },
  symptomChipLabel: { fontSize: 13, fontWeight: '700' },

  // Severity picker
  severityPicker: {
    flexDirection: 'row',
    alignItems:    'center',
    gap:           8,
  },
  severityEdge: { fontSize: 12, fontWeight: '600', minWidth: 36 },
  severityDots: {
    flex:           1,
    flexDirection:  'row',
    alignItems:     'center',
    justifyContent: 'space-around',
  },
  severityDot: {
    borderRadius:   18,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },

  submitBtn: {
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  submitBtnText: { fontSize: 15, fontWeight: '700' },

  // Severity bar
  severityBarTrack: {
    flexDirection: 'row',
    gap:           4,
    height:        6,
  },
  severityBarSeg: {
    flex:         1,
    borderRadius: 3,
  },

  // Log tile
  logTile: {
    padding:      16,
    borderRadius: 20,
    borderWidth:  1,
  },
  logTileTop: {
    flexDirection: 'row',
    alignItems:    'center',
  },
  logTileIcon: {
    width:          44,
    height:         44,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },
  logTileInfo: { flex: 1, marginLeft: 12 },
  logTileName: { fontSize: 15, fontWeight: '700' },
  logTileTime: { fontSize: 12, marginTop: 2 },
  severityBadge: {
    paddingHorizontal: 10,
    paddingVertical:    5,
    borderRadius:      20,
  },
  severityBadgeText: { fontSize: 12, fontWeight: '700' },
  logTileNotes:      { fontSize: 13, lineHeight: 18 },
});
