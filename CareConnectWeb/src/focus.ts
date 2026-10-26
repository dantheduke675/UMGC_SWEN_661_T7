import { useEffect, useRef, useState } from 'react'

const FOCUSABLE = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled]):not([type="hidden"])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',')

// What Tab would reach inside a container, in page order
export function focusables(scope: ParentNode = document) {
  return [...scope.querySelectorAll<HTMLElement>(FOCUSABLE)].filter(
    el => !el.closest('[inert], [aria-hidden="true"]') && (typeof el.checkVisibility !== 'function' || el.checkVisibility({ visibilityProperty: true })),
  )
}

// The open modal dialog on top, if any (later in the page = on top)
export function topModal() {
  const modals = document.querySelectorAll<HTMLElement>('[aria-modal="true"]')
  return modals[modals.length - 1] ?? null
}

/*
  Keeps Tab and Shift + Tab inside a modal dialog, and gives focus back to the
  control that opened it when it closes. Put the returned ref on the element
  with aria-modal="true".
*/
export function useFocusTrap<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  // Read before the dialog's autoFocus moves focus inside it
  const [opener] = useState(() => document.activeElement as HTMLElement | null)

  useEffect(() => {
    const node = ref.current
    if (!node) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || e.defaultPrevented || topModal() !== node) return
      const items = focusables(node)
      const first = items[0]
      const last = items.at(-1)
      const active = document.activeElement
      if (!first || !last) e.preventDefault()
      else if (!node.contains(active)) {
        e.preventDefault()
        ;(e.shiftKey ? last : first).focus()
      } else if (e.shiftKey && active === first) {
        e.preventDefault()
        last.focus()
      } else if (!e.shiftKey && active === last) {
        e.preventDefault()
        first.focus()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('keydown', onKey)
      // Only once the dialog has really left the page, and only if focus went with it
      // (another dialog may have taken focus, as when SOS opens the call screen)
      const active = document.activeElement
      if (!node.isConnected && (!active || active === document.body) && opener?.isConnected) opener.focus()
    }
  }, [opener])

  return ref
}

// Fields where the arrow keys move the caret or change the value
function ownsArrowKeys(el: Element | null, key: string) {
  if (!(el instanceof HTMLElement)) return false
  if (el.isContentEditable || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement) return true
  if (el instanceof HTMLInputElement && !['button', 'submit', 'reset', 'checkbox', 'radio'].includes(el.type)) {
    // Single-line fields keep Left / Right for the caret; Up / Down still move on
    return key === 'ArrowLeft' || key === 'ArrowRight' || el.type === 'number' || el.type === 'range'
  }
  return false
}

type Direction = 'up' | 'down' | 'left' | 'right'
const ARROW_DIRECTION: Record<string, Direction> = { ArrowUp: 'up', ArrowDown: 'down', ArrowLeft: 'left', ArrowRight: 'right' }

// How far apart two ranges on one axis are (0 when they overlap)
const rangeGap = (a1: number, a2: number, b1: number, b2: number) => Math.max(0, Math.max(a1, b1) - Math.min(a2, b2))

// Added to the score of controls not lined up with the current one, so any
// control in the same row (or column) wins over a closer one diagonally
const NOT_LINED_UP = 100_000

// The control on screen nearest to `from` in that direction, preferring ones
// lined up with it (the desktop app's scoring, with lined-up controls first)
function nearestInDirection(from: HTMLElement, items: HTMLElement[], dir: Direction) {
  const c = from.getBoundingClientRect()
  let best: HTMLElement | null = null
  let bestScore = Infinity
  for (const el of items) {
    if (el === from || el.contains(from) || from.contains(el)) continue
    const r = el.getBoundingClientRect()
    const vertical = dir === 'up' || dir === 'down'
    const main = vertical ? (dir === 'down' ? r.top - c.bottom : c.top - r.bottom) : dir === 'right' ? r.left - c.right : c.left - r.right
    if (main < -4) continue // not in that direction
    const cross = vertical ? rangeGap(r.left, r.right, c.left, c.right) : rangeGap(r.top, r.bottom, c.top, c.bottom)
    const offset = vertical ? Math.abs(r.left + r.right - (c.left + c.right)) / 2 : Math.abs(r.top + r.bottom - (c.top + c.bottom)) / 2
    const score = (cross > 0 ? NOT_LINED_UP : 0) + Math.max(main, 0) + cross * 2 + offset * 0.05
    if (score < bestScore) {
      bestScore = score
      best = el
    }
  }
  return best
}

/*
  Arrow keys move the focus indicator across the screen to the nearest control
  in that direction (inside the open dialog, if there is one). Returns true if
  it moved focus; when nothing lies that way the key keeps its usual job of
  scrolling the page.
*/
export function moveFocusWithArrow(e: KeyboardEvent) {
  const dir = ARROW_DIRECTION[e.key]
  if (!dir || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || ownsArrowKeys(document.activeElement, e.key)) return false
  const scope = topModal() ?? document
  const items = focusables(scope)
  if (!items.length) return false
  const current = document.activeElement
  const next =
    current instanceof HTMLElement && current !== document.body && scope.contains(current)
      ? nearestInDirection(current, items, dir)
      : dir === 'up' || dir === 'left' ? items[items.length - 1] : items[0]
  if (!next) return false
  next.focus({ preventScroll: true })
  next.scrollIntoView?.({ block: 'nearest', inline: 'nearest' })
  return true
}
