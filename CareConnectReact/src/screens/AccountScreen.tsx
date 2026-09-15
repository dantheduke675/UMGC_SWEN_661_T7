/**
 * AccountScreen
 * Patient profile, care team list, preferences, and sign out.
 * Mirrors Flutter's account_screen.dart exactly.
 */
import React, { useRef, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Animated,
  Easing,
  StyleSheet,
} from 'react-native';
import { useAnimatedValue } from '../hooks/useAnimatedValue';
import { ColorScheme, dark } from '../constants/theme';
import { contacts, patient } from '../constants/data';
import { CAvatarBadge } from '../components/AppComponents';
import { useScrollContext } from '../context/ScrollContext';

// ── Profile card ──────────────────────────────────────────────────────────────

function ProfileCard({ scheme }: { scheme: ColorScheme }) {
  return (
    <View
      style={[
        styles.profileCard,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
    >
      <View style={[styles.profileAvatar, { backgroundColor: scheme.primary }]}>
        <Text style={styles.profileInitials}>{patient.initials}</Text>
      </View>
      <View style={styles.profileInfo}>
        <Text style={[styles.profileName, { color: scheme.text }]}>{patient.full}</Text>
        <View style={styles.roleBadge}>
          <Text style={styles.roleBadgeText}>Care recipient</Text>
        </View>
        <Text style={[styles.profileEmail, { color: scheme.sub }]}>maddy@example.com</Text>
      </View>
    </View>
  );
}

// ── Care team tile ────────────────────────────────────────────────────────────

function CareTeamTile({
  contact,
  scheme,
  onMessage,
}: {
  contact:   typeof contacts[0];
  scheme:    ColorScheme;
  onMessage: () => void;
}) {
  return (
    <View
      style={[
        styles.careTeamTile,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
    >
      <CAvatarBadge initials={contact.initials} color={contact.color} size={44} />
      <View style={styles.careTeamInfo}>
        <Text style={[styles.careTeamName, { color: scheme.text }]}>{contact.name}</Text>
        <Text style={[styles.careTeamRole, { color: scheme.sub }]}>{contact.role}</Text>
      </View>
      <TouchableOpacity
        onPress={onMessage}
        activeOpacity={0.7}
        style={[styles.msgBtn, { backgroundColor: scheme.primary + '1A' }]}
      >
        <Text style={{ fontSize: 18 }}>💬</Text>
      </TouchableOpacity>
    </View>
  );
}

// ── Animated theme switch ─────────────────────────────────────────────────────

function ThemeSwitch({
  isDark,
  scheme,
  onToggle,
}: {
  isDark:   boolean;
  scheme:   ColorScheme;
  onToggle: () => void;
}) {
  const anim = useAnimatedValue(isDark ? 1 : 0);

  function toggle() {
    Animated.timing(anim, {
      toValue:         isDark ? 0 : 1,
      duration:        200,
      easing:          Easing.out(Easing.ease),
      useNativeDriver: false,
    }).start();
    onToggle();
  }

  const thumbLeft = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [3, 27],
  });
  const trackColor = anim.interpolate({
    inputRange:  [0, 1],
    outputRange: [scheme.border, scheme.primary],
  });

  return (
    <TouchableOpacity onPress={toggle} activeOpacity={0.8}>
      <Animated.View
        style={[styles.switchTrack, { backgroundColor: trackColor as any }]}
      >
        <Animated.View style={[styles.switchThumb, { left: thumbLeft }]}>
          <Text style={{ fontSize: 10 }}>{isDark ? '🌙' : '☀️'}</Text>
        </Animated.View>
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── Preference tile ───────────────────────────────────────────────────────────

function PrefTile({
  icon,
  label,
  value,
  scheme,
  trailing,
}: {
  icon:     string;
  label:    string;
  value:    string;
  scheme:   ColorScheme;
  trailing?: React.ReactNode;
}) {
  return (
    <View
      style={[
        styles.prefTile,
        { backgroundColor: scheme.surface, borderColor: scheme.border },
      ]}
    >
      <Text style={{ fontSize: 20 }}>{icon}</Text>
      <Text style={[styles.prefLabel, { color: scheme.text }]}>{label}</Text>
      {trailing ?? (
        value.length > 0 && (
          <Text style={[styles.prefValue, { color: scheme.sub }]}>{value}</Text>
        )
      )}
    </View>
  );
}

// ── Screen ────────────────────────────────────────────────────────────────────

interface Props {
  scheme?:    ColorScheme;
  isDark?:    boolean;
  onToggleTheme?: () => void;
  onSignOut?: () => void;
  onMessages?: () => void;
}

export default function AccountScreen({
  scheme    = dark,
  isDark    = true,
  onToggleTheme,
  onSignOut,
  onMessages,
}: Props) {
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

  return (
    <ScrollView
      ref={scrollRef}
      style={[styles.root, { backgroundColor: scheme.bg }]}
      showsVerticalScrollIndicator={false}
      onScroll={e => { offsetRef.current = e.nativeEvent.contentOffset.y; }}
      scrollEventThrottle={16}
      contentContainerStyle={styles.content}
    >
      <Text style={[styles.heading, { color: scheme.text }]}>Account</Text>
      <View style={{ height: 20 }} />

      <ProfileCard scheme={scheme} />
      <View style={{ height: 20 }} />

      <Text style={[styles.sectionLabel, { color: scheme.text }]}>Care team</Text>
      <View style={{ height: 10 }} />
      {contacts.map(c => (
        <View key={c.id} style={{ marginBottom: 10 }}>
          <CareTeamTile
            contact={c}
            scheme={scheme}
            onMessage={() => onMessages?.()}
          />
        </View>
      ))}
      <View style={{ height: 20 }} />

      <Text style={[styles.sectionLabel, { color: scheme.text }]}>Preferences</Text>
      <View style={{ height: 10 }} />
      <PrefTile
        icon={isDark ? '🌙' : '☀️'}
        label="Appearance"
        value=""
        scheme={scheme}
        trailing={
          <ThemeSwitch
            isDark={isDark}
            scheme={scheme}
            onToggle={() => onToggleTheme?.()}
          />
        }
      />
      <View style={{ height: 8 }} />
      <PrefTile icon="🔔" label="Medication reminders" value="On · 15 min before" scheme={scheme} />
      <View style={{ height: 8 }} />
      <PrefTile icon="🔒" label="Face ID unlock" value="Enabled" scheme={scheme} />
      <View style={{ height: 8 }} />
      <PrefTile icon="📤" label="Share health data" value="With care team" scheme={scheme} />
      <View style={{ height: 20 }} />

      <Text style={[styles.sectionLabel, { color: scheme.text }]}>App info</Text>
      <View style={{ height: 10 }} />
      <PrefTile icon="ℹ️" label="Version" value="1.0.0" scheme={scheme} />
      <View style={{ height: 8 }} />
      <PrefTile icon="📄" label="Privacy policy" value="" scheme={scheme} />
      <View style={{ height: 20 }} />

      {/* Sign out */}
      <TouchableOpacity
        onPress={() => onSignOut?.()}
        activeOpacity={0.85}
        style={styles.signOutBtn}
      >
        <Text style={styles.signOutText}>Sign out</Text>
      </TouchableOpacity>
      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root:    { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 20 },
  heading:      { fontSize: 22, fontWeight: '800' },
  sectionLabel: { fontSize: 16, fontWeight: '700' },

  // Profile
  profileCard: {
    flexDirection: 'row',
    alignItems:    'center',
    padding:       20,
    borderRadius:  20,
    borderWidth:   1,
  },
  profileAvatar: {
    width:          64,
    height:         64,
    borderRadius:   32,
    alignItems:     'center',
    justifyContent: 'center',
  },
  profileInitials: {
    fontSize:   22,
    fontWeight: '800',
    color:      '#FFFFFF',
  },
  profileInfo: { flex: 1, marginLeft: 16 },
  profileName:  { fontSize: 18, fontWeight: '800' },
  roleBadge: {
    alignSelf:         'flex-start',
    marginTop:         4,
    paddingHorizontal: 10,
    paddingVertical:   4,
    backgroundColor:   '#2F7A6B21',
    borderRadius:      20,
  },
  roleBadgeText: {
    fontSize:   12,
    fontWeight: '700',
    color:      '#2F7A6B',
  },
  profileEmail: { fontSize: 13, marginTop: 6 },

  // Care team
  careTeamTile: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderRadius:   16,
    borderWidth:    1,
  },
  careTeamInfo: { flex: 1, marginLeft: 12 },
  careTeamName: { fontSize: 14, fontWeight: '700' },
  careTeamRole: { fontSize: 12, marginTop: 2 },
  msgBtn: {
    width:          40,
    height:         40,
    borderRadius:   12,
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Theme switch
  switchTrack: {
    width:        52,
    height:       28,
    borderRadius: 14,
    position:     'relative',
  },
  switchThumb: {
    position:       'absolute',
    top:            3,
    width:          22,
    height:         22,
    borderRadius:   11,
    backgroundColor: '#FFFFFF',
    alignItems:     'center',
    justifyContent: 'center',
  },

  // Pref tile
  prefTile: {
    flexDirection:  'row',
    alignItems:     'center',
    paddingHorizontal: 16,
    paddingVertical:   14,
    borderRadius:   16,
    borderWidth:    1,
    gap:            14,
  },
  prefLabel: { flex: 1, fontSize: 14, fontWeight: '600' },
  prefValue: { fontSize: 13 },

  // Sign out
  signOutBtn: {
    height:         56,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
    backgroundColor: '#C5303014',
    borderWidth:    2,
    borderColor:    '#C5303040',
  },
  signOutText: {
    fontSize:   16,
    fontWeight: '700',
    color:      '#C53030',
  },
});
