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
import { CChip, UndoToast } from '../components/AppComponents';
import { useScrollContext } from '../context/ScrollContext';

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
          <View style={[styles.medIconBox, { backgroundColor: scheme.surface2 }]}>
            <Text style={{ fontSize: 22 }}>💊</Text>
          </View>
          <View style={styles.medInfo}>
            <View style={styles.medNameRow}>
              <Text style={[styles.medName, { color: scheme.text }]} numberOfLines={1}>
                {slot.med.name}
              </Text>
              <View style={{ width: 8 }} />
              <CChip label={slot.med.category} color={scheme.primary} />
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
          >
            <Text
              style={[
                styles.actionBtnText,
                { color: isTaken ? scheme.primary : '#FFFFFF' },
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
            >
              <Text
                style={[styles.actionBtnText, { color: tokens.danger }]}
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
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onCancel}>
      <View style={styles.modalOverlay}>
        <View
          style={[
            styles.modalBox,
            { backgroundColor: scheme.surface, borderColor: scheme.border },
          ]}
        >
          <Text style={[styles.modalText, { color: scheme.text }]}>
            Mark this dose as missed?{'\n'}Your caregiver will be notified.
          </Text>
          <View style={{ height: 20 }} />
          <TouchableOpacity
            style={[styles.modalBtn, { backgroundColor: tokens.danger }]}
            onPress={onConfirm}
            activeOpacity={0.85}
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

interface Toast {
  id:   number;
  msg:  string;
  undo: () => void;
}

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
  const [toasts, setToasts]                     = useState<Toast[]>([]);
  const [toastId, setToastId]                   = useState(0);

  const takenCount  = Object.values(status).filter(s => s === 'taken').length;
  const missedCount = Object.values(status).filter(s => s === 'missed').length;

  const addToast = useCallback(
    (msg: string, undo: () => void) => {
      const id = toastId + 1;
      setToastId(id);
      setToasts(prev => [...prev, { id, msg, undo }]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
    },
    [toastId],
  );

  const markTaken = useCallback(
    (key: string) => {
      const prev = status[key] ?? 'none';
      setStatus(s => ({ ...s, [key]: 'taken' }));
      addToast('Marked as taken', () => setStatus(s => ({ ...s, [key]: prev })));
    },
    [status, addToast],
  );

  const markMissed = useCallback(
    (key: string) => {
      const prev = status[key] ?? 'none';
      setStatus(s => ({ ...s, [key]: 'missed' }));
      setPendingMissedKey(null);
      addToast('Marked as missed', () => setStatus(s => ({ ...s, [key]: prev })));
    },
    [status, addToast],
  );

  const dismissToast = (id: number) =>
    setToasts(prev => prev.filter(t => t.id !== id));

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
        <Text style={[styles.heading, { color: scheme.text }]}>Medications</Text>
        <Text style={[styles.subheading, { color: scheme.sub }]}>
          {slots.length} doses today
        </Text>
        <View style={{ height: 16 }} />

        {/* Summary row */}
        <View style={styles.statsRow}>
          <StatTile label="Total doses" value={slots.length} color={scheme.sub}    scheme={scheme} />
          <View style={{ width: 10 }} />
          <StatTile label="Taken"       value={takenCount}   color={scheme.primary} scheme={scheme} />
          <View style={{ width: 10 }} />
          <StatTile label="Missed"      value={missedCount}  color={tokens.danger}  scheme={scheme} />
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

      {/* Undo toasts */}
      {toasts.length > 0 && (
        <View style={styles.toastContainer} pointerEvents="box-none">
          {toasts.map(t => (
            <UndoToast
              key={t.id}
              message={t.msg}
              onUndo={() => { t.undo(); dismissToast(t.id); }}
              onDismiss={() => dismissToast(t.id)}
            />
          ))}
        </View>
      )}
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
