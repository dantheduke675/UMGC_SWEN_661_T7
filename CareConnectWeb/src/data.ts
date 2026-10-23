// Fictional demo data from the CareConnect Figma design.
// Nothing here is fetched from or sent to a server.

export const patient = { name: 'Maddy', full: 'Madison Hughes', initials: 'MH', email: 'maddy@example.com' }

// conversation: the Messages thread (and call screen) for this person
export const emergencyContact = { name: 'Aunt Joyce', full: 'Joyce Hughes', phone: '(555) 012-3456', role: 'Caregiver', conversation: 'joyce' }

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

export interface Message {
  from: 'me' | 'them'
  text: string
  time: string
}

export interface Conversation {
  id: string
  name: string
  initials: string
  role: string
  color: string
  // When the last message arrived, as the list shows it
  time: string
  unread: boolean
  messages: Message[]
}

export const conversations: Conversation[] = [
  {
    id: 'joyce',
    name: 'Aunt Joyce',
    initials: 'AJ',
    role: 'Caregiver',
    color: '#6366f1',
    time: '2:34 PM',
    unread: true,
    messages: [
      { from: 'them', text: 'Hi Maddy, did you take your morning medications?', time: '9:02 AM' },
      { from: 'me', text: 'Yes! Just finished breakfast too.', time: '9:15 AM' },
      { from: 'them', text: 'Great! Dr. Chen called — your afternoon appointment is still on for 2:30 PM.', time: '10:30 AM' },
      { from: 'them', text: 'We thank you. I have everything I need.', time: '2:34 PM' },
    ],
  },
  {
    id: 'chen',
    name: 'Dr. Sarah Chen',
    initials: 'SC',
    role: 'Physician',
    color: '#357c6f',
    time: 'Mon',
    unread: false,
    messages: [
      { from: 'them', text: 'Hi Maddy, your lab results came back and everything looks good.', time: 'Mon 10:12 AM' },
      { from: 'them', text: 'Keep taking the Metformin with breakfast. See you at the follow-up on Thursday at 2:30.', time: 'Mon 10:14 AM' },
      { from: 'me', text: 'Will do. Should I bring my blood pressure log?', time: 'Mon 10:40 AM' },
      { from: 'them', text: 'Yes please — the last two weeks is plenty.', time: 'Mon 10:52 AM' },
      { from: 'me', text: 'Thank you Dr. Chen!', time: 'Mon 11:02 AM' },
    ],
  },
  {
    id: 'james',
    name: 'James Rivera',
    initials: 'JR',
    role: 'Home Aide',
    color: '#f59e0b',
    time: 'Yesterday',
    unread: false,
    messages: [
      { from: 'me', text: 'Hi James, the side door is unlocked for you today.', time: 'Yesterday 8:40 AM' },
      { from: 'them', text: 'Thanks! On my way, see you around 9.', time: 'Yesterday 8:45 AM' },
      { from: 'them', text: "Arrived for today's visit. All morning medications confirmed taken. BP was 128/82.", time: 'Yesterday 9:20 AM' },
    ],
  },
  {
    id: 'pharmacy',
    name: 'Riverside Pharmacy',
    initials: 'RP',
    role: 'Pharmacy',
    color: '#ec4899',
    time: 'Oct 19',
    unread: false,
    messages: [
      { from: 'them', text: 'Your Atorvastatin 20 mg refill is ready for pickup.', time: 'Oct 19 11:05 AM' },
      { from: 'me', text: 'Thanks, Aunt Joyce will pick it up this afternoon.', time: 'Oct 19 11:30 AM' },
      { from: 'them', text: "Sounds good. We're open until 7 PM.", time: 'Oct 19 11:32 AM' },
    ],
  },
]

export interface Symptom {
  id: number
  name: string
  // 1 (mild) to 5 (severe)
  severity: number
  time: string
  note: string
}

export const initialSymptoms: Symptom[] = [
  { id: 1, name: 'Fatigue', severity: 3, time: '9:00 AM', note: 'Mild tiredness after breakfast' },
  { id: 2, name: 'Joint Pain', severity: 4, time: '7:15 AM', note: 'Morning stiffness in right knee' },
  { id: 3, name: 'Headache', severity: 2, time: '2:00 PM', note: 'Dull ache, resolved after rest' },
]

// Who looks after the patient; conversation links to their message thread
export const careTeam = [
  { name: 'Dr. Sarah Chen', role: 'Primary Physician', icon: '🩺', conversation: 'chen' },
  { name: 'James Rivera', role: 'Home Health Aide', icon: '🏠', conversation: 'james' },
  { name: 'Joyce Hughes', role: 'Caregiver / Family', icon: '❤️', conversation: 'joyce' },
]
