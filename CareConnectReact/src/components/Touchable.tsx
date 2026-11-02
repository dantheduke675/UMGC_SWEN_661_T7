/**
 * TouchableOpacity with a visible keyboard focus ring.
 *
 * A drop-in replacement for React Native's TouchableOpacity (same props, same
 * fade on press): every button in the app imports it from here so that a
 * hardware keyboard (Tab / arrow keys on Android, a Bluetooth keyboard, the
 * web build) always shows where focus is. The ring is a 3px outline in the
 * theme's text colour, 2px outside the control, so it contrasts with the page
 * behind it in both themes.
 *
 * It is built on Pressable because React Native's own TouchableOpacity never
 * passes focus and blur events through on iOS and Android.
 *
 * On the web the ring follows :focus-visible, so it shows for the keyboard but
 * not after a mouse click. On iOS and Android, touch never moves focus, so any
 * focus event comes from a keyboard, D-pad or switch device.
 */
import React, { useState } from 'react';
import {
  Platform,
  Pressable,
  type NativeSyntheticEvent,
  type PressableProps,
  type TargetedEvent,
  type TouchableOpacityProps,
  type ViewStyle,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';

export function focusRingStyle(color: string): ViewStyle {
  return {
    outlineColor:  color,
    outlineStyle:  'solid',
    outlineWidth:  3,
    outlineOffset: 2,
  };
}

/** True unless the browser says this focus came from the mouse. */
export function isKeyboardFocus(e: NativeSyntheticEvent<TargetedEvent> | undefined): boolean {
  if (Platform.OS !== 'web') return true;
  const target = (e as unknown as { target?: { matches?: (s: string) => boolean } } | undefined)?.target;
  if (!target?.matches) return true;
  try {
    return target.matches(':focus-visible');
  } catch {
    return true; // very old browsers without :focus-visible
  }
}

export function TouchableOpacity({
  style,
  activeOpacity = 0.2,
  disabled,
  onFocus,
  onBlur,
  ...rest
}: TouchableOpacityProps) {
  const { scheme } = useTheme();
  const [focused, setFocused] = useState(false);

  return (
    <Pressable
      {...(rest as PressableProps)}
      // TouchableOpacity also treated aria-disabled as disabled; keep that.
      disabled={disabled ?? rest['aria-disabled'] ?? undefined}
      style={({ pressed }) => [
        style,
        pressed && { opacity: activeOpacity },
        focused && focusRingStyle(scheme.text),
      ]}
      onFocus={e => {
        setFocused(isKeyboardFocus(e));
        onFocus?.(e);
      }}
      onBlur={e => {
        setFocused(false);
        onBlur?.(e);
      }}
    />
  );
}
