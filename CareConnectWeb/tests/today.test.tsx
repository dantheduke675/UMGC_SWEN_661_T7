import { act, screen, waitFor, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { freezeClock, progress, renderApp, sidebar, statusMessages } from './utils'

describe('Today (today.html)', () => {
  it('greets the patient with the date and time of day', async () => {
    freezeClock(new Date(2026, 9, 20, 9, 0))
    await renderApp('/today.html')
    expect(screen.getByText('Tuesday, October 20')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /Good morning, Maddy/ })).toBeInTheDocument()
  })

  it.each([
    [14, 'Good afternoon'],
    [20, 'Good evening'],
  ])('says the right greeting at %i:00', async (hour, greeting) => {
    freezeClock(new Date(2026, 9, 20, hour, 0))
    await renderApp('/today.html')
    expect(screen.getByRole('heading', { name: new RegExp(greeting) })).toBeInTheDocument()
  })

  it('shows progress: 2 of 9 doses taken (22%)', async () => {
    await renderApp('/today.html')
    expect(progress()).toHaveAttribute('aria-valuetext', '2 of 9 taken')
    expect(progress()).toHaveAttribute('aria-valuenow', '22')
    expect(screen.getByText('22%')).toBeInTheDocument()
  })

  it('lists the next six doses', async () => {
    await renderApp('/today.html')
    const list = screen.getByRole('heading', { name: 'Medications' }).closest('section')!
    expect(within(list).getAllByRole('listitem')).toHaveLength(6)
    expect(within(list).getAllByRole('button', { name: /: taken$/ })).toHaveLength(2)
  })

  it('marks a dose taken, updates progress and offers Undo', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    expect(progress()).toHaveAttribute('aria-valuetext', '3 of 9 taken')
    expect(screen.getByRole('button', { name: 'Ropivacaine 10 mg, 8:00 PM: taken' })).toHaveTextContent('✓ Taken')
    expect(statusMessages().getByText('Marked as taken')).toBeInTheDocument()

    await user.click(statusMessages().getByRole('button', { name: 'Undo' }))
    expect(progress()).toHaveAttribute('aria-valuetext', '2 of 9 taken')
    expect(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' })).toBeInTheDocument()
    expect(statusMessages().queryByText('Marked as taken')).not.toBeInTheDocument()
  })

  it('does nothing when a taken dose is pressed again', async () => {
    const { user } = await renderApp('/today.html')
    const taken = screen.getByRole('button', { name: 'Ropivacaine 10 mg, 8:00 AM: taken' })
    expect(taken).toHaveAttribute('aria-disabled', 'true')
    await user.click(taken)
    expect(progress()).toHaveAttribute('aria-valuetext', '2 of 9 taken')
    expect(statusMessages().queryByText('Marked as taken')).not.toBeInTheDocument()
  })

  it('hides the undo message after 5 seconds', async () => {
    vi.useFakeTimers({ shouldAdvanceTime: true })
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    expect(statusMessages().getByText('Marked as taken')).toBeInTheDocument()
    act(() => vi.advanceTimersByTime(5000))
    expect(statusMessages().queryByText('Marked as taken')).not.toBeInTheDocument()
  })

  it('asks before marking a dose missed, and Cancel changes nothing', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' }))
    const dialog = screen.getByRole('alertdialog', { name: /Mark this dose as missed\?/ })
    await user.click(within(dialog).getByRole('button', { name: 'Cancel — go back' }))
    expect(screen.queryByRole('alertdialog')).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' })).toBeInTheDocument()
  })

  it('marks a dose missed after confirming, and Undo restores it', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' }))
    await user.click(screen.getByRole('button', { name: 'Yes, I missed this dose' }))
    expect(screen.getByRole('button', { name: 'Ropivacaine 10 mg, 8:00 PM: missed' })).toHaveTextContent('✗ Missed')
    expect(progress()).toHaveAttribute('aria-valuetext', '2 of 9 taken')
    expect(statusMessages().getByText('Marked as missed')).toBeInTheDocument()

    await user.click(statusMessages().getByRole('button', { name: 'Undo' }))
    expect(screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' })).toBeInTheDocument()
  })

  it('can still mark a missed dose as taken', async () => {
    const { user } = await renderApp('/today.html')
    await user.click(screen.getByRole('button', { name: 'I missed this: Ropivacaine 10 mg, 8:00 PM' }))
    await user.click(screen.getByRole('button', { name: 'Yes, I missed this dose' }))
    await user.click(screen.getByRole('button', { name: 'I took this: Ropivacaine 10 mg, 8:00 PM' }))
    expect(screen.getByRole('button', { name: 'Ropivacaine 10 mg, 8:00 PM: taken' })).toBeInTheDocument()
    expect(progress()).toHaveAttribute('aria-valuetext', '3 of 9 taken')
  })

  it('links to all medications and to the schedule', async () => {
    const { user, currentPath } = await renderApp('/today.html')
    await user.click(screen.getByRole('link', { name: 'See all 9' }))
    await waitFor(() => expect(currentPath()).toBe('/medications.html'))
    await user.click(within(sidebar()).getByRole('link', { name: 'Today' }))
    await user.click(screen.getByRole('link', { name: /Dr\. Chen — Follow-up/ }))
    await waitFor(() => expect(currentPath()).toBe('/schedule.html'))
  })
})
