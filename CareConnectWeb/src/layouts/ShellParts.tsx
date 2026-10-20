import { useEffect, useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useAppState } from '../appStateContext'
import { patient } from '../data'
import { NAV_ITEMS } from '../nav'

export function Avatar({ size = 34 }: { size?: number }) {
  return (
    <div
      className="flex shrink-0 items-center justify-center rounded-full bg-brand font-bold text-white"
      style={{ width: size, height: size, fontSize: size * 0.36 }}
      aria-hidden="true"
    >
      {patient.initials}
    </div>
  )
}

function IconBtn({ icon, label, onClick, className = '' }: { icon: string; label: string; onClick?: () => void; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      title={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl bg-surface-2 text-lg transition-all active:scale-90 ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}

/* ---------- Tablet + desktop: sidebar ---------- */
export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { theme, toggleTheme } = useAppState()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  // Collapsing is a tablet feature; desktop always shows the full sidebar
  const hideLabel = collapsed ? 'lg:inline hidden' : ''
  const item = 'flex min-h-12 w-full items-center gap-3 rounded-[13px] px-[13px] text-left font-bold'
  const itemCollapsed = collapsed ? 'max-lg:justify-center max-lg:px-0' : ''

  return (
    <aside
      aria-label="Sidebar"
      className={`relative hidden h-full shrink-0 flex-col border-r border-line bg-surface transition-[width] md:flex lg:w-[260px] ${
        collapsed ? 'md:w-[76px]' : 'md:w-[232px]'
      }`}
    >
      <div className="flex min-h-[76px] items-center gap-3 px-[18px] py-3.5">
        <div className="grid size-[42px] flex-none place-items-center rounded-[13px] bg-brand text-[21px]" aria-hidden="true">💊</div>
        <div className={`min-w-0 ${hideLabel}`}>
          <p className="truncate font-extrabold text-ink">CareConnect</p>
          <p className="text-[10px] leading-snug font-extrabold tracking-[0.12em] text-sub">Patient workspace</p>
        </div>
      </div>

      <button
        onClick={onToggle}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        aria-expanded={!collapsed}
        title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        className="absolute top-6 -right-[15px] z-10 size-[30px] rounded-[10px] border border-line bg-surface-2 text-xl font-extrabold text-sub lg:hidden"
      >
        {collapsed ? '›' : '‹'}
      </button>

      <nav aria-label="Primary" className="flex flex-1 flex-col gap-[5px] px-2.5 py-3.5">
        {NAV_ITEMS.map(n => (
          <NavLink
            key={n.to}
            to={n.to}
            title={collapsed ? n.label : undefined}
            className={({ isActive }) => `${item} ${itemCollapsed} ${isActive ? 'bg-brand/15 text-link' : 'text-sub hover:bg-surface-2'}`}
          >
            <span className="w-[25px] text-center text-xl leading-none" aria-hidden="true">{n.icon}</span>
            <span className={hideLabel}>{n.label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="border-t border-line p-2.5">
        <button onClick={toggleTheme} className={`${item} ${itemCollapsed} text-sub hover:bg-surface-2`} title={collapsed ? `Use ${dark ? 'light' : 'dark'} theme` : undefined}>
          <span className="w-[25px] text-center text-xl leading-none" aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
          <span className={hideLabel}>{dark ? 'Light theme' : 'Dark theme'}</span>
        </button>
        <button onClick={() => navigate('/')} className={`${item} ${itemCollapsed} text-signout hover:bg-surface-2`} title={collapsed ? 'Sign out' : undefined}>
          <span className="w-[25px] text-center text-xl leading-none" aria-hidden="true">↪</span>
          <span className={hideLabel}>Sign out</span>
        </button>
      </div>
    </aside>
  )
}

/* ---------- Tablet + desktop: top bar ---------- */
export function TopBar({ title, onVoice, onSos, onEyeTracking }: { title: string; onVoice: () => void; onSos: () => void; onEyeTracking: () => void }) {
  const { theme, toggleTheme } = useAppState()
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <header className="hidden min-h-[68px] items-center gap-3.5 border-b border-line bg-surface py-2.5 pr-[18px] pl-6 md:flex lg:min-h-[76px] lg:px-8">
      <div className="min-w-0 flex-1">
        <p className="text-[10px] leading-snug font-extrabold tracking-[0.12em] text-sub">CARECONNECT WEB</p>
        <h1 className="truncate text-xl leading-tight font-extrabold text-ink lg:text-[23px]">{title}</h1>
      </div>
      <div className="flex items-center gap-2">
        <IconBtn icon="🎤" label="Voice commands" onClick={onVoice} className="max-[860px]:hidden" />
        <IconBtn icon="👁" label="Eye tracking (coming soon)" onClick={onEyeTracking} className="max-[860px]:hidden" />
        <button
          onClick={onSos}
          title="Call emergency contact"
          aria-label="SOS, call emergency contact"
          className="h-11 min-w-[52px] rounded-xl border-2 border-sos font-black tracking-[0.04em] text-sos"
        >
          SOS
        </button>
        <div className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            aria-label={`${patient.name}, account menu`}
            className="flex min-h-12 items-center gap-2 rounded-[14px] border border-line bg-surface-2 py-[5px] pr-2.5 pl-[7px] text-ink"
          >
            <Avatar />
            <span className="font-bold max-[860px]:hidden">{patient.name}</span>
            <span aria-hidden="true">⌄</span>
          </button>
          {open && (
            <div role="menu" className="absolute top-[calc(100%+8px)] right-0 z-30 w-[184px] rounded-[14px] border border-line bg-surface p-[7px] text-ink shadow-xl">
              <button
                role="menuitem"
                autoFocus
                onClick={() => {
                  toggleTheme()
                  setOpen(false)
                }}
                className="min-h-11 w-full rounded-[10px] px-3 text-left font-semibold hover:bg-brand/15"
              >
                {theme === 'dark' ? 'Use light theme' : 'Use dark theme'}
              </button>
              <button role="menuitem" onClick={() => navigate('/')} className="min-h-11 w-full rounded-[10px] px-3 text-left font-semibold hover:bg-brand/15">
                Sign out
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  )
}

/* ---------- Phone: header with quick actions ---------- */
export function PhoneHeader({ title, onMenu, onCall, onAlerts, onVideo }: { title: string; onMenu: () => void; onCall: () => void; onAlerts: () => void; onVideo: () => void }) {
  const { theme, toggleTheme } = useAppState()
  const navigate = useNavigate()
  const quick = 'flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl font-bold transition-all active:scale-95'

  return (
    <header className="shrink-0 border-b border-line bg-surface px-4 py-3 md:hidden">
      <h1 className="sr-only">{title}</h1>
      <div className="mb-3 flex items-center gap-2">
        <IconBtn icon="☰" label="Open navigation menu" onClick={onMenu} />
        <Avatar />
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <span className="text-[15px] font-bold text-ink">{patient.name}</span>
          <span className="size-2 shrink-0 rounded-full bg-green-400" aria-hidden="true" />
          <span className="text-xs font-semibold text-sub">Active</span>
        </div>
        <button onClick={() => navigate('/schedule.html')} className="flex h-7 shrink-0 items-center gap-1 rounded-lg bg-indigo/10 px-2.5 text-xs font-bold text-indigo">
          <span aria-hidden="true">📋</span> Full Plan
        </button>
      </div>
      <div className="flex gap-2">
        <button onClick={onCall} className={`${quick} bg-brand text-white`} aria-label="Call emergency contact">
          <span className="text-2xl leading-none" aria-hidden="true">📞</span>
          <span className="text-[11px]">Call</span>
        </button>
        <button onClick={onAlerts} className={`${quick} bg-surface-2 text-ink`}>
          <span className="text-2xl leading-none" aria-hidden="true">🔔</span>
          <span className="text-[11px]">Alerts</span>
        </button>
        <button onClick={onVideo} className={`${quick} bg-surface-2 text-ink`}>
          <span className="text-2xl leading-none" aria-hidden="true">📹</span>
          <span className="text-[11px]">Video</span>
        </button>
        <button onClick={toggleTheme} className={`${quick} bg-surface-2 text-sub`} aria-label={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}>
          <span className="text-2xl leading-none" aria-hidden="true">{theme === 'dark' ? '☀️' : '🌙'}</span>
          <span className="text-[11px]">{theme === 'dark' ? 'Light' : 'Dark'}</span>
        </button>
      </div>
    </header>
  )
}

/* ---------- Phone: bottom tab bar ---------- */
export function BottomNav() {
  return (
    <nav aria-label="Tab bar" className="flex h-[76px] shrink-0 items-stretch justify-around border-t border-line bg-surface md:hidden">
      {NAV_ITEMS.map(n => (
        <NavLink
          key={n.to}
          to={n.to}
          className={({ isActive }) =>
            `relative flex h-full flex-1 flex-col items-center justify-center gap-1 transition-all active:scale-95 ${isActive ? 'text-taken' : 'text-sub'}`
          }
        >
          {({ isActive }) => (
            <>
              {isActive && <span className="absolute top-0 left-1/2 h-1 w-9 -translate-x-1/2 rounded-b-full bg-brand" aria-hidden="true" />}
              <span className="text-[26px] leading-none" aria-hidden="true">{n.icon}</span>
              <span className="text-[11px] font-bold">{n.label}</span>
            </>
          )}
        </NavLink>
      ))}
    </nav>
  )
}

/* ---------- Phone + tablet: large scroll / voice controls (tremor-friendly) ---------- */
export function AccessBar({ onScroll, onVoice }: { onScroll: (dir: 'up' | 'down') => void; onVoice: () => void }) {
  const side = 'flex h-16 flex-1 flex-col items-center justify-center gap-1 rounded-2xl border-2 border-line bg-surface-2 text-[13px] font-bold text-sub transition-all active:scale-95'
  return (
    <div className="flex shrink-0 items-center gap-2.5 border-t border-line bg-surface px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
      <button onClick={() => onScroll('up')} className={side}>
        <span className="text-[22px] leading-none" aria-hidden="true">↑</span>
        <span>Scroll up</span>
      </button>
      <button
        onClick={onVoice}
        aria-label="Voice commands"
        className="flex h-16 w-[72px] shrink-0 flex-col items-center justify-center gap-1 rounded-2xl bg-brand text-[13px] font-bold text-white transition-all active:scale-95"
      >
        <span className="text-[22px] leading-none" aria-hidden="true">🎤</span>
        <span>Voice</span>
      </button>
      <button onClick={() => onScroll('down')} className={side}>
        <span className="text-[22px] leading-none" aria-hidden="true">↓</span>
        <span>Scroll down</span>
      </button>
    </div>
  )
}

/* ---------- Phone: slide-out navigation drawer ---------- */
export function PhoneNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <button className="absolute inset-0 bg-black/60" aria-label="Close navigation menu" tabIndex={-1} onClick={onClose} />
      <div className="relative flex h-full w-[82%] max-w-[320px] flex-col border-r border-line bg-surface p-4">
        <div className="mb-5 flex items-center justify-between">
          <p className="text-lg font-extrabold text-ink">CareConnect</p>
          <button
            onClick={onClose}
            aria-label="Close navigation menu"
            autoFocus
            className="flex size-11 items-center justify-center rounded-xl bg-surface-2 text-lg text-ink"
          >
            ×
          </button>
        </div>
        <nav aria-label="Mobile navigation" className="flex flex-col gap-2">
          {NAV_ITEMS.map(n => (
            <NavLink
              key={n.to}
              to={n.to}
              onClick={onClose}
              className={({ isActive }) =>
                `flex min-h-14 items-center gap-3 rounded-2xl px-4 font-bold ${isActive ? 'bg-brand/15 text-link' : 'bg-surface-2 text-ink'}`
              }
            >
              <span className="text-xl" aria-hidden="true">{n.icon}</span>
              {n.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </div>
  )
}
