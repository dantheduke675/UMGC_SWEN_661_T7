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

const ARROW_STEP: Record<string, 1 | -1> = { ArrowDown: 1, ArrowRight: 1, ArrowUp: -1, ArrowLeft: -1 }

/*
  Arrow keys move the focus indicator to the next / previous control (inside
  the open dialog, if there is one). Returns true if it moved focus.
*/
export function moveFocusWithArrow(e: KeyboardEvent) {
  const step = ARROW_STEP[e.key]
  if (!step || e.ctrlKey || e.altKey || e.metaKey || e.shiftKey || ownsArrowKeys(document.activeElement, e.key)) return false
  const items = focusables(topModal() ?? document)
  if (!items.length) return false
  const i = items.indexOf(document.activeElement as HTMLElement)
  const next = i === -1 ? (step > 0 ? items[0] : items[items.length - 1]) : items[(i + step + items.length) % items.length]
  next.focus()
  return true
}
