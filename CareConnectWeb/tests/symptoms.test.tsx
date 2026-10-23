import { screen, within } from '@testing-library/react'
import { describe, expect, it } from 'vitest'
import { renderApp, statusMessages } from './utils'

const list = () => screen.getByRole('list', { name: 'Symptoms logged today' })

describe('Symptoms page', () => {
  it('shows the count and each symptom with its severity', () => {
    renderApp('/symptoms.html')
    expect(screen.getByRole('heading', { name: '3 logged today' })).toBeInTheDocument()
    expect(within(list()).getByRole('heading', { name: 'Joint Pain' })).toBeInTheDocument()
    expect(within(list()).getByRole('img', { name: 'Severity 4 of 5, severe' })).toBeInTheDocument()
    expect(list()).toHaveTextContent('Morning stiffness in right knee')
  })

  it('logs a new symptom at the top of the list', async () => {
    const { user } = renderApp('/symptoms.html')
    await user.click(screen.getByRole('button', { name: 'Add a symptom' }))
    expect(screen.getByLabelText('Symptom')).toHaveFocus()
    await user.type(screen.getByLabelText('Symptom'), 'Dizziness')
    await user.click(screen.getByRole('button', { name: '1, very mild' }))
    await user.type(screen.getByLabelText('Notes (optional)'), 'After standing up')
    await user.click(screen.getByRole('button', { name: 'Save symptom' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '4 logged today' })).toBeInTheDocument()
    expect(within(list()).getAllByRole('heading', { level: 3 })[0]).toHaveTextContent('Dizziness')
    expect(within(list()).getByRole('img', { name: 'Severity 1 of 5, very mild' })).toBeInTheDocument()
    expect(statusMessages().getByText('Symptom logged')).toBeInTheDocument()
  })

  it('asks for a name before saving', async () => {
    const { user } = renderApp('/symptoms.html')
    await user.click(screen.getByRole('button', { name: 'Add a symptom' }))
    await user.click(screen.getByRole('button', { name: 'Save symptom' }))
    const field = screen.getByLabelText('Symptom')
    expect(field).toHaveAttribute('aria-invalid', 'true')
    expect(field).toHaveAccessibleDescription(screen.getByRole('alert').textContent!)
    expect(screen.getByRole('heading', { name: '3 logged today' })).toBeInTheDocument()
  })

  it('closes the form with Cancel or Escape without saving', async () => {
    const { user } = renderApp('/symptoms.html')
    await user.click(screen.getByRole('button', { name: 'Add a symptom' }))
    await user.click(screen.getByRole('button', { name: 'Cancel' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Add a symptom' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: '3 logged today' })).toBeInTheDocument()
  })
})
