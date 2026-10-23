import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useAppState } from '../appStateContext'
import { careTeam, emergencyContact, patient } from '../data'

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = `account-${title.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="mb-2.5 text-xs font-extrabold tracking-[0.12em] text-sub uppercase">{title}</h3>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{children}</ul>
    </section>
  )
}

// One tappable row: icon, title, current value, chevron. Switches add role="switch".
function Row({ icon, title, value, onClick, checked }: { icon: string; title: string; value: string; onClick: () => void; checked?: boolean }) {
  return (
    <li>
      <button
        onClick={onClick}
        role={checked === undefined ? undefined : 'switch'}
        aria-checked={checked}
        className="flex min-h-[80px] w-full items-center gap-4 px-5 py-3 text-left hover:bg-surface-2"
      >
        <span className="w-7 shrink-0 text-center text-2xl leading-none" aria-hidden="true">{icon}</span>
        <span className="min-w-0 flex-1">
          <span className="block text-[17px] font-bold text-ink">{title}</span>
          <span className="block text-sm text-sub">{value}</span>
        </span>
        <span className="text-lg text-sub" aria-hidden="true">›</span>
      </button>
    </li>
  )
}

export function Account() {
  const { theme, toggleTheme, prefs, togglePref, addToast } = useAppState()
  const navigate = useNavigate()

  return (
    <>
      <div className="mb-6 flex items-center gap-5">
        <div className="flex size-[72px] shrink-0 items-center justify-center rounded-full bg-brand text-2xl font-bold text-white" aria-hidden="true">
          {patient.initials}
        </div>
        <div className="min-w-0">
          <h2 className="text-2xl font-bold text-ink">{patient.full}</h2>
          <p className="text-[15px] text-sub">Patient · CareConnect since 2024</p>
        </div>
      </div>

      {/* Profile and Preferences side by side on desktop; Care team under Profile */}
      <div className="grid gap-6 lg:grid-cols-2 lg:items-start">
        <Group title="Profile">
          <Row icon="👤" title={patient.full} value={patient.email} onClick={() => addToast('Editing your profile is coming soon')} />
          <Row
            icon="🚨"
            title="Emergency contact"
            value={`${emergencyContact.full} · ${emergencyContact.phone}`}
            onClick={() => addToast('Editing contacts is coming soon')}
          />
        </Group>
        <Group title="Preferences">
          <Row icon="🎨" title="Appearance" value={theme === 'dark' ? 'Dark mode' : 'Light mode'} onClick={toggleTheme} />
          <Row
            icon="🔔"
            title="Notifications"
            value={prefs.notifications ? 'Medication reminders on' : 'Medication reminders off'}
            checked={prefs.notifications}
            onClick={() => togglePref('notifications')}
          />
          <Row
            icon="🔒"
            title="Biometrics"
            value={prefs.biometrics ? 'Face ID enabled' : 'Face ID off'}
            checked={prefs.biometrics}
            onClick={() => togglePref('biometrics')}
          />
        </Group>
        <Group title="Care team">
          {careTeam.map(p => (
            <Row key={p.name} icon={p.icon} title={p.name} value={p.role} onClick={() => navigate(`/messages.html?c=${p.conversation}`)} />
          ))}
        </Group>
      </div>

      <button onClick={() => navigate('/')} className="mt-6 h-16 w-full rounded-2xl bg-danger text-lg font-bold text-white transition-all active:scale-[0.98]">
        Sign out
      </button>
    </>
  )
}
