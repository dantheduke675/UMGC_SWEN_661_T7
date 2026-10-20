import { useCallback, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router'
import { useAppState } from '../appStateContext'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { Toasts } from '../components/Toasts'
import { VoiceModal, type VoiceCommand } from '../components/VoiceModal'
import { emergencyContact } from '../data'
import { NAV_ITEMS } from '../nav'
import { AccessBar, BottomNav, PhoneHeader, PhoneNavDrawer, Sidebar, TopBar } from './ShellParts'

/*
  One shell, three device sizes (the Figma Desktop / Tablet / Phone frames):
  - Phone   (< 768px):    header with quick actions, bottom tab bar, access bar, menu drawer
  - Tablet  (768-1023px): collapsible sidebar, top bar, access bar, one card column
  - Desktop (>= 1024px):  full sidebar, top bar, two card columns
*/
export function AppShell() {
  const { addToast } = useAppState()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const scrollRef = useRef<HTMLElement>(null)
  const [collapsed, setCollapsed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  const title = NAV_ITEMS.find(n => pathname.startsWith(n.to))?.label ?? 'CareConnect'

  const scroll = (dir: 'up' | 'down') => scrollRef.current?.scrollBy({ top: dir === 'up' ? -220 : 220, behavior: 'smooth' })
  const closeMenu = useCallback(() => setMenuOpen(false), [])
  const closeVoice = useCallback(() => setVoiceOpen(false), [])
  const closeSos = useCallback(() => setSosOpen(false), [])

  function onVoiceCommand(c: VoiceCommand) {
    if (c === 'Scroll down') scroll('down')
    else if (c === 'Scroll up') scroll('up')
    else if (c === 'Go home') navigate('/today.html')
    else if (c === 'Go to medications') navigate('/medications.html')
    else if (c === 'Open schedule') navigate('/schedule.html')
  }

  return (
    <div className="flex h-dvh bg-bg">
      <a href="#content" className="sr-only z-50 rounded-lg bg-brand px-4 py-2 text-white focus:not-sr-only focus:fixed focus:top-2 focus:left-2">
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          onVoice={() => setVoiceOpen(true)}
          onSos={() => setSosOpen(true)}
          onEyeTracking={() => addToast('Eye tracking is coming soon')}
        />
        <PhoneHeader
          title={title}
          onMenu={() => setMenuOpen(true)}
          onCall={() => setSosOpen(true)}
          onAlerts={() => addToast('All caught up — no new alerts')}
          onVideo={() => addToast('Video calls are coming soon')}
        />

        <main id="content" ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-[1200px] px-5 pt-5 pb-6 lg:px-[clamp(28px,4vw,56px)]">
            <Outlet />
          </div>
        </main>

        <BottomNav />
        <AccessBar onScroll={scroll} onVoice={() => setVoiceOpen(true)} />
      </div>

      <Toasts />
      <PhoneNavDrawer open={menuOpen} onClose={closeMenu} />
      {voiceOpen && <VoiceModal onClose={closeVoice} onCommand={onVoiceCommand} />}
      {sosOpen && (
        <ConfirmDialog
          message={`Call ${emergencyContact.name}, your emergency contact?`}
          confirmLabel={`Call ${emergencyContact.name}`}
          onConfirm={() => {
            setSosOpen(false)
            addToast(`Calling ${emergencyContact.name}… (demo — no call is placed)`)
          }}
          onCancel={closeSos}
        />
      )}
    </div>
  )
}
