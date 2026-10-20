// Fictional demo data from the CareConnect Figma design.
// Nothing here is fetched from or sent to a server.

export const patient = { name: 'Maddy', full: 'Madison Hughes', initials: 'MH', email: 'maddy@example.com' }

export const emergencyContact = { name: 'Aunt Joyce', role: 'Caregiver' }

export interface Med {
  id: number
  name: string
  dose: string
  freq: string
  times: string[]
  category: string
}

export const meds: Med[] = [
  { id: 1, name: 'Ropivacaine', dose: '10 mg', freq: 'Twice daily', times: ['8:00 AM', '8:00 PM'], category: 'Pain' },
  { id: 2, name: 'Loratadip / Carbiopa', dose: '25 mg / 100 mg', freq: 'Three times daily', times: ['7:00 AM', '12:00 PM', '8:00 PM'], category: 'Neurological' },
  { id: 3, name: 'Metformin', dose: '500 mg', freq: 'Twice daily', times: ['8:00 AM', '8:00 PM'], category: 'Diabetes' },
  { id: 4, name: 'Lisinopril', dose: '10 mg', freq: 'Once daily', times: ['8:00 AM'], category: 'Blood Pressure' },
  { id: 5, name: 'Atorvastatin', dose: '20 mg', freq: 'Once daily', times: ['8:00 PM'], category: 'Cholesterol' },
]

// One entry per scheduled dose; key is "<med id>-<time index>"
export interface Dose extends Med {
  key: string
  time: string
}

export const doses: Dose[] = meds.flatMap(m => m.times.map((time, i) => ({ ...m, time, key: `${m.id}-${i}` })))

// true = taken, false = missed, absent = not yet logged
export type DoseLog = Record<string, boolean | undefined>

export const initialDoseLog: DoseLog = { '1-0': true, '3-0': true }

export type ScheduleType = 'medication' | 'vitals' | 'appointment' | 'therapy'

export interface ScheduleItem {
  id: number
  title: string
  time: string
  duration: string
  type: ScheduleType
  done: boolean
}

export const schedule: ScheduleItem[] = [
  { id: 1, title: 'Morning Medications', time: '8:00 AM', duration: '5 min', type: 'medication', done: true },
  { id: 2, title: 'Blood Pressure Check', time: '9:00 AM', duration: '10 min', type: 'vitals', done: true },
  { id: 3, title: 'Dr. Chen — Follow-up', time: '2:30 PM', duration: '45 min', type: 'appointment', done: false },
  { id: 4, title: 'Physical Therapy', time: '4:00 PM', duration: '60 min', type: 'therapy', done: false },
  { id: 5, title: 'Evening Medications', time: '8:00 PM', duration: '5 min', type: 'medication', done: false },
]

export const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
