/**
 * FaceIDScreen
 * Active Face ID scanning screen. Shows a pulsing face ring and a spinner
 * while biometric auth runs. Offers password fallback.
 * On success (auto after 2 s in demo) → Today screen.
 * Mirrors Flutter's SignInBioScreen.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  StatusBar,
  Animated,
  Easing,
} from 'react-native';
import { dark, light } from '../constants/theme';
import { AuthLogo, AuthSpinner, AuthBtn, ThemeToggleBtn } from '../components/AuthComponents';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    replace?: (screen: string) => void;
  };
}

// Pulsing face-scan ring with two staggered rings — mirrors CallingScreen pulse style
function ScanRing({ scheme }: { scheme: typeof dark }) {
  const pulse1 = useRef(new Animated.Value(0)).current;
  const pulse2 = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const makePulse = (anim: Animated.Value, delay: number) =>
      Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.parallel([
            Animated.timing(anim, {
              toValue: 1,
              duration: 1600,
              easing: Easing.out(Easing.ease),
              useNativeDriver: true,
            }),
          ]),
          Animated.timing(anim, { toValue: 0, duration: 0, useNativeDriver: true }),
        ]),
      );

    const a1 = makePulse(pulse1, 0);
    const a2 = makePulse(pulse2, 800);
    a1.start();
    a2.start();
    return () => { a1.stop(); a2.stop(); };
  }, [pulse1, pulse2]);

  const ringStyle = (anim: Animated.Value) => ({
    position: 'absolute' as const,
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 2,
    borderColor: scheme.primary,
    opacity: anim.interpolate({ inputRange: [0, 0.3, 1], outputRange: [0.5, 0.3, 0] }),
    transform: [
      {
        scale: anim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.55] }),
      },
    ],
  });

  return (
    <View style={styles.scanRingWrapper}>
      <Animated.View style={ringStyle(pulse1)} />
      <Animated.View style={ringStyle(pulse2)} />
      {/* Centre face icon */}
      <View
        style={[
          styles.scanRingCenter,
          { backgroundColor: scheme.surface2, borderColor: scheme.primary },
        ]}
      >
        <Text style={styles.scanRingEmoji}>👤</Text>
      </View>
    </View>
  );
}

export default function FaceIDScreen({ navigation }: Props) {
  const [isDark, setIsDark] = useState(true);
  const scheme = isDark ? dark : light;

  // Simulate Face ID completing after 2 s
  const [scanning, setScanning] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => {
      setScanning(false);
      setTimeout(() => {
        (navigation.replace ?? navigation.navigate)('Today');
      }, 600);
    }, 2000);
    return () => clearTimeout(t);
  }, [navigation]);

  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const px = isTablet ? 65 : 26;
  const pt = isTablet ? 140 : 70;
  const pb = isTablet ? 140 : 50;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: scheme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={scheme.bg}
      />

      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingHorizontal: px, paddingTop: pt, paddingBottom: pb },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Content */}
        <View style={styles.content}>
          <AuthLogo scheme={scheme} small large={isTablet} />
          <View style={{ height: 24 }} />

          <Text
            style={[
              styles.heading,
              { fontSize: isTablet ? 36 : 28, color: scheme.text },
            ]}
          >
            Welcome back, Maddy
          </Text>
          <View style={{ height: 16 }} />

          <Text
            style={[
              styles.body,
              { fontSize: isTablet ? 22 : 18, color: scheme.sub },
            ]}
          >
            Signing you in now. Look at your phone — there is nothing to tap.
          </Text>
          <View style={{ height: 24 }} />

          {/* Animated scan ring */}
          <ScanRing scheme={scheme} />
          <View style={{ height: 24 }} />

          {/* Spinner — only shown while scanning */}
          {scanning && (
            <AuthSpinner
              label="Looking for your face…"
              scheme={scheme}
              large={isTablet}
            />
          )}
          {!scanning && (
            <Text
              style={[
                styles.successLabel,
                { fontSize: isTablet ? 22 : 18, color: scheme.primary },
              ]}
            >
              ✓  Face recognised
            </Text>
          )}
          <View style={{ height: 20 }} />

          <Text
            style={[
              styles.disclaimer,
              { fontSize: isTablet ? 20 : 16, color: scheme.muted },
            ]}
          >
            A failed attempt never locks your account and never makes you wait.
            You will stay signed in afterwards.
          </Text>
        </View>

        <View style={{ height: 24 }} />

        {/* Password fallback */}
        <AuthBtn
          label="Use my password instead"
          scheme={scheme}
          variant="secondary"
          large={isTablet}
          onPress={() => navigation.navigate('SignIn')}
        />
      </ScrollView>

      <ThemeToggleBtn isDark={isDark} onToggle={() => setIsDark(d => !d)} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  scroll: {
    flexGrow: 1,
  },
  content: {
    alignItems: 'center',
  },
  heading: {
    fontWeight: '800',
    textAlign: 'center',
  },
  body: {
    textAlign: 'center',
    lineHeight: 28,
  },
  disclaimer: {
    textAlign: 'center',
    lineHeight: 24,
  },
  successLabel: {
    fontWeight: '700',
    textAlign: 'center',
  },
  scanRingWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanRingCenter: {
    width: 150,
    height: 150,
    borderRadius: 75,
    borderWidth: 5,
    alignItems: 'center',
    justifyContent: 'center',
  },
  scanRingEmoji: {
    fontSize: 44,
  },
});
