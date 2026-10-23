import { useAppState } from './appStateContext'

/*
  The settings the keyboard shortcuts (and the top bar) switch, each with a
  message that can undo it. The Account page switches the same settings
  quietly, since its rows already show the new value.
*/
export function useToggleActions() {
  const { theme, toggleTheme, focusIndicator, toggleFocusIndicator, prefs, togglePref, addToast } = useAppState()
  const flip = (msg: string, fn: () => void) => {
    fn()
    addToast(msg, fn)
  }
  const pref = (key: 'eyeTracking' | 'mouseLock' | 'biometrics' | 'notifications', on: string, off: string) => () =>
    flip(prefs[key] ? off : on, () => togglePref(key))

  return {
    focusIndicator: () => flip(focusIndicator ? 'Focus indicator off' : 'Focus indicator on. Move it with the arrow keys or Tab.', toggleFocusIndicator),
    theme: () => flip(theme === 'dark' ? 'Light mode on' : 'Dark mode on', toggleTheme),
    eyeTracking: pref('eyeTracking', 'Eye tracking on (simulated, no camera is used)', 'Eye tracking off'),
    mouseLock: pref('mouseLock', 'Mouse lock on (simulated)', 'Mouse lock off'),
    biometrics: pref('biometrics', 'Face ID on', 'Face ID off'),
    notifications: pref('notifications', 'Medication reminders on', 'Medication reminders off'),
  }
}
