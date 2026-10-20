import { screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { renderApp, sidebar, statusMessages, tabBar } from './utils'

describe('App shell: navigation', () => {
  it.each([
    ['/today.html', 'Today'],
    ['/medications.html', 'Medications'],
    ['/schedule.html', 'Schedule'],
  ])('shows %s with its title and marks it current', (path, label) => {
    renderApp(path)
    // Top bar title (tablet/desktop) and the phone header's screen-reader title
    expect(screen.getAllByRole('heading', { level: 1, name: label })).toHaveLength(2)
    expect(within(sidebar()).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
    expect(within(tabBar()).getByRole('link', { name: label })).toHaveAttribute('aria-current', 'page')
  })

  it('moves between pages with the sidebar', async () => {
    const { user, currentPath } = renderApp('/today.html')
    await user.click(within(sidebar()).getByRole('link', { name: 'Schedule' }))
    expect(currentPath()).toBe('/schedule.html')
    await user.click(within(sidebar()).getByRole('link', { name: 'Medications' }))
    expect(currentPath()).toBe('/medications.html')
  })

  it('moves between pages with the phone tab bar', async () => {
    const { user, currentPath } = renderApp('/today.html')
    await user.click(within(tabBar()).getByRole('link', { name: 'Schedule' }))
    expect(currentPath()).toBe('/schedule.html')
  })

  it('links every nav item to its HTML page', () => {
    renderApp('/today.html')
    const hrefs = within(sidebar()).getAllByRole('link').map(a => a.getAttribute('href'))
    expect(hrefs).toEqual(['/today.html', '/medications.html', '/schedule.html'])
  })

  it('opens the full plan (schedule) from the phone header', async () => {
    const { user, currentPath } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Full Plan' }))
    expect(currentPath()).toBe('/schedule.html')
  })

  it('shows "Page not found" for an unknown page, with a way back', async () => {
    const { user, currentPath } = renderApp('/nope.html')
    expect(screen.getByRole('heading', { name: 'Page not found' })).toBeInTheDocument()
    await user.click(screen.getByRole('link', { name: 'Go to start' }))
    expect(currentPath()).toBe('/')
  })
})

describe('App shell: phone menu drawer', () => {
  it('opens, navigates and closes', async () => {
    const { user, currentPath } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Navigation menu' })
    await user.click(within(drawer).getByRole('link', { name: 'Medications' }))
    expect(currentPath()).toBe('/medications.html')
    expect(screen.queryByRole('dialog', { name: 'Navigation menu' })).not.toBeInTheDocument()
  })

  it('closes with Escape and with the × button', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Navigation menu' })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Open navigation menu' }))
    const drawer = screen.getByRole('dialog', { name: 'Navigation menu' })
    const close = within(drawer).getAllByRole('button', { name: 'Close navigation menu' }).find(b => b.textContent === '×')!
    expect(close).toHaveFocus()
    await user.click(close)
    expect(screen.queryByRole('dialog', { name: 'Navigation menu' })).not.toBeInTheDocument()
  })
})

describe('App shell: tablet sidebar', () => {
  it('collapses and expands', async () => {
    const { user } = renderApp('/today.html')
    const toggle = screen.getByRole('button', { name: 'Collapse sidebar' })
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    await user.click(toggle)
    expect(screen.getByRole('button', { name: 'Expand sidebar' })).toHaveAttribute('aria-expanded', 'false')
    // Labels stay available to screen readers and as tooltips
    expect(within(sidebar()).getByRole('link', { name: 'Medications' })).toHaveAttribute('title', 'Medications')
    await user.click(screen.getByRole('button', { name: 'Expand sidebar' }))
    expect(screen.getByRole('button', { name: 'Collapse sidebar' })).toBeInTheDocument()
  })
})

describe('App shell: theme and account', () => {
  it('starts dark and switches to light from the sidebar', async () => {
    const { user } = renderApp('/today.html')
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(within(sidebar()).getByRole('button', { name: 'Light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('cc.theme')).toBe('light')
  })

  it('restores a saved light theme', () => {
    localStorage.setItem('cc.theme', 'light')
    renderApp('/today.html')
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('switches theme from the phone header', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
  })

  it('opens the profile menu, switches theme from it and closes with Escape', async () => {
    const { user } = renderApp('/today.html')
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

  it('signs out from the sidebar', async () => {
    const { user, currentPath } = renderApp('/today.html')
    await user.click(within(sidebar()).getByRole('button', { name: 'Sign out' }))
    expect(currentPath()).toBe('/')
  })

  it('signs out from the profile menu', async () => {
    const { user, currentPath } = renderApp('/schedule.html')
    await user.click(screen.getByRole('button', { name: 'Maddy, account menu' }))
    await user.click(screen.getByRole('menuitem', { name: 'Sign out' }))
    expect(currentPath()).toBe('/')
  })
})

describe('App shell: SOS and quick actions', () => {
  it('asks before calling the emergency contact, and Cancel closes', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'SOS, call emergency contact' }))
    const dialog = screen.getByRole('alertdialog', { name: 'Call Aunt Joyce, your emergency contact?' })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel — go back' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(statusMessages().queryByText(/Calling/)).not.toBeInTheDocument()
  })

  it('"calls" after confirming (demo message only)', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Call emergency contact' }))
    await user.click(screen.getByRole('button', { name: 'Call Aunt Joyce' }))
    expect(statusMessages().getByText('Calling Aunt Joyce… (demo — no call is placed)')).toBeInTheDocument()
  })

  it('closes the SOS dialog with Escape', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'SOS, call emergency contact' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
  })

  it.each([
    ['Alerts', 'All caught up — no new alerts'],
    ['Video', 'Video calls are coming soon'],
    ['Eye tracking (coming soon)', 'Eye tracking is coming soon'],
  ])('shows a message for %s', async (button, message) => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: button }))
    expect(statusMessages().getByText(message)).toBeInTheDocument()
  })
})

describe('App shell: scroll and voice controls', () => {
  it('scrolls the page with the large Scroll up / Scroll down buttons', async () => {
    const { user } = renderApp('/medications.html')
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
  ])('voice command "%s" opens %s', async (command, path) => {
    // Start somewhere else so the command has to move
    const { user, currentPath } = renderApp(path === '/today.html' ? '/schedule.html' : '/today.html')
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    const modal = screen.getByRole('dialog', { name: 'Voice commands' })
    await user.click(within(modal).getByRole('button', { name: command }))
    expect(currentPath()).toBe(path)
    expect(screen.queryByRole('dialog', { name: 'Voice commands' })).not.toBeInTheDocument()
  })

  it('closes the voice panel with Cancel or Escape', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog', { name: 'Voice commands' })).not.toBeInTheDocument()
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Voice commands' })).not.toBeInTheDocument()
  })
})
