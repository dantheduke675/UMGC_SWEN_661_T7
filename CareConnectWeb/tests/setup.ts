import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, beforeEach, expect, vi } from 'vitest'

// jsdom does not implement scrolling; the Scroll up / Scroll down buttons call scrollBy
Element.prototype.scrollBy = vi.fn()

/*
  No console errors or warnings: any console.error / console.warn during a
  test (React key warnings, act() warnings, failed prop types, crashes caught
  by React...) fails that test. jsdom's own "Not implemented" notices for
  canvas, which axe-core probes, are not from the app and are ignored.
*/
const JSDOM_GAPS = /Not implemented: HTMLCanvasElement/
let consoleProblems: string[] = []

beforeEach(() => {
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
  expect(consoleProblems, 'console errors / warnings during the test').toEqual([])
})
