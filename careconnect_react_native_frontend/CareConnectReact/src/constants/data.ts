// Shared data models and static data — mirrors Flutter's data.dart

export interface Contact {
  id:       number;
  name:     string;
  role:     string;
  initials: string;
  color:    string; // hex color string e.g. '#6366F1'
}

export interface Med {
  id:       number;
  name:     string;
  dose:     string;
  freq:     string;
  category: string;
  times:    string[];
}

export interface MedSlot {
  med:  Med;
  time: string;
  key:  string; // `${med.id}-${index}`
}

export interface ChatMessage {
  from: 'me' | 'them';
  text: string;
  time: string;
}

export interface Thread {
  id:        number;
  contactId: number;
  unread:    boolean;
  messages:  ChatMessage[];
}

// ── Static data ───────────────────────────────────────────────────────────────

export const patient = {
  name:     'Maddy',
  full:     'Madison Hughes',
  initials: 'MH',
};

export const contacts: Contact[] = [
  { id: 1, name: 'Aunt Joyce',     role: 'Caregiver',  initials: 'AJ', color: '#6366F1' },
  { id: 2, name: 'Dr. Sarah Chen', role: 'Physician',   initials: 'SC', color: '#357C6F' },
  { id: 3, name: 'James Rivera',   role: 'Home Aide',   initials: 'JR', color: '#F59E0B' },
];

export const meds: Med[] = [
  { id: 1, name: 'Ropivacaine',           dose: '10 mg',          freq: 'Twice daily',      category: 'Pain',          times: ['8:00 AM', '8:00 PM'] },
  { id: 2, name: 'Loratadip / Carbiopa',  dose: '25 mg / 100 mg', freq: 'Three times daily', category: 'Neurological',  times: ['7:00 AM', '12:00 PM', '8:00 PM'] },
  { id: 3, name: 'Metformin',             dose: '500 mg',         freq: 'Twice daily',      category: 'Diabetes',      times: ['8:00 AM', '8:00 PM'] },
  { id: 4, name: 'Lisinopril',            dose: '10 mg',          freq: 'Once daily',       category: 'Blood Pressure', times: ['8:00 AM'] },
  { id: 5, name: 'Atorvastatin',          dose: '20 mg',          freq: 'Once daily',       category: 'Cholesterol',   times: ['8:00 PM'] },
];

export function buildSlots(): MedSlot[] {
  const slots: MedSlot[] = [];
  for (const med of meds) {
    med.times.forEach((time, i) => {
      slots.push({ med, time, key: `${med.id}-${i}` });
    });
  }
  return slots;
}

export const threads: Thread[] = [
  {
    id: 1, contactId: 1, unread: true,
    messages: [
      { from: 'them', text: 'Hi Maddy, did you take your morning medications?',                                     time: '9:02 AM'  },
      { from: 'me',   text: 'Yes! Just finished breakfast too.',                                                    time: '9:15 AM'  },
      { from: 'them', text: "Great! Dr. Chen called — your afternoon appointment is still on for 2:30 PM.",        time: '10:30 AM' },
      { from: 'them', text: 'We thank you. I have everything I need.',                                             time: '2:34 PM'  },
    ],
  },
  {
    id: 2, contactId: 2, unread: false,
    messages: [
      { from: 'them', text: 'Maddy, your lab results look great! Keep up the good work.', time: 'Mon' },
      { from: 'me',   text: 'Thank you Dr. Chen!',                                        time: 'Mon' },
    ],
  },
  {
    id: 3, contactId: 3, unread: false,
    messages: [
      { from: 'them', text: "Arrived for today's visit. All morning medications confirmed taken. BP was 128/82.", time: 'Yesterday' },
    ],
  },
];

export const contactById = (id: number): Contact =>
  contacts.find(c => c.id === id)!;

export const threadById = (id: number): Thread =>
  threads.find(t => t.id === id)!;
