import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppStateContext, type Prefs, type Theme, type Toast } from './appStateContext'
import { conversations as initialConversations, initialDoseLog, initialSymptoms, type Conversation, type DoseLog, type Symptom } from './data'

// The theme is a UI preference, so it is the only thing kept in localStorage.
// Health data, messages and settings stay in memory, as in the other CareConnect apps.
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
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialSymptoms)
  const [prefs, setPrefs] = useState<Prefs>({ notifications: true, biometrics: true })
  const [callWith, setCallWith] = useState<string | null>(null)

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

  const readConversation = useCallback(
    (id: string) => setConversations(cs => (cs.some(c => c.id === id && c.unread) ? cs.map(c => (c.id === id ? { ...c, unread: false } : c)) : cs)),
    [],
  )
  const sendMessage = useCallback((id: string, text: string) => {
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    setConversations(cs => cs.map(c => (c.id === id ? { ...c, time, messages: [...c.messages, { from: 'me', text, time }] } : c)))
  }, [])
  // Newest first
  const addSymptom = useCallback((s: Omit<Symptom, 'id'>) => setSymptoms(list => [{ ...s, id: Math.max(0, ...list.map(x => x.id)) + 1 }, ...list]), [])
  const togglePref = useCallback((key: keyof Prefs) => setPrefs(p => ({ ...p, [key]: !p[key] })), [])
  const startCall = useCallback((id: string) => setCallWith(id), [])
  const endCall = useCallback(() => setCallWith(null), [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      doseLog,
      setDose,
      toasts,
      addToast,
      dismissToast,
      conversations,
      readConversation,
      sendMessage,
      symptoms,
      addSymptom,
      prefs,
      togglePref,
      callWith,
      startCall,
      endCall,
    }),
    [
      theme,
      toggleTheme,
      doseLog,
      setDose,
      toasts,
      addToast,
      dismissToast,
      conversations,
      readConversation,
      sendMessage,
      symptoms,
      addSymptom,
      prefs,
      togglePref,
      callWith,
      startCall,
      endCall,
    ],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
