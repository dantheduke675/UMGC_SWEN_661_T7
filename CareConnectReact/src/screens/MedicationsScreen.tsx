/**
 * MedicationsScreen
 * Full medication log: summary stats row, all 9 daily slots with take/miss
 * actions, a confirmation modal for "I missed this", and undo toasts.
 */
import React, { useState, useCallback, useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Modal,
  StyleSheet,
} from 'react-native';
import { ColorScheme, dark, tokens } from '../constants/theme';
import { buildSlots, MedSlot } from '../constants/data';
import {
  CChip,
  UndoToast,
  UndoHistoryButton,
  UndoHistoryPanel,
} from '../components/AppComponents';
import { useScrollContext } from '../context/ScrollContext';
import { useUndoHistory } from '../hooks/useUndoHistory';

interface Props {
  scheme?: ColorScheme;
}

type SlotStatus = 'none' | 'taken' | 'missed';

// ── Summary stat tile ─────────────────────────────────────────────────────────

function StatTile({
  label,
  value,
  color,
  scheme,
}: {
  label:  string;
  value:  number;
  color:  string;
  scheme: ColorScheme;
}) {
  return (
    <View
      style={[
        styles.statTile,
        { backgroundColor: color + '1A', borderColor: color + '40' },
      ]}
    >
      <Text style={[styles.statValue, { color }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: scheme.sub }]}>{label}</Text>
    </View>
  );
}

// ── Medication card ───────────────────────────────────────────────────────────

function MedCard({
  slot,
  status,
  scheme,
  onTake,
  onMissed,
}: {
  slot:     MedSlot;
  status:   SlotStatus;
  scheme:   ColorScheme;
  onTake:   () => void;
  onMissed: () => void;
}) {
  const isTaken  = status === 'taken';
  const isMissed = status === 'missed';

  const accentColor =
    isTaken  ? scheme.primary :
    isMissed ? tokens.danger  :
    scheme.border;

  const statusLabel = isTaken ? 'taken' : isMissed ? 'missed' : 'not yet taken';

  return (
    <View
      style={[
        styles.medCard,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
    >
      {/* Left accent stripe */}
      <View style={[styles.accentStripe, { backgroundColor: accentColor }]} />

      <View style={styles.medBody}>
        {/* Header row */}
        <View style={styles.medHeader}>
          <View
            style={[styles.medIconBox, { backgroundColor: scheme.surface2 }]}
          >
            <Text style={{ fontSize: 22 }}>💊</Text>
          </View>
          <View style={styles.medInfo}>
            <View style={styles.medNameRow}>
              <Text
                style={[styles.medName, { color: scheme.text }]}
                numberOfLines={1}
                accessibilityLabel={`${slot.med.name}, ${statusLabel}`}
              >
                {slot.med.name}
              </Text>
              <View style={{ width: 8 }} />
              <CChip label={slot.med.category} color={scheme.primaryText} />
            </View>
            <Text style={[styles.medDose, { color: scheme.sub }]}>
              {slot.med.dose} · {slot.time}
            </Text>
            <Text style={[styles.medFreq, { color: scheme.muted }]}>
              {slot.med.freq}
            </Text>
          </View>
        </View>

        <View style={{ height: 14 }} />

        {/* Action buttons */}
        <View style={styles.actionRow}>
          {/* Take button */}
          <TouchableOpacity
            style={[
              styles.actionBtn,
              {
                backgroundColor: isTaken
                  ? scheme.primary + '1F'
                  : scheme.primary,
                marginRight: isTaken ? 0 : 10,
              },
            ]}
            onPress={isTaken ? undefined : onTake}
            activeOpacity={isTaken ? 1 : 0.8}
            accessible
            accessibilityRole="button"
            accessibilityLabel={`${slot.med.name}, ${isTaken ? 'Taken' : 'I took this'}`}
            accessibilityHint={isTaken ? undefined : 'Marks this dose as taken'}
            accessibilityState={{ disabled: isTaken }}
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: isTaken ? scheme.primaryText : '#FFFFFF' },
              ]}
            >
              {isTaken ? '✓ Taken' : 'I took this'}
            </Text>
          </TouchableOpacity>

          {/* Miss button — hidden once taken */}
          {!isTaken && (
            <TouchableOpacity
              style={[
                styles.actionBtn,
                {
                  backgroundColor: isMissed
                    ? tokens.danger + '1A'
                    : 'transparent',
                  borderWidth:  2,
                  borderColor:  tokens.danger + '66',
                },
              ]}
              onPress={onMissed}
              activeOpacity={0.8}
              accessible
              accessibilityRole="button"
              accessibilityLabel={`${slot.med.name}, ${isMissed ? 'Missed' : 'I missed this'}`}
              accessibilityHint={isMissed ? undefined : 'Opens a confirmation to mark this dose as missed'}
              accessibilityState={{ disabled: isMissed }}
            >
              <Text
                style={[styles.actionBtnText, { color: scheme.danger }]}
              >
                {isMissed ? '✗ Missed' : 'I missed this'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    </View>
  );
}

// ── Confirm missed modal ──────────────────────────────────────────────────────

function ConfirmMissedModal({
  visible,
  scheme,
  onConfirm,
  onCancel,
}: {
  visible:   boolean;
  scheme:    ColorScheme;
  onConfirm: () => void;
  onCancel:  () => void;
}) {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}
      accessibilityViewIsModal
    >
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalBox,
            { backgroundColor: scheme.surface, borderColor: scheme.border },
          ]}
          accessible
          accessibilityRole="alert"
        >
          <Text style={[styles.modalText, { color: scheme.text }]}>
            Mark this dose as missed?{'\n'}Your caregiver will be notified.
          </Text>
          <View style={{ height: 20 }} />
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: tokens.danger }]}
            onPress={onConfirm}
            activeOpacity={0.85}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Yes, I missed this dose"
          >
            <Text style={styles.modalBtnText}>Yes, I missed this dose</Text>
          </TouchableOpacity>
          <View style={{ height: 10 }} />
          <TouchableOpacity
            style={[
              styles.modalBtn,
              styles.modalCancelBtn,
              { borderColor: scheme.border },
            ]}
            onPress={onCancel}
            activeOpacity={0.75}
            accessible
            accessibilityRole="button"
            accessibilityLabel="Cancel"
            accessibilityHint="Closes this dialog without marking the dose as missed"
          >
            <Text style={[styles.modalBtnText, { color: scheme.text }]}>
              Cancel — go back
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

export default function MedicationsScreen({ scheme = dark }: Props) {
  const slots = buildSlots();

  // Register scroll with AccessBar
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

  const [status, setStatus] = useState<Record<string, SlotStatus>>({
    '1-0': 'taken',
    '3-0': 'taken',
  });
  const [pendingMissedKey, setPendingMissedKey] = useState<string | null>(null);
  const { history, toastEntry, pushAction, undoEntry, dismissToast } = useUndoHistory();
  const [historyOpen, setHistoryOpen] = useState(false);

  const takenCount  = Object.values(status).filter(s => s === 'taken').length;
  const missedCount = Object.values(status).filter(s => s === 'missed').length;

  const markTaken = useCallback(
    (key: string) => {
      const prev = status[key] ?? 'none';
      setStatus(s => ({ ...s, [key]: 'taken' }));
      pushAction('Marked as taken', () => setStatus(s => ({ ...s, [key]: prev })));
    },
    [status, pushAction],
  );

  const markMissed = useCallback(
    (key: string) => {
      const prev = status[key] ?? 'none';
      setStatus(s => ({ ...s, [key]: 'missed' }));
      setPendingMissedKey(null);
      pushAction('Marked as missed', () => setStatus(s => ({ ...s, [key]: prev })));
    },
    [status, pushAction, setPendingMissedKey],
  );

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
        {/* Header */}
        <Text style={[styles.heading, { color: scheme.text }]} accessibilityRole="header">Medications</Text>
        <Text style={[styles.subheading, { color: scheme.sub }]}>
          {slots.length} doses today
        </Text>
        <View style={{ height: 12 }} />

        <UndoHistoryButton
          count={history.length}
          scheme={scheme}
          onPress={() => setHistoryOpen(true)}
        />
        <View style={{ height: 8 }} />

        {/* Summary row */}
        <View style={styles.statsRow}>
          <StatTile label="Total doses" value={slots.length} color={scheme.sub}    scheme={scheme} />
          <View style={{ width: 10 }} />
          <StatTile label="Taken"       value={takenCount}   color={scheme.primaryText} scheme={scheme} />
          <View style={{ width: 10 }} />
          <StatTile label="Missed"      value={missedCount}  color={scheme.danger}  scheme={scheme} />
        </View>
        <View style={{ height: 16 }} />

        {/* All med slots */}
        {slots.map(slot => (
          <View key={slot.key} style={{ marginBottom: 12 }}>
            <MedCard
              slot={slot}
              status={status[slot.key] ?? 'none'}
              scheme={scheme}
              onTake={()   => markTaken(slot.key)}
              onMissed={()  => setPendingMissedKey(slot.key)}
            />
          </View>
        ))}
      </ScrollView>

      {/* Confirm missed modal */}
      <ConfirmMissedModal
        visible={pendingMissedKey !== null}
        scheme={scheme}
        onConfirm={() => pendingMissedKey && markMissed(pendingMissedKey)}
        onCancel={()  => setPendingMissedKey(null)}
      />

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
    paddingHorizontal: 20,
    paddingTop:        16,
    paddingBottom:     24,
  },
  heading: {
    fontSize:   22,
    fontWeight: '800',
  },
  subheading: {
    fontSize:  13,
    marginTop: 4,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
  },
  statTile: {
    flex:          1,
    alignItems:    'center',
    paddingVertical:   14,
    paddingHorizontal: 12,
    borderRadius:  16,
    borderWidth:   1,
  },
  statValue: {
    fontSize:   24,
    fontWeight: '800',
  },
  statLabel: {
    fontSize:   11,
    fontWeight: '600',
    marginTop:  2,
    textAlign:  'center',
  },

  // Med card
  medCard: {
    flexDirection: 'row',
    borderRadius:  20,
    borderWidth:   1,
    overflow:      'hidden',
  },
  accentStripe: {
    width: 5,
  },
  medBody: {
    flex:    1,
    padding: 16,
  },
  medHeader: {
    flexDirection: 'row',
    alignItems:   'flex-start',
  },
  medIconBox: {
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
  medNameRow: {
    flexDirection: 'row',
    alignItems:   'center',
    flexWrap:     'wrap',
  },
  medName: {
    fontSize:   15,
    fontWeight: '700',
    flexShrink: 1,
  },
  medDose: {
    fontSize:  13,
    marginTop: 3,
  },
  medFreq: {
    fontSize:  12,
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
  },
  actionBtn: {
    flex:           1,
    height:         52,
    borderRadius:   14,
    alignItems:     'center',
    justifyContent: 'center',
  },
  actionBtnText: {
    fontSize:   15,
    fontWeight: '700',
  },

  // Modal
  modalOverlay: {
    flex:            1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    alignItems:      'center',
    justifyContent:  'center',
    paddingHorizontal: 24,
  },
  modalBox: {
    width:        '100%',
    padding:      24,
    borderRadius: 24,
    borderWidth:  1,
  },
  modalText: {
    fontSize:   16,
    fontWeight: '600',
    textAlign:  'center',
    lineHeight: 24,
  },
  modalBtn: {
    height:         56,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  },
  modalCancelBtn: {
    backgroundColor: 'transparent',
    borderWidth:     2,
  },
  modalBtnText: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#FFFFFF',
  },

  // Toasts
  toastContainer: {
    position: 'absolute',
    bottom:   16,
    left:     20,
    right:    20,
  },
});
