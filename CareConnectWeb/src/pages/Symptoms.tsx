import { useEffect, useRef, useState, type FormEvent } from 'react'
import { useAppState } from '../appStateContext'
import { useFocusTrap } from '../focus'

const SEVERITY_LABELS = ['Very mild', 'Mild', 'Moderate', 'Severe', 'Very severe']

// Green for mild, amber for moderate, red for severe (as in the design)
const severityColor = (n: number) => (n <= 2 ? 'bg-[#22c55e]' : n === 3 ? 'bg-[#f59e0b]' : 'bg-[#ef4444]')

function SeverityBar({ severity }: { severity: number }) {
  return (
    <div className="my-4 flex gap-2" role="img" aria-label={`Severity ${severity} of 5, ${SEVERITY_LABELS[severity - 1].toLowerCase()}`}>
      {[1, 2, 3, 4, 5].map(i => (
        <span key={i} className={`h-2.5 flex-1 rounded-full ${i <= severity ? severityColor(severity) : 'bg-surface-2'}`} />
      ))}
    </div>
  )
}

export function Symptoms() {
  const { symptoms } = useAppState()
  const [adding, setAdding] = useState(false)

  return (
    <>
      <div className="mb-4 flex items-center justify-between gap-3">
        <h2 className="text-[15px] text-sub">{symptoms.length} logged today</h2>
        <button onClick={() => setAdding(true)} aria-label="Add a symptom" className="h-12 rounded-xl bg-brand px-5 font-bold text-white transition-all active:scale-95">
          <span aria-hidden="true">+ Add</span>
        </button>
      </div>

      <ul className="grid gap-4 lg:grid-cols-2" aria-label="Symptoms logged today">
        {symptoms.map(s => (
          <li key={s.id} className="rounded-2xl border border-line bg-surface p-5">
            <div className="flex items-baseline justify-between gap-3">
              <h3 className="text-lg font-bold text-ink">{s.name}</h3>
              <p className="shrink-0 text-sm text-sub">{s.time}</p>
            </div>
            <SeverityBar severity={s.severity} />
            {s.note && <p className="text-[15px] text-sub">{s.note}</p>}
          </li>
        ))}
      </ul>

      {adding && <AddSymptomDialog onClose={() => setAdding(false)} />}
    </>
  )
}

function AddSymptomDialog({ onClose }: { onClose: () => void }) {
  const { addSymptom, removeSymptom, addToast } = useAppState()
  const [name, setName] = useState('')
  const [severity, setSeverity] = useState(2)
  const [note, setNote] = useState('')
  const [error, setError] = useState('')
  const nameRef = useRef<HTMLInputElement>(null)
  const ref = useFocusTrap<HTMLDivElement>()

  useEffect(() => {
    nameRef.current?.focus()
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  function save(e: FormEvent) {
    e.preventDefault()
    if (!name.trim()) {
      setError('Enter the symptom, for example "Headache".')
      nameRef.current?.focus()
      return
    }
    const time = new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
    const id = addSymptom({ name: name.trim(), severity, note: note.trim(), time })
    addToast('Symptom logged', () => removeSymptom(id))
    onClose()
  }

  const field = 'auth-input w-full rounded-xl border-2 bg-surface-2 px-4 text-[15px] text-ink placeholder:text-muted'

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="add-symptom-title" className="max-h-[90%] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-6">
        <form onSubmit={save} noValidate className="flex flex-col gap-4">
          <h2 id="add-symptom-title" className="text-xl font-bold text-ink">Log a symptom</h2>

          <div>
            <label htmlFor="symptom-name" className="mb-1.5 block text-sm font-bold text-ink">Symptom</label>
            <input
              id="symptom-name"
              ref={nameRef}
              value={name}
              onChange={e => {
                setName(e.target.value)
                setError('')
              }}
              aria-invalid={error ? true : undefined}
              aria-describedby={error ? 'symptom-error' : undefined}
              placeholder="e.g. Headache"
              className={`${field} h-14 ${error ? 'border-danger' : 'border-line-input'}`}
            />
            {error && (
              <p id="symptom-error" role="alert" className="mt-1.5 text-sm font-semibold text-missed">{error}</p>
            )}
          </div>

          <fieldset>
            <legend className="mb-1.5 text-sm font-bold text-ink">How severe? {SEVERITY_LABELS[severity - 1]}</legend>
            <div className="grid grid-cols-5 gap-2">
              {[1, 2, 3, 4, 5].map(n => (
                <button
                  key={n}
                  type="button"
                  onClick={() => setSeverity(n)}
                  aria-pressed={n === severity}
                  aria-label={`${n}, ${SEVERITY_LABELS[n - 1].toLowerCase()}`}
                  className={`h-14 rounded-xl border-2 text-lg font-bold transition-all active:scale-95 ${
                    n === severity ? `${severityColor(n)} border-transparent text-[#0e131d]` : 'border-line bg-surface-2 text-ink'
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </fieldset>

          <div>
            <label htmlFor="symptom-note" className="mb-1.5 block text-sm font-bold text-ink">Notes (optional)</label>
            <textarea id="symptom-note" value={note} onChange={e => setNote(e.target.value)} rows={3} className={`${field} border-line-input py-3`} />
          </div>

          <div className="flex flex-col gap-3 sm:flex-row-reverse">
            <button type="submit" className="h-14 flex-1 rounded-2xl bg-brand text-base font-bold text-white">Save symptom</button>
            <button type="button" onClick={onClose} className="h-14 flex-1 rounded-2xl bg-surface-2 text-base font-bold text-ink">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}
