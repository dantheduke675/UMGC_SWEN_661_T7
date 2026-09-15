/**
 * Shared auth-screen components — mirrors Flutter's widgets.dart auth section.
 * All components accept the active ColorScheme so they render correctly in both
 * light and dark mode without needing a context provider.
 */
import React, { useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Animated,
  useAnimatedValue,
  Easing,
} from 'react-native';
import { ColorScheme, tokens } from '../constants/theme';

// ── AuthLogo ──────────────────────────────────────────────────────────────────

interface AuthLogoProps {
  scheme: ColorScheme;
  large?: boolean;
  small?: boolean;
}

export function AuthLogo({ scheme, large = false, small = false }: AuthLogoProps) {
  const size   = small ? 72 : 96;
  const radius = small ? 21 : 28;
  const emoji  = small ? 26 : large ? 44 : 36;

  return (
    <View
      style={[
        styles.logoContainer,
        { width: size, height: size, borderRadius: radius, backgroundColor: scheme.primary },
      ]}
    >
      <Text style={{ fontSize: emoji }}>💊</Text>
    </View>
  );
}

// ── AuthBtn ───────────────────────────────────────────────────────────────────

type BtnVariant = 'primary' | 'secondary' | 'text';

interface AuthBtnProps {
  label: string;
  scheme: ColorScheme;
  variant?: BtnVariant;
  large?: boolean;
  onPress?: () => void;
  disabled?: boolean;
}

export function AuthBtn({
  label,
  scheme,
  variant = 'primary',
  large = false,
  onPress,
  disabled = false,
}: AuthBtnProps) {
  const h  = large ? 80 : 64;
  const fs = large ? 22 : 18;

  if (variant === 'text') {
    return (
      <TouchableOpacity
        style={[styles.btnBase, { height: h }]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.7}
      >
        <Text style={[styles.btnText, { fontSize: fs, color: scheme.link }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  if (variant === 'secondary') {
    return (
      <TouchableOpacity
        style={[
          styles.btnBase,
          styles.btnSecondary,
          {
            height: h,
            backgroundColor: scheme.surface,
            borderColor: scheme.border,
          },
        ]}
        onPress={onPress}
        disabled={disabled}
        activeOpacity={0.75}
      >
        <Text style={[styles.btnText, { fontSize: fs, color: scheme.text }]}>{label}</Text>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.btnBase,
        styles.btnPrimary,
        { height: h, backgroundColor: scheme.primary, opacity: disabled ? 0.5 : 1 },
      ]}
      onPress={onPress}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <Text style={[styles.btnText, { fontSize: fs, color: tokens.white }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── AuthField ─────────────────────────────────────────────────────────────────

interface AuthFieldProps {
  label: string;
  value: string;
  onChangeText?: (text: string) => void;
  helper?: string;
  filled?: boolean;
  large?: boolean;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address';
  scheme: ColorScheme;
  placeholder?: string;
}

export function AuthField({
  label,
  value,
  onChangeText,
  helper,
  filled = false,
  large = false,
  secureTextEntry = false,
  keyboardType = 'default',
  scheme,
  placeholder,
}: AuthFieldProps) {
  const labelFs  = large ? 20 : 16;
  const inputH   = large ? 80 : 64;
  const inputFs  = large ? 22 : 18;
  const helperFs = large ? 18 : 14;
  const px       = large ? 25 : 20;

  return (
    <View style={styles.fieldWrapper}>
      <Text style={[styles.fieldLabel, { fontSize: labelFs, color: scheme.text }]}>
        {label}
      </Text>
      <View
        style={[
          styles.fieldInput,
          {
            height: inputH,
            backgroundColor: scheme.surface,
            borderColor: scheme.inputBorder,
            paddingHorizontal: px,
          },
        ]}
      >
        <TextInput
          style={[
            styles.fieldInputText,
            { fontSize: inputFs, color: filled ? scheme.text : scheme.muted },
          ]}
          value={value}
          onChangeText={onChangeText}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          placeholder={placeholder}
          placeholderTextColor={scheme.muted}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>
      {helper ? (
        <Text style={[styles.fieldHelper, { fontSize: helperFs, color: scheme.muted }]}>
          {helper}
        </Text>
      ) : null}
    </View>
  );
}

// ── AuthRoleTile ──────────────────────────────────────────────────────────────

interface AuthRoleTileProps {
  role: 'recipient' | 'caregiver';
  scheme: ColorScheme;
  large?: boolean;
  onPress?: () => void;
}

export function AuthRoleTile({ role, scheme, large = false, onPress }: AuthRoleTileProps) {
  const isCaregiver = role === 'caregiver';
  const bg          = isCaregiver ? tokens.caregiverPurple : '#2F7A6B';
  const label       = isCaregiver ? '👤  Caregiver' : '🙂  Care recipient';
  const h           = large ? 80 : 88;
  const fs          = large ? 22 : 18;

  return (
    <TouchableOpacity
      style={[styles.roleTile, { height: h, backgroundColor: bg }]}
      onPress={onPress}
      activeOpacity={0.82}
    >
      <Text style={[styles.roleTileText, { fontSize: fs }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── AuthStatusRing ────────────────────────────────────────────────────────────

interface AuthStatusRingProps {
  scheme: ColorScheme;
  scanning?: boolean;
}

export function AuthStatusRing({ scheme, scanning = false }: AuthStatusRingProps) {
  const pulse = useAnimatedValue(1);

  useEffect(() => {
    if (!scanning) return;
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, { toValue: 1.08, duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(pulse, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    anim.start();
    return () => anim.stop();
  }, [scanning, pulse]);

  return (
    <Animated.View
      style={[
        styles.statusRing,
        {
          backgroundColor: scheme.surface2,
          borderColor: scheme.primary,
          transform: [{ scale: pulse }],
        },
      ]}
    >
      <Text style={styles.statusRingEmoji}>👤</Text>
    </Animated.View>
  );
}

// ── AuthSpinner ───────────────────────────────────────────────────────────────

interface AuthSpinnerProps {
  label: string;
  scheme: ColorScheme;
  large?: boolean;
}

export function AuthSpinner({ label, scheme, large = false }: AuthSpinnerProps) {
  const rotation = useAnimatedValue(0);

  useEffect(() => {
    const anim = Animated.loop(
      Animated.timing(rotation, {
        toValue: 1,
        duration: 1000,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    anim.start();
    return () => anim.stop();
  }, [rotation]);

  const spin = rotation.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });
  const fs = large ? 22 : 18;

  return (
    <View style={styles.spinnerRow}>
      <Animated.View style={{ transform: [{ rotate: spin }] }}>
        <View style={[styles.spinnerRing, { borderColor: scheme.primary }]}>
          <View style={[styles.spinnerGap, { backgroundColor: scheme.surface2 }]} />
        </View>
      </Animated.View>
      <View style={{ width: large ? 20 : 16 }} />
      <Text style={[styles.spinnerLabel, { fontSize: fs, color: scheme.text }]}>{label}</Text>
    </View>
  );
}

// ── ThemeToggleBtn ────────────────────────────────────────────────────────────

interface ThemeToggleBtnProps {
  isDark: boolean;
  onToggle: () => void;
}

export function ThemeToggleBtn({ isDark, onToggle }: ThemeToggleBtnProps) {
  return (
    <TouchableOpacity
      style={[
        styles.themeToggle,
        { backgroundColor: isDark ? 'rgba(255,255,255,0.10)' : 'rgba(0,0,0,0.07)' },
      ]}
      onPress={onToggle}
      activeOpacity={0.75}
    >
      <Text style={{ fontSize: 18 }}>{isDark ? '☀️' : '🌙'}</Text>
    </TouchableOpacity>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  logoContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnBase: {
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 16,
  },
  btnPrimary: {
    elevation: 0,
  },
  btnSecondary: {
    borderWidth: 2,
  },
  btnText: {
    fontWeight: '700',
  },
  fieldWrapper: {
    width: '100%',
  },
  fieldLabel: {
    fontWeight: '600',
    marginBottom: 8,
  },
  fieldInput: {
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
  },
  fieldInputText: {
    fontWeight: '400',
    padding: 0,
  },
  fieldHelper: {
    marginTop: 6,
  },
  roleTile: {
    width: '100%',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  roleTileText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  statusRing: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRingEmoji: {
    fontSize: 44,
  },
  spinnerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  spinnerRing: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 4,
    overflow: 'hidden',
  },
  spinnerGap: {
    position: 'absolute',
    top: 0,
    right: 0,
    width: '50%',
    height: '50%',
  },
  spinnerLabel: {
    fontWeight: '600',
  },
  themeToggle: {
    position: 'absolute',
    top: 16,
    right: 16,
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
    elevation: 10,
  },
});
