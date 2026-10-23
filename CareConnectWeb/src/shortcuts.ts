// Keyboard shortcuts, as listed in the Help dialog. Most are handled in
// RootLayout; voice commands and emergency call need the signed-in shell (AppShell).
export type ShortcutId =
  | 'focus-indicator'
  | 'zoom-in'
  | 'zoom-out'
  | 'zoom-reset'
  | 'theme'
  | 'voice'
  | 'eye-tracking'
  | 'mouse-lock'
  | 'undo'
  | 'history'
  | 'sos'
  | 'biometrics'
  | 'refresh'
  | 'notifications'

export const CTRL_SHORTCUTS: { id: ShortcutId; key: string; label: string; does: string }[] = [
  { id: 'focus-indicator', key: '=', label: 'Ctrl + =', does: 'Turn the focus indicator on or off' },
  { id: 'zoom-in', key: '+', label: 'Ctrl + +', does: 'Zoom in' },
  { id: 'zoom-out', key: '-', label: 'Ctrl + −', does: 'Zoom out' },
  { id: 'zoom-reset', key: '0', label: 'Ctrl + 0', does: 'Reset zoom to 100%' },
  { id: 'theme', key: 'l', label: 'Ctrl + L', does: 'Switch light / dark mode' },
  { id: 'voice', key: '\\', label: 'Ctrl + \\', does: 'Voice commands' },
  { id: 'eye-tracking', key: 'i', label: 'Ctrl + I', does: 'Eye tracking on or off' },
  { id: 'mouse-lock', key: 'o', label: 'Ctrl + O', does: 'Mouse lock on or off' },
  { id: 'undo', key: 'u', label: 'Ctrl + U', does: 'Undo the last action' },
  { id: 'history', key: 'h', label: 'Ctrl + H', does: 'Open the action history' },
  { id: 'sos', key: 's', label: 'Ctrl + S', does: 'Emergency call (asks first)' },
  { id: 'biometrics', key: 'f', label: 'Ctrl + F', does: 'Face ID on or off' },
  { id: 'refresh', key: 'r', label: 'Ctrl + R', does: 'Refresh the page' },
  { id: 'notifications', key: 'n', label: 'Ctrl + N', does: 'Medication reminders on or off' },
]

export const OTHER_KEYS: { label: string; does: string }[] = [
  { label: 'Arrow keys', does: 'Move the focus indicator (once it is on)' },
  { label: 'Enter', does: 'Press the focused button, or sign in' },
  { label: 'Tab / Shift + Tab', does: 'Move between controls; stays inside an open dialog' },
  { label: 'Escape', does: 'Close a dialog or menu' },
]

const BY_KEY = new Map(CTRL_SHORTCUTS.map(s => [s.key, s.id]))

// The Ctrl shortcut a key press means, if any. Shift is only allowed where it
// is needed to type the key ("+" is Shift + = on many keyboards), so browser
// tools such as Ctrl + Shift + I keep working.
export function matchShortcut(e: KeyboardEvent): ShortcutId | null {
  if (!e.ctrlKey || e.altKey || e.metaKey) return null
  const key = e.key === '_' ? '-' : e.key.toLowerCase()
  if (e.shiftKey && key !== '+' && key !== '-') return null
  return BY_KEY.get(key) ?? null
}
