/**
 * CallingScreen
 * Fullscreen call UI. Two staggered pulse rings, auto-connects after 2s,
 * elapsed timer, mute / speaker toggles, end call.
 * Mirrors Flutter's calling_screen.dart exactly.
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
  useWindowDimensions,
  SafeAreaView,
} from 'react-native';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { contactById } from '../constants/data';

// ── Pulse ring ────────────────────────────────────────────────────────────────

function PulseRing({
  anim,
  phaseOffset,
}: {
  anim:        Animated.Value;
  phaseOffset: number;
}) {
  const phase = Animated.modulo(
    Animated.add(anim, new Animated.Value(phaseOffset)),
    1,
  );

  const scale = phase.interpolate({
    inputRange:  [0, 1],
    outputRange: [1.0, 1.55],
  });
  const opacity = phase.interpolate({
    inputRange:  [0, 1],
    outputRange: [0.5, 0.0],
  });

  return (
    <Animated.View
      style={[
        styles.pulseRing,
        { transform: [{ scale }], opacity },
      ]}
    />
  );
}

// ── Connecting dots ───────────────────────────────────────────────────────────

function ConnectingDots() {
  const [dots, setDots] = useState(1);
  useEffect(() => {
    const t = setInterval(() => setDots(d => (d % 3) + 1), 500);
    return () => clearInterval(t);
  }, []);
  return (
    <Text style={styles.connectingText}>
      {'Connecting' + '.'.repeat(dots)}
    </Text>
  );
}

// ── Control button ────────────────────────────────────────────────────────────

function CtrlBtn({
  icon,
  label,
  active,
  onTap,
}: {
  icon:   string;
  label:  string;
  active: boolean;
  onTap:  () => void;
}) {
  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.8} style={styles.ctrlWrap}>
      <View
        style={[
          styles.ctrlCircle,
          {
            backgroundColor: active
              ? 'rgba(255,255,255,0.9)'
              : 'rgba(255,255,255,0.15)',
          },
        ]}
      >
        <Text style={{ fontSize: 26 }}>{icon}</Text>
      </View>
      <Text style={[styles.ctrlLabel, { color: active ? '#FFFFFF' : 'rgba(255,255,255,0.6)' }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

// ── End call button ───────────────────────────────────────────────────────────

function EndBtn({ onTap }: { onTap: () => void }) {
  return (
    <TouchableOpacity onPress={onTap} activeOpacity={0.85} style={styles.ctrlWrap}>
      <View style={styles.endCircle}>
        <Text style={{ fontSize: 28 }}>📵</Text>
      </View>
      <Text style={styles.endLabel}>End</Text>
    </TouchableOpacity>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

interface Props {
  contactId: number;
  onEnd:     () => void;
}

export default function CallingScreen({ contactId, onEnd }: Props) {
  const contact      = contactById(contactId);
  const contactColor = contact.color;

  // Pulse animation
  const pulseAnim = useAnimatedValue(0);
  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(pulseAnim, {
        toValue:         1,
        duration:        1600,
        easing:          Easing.out(Easing.ease),
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [pulseAnim]);

  // Call state
  const [isMuted,   setIsMuted]   = useState(false);
  const [isSpeaker, setIsSpeaker] = useState(false);
  const [connected, setConnected] = useState(false);
  const [elapsed,   setElapsed]   = useState('0:00');

  const secondsRef = useRef(0);

  useEffect(() => {
    const connectTimer = setTimeout(() => setConnected(true), 2000);
    return () => clearTimeout(connectTimer);
  }, []);

  useEffect(() => {
    if (!connected) return;
    const t = setInterval(() => {
      secondsRef.current += 1;
      const s   = secondsRef.current;
      const m   = Math.floor(s / 60);
      const sec = (s % 60).toString().padStart(2, '0');
      setElapsed(`${m}:${sec}`);
    }, 1000);
    return () => clearInterval(t);
  }, [connected]);

  const { height } = useWindowDimensions();

  return (
    <View style={styles.root}>
      {/* Gradient background approximation using layered views */}
      <View style={[styles.gradTop, { backgroundColor: contactColor }]} />
      <View style={styles.gradBottom} />

      <SafeAreaView style={styles.safe}>
        {/* Top bar */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={onEnd} style={styles.backBtn} activeOpacity={0.7}>
            <Text style={styles.backArrow}>←</Text>
          </TouchableOpacity>
          <Text style={styles.topLabel}>
            {connected ? 'On call' : 'Calling…'}
          </Text>
          <View style={{ width: 48 }} />
        </View>

        <View style={{ height: height * 0.06 }} />

        {/* Avatar + pulse rings */}
        <View style={styles.avatarContainer}>
          {/* Pulse rings */}
          <PulseRing anim={pulseAnim} phaseOffset={0}   />
          <PulseRing anim={pulseAnim} phaseOffset={0.4} />

          {/* Avatar circle */}
          <View style={[styles.avatar, { backgroundColor: contactColor }]}>
            <Text style={styles.avatarInitials}>{contact.initials}</Text>
          </View>
        </View>

        <View style={{ height: 24 }} />

        {/* Name + role */}
        <Text style={styles.contactName}>{contact.name}</Text>
        <View style={{ height: 6 }} />
        <Text style={styles.contactRole}>{contact.role}</Text>
        <View style={{ height: 16 }} />

        {/* Status / timer */}
        {connected ? (
          <Text style={styles.elapsed}>{elapsed}</Text>
        ) : (
          <ConnectingDots />
        )}

        <View style={{ flex: 1 }} />

        {/* Controls */}
        <View style={styles.controls}>
          <CtrlBtn
            icon={isMuted ? '🔇' : '🎙️'}
            label={isMuted ? 'Unmute' : 'Mute'}
            active={isMuted}
            onTap={() => setIsMuted(v => !v)}
          />
          <EndBtn onTap={onEnd} />
          <CtrlBtn
            icon={isSpeaker ? '🔊' : '🔈'}
            label={isSpeaker ? 'Speaker' : 'Earpiece'}
            active={isSpeaker}
            onTap={() => setIsSpeaker(v => !v)}
          />
        </View>
      </SafeAreaView>
    </View>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex:     1,
    position: 'relative',
  },
  gradTop: {
    position: 'absolute',
    top:      0,
    left:     0,
    right:    0,
    height:   '45%',
    opacity:  0.9,
  },
  gradBottom: {
    position:        'absolute',
    top:             '30%',
    left:            0,
    right:           0,
    bottom:          0,
    backgroundColor: '#0E131D',
  },
  safe: {
    flex:      1,
    alignItems: 'center',
  },

  topBar: {
    width:           '100%',
    flexDirection:   'row',
    alignItems:      'center',
    justifyContent:  'space-between',
    paddingHorizontal: 12,
    paddingVertical:   8,
  },
  backBtn: {
    width:          48,
    height:         48,
    alignItems:     'center',
    justifyContent: 'center',
  },
  backArrow: {
    fontSize:   22,
    fontWeight: '700',
    color:      'rgba(255,255,255,0.7)',
  },
  topLabel: {
    fontSize:   14,
    fontWeight: '600',
    color:      'rgba(255,255,255,0.6)',
  },

  // Avatar with pulse
  avatarContainer: {
    width:          200,
    height:         200,
    alignItems:     'center',
    justifyContent: 'center',
  },
  pulseRing: {
    position:     'absolute',
    width:        150,
    height:       150,
    borderRadius: 75,
    borderWidth:  2,
    borderColor:  'rgba(255,255,255,0.5)',
  },
  avatar: {
    width:        130,
    height:       130,
    borderRadius: 65,
    alignItems:   'center',
    justifyContent: 'center',
    borderWidth:  3,
    borderColor:  'rgba(255,255,255,0.25)',
  },
  avatarInitials: {
    fontSize:   44,
    fontWeight: '800',
    color:      '#FFFFFF',
  },

  contactName: {
    fontSize:   28,
    fontWeight: '800',
    color:      '#FFFFFF',
  },
  contactRole: {
    fontSize:   15,
    fontWeight: '500',
    color:      'rgba(255,255,255,0.6)',
  },
  elapsed: {
    fontSize:   20,
    fontWeight: '700',
    color:      '#FFFFFF',
  },
  connectingText: {
    fontSize:   16,
    fontWeight: '500',
    color:      'rgba(255,255,255,0.6)',
  },

  // Controls
  controls: {
    width:           '100%',
    flexDirection:   'row',
    justifyContent:  'space-between',
    paddingHorizontal: 40,
    paddingBottom:     40,
  },
  ctrlWrap: {
    alignItems: 'center',
  },
  ctrlCircle: {
    width:          64,
    height:         64,
    borderRadius:   32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  ctrlLabel: {
    marginTop:  8,
    fontSize:   12,
    fontWeight: '600',
  },
  endCircle: {
    width:           72,
    height:          72,
    borderRadius:    36,
    backgroundColor: '#C53030',
    alignItems:      'center',
    justifyContent:  'center',
  },
  endLabel: {
    marginTop:  8,
    fontSize:   12,
    fontWeight: '700',
    color:      '#FF6B6B',
  },
});
