import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { matchShortcut } from '../src/shortcuts'
import { focusFirstError } from '../src/validation'
import { findDialog, renderApp, sidebar, statusMessages } from './utils'

// Keep a stable query object like the browser so responsive subscriptions see
// changes without remounting the application or substituting its hooks.
function phoneViewport() {
  let matches = false
  const listeners = new Set<() => void>()
  const mq = { get matches() { return matches }, addEventListener: (_: string, cb: () => void) => listeners.add(cb), removeEventListener: (_: string, cb: () => void) => listeners.delete(cb) }
  vi.stubGlobal('matchMedia', () => mq)
  return (phone: boolean) => act(() => { matches = phone; listeners.forEach(cb => cb()) })
}

describe('Responsive shell and remaining actions', () => {
  it('collapses when crossing into phone width and closes the expanded rail on navigation and Escape', async () => {
    const setPhone = phoneViewport()
    const { user, currentPath } = await renderApp('/today.html')
    expect(within(sidebar()).getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
    setPhone(true)
    await user.click(within(sidebar()).getByRole('button', { name: 'Open menu' }))
    await user.click(within(sidebar()).getByRole('link', { name: /Medications/ }))
    await waitFor(() => expect(currentPath()).toBe('/medications.html'))
    expect(within(sidebar()).getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
    await user.click(within(sidebar()).getByRole('button', { name: 'Open menu' }))
    await user.keyboard('{Escape}')
    expect(within(sidebar()).getByRole('button', { name: 'Open menu' })).toBeInTheDocument()
    setPhone(false)
    expect(within(sidebar()).getByRole('button', { name: 'Close menu' })).toBeInTheDocument()
  })

  it.each([['Scroll down', 220], ['Scroll up', -220]] as const)('voice command %s scrolls the main region', async (command, top) => {
    const { user } = await renderApp('/today.html')
    const scrollBy = vi.mocked(Element.prototype.scrollBy)
    scrollBy.mockClear()
    await user.click(screen.getAllByRole('button', { name: 'Voice commands' })[0])
    const dialog = await findDialog('Voice commands')
    await user.click(within(dialog).getByRole('button', { name: command }))
    expect(scrollBy).toHaveBeenCalledExactlyOnceWith({ top, behavior: 'smooth' })
    expect(screen.queryByRole('dialog', { name: 'Voice commands' })).not.toBeInTheDocument()
  })

  it('explains voice and SOS shortcuts on public pages', async () => {
    const { user } = await renderApp('/signin.html')
    await user.keyboard('{Control>}\\{/Control}')
    expect(statusMessages().getByText('Sign in to use voice commands')).toBeInTheDocument()
    await user.keyboard('{Control>}s{/Control}')
    expect(statusMessages().getByText('Sign in to use the emergency call')).toBeInTheDocument()
  })

  it('toggles Face ID off and on with the global shortcut', async () => {
    const { user } = await renderApp('/account.html')
    await user.keyboard('{Control>}f{/Control}')
    expect(screen.getByRole('switch', { name: /Biometrics/ })).toHaveAttribute('aria-checked', 'false')
    expect(statusMessages().getByText('Face ID off')).toBeInTheDocument()
    await user.keyboard('{Control>}f{/Control}')
    expect(screen.getByRole('switch', { name: /Biometrics/ })).toHaveAttribute('aria-checked', 'true')
    expect(statusMessages().getByText('Face ID on')).toBeInTheDocument()
  })

  it('supports emergency-contact feedback, mouse lock, eye tracking and account history', async () => {
    const { user } = await renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /Emergency contact/ }))
    expect(statusMessages().getByText('Editing contacts is coming soon')).toBeInTheDocument()
    for (const name of [/^Mouse lock/, /^Eye tracking/]) {
      const toggle = screen.getByRole('switch', { name })
      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-checked', 'true')
      await user.click(toggle)
      expect(toggle).toHaveAttribute('aria-checked', 'false')
    }
    await user.click(screen.getByRole('button', { name: /See and undo what you have done/ }))
    expect(await findDialog('Action history')).toBeInTheDocument()
  })
})

describe('Validation and shortcut boundaries', () => {
  it('does not steal focus when errors are empty or refer to a missing field', () => {
    const form = document.createElement('form')
    form.innerHTML = '<input name="email" />'
    document.body.append(form)
    const input = form.elements.namedItem('email') as HTMLInputElement
    input.focus()
    focusFirstError(form, {})
    expect(input).toHaveFocus()
    focusFirstError(form, { missing: 'Invalid' })
    expect(input).toHaveFocus()
    form.remove()
  })

  it('ignores unknown Ctrl shortcuts and already-handled keyboard events', async () => {
    expect(matchShortcut(new KeyboardEvent('keydown', { key: 'q', ctrlKey: true }))).toBeNull()
    await renderApp('/today.html')
    const event = new KeyboardEvent('keydown', { key: 'l', ctrlKey: true, bubbles: true, cancelable: true })
    event.preventDefault()
    fireEvent(window, event)
    expect(document.documentElement.dataset.theme).toBe('dark')
  })
})
