import { useEffect } from 'react'
import { Outlet } from 'react-router'
import { useToggleActions } from '../actions'
import { nextZoom, useAppState } from '../appStateContext'
import { HistoryDialog } from '../components/HistoryDialog'
import { Toasts } from '../components/Toasts'
import { moveFocusWithArrow } from '../focus'
import { matchShortcut } from '../shortcuts'

/*
  Wraps every page: the keyboard shortcuts that work everywhere (see
  shortcuts.ts), arrow-key focus movement once the focus indicator is on,
  messages and the action history.
*/
export function RootLayout() {
  const { focusIndicator, zoom, zoomBy, undo, addToast, historyOpen, setHistoryOpen } = useAppState()
  const toggles = useToggleActions()

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
      <Toasts />
      {historyOpen && <HistoryDialog onClose={() => setHistoryOpen(false)} />}
    </>
  )
}
