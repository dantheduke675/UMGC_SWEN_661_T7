/**
 * Shared app-screen components — mirrors Flutter's widgets.dart app section.
 * CAvatarBadge, CChip, UndoToast, SectionLabel, ProgressBar.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Animated,
  useAnimatedValue,
  Modal,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { ColorScheme } from '../constants/theme';

// ── CAvatarBadge ──────────────────────────────────────────────────────────────

interface AvatarProps {
  initials: string;
  color:    string;
  size?:    number;
}

export function CAvatarBadge({ initials, color, size = 40 }: AvatarProps) {
  return (
    <View
      style={[
        styles.avatar,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
      ]}
    >
      <Text style={[styles.avatarText, { fontSize: size * 0.36 }]}>{initials}</Text>
    </View>
  );
}

// ── CChip ─────────────────────────────────────────────────────────────────────

interface ChipProps {
  label: string;
  color: string;
}

export function CChip({ label, color }: ChipProps) {
  return (
    <View style={[styles.chip, { backgroundColor: color + '21' }]}>
      <Text style={[styles.chipText, { color }]}>{label}</Text>
    </View>
  );
}

// ── UndoToast ─────────────────────────────────────────────────────────────────

interface ToastProps {
  message:   string;
  onUndo:    () => void;
  onDismiss: () => void;
}

export function UndoToast({ message, onUndo, onDismiss }: ToastProps) {
  const opacity = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(opacity, {
      toValue: 1, duration: 200, useNativeDriver: true,
    }).start();
  }, [opacity]);

  return (
    <Animated.View style={[styles.toast, { opacity }]}>
      <Text style={styles.toastText}>{message}</Text>
      <TouchableOpacity style={styles.toastBtn} onPress={onUndo} activeOpacity={0.8}>
        <Text style={styles.toastBtnText}>Undo</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ── UndoHistoryButton ─────────────────────────────────────────────────────────
// Small inline pill that opens the full undo history — only shown once there
// is at least one undoable action.

interface UndoHistoryButtonProps {
  count:   number;
  scheme:  ColorScheme;
  onPress: () => void;
}

export function UndoHistoryButton({ count, scheme, onPress }: UndoHistoryButtonProps) {
  if (count === 0) return null;

  return (
    <TouchableOpacity
      style={[
        styles.historyTrigger,
        { backgroundColor: scheme.surface2, borderColor: scheme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={{ fontSize: 14 }}>↺</Text>
      <Text style={[styles.historyTriggerText, { color: scheme.text }]}>
        {count} recent {count === 1 ? 'action' : 'actions'} · Undo history
      </Text>
    </TouchableOpacity>
  );
}

// ── UndoHistoryPanel ──────────────────────────────────────────────────────────
// Shows every undoable action as a stack (newest first) the user can undo
// individually. Layout adapts to the viewport: a bottom sheet on phones, a
// centered card on tablets/desktop.

export interface UndoHistoryEntry {
  id:      number;
  message: string;
}

interface UndoHistoryPanelProps {
  visible: boolean;
  entries: UndoHistoryEntry[];
  scheme:  ColorScheme;
  onUndo:  (id: number) => void;
  onClose: () => void;
}

export function UndoHistoryPanel({
  visible,
  entries,
  scheme,
  onUndo,
  onClose,
}: UndoHistoryPanelProps) {
  const { width } = useWindowDimensions();
  const isWide = width >= 700;

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <TouchableOpacity
        style={styles.historyBackdrop}
        activeOpacity={1}
        onPress={onClose}
        accessibilityLabel="Close undo history"
      />
      <View
        pointerEvents="box-none"
        style={[styles.historyWrap, isWide ? styles.historyWrapWide : styles.historyWrapNarrow]}
      >
        <View
          style={[
            styles.historyPanel,
            { backgroundColor: scheme.surface, borderColor: scheme.border },
            isWide ? styles.historyPanelWide : styles.historyPanelNarrow,
          ]}
        >
          <View style={styles.historyHeader}>
            <Text style={[styles.historyTitle, { color: scheme.text }]}>Undo history</Text>
            <TouchableOpacity
              onPress={onClose}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              accessibilityLabel="Close"
            >
              <Text style={[styles.historyCloseBtn, { color: scheme.sub }]}>✕</Text>
            </TouchableOpacity>
          </View>

          {entries.length === 0 ? (
            <Text style={[styles.historyEmpty, { color: scheme.muted }]}>
              Nothing to undo right now.
            </Text>
          ) : (
            <ScrollView style={styles.historyList} showsVerticalScrollIndicator={false}>
              {entries.map(entry => (
                <View key={entry.id} style={[styles.historyRow, { borderColor: scheme.border }]}>
                  <Text style={[styles.historyRowText, { color: scheme.text }]}>
                    {entry.message}
                  </Text>
                  <TouchableOpacity
                    style={[styles.historyUndoBtn, { backgroundColor: scheme.primary }]}
                    onPress={() => onUndo(entry.id)}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.historyUndoBtnText}>Undo</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </ScrollView>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ── SectionLabel ──────────────────────────────────────────────────────────────

interface SectionLabelProps {
  text:   string;
  scheme: ColorScheme;
}

export function SectionLabel({ text, scheme }: SectionLabelProps) {
  return (
    <Text style={[styles.sectionLabel, { color: scheme.text }]}>{text}</Text>
  );
}

// ── LinearProgressBar ─────────────────────────────────────────────────────────

interface ProgressBarProps {
  value: number; // 0–1
}

export function LinearProgressBar({ value }: ProgressBarProps) {
  const width = useAnimatedValue(0);

  useEffect(() => {
    Animated.timing(width, {
      toValue: value,
      duration: 600,
      useNativeDriver: false,
    }).start();
  }, [value, width]);

  return (
    <View style={styles.progressTrack}>
      <Animated.View
        style={[
          styles.progressFill,
          {
            width: width.interpolate({
              inputRange: [0, 1],
              outputRange: ['0%', '100%'],
            }),
          },
        ]}
      />
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  avatar: {
    alignItems:      'center',
    justifyContent:  'center',
  },
  avatarText: {
    color:      '#FFFFFF',
    fontWeight: '700',
  },
  chip: {
    paddingHorizontal: 10,
    paddingVertical:   4,
    borderRadius:      20,
  },
  chipText: {
    fontSize:   12,
    fontWeight: '700',
  },
  toast: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    marginBottom:    8,
    paddingHorizontal: 20,
    paddingVertical:   14,
    backgroundColor: '#1D2534',
    borderRadius:    18,
    shadowColor:     '#000',
    shadowOffset:    { width: 0, height: 4 },
    shadowOpacity:   0.25,
    shadowRadius:    12,
    elevation:       8,
  },
  toastText: {
    color:      '#F5F7FA',
    fontWeight: '600',
    fontSize:   15,
    flex:       1,
  },
  toastBtn: {
    marginLeft:      12,
    paddingHorizontal: 14,
    paddingVertical:   8,
    backgroundColor: '#357C6F',
    borderRadius:    12,
  },
  toastBtnText: {
    color:      '#FFFFFF',
    fontWeight: '700',
    fontSize:   14,
  },
  sectionLabel: {
    fontSize:   16,
    fontWeight: '700',
  },

  // Undo history trigger
  historyTrigger: {
    flexDirection:     'row',
    alignItems:        'center',
    alignSelf:         'flex-start',
    paddingHorizontal: 14,
    paddingVertical:   10,
    borderRadius:      20,
    borderWidth:       1,
    gap:               8,
  },
  historyTriggerText: {
    fontSize:   13,
    fontWeight: '600',
  },

  // Undo history panel
  historyBackdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  historyWrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  historyWrapNarrow: {
    justifyContent: 'flex-end',
  },
  historyWrapWide: {
    justifyContent: 'center',
    alignItems:     'center',
  },
  historyPanel: {
    borderWidth: 1,
    maxHeight:   '70%',
  },
  historyPanelNarrow: {
    width:                   '100%',
    borderTopLeftRadius:     24,
    borderTopRightRadius:    24,
    paddingBottom:           24,
  },
  historyPanelWide: {
    width:         480,
    maxWidth:      '90%',
    borderRadius:  24,
    paddingBottom: 8,
  },
  historyHeader: {
    flexDirection:     'row',
    alignItems:        'center',
    justifyContent:    'space-between',
    paddingHorizontal: 20,
    paddingTop:        20,
    paddingBottom:     12,
  },
  historyTitle: {
    fontSize:   17,
    fontWeight: '800',
  },
  historyCloseBtn: {
    fontSize:   18,
    fontWeight: '700',
  },
  historyEmpty: {
    fontSize:          14,
    paddingHorizontal: 20,
    paddingBottom:     24,
  },
  historyList: {
    paddingHorizontal: 20,
  },
  historyRow: {
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
  },
  historyRowText: {
    fontSize:   14,
    fontWeight: '600',
    flex:       1,
    marginRight: 12,
  },
  historyUndoBtn: {
    paddingHorizontal: 14,
    paddingVertical:   8,
    borderRadius:      12,
  },
  historyUndoBtnText: {
    color:      '#FFFFFF',
    fontWeight: '700',
    fontSize:   13,
  },
  progressTrack: {
    height:       8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    overflow:     'hidden',
  },
  progressFill: {
    height:          '100%',
    backgroundColor: '#FFFFFF',
    borderRadius:    4,
  },
});
