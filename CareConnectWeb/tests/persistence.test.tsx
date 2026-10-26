import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { progress, renderApp, sidebar } from './utils'

// Everything is saved in localStorage; "reloading" is unmounting the app and rendering it again
describe('Saved on this device (works offline, survives a reload)', () => {
  it('keeps the doses marked today', async () => {
    const { user, unmount } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    unmount()

    await renderApp('/today.html')
    expect(progress()).toHaveAttribute('aria-valuetext', '3 of 9 taken')
    expect(screen.getByRole('button', { name: 'Ropivacaine 10 mg, 8:00 PM: taken' })).toBeInTheDocument()
  })

  it('starts a new day with no doses carried over', async () => {
    // Three doses taken on an earlier day; today starts from the demo's two
    localStorage.setItem('cc.doses', JSON.stringify({ day: 'Mon Jan 01 2001', log: { '1-0': true, '3-0': true, '1-1': true } }))
    await renderApp('/today.html')
    expect(progress()).toHaveAttribute('aria-valuetext', '2 of 9 taken')
  })

  it('keeps sent messages and read conversations', async () => {
    const { user, unmount } = await renderApp('/messages.html?c=chen')
    await user.type(screen.getByLabelText('Reply to Dr. Sarah Chen'), 'See you Thursday{Enter}')
    unmount()

    await renderApp('/messages.html?c=chen')
    expect(screen.getByRole('list', { name: /Dr\. Sarah Chen/ })).toHaveTextContent('See you Thursday')
  })

  it('keeps logged symptoms', async () => {
    const { user, unmount } = await renderApp('/symptoms.html')
    await user.click(screen.getByRole('button', { name: 'Add a symptom' }))
    await user.type(screen.getByLabelText('Symptom'), 'Dizziness')
    await user.click(screen.getByRole('button', { name: '1, very mild' }))
    await user.click(screen.getByRole('button', { name: 'Save symptom' }))
    unmount()

    await renderApp('/symptoms.html')
    expect(screen.getByRole('heading', { name: '4 logged today' })).toBeInTheDocument()
    expect(screen.getByText('Dizziness')).toBeInTheDocument()
  })

  it('keeps settings', async () => {
    const { user, unmount } = await renderApp('/account.html')
    await user.click(screen.getByRole('switch', { name: /Biometrics/ }))
    unmount()

    await renderApp('/account.html')
    expect(screen.getByRole('switch', { name: /Biometrics/ })).toHaveAttribute('aria-checked', 'false')
  })

  it('falls back to the demo data when what is saved cannot be read', async () => {
    localStorage.setItem('cc.symptoms', '{not json')
    localStorage.setItem('cc.conversations', '"not a list"')
    await renderApp('/symptoms.html')
    expect(screen.getByRole('heading', { name: '3 logged today' })).toBeInTheDocument()
  })

  it('clears the saved health data on sign out', async () => {
    const { user, unmount } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    await user.click(within(sidebar()).getByRole('button', { name: 'Sign out' }))
    unmount()

    await renderApp('/today.html')
    expect(progress()).toHaveAttribute('aria-valuetext', '2 of 9 taken')
  })
})
