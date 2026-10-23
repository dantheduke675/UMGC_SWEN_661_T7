import '@testing-library/jest-dom/vitest'
import { cleanup } from '@testing-library/react'
import { afterEach, vi } from 'vitest'

// jsdom does not implement scrolling; the Scroll up / Scroll down buttons call scrollBy
Element.prototype.scrollBy = vi.fn()

afterEach(() => {
  cleanup()
  localStorage.clear()
  delete document.documentElement.dataset.theme
  delete document.documentElement.dataset.focusIndicator
  document.documentElement.style.removeProperty('--zoom')
  vi.useRealTimers()
})
