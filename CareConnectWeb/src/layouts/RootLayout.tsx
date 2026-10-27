import { lazy, Suspense, useEffect } from 'react'
import { Outlet } from 'react-router'
import { useToggleActions } from '../actions'
import { nextZoom, useAppState } from '../appStateContext'
import { Toasts } from '../components/Toasts'
import { moveFocusWithArrow } from '../focus'
import { useMouseLock, useOnlineStatus } from '../hooks'
import { matchShortcut } from '../shortcuts'

// Opens on demand (Ctrl + H), so it is its own chunk, loaded the first time it opens
const HistoryDialog = lazy(() => import('../components/HistoryDialog').then(m => ({ default: m.HistoryDialog })))

/*
  Wraps every page: the keyboard shortcuts that work everywhere (see
  shortcuts.ts), arrow-key focus movement once the focus indicator is on,
  mouse lock-on, the offline notice, messages and the action history.
*/
export function RootLayout() {
  const { focusIndicator, zoom, zoomBy, undo, addToast, historyOpen, setHistoryOpen, prefs } = useAppState()
  const toggles = useToggleActions()
  const online = useOnlineStatus()
  useMouseLock(prefs.mouseLock)

  useEffect(() => {
    const zoomTo = (step: 1 | -1 | 0) => {
      zoomBy(step)
      addToast(`Zoom ${Math.round(nextZoom(zoom, step) * 100)}%`)
    }
    const onKey = (e: KeyboardEvent) => {
      // The shell handles voice and SOS first
      if (e.defaultPrevented) return
      const id = matchShortcut(e)
      if (!id) {
        if (focusIndicator && moveFocusWithArrow(e)) e.preventDefault()
        return
      }
      e.preventDefault()
      switch (id) {
        case 'focus-indicator':
          return toggles.focusIndicator()
        case 'zoom-in':
          return zoomTo(1)
        case 'zoom-out':
          return zoomTo(-1)
        case 'zoom-reset':
          return zoomTo(0)
        case 'theme':
          return toggles.theme()
        case 'eye-tracking':
          return toggles.eyeTracking()
        case 'mouse-lock':
          return toggles.mouseLock()
        case 'biometrics':
          return toggles.biometrics()
        case 'notifications':
          return toggles.notifications()
        case 'undo': {
          const done = undo()
          return addToast(done ? `Undone: ${done.msg}` : 'Nothing to undo')
        }
        case 'history':
          return setHistoryOpen(open => !open)
        case 'refresh':
          return window.location.reload()
        // Only reached outside the signed-in pages
        case 'voice':
          return addToast('Sign in to use voice commands')
        case 'sos':
          return addToast('Sign in to use the emergency call')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [focusIndicator, zoom, zoomBy, undo, addToast, setHistoryOpen, toggles])

  return (
    <>
      <Outlet />
      {/* The service worker keeps every page working offline; say so rather than fail quietly */}
      <div aria-live="polite" className="pointer-events-none fixed top-2 left-1/2 z-40 -translate-x-1/2">
        {!online && (
          <p className="rounded-full bg-[#1d2534] px-4 py-2 text-sm font-bold text-[#f5f7fa] shadow-lg">
            <span aria-hidden="true">📴 </span>You're offline. CareConnect still works; changes stay on this device.
          </p>
        )}
      </div>
      <Toasts />
      <Suspense fallback={null}>{historyOpen && <HistoryDialog onClose={() => setHistoryOpen(false)} />}</Suspense>
    </>
  )
}
