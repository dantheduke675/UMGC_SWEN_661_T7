import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './utils'

describe('Sign in (signin.html)', () => {
  it('shows labelled email and password fields with helper text', () => {
    renderApp('/signin.html')
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    const email = screen.getByLabelText('Email address')
    expect(email).toHaveValue('maddy@example.com')
    expect(email).toHaveAccessibleDescription('We will never share this.')
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
  })

  it('signs in and opens Today', async () => {
    const { user, currentPath } = renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(currentPath()).toBe('/today.html')
    expect(screen.getByRole('progressbar', { name: 'Medications taken today' })).toBeInTheDocument()
  })

  it('shows an error and stays put when the email is empty', async () => {
    const { user, currentPath } = renderApp('/signin.html')
    await user.clear(screen.getByLabelText('Email address'))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email address and password.')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
    expect(currentPath()).toBe('/signin.html')
  })

  it('shows an error when the password is empty', async () => {
    const { user } = renderApp('/signin.html')
    await user.clear(screen.getByLabelText('Password'))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toBeInTheDocument()
  })

  // Waits for the real 2.5 s scan
  it('asks before using Face ID, scans, then opens Today', { timeout: 8000 }, async () => {
    const { user, currentPath } = renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in with your face?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes, use Face ID' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Yes, use Face ID' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back, Maddy' })).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Looking for your face…')
    expect(currentPath()).toBe('/signin.html')

    await waitFor(() => expect(currentPath()).toBe('/today.html'), { timeout: 4000 })
  })

  it('goes back to the password form with "No, use my password"', async () => {
    const { user } = renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    await user.click(screen.getByRole('button', { name: 'No, use my password' }))
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
  })

  it('stops the scan with "Use my password instead"', async () => {
    const { user, currentPath } = renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    await user.click(screen.getByRole('button', { name: 'Yes, use Face ID' }))
    await user.click(screen.getByRole('button', { name: 'Use my password instead' }))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(currentPath()).toBe('/signin.html')
  })

  it('goes back to the landing page', async () => {
    const { user, currentPath } = renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: '← Back' }))
    expect(currentPath()).toBe('/')
  })

  it('submits with the Enter key', async () => {
    const { user, currentPath } = renderApp('/signin.html')
    await user.click(screen.getByLabelText('Password'))
    await user.keyboard('{Enter}')
    expect(currentPath()).toBe('/today.html')
  })
})

describe('Create account (create-account.html)', () => {
  it('shows the sign-up fields and both roles', () => {
    renderApp('/create-account.html')
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveValue('Maddy Chen')
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
    const roles = screen.getByRole('group', { name: 'I AM A…' })
    expect(roles).toContainElement(screen.getByRole('button', { name: 'Care recipient' }))
    expect(roles).toContainElement(screen.getByRole('button', { name: 'Caregiver' }))
  })

  it('rejects a password shorter than 8 characters', async () => {
    const { user, currentPath } = renderApp('/create-account.html')
    const password = screen.getByLabelText('Password')
    await user.clear(password)
    await user.type(password, 'short')
    await user.click(screen.getByRole('button', { name: 'Care recipient' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters.')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(currentPath()).toBe('/create-account.html')
  })

  it('goes back to the landing page', async () => {
    const { user, currentPath } = renderApp('/create-account.html')
    await user.click(screen.getByRole('button', { name: '← Back' }))
    expect(currentPath()).toBe('/')
  })

  it.each(['Care recipient', 'Caregiver'])('opens Today after choosing "%s"', async role => {
    const { user, currentPath } = renderApp('/create-account.html')
    await user.click(screen.getByRole('button', { name: role }))
    expect(currentPath()).toBe('/today.html')
  })
})

describe('Auth screens', () => {
  it('show the brand panel', () => {
    renderApp('/signin.html')
    expect(screen.getByText('A calmer way to manage each day.')).toBeInTheDocument()
  })

  it('switch between dark and light theme and remember the choice', async () => {
    const { user } = renderApp('/signin.html')
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('cc.theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
})
