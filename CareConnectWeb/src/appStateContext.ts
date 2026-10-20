import { createContext, useContext } from 'react'
import type { DoseLog } from './data'

export type Theme = 'light' | 'dark'

export interface Toast {
  id: number
  msg: string
  onUndo?: () => void
}

export interface AppState {
  theme: Theme
  toggleTheme: () => void
  doseLog: DoseLog
  setDose: (key: string, value: boolean | undefined) => void
  toasts: Toast[]
  addToast: (msg: string, onUndo?: () => void) => void
  dismissToast: (id: number) => void
}

export const AppStateContext = createContext<AppState | null>(null)

export function useAppState() {
  const ctx = useContext(AppStateContext)
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider')
  return ctx
}
