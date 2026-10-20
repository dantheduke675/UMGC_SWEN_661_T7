import { useState } from 'react'
import { useAppState } from '../appStateContext'
import type { Dose } from '../data'
import { ConfirmDialog } from './ConfirmDialog'

interface Props {
  dose: Dose
  // Medications page: category chip and a status stripe on the left edge
  detailed?: boolean
  className?: string
}

export function MedCard({ dose, detailed = false, className = '' }: Props) {
  const { doseLog, setDose, addToast } = useAppState()
  const [confirming, setConfirming] = useState(false)
  const status = doseLog[dose.key]
  const isTaken = status === true
  const isMissed = status === false
  const label = `${dose.name} ${dose.dose}, ${dose.time}`

  function markTaken() {
    if (isTaken) return
    const prev = status
    setDose(dose.key, true)
    addToast('Marked as taken', () => setDose(dose.key, prev))
  }
  function markMissed() {
    const prev = status
    setDose(dose.key, false)
    setConfirming(false)
    addToast('Marked as missed', () => setDose(dose.key, prev))
  }

  const stripe = isTaken ? 'border-l-brand' : isMissed ? 'border-l-danger' : 'border-l-line'

  return (
    <li className={`rounded-2xl border border-line bg-surface p-4 ${detailed ? `border-l-[5px] ${stripe}` : ''} ${className}`}>
      <div className="mb-4 flex items-start gap-3">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-xl" aria-hidden="true">💊</div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex flex-wrap items-center gap-2">
            <h3 className={`text-[15px] font-bold text-ink ${isTaken && !detailed ? 'opacity-65' : ''}`}>{dose.name}</h3>
            {detailed && (
              <span className="rounded-full bg-brand/15 px-2.5 py-1 text-xs font-bold text-taken">{dose.category}</span>
            )}
          </div>
          <p className="text-[13px] text-sub">
            {dose.dose} · {dose.time}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <button
          onClick={markTaken}
          aria-label={isTaken ? `${label}: taken` : `I took this: ${label}`}
          aria-disabled={isTaken || undefined}
          className={`h-[52px] w-full rounded-xl text-[15px] font-bold transition-all active:scale-95 ${
            isTaken ? 'bg-brand/15 text-taken' : 'bg-brand text-white'
          }`}
        >
          {isTaken ? '✓ Taken' : 'I took this'}
        </button>
        {!isTaken && (
          <button
            onClick={() => setConfirming(true)}
            aria-label={isMissed ? `${label}: missed` : `I missed this: ${label}`}
            className={`h-[52px] w-full rounded-xl border-2 border-danger/30 text-[15px] font-bold text-missed transition-all active:scale-95 ${
              isMissed ? 'bg-danger/10' : 'bg-danger/5'
            }`}
          >
            {isMissed ? '✗ Missed' : 'I missed this'}
          </button>
        )}
      </div>

      {confirming && (
        <ConfirmDialog
          message="Mark this dose as missed? Your caregiver will be notified."
          confirmLabel="Yes, I missed this dose"
          onConfirm={markMissed}
          onCancel={() => setConfirming(false)}
        />
      )}
    </li>
  )
}
