import { createContext, useContext } from 'react'
import type { Conversation, DoseLog, Symptom } from './data'

export type Theme = 'light' | 'dark'

export interface Toast {
  id: number
  msg: string
  onUndo?: () => void
}

export interface Prefs {
  notifications: boolean
  // Medication reminders, 15 minutes before each dose
  reminders: boolean
  biometrics: boolean
  shareData: boolean
  // Simulated: no camera is used
  eyeTracking: boolean
  // The focus indicator snaps to the control nearest the pointer (see useMouseLock)
  mouseLock: boolean
}

// One undoable action, for Ctrl + U and the action history (Ctrl + H)
export interface HistoryEntry {
  id: number
  msg: string
  time: string
  undone: boolean
}

export interface AppState {
  theme: Theme
  toggleTheme: () => void
  // The keyboard focus outline is off until the user turns it on (Ctrl + = or Account)
  focusIndicator: boolean
  toggleFocusIndicator: () => void
  // Page zoom, 1 = 100%
  zoom: number
  zoomBy: (step: 1 | -1 | 0) => void
  doseLog: DoseLog
  setDose: (key: string, value: boolean | undefined) => void
  toasts: Toast[]
  // A message with onUndo is an action: it is also added to the history
  addToast: (msg: string, onUndo?: () => void) => void
  dismissToast: (id: number) => void
  history: HistoryEntry[]
  // Undoes one action (the latest one by default) and returns it; null if there was nothing to undo
  undo: (id?: number) => HistoryEntry | null
  historyOpen: boolean
  setHistoryOpen: (open: boolean | ((open: boolean) => boolean)) => void
  conversations: Conversation[]
  readConversation: (id: string) => void
  sendMessage: (id: string, text: string) => void
  symptoms: Symptom[]
  addSymptom: (s: Omit<Symptom, 'id'>) => number
  removeSymptom: (id: number) => void
  prefs: Prefs
  togglePref: (key: keyof Prefs) => void
  // The conversation id of the (simulated) call on screen, if any
  callWith: string | null
  startCall: (id: string) => void
  endCall: () => void
  // Clears the health data saved on this device
  signOut: () => void
}

// Page zoom: 80% to 200%, in 10% steps; step 0 resets to 100%
export const clampZoom = (z: number) => Math.min(2, Math.max(0.8, Math.round(z * 10) / 10))
export const nextZoom = (z: number, step: 1 | -1 | 0) => (step === 0 ? 1 : clampZoom(z + step / 10))

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
