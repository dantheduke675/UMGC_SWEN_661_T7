import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppStateContext, type Theme, type Toast } from './appStateContext'
import { initialDoseLog, type DoseLog } from './data'

// The theme is a UI preference, so it is the only thing kept in localStorage.
// Health data stays in memory, as in the other CareConnect apps.
function readTheme(): Theme {
  try {
    const saved = localStorage.getItem('cc.theme')
    if (saved === 'light' || saved === 'dark') return saved
  } catch {
    /* storage blocked */
  }
  return 'dark' // the design's default
}

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [doseLog, setDoseLog] = useState<DoseLog>(initialDoseLog)
  const [toasts, setToasts] = useState<Toast[]>([])
  const nextToastId = useRef(0)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('cc.theme', theme)
    } catch {
      /* storage blocked */
    }
  }, [theme])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])
  const setDose = useCallback((key: string, value: boolean | undefined) => setDoseLog(log => ({ ...log, [key]: value })), [])
  const addToast = useCallback((msg: string, onUndo?: () => void) => {
    const id = ++nextToastId.current
    setToasts(ts => [...ts, { id, msg, onUndo }])
  }, [])
  const dismissToast = useCallback((id: number) => setToasts(ts => ts.filter(t => t.id !== id)), [])

  const value = useMemo(
    () => ({ theme, toggleTheme, doseLog, setDose, toasts, addToast, dismissToast }),
    [theme, toggleTheme, doseLog, setDose, toasts, addToast, dismissToast],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
