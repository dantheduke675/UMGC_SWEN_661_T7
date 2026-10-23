import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, statusMessages } from './utils'

const group = (name: string) => screen.getByRole('region', { name })

describe('Account page', () => {
  it('shows the profile, emergency contact and care team', () => {
    renderApp('/account.html')
    expect(screen.getByRole('heading', { level: 2, name: 'Madison Hughes' })).toBeInTheDocument()
    expect(group('Profile')).toHaveTextContent('maddy@example.com')
    expect(group('Profile')).toHaveTextContent('Joyce Hughes · (555) 012-3456')
    expect(within(group('Care team')).getAllByRole('button')).toHaveLength(3)
  })

  it('switches the theme from Appearance', async () => {
    const { user } = renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /Appearance/ }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(screen.getByRole('button', { name: /Appearance/ })).toHaveTextContent('Light mode')
  })

  it('turns reminders and Face ID on and off', async () => {
    const { user } = renderApp('/account.html')
    const reminders = screen.getByRole('switch', { name: /Notifications/ })
    expect(reminders).toHaveAttribute('aria-checked', 'true')
    await user.click(reminders)
    expect(reminders).toHaveAttribute('aria-checked', 'false')
    expect(reminders).toHaveTextContent('Medication reminders off')
    const faceId = screen.getByRole('switch', { name: /Biometrics/ })
    await user.click(faceId)
    expect(faceId).toHaveTextContent('Face ID off')
  })

  it('opens a care team member’s conversation', async () => {
    const { user, router } = renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /James Rivera/ }))
    expect(router.state.location.pathname).toBe('/messages.html')
    expect(screen.getByRole('heading', { level: 2, name: 'James Rivera' })).toBeInTheDocument()
  })

  it('shows a message for profile editing (demo)', async () => {
    const { user } = renderApp('/account.html')
    await user.click(screen.getByRole('button', { name: /maddy@example\.com/ }))
    expect(statusMessages().getByText('Editing your profile is coming soon')).toBeInTheDocument()
  })

  it('signs out to the landing page', async () => {
    const { user, currentPath } = renderApp('/account.html')
    await user.click(within(screen.getByRole('main')).getByRole('button', { name: 'Sign out' }))
    expect(currentPath()).toBe('/')
  })
})
