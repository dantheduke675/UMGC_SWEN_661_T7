import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { progress, renderApp, sidebar } from './utils'

const doseList = () => screen.getByText('5 active prescriptions').nextElementSibling as HTMLElement

describe('Medications (medications.html)', () => {
  it('lists all nine doses for the five prescriptions', async () => {
    await renderApp('/medications.html')
    expect(screen.getByText('5 active prescriptions')).toBeInTheDocument()
    expect(within(doseList()).getAllByRole('listitem')).toHaveLength(9)
    expect(within(doseList()).getAllByRole('heading', { name: 'Loratadip / Carbiopa' })).toHaveLength(3)
  })

  it('shows each dose with its category, strength and time', async () => {
    await renderApp('/medications.html')
    const lisinopril = within(doseList()).getByRole('heading', { name: 'Lisinopril' }).closest('li')!
    expect(lisinopril).toHaveTextContent('Blood Pressure')
    expect(lisinopril).toHaveTextContent('10 mg · 8:00 AM')
  })

  it('shows two doses already taken and seven waiting', async () => {
    await renderApp('/medications.html')
    expect(screen.getAllByRole('button', { name: /: taken$/ })).toHaveLength(2)
    expect(screen.getAllByRole('button', { name: /^I took this:/ })).toHaveLength(7)
    expect(screen.getAllByRole('button', { name: /^I missed this:/ })).toHaveLength(7)
  })

  it('marks a dose taken and the card stripe turns green', async () => {
    const { user } = await renderApp('/medications.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Atorvastatin 20 mg, 8:00 PM' }))
    const card = screen.getByRole('button', { name: 'Atorvastatin 20 mg, 8:00 PM: taken' }).closest('li')!
    expect(card).toHaveClass('border-l-brand')
    expect(within(card).queryByRole('button', { name: /I missed this/ })).not.toBeInTheDocument()
  })

  it('marks a dose missed and the card stripe turns red', async () => {
    const { user } = await renderApp('/medications.html')
    await user.click(screen.getByRole('button', { name: 'I missed this: Atorvastatin 20 mg, 8:00 PM' }))
    await user.click(screen.getByRole('button', { name: 'Yes, I missed this dose' }))
    const card = screen.getByRole('button', { name: 'Atorvastatin 20 mg, 8:00 PM: missed' }).closest('li')!
    expect(card).toHaveClass('border-l-danger')
  })

  it('shares dose status with Today', async () => {
    const { user } = await renderApp('/medications.html')
    await user.click(screen.getByRole('button', { name: 'I took this: Lisinopril 10 mg, 8:00 AM' }))
    await user.click(within(sidebar()).getByRole('link', { name: 'Today' }))
    // Today is a lazy-loaded page: wait for it to arrive
    await screen.findByRole('progressbar', { name: 'Medications taken today' })
    expect(progress()).toHaveAttribute('aria-valuetext', '3 of 9 taken')

    await user.click(within(sidebar()).getByRole('link', { name: 'Medications' }))
    expect(screen.getByRole('button', { name: 'Lisinopril 10 mg, 8:00 AM: taken' })).toBeInTheDocument()
  })

  it('can mark every dose taken', async () => {
    const { user } = await renderApp('/medications.html')
    for (const button of screen.getAllByRole('button', { name: /^I took this:/ })) await user.click(button)
    expect(screen.getAllByRole('button', { name: /: taken$/ })).toHaveLength(9)
    await user.click(within(sidebar()).getByRole('link', { name: 'Today' }))
    await screen.findByRole('progressbar', { name: 'Medications taken today' })
    expect(progress()).toHaveAttribute('aria-valuetext', '9 of 9 taken')
    expect(screen.getByText('100%')).toBeInTheDocument()
  })
})
