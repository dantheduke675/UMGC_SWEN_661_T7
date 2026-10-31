import '@testing-library/jest-dom/vitest'
import { cleanup, configure } from '@testing-library/react'
import { afterEach, beforeEach, expect, vi } from 'vitest'

// Allow lazy imports, React commits and axe scans time on slower hosts.
// This is a deadline, not an unconditional delay: successful queries return immediately.
configure({ asyncUtilTimeout: 10_000 })

// jsdom does not implement scrolling; the Scroll up / Scroll down buttons call scrollBy
Element.prototype.scrollBy = vi.fn()

/*
  With css: false no stylesheet loads, so jsdom reports every element's
  font-family as "depends on user agent". axe-core draws text on a canvas
  with that font and node-canvas prints "couldn't load font" for each one.
  A real generic family keeps the output clean; it is re-added before each
  test in case a test replaced <head>.
*/
function ensureTestFont() {
  if (document.getElementById('test-font')) return
  const style = document.createElement('style')
  style.id = 'test-font'
  style.textContent = '* { font-family: sans-serif; }'
  document.head.appendChild(style)
}

/*
  No console errors or warnings: any console.error / console.warn during a
  test (React key warnings, act() warnings, failed prop types, crashes caught
  by React...) fails that test. jsdom's own "Not implemented" notices for
  canvas, which axe-core probes, are not from the app and are ignored.
*/
const JSDOM_GAPS = /Not implemented: HTMLCanvasElement/
let consoleProblems: string[] = []

beforeEach(() => {
  ensureTestFont()
  consoleProblems = []
  for (const level of ['error', 'warn'] as const) {
    vi.spyOn(console, level).mockImplementation((...args: unknown[]) => {
      const msg = args.map(a => (a instanceof Error ? a.message : String(a))).join(' ')
      if (!JSDOM_GAPS.test(msg)) consoleProblems.push(`console.${level}: ${msg}`)
    })
  }
})

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.focusIndicator
  document.documentElement.style.removeProperty('--zoom')
  vi.useRealTimers()
  vi.restoreAllMocks()
  // fakeBiometrics() in utils.tsx
  vi.unstubAllGlobals()
  delete (navigator as { credentials?: unknown }).credentials
  expect(consoleProblems, 'console errors / warnings during the test').toEqual([])
})
