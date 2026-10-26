import { act, screen, within } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { findDialog, renderApp, statusMessages } from './utils'

const thread = (name: string) => screen.getByRole('list', { name: `Messages with ${name}` })

describe('Messages page', () => {
  it('lists each conversation with role, last message and time', async () => {
    await renderApp('/messages.html')
    const joyce = screen.getByRole('button', { name: /^Aunt Joyce, unread/ })
    expect(joyce).toHaveTextContent('Caregiver')
    expect(joyce).toHaveTextContent('We thank you. I have everything I need.')
    expect(joyce).toHaveTextContent('2:34 PM')
    expect(screen.getByRole('button', { name: /^Dr\. Sarah Chen/ })).toHaveTextContent('You: Thank you Dr. Chen!')
    expect(screen.getByRole('button', { name: /^James Rivera/ })).toHaveTextContent('BP was 128/82')
    expect(screen.getByRole('button', { name: /^Riverside Pharmacy/ })).toHaveTextContent('Oct 19')
  })

  it('opens a conversation full-page, marks it read and goes back', async () => {
    const { user } = await renderApp('/messages.html')
    await user.click(screen.getByRole('button', { name: /^Aunt Joyce/ }))
    expect(screen.getByRole('heading', { level: 1, name: 'Conversation' })).toBeInTheDocument()
    expect(screen.getByRole('heading', { level: 2, name: 'Aunt Joyce' })).toBeInTheDocument()
    expect(within(thread('Aunt Joyce')).getAllByRole('listitem')).toHaveLength(4)
    expect(thread('Aunt Joyce')).toHaveTextContent('Dr. Chen called')
    // The conversation brings its own reply box instead of the scroll bar
    expect(screen.queryByRole('button', { name: /Scroll down/ })).not.toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Back to all messages' }))
    expect(screen.getByRole('heading', { level: 1, name: 'Messages' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /^Aunt Joyce/ })).not.toHaveAccessibleName(/unread/)
  })

  it('sends a typed reply and ignores an empty one', async () => {
    const { user } = await renderApp('/messages.html?c=chen')
    const before = within(thread('Dr. Sarah Chen')).getAllByRole('listitem').length
    await user.click(screen.getByRole('button', { name: 'Send' }))
    expect(within(thread('Dr. Sarah Chen')).getAllByRole('listitem')).toHaveLength(before)
    await user.type(screen.getByLabelText('Reply to Dr. Sarah Chen'), 'See you Thursday{Enter}')
    expect(within(thread('Dr. Sarah Chen')).getAllByRole('listitem')).toHaveLength(before + 1)
    expect(thread('Dr. Sarah Chen')).toHaveTextContent('See you Thursday')
    expect(screen.getByLabelText('Reply to Dr. Sarah Chen')).toHaveValue('')
  })

  it('sends a quick reply with one tap', async () => {
    const { user } = await renderApp('/messages.html?c=james')
    const quick = screen.getByRole('group', { name: 'Quick replies' })
    await user.click(within(quick).getByRole('button', { name: 'I took my medications' }))
    expect(within(thread('James Rivera')).getAllByRole('listitem').at(-1)).toHaveTextContent('You said:I took my medications')
  })
})

describe('Call screen', () => {
  it('calls from a conversation, counts the time, mutes and hangs up', async () => {
    // Only the call clock is faked; everything else runs normally
    vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
    const { user } = await renderApp('/messages.html?c=joyce')
    await user.click(screen.getByRole('button', { name: 'Call Aunt Joyce' }))
    const call = await findDialog('Aunt Joyce')
    expect(call).toHaveTextContent('Calling')
    expect(call).toHaveTextContent('Caregiver')
    expect(within(call).getByRole('button', { name: 'End call' })).toHaveFocus()

    act(() => vi.advanceTimersByTime(4000))
    expect(within(call).getByRole('timer', { name: 'Call length' })).toHaveTextContent('00:04')

    const mute = within(call).getByRole('button', { name: 'Mute' })
    await user.click(mute)
    expect(mute).toHaveAttribute('aria-pressed', 'true')
    const speaker = within(call).getByRole('button', { name: 'Speaker' })
    await user.click(speaker)
    expect(speaker).toHaveAttribute('aria-pressed', 'true')

    await user.click(within(call).getByRole('button', { name: 'End call' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(statusMessages().getByText('Call with Aunt Joyce ended · 00:04 (demo — no call was placed)')).toBeInTheDocument()
  })

  it('hangs up with Escape', async () => {
    const { user } = await renderApp('/messages.html?c=chen')
    await user.click(screen.getByRole('button', { name: 'Call Dr. Sarah Chen' }))
    await user.keyboard('{Escape}')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })
})
