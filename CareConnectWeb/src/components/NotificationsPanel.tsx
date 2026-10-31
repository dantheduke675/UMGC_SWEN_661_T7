import { useEffect, useRef, useState, type HTMLAttributes } from 'react'
import { Link } from 'react-router'
import { useAppState } from '../appStateContext'
import { doses, schedule } from '../data'
import { focusables } from '../focus'
import { useClickOutside, useEscapeKey } from '../hooks'

// "8:00 PM" -> minutes after midnight, so doses can be put in time order
function minutesOf(time: string) {
  const [, h, m, pm] = /^(\d{1,2}):(\d{2}) (AM|PM)$/.exec(time) ?? []
  return ((Number(h) % 12) + (pm === 'PM' ? 12 : 0)) * 60 + Number(m)
}
const dosesByTime = [...doses].sort((a, b) => minutesOf(a.time) - minutesOf(b.time))

/*
  Top bar bell (as in the desktop app): a panel with what needs attention now,
  built from the live dose log, schedule and messages. Ctrl + N turns
  notifications on and off.
*/
export function NotificationsButton() {
  const { prefs, togglePref, doseLog, conversations } = useAppState()
  const [open, setOpen] = useState(false)
  const close = () => setOpen(false)
  const ref = useClickOutside<HTMLDivElement>(close, open)
  const bell = useRef<HTMLButtonElement>(null)
  // Escape also puts focus back on the bell, so it isn't lost with the panel
  useEscapeKey(() => {
    close()
    bell.current?.focus()
  }, open)

  const nextDose = dosesByTime.find(d => doseLog[d.key] === undefined)
  const nextVisit = schedule.find(s => s.type === 'appointment' && !s.done)
  const unread = conversations.filter(c => c.unread)
  const notes = [
    nextDose && { to: '/medications.html', title: 'Medication due', text: `${nextDose.name} ${nextDose.dose} at ${nextDose.time}` },
    nextVisit && { to: '/schedule.html', title: 'Appointment today', text: `${nextVisit.title} at ${nextVisit.time}` },
    ...unread.map(c => ({ to: `/messages.html?c=${c.id}`, title: 'New message', text: `${c.name}: ${c.messages.at(-1)?.text ?? ''}` })),
  ].filter(n => !!n)
  const count = prefs.notifications ? notes.length : 0

  return (
    <div ref={ref} className="relative">
      <button
        ref={bell}
        onClick={() => setOpen(o => !o)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={prefs.notifications ? `Notifications, ${count} new` : 'Notifications, turned off'}
        title="Notifications (Ctrl + N turns them on or off)"
        className="relative flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-lg transition-all active:scale-90 pointer-coarse:size-12"
      >
        <span aria-hidden="true">{prefs.notifications ? '🔔' : '🔕'}</span>
        {count > 0 && (
          <span className="absolute -top-1 -right-1 grid size-5 place-items-center rounded-full bg-danger text-[11px] font-bold text-white" aria-hidden="true">
            {count}
          </span>
        )}
      </button>
      {open && (
        <Panel
          role="dialog"
          aria-labelledby="notes-title"
          className="absolute top-[calc(100%+8px)] right-0 z-30 w-[min(320px,calc(100vw-24px))] rounded-[14px] border border-line bg-surface p-3 text-ink shadow-xl"
        >
          <h2 id="notes-title" className="mb-2 px-1 text-base font-bold">Notifications</h2>
          {!prefs.notifications ? (
            <>
              <p className="mb-3 rounded-xl bg-surface-2 p-3 text-sm">Notifications are turned off.</p>
              <button onClick={() => togglePref('notifications')} className="h-12 w-full rounded-xl bg-brand font-bold text-white">
                Turn on notifications
              </button>
            </>
          ) : notes.length === 0 ? (
            <p className="rounded-xl bg-surface-2 p-3 text-sm">You're all caught up.</p>
          ) : (
            <ul className="flex flex-col gap-2" aria-label={`${notes.length} notifications`}>
              {notes.map(n => (
                <li key={n.to}>
                  <Link to={n.to} onClick={close} className="block min-h-12 rounded-xl bg-surface-2 p-3 hover:bg-brand/15">
                    <span className="block text-sm font-bold">{n.title}</span>
                    <span className="block truncate text-sm text-sub">{n.text}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      )}
    </div>
  )
}

// Moves focus to its first control when it opens
function Panel(props: HTMLAttributes<HTMLDivElement>) {
  const ref = useRef<HTMLDivElement>(null)
  useEffect(() => {
    if (ref.current) focusables(ref.current)[0]?.focus()
  }, [])
  return <div ref={ref} {...props} />
}
