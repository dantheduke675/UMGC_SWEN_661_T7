import { useState } from 'react'
import { NavLink, useNavigate } from 'react-router'
import { useSignOut } from '../actions'
import { useAppState } from '../appStateContext'
import { patient } from '../data'
import { useFocusTrap } from '../focus'
import { NotificationsButton } from '../components/NotificationsPanel'
import { useClickOutside, useEscapeKey } from '../hooks'
import { NAV_ITEMS } from '../nav'
import { CTRL_SHORTCUTS, OTHER_KEYS } from '../shortcuts'

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

function IconBtn({ icon, label, onClick, pressed, className = '' }: { icon: string; label: string; onClick?: () => void; pressed?: boolean; className?: string }) {
  return (
    <button
      onClick={onClick}
      aria-label={label}
      aria-pressed={pressed}
      title={label}
      className={`flex size-11 shrink-0 items-center justify-center rounded-xl text-lg transition-all active:scale-90 pointer-coarse:size-12 ${pressed ? 'bg-brand/25 ring-2 ring-brand' : 'bg-surface-2'} ${className}`}
    >
      <span aria-hidden="true">{icon}</span>
    </button>
  )
}

/* ---------- Sidebar (every size; an icon rail when collapsed) ---------- */
export function Sidebar({ collapsed, onToggle, onNavigate }: { collapsed: boolean; onToggle: () => void; onNavigate: () => void }) {
  const { theme, toggleTheme, conversations } = useAppState()
  const signOut = useSignOut()
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

        {/* Its own row under the logo; on the sidebar's edge it covered the logo and the page title.
            Named by its text, which only screen readers get while the sidebar is a rail */}
        <div className="px-2.5 pt-3.5 lg:hidden">
          <button
            onClick={onToggle}
            aria-expanded={!collapsed}
            title={collapsed ? 'Open menu' : undefined}
            className={`${item} ${itemCollapsed} border border-line bg-surface-2 text-sub hover:bg-surface`}
          >
            <span className="w-[25px] text-center text-xl leading-none" aria-hidden="true">{collapsed ? '☰' : '✕'}</span>
            <span className={collapsed ? 'max-lg:sr-only' : ''}>{collapsed ? 'Open menu' : 'Close menu'}</span>
          </button>
        </div>

        <nav id="primary-nav" aria-label="Primary" className="flex flex-1 flex-col gap-[5px] overflow-y-auto px-2.5 py-3.5 max-lg:pt-[5px]">
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
          <button onClick={signOut} className={`${item} ${itemCollapsed} text-signout hover:bg-surface-2`} title={collapsed ? 'Sign out' : undefined}>
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
  const { theme, toggleTheme, prefs, history, setHistoryOpen } = useAppState()
  const navigate = useNavigate()
  const signOut = useSignOut()
  const [open, setOpen] = useState(false)
  const menuRef = useClickOutside<HTMLDivElement>(() => setOpen(false), open)
  const undoable = history.filter(h => !h.undone).length

  useEscapeKey(() => setOpen(false), open)

  return (
    <header className="flex min-h-[68px] items-center gap-2 border-b border-line bg-surface py-2.5 pr-3 pl-6 md:gap-3.5 md:pr-[18px] lg:min-h-[76px] lg:px-8">
      <div className="min-w-0 flex-1">
        <p className="truncate text-[10px] leading-snug font-extrabold tracking-[0.12em] text-sub">CARECONNECT WEB</p>
        <h1 id="page-title" className="truncate text-xl leading-tight font-extrabold text-ink lg:text-[23px]">{title}</h1>
      </div>
      <div id="page-tools" role="group" aria-label="Voice, SOS and account" className="flex items-center gap-2">
        <IconBtn
          icon="🕘"
          label={undoable ? `Action history, ${undoable} can be undone` : 'Action history'}
          onClick={() => setHistoryOpen(true)}
          className="max-[860px]:hidden"
        />
        <IconBtn icon="🎤" label="Voice commands" onClick={onVoice} className="max-[860px]:hidden" />
        <IconBtn icon="👁" label="Eye tracking" pressed={prefs.eyeTracking} onClick={onEyeTracking} className="max-[860px]:hidden" />
        <NotificationsButton />
        <button
          onClick={onSos}
          title="Call emergency contact"
          aria-label="SOS, call emergency contact"
          className="h-11 min-w-[52px] rounded-xl border-2 border-sos font-black tracking-[0.04em] text-sos-text"
        >
          SOS
        </button>
        <div ref={menuRef} className="relative">
          <button
            onClick={() => setOpen(o => !o)}
            aria-haspopup="menu"
            aria-expanded={open}
            className="flex min-h-12 items-center gap-2 rounded-[14px] border border-line bg-surface-2 py-[5px] pr-2.5 pl-[7px] text-ink"
          >
            {/* Named by its content, "Maddy, account menu", which includes the visible name */}
            <Avatar />
            <span className="font-bold max-[860px]:sr-only">{patient.name}</span>
            <span className="sr-only">, account menu</span>
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
              <button role="menuitem" onClick={signOut} className="min-h-11 w-full rounded-[10px] px-3 text-left font-semibold hover:bg-brand/15">
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
    <section aria-label="Scroll and voice controls" className="flex shrink-0 items-center gap-2.5 border-t border-line bg-surface px-3 py-2.5 pb-[max(10px,env(safe-area-inset-bottom))] lg:hidden">
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
    </section>
  )
}

/* ---------- Help: floating "?" button and a short guide ---------- */
export type HelpItem = [icon: string, term: string, desc: string]

const APP_HELP: HelpItem[] = [
  ['🎤', 'Voice', 'Say a command, such as "Go to medications" or "Scroll down".'],
  ['↕', 'Scroll up / Scroll down', 'Large buttons that move the page, for when scrolling is hard.'],
  ['🆘', 'SOS', 'Calls your emergency contact after you confirm.'],
  ['💊', 'I took this / I missed this', 'Logs a dose. Each change can be undone for a few seconds.'],
  ['☰', 'Open menu', 'Shows the page names next to the icons; Close menu hides them again.'],
  ['🕘', 'Action history', 'Ctrl + H lists what you have done, so you can undo any of it.'],
]

const kbd = 'rounded-md border border-line bg-surface-2 px-1.5 py-0.5 font-mono text-[13px] font-bold whitespace-nowrap text-ink'

// Every keyboard shortcut, from shortcuts.ts
function ShortcutList() {
  return (
    <section aria-labelledby="shortcuts-title" className="mb-5">
      <h3 id="shortcuts-title" className="mb-3 text-base font-bold text-ink">Keyboard shortcuts</h3>
      <dl className="grid grid-cols-[auto_1fr] items-baseline gap-x-3 gap-y-2 text-sm">
        {[...OTHER_KEYS.map(k => [k.label, k.does]), ...CTRL_SHORTCUTS.map(s => [s.label, s.does])].map(([keys, does]) => (
          <div key={keys} className="contents">
            <dt>
              <kbd className={kbd}>{keys}</kbd>
            </dt>
            <dd className="text-sub">{does}</dd>
          </div>
        ))}
      </dl>
    </section>
  )
}

// Placement: above the scroll / voice bar in the app; the bottom corner on pages without it
export function HelpButton({ id, items = APP_HELP, position = 'bottom-[104px] lg:right-5 lg:bottom-5' }: { id?: string; items?: HelpItem[]; position?: string }) {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        id={id}
        onClick={() => setOpen(true)}
        aria-label="Help"
        title="Help"
        className={`fixed right-4 z-20 grid size-11 place-items-center pointer-coarse:size-12 rounded-full border border-line bg-surface-2 text-xl font-bold text-ink shadow-lg ${position}`}
      >
        ?
      </button>
      {open && <HelpDialog items={items} onClose={() => setOpen(false)} />}
    </>
  )
}

function HelpDialog({ items, onClose }: { items: HelpItem[]; onClose: () => void }) {
  const ref = useFocusTrap<HTMLDivElement>()

  useEscapeKey(onClose)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4 backdrop-blur-sm">
      <div ref={ref} role="dialog" aria-modal="true" aria-labelledby="help-title" className="max-h-[90%] w-full max-w-md overflow-y-auto rounded-3xl border border-line bg-surface p-6">
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
        <ShortcutList />
        <button onClick={onClose} autoFocus className="h-14 w-full rounded-2xl bg-brand text-base font-bold text-white">
          Got it
        </button>
      </div>
    </div>
  )
}
