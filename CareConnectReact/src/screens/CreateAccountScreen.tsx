/**
 * CreateAccountScreen
 * New user registration. Fields for name, email, password, then role selection.
 * Care recipient → BiometricsIntroScreen; Caregiver → app home (not yet implemented).
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
  AuthBtn,
  AuthField,
  AuthRoleTile,
  ThemeToggleBtn,
} from '../components/AuthComponents';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function CreateAccountScreen({ navigation }: Props) {
  const [isDark, setIsDark] = useState(true);
  const scheme = isDark ? dark : light;

  const [name,     setName]     = useState('Maddy Chen');
  const [email,    setEmail]    = useState('maddy@example.com');
  const [password, setPassword] = useState('');

  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const px = isTablet ? 65 : 26;
  const pt = isTablet ? 110 : 16;
  const pb = isTablet ? 130 : 40;

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
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Back */}
        <AuthBtn
          label="← Back"
          scheme={scheme}
          variant="text"
          large={isTablet}
          onPress={() => navigation.goBack()}
        />
        <View style={{ height: 12 }} />

        {/* Heading */}
        <Text
          style={[
            styles.heading,
            { fontSize: isTablet ? 30 : 24, color: scheme.text },
          ]}
        >
          Create your account
        </Text>
        <View style={{ height: 24 }} />

        {/* Form fields */}
        <AuthField
          label="Full name"
          value={name}
          onChangeText={setName}
          filled={name.length > 0}
          large={isTablet}
          scheme={scheme}
        />
        <View style={{ height: 16 }} />

        <AuthField
          label="Email address"
          value={email}
          onChangeText={setEmail}
          filled={email.length > 0}
          keyboardType="email-address"
          large={isTablet}
          scheme={scheme}
        />
        <View style={{ height: 16 }} />

        <AuthField
          label="Password"
          value={password}
          onChangeText={setPassword}
          helper="At least 8 characters."
          secureTextEntry
          large={isTablet}
          scheme={scheme}
          placeholder="••••••••"
        />
        <View style={{ height: 28 }} />

        {/* Role section label */}
        <Text
          style={[
            styles.roleLabel,
            {
              fontSize: isTablet ? 20 : 16,
              color: scheme.sub,
            },
          ]}
        >
          I AM A…
        </Text>
        <View style={{ height: 16 }} />

        {/* Role tiles */}
        <AuthRoleTile
          role="recipient"
          scheme={scheme}
          large={isTablet}
          onPress={() => navigation.navigate('BiometricsIntro')}
        />
        <View style={{ height: 16 }} />
        <AuthRoleTile
          role="caregiver"
          scheme={scheme}
          large={isTablet}
          onPress={() => {
            // Caregiver onboarding not yet implemented
          }}
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
  heading: {
    fontWeight: '800',
  },
  roleLabel: {
    fontWeight: '700',
    letterSpacing: 0.96,
    textTransform: 'uppercase',
  },
});
