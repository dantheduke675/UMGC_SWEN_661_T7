import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { AppStateContext, clampZoom, nextZoom, type HistoryEntry, type Prefs, type Theme, type Toast } from './appStateContext'
import { conversations as initialConversations, initialDoseLog, initialSymptoms, type Conversation, type DoseLog, type Symptom } from './data'

/*
  Everything is kept in localStorage, so what someone enters (online or
  offline) is still there after a reload: UI preferences (theme, focus
  indicator, zoom), settings, today's doses, messages and symptoms. Signing
  out puts the health data back to the starting demo data.
*/
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

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === 'object' && v !== null && !Array.isArray(v)

// Saved JSON, or the fallback when nothing is saved or it is unreadable
function readJSON<T>(key: string, fallback: T, isValid: (v: unknown) => boolean): T {
  return readSaved(key, s => {
    if (s === null) return fallback
    try {
      const v: unknown = JSON.parse(s)
      return isValid(v) ? (v as T) : fallback
    } catch {
      return fallback
    }
  })
}
const saveJSON = (key: string, value: unknown) => save(key, JSON.stringify(value))

// Dose keys have no date ("1-0" is medicine 1, first dose), so a saved log only counts on the day it was made
const today = () => new Date().toDateString()
function readDoseLog(): DoseLog {
  const saved = readJSON<Record<string, unknown>>('cc.doses', {}, isRecord)
  return saved.day === today() && isRecord(saved.log) ? (saved.log as DoseLog) : initialDoseLog
}

const DEFAULT_PREFS: Prefs = { notifications: true, reminders: true, biometrics: true, shareData: true, eyeTracking: false, mouseLock: false }
const readPrefs = (): Prefs => ({ ...DEFAULT_PREFS, ...readJSON<Partial<Prefs>>('cc.prefs', {}, isRecord) })
const readConversations = () => readJSON<Conversation[]>('cc.conversations', initialConversations, Array.isArray)
const readSymptoms = () => readJSON<Symptom[]>('cc.symptoms', initialSymptoms, Array.isArray)

const readTheme = () => readSaved<Theme>('cc.theme', s => (s === 'light' || s === 'dark' ? s : 'dark')) // dark is the design's default
const readFocus = () => readSaved('cc.focus', s => s === 'on')

const readZoom = () => readSaved('cc.zoom', s => (s && Number.isFinite(Number(s)) ? clampZoom(Number(s)) : 1))

const HISTORY_LIMIT = 50
const now = () => new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })

export function AppStateProvider({ children }: { children: ReactNode }) {
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [focusIndicator, setFocusIndicator] = useState(readFocus)
  const [zoom, setZoom] = useState(readZoom)
  const [doseLog, setDoseLog] = useState<DoseLog>(readDoseLog)
  const [toasts, setToasts] = useState<Toast[]>([])
  // Toasts and history entries share ids, so undoing an action also clears its toast
  const nextId = useRef(0)
  const [history, setHistory] = useState<HistoryEntry[]>([])
  // Undo functions of the actions not undone yet, oldest first
  const undoFns = useRef(new Map<number, { entry: HistoryEntry; fn: () => void }>())
  const [historyOpen, setHistoryOpen] = useState(false)
  const [conversations, setConversations] = useState<Conversation[]>(readConversations)
  const [symptoms, setSymptoms] = useState<Symptom[]>(readSymptoms)
  const nextSymptomId = useRef(0)
  const [prefs, setPrefs] = useState<Prefs>(readPrefs)
  const [callWith, setCallWith] = useState<string | null>(null)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    save('cc.theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.focusIndicator = focusIndicator ? 'on' : 'off'
    save('cc.focus', focusIndicator ? 'on' : 'off')
  }, [focusIndicator])

  useEffect(() => saveJSON('cc.doses', { day: today(), log: doseLog }), [doseLog])
  useEffect(() => saveJSON('cc.conversations', conversations), [conversations])
  useEffect(() => {
    saveJSON('cc.symptoms', symptoms)
    // New symptoms get ids above every saved one
    nextSymptomId.current = Math.max(nextSymptomId.current, ...symptoms.map(s => s.id + 1), 1)
  }, [symptoms])
  useEffect(() => saveJSON('cc.prefs', prefs), [prefs])

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
  // Back to the demo data, so the next person on this device sees none of it; nothing is left to undo
  const signOut = useCallback(() => {
    setDoseLog(initialDoseLog)
    setConversations(initialConversations)
    setSymptoms(initialSymptoms)
    setCallWith(null)
    undoFns.current.clear()
    setHistory([])
    setToasts([])
  }, [])
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
      signOut,
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
      signOut,
    ],
  )
  return <AppStateContext.Provider value={value}>{children}</AppStateContext.Provider>
}
