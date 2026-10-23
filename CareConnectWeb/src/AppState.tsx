import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppStateContext, clampZoom, nextZoom, type HistoryEntry, type Prefs, type Theme, type Toast } from './appStateContext'
import { conversations as initialConversations, initialDoseLog, initialSymptoms, type Conversation, type DoseLog, type Symptom } from './data'

// UI preferences (theme, focus indicator, zoom) are the only things kept in localStorage.
// Health data, messages and settings stay in memory, as in the other CareConnect apps.
function readSaved<T>(key: string, parse: (saved: string | null) => T): T {
  try {
    return parse(localStorage.getItem(key))
  } catch {
    /* storage blocked */
    return parse(null)
  }
}
function save(key: string, value: string) {
  try {
    localStorage.setItem(key, value)
  } catch {
    /* storage blocked */
  }
}

const readTheme = () => readSaved<Theme>('cc.theme', s => (s === 'light' || s === 'dark' ? s : 'dark')) // dark is the design's default
const readFocus = () => readSaved('cc.focus', s => s === 'on')

const readZoom = () => readSaved('cc.zoom', s => (s && Number.isFinite(Number(s)) ? clampZoom(Number(s)) : 1))

const HISTORY_LIMIT = 50
const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [focusIndicator, setFocusIndicator] = useState(readFocus)
  const [zoom, setZoom] = useState(readZoom)
  const [doseLog, setDoseLog] = useState<DoseLog>(initialDoseLog)
  const [toasts, setToasts] = useState<Toast[]>([])
  // Toasts and history entries share ids, so undoing an action also clears its toast
  const nextId = useRef(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  // Undo functions of the actions not undone yet, oldest first
  const undoFns = useRef(new Map<number, { entry: HistoryEntry; fn: () => void }>())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(initialConversations)
  const [symptoms, setSymptoms] = useState<Symptom[]>(initialSymptoms)
  const nextSymptomId = useRef(Math.max(0, ...initialSymptoms.map(s => s.id)) + 1)
  const [prefs, setPrefs] = useState<Prefs>({ notifications: true, biometrics: true, eyeTracking: false, mouseLock: false })
  const [callWith, setCallWith] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    save('cc.theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.focusIndicator = focusIndicator ? 'on' : 'off'
    save('cc.focus', focusIndicator ? 'on' : 'off')
  }, [focusIndicator])

  // index.css applies --zoom to the body
  useEffect(() => {
    document.documentElement.style.setProperty('--zoom', String(zoom))
    save('cc.zoom', String(zoom))
  }, [zoom])

  const toggleTheme = useCallback(() => setTheme(t => (t === 'dark' ? 'light' : 'dark')), [])
  const toggleFocusIndicator = useCallback(() => setFocusIndicator(on => !on), [])
  const zoomBy = useCallback((step: 1 | -1 | 0) => setZoom(z => nextZoom(z, step)), [])
  const setDose = useCallback((key: string, value: boolean | undefined) => setDoseLog(log => ({ ...log, [key]: value })), [])
  const dismissToast = useCallback((id: number) => setToasts(ts => ts.filter(t => t.id !== id)), [])

  const undo = useCallback((id?: number) => {
    const target = id ?? [...undoFns.current.keys()].at(-1)
    const action = target === undefined ? undefined : undoFns.current.get(target)
    if (target === undefined || !action) return null
    undoFns.current.delete(target)
    action.fn()
    setHistory(h => h.map(e => (e.id === target ? { ...e, undone: true } : e)))
    setToasts(ts => ts.filter(t => t.id !== target))
    return action.entry
  }, [])

  const addToast = useCallback(
    (msg: string, onUndo?: () => void) => {
      const id = ++nextId.current
      if (onUndo) {
        const entry = { id, msg, time: now(), undone: false }
        undoFns.current.set(id, { entry, fn: onUndo })
        setHistory(h => [entry, ...h].slice(0, HISTORY_LIMIT))
      }
      setToasts(ts => [...ts, { id, msg, onUndo: onUndo && (() => undo(id)) }])
    },
    [undo],
  )

  const readConversation = useCallback(
    (id: string) => setConversations(cs => (cs.some(c => c.id === id && c.unread) ? cs.map(c => (c.id === id ? { ...c, unread: false } : c)) : cs)),
    [],
  )
  const sendMessage = useCallback((id: string, text: string) => {
    const time = now()
    setConversations(cs => cs.map(c => (c.id === id ? { ...c, time, messages: [...c.messages, { from: 'me', text, time }] } : c)))
  }, [])
  // Newest first; returns the new symptom's id so it can be undone
  const addSymptom = useCallback((s: Omit<Symptom, 'id'>) => {
    const id = nextSymptomId.current++
    setSymptoms(list => [{ ...s, id }, ...list])
    return id
  }, [])
  const removeSymptom = useCallback((id: number) => setSymptoms(list => list.filter(s => s.id !== id)), [])
  const togglePref = useCallback((key: keyof Prefs) => setPrefs(p => ({ ...p, [key]: !p[key] })), [])
  const startCall = useCallback((id: string) => setCallWith(id), [])
  const endCall = useCallback(() => setCallWith(null), [])

  const value = useMemo(
    () => ({
      theme,
      toggleTheme,
      focusIndicator,
      toggleFocusIndicator,
      zoom,
      zoomBy,
      doseLog,
      setDose,
      toasts,
      addToast,
      dismissToast,
      history,
      undo,
      historyOpen,
      setHistoryOpen,
      conversations,
      readConversation,
      sendMessage,
      symptoms,
      addSymptom,
      removeSymptom,
      prefs,
      togglePref,
      callWith,
      startCall,
      endCall,
    }),
    [
      theme,
      toggleTheme,
      focusIndicator,
      toggleFocusIndicator,
      zoom,
      zoomBy,
      doseLog,
      setDose,
      toasts,
      addToast,
      dismissToast,
      history,
      undo,
      historyOpen,
      conversations,
      readConversation,
      sendMessage,
      symptoms,
      addSymptom,
      removeSymptom,
      prefs,
      togglePref,
      callWith,
      startCall,
      endCall,
    ],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
