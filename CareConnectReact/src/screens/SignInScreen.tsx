/**
 * SignInScreen (password)
 * Email + password sign-in form. Offers Face ID as an alternative path.
 * Sign in → Today screen (once both fields pass validation); Use Face ID instead → FaceIDScreen
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
import { AuthBtn, AuthField, ThemeToggleBtn } from '../components/AuthComponents';
import { emailError, errorSummary, passwordError } from '../constants/validation';

interface Props {
  navigation: {
    navigate: (screen: string) => void;
    goBack: () => void;
  };
}

export default function SignInScreen({ navigation }: Props) {
  const { isDark, scheme, toggleTheme } = useTheme();

  const [email,    setEmail]    = useState('maddy@example.com');
  const [password, setPassword] = useState('');
  // Errors only appear after Sign in is pressed, and each clears as soon as
  // its field is edited.
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({});
  const emailRef    = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);

  function signIn() {
    const next = { email: emailError(email), password: passwordError(password) };
    setErrors(next);
    const messages = [next.email, next.password].filter(Boolean);
    if (messages.length === 0) {
      navigation.navigate('Today');
      return;
    }
    // Say what went wrong (iOS has no live regions), then put focus on the
    // first field to fix.
    AccessibilityInfo.announceForAccessibility(`${errorSummary(messages.length)} ${messages.join(' ')}`);
    (next.email ? emailRef : passwordRef).current?.focus();
  }

  const { width } = useWindowDimensions();
  const isTablet = width >= 700;

  const px = isTablet ? 65 : 26;
  const pt = isTablet ? 110 : 50;
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
            { fontSize: isTablet ? 36 : 28, color: scheme.text },
          ]}
          accessibilityRole="header"
        >
          Sign in
        </Text>
        <View style={{ height: 24 }} />

        {/* Email */}
        <AuthField
          label="Email address"
          value={email}
          onChangeText={t => { setEmail(t); setErrors(e => ({ ...e, email: undefined })); }}
          filled={email.length > 0}
          keyboardType="email-address"
          helper="We will never share this."
          error={errors.email}
          inputRef={emailRef}
          large={isTablet}
          scheme={scheme}
        />
        <View style={{ height: 16 }} />

        {/* Password */}
        <AuthField
          label="Password"
          value={password}
          onChangeText={t => { setPassword(t); setErrors(e => ({ ...e, password: undefined })); }}
          helper="Your password manager can fill this for you."
          error={errors.password}
          inputRef={passwordRef}
          secureTextEntry
          large={isTablet}
          scheme={scheme}
          placeholder="••••••••"
        />
        <View style={{ height: 24 }} />

        {/* Sign in button */}
        <AuthBtn
          label="Sign in"
          scheme={scheme}
          large={isTablet}
          onPress={signIn}
        />
        <View style={{ height: 16 }} />

        {/* Face ID alternate path */}
        <AuthBtn
          label="Use Face ID instead"
          scheme={scheme}
          variant="text"
          large={isTablet}
          onPress={() => navigation.navigate('FaceID')}
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
});
