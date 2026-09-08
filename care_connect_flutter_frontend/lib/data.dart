// ── Shared data models and static data ───────────────────────────────────────

class Contact {
  final int id;
  final String name, role, initials;
  final int color; // ARGB hex
  const Contact({required this.id, required this.name, required this.role, required this.initials, required this.color});
}

class Med {
  final int id;
  final String name, dose, freq, category;
  final List<String> times;
  const Med({required this.id, required this.name, required this.dose, required this.freq, required this.category, required this.times});
}

class MedSlot {
  final Med med;
  final String time;
  final String key; // "${med.id}-${index}"
  const MedSlot({required this.med, required this.time, required this.key});
}

class ChatMessage {
  final String from; // 'me' | 'them'
  final String text, time;
  const ChatMessage({required this.from, required this.text, required this.time});
}

class Thread {
  final int id, contactId;
  // Mutable so opening the thread can clear it, and messages can persist
  // in-memory for the app session, even after leaving and re-entering the
  // thread screen.
  bool unread;
  final List<ChatMessage> messages;
  Thread({required this.id, required this.contactId, required this.unread, required this.messages});
}

// ── Static data ───────────────────────────────────────────────────────────────

const patient = (name: 'Maddy', full: 'Madison Hughes', initials: 'MH', email: 'maddy@example.com');

const contacts = [
  Contact(id: 1, name: 'Aunt Joyce',     role: 'Caregiver',  initials: 'AJ', color: 0xFF6366F1),
  Contact(id: 2, name: 'Dr. Sarah Chen', role: 'Physician',   initials: 'SC', color: 0xFF357C6F),
  Contact(id: 3, name: 'James Rivera',   role: 'Home Aide',   initials: 'JR', color: 0xFFF59E0B),
];

const meds = [
  Med(id: 1, name: 'Ropivacaine',          dose: '10 mg',          freq: 'Twice daily',       category: 'Pain',          times: ['8:00 AM', '8:00 PM']),
  Med(id: 2, name: 'Loratadip / Carbiopa', dose: '25 mg / 100 mg', freq: 'Three times daily',  category: 'Neurological',  times: ['7:00 AM', '12:00 PM', '8:00 PM']),
  Med(id: 3, name: 'Metformin',            dose: '500 mg',         freq: 'Twice daily',       category: 'Diabetes',      times: ['8:00 AM', '8:00 PM']),
  Med(id: 4, name: 'Lisinopril',           dose: '10 mg',          freq: 'Once daily',        category: 'Blood Pressure', times: ['8:00 AM']),
  Med(id: 5, name: 'Atorvastatin',         dose: '20 mg',          freq: 'Once daily',        category: 'Cholesterol',   times: ['8:00 PM']),
];

List<MedSlot> buildSlots() => [
  for (final m in meds)
    for (var i = 0; i < m.times.length; i++)
      MedSlot(med: m, time: m.times[i], key: '${m.id}-$i'),
];

// ── Shared dose status ───────────────────────────────────────────────────────
// Keyed by MedSlot.key. Shared (not per-screen) so marking a dose taken/missed
// on the Today screen or the Medications screen stays in sync on both.

enum SlotStatus { none, taken, missed }

final Map<String, SlotStatus> slotStatuses = {
  '1-0': SlotStatus.taken,
  '3-0': SlotStatus.taken,
};

final threads = [
  Thread(id: 1, contactId: 1, unread: true, messages: [
    ChatMessage(from: 'them', text: 'Hi Maddy, did you take your morning medications?',    time: '9:02 AM'),
    ChatMessage(from: 'me',   text: 'Yes! Just finished breakfast too.',                   time: '9:15 AM'),
    ChatMessage(from: 'them', text: "Great! Dr. Chen called — your afternoon appointment is still on for 2:30 PM.", time: '10:30 AM'),
    ChatMessage(from: 'them', text: 'We thank you. I have everything I need.',             time: '2:34 PM'),
  ]),
  Thread(id: 2, contactId: 2, unread: false, messages: [
    ChatMessage(from: 'them', text: 'Maddy, your lab results look great! Keep up the good work.', time: 'Mon'),
    ChatMessage(from: 'me',   text: 'Thank you Dr. Chen!',                                        time: 'Mon'),
  ]),
  Thread(id: 3, contactId: 3, unread: false, messages: [
    ChatMessage(from: 'them', text: 'Arrived for today\'s visit. All morning medications confirmed taken. BP was 128/82.', time: 'Yesterday'),
  ]),
];

Contact contactById(int id) => contacts.firstWhere((c) => c.id == id);
Thread  threadById(int id)  => threads.firstWhere((t) => t.id == id);
