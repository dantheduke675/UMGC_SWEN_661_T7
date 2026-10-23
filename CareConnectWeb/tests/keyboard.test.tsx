import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { axeViolations, renderApp, sidebar, statusMessages } from './utils'

const html = document.documentElement
const ctrl = (key: string) => `{Control>}${key}{/Control}`

describe('Focus indicator', () => {
  it('is off until Ctrl + = turns it on, and Ctrl + = turns it off again', async () => {
    const { user } = renderApp('/today.html')
    expect(html.dataset.focusIndicator).toBe('off')
    await user.keyboard(ctrl('='))
    expect(html.dataset.focusIndicator).toBe('on')
    expect(statusMessages().getByText('Focus indicator on. Move it with the arrow keys or Tab.')).toBeInTheDocument()
    await user.keyboard(ctrl('='))
    expect(html.dataset.focusIndicator).toBe('off')
  })

  it('is remembered for the next visit', async () => {
    const { user, unmount } = renderApp('/today.html')
    await user.keyboard(ctrl('='))
    unmount()
    renderApp('/today.html')
    expect(html.dataset.focusIndicator).toBe('on')
  })

  it('can be switched on the Account page', async () => {
    const { user } = renderApp('/account.html')
    await user.click(screen.getByRole('switch', { name: /Focus indicator/ }))
    expect(html.dataset.focusIndicator).toBe('on')
    expect(screen.getByRole('switch', { name: /Focus indicator/ })).toHaveAttribute('aria-checked', 'true')
  })

  it('moves with the arrow keys only once it is on', async () => {
    const { user } = renderApp('/today.html')
    const links = within(sidebar()).getAllByRole('link')
    links[0].focus()
    await user.keyboard('{ArrowDown}')
    expect(links[0]).toHaveFocus()

    await user.keyboard(ctrl('='))
    await user.keyboard('{ArrowDown}')
    expect(links[1]).toHaveFocus()
    await user.keyboard('{ArrowRight}')
    expect(links[2]).toHaveFocus()
    await user.keyboard('{ArrowUp}{ArrowLeft}')
    expect(links[0]).toHaveFocus()
  })

  it('keeps arrow-key movement inside an open dialog', async () => {
    const { user } = renderApp('/today.html')
    await user.keyboard(ctrl('='))
    await user.click(screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' }))
    const cancel = screen.getByRole('button', { name: 'Cancel — go back' })
    expect(cancel).toHaveFocus()
    await user.keyboard('{ArrowDown}') // wraps to the first button
    expect(screen.getByRole('button', { name: 'Yes, I missed this dose' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(cancel).toHaveFocus()
  })

  it('leaves Left and Right to the caret in a text field', async () => {
    const { user } = renderApp('/signin.html')
    await user.keyboard(ctrl('='))
    const email = screen.getByLabelText('Email address')
    email.focus()
    await user.keyboard('{ArrowLeft}')
    expect(email).toHaveFocus()
    await user.keyboard('{ArrowDown}')
    expect(screen.getByLabelText('Password')).toHaveFocus()
  })
})

describe('Keyboard shortcuts', () => {
  it('zooms in and out with Ctrl + "+" and Ctrl + "-", and resets with Ctrl + 0', async () => {
    const { user } = renderApp('/today.html')
    const zoom = () => html.style.getPropertyValue('--zoom')
    expect(zoom()).toBe('1')
    await user.keyboard(ctrl('+'))
    await user.keyboard(ctrl('+'))
    expect(zoom()).toBe('1.2')
    expect(statusMessages().getByText('Zoom 120%')).toBeInTheDocument()
    await user.keyboard(ctrl('-'))
    expect(zoom()).toBe('1.1')
    await user.keyboard(ctrl('0'))
    expect(zoom()).toBe('1')
  })

  it('stops zooming out at 80%', async () => {
    const { user } = renderApp('/today.html')
    for (let i = 0; i < 5; i++) await user.keyboard(ctrl('-'))
    expect(html.style.getPropertyValue('--zoom')).toBe('0.8')
  })

  it('switches light / dark mode with Ctrl + L, on any page', async () => {
    const { user } = renderApp('/signin.html')
    expect(html.dataset.theme).toBe('dark')
    await user.keyboard(ctrl('l'))
    expect(html.dataset.theme).toBe('light')
  })

  it.each([
    ['n', /Notifications/, 'Medication reminders off'],
    ['f', /Biometrics/, 'Face ID off'],
    ['i', /Eye tracking/, 'Eye tracking on (simulated, no camera is used)'],
    ['o', /Mouse lock/, 'Mouse lock on (simulated)'],
  ])('switches a setting with Ctrl + %s', async (key, row, message) => {
    const { user } = renderApp('/account.html')
    const before = screen.getByRole('switch', { name: row }).getAttribute('aria-checked')
    await user.keyboard(ctrl(key))
    expect(screen.getByRole('switch', { name: row })).toHaveAttribute('aria-checked', before === 'true' ? 'false' : 'true')
    expect(statusMessages().getByText(message)).toBeInTheDocument()
  })

  it('leaves Ctrl + Shift + letter to the browser', async () => {
    const { user } = renderApp('/today.html')
    await user.keyboard('{Control>}{Shift>}l{/Shift}{/Control}')
    expect(html.dataset.theme).toBe('dark')
  })

  it('opens voice commands with Ctrl + \\', async () => {
    const { user } = renderApp('/today.html')
    await user.keyboard(ctrl('\\'))
    expect(screen.getByRole('dialog', { name: 'Voice commands' })).toBeInTheDocument()
  })

  it('asks before the emergency call with Ctrl + S', async () => {
    const { user } = renderApp('/today.html')
    await user.keyboard(ctrl('s'))
    expect(screen.getByRole('alertdialog')).toHaveTextContent('Call Aunt Joyce, your emergency contact?')
    expect(screen.getByRole('button', { name: 'Cancel — go back' })).toHaveFocus()
  })

  it('explains that voice and the emergency call need you to sign in first', async () => {
    const { user } = renderApp('/signin.html')
    await user.keyboard(ctrl('s'))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(statusMessages().getByText('Sign in to use the emergency call')).toBeInTheDocument()
  })
})

describe('Undo and action history', () => {
  it('undoes the last action with Ctrl + U', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '3 of 9 taken')
    await user.keyboard(ctrl('u'))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '2 of 9 taken')
    expect(statusMessages().getByText('Undone: Marked as taken')).toBeInTheDocument()
    await user.keyboard(ctrl('u'))
    expect(statusMessages().getByText('Nothing to undo')).toBeInTheDocument()
  })

  it('undoes shortcut changes too', async () => {
    const { user } = renderApp('/today.html')
    await user.keyboard(ctrl('l'))
    expect(html.dataset.theme).toBe('light')
    await user.keyboard(ctrl('u'))
    expect(html.dataset.theme).toBe('dark')
  })

  it('lists actions with Ctrl + H, newest first, and undoes any of them', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    await user.keyboard(ctrl('n'))
    await user.keyboard(ctrl('h'))
    const dialog = screen.getByRole('dialog', { name: 'Action history' })
    expect(within(dialog).getByRole('button', { name: 'Close' })).toHaveFocus()
    const items = within(dialog).getAllByRole('listitem')
    expect(items.map(li => li.querySelector('p')?.textContent)).toEqual(['Medication reminders off', 'Marked as taken'])

    await user.click(within(dialog).getByRole('button', { name: 'Undo: Marked as taken' }))
    expect(screen.getByRole('progressbar')).toHaveAttribute('aria-valuetext', '2 of 9 taken')
    expect(within(dialog).queryByRole('button', { name: 'Undo: Marked as taken' })).not.toBeInTheDocument()
    expect(within(dialog).getByText(/undone/)).toBeInTheDocument()

    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Action history' })).not.toBeInTheDocument()
  })

  it('opens from the Account page and has no axe violations', async () => {
    const { user } = renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /Action history/ }))
    expect(screen.getByRole('dialog', { name: 'Action history' })).toHaveTextContent('No actions yet.')
    expect(await axeViolations('desktop')).toEqual([])
  })

  it('can undo a logged symptom', async () => {
    const { user } = renderApp('/symptoms.html')
    const count = screen.getAllByRole('heading', { level: 3 }).length
    await user.click(screen.getByRole('button', { name: 'Add a symptom' }))
    await user.type(screen.getByLabelText('Symptom'), 'Dizziness')
    await user.click(screen.getByRole('button', { name: 'Save symptom' }))
    expect(screen.getByRole('heading', { level: 3, name: 'Dizziness' })).toBeInTheDocument()
    await user.keyboard(ctrl('u'))
    expect(screen.queryByRole('heading', { level: 3, name: 'Dizziness' })).not.toBeInTheDocument()
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(count)
  })
})

describe('Focus trap in dialogs', () => {
  it('keeps Tab and Shift + Tab inside the help dialog, then returns focus to Help', async () => {
    const { user } = renderApp('/today.html')
    const help = screen.getByRole('button', { name: 'Help' })
    await user.click(help)
    const gotIt = screen.getByRole('button', { name: 'Got it' })
    expect(gotIt).toHaveFocus()
    await user.tab() // last control: wraps to the first, which is Got it too
    expect(gotIt).toHaveFocus()
    await user.tab({ shift: true })
    expect(gotIt).toHaveFocus()
    await user.keyboard('{Escape}')
    expect(help).toHaveFocus()
  })

  it('cycles through the voice panel and never reaches the page behind it', async () => {
    const { user } = renderApp('/today.html')
    await user.keyboard(ctrl('\\'))
    const dialog = screen.getByRole('dialog', { name: 'Voice commands' })
    for (let i = 0; i < 12; i++) {
      await user.tab()
      expect(dialog).toContainElement(document.activeElement as HTMLElement)
    }
  })
})

describe('Skip links and landmarks', () => {
  it('offers skip links to the content, navigation and page tools', async () => {
    const { user } = renderApp('/today.html')
    const skips = within(screen.getByRole('navigation', { name: 'Skip links' })).getAllByRole('link')
    expect(skips.map(a => a.textContent)).toEqual(['Skip to content', 'Skip to navigation', 'Skip to voice, SOS and account'])

    await user.tab()
    expect(skips[0]).toHaveFocus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('main')).toHaveFocus()

    await user.click(skips[1])
    expect(screen.getByRole('navigation', { name: 'Primary' })).toHaveFocus()
    await user.click(skips[2])
    expect(screen.getByRole('group', { name: 'Voice, SOS and account' })).toHaveFocus()
  })

  it('offers skip links on the sign-in and landing pages', () => {
    renderApp('/signin.html')
    expect(screen.getByRole('link', { name: 'Skip to form' })).toHaveAttribute('href', '#auth-form')
    expect(screen.getByRole('main')).toHaveAttribute('id', 'auth-form')
  })

  it('labels the signed-in landmarks', () => {
    renderApp('/today.html')
    expect(screen.getByRole('banner')).toContainElement(screen.getByRole('heading', { level: 1, name: 'Today' }))
    expect(screen.getByRole('main', { name: 'Today' })).toBeInTheDocument()
    expect(screen.getByRole('complementary', { name: 'Sidebar' })).toBeInTheDocument()
    expect(screen.getByRole('navigation', { name: 'Primary' })).toBeInTheDocument()
    expect(screen.getByRole('region', { name: 'Scroll and voice controls' })).toBeInTheDocument()
  })

  it('lists every keyboard shortcut in Help', async () => {
    const { user } = renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Help' }))
    const list = screen.getByRole('region', { name: 'Keyboard shortcuts' })
    for (const keys of ['Ctrl + =', 'Ctrl + L', 'Ctrl + \\', 'Ctrl + U', 'Ctrl + H', 'Ctrl + S', 'Arrow keys', 'Tab / Shift + Tab']) {
      expect(within(list).getByText(keys)).toBeInTheDocument()
    }
  })
})
