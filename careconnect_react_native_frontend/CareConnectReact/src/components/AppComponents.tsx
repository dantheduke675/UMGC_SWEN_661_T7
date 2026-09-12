/**
 * Shared app-screen components — mirrors Flutter's widgets.dart app section.
 * CAvatarBadge, CChip, UndoToast, SectionLabel, ProgressBar.
 */
import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  StyleSheet,
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
  const opacity = useRef(new Animated.Value(0)).current;

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
  const width = useRef(new Animated.Value(0)).current;

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
