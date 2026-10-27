import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { freezeClock, renderApp } from './utils'

// What a day button shows ("Sun" and "18"); its accessible name is the full date
const shown = (button: HTMLElement) => [...button.querySelectorAll('[aria-hidden="true"]')].map(s => s.textContent).join('')

describe('Schedule (schedule.html)', () => {
  it('shows the current month and the seven days of this week', async () => {
    freezeClock(new Date(2026, 9, 20, 9, 0)) // Tuesday
    await renderApp('/schedule.html')
    expect(screen.getByRole('heading', { name: 'October 2026' })).toBeInTheDocument()
    const days = within(screen.getByRole('group', { name: 'Choose a day' })).getAllByRole('button')
    expect(days.map(shown)).toEqual(['Sun18', 'Mon19', 'Tue20', 'Wed21', 'Thu22', 'Fri23', 'Sat24'])
  })

  it('selects today to start with', async () => {
    freezeClock(new Date(2026, 9, 20, 9, 0))
    await renderApp('/schedule.html')
    const today = screen.getByRole('button', { name: 'Tuesday, October 20, today' })
    expect(today).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getAllByRole('button', { pressed: true })).toHaveLength(1)
  })

  it('selects another day when it is pressed', async () => {
    freezeClock(new Date(2026, 9, 20, 9, 0))
    const { user } = await renderApp('/schedule.html')
    const friday = screen.getByRole('button', { name: 'Friday, October 23' })
    await user.click(friday)
    expect(friday).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByRole('button', { name: 'Tuesday, October 20, today' })).toHaveAttribute('aria-pressed', 'false')
  })

  it('handles a week that crosses into the next month', async () => {
    freezeClock(new Date(2026, 9, 30, 9, 0)) // Friday 30 October
    await renderApp('/schedule.html')
    const days = within(screen.getByRole('group', { name: 'Choose a day' })).getAllByRole('button')
    expect(days.map(shown)).toEqual(['Sun25', 'Mon26', 'Tue27', 'Wed28', 'Thu29', 'Fri30', 'Sat31'])
  })

  it("lists today's five items with times and lengths", async () => {
    await renderApp('/schedule.html')
    const items = within(screen.getByRole('list', { name: 'Schedule' })).getAllByRole('listitem')
    expect(items).toHaveLength(5)
    expect(items.map(i => within(i).getByRole('heading').textContent)).toEqual([
      'Morning Medications',
      'Blood Pressure Check',
      'Dr. Chen — Follow-up',
      'Physical Therapy',
      'Evening Medications',
    ])
    expect(items[2]).toHaveTextContent('2:30 PM · 45 min')
  })

  it('marks finished items as Done', async () => {
    await renderApp('/schedule.html')
    const items = within(screen.getByRole('list', { name: 'Schedule' })).getAllByRole('listitem')
    const done = items.filter(i => within(i).queryByText('Done'))
    expect(done.map(i => within(i).getByRole('heading').textContent)).toEqual(['Morning Medications', 'Blood Pressure Check'])
  })
})
