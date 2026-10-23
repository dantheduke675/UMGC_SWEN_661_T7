import { useEffect, useRef, useSyncExternalStore } from 'react'
import { focusables, topModal } from './focus'

// Calls onEscape when Escape is pressed, while active
export function useEscapeKey(onEscape: () => void, active = true) {
  const handler = useRef(onEscape)
  useEffect(() => {
    handler.current = onEscape
  })
  useEffect(() => {
    if (!active) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && handler.current()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [active])
}

// Calls onOutside when the pointer goes down outside the element, while active (menus and panels)
export function useClickOutside<T extends HTMLElement>(onOutside: () => void, active = true) {
  const ref = useRef<T>(null)
  const handler = useRef(onOutside)
  useEffect(() => {
    handler.current = onOutside
  })
  useEffect(() => {
    if (!active) return
    const onDown = (e: PointerEvent) => {
      if (ref.current && e.target instanceof Node && !ref.current.contains(e.target)) handler.current()
    }
    document.addEventListener('pointerdown', onDown)
    return () => document.removeEventListener('pointerdown', onDown)
  }, [active])
  return ref
}

// Whether a CSS media query matches, kept up to date (false where matchMedia is missing)
export function useMediaQuery(query: string) {
  return useSyncExternalStore(
    onChange => {
      if (typeof window.matchMedia !== 'function') return () => {}
      const mq = window.matchMedia(query)
      mq.addEventListener('change', onChange)
      return () => mq.removeEventListener('change', onChange)
    },
    () => typeof window.matchMedia === 'function' && window.matchMedia(query).matches,
  )
}

// navigator.onLine, kept up to date
export function useOnlineStatus() {
  return useSyncExternalStore(
    onChange => {
      window.addEventListener('online', onChange)
      window.addEventListener('offline', onChange)
      return () => {
        window.removeEventListener('online', onChange)
        window.removeEventListener('offline', onChange)
      }
    },
    () => navigator.onLine,
  )
}

// Distance from a point to the nearest edge of a box (0 inside it)
function boxDistance(r: DOMRect, x: number, y: number) {
  return Math.hypot(Math.max(r.left - x, 0, x - r.right), Math.max(r.top - y, 0, y - r.bottom))
}

// Mouse lock-on reaches controls up to this far from the pointer (px)
export const LOCK_RADIUS = 140

export function nearestControl(x: number, y: number, max = LOCK_RADIUS) {
  let best: HTMLElement | null = null
  for (const el of focusables(topModal() ?? document)) {
    const d = boxDistance(el.getBoundingClientRect(), x, y)
    if (d < max) {
      max = d
      best = el
    }
  }
  return best
}

const isTextField = (el: Element | null) =>
  el instanceof HTMLTextAreaElement || (el instanceof HTMLInputElement && !['button', 'submit', 'reset', 'checkbox', 'radio'].includes(el.type))

/*
  Mouse lock-on (as in the desktop app), for people whose hand shakes: the
  focus indicator snaps to the control nearest the pointer, and a click on
  empty space presses that control.
*/
export function useMouseLock(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return
    const onMove = (e: MouseEvent) => {
      // Don't pull focus out of a field the user is typing in
      if (isTextField(document.activeElement)) return
      const el = nearestControl(e.clientX, e.clientY)
      if (el && el !== document.activeElement) el.focus({ preventScroll: true })
    }
    const onClick = (e: MouseEvent) => {
      if (!(e.target instanceof Element) || e.target.closest('a, button, input, select, textarea, label, [tabindex]')) return
      const el = nearestControl(e.clientX, e.clientY)
      if (!el) return
      e.preventDefault()
      e.stopPropagation()
      el.focus()
      el.click()
    }
    document.addEventListener('mousemove', onMove)
    document.addEventListener('click', onClick, true)
    return () => {
      document.removeEventListener('mousemove', onMove)
      document.removeEventListener('click', onClick, true)
    }
  }, [enabled])
}
