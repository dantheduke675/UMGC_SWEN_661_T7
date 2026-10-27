import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { useSignOut } from '../actions'
import { useAppState } from '../appStateContext'
import { careTeam, emergencyContact, patient } from '../data'
import { installApp, useInstallStatus } from '../install'

const APP_VERSION = '1.0.0'

function Group({ title, children }: { title: string; children: ReactNode }) {
  const id = `account-${title.toLowerCase().replace(/\s+/g, '-')}`
  return (
    <section aria-labelledby={id}>
      <h3 id={id} className="mb-2.5 text-xs font-extrabold tracking-[0.12em] text-sub uppercase">{title}</h3>
      <ul className="focus-inset divide-y divide-line overflow-hidden rounded-2xl border border-line bg-surface">{children}</ul>
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

// Zoom level with - / + buttons (also Ctrl + - and Ctrl + +)
// Install button where the browser offers it; otherwise whether it is installed, or where to find the browser's own option
function InstallRow() {
  const status = useInstallStatus()
  const { addToast } = useAppState()
  if (status === 'available') {
    return (
      <Row
        icon="📲"
        title="Install CareConnect"
        value="Opens in its own window and works offline"
        onClick={() => void installApp().then(accepted => accepted && addToast('Installing CareConnect…'))}
      />
    )
  }
  return (
    <li className="flex min-h-[80px] items-center gap-4 px-5 py-3">
      <span className="w-7 shrink-0 text-center text-2xl leading-none" aria-hidden="true">📲</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold text-ink">Install CareConnect</span>
        <span className="block text-sm text-sub">
          {status === 'installed' ? 'Installed on this device' : "From your browser's menu (Safari: Share › Add to Home Screen)"}
        </span>
      </span>
    </li>
  )
}

function ZoomRow() {
  const { zoom, zoomBy } = useAppState()
  const pct = Math.round(zoom * 100)
  const btn = 'grid size-12 place-items-center rounded-xl border border-line bg-surface-2 text-2xl font-bold text-ink disabled:opacity-40'
  return (
    <li className="flex min-h-[80px] items-center gap-4 px-5 py-3">
      <span className="w-7 shrink-0 text-center text-2xl leading-none" aria-hidden="true">🔍</span>
      <span className="min-w-0 flex-1">
        <span className="block text-[17px] font-bold text-ink">Zoom</span>
        <span id="zoom-level" className="block text-sm text-sub">
          <span className="sr-only">Current zoom </span>
          {pct}%
        </span>
      </span>
      <button onClick={() => zoomBy(-1)} disabled={pct <= 80} aria-label="Zoom out" aria-describedby="zoom-level" aria-keyshortcuts="Control+-" className={btn}>
        <span aria-hidden="true">−</span>
      </button>
      <button onClick={() => zoomBy(1)} disabled={pct >= 200} aria-label="Zoom in" aria-describedby="zoom-level" aria-keyshortcuts="Control+Plus" className={btn}>
        <span aria-hidden="true">+</span>
      </button>
    </li>
  )
}

export function Account() {
  const { theme, toggleTheme, focusIndicator, toggleFocusIndicator, prefs, togglePref, addToast, setHistoryOpen } = useAppState()
  const navigate = useNavigate()
  const signOut = useSignOut()

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

      {/* Profile and Preferences side by side on desktop; Care team and Accessibility under them */}
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
            value={prefs.notifications ? 'On · Ctrl + N' : 'Off · Ctrl + N'}
            checked={prefs.notifications}
            onClick={() => togglePref('notifications')}
          />
          <Row
            icon="⏰"
            title="Medication reminders"
            value={prefs.reminders ? 'On · 15 min before each dose' : 'Off'}
            checked={prefs.reminders}
            onClick={() => togglePref('reminders')}
          />
          <Row
            icon="🔒"
            title="Biometrics"
            value={prefs.biometrics ? 'Face ID enabled' : 'Face ID off'}
            checked={prefs.biometrics}
            onClick={() => togglePref('biometrics')}
          />
          <Row
            icon="🔗"
            title="Share health data"
            value={prefs.shareData ? 'With your care team' : 'Not shared'}
            checked={prefs.shareData}
            onClick={() => togglePref('shareData')}
          />
        </Group>
        <Group title="Care team">
          {careTeam.map(p => (
            <Row key={p.name} icon={p.icon} title={p.name} value={p.role} onClick={() => navigate(`/messages.html?c=${p.conversation}`)} />
          ))}
        </Group>
        <Group title="Accessibility">
          <Row
            icon="🔲"
            title="Focus indicator"
            value={focusIndicator ? 'Shown · arrow keys move it · Ctrl + = to hide' : 'Hidden · Ctrl + = to show'}
            checked={focusIndicator}
            onClick={toggleFocusIndicator}
          />
          <ZoomRow />
          <Row
            icon="👁"
            title="Eye tracking"
            value={prefs.eyeTracking ? 'On (simulated, no camera is used)' : 'Off'}
            checked={prefs.eyeTracking}
            onClick={() => togglePref('eyeTracking')}
          />
          <Row
            icon="🖱"
            title="Mouse lock"
            value={prefs.mouseLock ? 'On · focus snaps to the nearest control' : 'Off · Ctrl + O'}
            checked={prefs.mouseLock}
            onClick={() => togglePref('mouseLock')}
          />
          <Row icon="🕘" title="Action history" value="See and undo what you have done · Ctrl + H" onClick={() => setHistoryOpen(true)} />
        </Group>
        <Group title="App information">
          <InstallRow />
          <li className="flex min-h-[80px] items-center gap-4 px-5 py-3">
            <span className="w-7 shrink-0 text-center text-2xl leading-none" aria-hidden="true">ℹ️</span>
            <span className="flex-1 text-[17px] font-bold text-ink">CareConnect version</span>
            <span className="text-sub">{APP_VERSION}</span>
          </li>
          <Row
            icon="📄"
            title="Privacy and data"
            value="Review the policy"
            onClick={() => addToast('Your data is encrypted and only shared with your care team.')}
          />
        </Group>
      </div>

      <button onClick={signOut} className="mt-6 h-16 w-full rounded-2xl bg-danger text-lg font-bold text-white transition-all active:scale-[0.98]">
        Sign out
      </button>
    </>
  )
}
