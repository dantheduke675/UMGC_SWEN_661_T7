import { screen, waitFor } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp } from './utils'

describe('Landing page (index.html)', () => {
  it('shows the hero headline, intro and benefits', async () => {
    await renderApp('/')
    expect(screen.getByRole('heading', { level: 1, name: /Stay on track\.\s*Stay connected\./ })).toBeInTheDocument()
    expect(screen.getByText(/makes medication routines easier/)).toBeInTheDocument()
    expect(screen.getByRole('list', { name: 'CareConnect benefits' })).toHaveTextContent('No credit card')
  })

  it('also renders at /index.html', async () => {
    await renderApp('/index.html')
    expect(screen.getByRole('heading', { level: 1, name: /Stay on track/ })).toBeInTheDocument()
  })

  it('links the sign-in and sign-up buttons to their HTML pages', async () => {
    await renderApp('/')
    expect(screen.getByRole('link', { name: 'Sign in' })).toHaveAttribute('href', '/signin.html')
    expect(screen.getByRole('link', { name: 'I already have an account' })).toHaveAttribute('href', '/signin.html')
    expect(screen.getByRole('link', { name: 'Create account' })).toHaveAttribute('href', '/create-account.html')
    expect(screen.getByRole('link', { name: 'Get started free' })).toHaveAttribute('href', '/create-account.html')
  })

  it('opens Create account from "Get started free"', async () => {
    const { user, currentPath } = await renderApp('/')
    await user.click(screen.getByRole('link', { name: 'Get started free' }))
    // Create account is a lazy-loaded page: wait for it to arrive
    expect(await screen.findByRole('heading', { name: 'Create your account' })).toBeInTheDocument()
    expect(currentPath()).toBe('/create-account.html')
  })

  it('opens Sign in from "I already have an account"', async () => {
    const { user, currentPath } = await renderApp('/')
    await user.click(screen.getByRole('link', { name: 'I already have an account' }))
    await waitFor(() => expect(currentPath()).toBe('/signin.html'))
  })

  it('has in-page links to the three feature sections', async () => {
    await renderApp('/')
    const nav = screen.getByRole('navigation', { name: 'Website navigation' })
    for (const [name, id] of [['How it works', 'how-it-works'], ['For caregivers', 'care'], ['Accessibility', 'accessibility']]) {
      const link = screen.getByRole('link', { name })
      expect(nav).toContainElement(link)
      expect(link).toHaveAttribute('href', `#${id}`)
      expect(document.getElementById(id)).not.toBeNull()
    }
    // One section heading, with a level-3 heading per feature
    expect(screen.getAllByRole('heading', { level: 2 })).toHaveLength(1)
    expect(screen.getAllByRole('heading', { level: 3 })).toHaveLength(3)
  })

  it('describes the hero photo', async () => {
    await renderApp('/')
    expect(screen.getByRole('img', { name: /caregiver sharing a reassuring moment/ })).toHaveAttribute('src', '/landing-photo.jpg')
  })
})
