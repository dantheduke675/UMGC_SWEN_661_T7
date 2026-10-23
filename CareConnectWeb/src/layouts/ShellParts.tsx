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

/* ---------- Sidebar (every size; an icon rail when collapsed) ---------- */
export function Sidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle: () => void; onNavigate: () => void }) {
  const { theme, toggleTheme, conversations } = useAppState()
  const navigate = useNavigate()
  const dark = theme === 'dark'
  const unread = conversations.filter(c => c.unread).length
  // Collapsing is a phone and tablet feature; desktop always shows the full sidebar
  const hideLabel = collapsed ? 'lg:inline hidden' : ''
  const item = 'relative flex min-h-12 w-full items-center gap-3 rounded-[13px] px-[13px] text-left font-bold'
  const itemCollapsed = collapsed ? 'max-lg:justify-center max-lg:px-0' : ''

  return (
    // On phones the rail keeps its place and the expanded sidebar slides over the page
    <div className="relative h-full shrink-0 max-md:w-[68px]">
      {!collapsed && <div className="fixed inset-0 z-30 bg-black/60 md:hidden" aria-hidden="true" onClick={onToggle} />}
      <aside
        aria-label="Sidebar"
        className={`flex h-full flex-col border-r border-line bg-surface transition-[width] max-md:absolute max-md:inset-y-0 max-md:left-0 max-md:z-40 lg:w-[260px] ${
          collapsed ? 'w-[68px] md:w-[76px]' : 'w-[232px] max-md:shadow-2xl'
        }`}
      >
        <div className={`flex min-h-[76px] items-center gap-3 px-[18px] py-3.5 ${collapsed ? 'max-lg:justify-center max-lg:px-0' : ''}`}>
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

        <nav aria-label="Primary" className="flex flex-1 flex-col gap-[5px] overflow-y-auto px-2.5 py-3.5">
          {NAV_ITEMS.map(n => {
            const badge = n.to === '/messages.html' ? unread : 0
            return (
              <NavLink
                key={n.to}
                to={n.to}
                onClick={onNavigate}
                title={collapsed ? n.label : undefined}
                className={({ isActive }) => `${item} ${itemCollapsed} ${isActive ? 'bg-brand/15 text-link' : 'text-sub hover:bg-surface-2'}`}
              >
                <span className="w-[25px] text-center text-xl leading-none" aria-hidden="true">{n.icon}</span>
                <span className={`flex-1 ${hideLabel}`}>{n.label}</span>
                {badge > 0 && (
                  <>
                    <span
                      className={`grid size-6 place-items-center rounded-full bg-danger text-xs font-bold text-white ${
                        collapsed ? 'max-lg:absolute max-lg:top-0.5 max-lg:right-0.5 max-lg:size-5' : ''
                      }`}
                      aria-hidden="true"
                    >
                      {badge}
                    </span>
                    <span className="sr-only">, {badge} unread</span>
                  </>
                )}
              </NavLink>
            )
          })}
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
    </div>
  )
}

/* ---------- Top bar (every size) ---------- */
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
    <header className="flex min-h-[68px] items-center gap-2 border-b border-line bg-surface py-2.5 pr-3 pl-6 md:gap-3.5 md:pr-[18px] lg:min-h-[76px] lg:px-8">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] leading-snug font-extrabold tracking-[0.12em] text-sub">CARECONNECT WEB</p>
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
                  setOpen(false)
                  navigate('/account.html')
                }}
                className="min-h-11 w-full rounded-[10px] px-3 text-left font-semibold hover:bg-brand/15"
              >
                Account
              </button>
              <button
                role="menuitem"
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

/* ---------- Help: floating "?" button and a short guide ---------- */
export type HelpItem = [icon: string, term: string, desc: string]

const APP_HELP: HelpItem[] = [
  ['🎤', 'Voice', 'Say a command, such as "Go to medications" or "Scroll down".'],
  ['↕', 'Scroll up / Scroll down', 'Large buttons that move the page, for when scrolling is hard.'],
  ['🆘', 'SOS', 'Calls your emergency contact after you confirm.'],
  ['💊', 'I took this / I missed this', 'Logs a dose. Each change can be undone for a few seconds.'],
  ['‹›', 'Sidebar arrow', 'Shows or hides the page names next to the icons.'],
]

// Placement: above the scroll / voice bar in the app; the bottom corner on pages without it
export function HelpButton({ items = APP_HELP, position = 'bottom-[104px] lg:right-5 lg:bottom-5' }: { items?: HelpItem[]; position?: string }) {
  const [open, setOpen] = useState(false)

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open])

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        aria-label="Help"
        title="Help"
        className={`fixed right-4 z-20 grid size-11 place-items-center rounded-full border border-line bg-surface-2 text-xl font-bold text-ink shadow-lg ${position}`}
      >
        ?
      </button>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
          <div role="dialog" aria-modal="true" aria-labelledby="help-title" className="max-h-[90dvh] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-6">
            <h2 id="help-title" className="mb-4 text-xl font-bold text-ink">Help</h2>
            <ul className="mb-5 flex flex-col gap-3.5">
              {items.map(([icon, term, desc]) => (
                <li key={term} className="flex gap-3">
                  <span className="w-7 shrink-0 text-center text-xl" aria-hidden="true">{icon}</span>
                  <div>
                    <p className="font-bold text-ink">{term}</p>
                    <p className="text-sm text-sub">{desc}</p>
                  </div>
                </li>
              ))}
            </ul>
            <button onClick={() => setOpen(false)} autoFocus className="h-14 w-full rounded-2xl bg-brand text-base font-bold text-white">
              Got it
            </button>
          </div>
        </div>
      )}
    </>
  )
}
