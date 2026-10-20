import { MedCard } from '../components/MedCard'
import { doses, meds } from '../data'

export function Medications() {
  return (
    <>
      <h2 className="sr-only">Today's doses</h2>
      <p className="mb-3 text-[13px] text-sub">{meds.length} active prescriptions</p>
      {/* One column on phone and tablet, two on desktop */}
      <ul className="grid gap-3 lg:grid-cols-2">
        {doses.map(d => (
          <MedCard key={d.key} dose={d} detailed />
        ))}
      </ul>
    </>
  )
}
