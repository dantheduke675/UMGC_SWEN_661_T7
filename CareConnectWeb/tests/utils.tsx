import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import axe from 'axe-core'
import { createMemoryRouter, RouterProvider } from 'react-router'
import { vi } from 'vitest'
import { AppStateProvider } from '../src/AppState'
import { routes } from '../src/router'

/*
  Renders the whole app (same routes as the browser build) at a given page.
  jsdom loads no CSS, so the phone, tablet and desktop parts of the shell are
  all in the DOM at once; tests pick the one they mean with within().
*/
export function renderApp(path = '/') {
  const router = createMemoryRouter(routes, { initialEntries: [path] })
  // Lets user-event's small delays run when a test fakes the clock
  const user = userEvent.setup({ advanceTimers: ms => (vi.isFakeTimers() ? vi.advanceTimersByTime(ms) : undefined) })
  const view = render(
    <AppStateProvider>
      <RouterProvider router={router} />
    </AppStateProvider>,
  )
  return { ...view, user, router, currentPath: () => router.state.location.pathname }
}

// A fixed clock: Tuesday 20 October 2026, 9:00 AM. Only Date is faked, so
// timers and promises keep working normally.
export function freezeClock(date = new Date(2026, 9, 20, 9, 0)) {
  vi.useFakeTimers({ toFake: ['Date'] })
  vi.setSystemTime(date)
}

// Parts of the signed-in shell
export const sidebar = () => screen.getByRole('complementary', { name: 'Sidebar' })
export const tabBar = () => screen.getByRole('navigation', { name: 'Tab bar' })
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
