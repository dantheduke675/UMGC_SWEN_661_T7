import { useEffect } from 'react'
import { useAppState } from '../appStateContext'
import { useFocusTrap } from '../focus'

// Ctrl + H: every undoable action this visit, newest first
export function HistoryDialog({ onClose }: { onClose: () => void }) {
  const { history, undo } = useAppState()
  const ref = useFocusTrap<HTMLDivElement>()

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div
        ref={ref}
        role="dialog"
        aria-modal="true"
        aria-labelledby="history-title"
        aria-describedby="history-intro"
        className="max-h-[90%] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-6"
      >
        <h2 id="history-title" className="text-xl font-bold text-ink">Action history</h2>
        <p id="history-intro" className="mt-1 mb-4 text-sm text-sub">
          Undo any action from this visit. Ctrl + U undoes the latest one.
        </p>
        {history.length === 0 ? (
          <p className="mb-5 rounded-2xl bg-surface-2 p-4 text-ink">No actions yet.</p>
        ) : (
          <ol className="mb-5 divide-y divide-line overflow-hidden rounded-2xl border border-line" aria-label="Actions, newest first">
            {history.map(h => (
              <li key={h.id} className="flex min-h-16 items-center gap-3 px-4 py-2">
                <div className="min-w-0 flex-1">
                  <p className={`font-bold text-ink ${h.undone ? 'line-through opacity-65' : ''}`}>{h.msg}</p>
                  <p className="text-sm text-sub">
                    {h.time}
                    {h.undone && ' · undone'}
                  </p>
                </div>
                {!h.undone && (
                  <button onClick={() => undo(h.id)} aria-label={`Undo: ${h.msg}`} className="h-11 shrink-0 rounded-xl bg-brand px-4 text-sm font-bold text-white">
                    Undo
                  </button>
                )}
              </li>
            ))}
          </ol>
        )}
        <button onClick={onClose} autoFocus className="h-14 w-full rounded-2xl bg-surface-2 text-base font-bold text-ink">
          Close
        </button>
      </div>
    </div>
  )
}
