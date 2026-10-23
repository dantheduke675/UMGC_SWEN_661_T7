import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useSearchParams } from 'react-router'
import { useAppState } from '../appStateContext'
import type { Conversation } from '../data'

function PersonAvatar({ c, size = 60 }: { c: Conversation; size?: number }) {
  return (
    <div
      className="relative flex shrink-0 items-center justify-center rounded-full font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.34, background: c.color }}
      aria-hidden="true"
    >
      {c.initials}
      {c.unread && <span className="absolute top-0 right-0 size-3.5 rounded-full border-2 border-bg bg-sos" />}
    </div>
  )
}

/*
  The conversation list; ?c=<id> opens one conversation (the Account page's
  care team links there too). Opening a conversation marks it read, and the
  shell gives it the full page height (see AppShell).
*/
export function Messages() {
  const { conversations, readConversation } = useAppState()
  const [params, setParams] = useSearchParams()
  const open = conversations.find(c => c.id === params.get('c'))

  useEffect(() => {
    if (open?.unread) readConversation(open.id)
  }, [open, readConversation])

  if (open) return <Thread c={open} onBack={() => setParams({})} />

  return (
    <>
      <h2 className="sr-only">Conversations</h2>
      <ul>
        {conversations.map(c => {
          const last = c.messages.at(-1)
          return (
            <li key={c.id} className="border-b border-line">
              <button
                onClick={() => setParams({ c: c.id })}
                className="flex w-full items-start gap-4 rounded-xl py-5 text-left hover:bg-surface/60"
              >
                <PersonAvatar c={c} />
                <div className="min-w-0 flex-1">
                  <div className="flex items-baseline justify-between gap-3">
                    <p className="text-[17px] font-bold text-ink">
                      {c.name}
                      {c.unread && <span className="sr-only">, unread</span>}
                    </p>
                    <p className="shrink-0 text-sm text-sub">{c.time}</p>
                  </div>
                  <p className="text-[15px] font-semibold text-sub">{c.role}</p>
                  <p className={`mt-0.5 text-[15px] ${c.unread ? 'font-semibold text-ink' : 'text-sub'}`}>
                    {last?.from === 'me' && 'You: '}
                    {last?.text}
                  </p>
                </div>
              </button>
            </li>
          )
        })}
      </ul>
    </>
  )
}


// One-tap replies (tremor-friendly: no typing needed)
const QUICK_REPLIES = ['Thank you!', 'I took my medications', "I'm feeling well", 'Call me please']

// Fills the page: header with a call button, scrolling messages, quick replies and the reply box
function Thread({ c, onBack }: { c: Conversation; onBack: () => void }) {
  const { sendMessage, startCall } = useAppState()
  const [draft, setDraft] = useState('')
  const listRef = useRef<HTMLUListElement>(null)

  // Keep the newest message in view
  useEffect(() => {
    const list = listRef.current
    if (list) list.scrollTop = list.scrollHeight
  }, [c.messages.length])

  function send(e: FormEvent) {
    e.preventDefault()
    const text = draft.trim()
    if (!text) return
    sendMessage(c.id, text)
    setDraft('')
  }

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-surface px-3 py-3 md:gap-4 md:px-6">
        <button onClick={onBack} aria-label="Back to all messages" title="All messages" className="grid size-12 shrink-0 place-items-center rounded-xl text-2xl text-link hover:bg-surface-2">
          <span aria-hidden="true">←</span>
        </button>
        <PersonAvatar c={c} size={48} />
        <div className="min-w-0 flex-1">
          <h2 className="truncate text-lg font-bold text-ink">{c.name}</h2>
          <p className="text-sm text-sub">{c.role}</p>
        </div>
        <button
          onClick={() => startCall(c.id)}
          aria-label={`Call ${c.name}`}
          title={`Call ${c.name}`}
          className="grid size-14 shrink-0 place-items-center rounded-full bg-brand text-2xl transition-all active:scale-95"
        >
          <span aria-hidden="true">📞</span>
        </button>
      </div>

      <ul ref={listRef} className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 py-5 md:px-6" aria-label={`Messages with ${c.name}`}>
        {c.messages.map((m, i) => {
          const mine = m.from === 'me'
          return (
            <li key={i} className={`flex max-w-[85%] flex-col md:max-w-[70%] ${mine ? 'items-end self-end' : 'items-start self-start'}`}>
              <p className="sr-only">{mine ? 'You' : c.name} said:</p>
              <p className={`rounded-2xl px-5 py-3.5 text-base font-medium ${mine ? 'bg-brand text-white' : 'border border-line bg-surface text-ink'}`}>{m.text}</p>
              <p className="mt-1.5 px-1 text-xs text-sub">{m.time}</p>
            </li>
          )
        })}
      </ul>

      <div className="flex shrink-0 gap-2 overflow-x-auto px-4 pb-3 md:px-6" role="group" aria-label="Quick replies">
        {QUICK_REPLIES.map(r => (
          <button
            key={r}
            onClick={() => sendMessage(c.id, r)}
            className="h-12 shrink-0 rounded-xl border border-line bg-surface px-4 text-sm font-semibold whitespace-nowrap text-sub transition-all hover:text-ink active:scale-95"
          >
            {r}
          </button>
        ))}
      </div>

      <form onSubmit={send} className="flex shrink-0 items-center gap-3 border-t border-line bg-surface px-4 py-3 pb-[max(12px,env(safe-area-inset-bottom))] md:px-6">
        <label htmlFor="reply" className="sr-only">
          Reply to {c.name}
        </label>
        <input
          id="reply"
          value={draft}
          onChange={e => setDraft(e.target.value)}
          placeholder="Type a message…"
          autoComplete="off"
          className="auth-input h-14 min-w-0 flex-1 rounded-xl border-2 border-transparent bg-surface-2 px-4 text-base text-ink placeholder:text-muted"
        />
        <button type="submit" aria-label="Send" className="grid size-14 shrink-0 place-items-center rounded-full bg-brand text-2xl font-bold text-white transition-all active:scale-95">
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </div>
  )
}
