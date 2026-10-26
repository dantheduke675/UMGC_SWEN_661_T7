import { screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, statusMessages } from './utils'

const group = (name: string) => screen.getByRole('region', { name })

describe('Account page', () => {
  it('shows the profile, emergency contact and care team', async () => {
    await renderApp('/account.html')
    expect(screen.getByRole('heading', { level: 2, name: 'Madison Hughes' })).toBeInTheDocument()
    expect(group('Profile')).toHaveTextContent('maddy@example.com')
    expect(group('Profile')).toHaveTextContent('Joyce Hughes · (555) 012-3456')
    expect(within(group('Care team')).getAllByRole('button')).toHaveLength(3)
  })

  it('switches the theme from Appearance', async () => {
    const { user } = await renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /Appearance/ }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: /Appearance/ })).toHaveTextContent('Light mode')
  })

  it('turns notifications, reminders, Face ID and data sharing on and off', async () => {
    const { user } = await renderApp('/account.html')
    for (const [name, off] of [
      [/^Notifications/, 'Off · Ctrl + N'],
      [/^Medication reminders/, 'Off'],
      [/^Biometrics/, 'Face ID off'],
      [/^Share health data/, 'Not shared'],
    ] as const) {
      const row = screen.getByRole('switch', { name })
      expect(row).toHaveAttribute('aria-checked', 'true')
      await user.click(row)
      expect(row).toHaveAttribute('aria-checked', 'false')
      expect(row).toHaveTextContent(off)
    }
  })

  it('zooms with the Zoom buttons, between 80% and 200%', async () => {
    const { user } = await renderApp('/account.html')
    const zoomIn = screen.getByRole('button', { name: 'Zoom in' })
    await user.click(zoomIn)
    expect(screen.getByText('110%')).toBeInTheDocument()
    expect(document.documentElement.style.getPropertyValue('--zoom')).toBe('1.1')
    for (let i = 0; i < 4; i++) await user.click(screen.getByRole('button', { name: 'Zoom out' }))
    expect(screen.getByText('80%')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Zoom out' })).toBeDisabled()
  })

  it('shows the app version and the privacy summary', async () => {
    const { user } = await renderApp('/account.html')
    expect(screen.getByText('CareConnect version').parentElement).toHaveTextContent('1.0.0')
    await user.click(screen.getByRole('button', { name: /Privacy and data/ }))
    expect(statusMessages().getByText('Your data is encrypted and only shared with your care team.')).toBeInTheDocument()
  })

  it('opens a care team member’s conversation', async () => {
    const { user, router } = await renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /James Rivera/ }))
    // Messages is a lazy-loaded page: wait for it to arrive
    expect(await screen.findByRole('heading', { level: 2, name: 'James Rivera' })).toBeInTheDocument()
    expect(router.state.location.pathname).toBe('/messages.html')
  })

  it('shows a message for profile editing (demo)', async () => {
    const { user } = await renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /maddy@example\.com/ }))
    expect(statusMessages().getByText('Editing your profile is coming soon')).toBeInTheDocument()
  })

  it('signs out to the landing page', async () => {
    const { user, currentPath } = await renderApp('/account.html')
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign out' }))
    await waitFor(() => expect(currentPath()).toBe('/'))
  })
})
