import { useState } from 'react'
import { Link } from 'react-router'
import { useAppState } from '../appStateContext'
import { MedCard } from '../components/MedCard'
import { doses, patient } from '../data'

function greetingNow() {
  const now = new Date()
  const hour = now.getHours()
  return {
    date: now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }),
    greeting: hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening',
  }
}

export function Today() {
  const { doseLog } = useAppState()
  // Read the clock once, when the page mounts
  const [{ date, greeting }] = useState(greetingNow)
  const taken = doses.filter(d => doseLog[d.key] === true).length
  const pct = Math.round((taken / doses.length) * 100)

  return (
    <>
      <p className="mb-1 text-xs font-bold tracking-wider text-taken uppercase">{date}</p>
      <h2 className="text-2xl font-bold text-ink">
        {greeting}, {patient.name} <span aria-hidden="true">👋</span>
      </h2>

      <div className="mt-5 mb-5 flex items-center gap-4 rounded-2xl bg-brand p-5">
        <div className="flex-1">
          <p className="text-[11px] font-bold tracking-wide text-white/80 uppercase">Today's medications</p>
          <p className="mt-1 text-xl font-bold text-white">
            {taken} of {doses.length} taken
          </p>
          <div
            className="mt-3 h-2 rounded-full bg-white/25"
            role="progressbar"
            aria-label="Medications taken today"
            aria-valuenow={pct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuetext={`${taken} of ${doses.length} taken`}
          >
            <div className="h-full rounded-full bg-white transition-all" style={{ width: `${pct}%` }} />
          </div>
        </div>
        <p className="shrink-0 text-[40px] font-bold text-white" aria-hidden="true">{pct}%</p>
      </div>

      <section aria-labelledby="today-meds" className="mb-3">
        <div className="mb-3 flex items-baseline justify-between">
          <h2 id="today-meds" className="text-base font-bold text-ink">Medications</h2>
          <Link to="/medications.html" className="text-sm font-bold text-link">See all {doses.length}</Link>
        </div>
        {/* 4 doses on phone and tablet, 6 in two columns on desktop */}
        <ul className="grid gap-3 lg:grid-cols-2">
          {doses.slice(0, 6).map((d, i) => (
            <MedCard key={d.key} dose={d} className={i >= 4 ? 'max-lg:hidden' : ''} />
          ))}
        </ul>
      </section>

      <Link to="/schedule.html" className="mt-3 flex items-center gap-4 rounded-2xl border border-line bg-surface p-4 hover:bg-surface-2">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-indigo/15 text-xl" aria-hidden="true">🏥</div>
        <div>
          <p className="text-[15px] font-bold text-ink">Dr. Chen — Follow-up</p>
          <p className="text-[13px] text-sub">Today at 2:30 PM · 45 min</p>
        </div>
      </Link>
    </>
  )
}
