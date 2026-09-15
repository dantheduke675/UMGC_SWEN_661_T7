/**
 * TodayScreen
 * Daily dashboard: greeting, medication progress card, next appointment,
 * first 4 medication slots with take buttons, and undo toasts.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import { ColorScheme, dark } from '../constants/theme';
import { buildSlots, patient, MedSlot } from '../constants/data';
import {
  SectionLabel,
  UndoToast,
  UndoHistoryButton,
  UndoHistoryPanel,
  LinearProgressBar,
} from '../components/AppComponents';
import { useScrollContext } from '../context/ScrollContext';
import { useUndoHistory } from '../hooks/useUndoHistory';

interface Props {
  scheme?: ColorScheme;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function formatDate(d: Date): string {
  const days   = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'];
  const months = ['January','February','March','April','May','June','July',
                  'August','September','October','November','December'];
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`;
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ProgressCard({
  taken, total, pct, scheme,
}: {
  taken: number; total: number; pct: number; scheme: ColorScheme;
}) {
  return (
    <View style={[styles.progressCard, { backgroundColor: scheme.primary }]}>
      <View style={styles.progressLeft}>
        <Text style={styles.progressLabel}>{"TODAY'S MEDICATIONS"}</Text>
        <Text style={styles.progressCount}>{taken} of {total} taken</Text>
        <View style={{ height: 14 }} />
        <LinearProgressBar value={total > 0 ? taken / total : 0} />
      </View>
      <Text style={styles.progressPct}>{pct}%</Text>
    </View>
  );
}

function AppointmentCard({ scheme }: { scheme: ColorScheme }) {
  return (
    <View
      style={[
        styles.apptCard,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
    >
      <View style={[styles.apptIcon, { backgroundColor: '#6366F121' }]}>
        <Text style={{ fontSize: 22 }}>🏥</Text>
      </View>
      <View style={styles.apptText}>
        <Text style={[styles.apptTitle, { color: scheme.text }]}>
          Dr. Chen — Follow-up
        </Text>
        <Text style={[styles.apptSub, { color: scheme.sub }]}>
          Today at 2:30 PM · 45 min
        </Text>
      </View>
      <View style={styles.apptTimeBadge}>
        <Text style={styles.apptTimeText}>2:30 PM</Text>
      </View>
    </View>
  );
}

function MedCard({
  slot,
  isTaken,
  scheme,
  onTake,
}: {
  slot:    MedSlot;
  isTaken: boolean;
  scheme:  ColorScheme;
  onTake:  () => void;
}) {
  return (
    <View
      style={[
        styles.medCard,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
    >
      {/* Header row */}
      <View style={styles.medHeader}>
        <View style={[styles.medIcon, { backgroundColor: scheme.surface2 }]}>
          <Text style={{ fontSize: 22 }}>💊</Text>
        </View>
        <View style={styles.medInfo}>
          <Text
            style={[
              styles.medName,
              { color: isTaken ? scheme.text + '8C' : scheme.text },
            ]}
          >
            {slot.med.name}
          </Text>
          <Text style={[styles.medDose, { color: scheme.sub }]}>
            {slot.med.dose} · {slot.time}
          </Text>
        </View>
        {isTaken && (
          <View style={[styles.takenBadge, { backgroundColor: scheme.primary + '1F' }]}>
            <Text style={[styles.takenBadgeText, { color: scheme.primary }]}>✓ Taken</Text>
          </View>
        )}
      </View>

      <View style={{ height: 14 }} />

      {/* Take button */}
      <TouchableOpacity
        onPress={isTaken ? undefined : onTake}
        activeOpacity={isTaken ? 1 : 0.8}
        style={[
          styles.takeBtn,
          {
            backgroundColor: isTaken
              ? scheme.primary + '1F'
              : scheme.primary,
          },
        ]}
      >
        <Text
          style={[
            styles.takeBtnText,
            { color: isTaken ? scheme.primary : '#FFFFFF' },
          ]}
        >
          {isTaken ? '✓ Taken' : 'I took this'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function TodayScreen({ scheme = dark }: Props) {
  // Register this screen's scroll with the AccessBar context
  const scrollRef   = useRef<ScrollView>(null);
  const offsetRef   = useRef(0);
  const { register } = useScrollContext();
  useEffect(() => {
    register((delta: number) => {
      const next = Math.max(0, offsetRef.current + delta);
      scrollRef.current?.scrollTo({ y: next, animated: true });
    });
    return () => register(null);
  }, [register]);

  // Pre-mark slots '1-0' and '3-0' as taken (mirrors Flutter default state)
  const [taken, setTaken] = useState<Record<string, boolean>>({
    '1-0': true,
    '3-0': true,
  });
  const { history, toastEntry, pushAction, undoEntry, dismissToast } = useUndoHistory();
  const [historyOpen, setHistoryOpen] = useState(false);

  const allSlots  = buildSlots();
  const todaySlots = allSlots.slice(0, 4);
  const takenCount = Object.values(taken).filter(Boolean).length;
  const totalCount = allSlots.length;
  const pct        = totalCount > 0 ? Math.round((takenCount / totalCount) * 100) : 0;

  const markTaken = useCallback(
    (key: string) => {
      if (taken[key]) return;
      setTaken(prev => ({ ...prev, [key]: true }));
      pushAction('Marked as taken', () => {
        setTaken(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      });
    },
    [taken, pushAction],
  );

  const now = new Date();

  return (
    <View style={styles.root}>
      <ScrollView
        ref={scrollRef}
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        onScroll={e => { offsetRef.current = e.nativeEvent.contentOffset.y; }}
        scrollEventThrottle={16}
      >
        {/* Date + greeting */}
        <Text style={[styles.dateLabel, { color: scheme.primary }]}>
          {formatDate(now).toUpperCase()}
        </Text>
        <Text style={[styles.greeting, { color: scheme.text }]}>
          Good morning, {patient.name} 👋
        </Text>
        <View style={{ height: 12 }} />

        <UndoHistoryButton
          count={history.length}
          scheme={scheme}
          onPress={() => setHistoryOpen(true)}
        />
        <View style={{ height: 8 }} />

        {/* Progress card */}
        <ProgressCard taken={takenCount} total={totalCount} pct={pct} scheme={scheme} />
        <View style={{ height: 20 }} />

        {/* Next appointment */}
        <SectionLabel text="Next appointment" scheme={scheme} />
        <View style={{ height: 10 }} />
        <AppointmentCard scheme={scheme} />
        <View style={{ height: 20 }} />

        {/* Today's medications */}
        <SectionLabel text="Today's medications" scheme={scheme} />
        <View style={{ height: 10 }} />
        {todaySlots.map(slot => (
          <View key={slot.key} style={{ marginBottom: 12 }}>
            <MedCard
              slot={slot}
              isTaken={!!taken[slot.key]}
              scheme={scheme}
              onTake={() => markTaken(slot.key)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Quick undo toast for the most recent action */}
      {toastEntry && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          <UndoToast
            message={toastEntry.message}
            onUndo={() => undoEntry(toastEntry.id)}
            onDismiss={dismissToast}
          />
        </View>
      )}

      {/* Full undo history — every action can be undone, not just the latest */}
      <UndoHistoryPanel
        visible={historyOpen}
        entries={history}
        scheme={scheme}
        onUndo={undoEntry}
        onClose={() => setHistoryOpen(false)}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    paddingBottom: 24,
  },
  dateLabel: {
    fontSize:      12,
    fontWeight:    '700',
    letterSpacing: 1.2,
  },
  greeting: {
    fontSize:   24,
    fontWeight: '800',
    marginTop:  4,
  },

  // Progress card
  progressCard: {
    padding:      20,
    borderRadius: 20,
    flexDirection: 'row',
    alignItems:   'center',
  },
  progressLeft: {
    flex: 1,
  },
  progressLabel: {
    fontSize:      11,
    fontWeight:    '700',
    color:         'rgba(255,255,255,0.7)',
    letterSpacing: 1.2,
  },
  progressCount: {
    fontSize:   20,
    fontWeight: '800',
    color:      '#FFFFFF',
    marginTop:  6,
  },
  progressPct: {
    fontSize:    44,
    fontWeight:  '800',
    color:       '#FFFFFF',
    marginLeft:  20,
  },

  // Appointment card
  apptCard: {
    flexDirection: 'row',
    alignItems:   'center',
    padding:      16,
    borderRadius: 20,
    borderWidth:  1,
  },
  apptIcon: {
    width:        48,
    height:       48,
    borderRadius: 14,
    alignItems:   'center',
    justifyContent: 'center',
  },
  apptText: {
    flex:       1,
    marginLeft: 14,
  },
  apptTitle: {
    fontSize:   15,
    fontWeight: '700',
  },
  apptSub: {
    fontSize:  13,
    marginTop: 2,
  },
  apptTimeBadge: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    backgroundColor:   '#F59E0B21',
    borderRadius:      20,
  },
  apptTimeText: {
    fontSize:   12,
    fontWeight: '700',
    color:      '#F59E0B',
  },

  // Med card
  medCard: {
    padding:      16,
    borderRadius: 20,
    borderWidth:  1,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems:   'center',
  },
  medIcon: {
    width:        48,
    height:       48,
    borderRadius: 14,
    alignItems:   'center',
    justifyContent: 'center',
  },
  medInfo: {
    flex:       1,
    marginLeft: 12,
  },
  medName: {
    fontSize:   15,
    fontWeight: '700',
  },
  medDose: {
    fontSize:  13,
    marginTop: 2,
  },
  takenBadge: {
    paddingHorizontal: 10,
    paddingVertical:   5,
    borderRadius:      20,
  },
  takenBadgeText: {
    fontSize:   12,
    fontWeight: '700',
  },
  takeBtn: {
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  takeBtnText: {
    fontSize:   15,
    fontWeight: '700',
  },

  // Toast overlay
  toastContainer: {
    position:   'absolute',
    bottom:     16,
    left:       20,
    right:      20,
  },
});
