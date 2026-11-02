/**
 * CreateAccountScreen
 * New user registration. Fields for name, email, password, then role selection.
 * Care recipient → BiometricsIntroScreen; Caregiver → app home (not yet implemented).
 */
import React, { useRef, useState } from 'react';
import {
  AccessibilityInfo,
  TextInput,
  View,
  Text,
  StyleSheet,
  ScrollView,
  useWindowDimensions,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import {
  AuthBtn,
  AuthField,
  AuthRoleTile,
  ThemeToggleBtn,
} from '../components/AuthComponents';
import {
  PASSWORD_MIN_LENGTH,
  emailError,
  errorSummary,
  nameError,
  passwordError,
} from '../constants/validation';

type FieldErrors = { name?: string; email?: string; password?: string };

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function CreateAccountScreen({ navigation }: Props) {
  const { isDark, scheme, toggleTheme } = useTheme();

  const [name,     setName]     = useState('Maddy Chen');
  const [email,    setEmail]    = useState('maddy@example.com');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const nameRef     = useRef<TextInput>(null);
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  /** Checks the form before a role is chosen; true when it can go ahead. */
  function validate(): boolean {
    const next: FieldErrors = {
      name:     nameError(name),
      email:    emailError(email),
      password: passwordError(password, PASSWORD_MIN_LENGTH),
    };
    setErrors(next);
    const messages = [next.name, next.email, next.password].filter(Boolean);
    if (messages.length === 0) return true;
    AccessibilityInfo.announceForAccessibility(`${errorSummary(messages.length)} ${messages.join(' ')}`);
    (next.name ? nameRef : next.email ? emailRef : passwordRef).current?.focus();
    return false;
  }

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
          accessibilityLabel="Back"
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
          accessibilityRole="header"
        >
          Create your account
        </Text>
        <View style={{ height: 24 }} />

        {/* Form fields */}
        <AuthField
          label="Full name"
          value={name}
          onChangeText={t => { setName(t); setErrors(e => ({ ...e, name: undefined })); }}
          filled={name.length > 0}
          error={errors.name}
          inputRef={nameRef}
          large={isTablet}
          scheme={scheme}
        />
        <View style={{ height: 16 }} />

        <AuthField
          label="Email address"
          value={email}
          onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
          filled={email.length > 0}
          keyboardType="email-address"
          error={errors.email}
          inputRef={emailRef}
          large={isTablet}
          scheme={scheme}
        />
        <View style={{ height: 16 }} />

        <AuthField
          label="Password"
          value={password}
          onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
          helper={`At least ${PASSWORD_MIN_LENGTH} characters.`}
          error={errors.password}
          inputRef={passwordRef}
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
          accessibilityRole="header"
        >
          I AM A…
        </Text>
        <View style={{ height: 16 }} />

        {/* Role tiles */}
        <AuthRoleTile
          role="recipient"
          scheme={scheme}
          large={isTablet}
          onPress={() => { if (validate()) navigation.navigate('BiometricsIntro'); }}
        />
        <View style={{ height: 16 }} />
        <AuthRoleTile
          role="caregiver"
          scheme={scheme}
          large={isTablet}
          onPress={() => {
            // Caregiver onboarding not yet implemented; still check the form
            // so the user is told about any mistakes.
            validate();
          }}
        />
      </ScrollView>

      <ThemeToggleBtn isDark={isDark} onToggle={toggleTheme} />
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
