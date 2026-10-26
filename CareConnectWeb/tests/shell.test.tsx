import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { findDialog, renderApp, sidebar, statusMessages } from './utils'

describe('App shell: navigation', () => {
  it.each([
    ['/today.html', 'Today'],
    ['/medications.html', 'Medications'],
    ['/messages.html', 'Messages'],
    ['/schedule.html', 'Schedule'],
    ['/symptoms.html', 'Symptoms'],
    ['/account.html', 'Account'],
  ])('shows %s with its title and marks it current', async (path, label) => {
    await renderApp(path)
    expect(screen.getByRole('heading', { level: 1, name: label })).toBeInTheDocument()
    expect(within(sidebar()).getByRole('link', { name: new RegExp(`^${label}`) })).toHaveAttribute('aria-current', 'page')
  })

  it('moves between pages with the sidebar', async () => {
    const { user, currentPath } = await renderApp('/today.html')
    await user.click(within(sidebar()).getByRole('link', { name: 'Schedule' }))
    await waitFor(() => expect(currentPath()).toBe('/schedule.html'))
    await user.click(within(sidebar()).getByRole('link', { name: 'Medications' }))
    await waitFor(() => expect(currentPath()).toBe('/medications.html'))
  })

  it('links every nav item to its HTML page', async () => {
    await renderApp('/today.html')
    const hrefs = within(sidebar()).getAllByRole('link').map(a => a.getAttribute('href'))
    expect(hrefs).toEqual(['/today.html', '/medications.html', '/messages.html', '/schedule.html', '/symptoms.html', '/account.html'])
  })

  it('shows the unread count on Messages until the conversation is opened', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(within(sidebar()).getByRole('link', { name: 'Messages, 1 unread' }))
    await user.click(await screen.findByRole('button', { name: /^Aunt Joyce/ }))
    expect(within(sidebar()).getByRole('link', { name: 'Messages' })).toBeInTheDocument()
  })

  it('shows "Page not found" for an unknown page, with a way back', async () => {
    const { user, currentPath } = await renderApp('/nope.html')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Go to start' }))
    await waitFor(() => expect(currentPath()).toBe('/'))
  })
})

// Phones start with the sidebar collapsed to an icon rail (jsdom has no matchMedia, so fake it)
function fakePhone() {
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: true, media: query, addEventListener: vi.fn(), removeEventListener: vi.fn() }))
}

describe('App shell: phone sidebar', () => {
  afterEach(() => vi.unstubAllGlobals())

  it('starts as a rail, expands, and closes after picking a page', async () => {
    fakePhone()
    const { user, currentPath } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.click(within(sidebar()).getByRole('link', { name: 'Symptoms' }))
    await waitFor(() => expect(currentPath()).toBe('/symptoms.html'))
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('closes with Escape', async () => {
    fakePhone()
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    await user.keyboard('{Escape}')
    expect(screen.getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
  })
})

describe('App shell: tablet sidebar', () => {
  it('collapses and expands', async () => {
    const { user } = await renderApp('/today.html')
    const toggle = screen.getByRole('button', { name: 'Close menu' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Open menu' })).toHaveAttribute('aria-expanded', 'false')
    // Labels stay available to screen readers and as tooltips
    expect(within(sidebar()).getByRole('link', { name: 'Medications' })).toHaveAttribute('title', 'Medications')
    await user.click(screen.getByRole('button', { name: 'Open menu' }))
    expect(screen.getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
  })
})

describe('App shell: theme and account', () => {
  it('starts dark and switches to light from the sidebar', async () => {
    const { user } = await renderApp('/today.html')
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(within(sidebar()).getByRole('button', { name: 'Light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('cc.theme')).toBe('light')
  })

  it('restores a saved light theme', async () => {
    localStorage.setItem('cc.theme', 'light')
    await renderApp('/today.html')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('opens the profile menu, switches theme from it and closes with Escape', async () => {
    const { user } = await renderApp('/today.html')
    const profile = screen.getByRole('button', { name: 'Maddy, account menu' })
    await user.click(profile)
    expect(profile).toHaveAttribute('aria-expanded', 'true')
    const menu = screen.getByRole('menu')
    await user.click(within(menu).getByRole('menuitem', { name: 'Use light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()

    await user.click(profile)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('signs out from the sidebar to the landing page', async () => {
    const { user, currentPath } = await renderApp('/today.html')
    await user.click(within(sidebar()).getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(currentPath()).toBe('/'))
    expect(screen.getByRole('heading', { level: 1, name: /Stay on track/ })).toBeInTheDocument()
  })

  it('signs out from the profile menu', async () => {
    const { user, currentPath } = await renderApp('/schedule.html')
    await user.click(screen.getByRole('button', { name: 'Maddy, account menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    await waitFor(() => expect(currentPath()).toBe('/'))
    expect(screen.getByRole('heading', { level: 1, name: /Stay on track/ })).toBeInTheDocument()
  })
})

describe('App shell: SOS and quick actions', () => {
  it('asks before calling the emergency contact, and Cancel closes', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'SOS, call emergency contact' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Call Aunt Joyce, your emergency contact?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel — go back' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(statusMessages().queryByText(/Calling/)).not.toBeInTheDocument()
  })

  it('opens the call screen after confirming (demo only)', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'SOS, call emergency contact' }))
    await user.click(screen.getByRole('button', { name: 'Call Aunt Joyce' }))
    const call = await findDialog('Aunt Joyce')
    await user.click(within(call).getByRole('button', { name: 'End call' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(statusMessages().getByText(/^Call with Aunt Joyce ended · 00:0\d \(demo — no call was placed\)$/)).toBeInTheDocument()
  })

  it('closes the SOS dialog with Escape', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'SOS, call emergency contact' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it('switches (simulated) eye tracking on and off', async () => {
    const { user } = await renderApp('/today.html')
    const eye = screen.getByRole('button', { name: 'Eye tracking' })
    expect(eye).toHaveAttribute('aria-pressed', 'false')
    await user.click(eye)
    expect(eye).toHaveAttribute('aria-pressed', 'true')
    expect(statusMessages().getByText('Eye tracking on (simulated, no camera is used)')).toBeInTheDocument()
    await user.click(eye)
    expect(eye).toHaveAttribute('aria-pressed', 'false')
  })

  it('opens the help guide and closes it with Got it or Escape', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Help' }))
    expect(screen.getByRole('button', { name: 'Got it' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Got it' }))
    expect(screen.queryByRole('dialog', { name: 'Help' })).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Help' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Help' })).not.toBeInTheDocument()
  })

  it('opens the Account page from the profile menu', async () => {
    const { user, currentPath } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Maddy, account menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Account' }))
    await waitFor(() => expect(currentPath()).toBe('/account.html'))
  })
})

describe('App shell: scroll and voice controls', () => {
  it('scrolls the page with the large Scroll up / Scroll down buttons', async () => {
    const { user } = await renderApp('/medications.html')
    const scrollBy = vi.mocked(Element.prototype.scrollBy)
    scrollBy.mockClear()
    await user.click(screen.getByRole('button', { name: /Scroll down/ }))
    expect(scrollBy).toHaveBeenLastCalledWith({ top: 220, behavior: 'smooth' })
    await user.click(screen.getByRole('button', { name: /Scroll up/ }))
    expect(scrollBy).toHaveBeenLastCalledWith({ top: -220, behavior: 'smooth' })
  })

  it.each([
    ['Go to medications', '/medications.html'],
    ['Open schedule', '/schedule.html'],
    ['Go home', '/today.html'],
    ['Open messages', '/messages.html'],
    ['Log a symptom', '/symptoms.html'],
  ])('voice command "%s" opens %s', async (command, path) => {
    // Start somewhere else so the command has to move
    const { user, currentPath } = await renderApp(path === '/today.html' ? '/schedule.html' : '/today.html')
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    const modal = await findDialog('Voice commands')
    await user.click(within(modal).getByRole('button', { name: command }))
    await waitFor(() => expect(currentPath()).toBe(path))
    expect(screen.queryByRole('dialog', { name: 'Voice commands' })).not.toBeInTheDocument()
  })

  it('closes the voice panel with Cancel or Escape', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Voice commands' })).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Voice commands' })).not.toBeInTheDocument()
  })
})
