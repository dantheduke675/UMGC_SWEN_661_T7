import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp, statusMessages } from './utils'

/*
  Stands in for the browser: Chrome and Edge fire beforeinstallprompt once the
  app can be installed. src/install.ts keeps its state for the whole file, so
  these tests run in order: not available, available, installed.
*/
function offerInstall(outcome: 'accepted' | 'dismissed') {
  const event = Object.assign(new Event('beforeinstallprompt', { cancelable: true }), {
    prompt: vi.fn(() => Promise.resolve()),
    userChoice: Promise.resolve({ outcome }),
  })
  act(() => void window.dispatchEvent(event))
  return event
}

describe('Install the app', () => {
  it("points to the browser's own menu where it cannot offer an Install button", async () => {
    const { unmount } = await renderApp('/account.html')
    expect(screen.getByText("From your browser's menu (Safari: Share › Add to Home Screen)")).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /Install CareConnect/ })).not.toBeInTheDocument()
    unmount()

    await renderApp('/')
    expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument()
  })

  it('offers Install app on the landing page and opens the browser dialog', async () => {
    const { user } = await renderApp('/')
    const event = offerInstall('dismissed')
    // Our button replaces the browser's own install banner
    expect(event.defaultPrevented).toBe(true)

    await user.click(await screen.findByRole('button', { name: 'Install app' }))
    expect(event.prompt).toHaveBeenCalledOnce()
    // The dialog can be shown only once per event
    await waitFor(() => expect(screen.queryByRole('button', { name: 'Install app' })).not.toBeInTheDocument())
  })

  it('installs from the Account page and then shows it as installed', async () => {
    const { user } = await renderApp('/account.html')
    const event = offerInstall('accepted')
    await user.click(await screen.findByRole('button', { name: /Install CareConnect/ }))
    expect(event.prompt).toHaveBeenCalledOnce()
    await waitFor(() => expect(statusMessages().getByText('Installing CareConnect…')).toBeInTheDocument())

    act(() => void window.dispatchEvent(new Event('appinstalled')))
    expect(await screen.findByText('Installed on this device')).toBeInTheDocument()
  })
})
