/**
 * AppShell
 * Wraps all post-login screens with the bottom nav bar and accessibility bar.
 * Mirrors Flutter's AppShell ShellRoute pattern exactly:
 *  - 6 nav tabs: Today, Medications, Messages, Schedule, Symptoms, Account
 *  - AccessBar: scroll up, voice, scroll down — sits above the nav bar
 *  - Both bars are HIDDEN when viewing a message thread or calling screen
 *    (isFullScreen = true), same as Flutter's isThread || isCalling check
 *
 * Usage:
 *   <AppShell isDark={isDark} onToggleTheme={...}>
 *     <TodayScreen scheme={scheme} />
 *   </AppShell>
 *
 * Or use AppShellNavigator (below) for a self-contained tab experience.
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  //SafeAreaView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ColorScheme, dark, light } from '../constants/theme';
import { ScrollProvider, useScrollContext } from '../context/ScrollContext';
import { ThemeToggleBtn } from './AuthComponents';

// ── Nav item definitions ──────────────────────────────────────────────────────

export type TabKey =
  | 'today'
  | 'medications'
  | 'messages'
  | 'schedule'
  | 'symptoms'
  | 'account';

const NAV_ITEMS: { key: TabKey; label: string; icon: string }[] = [
  { key: 'today',       label: 'Today',       icon: '🏠' },
  { key: 'medications', label: 'Medications',  icon: '💊' },
  { key: 'messages',    label: 'Messages',     icon: '💬' },
  { key: 'schedule',    label: 'Schedule',     icon: '📅' },
  { key: 'symptoms',    label: 'Symptoms',     icon: '📊' },
  { key: 'account',     label: 'Account',      icon: '👤' },
];

// ── Accessibility bar ─────────────────────────────────────────────────────────

function AccessBar({ scheme }: { scheme: ColorScheme }) {
  const { scrollBy } = useScrollContext();

  return (
    <View
      style={[
        styles.accessBar,
        { backgroundColor: scheme.surface, borderTopColor: scheme.border },
      ]}
    >
      {/* Scroll up */}
      <AccessBtn
        icon="↑"
        label="Scroll up"
        scheme={scheme}
        onPress={() => scrollBy(-220)}
      />
      <View style={{ width: 8 }} />

      {/* Voice */}
      <TouchableOpacity
        style={[styles.voiceBtn, { backgroundColor: scheme.primary }]}
        activeOpacity={0.8}
        onPress={() => { /* voice input hook */ }}
      >
        <Text style={styles.voiceIcon}>🎤</Text>
        <Text style={styles.voiceLabel}>Voice</Text>
      </TouchableOpacity>

      <View style={{ width: 8 }} />

      {/* Scroll down */}
      <AccessBtn
        icon="↓"
        label="Scroll down"
        scheme={scheme}
        onPress={() => scrollBy(220)}
      />
    </View>
  );
}

function AccessBtn({
  icon,
  label,
  scheme,
  onPress,
}: {
  icon:    string;
  label:   string;
  scheme:  ColorScheme;
  onPress: () => void;
}) {
  return (
    <TouchableOpacity
      style={[
        styles.accessBtn,
        { backgroundColor: scheme.surface2, borderColor: scheme.border },
      ]}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <Text style={[styles.accessBtnIcon, { color: scheme.sub }]}>{icon}</Text>
      <Text style={[styles.accessBtnLabel, { color: scheme.sub }]}>{label}</Text>
    </TouchableOpacity>
  );
}

// ── Bottom nav bar ────────────────────────────────────────────────────────────

function BottomNav({
  activeTab,
  scheme,
  onTabPress,
}: {
  activeTab:   TabKey;
  scheme:      ColorScheme;
  onTabPress:  (key: TabKey) => void;
}) {
  return (
    <View
      style={[
        styles.bottomNav,
        { backgroundColor: scheme.surface, borderTopColor: scheme.border },
      ]}
    >
      {NAV_ITEMS.map(item => {
        const active = item.key === activeTab;
        return (
          <TouchableOpacity
            key={item.key}
            style={styles.navItem}
            onPress={() => onTabPress(item.key)}
            activeOpacity={0.7}
          >
            {/* Active top stripe */}
            <View style={styles.navStripeRow}>
              {active && (
                <View
                  style={[styles.navStripe, { backgroundColor: scheme.primary }]}
                />
              )}
            </View>
            <Text style={styles.navIcon}>{item.icon}</Text>
            <Text
              style={[
                styles.navLabel,
                { color: active ? scheme.primary : scheme.sub },
              ]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

// ── Shell wrapper ─────────────────────────────────────────────────────────────

interface AppShellProps {
  children:       React.ReactNode;
  activeTab:      TabKey;
  scheme:         ColorScheme;
  isFullScreen?:  boolean; // true for thread / calling — hides both bars
  onTabPress:     (key: TabKey) => void;
  isDark?:        boolean;
  onToggleTheme?: () => void;
}

export function AppShell({
  children,
  activeTab,
  scheme,
  isFullScreen = false,
  onTabPress,
  isDark,
  onToggleTheme,
}: AppShellProps) {
  // Account tab has its own theme switch in Preferences — avoid showing both.
  const showThemeToggle = !isFullScreen && activeTab !== 'account' && onToggleTheme;

  return (
    <ScrollProvider>
      <View style={[styles.root, { backgroundColor: scheme.bg }]}>
        {/* Screen content */}
        <View style={styles.body}>{children}</View>

        {showThemeToggle && (
          <SafeAreaView
            edges={['top']}
            style={styles.themeToggleOverlay}
            pointerEvents="box-none"
          >
            <ThemeToggleBtn isDark={!!isDark} onToggle={onToggleTheme} />
          </SafeAreaView>
        )}

        {/* Bottom bars — hidden in full-screen modes */}
        {!isFullScreen && (
          <SafeAreaView
            edges={['bottom']}
            style={{ backgroundColor: scheme.surface }}
          >
            <AccessBar scheme={scheme} />
            <BottomNav
              activeTab={activeTab}
              scheme={scheme}
              onTabPress={onTabPress}
            />
          </SafeAreaView>
        )}
      </View>
    </ScrollProvider>
  );
}

// ── Self-contained navigator (drop-in replacement) ────────────────────────────

/**
 * AppShellNavigator manages its own tab state and theme toggle.
 * Swap the placeholder screens for your real screen components.
 *
 *   import AppShellNavigator from './components/AppShell';
 *   // In your root navigator, replace the Today/app stack with:
 *   <Stack.Screen name="App" component={AppShellNavigator} />
 */

import TodayScreen       from '../screens/TodayScreen';
import MedicationsScreen from '../screens/MedicationsScreen';
import MessagesScreen    from '../screens/MessagesScreen';
import MsgThreadScreen   from '../screens/MsgThreadScreen';
import ScheduleScreen    from '../screens/ScheduleScreen';
import SymptomsScreen    from '../screens/SymptomsScreen';
import AccountScreen     from '../screens/AccountScreen';
import CallingScreen     from '../screens/CallingScreen';

type ViewState =
  | { type: 'tab'; tab: TabKey }
  | { type: 'thread'; threadId: number }
  | { type: 'calling'; contactId: number };

interface AppShellNavigatorProps {
  navigation?: {
    reset: (state: { index: number; routes: { name: string }[] }) => void;
  };
}

export default function AppShellNavigator({ navigation }: AppShellNavigatorProps) {
  const [isDark, setIsDark] = useState(true);
  const scheme = isDark ? dark : light;

  const [view, setView] = useState<ViewState>({ type: 'tab', tab: 'today' });

  const activeTab    = view.type === 'tab' ? view.tab : 'messages';
  const isFullScreen = view.type === 'thread' || view.type === 'calling';

  function renderScreen() {
    if (view.type === 'thread') {
      return (
        <MsgThreadScreen
          threadId={view.threadId}
          scheme={scheme}
          onBack={() => setView({ type: 'tab', tab: 'messages' })}
          onCall={contactId => setView({ type: 'calling', contactId })}
        />
      );
    }

    if (view.type === 'calling') {
      return (
        <CallingScreen
          contactId={view.contactId}
          onEnd={() => setView({ type: 'tab', tab: 'messages' })}
        />
      );
    }

    switch (view.tab) {
      case 'today':
        return <TodayScreen scheme={scheme} />;
      case 'medications':
        return <MedicationsScreen scheme={scheme} />;
      case 'messages':
        return (
          <MessagesScreen
            scheme={scheme}
            onOpenThread={id => setView({ type: 'thread', threadId: id })}
          />
        );
      case 'schedule':
        return <ScheduleScreen scheme={scheme} />;
      case 'symptoms':
        return <SymptomsScreen scheme={scheme} />;
      case 'account':
        return (
          <AccountScreen
            scheme={scheme}
            isDark={isDark}
            onToggleTheme={() => setIsDark(d => !d)}
            onSignOut={() => {
              navigation?.reset({ index: 0, routes: [{ name: 'Landing' }] });
            }}
            onMessages={() => setView({ type: 'tab', tab: 'messages' })}
          />
        );
    }
  }

  return (
    <AppShell
      activeTab={activeTab}
      scheme={scheme}
      isFullScreen={isFullScreen}
      onTabPress={tab => setView({ type: 'tab', tab })}
      isDark={isDark}
      onToggleTheme={() => setIsDark(d => !d)}
    >
      {renderScreen()}
    </AppShell>
  );
}

// ── Styles ────────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  body: {
    flex: 1,
  },
  themeToggleOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },

  // Accessibility bar
  accessBar: {
    height:            64,
    flexDirection:     'row',
    alignItems:        'flex-end',
    paddingHorizontal: 12,
    paddingTop:        12,
    paddingBottom:     0,
    borderTopWidth:    1,
  },
  accessBtn: {
    flex:           1,
    height:         52,
    borderRadius:   16,
    borderWidth:    2,
    alignItems:     'center',
    justifyContent: 'center',
  },
  accessBtnIcon: {
    fontSize: 20,
  },
  accessBtnLabel: {
    fontSize:   11,
    fontWeight: '700',
    marginTop:  1,
  },
  voiceBtn: {
    width:          72,
    height:         52,
    borderRadius:   16,
    alignItems:     'center',
    justifyContent: 'center',
  },
  voiceIcon: {
    fontSize: 20,
  },
  voiceLabel: {
    fontSize:   11,
    color:      '#FFFFFF',
    fontWeight: '700',
    marginTop:  1,
  },

  // Bottom nav
  bottomNav: {
    height:        76,
    flexDirection: 'row',
    borderTopWidth: 1,
  },
  navItem: {
    flex:           1,
    alignItems:     'center',
    justifyContent: 'center',
    paddingBottom:  Platform.OS === 'ios' ? 0 : 4,
  },
  navStripeRow: {
    position:       'absolute',
    top:            0,
    left:           0,
    right:          0,
    alignItems:     'center',
  },
  navStripe: {
    width:                36,
    height:               4,
    borderBottomLeftRadius:  4,
    borderBottomRightRadius: 4,
  },
  navIcon: {
    fontSize:  24,
    marginTop: 8,
  },
  navLabel: {
    fontSize:   11,
    fontWeight: '700',
    marginTop:  2,
  },

});
