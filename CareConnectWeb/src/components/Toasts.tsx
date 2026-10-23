import { useEffect } from 'react'
import { useAppState, type Toast } from '../appStateContext'

function UndoToast({ toast, onDismiss }: { toast: Toast; onDismiss: (id: number) => void }) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(toast.id), 5000)
    return () => clearTimeout(t)
  }, [toast.id, onDismiss])

  return (
    <div className="flex max-w-[360px] min-w-[280px] items-center justify-between gap-4 rounded-2xl bg-[#1d2534] px-5 py-4 text-[#f5f7fa] shadow-lg">
      <span className="text-sm font-semibold">{toast.msg}</span>
      {toast.onUndo && (
        <button
          onClick={() => {
            toast.onUndo?.()
            onDismiss(toast.id)
          }}
          className="min-h-9 shrink-0 rounded-xl bg-brand px-3 py-1.5 text-sm font-bold text-white pointer-coarse:min-h-12 pointer-coarse:px-4"
        >
          Undo
        </button>
      )}
    </div>
  )
}

// Sits above the phone/tablet access bar
export function Toasts() {
  const { toasts, dismissToast } = useAppState()
  return (
    <div role="status" aria-live="polite" className="fixed bottom-44 left-1/2 z-40 flex -translate-x-1/2 flex-col items-center gap-2 lg:bottom-6">
      {toasts.map(t => (
        <UndoToast key={t.id} toast={t} onDismiss={dismissToast} />
      ))}
    </div>
  )
}
