import { act, fireEvent, screen, waitFor, within } from '@testing-library/react'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { checkEmail, checkNewPassword, collectErrors } from '../src/validation'
import { findDialog, renderApp, statusMessages } from './utils'

const banner = () => screen.getByRole('banner')

describe('Notifications panel (top bar bell)', () => {
  it('lists the next dose, the appointment and unread messages, each linking to its page', async () => {
    const { user, currentPath } = await renderApp('/today.html')
    await user.click(within(banner()).getByRole('button', { name: 'Notifications, 3 new' }))
    const panel = screen.getByRole('dialog', { name: 'Notifications' })
    const links = within(panel).getAllByRole('link')
    expect(links.map(a => a.querySelector('span')?.textContent)).toEqual(['Medication due', 'Appointment today', 'New message'])
    expect(links[0]).toHaveFocus()
    expect(links[0]).toHaveTextContent('Loratadip / Carbiopa 25 mg / 100 mg at 7:00 AM')
    await user.click(links[2])
    await waitFor(() => expect(currentPath()).toBe('/messages.html'))
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument()
  })

  it('updates as doses are logged', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Loratadip / Carbiopa 25 mg / 100 mg, 7:00 AM' }))
    await user.click(within(banner()).getByRole('button', { name: /^Notifications/ }))
    expect(screen.getByRole('dialog', { name: 'Notifications' })).toHaveTextContent('Lisinopril 10 mg at 8:00 AM')
  })

  it('offers to turn notifications back on when they are off', async () => {
    const { user } = await renderApp('/today.html')
    await user.keyboard('{Control>}n{/Control}')
    const bell = within(banner()).getByRole('button', { name: 'Notifications, turned off' })
    await user.click(bell)
    const panel = screen.getByRole('dialog', { name: 'Notifications' })
    expect(panel).toHaveTextContent('Notifications are turned off.')
    await user.click(within(panel).getByRole('button', { name: 'Turn on notifications' }))
    expect(within(banner()).getByRole('button', { name: 'Notifications, 3 new' })).toBeInTheDocument()
  })

  it('closes with Escape or a click outside', async () => {
    const { user } = await renderApp('/today.html')
    const bell = within(banner()).getByRole('button', { name: /^Notifications/ })
    await user.click(bell)
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument()
    await user.click(bell)
    await user.click(screen.getByRole('main'))
    expect(screen.queryByRole('dialog', { name: 'Notifications' })).not.toBeInTheDocument()
  })
})

describe('Top bar', () => {
  it('opens the action history and counts what can be undone', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    await user.click(within(banner()).getByRole('button', { name: 'Action history, 1 can be undone' }))
    expect(await findDialog('Action history')).toHaveTextContent('Marked as taken')
  })

  it('closes the account menu with a click outside', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'Maddy, account menu' }))
    expect(screen.getByRole('menu')).toBeInTheDocument()
    await user.click(screen.getByRole('main'))
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })
})

describe('Offline', () => {
  afterEach(() => vi.restoreAllMocks())

  it('says when the connection drops, and when it is back', async () => {
    const online = vi.spyOn(navigator, 'onLine', 'get').mockReturnValue(true)
    await renderApp('/today.html')
    expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument()

    online.mockReturnValue(false)
    act(() => void window.dispatchEvent(new Event('offline')))
    expect(screen.getByText(/You're offline. CareConnect still works/)).toBeInTheDocument()

    online.mockReturnValue(true)
    act(() => void window.dispatchEvent(new Event('online')))
    expect(screen.queryByText(/You're offline/)).not.toBeInTheDocument()
  })
})

describe('Mouse lock-on', () => {
  // jsdom has no layout, so give the controls boxes to measure
  function placeControls() {
    let i = 0
    for (const el of document.querySelectorAll<HTMLElement>('a[href], button')) {
      const top = 1000 + i++ * 100
      el.getBoundingClientRect = () => ({ top, bottom: top + 40, left: 0, right: 200, width: 200, height: 40, x: 0, y: top, toJSON: () => ({}) })
    }
  }

  it('moves focus to the control nearest the pointer, and a click on empty space presses it', async () => {
    const { user } = await renderApp('/today.html')
    await user.keyboard('{Control>}o{/Control}')
    expect(statusMessages().getByText(/Mouse lock on/)).toBeInTheDocument()
    placeControls()
    const target = screen.getByRole('button', { name: 'Help' })
    const box = target.getBoundingClientRect()

    fireEvent.mouseMove(document.body, { clientX: 300, clientY: box.top + 20 }) // 100px to the right of it
    expect(target).toHaveFocus()

    fireEvent.click(screen.getByRole('main'), { clientX: 300, clientY: box.top + 20 })
    expect(screen.getByRole('dialog', { name: 'Help' })).toBeInTheDocument()
  })

  it('does nothing while it is off', async () => {
    await renderApp('/today.html')
    placeControls()
    const target = screen.getByRole('button', { name: 'Help' })
    fireEvent.mouseMove(document.body, { clientX: 300, clientY: target.getBoundingClientRect().top + 20 })
    expect(target).not.toHaveFocus()
  })
})

describe('Form validation rules', () => {
  it.each([
    ['', 'Enter your email address.'],
    ['   ', 'Enter your email address.'],
    ['maddy', 'Enter an email address like name@example.com.'],
    ['maddy@example', 'Enter an email address like name@example.com.'],
    ['ma ddy@example.com', 'Enter an email address like name@example.com.'],
    ['maddy@example.com', ''],
    [' maddy@example.com ', ''],
  ])('checkEmail(%j)', (value, message) => {
    expect(checkEmail(value)).toBe(message)
  })

  it('needs 8 characters for a new password', () => {
    expect(checkNewPassword('1234567')).toBe('Use at least 8 characters.')
    expect(checkNewPassword('12345678')).toBe('')
  })

  it('keeps only the failed checks', () => {
    expect(collectErrors({ name: '', email: 'Bad', password: '' })).toEqual({ email: 'Bad' })
  })
})
