import { act, render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { expect, vi } from 'vitest'
import { AppStateProvider } from '../src/AppState'
import { routes } from '../src/router'

/*
  Renders the whole app (same routes as the browser build) at a given page.
  jsdom loads no CSS, so the phone, tablet and desktop parts of the shell are
  all in the DOM at once; tests pick the one they mean with within().
*/
export async function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  // Lets user-event's small delays run when a test fakes the clock
  const user = userEvent.setup({ advanceTimers: ms => (vi.isFakeTimers() ? vi.advanceTimersByTime(ms) : undefined) })
  const view = render(
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>,
  )
  // Pages are lazy-loaded chunks: wait until the first one is on screen
  await waitFor(() => {
    expect(router.state.initialized).toBe(true)
    expect(screen.queryByText('Loading CareConnect…')).toBeNull()
  })
  return { ...view, user, router, currentPath: () => router.state.location.pathname }
}

/*
  The voice panel, call screen and action history are lazy-loaded. Waits until
  the dialog is on screen and its effects (focus trap, Escape key) are running,
  as they are by the time a person could press a key.
*/
export async function findDialog(name: string) {
  const dialog = await screen.findByRole('dialog', { name })
  await act(async () => {})
  return dialog
}

/*
  jsdom does no layout: every element is a 0×0 box at the top left. Gives an
  element the box a browser would, for code that measures the page (arrow-key
  focus movement).
*/
export function placeAt(el: HTMLElement, left: number, top: number, width = 200, height = 40) {
  const box = { left, top, width, height, right: left + width, bottom: top + height, x: left, y: top }
  vi.spyOn(el, 'getBoundingClientRect').mockReturnValue({ ...box, toJSON: () => box })
}

/*
  jsdom has no WebAuthn. Stands in for the device's biometric check (Windows
  Hello, Touch ID, fingerprint): whether the device has one, and fake
  navigator.credentials.create / get to set per test. Undone after each test
  (tests/setup.ts).
*/
export function fakeBiometrics(available = true) {
  class FakePasskey {
    rawId = new Uint8Array([1, 2, 3]).buffer
    static isUserVerifyingPlatformAuthenticatorAvailable = () => Promise.resolve(available)
  }
  vi.stubGlobal('PublicKeyCredential', FakePasskey)
  const credentials = {
    create: vi.fn((_options: CredentialCreationOptions): Promise<unknown> => Promise.resolve(new FakePasskey())),
    get: vi.fn((_options: CredentialRequestOptions): Promise<unknown> => Promise.resolve(new FakePasskey())),
  }
  Object.defineProperty(navigator, 'credentials', { value: credentials, configurable: true })
  return credentials
}

// A fixed clock: Tuesday 20 October 2026, 9:00 AM. Only Date is faked, so
// timers and promises keep working normally.
export function freezeClock(date = new Date(2026, 9, 20, 9, 0)) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(date)
}

// Parts of the signed-in shell
export const sidebar = () => screen.getByRole('complementary', { name: 'Sidebar' })
export const progress = () => screen.getByRole('progressbar', { name: 'Medications taken today' })

export const statusMessages = () => within(screen.getByRole('status'))

export type Viewport = 'phone' | 'tablet' | 'desktop'
export const VIEWPORTS: Viewport[] = ['phone', 'tablet', 'desktop']

/*
  jsdom loads no CSS, so every responsive part is "visible" at once. This
  applies the Tailwind visibility classes the app uses (hidden, md:flex,
  md:hidden, lg:hidden, max-lg:hidden, lg:inline ...) for one device size,
  so axe sees what a browser at that width would show.
*/
export function simulateViewport(size: Viewport) {
  const md = size !== 'phone'
  const lg = size === 'desktop'
  // Same precedence as the stylesheet: base, then max-* ranges, then md, then lg
  const layers = ['', ...(md ? [] : ['max-md']), ...(lg ? [] : ['max-lg']), ...(md ? ['md'] : []), ...(lg ? ['lg'] : [])]
  const shows = /^(flex|block|grid|inline|inline-flex)$/

  for (const el of document.querySelectorAll<HTMLElement>('[class]')) {
    let visible = true
    for (const layer of layers) {
      for (const cls of el.classList) {
        const [prefix, value] = cls.includes(':') ? cls.split(':') : ['', cls]
        if (prefix !== layer) continue
        if (value === 'hidden') visible = false
        else if (shows.test(value)) visible = true
      }
    }
    el.style.display = visible ? '' : 'none'
  }
}

/*
  Runs axe-core against the rendered page at one device size and returns
  readable violations. Colour contrast is checked separately in a real
  browser: jsdom cannot compute rendered colours.
*/
export async function axeViolations(size: Viewport = 'desktop', node: Element = document.body) {
  simulateViewport(size)
  const results = await axe.run(node, {
    runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa', 'best-practice'] },
    rules: { 'color-contrast': { enabled: false } },
  })
  return results.violations.map(v => `${v.id} (${v.impact}): ${v.help} → ${v.nodes.map(n => n.target.join(' ')).join(', ')}`)
}
