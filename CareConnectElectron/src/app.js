'use strict'

/* ============================================================
   CareConnect Desktop - renderer
   Screen order (from the Figma document):
   Landing -> Sign in -> Create account -> Biometrics (Face ID
   prompt) -> Face sign in -> Today -> Medications -> Symptoms
   -> Call -> Account -> Messages -> Schedule
   ============================================================ */

// ---------- Icons (inline SVG, stroke = currentColor) ----------
const svg = (d, size = 20) =>
  `<svg class="icon" width="${size}" height="${size}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${d}</svg>`

const I = {
  mic: s => svg('<rect x="9" y="2" width="6" height="12" rx="3"/><path d="M19 10v1a7 7 0 0 1-14 0v-1"/><line x1="12" y1="18" x2="12" y2="22"/>', s),
  eye: s => svg('<path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', s),
  bell: s => svg('<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>', s),
  chevL: s => svg('<polyline points="15 18 9 12 15 6"/>', s),
  chevR: s => svg('<polyline points="9 18 15 12 9 6"/>', s),
  arrowL: s => svg('<line x1="19" y1="12" x2="5" y2="12"/><polyline points="12 19 5 12 12 5"/>', s),
  moon: s => svg('<path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z"/>', s),
  sun: s => svg('<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>', s),
  lock: s => svg('<rect x="4" y="11" width="16" height="10" rx="2"/><path d="M8 11V7a4 4 0 0 1 8 0v4"/>', s),
  share: s => svg('<circle cx="18" cy="5" r="3"/><circle cx="6" cy="12" r="3"/><circle cx="18" cy="19" r="3"/><line x1="8.6" y1="13.5" x2="15.4" y2="17.5"/><line x1="15.4" y1="6.5" x2="8.6" y2="10.5"/>', s),
  info: s => svg('<circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>', s),
  file: s => svg('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="9" y1="13" x2="15" y2="13"/><line x1="9" y1="17" x2="15" y2="17"/>', s),
  logout: s => svg('<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/>', s),
  message: s => svg('<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>', s),
  phone: s => svg('<path d="M22 16.9v3a2 2 0 0 1-2.2 2 19.8 19.8 0 0 1-8.6-3.1 19.5 19.5 0 0 1-6-6A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8a16 16 0 0 0 6 6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2z"/>', s),
  send: s => svg('<line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/>', s),
  calendar: s => svg('<rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>', s),
  clock: s => svg('<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>', s),
  pulse: s => svg('<polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/>', s),
  plus: s => svg('<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>', s),
  volume: s => svg('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/><path d="M19 5a10 10 0 0 1 0 14"/>', s),
  speaker: s => svg('<polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.5 8.5a5 5 0 0 1 0 7"/>', s),
  micOff: s => svg('<line x1="2" y1="2" x2="22" y2="22"/><path d="M9 9v2a3 3 0 0 0 5.1 2.1"/><path d="M15 9.3V5a3 3 0 0 0-5.9-.6"/><path d="M19 10v1a7 7 0 0 1-1.1 3.8M5 10v1a7 7 0 0 0 12 5"/><line x1="12" y1="18" x2="12" y2="22"/>', s),
  endCall: s => svg('<path d="M10.7 13.3a16 16 0 0 0 3.4 2.6l1.3-1.3a2 2 0 0 1 2.1-.4c.9.3 1.8.6 2.7.7a2 2 0 0 1 1.7 2v3a2 2 0 0 1-2.2 2A19.8 19.8 0 0 1 2.1 4.2 2 2 0 0 1 4.1 2h3a2 2 0 0 1 2 1.7c.1.9.4 1.8.7 2.7a2 2 0 0 1-.5 2.1L8 9.8"/><line x1="22" y1="2" x2="2" y2="22"/>', s)
}

// ---------- Helpers ----------
const $ = sel => document.querySelector(sel)
const esc = str => String(str).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]))

const store = {
  get(key, fallback) {
    try { const v = localStorage.getItem('cc.' + key); return v === null ? fallback : JSON.parse(v) } catch { return fallback }
  },
  set(key, value) {
    try { localStorage.setItem('cc.' + key, JSON.stringify(value)) } catch { /* ignore */ }
  }
}

let toastTimer
function toast(msg) {
  const el = $('#toast')
  el.textContent = msg
  el.classList.add('show')
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => el.classList.remove('show'), 2400)
}

function nowTime() {
  return new Date().toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })
}

// ---------- Data ----------
const user = { name: 'Madison Hughes', first: 'Maddy', initials: 'MH', role: 'Care recipient', email: 'maddy@example.com' }

const team = [
  { id: 'AJ', name: 'Aunt Joyce', role: 'Caregiver' },
  { id: 'SC', name: 'Dr. Sarah Chen', role: 'Physician' },
  { id: 'JR', name: 'James Rivera', role: 'Home Aide' }
]
const person = id => team.find(p => p.id === id)

const state = {
  screen: 'landing',
  history: [],
  theme: store.get('theme', 'dark'),
  largeText: store.get('largeText', false),
  collapsed: store.get('collapsed', false),
  role: 'recipient',
  biometric: true,
  reminders: true,
  shareData: true,
  meds: [
    { id: 1, name: 'Ropivacaine', tag: 'Pain', dose: '10 mg', time: '8:00 AM', freq: 'Twice daily', status: 'taken' },
    { id: 2, name: 'Ropivacaine', tag: 'Pain', dose: '10 mg', time: '8:00 PM', freq: 'Twice daily', status: null },
    { id: 3, name: 'Loratadip / Carbiopa', tag: 'Neurological', dose: '25 mg / 100 mg', time: '7:00 AM', freq: 'Three times daily', status: null },
    { id: 4, name: 'Loratadip / Carbiopa', tag: 'Neurological', dose: '25 mg / 100 mg', time: '12:00 PM', freq: 'Three times daily', status: null },
    { id: 5, name: 'Loratadip / Carbiopa', tag: 'Neurological', dose: '25 mg / 100 mg', time: '8:00 PM', freq: 'Three times daily', status: null },
    { id: 6, name: 'Metformin', tag: 'Diabetes', dose: '500 mg', time: '8:00 AM', freq: 'Twice daily', status: 'taken' },
    { id: 7, name: 'Metformin', tag: 'Diabetes', dose: '500 mg', time: '8:00 PM', freq: 'Twice daily', status: null },
    { id: 8, name: 'Lisinopril', tag: 'Blood pressure', dose: '10 mg', time: '9:00 AM', freq: 'Once daily', status: null },
    { id: 9, name: 'Atorvastatin', tag: 'Cholesterol', dose: '20 mg', time: '9:00 PM', freq: 'Once daily', status: null }
  ],
  symptoms: [
    { name: 'Pain', when: 'Today · 9:10 AM', sev: 2, note: 'Mild knee ache after morning walk' },
    { name: 'Fatigue', when: 'Today · 7:30 AM', sev: 3, note: 'Felt tired after waking up' },
    { name: 'Dizziness', when: 'Yesterday · 3:45 PM', sev: 4, note: 'Brief episode when standing' },
    { name: 'Nausea', when: 'Yesterday · 12:00 PM', sev: 2, note: 'Passed quickly after lunch' }
  ],
  convos: [
    {
      id: 'AJ', time: '10:30 AM', unread: true, status: 'Available',
      messages: [
        { me: false, text: 'Hi Maddy, did you take your morning medications?', time: '9:02 AM' },
        { me: true, text: 'Yes, I finished them with breakfast.', time: '9:15 AM' },
        { me: false, text: 'Great. Your appointment with Dr. Chen is still on for 2:30 PM.', time: '10:30 AM' }
      ]
    },
    {
      id: 'SC', time: 'Monday', unread: false, status: 'In clinic',
      messages: [
        { me: false, text: 'Your latest lab results look good. Keep taking Metformin twice daily.', time: 'Monday' },
        { me: true, text: 'Thank you, Dr. Chen.', time: 'Monday' }
      ]
    },
    {
      id: 'JR', time: 'Yesterday', unread: false, status: 'Available',
      messages: [
        { me: false, text: 'All morning medications are confirmed. Blood pressure was 128/82, which is in your normal range.', time: 'Yesterday' }
      ]
    }
  ],
  activeConvo: 'AJ',
  draft: '',
  week: [
    { dow: 'MON', num: 28, label: 'Monday, Sep 28' },
    { dow: 'TUE', num: 29, label: 'Tuesday, Sep 29' },
    { dow: 'WED', num: 30, label: 'Wednesday, Sep 30' },
    { dow: 'THU', num: 1, label: 'Thursday, Oct 1' },
    { dow: 'FRI', num: 2, label: 'Friday, Oct 2' },
    { dow: 'SAT', num: 3, label: 'Saturday, Oct 3' },
    { dow: 'SUN', num: 4, label: 'Sunday, Oct 4' }
  ],
  appts: {
    0: [{ title: 'Dr. Chen — Follow-up', who: 'Dr. Sarah Chen · Physician', time: '2:30 PM', len: '45 min' }],
    1: [{ title: 'Blood work', who: 'Riverside Lab · Lab technician', time: '9:00 AM', len: '20 min' }],
    2: [
      { title: 'Physical therapy', who: 'Mark Ellis · Physical therapist', time: '11:00 AM', len: '60 min' },
      { title: 'Pharmacy pickup', who: 'Main Street Pharmacy', time: '4:00 PM', len: '15 min' }
    ],
    4: [
      { title: 'Home visit', who: 'Aunt Joyce · Caregiver', time: '1:00 PM', len: '2 hr' },
      { title: 'Telehealth check-in', who: 'Dr. Sarah Chen · Physician', time: '3:30 PM', len: '30 min' }
    ]
  },
  selDay: 0,
  call: null,
  showNotes: false
}

// ---------- Theme ----------
function applyTheme() {
  document.documentElement.dataset.theme = state.theme
  document.documentElement.classList.toggle('large-text', state.largeText)
}
function toggleTheme() {
  state.theme = state.theme === 'dark' ? 'light' : 'dark'
  store.set('theme', state.theme)
  applyTheme()
  render()
}

// ---------- Navigation ----------
const APP_SCREENS = ['today', 'medications', 'messages', 'schedule', 'symptoms', 'account']

function go(screen, { replace = false } = {}) {
  if (screen === state.screen) return
  if (!replace) state.history.push(state.screen)
  state.screen = screen
  state.showNotes = false
  render()
  const c = $('.content') || $('.auth')
  if (c) c.scrollTop = 0
}
function back(fallback = 'landing') {
  go(state.history.pop() || fallback, { replace: true })
}
function signOut() {
  stopCall()
  state.history = []
  go('landing', { replace: true })
  toast('You have been signed out')
}

// ============================================================
// Auth screens
// ============================================================
function landing() {
  return `
  <div class="auth">
    <button class="theme-fab emoji" data-act="theme" aria-label="Switch to ${state.theme === 'dark' ? 'light' : 'dark'} mode">${state.theme === 'dark' ? '🌞' : '🌙'}</button>
    <div class="auth-col centered">
      <div class="logo-tile emoji" aria-hidden="true">💊</div>
      <div class="brand">CareConnect</div>
      <p class="tagline">Medication management and care coordination for you and your care team.</p>
      <div class="landing-actions">
        <button class="btn btn-primary btn-lg" data-go="create">Create account</button>
        <button class="btn btn-outline btn-lg" data-go="signin">Sign in</button>
      </div>
      <div class="version">CareConnect Desktop · v1.0.0</div>
    </div>
  </div>`
}

function signin() {
  return `
  <div class="auth">
    <form class="auth-col" id="signin-form" novalidate>
      <button type="button" class="link back-link" data-act="back">← Back</button>
      <h1>Sign in</h1>
      <p class="sub">Welcome back, ${esc(user.first)}.</p>
      <div class="field">
        <label for="si-email">Email address</label>
        <input class="input" id="si-email" type="email" autocomplete="email" value="${esc(user.email)}">
        <div class="hint">We will never share this.</div>
      </div>
      <div class="field">
        <label for="si-pass">Password</label>
        <input class="input" id="si-pass" type="password" autocomplete="current-password" value="password">
        <div class="hint">Your password manager can fill this for you.</div>
        <div class="error" id="si-err" hidden></div>
      </div>
      <button class="btn btn-primary btn-lg btn-block" type="submit" style="margin-top:18px">Sign in</button>
      <div class="center-links">
        <div><button type="button" class="link" data-go="facescan">Use Face ID instead →</button></div>
        <div>Don't have an account? <button type="button" class="link" data-go="create">Create one →</button></div>
      </div>
    </form>
  </div>`
}

function create() {
  const r = state.role
  return `
  <div class="auth">
    <form class="auth-col" id="create-form" novalidate style="padding-top:14px">
      <button type="button" class="link back-link" data-act="back" style="margin-bottom:34px">← Back</button>
      <h1>Create your account</h1>
      <p class="sub">Get started with CareConnect in under a minute.</p>
      <div class="field">
        <label for="ca-name">Full name</label>
        <input class="input" id="ca-name" autocomplete="name" placeholder="Maddy Chen">
      </div>
      <div class="field">
        <label for="ca-email">Email address</label>
        <input class="input" id="ca-email" type="email" autocomplete="email" placeholder="maddy@example.com">
      </div>
      <div class="field">
        <label for="ca-pass">Password</label>
        <input class="input" id="ca-pass" type="password" autocomplete="new-password" placeholder="••••••••">
        <div class="hint">At least 8 characters.</div>
      </div>
      <div class="section-label">I AM A...</div>
      <div class="role-grid" role="radiogroup" aria-label="Account type">
        <button type="button" role="radio" aria-checked="${r === 'recipient'}" class="role-card ${r === 'recipient' ? 'selected' : ''}" data-role="recipient">
          <span class="emoji">🏥</span><strong>Care recipient</strong><span class="desc">I receive care and track my own health</span>
        </button>
        <button type="button" role="radio" aria-checked="${r === 'caregiver'}" class="role-card ${r === 'caregiver' ? 'selected' : ''}" data-role="caregiver">
          <span class="emoji">🤝</span><strong>Caregiver</strong><span class="desc">I support someone in managing their health</span>
        </button>
      </div>
      <div class="error" id="ca-err" hidden></div>
      <button class="btn btn-primary btn-lg btn-block" type="submit" style="margin-top:30px">Create account</button>
      <div class="center-links" style="margin-top:30px">
        <div>Already have an account? <button type="button" class="link" data-go="signin">Sign in →</button></div>
      </div>
    </form>
  </div>`
}

function biometrics() {
  return `
  <div class="auth">
    <div class="auth-col centered" style="padding-top:145px">
      <div class="face-circle emoji" aria-hidden="true">👤</div>
      <div class="face-title">Sign in with your face?</div>
      <p class="face-sub">Set up Face ID for a faster, password-free sign-in experience on this device.</p>
      <p class="face-note">Your face is never sent anywhere. It stays on this device and is handled by your operating system.</p>
      <div class="face-actions">
        <button class="btn btn-primary btn-lg" data-act="face-yes">Yes, use Face ID</button>
        <button class="btn btn-outline" style="height:64px" data-act="face-no">No, use my password</button>
      </div>
      <button class="link" data-act="back">← Back</button>
    </div>
  </div>`
}

function facescan() {
  return `
  <div class="scan">
    <button class="link back-top" data-go="signin">← Back to sign in</button>
    <div class="rings"><div class="face-circle emoji" aria-hidden="true">👤</div></div>
    <h2>Welcome back, ${esc(user.first)}</h2>
    <p>Looking for your face...</p>
  </div>`
}

function facesuccess() {
  return `
  <div class="scan">
    <div class="check-circle" aria-hidden="true">✓</div>
    <h2 class="ok">Face recognised</h2>
    <p>Signing you in...</p>
  </div>`
}

// ============================================================
// App shell
// ============================================================
const NAV = [
  { id: 'today', label: 'Today', icon: '🏠' },
  { id: 'medications', label: 'Medications', icon: '💊' },
  { id: 'messages', label: 'Messages', icon: '💬' },
  { id: 'schedule', label: 'Schedule', icon: '📅' },
  { id: 'symptoms', label: 'Symptoms', icon: '📊' },
  { id: 'account', label: 'Account', icon: '👤' }
]

function shell(title, body) {
  const dark = state.theme === 'dark'
  const unread = state.convos.filter(c => c.unread).length
  return `
  <div class="shell">
    <aside class="sidebar ${state.collapsed ? 'collapsed' : ''}">
      <div class="sb-head">
        <div class="avatar">${user.initials}</div>
        <div class="who"><strong>${esc(user.name)}</strong><span class="badge">${esc(user.role)}</span></div>
        <button class="collapse-btn" data-act="collapse" aria-label="${state.collapsed ? 'Expand' : 'Collapse'} sidebar">${I.chevL(16)}</button>
      </div>
      <nav><ul class="nav">
        ${NAV.map(n => `
          <li><button class="${state.screen === n.id ? 'active' : ''}" data-go="${n.id}" title="${n.label}" ${state.screen === n.id ? 'aria-current="page"' : ''}>
            <span class="emoji" aria-hidden="true">${n.icon}</span><span class="label">${n.label}${n.id === 'messages' && unread ? ` (${unread})` : ''}</span>
          </button></li>`).join('')}
      </ul></nav>
      <div class="sb-foot">
        <div class="sb-row">
          <span class="emoji" aria-hidden="true">${dark ? '🌙' : '🌞'}</span>
          <span class="grow">${dark ? 'Dark mode' : 'Light mode'}</span>
          <button class="switch ${dark ? 'on' : ''}" role="switch" aria-checked="${dark}" aria-label="Dark mode" data-act="theme"></button>
        </div>
        <button class="sb-row signout" data-act="signout" title="Sign out"><span class="emoji" aria-hidden="true">🚪</span><span class="label">Sign out</span></button>
      </div>
    </aside>
    <div class="main">
      <header class="topbar" style="position:relative">
        <h1>${title}</h1>
        <button class="icon-btn" data-act="voice" aria-label="Voice commands" title="Voice commands">${I.mic()}</button>
        <button class="icon-btn ${state.largeText ? 'on' : ''}" data-act="large" aria-label="Toggle large text" aria-pressed="${state.largeText}" title="Large text">${I.eye()}</button>
        <button class="icon-btn" data-act="notes" aria-label="Notifications" title="Notifications">${I.bell()}</button>
        <button class="sos" data-act="sos">SOS</button>
        ${state.showNotes ? notifications() : ''}
      </header>
      <main class="content">${body}</main>
    </div>
  </div>`
}

function notifications() {
  const next = state.meds.find(m => !m.status)
  return `
  <div class="popover" role="dialog" aria-label="Notifications">
    <h4>Notifications</h4>
    ${next ? `<div class="note"><strong>Medication due</strong><div>${esc(next.name)} ${esc(next.dose)} at ${esc(next.time)}</div></div>` : ''}
    <div class="note"><strong>Appointment today</strong><div>Dr. Chen — Follow-up at 2:30 PM</div><div class="t">In 4 hours</div></div>
    <div class="note"><strong>New message</strong><div>Aunt Joyce: Great. Your appointment with Dr. Chen...</div><div class="t">10:30 AM</div></div>
  </div>`
}

function avatar(id, cls = 'av-sm') {
  return `<div class="avatar ${cls} av-${id}">${id}</div>`
}

function medCard(m) {
  let actions
  if (m.status === 'taken') {
    actions = `<div class="status-bar taken">✓ Taken <button class="undo" data-med-undo="${m.id}">Undo</button></div>`
  } else if (m.status === 'missed') {
    actions = `<div class="status-bar missed">✕ Missed <button class="undo" data-med-undo="${m.id}">Undo</button></div>`
  } else {
    actions = `<div class="med-actions">
      <button class="btn btn-primary" style="box-shadow:none" data-med-take="${m.id}">I took this</button>
      <button class="btn btn-danger-outline" data-med-miss="${m.id}">I missed this</button>
    </div>`
  }
  return `
  <div class="card med ${m.status || ''}">
    <div class="med-top">
      <div class="med-icon emoji" aria-hidden="true">💊</div>
      <div>
        <div class="med-name">${esc(m.name)} <span class="tag">${esc(m.tag)}</span></div>
        <div class="med-dose">${esc(m.dose)} · ${esc(m.time)}</div>
        <div class="med-freq">${esc(m.freq)}</div>
      </div>
    </div>
    ${actions}
  </div>`
}

function medCounts() {
  const total = state.meds.length
  const taken = state.meds.filter(m => m.status === 'taken').length
  const missed = state.meds.filter(m => m.status === 'missed').length
  return { total, taken, missed, pct: Math.round((taken / total) * 100) }
}

// ---------- Today ----------
function today() {
  const c = medCounts()
  const hour = new Date().getHours()
  const greeting = hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening'
  return shell('Today', `
    <div class="greet">
      <div class="eyebrow green">Monday, September 28</div>
      <h2>${greeting}, ${esc(user.first)} <span class="emoji">👋</span></h2>
    </div>
    <div class="two-col">
      <section>
        <div class="summary">
          <div class="left">
            <div class="eyebrow">Today's medications</div>
            <div class="count">${c.taken} of ${c.total} taken</div>
            <div class="progress" role="progressbar" aria-valuenow="${c.pct}" aria-valuemin="0" aria-valuemax="100"><div style="width:${c.pct}%"></div></div>
          </div>
          <div class="pct">${c.pct}%</div>
        </div>
        <h3 class="block-title">Today's medications</h3>
        ${state.meds.map(medCard).join('')}
      </section>
      <section>
        <h3 class="block-title">Next appointment</h3>
        <button class="card appt" data-go="schedule" style="width:100%;text-align:left">
          <div class="ico emoji" aria-hidden="true">🏥</div>
          <div class="info"><strong>Dr. Chen — Follow-up</strong><div class="meta">Today at 2:30 PM · 45 min</div></div>
          <span class="pill-time">2:30 PM</span>
        </button>
        <h3 class="block-title">Care team</h3>
        ${team.map(p => `
          <div class="card person">
            ${avatar(p.id)}
            <div class="info"><strong>${esc(p.name)}</strong><div class="role">${esc(p.role)}</div></div>
            <button class="msg-btn emoji" data-chat="${p.id}" aria-label="Message ${esc(p.name)}">💬</button>
          </div>`).join('')}
        <div class="card tip">
          <div class="eyebrow"><span class="emoji">💡</span> Daily tip</div>
          <p>Taking medications at the same time each day helps maintain consistent blood levels and improves effectiveness.</p>
        </div>
      </section>
    </div>`)
}

// ---------- Medications ----------
function medications() {
  const c = medCounts()
  return shell('Medications', `
    <div style="color:var(--text-2)">${c.total} doses today</div>
    <div class="stats">
      <div class="stat"><div class="n">${c.total}</div><div class="l">Total doses</div></div>
      <div class="stat taken"><div class="n">${c.taken}</div><div class="l">Taken</div></div>
      <div class="stat missed"><div class="n">${c.missed}</div><div class="l">Missed</div></div>
    </div>
    <div class="med-grid">${state.meds.map(medCard).join('')}</div>`)
}

// ---------- Symptoms ----------
function sevClass(s) { return s <= 2 ? 'sev-low' : s === 3 ? 'sev-mid' : 'sev-high' }

function symptoms() {
  return shell('Symptoms', `
    <div class="page-head">
      <div><h2>How are you feeling?</h2><p>Track changes and share them with your care team.</p></div>
      <button class="btn btn-primary" style="height:60px" data-act="log-symptom">${I.plus()} Log symptom</button>
    </div>
    <div class="logs-title">Recent logs <span class="count-pill">${state.symptoms.length}</span></div>
    <div class="sym-grid">
      ${state.symptoms.length ? state.symptoms.map(s => `
        <div class="card sym ${sevClass(s.sev)}">
          <div class="sym-top">
            <div class="sym-ico">${I.pulse()}</div>
            <div class="info"><strong>${esc(s.name)}</strong><div class="when">${esc(s.when)}</div></div>
            <span class="sev-pill">${s.sev}/5</span>
          </div>
          <div class="bars" aria-label="Severity ${s.sev} of 5">${[1, 2, 3, 4, 5].map(i => `<span class="${i <= s.sev ? 'on' : ''}"></span>`).join('')}</div>
          <div class="note">${esc(s.note)}</div>
        </div>`).join('') : '<div class="sym-empty">No symptoms logged yet.</div>'}
    </div>`)
}

function openSymptomModal() {
  let sev = 2
  const root = $('#modal-root')
  root.innerHTML = `
  <div class="overlay" data-close>
    <form class="modal" id="sym-form" role="dialog" aria-modal="true" aria-labelledby="sym-title">
      <h2 id="sym-title">Log a symptom</h2>
      <p class="lead">Your care team will be able to see this entry.</p>
      <div class="field">
        <label for="sym-name">Symptom</label>
        <input class="input" id="sym-name" list="sym-list" placeholder="e.g. Headache" required>
        <datalist id="sym-list"><option>Pain</option><option>Fatigue</option><option>Dizziness</option><option>Nausea</option><option>Headache</option><option>Shortness of breath</option></datalist>
      </div>
      <div class="field">
        <label>Severity (1 = mild, 5 = severe)</label>
        <div class="sev-pick">${[1, 2, 3, 4, 5].map(i => `<button type="button" data-sev="${i}" class="${i === sev ? 'sel' : ''}">${i}</button>`).join('')}</div>
      </div>
      <div class="field">
        <label for="sym-note">Notes</label>
        <textarea class="input" id="sym-note" placeholder="What happened?"></textarea>
      </div>
      <div class="error" id="sym-err" hidden></div>
      <div class="actions">
        <button type="button" class="btn btn-outline" data-close>Cancel</button>
        <button type="submit" class="btn btn-primary">Save log</button>
      </div>
    </form>
  </div>`
  $('#sym-name').focus()
  root.querySelectorAll('[data-sev]').forEach(b => b.addEventListener('click', () => {
    sev = Number(b.dataset.sev)
    root.querySelectorAll('[data-sev]').forEach(x => x.classList.toggle('sel', x === b))
  }))
  $('#sym-form').addEventListener('submit', e => {
    e.preventDefault()
    const name = $('#sym-name').value.trim()
    if (!name) { const err = $('#sym-err'); err.textContent = 'Please enter a symptom.'; err.hidden = false; return }
    state.symptoms.unshift({ name, when: 'Today · ' + nowTime(), sev, note: $('#sym-note').value.trim() || 'No notes' })
    closeModal()
    render()
    toast('Symptom logged and shared with your care team')
  })
}

function closeModal() { $('#modal-root').innerHTML = '' }

function openSosModal() {
  $('#modal-root').innerHTML = `
  <div class="overlay" data-close>
    <div class="modal sos-modal" role="alertdialog" aria-modal="true" aria-labelledby="sos-title">
      <h2 id="sos-title">Send emergency alert?</h2>
      <p class="lead">This will notify your whole care team immediately with your location. If this is a life-threatening emergency, call 911.</p>
      <div class="actions">
        <button class="btn btn-outline" data-close>Cancel</button>
        <button class="btn btn-danger" data-act="sos-confirm">Send SOS alert</button>
      </div>
    </div>
  </div>`
}

// ---------- Call ----------
function call() {
  const c = state.call
  const p = person(c.id)
  const m = Math.floor(c.seconds / 60)
  const s = String(c.seconds % 60).padStart(2, '0')
  return `
  <div class="call">
    <button class="back" data-act="end-call" aria-label="Back">${I.arrowL(22)}</button>
    <div class="status">On call</div>
    <div class="big-av av-${p.id}">${p.id}</div>
    <h2>${esc(p.name)}</h2>
    <div class="role">${esc(p.role)}</div>
    <div class="timer" id="call-timer">${m}:${s}</div>
    <div class="call-ctrls">
      <button class="call-ctrl ${c.muted ? 'on' : ''}" data-act="mute" aria-pressed="${c.muted}"><span class="c">${c.muted ? I.micOff(28) : I.mic(28)}</span>${c.muted ? 'Unmute' : 'Mute'}</button>
      <button class="call-ctrl end" data-act="end-call"><span class="c">${I.endCall(34)}</span>End call</button>
      <button class="call-ctrl ${c.speaker ? 'on' : ''}" data-act="speaker" aria-pressed="${c.speaker}"><span class="c">${c.speaker ? I.volume(28) : I.speaker(28)}</span>${c.speaker ? 'Speaker' : 'Earpiece'}</button>
    </div>
  </div>`
}

let callTimer
function startCall(id) {
  stopCall()
  state.call = { id, seconds: 0, muted: false, speaker: false }
  go('call')
  callTimer = setInterval(() => {
    state.call.seconds++
    const el = $('#call-timer')
    if (el) {
      const m = Math.floor(state.call.seconds / 60)
      el.textContent = `${m}:${String(state.call.seconds % 60).padStart(2, '0')}`
    }
  }, 1000)
}
function stopCall() {
  clearInterval(callTimer)
}

// ---------- Account ----------
function account() {
  const dark = state.theme === 'dark'
  return shell('Account', `
    <div class="acct-grid">
      <section>
        <div class="eyebrow">Profile</div>
        <div class="card profile">
          <div class="avatar av-xl">${user.initials}</div>
          <div><strong>${esc(user.name)}</strong><span class="badge" style="margin-top:12px">${esc(user.role)}</span><div class="email">${esc(user.email)}</div></div>
        </div>
        <div class="eyebrow">Care team</div>
        <div class="acct-team">
          ${team.map(p => `
            <div class="card person">
              ${avatar(p.id)}
              <div class="info"><strong>${esc(p.name)}</strong><div class="role">${esc(p.role)}</div></div>
              <button class="msg-btn lg" data-chat="${p.id}" aria-label="Message ${esc(p.name)}">${I.message(22)}</button>
            </div>`).join('')}
        </div>
      </section>
      <section>
        <div class="eyebrow">Preferences</div>
        <div class="card list">
          <div class="row">
            <div class="ico">${dark ? I.moon(22) : I.sun(22)}</div>
            <div class="info"><strong>Appearance</strong><div class="sub2">${dark ? 'Dark mode' : 'Light mode'}</div></div>
            <button class="theme-switch ${dark ? 'on' : ''}" role="switch" aria-checked="${dark}" aria-label="Dark mode" data-act="theme"><span class="knob">${dark ? I.moon(16) : I.sun(16)}</span></button>
          </div>
          <button class="row" data-act="reminders">
            <div class="ico">${I.bell(22)}</div>
            <div class="info"><strong>Medication reminders</strong><div class="sub2">${state.reminders ? 'On · 15 min before' : 'Off'}</div></div>
            ${I.chevR()}
          </button>
          <button class="row" data-act="biometric">
            <div class="ico">${I.lock(22)}</div>
            <div class="info"><strong>Biometric unlock</strong><div class="sub2">${state.biometric ? 'Enabled' : 'Disabled'}</div></div>
            ${I.chevR()}
          </button>
          <button class="row" data-act="share">
            <div class="ico">${I.share(22)}</div>
            <div class="info"><strong>Share health data</strong><div class="sub2">${state.shareData ? 'With care team' : 'Not shared'}</div></div>
            ${I.chevR()}
          </button>
        </div>
        <div class="eyebrow">App information</div>
        <div class="card list">
          <div class="row plain">${I.info(22)}<div class="info"><strong>CareConnect version</strong></div><span class="right">1.0.0</span></div>
          <button class="row plain" data-act="privacy">${I.file(22)}<div class="info"><strong>Privacy and data</strong></div><span class="right">Review policy</span></button>
        </div>
        <button class="signout-big" data-act="signout">${I.logout(22)} Sign out</button>
      </section>
    </div>`)
}

// ---------- Messages ----------
function messages() {
  const active = state.convos.find(c => c.id === state.activeConvo)
  const p = person(active.id)
  const unread = state.convos.filter(c => c.unread).length
  return shell('Messages', `
    <div class="msg-layout">
      <section>
        <h2>Care team</h2>
        <p class="unread-count">${unread} unread conversation${unread === 1 ? '' : 's'}</p>
        <div class="card convos">
          ${state.convos.map(c => {
            const cp = person(c.id)
            const last = c.messages[c.messages.length - 1]
            return `
            <button class="convo ${c.id === state.activeConvo ? 'active' : ''}" data-convo="${c.id}">
              <div class="avatar av-${c.id}">${c.id}${c.unread ? '<span class="dot"></span>' : ''}</div>
              <div class="body">
                <div class="line1"><strong>${esc(cp.name)}</strong><span class="time">${esc(c.time)}</span></div>
                <div class="role">${esc(cp.role)}</div>
                <div class="preview">${esc(last.text)}</div>
              </div>
            </button>`
          }).join('')}
        </div>
      </section>
      <section class="card chat">
        <div class="chat-head">
          ${avatar(p.id)}
          <div class="info"><strong>${esc(p.name)}</strong><div class="role">${esc(p.role)} · ${esc(active.status)}</div></div>
          <button class="btn btn-primary" data-call="${p.id}">${I.phone()} Call</button>
        </div>
        <div class="thread" id="thread">
          ${active.messages.map(m => `
            <div class="bubble-wrap ${m.me ? 'me' : ''}">
              <div class="bubble">${esc(m.text)}</div>
              <div class="bubble-time">${esc(m.time)}</div>
            </div>`).join('')}
        </div>
        <div class="quick">
          ${['Thank you', 'I took my medications', "I'm feeling well", 'Please call me'].map(q => `<button data-quick="${esc(q)}">${esc(q)}</button>`).join('')}
        </div>
        <form class="composer" id="composer">
          <input class="input" id="msg-input" placeholder="Type a message" aria-label="Message" autocomplete="off" value="${esc(state.draft)}">
          <button class="send" type="submit" aria-label="Send" ${state.draft.trim() ? '' : 'disabled'}>${I.send(22)}</button>
        </form>
      </section>
    </div>`)
}

function sendMessage(text) {
  text = text.trim()
  if (!text) return
  const c = state.convos.find(x => x.id === state.activeConvo)
  const t = nowTime()
  c.messages.push({ me: true, text, time: t })
  c.time = t
  state.draft = ''
  render()
  $('#msg-input')?.focus()
}

// ---------- Schedule ----------
function schedule() {
  const total = Object.values(state.appts).reduce((n, a) => n + a.length, 0)
  const list = state.appts[state.selDay] || []
  const d = state.week[state.selDay]
  return shell('Schedule', `
    <div class="sched-head">
      <div class="page-head" style="display:block"><h2>September 2026</h2><p>${total} appointments this week</p></div>
      <div class="view">${I.calendar()} Weekly view</div>
    </div>
    <div class="days" role="tablist">
      ${state.week.map((w, i) => `
        <button class="day ${i === state.selDay ? 'sel' : ''}" role="tab" aria-selected="${i === state.selDay}" data-day="${i}">
          <span class="dow">${w.dow}</span><span class="num">${w.num}</span><span class="dot ${state.appts[i] ? 'has' : ''}"></span>
        </button>`).join('')}
    </div>
    <div class="day-title">${state.selDay === 0 ? 'Today' : esc(d.label)} <span class="chip">${list.length} scheduled</span></div>
    <div class="appt-list">
      ${list.length ? list.map(a => `
        <div class="card appt-card">
          <div class="ico">${I.calendar(24)}</div>
          <div>
            <strong>${esc(a.title)}</strong>
            <div class="who">${esc(a.who)}</div>
            <div class="tags"><span class="t time">${I.clock(16)} ${esc(a.time)}</span><span class="t">${esc(a.len)}</span></div>
          </div>
        </div>`).join('') : '<div class="card empty-day">No appointments scheduled for this day.</div>'}
    </div>`)
}

// ============================================================
// Render + events
// ============================================================
const SCREENS = { landing, signin, create, biometrics, facescan, facesuccess, today, medications, symptoms, call, account, messages, schedule }

let flowTimer
function render() {
  applyTheme()
  $('#app').innerHTML = SCREENS[state.screen]()
  document.title = 'CareConnect'

  clearTimeout(flowTimer)
  if (state.screen === 'facescan') {
    flowTimer = setTimeout(() => go('facesuccess', { replace: true }), 2200)
  } else if (state.screen === 'facesuccess') {
    flowTimer = setTimeout(() => { state.history = []; go('today', { replace: true }) }, 1500)
  } else if (state.screen === 'messages') {
    const th = $('#thread'); if (th) th.scrollTop = th.scrollHeight
  }
}

function setMed(id, status) {
  const m = state.meds.find(x => x.id === Number(id))
  if (m) m.status = status
  render()
  if (status === 'taken') toast(`${m.name} marked as taken`)
  if (status === 'missed') toast(`${m.name} marked as missed. Your care team will be notified.`)
}

document.addEventListener('click', e => {
  const t = e.target.closest('button, [data-close]')
  if (!t) return

  // Modals
  if (t.hasAttribute('data-close') && (e.target === t || t.tagName === 'BUTTON')) { closeModal(); return }

  const d = t.dataset
  if (d.go) {
    if (d.go === 'create' && state.screen === 'signin') return go('create', { replace: true })
    if (d.go === 'signin' && state.screen === 'create') return go('signin', { replace: true })
    if (d.go === 'signin' && state.screen === 'facescan') return go('signin', { replace: true })
    if (APP_SCREENS.includes(d.go) && APP_SCREENS.includes(state.screen)) return go(d.go, { replace: true })
    return go(d.go)
  }
  if (d.role) { state.role = d.role; render(); return }
  if (d.medTake) return setMed(d.medTake, 'taken')
  if (d.medMiss) return setMed(d.medMiss, 'missed')
  if (d.medUndo) return setMed(d.medUndo, null)
  if (d.chat) {
    state.activeConvo = d.chat
    const c = state.convos.find(x => x.id === d.chat); if (c) c.unread = false
    return go('messages', { replace: APP_SCREENS.includes(state.screen) })
  }
  if (d.convo) {
    state.activeConvo = d.convo
    state.convos.find(x => x.id === d.convo).unread = false
    state.draft = ''
    return render()
  }
  if (d.quick) return sendMessage(d.quick)
  if (d.call) return startCall(d.call)
  if (d.day) { state.selDay = Number(d.day); return render() }

  switch (d.act) {
    case 'theme': return toggleTheme()
    case 'back': return back()
    case 'face-yes': return go('facescan')
    case 'face-no': return go('signin', { replace: true })
    case 'collapse':
      state.collapsed = !state.collapsed
      store.set('collapsed', state.collapsed)
      return render()
    case 'signout': return signOut()
    case 'voice': return toast('Listening... try saying "Show my medications"')
    case 'large':
      state.largeText = !state.largeText
      store.set('largeText', state.largeText)
      render()
      return toast(state.largeText ? 'Large text on' : 'Large text off')
    case 'notes': state.showNotes = !state.showNotes; return render()
    case 'sos': return openSosModal()
    case 'sos-confirm': closeModal(); return toast('SOS alert sent to your care team')
    case 'log-symptom': return openSymptomModal()
    case 'mute': state.call.muted = !state.call.muted; return render()
    case 'speaker': state.call.speaker = !state.call.speaker; return render()
    case 'end-call':
      stopCall()
      toast('Call ended')
      return back('messages')
    case 'reminders':
      state.reminders = !state.reminders; render()
      return toast(`Medication reminders ${state.reminders ? 'on' : 'off'}`)
    case 'biometric':
      state.biometric = !state.biometric; render()
      return toast(`Biometric unlock ${state.biometric ? 'enabled' : 'disabled'}`)
    case 'share':
      state.shareData = !state.shareData; render()
      return toast(state.shareData ? 'Sharing health data with your care team' : 'Health data sharing turned off')
    case 'privacy': return toast('Your data is encrypted and only shared with your care team.')
  }
})

// Close notifications when clicking elsewhere
document.addEventListener('mousedown', e => {
  if (state.showNotes && !e.target.closest('.popover, [data-act="notes"]')) {
    state.showNotes = false
    render()
  }
})

document.addEventListener('submit', e => {
  const f = e.target
  if (f.id === 'signin-form') {
    e.preventDefault()
    const email = $('#si-email').value.trim()
    const pass = $('#si-pass').value
    const err = $('#si-err')
    if (!/^\S+@\S+\.\S+$/.test(email)) { err.textContent = 'Please enter a valid email address.'; err.hidden = false; return }
    if (!pass) { err.textContent = 'Please enter your password.'; err.hidden = false; return }
    state.history = []
    go('today', { replace: true })
  } else if (f.id === 'create-form') {
    e.preventDefault()
    const name = $('#ca-name').value.trim()
    const email = $('#ca-email').value.trim()
    const pass = $('#ca-pass').value
    const err = $('#ca-err')
    let msg = ''
    if (!name) msg = 'Please enter your full name.'
    else if (!/^\S+@\S+\.\S+$/.test(email)) msg = 'Please enter a valid email address.'
    else if (pass.length < 8) msg = 'Password must be at least 8 characters.'
    if (msg) { err.textContent = msg; err.hidden = false; return }
    user.name = name
    user.first = name.split(/\s+/)[0]
    user.initials = name.split(/\s+/).map(w => w[0]).slice(0, 2).join('').toUpperCase()
    user.email = email
    user.role = state.role === 'caregiver' ? 'Caregiver' : 'Care recipient'
    go('biometrics')
  } else if (f.id === 'composer') {
    e.preventDefault()
    sendMessage($('#msg-input').value)
  }
})

document.addEventListener('input', e => {
  if (e.target.id === 'msg-input') {
    state.draft = e.target.value
    const btn = document.querySelector('.send')
    if (btn) btn.disabled = !state.draft.trim()
  }
})

document.addEventListener('keydown', e => {
  if (e.key === 'Escape') {
    if ($('#modal-root').innerHTML) closeModal()
    else if (state.showNotes) { state.showNotes = false; render() }
  }
})

render()
