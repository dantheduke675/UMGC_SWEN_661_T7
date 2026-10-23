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
  biometrics: boolean
}

export interface AppState {
  theme: Theme
  toggleTheme: () => void
  doseLog: DoseLog
  setDose: (key: string, value: boolean | undefined) => void
  toasts: Toast[]
  addToast: (msg: string, onUndo?: () => void) => void
  dismissToast: (id: number) => void
  conversations: Conversation[]
  readConversation: (id: string) => void
  sendMessage: (id: string, text: string) => void
  symptoms: Symptom[]
  addSymptom: (s: Omit<Symptom, 'id'>) => void
  prefs: Prefs
  togglePref: (key: keyof Prefs) => void
  // The conversation id of the (simulated) call on screen, if any
  callWith: string | null
  startCall: (id: string) => void
  endCall: () => void
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
