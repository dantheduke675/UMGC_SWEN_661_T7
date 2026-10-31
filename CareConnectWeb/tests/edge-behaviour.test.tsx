import { screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { signInWithBiometrics } from '../src/biometrics'
import { moveFocusWithArrow } from '../src/focus'
import { installApp } from '../src/install'
import { matchShortcut } from '../src/shortcuts'
import { fakeBiometrics, findDialog, renderApp, sidebar, statusMessages } from './utils'

const html = document.documentElement
const ctrl = (key: string) => `{Control>}${key}{/Control}`

describe('Biometric results the device can give', () => {
  const signal = () => new AbortController().signal

  it('fails, and saves nothing, when the device returns something other than a passkey', async () => {
    const device = fakeBiometrics()
    device.create.mockResolvedValueOnce(null)
    expect(await signInWithBiometrics(signal(), { setUp: true })).toBe('failed')
    expect(localStorage.getItem('cc.passkey')).toBeNull()
  })

  it('treats a timeout or a dismissed prompt as cancelled, so Try again is offered', async () => {
    const device = fakeBiometrics()
    device.create.mockRejectedValueOnce(new DOMException('Closed', 'AbortError'))
    expect(await signInWithBiometrics(signal())).toBe('cancelled')
  })

  it.each([
    ['a security error', new DOMException('Not allowed on this origin', 'SecurityError')],
    ['an unexpected error', new TypeError('Bad options')],
  ])('fails on %s', async (_, error) => {
    const device = fakeBiometrics()
    device.create.mockRejectedValueOnce(error)
    expect(await signInWithBiometrics(signal())).toBe('failed')
  })
})

describe('Arrow-key focus movement', () => {
  afterEach(() => document.body.replaceChildren())
  const arrow = (key: string) => new KeyboardEvent('keydown', { key })

  it.each([
    ['a text area', () => document.createElement('textarea')],
    ['a drop-down', () => document.createElement('select')],
    ['editable text', () => Object.assign(document.createElement('div'), { contentEditable: 'true', tabIndex: 0 })],
  ])('leaves the arrow keys to %s', (_, make) => {
    const field = make()
    document.body.append(field, Object.assign(document.createElement('button'), { textContent: 'Next' }))
    // jsdom has no isContentEditable; a browser reports it for contentEditable="true"
    if (field.contentEditable === 'true') Object.defineProperty(field, 'isContentEditable', { value: true })
    field.focus()
    for (const key of ['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight']) {
      expect(moveFocusWithArrow(arrow(key))).toBe(false)
      expect(field).toHaveFocus()
    }
  })

  it('with nothing focused, Down and Right go to the first control, Up and Left to the last', () => {
    const [first, , last] = ['First', 'Middle', 'Last'].map(name => {
      const b = document.createElement('button')
      b.textContent = name
      document.body.append(b)
      return b
    })
    for (const [key, expected] of [['ArrowDown', first], ['ArrowRight', first], ['ArrowUp', last], ['ArrowLeft', last]] as const) {
      ;(document.activeElement as HTMLElement | null)?.blur()
      expect(moveFocusWithArrow(arrow(key))).toBe(true)
      expect(expected).toHaveFocus()
    }
  })
})

describe('Installing the app', () => {
  it('does nothing, and says so, when the browser offers no install', async () => {
    expect(await installApp()).toBe(false)
  })
})

describe('Keyboard shortcuts on other keyboard layouts', () => {
  const press = (key: string, shiftKey = false) => new KeyboardEvent('keydown', { key, ctrlKey: true, shiftKey })

  it('zooms out with Ctrl + _ (Shift + minus), as with Ctrl + -', () => {
    expect(matchShortcut(press('_', true))).toBe('zoom-out')
    expect(matchShortcut(press('-'))).toBe('zoom-out')
  })
})

describe('Shell controls in the light theme and on phones', () => {
  it('Ctrl + L from the light theme switches to dark and says so', async () => {
    localStorage.setItem('cc.theme', 'light')
    const { user } = await renderApp('/today.html')
    expect(html.dataset.theme).toBe('light')
    await user.keyboard(ctrl('l'))
    expect(html.dataset.theme).toBe('dark')
    expect(statusMessages().getByText('Dark mode on')).toBeInTheDocument()
  })

  it('the collapsed sidebar names the theme button after the theme it switches to', async () => {
    localStorage.setItem('cc.theme', 'light')
    const { user } = await renderApp('/today.html')
    const themeButton = () => within(sidebar()).getByRole('button', { name: 'Dark theme' })
    // Expanded, the label is shown, so there's no tooltip
    expect(themeButton()).not.toHaveAttribute('title')
    await user.click(screen.getByRole('button', { name: 'Close menu' }))
    // Collapsed to icons: the tooltip says what it does
    expect(themeButton()).toHaveAttribute('title', 'Use dark theme')
  })

  it('the Voice button in the bottom bar opens voice commands', async () => {
    const { user } = await renderApp('/today.html')
    const bar = screen.getByRole('region', { name: 'Scroll and voice controls' })
    await user.click(within(bar).getByRole('button', { name: 'Voice commands' }))
    expect(await findDialog('Voice commands')).toBeInTheDocument()
  })

  it('Ctrl + R reloads the page', async () => {
    const reload = vi.fn()
    vi.stubGlobal('location', { ...window.location, reload })
    try {
      const { user } = await renderApp('/today.html')
      await user.keyboard(ctrl('r'))
      expect(reload).toHaveBeenCalledOnce()
    } finally {
      vi.unstubAllGlobals()
    }
  })
})

describe('Face ID failure while setting up', () => {
  it('offers to continue without Face ID (rather than "use your password")', async () => {
    const device = fakeBiometrics()
    device.create.mockRejectedValueOnce(new DOMException('Not allowed', 'NotAllowedError'))
    const { user, currentPath } = await renderApp('/create-account.html')
    await user.click(screen.getByRole('button', { name: 'Caregiver' }))
    await user.click(screen.getByRole('button', { name: 'Yes, use Face ID' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'That did not work' })).toBeInTheDocument()
    expect(screen.getByText(/try again, or continue without Face ID\./)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue without Face ID' }))
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
  })
})
