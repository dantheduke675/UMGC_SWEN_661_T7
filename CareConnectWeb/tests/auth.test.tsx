import { act, screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { fakeBiometrics, renderApp } from './utils'

describe('Sign in (signin.html)', () => {
  it('shows labelled email and password fields with helper text', async () => {
    await renderApp('/signin.html')
    expect(screen.getByRole('heading', { name: 'Sign in' })).toBeInTheDocument()
    const email = screen.getByLabelText('Email address')
    expect(email).toHaveValue('maddy@example.com')
    expect(email).toHaveAccessibleDescription('We will never share this.')
    const password = screen.getByLabelText('Password')
    expect(password).toHaveAttribute('type', 'password')
    expect(password).toHaveAttribute('autocomplete', 'current-password')
  })

  it('signs in and opens Today', async () => {
    const { user, currentPath } = await renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    // Today is a lazy-loaded page: wait for it to arrive
    expect(await screen.findByRole('progressbar', { name: 'Medications taken today' })).toBeInTheDocument()
    expect(currentPath()).toBe('/today.html')
  })

  it('shows an error and stays put when the email is empty', async () => {
    const { user, currentPath } = await renderApp('/signin.html')
    await user.clear(screen.getByLabelText('Email address'))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your email address.')
    expect(screen.getByLabelText('Email address')).toHaveAttribute('aria-invalid', 'true')
    expect(screen.getByLabelText('Email address')).toHaveFocus()
    expect(currentPath()).toBe('/signin.html')
  })

  it('rejects an email address without an @ and a domain', async () => {
    const { user, currentPath } = await renderApp('/signin.html')
    const email = screen.getByLabelText('Email address')
    await user.clear(email)
    await user.type(email, 'maddy.example.com')
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter an email address like name@example.com.')
    expect(email).toHaveAccessibleDescription(expect.stringContaining('name@example.com'))
    expect(currentPath()).toBe('/signin.html')
  })

  it('shows an error when the password is empty', async () => {
    const { user } = await renderApp('/signin.html')
    await user.clear(screen.getByLabelText('Password'))
    await user.click(screen.getByRole('button', { name: 'Sign in' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Enter your password.')
    expect(screen.getByLabelText('Password')).toHaveAttribute('aria-invalid', 'true')
  })

  it('goes straight to the device check from "Use Face ID instead", then opens Today', async () => {
    const device = fakeBiometrics()
    let confirm = () => {}
    device.create.mockImplementation(() => new Promise(done => (confirm = () => done(new PublicKeyCredential()))))
    const { user, currentPath } = await renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    // No "Sign in with your face?" question: that is asked once, after creating an account
    expect(screen.queryByRole('heading', { name: 'Sign in with your face?' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome back, Maddy' })).toBeInTheDocument()
    expect(screen.getByText('Waiting for your device…').closest('[role="status"]')).toBeInTheDocument()
    // The device's own prompt, which must check it is the person (face, fingerprint or PIN)
    await waitFor(() => expect(device.create).toHaveBeenCalledOnce())
    expect(device.create.mock.calls[0][0].publicKey?.authenticatorSelection).toMatchObject({ authenticatorAttachment: 'platform', userVerification: 'required' })
    expect(currentPath()).toBe('/signin.html')

    // Opens as soon as the device confirms: no extra wait
    act(confirm)
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
    // No passkey was saved on this device, so one was made; its id (bytes 1, 2, 3) is kept
    expect(localStorage.getItem('cc.passkey')).toBe('AQID')
  })

  it('confirms with the saved passkey', async () => {
    const device = fakeBiometrics()
    localStorage.setItem('cc.passkey', 'AQID')
    const { user, currentPath } = await renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
    expect(device.create).not.toHaveBeenCalled()
    const allowed = device.get.mock.calls[0][0].publicKey?.allowCredentials?.[0]
    expect(new Uint8Array(allowed?.id as Uint8Array)).toEqual(new Uint8Array([1, 2, 3]))
  })

  it('offers Try again when the device check is cancelled', async () => {
    const device = fakeBiometrics()
    device.create.mockRejectedValueOnce(new DOMException('The operation either timed out or was not allowed.', 'NotAllowedError'))
    const { user, currentPath } = await renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'That did not work' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Try again' })).toHaveFocus()

    await user.click(screen.getByRole('button', { name: 'Try again' }))
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
    expect(device.create).toHaveBeenCalledTimes(2)
  })

  it('says so when the device has no face, fingerprint or Windows Hello sign-in', async () => {
    fakeBiometrics(false)
    const { user } = await renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Face ID is not available here' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Try again' })).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Use my password' })).toHaveFocus()
    await user.click(screen.getByRole('button', { name: 'Use my password' }))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
  })

  it('closes the device prompt with "Use my password instead"', async () => {
    const device = fakeBiometrics()
    device.create.mockImplementation(() => new Promise(() => {}))
    const { user, currentPath } = await renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: 'Use Face ID instead' }))
    await waitFor(() => expect(device.create).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Use my password instead' }))
    expect(screen.getByLabelText('Password')).toBeInTheDocument()
    expect(device.create.mock.calls[0][0].signal?.aborted).toBe(true)
    expect(currentPath()).toBe('/signin.html')
  })

  it('goes back to the landing page', async () => {
    const { user, currentPath } = await renderApp('/signin.html')
    await user.click(screen.getByRole('button', { name: '← Back' }))
    await waitFor(() => expect(currentPath()).toBe('/'))
  })

  it('submits with the Enter key', async () => {
    const { user, currentPath } = await renderApp('/signin.html')
    await user.click(screen.getByLabelText('Password'))
    await user.keyboard('{Enter}')
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
  })
})

describe('Create account (create-account.html)', () => {
  it('shows the sign-up fields and both roles', async () => {
    await renderApp('/create-account.html')
    expect(screen.getByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(screen.getByLabelText('Full name')).toHaveValue('Maddy Chen')
    expect(screen.getByLabelText('Email address')).toHaveAttribute('type', 'email')
    expect(screen.getByLabelText('Password')).toHaveAttribute('autocomplete', 'new-password')
    const roles = screen.getByRole('group', { name: 'I AM A…' })
    expect(roles).toContainElement(screen.getByRole('button', { name: 'Care recipient' }))
    expect(roles).toContainElement(screen.getByRole('button', { name: 'Caregiver' }))
  })

  it('checks every field, lists each problem under its field and focuses the first', async () => {
    const { user, currentPath } = await renderApp('/create-account.html')
    await user.clear(screen.getByLabelText('Full name'))
    await user.clear(screen.getByLabelText('Email address'))
    await user.type(screen.getByLabelText('Email address'), 'maddy@')
    await user.click(screen.getByRole('button', { name: 'Care recipient' }))
    expect(screen.getAllByRole('alert').map(a => a.textContent)).toEqual(['Enter your full name.', 'Enter an email address like name@example.com.'])
    expect(screen.getByLabelText('Full name')).toHaveFocus()
    expect(screen.getByLabelText('Password')).not.toHaveAttribute('aria-invalid')
    expect(currentPath()).toBe('/create-account.html')
  })

  it('rejects a password shorter than 8 characters', async () => {
    const { user, currentPath } = await renderApp('/create-account.html')
    const password = screen.getByLabelText('Password')
    await user.clear(password)
    await user.type(password, 'short')
    await user.click(screen.getByRole('button', { name: 'Care recipient' }))
    expect(screen.getByRole('alert')).toHaveTextContent('Use at least 8 characters.')
    expect(password).toHaveAttribute('aria-invalid', 'true')
    expect(currentPath()).toBe('/create-account.html')
  })

  it('goes back to the landing page', async () => {
    const { user, currentPath } = await renderApp('/create-account.html')
    await user.click(screen.getByRole('button', { name: '← Back' }))
    await waitFor(() => expect(currentPath()).toBe('/'))
  })

  it.each(['Care recipient', 'Caregiver'])('offers Face ID after choosing "%s", and opens Today without it on "No"', async role => {
    const device = fakeBiometrics()
    const { user, currentPath } = await renderApp('/create-account.html')
    await user.click(screen.getByRole('button', { name: role }))
    expect(screen.getByRole('heading', { level: 1, name: 'Sign in with your face?' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Yes, use Face ID' })).toHaveFocus()
    expect(currentPath()).toBe('/create-account.html')

    await user.click(screen.getByRole('button', { name: 'No, use my password' }))
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
    expect(device.create).not.toHaveBeenCalled()
  })

  it('sets up Face ID with a new passkey on "Yes", then opens Today', async () => {
    const device = fakeBiometrics()
    let confirm = () => {}
    device.create.mockImplementation(() => new Promise(done => (confirm = () => done(new PublicKeyCredential()))))
    // Even with a passkey from before, setting up makes a new one
    localStorage.setItem('cc.passkey', 'OLD')
    const { user, currentPath } = await renderApp('/create-account.html')
    await user.clear(screen.getByLabelText('Full name'))
    await user.type(screen.getByLabelText('Full name'), 'Sam Rivera')
    await user.click(screen.getByRole('button', { name: 'Care recipient' }))
    await user.click(screen.getByRole('button', { name: 'Yes, use Face ID' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Welcome, Sam' })).toBeInTheDocument()
    await waitFor(() => expect(device.create).toHaveBeenCalled())
    act(confirm)
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
    expect(device.create).toHaveBeenCalledOnce()
    expect(device.get).not.toHaveBeenCalled()
    expect(localStorage.getItem('cc.passkey')).toBe('AQID')
  })

  it('opens Today with "Continue without Face ID" while setting up', async () => {
    const device = fakeBiometrics()
    device.create.mockImplementation(() => new Promise(() => {}))
    const { user, currentPath } = await renderApp('/create-account.html')
    await user.click(screen.getByRole('button', { name: 'Caregiver' }))
    await user.click(screen.getByRole('button', { name: 'Yes, use Face ID' }))
    await waitFor(() => expect(device.create).toHaveBeenCalled())
    await user.click(screen.getByRole('button', { name: 'Continue without Face ID' }))
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
    expect(device.create.mock.calls[0][0].signal?.aborted).toBe(true)
  })

  it('lets you continue when the device has no biometrics', async () => {
    fakeBiometrics(false)
    const { user, currentPath } = await renderApp('/create-account.html')
    await user.click(screen.getByRole('button', { name: 'Care recipient' }))
    await user.click(screen.getByRole('button', { name: 'Yes, use Face ID' }))
    expect(await screen.findByRole('heading', { level: 1, name: 'Face ID is not available here' })).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Continue without Face ID' }))
    await waitFor(() => expect(currentPath()).toBe('/today.html'))
  })
})

describe('Auth screens', () => {
  it('show the brand panel', async () => {
    await renderApp('/signin.html')
    expect(screen.getByText('A calmer way to manage each day.')).toBeInTheDocument()
  })

  it('switch between dark and light theme and remember the choice', async () => {
    const { user } = await renderApp('/signin.html')
    expect(document.documentElement.dataset.theme).toBe('dark')
    await user.click(screen.getByRole('button', { name: 'Switch to light theme' }))
    expect(document.documentElement.dataset.theme).toBe('light')
    expect(localStorage.getItem('cc.theme')).toBe('light')
    expect(screen.getByRole('button', { name: 'Switch to dark theme' })).toBeInTheDocument()
  })
})
