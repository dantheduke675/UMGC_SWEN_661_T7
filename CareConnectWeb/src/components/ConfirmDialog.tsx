import { useEffect, useRef } from 'react'
import { useFocusTrap } from '../focus'
import { useEscapeKey } from '../hooks'

interface Props {
  message: string
  confirmLabel: string
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({ message, confirmLabel, onConfirm, onCancel }: Props) {
  const cancelRef = useRef<HTMLButtonElement>(null)
  const ref = useFocusTrap<HTMLDivElement>()

  // Start on the safe choice; Escape cancels
  useEffect(() => cancelRef.current?.focus(), [])
  useEscapeKey(onCancel)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-6 backdrop-blur-sm">
      <div
        ref={ref}
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-msg"
        className="flex w-full max-w-sm flex-col gap-5 rounded-3xl border border-line bg-surface p-6"
      >
        <p id="confirm-msg" className="text-center text-base font-semibold text-ink">{message}</p>
        <div className="flex flex-col gap-3">
          <button onClick={onConfirm} className="h-14 w-full rounded-2xl bg-danger text-base font-bold text-white">
            {confirmLabel}
          </button>
          <button ref={cancelRef} onClick={onCancel} className="h-14 w-full rounded-2xl bg-surface-2 text-base font-bold text-ink">
            Cancel — go back
          </button>
        </div>
      </div>
    </div>
  )
}
