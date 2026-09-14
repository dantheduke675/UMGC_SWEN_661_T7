/**
 * BiometricsIntroScreen
 * Shown after account creation. Asks the user if they want to enable Face ID.
 * "Yes, use Face ID" → FaceIDScreen (starts scanning immediately)
 * "No, use my password" → SignInScreen
 * Mirrors Flutter's BiometricsScreen ("Sign in with your face?").
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ScrollView,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { dark, light } from '../constants/theme';
import {
  AuthLogo,
  AuthStatusRing,
  AuthBtn,
  ThemeToggleBtn,
} from '../components/AuthComponents';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function BiometricsIntroScreen({ navigation }: Props) {
  const [isDark, setIsDark] = useState(true);
  const scheme = isDark ? dark : light;

  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const px = isTablet ? 65 : 26;
  const pt = isTablet ? 110 : 60;
  const pb = isTablet ? 130 : 50;

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
        {/* Content block */}
        <View style={styles.content}>
          <AuthLogo scheme={scheme} small large={isTablet} />
          <View style={{ height: 24 }} />

          <Text
            style={[
              styles.heading,
              { fontSize: isTablet ? 36 : 28, color: scheme.text },
            ]}
          >
            Sign in with your face?
          </Text>
          <View style={{ height: 16 }} />

          <Text
            style={[
              styles.body,
              { fontSize: isTablet ? 22 : 18, color: scheme.sub },
            ]}
          >
            You would open CareConnect just by looking at it. No password, no
            keyboard.
          </Text>
          <View style={{ height: 24 }} />

          <AuthStatusRing scheme={scheme} />
          <View style={{ height: 24 }} />

          <Text
            style={[
              styles.disclaimer,
              { fontSize: isTablet ? 20 : 16, color: scheme.muted },
            ]}
          >
            Your face is never sent anywhere. It stays on this phone and is
            handled by iOS. You can change this at any time from the menu.
          </Text>
        </View>

        <View style={{ height: 24 }} />

        {/* Actions */}
        <AuthBtn
          label="Yes, use Face ID"
          scheme={scheme}
          large={isTablet}
          onPress={() => navigation.navigate('FaceID')}
        />
        <View style={{ height: 16 }} />
        <AuthBtn
          label="No, use my password"
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
});
