/**
 * SignInScreen (password)
 * Email + password sign-in form. Offers Face ID as an alternative path.
 * Sign in → Today screen; Use Face ID instead → FaceIDScreen
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
import { useTheme } from '../context/ThemeContext';
import { AuthBtn, AuthField, ThemeToggleBtn } from '../components/AuthComponents';

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
          onChangeText={setEmail}
          filled={email.length > 0}
          keyboardType="email-address"
          helper="We will never share this."
          large={isTablet}
          scheme={scheme}
        />
        <View style={{ height: 16 }} />

        {/* Password */}
        <AuthField
          label="Password"
          value={password}
          onChangeText={setPassword}
          helper="Your password manager can fill this for you."
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
          onPress={() => navigation.navigate('Today')}
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
