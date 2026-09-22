/**
 * LandingScreen
 * First screen users see. Shows branding, tagline, and two CTA buttons.
 * Navigation: Create account → CreateAccountScreen, Sign in → SignInScreen
 */
import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import { AuthLogo, AuthBtn, ThemeToggleBtn } from '../components/AuthComponents';

// Navigation prop type — replace with your stack navigator's prop type
interface Props {
  navigation: {
    navigate: (screen: string) => void;
  };
}

export default function LandingScreen({ navigation }: Props) {
  const { isDark, scheme, toggleTheme } = useTheme();
  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const px = isTablet ? 65 : 26;
  const py = isTablet ? 140 : 50;

  return (
    <SafeAreaView style={[styles.root, { backgroundColor: scheme.bg }]}>
      <StatusBar
        barStyle={isDark ? 'light-content' : 'dark-content'}
        backgroundColor={scheme.bg}
      />

      <View style={[styles.inner, { paddingHorizontal: px, paddingVertical: py }]}>
        {/* Brand block */}
        <View style={styles.brand}>
          <AuthLogo scheme={scheme} large={isTablet} />
          <View style={{ height: 24 }} />
          <Text
            style={[styles.appName, { fontSize: isTablet ? 40 : 32, color: scheme.text }]}
            accessibilityRole="header"
          >
            CareConnect
          </Text>
          <View style={{ height: 16 }} />
          <Text
            style={[
              styles.tagline,
              { fontSize: isTablet ? 26 : 20, color: scheme.sub },
            ]}
          >
            Your caregiver sets reminders and appointments; you simply check
            things off. Everyone stays on the same page.
          </Text>
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          <AuthBtn
            label="Create account"
            scheme={scheme}
            large={isTablet}
            onPress={() => navigation.navigate('CreateAccount')}
          />
          <View style={{ height: isTablet ? 30 : 24 }} />
          <AuthBtn
            label="Sign in"
            scheme={scheme}
            variant="secondary"
            large={isTablet}
            onPress={() => navigation.navigate('SignIn')}
          />
        </View>
      </View>

      <ThemeToggleBtn isDark={isDark} onToggle={toggleTheme} />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  inner: {
    flex: 1,
    justifyContent: 'space-between',
  },
  brand: {
    alignItems: 'center',
  },
  appName: {
    fontWeight: '800',
    textAlign: 'center',
  },
  tagline: {
    textAlign: 'center',
    lineHeight: 30,
    fontWeight: '400',
  },
  actions: {
    width: '100%',
  },
});
