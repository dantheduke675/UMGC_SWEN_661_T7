import { useCallback, useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useNavigate, useSearchParams } from 'react-router'
import { useToggleActions } from '../actions'
import { useAppState } from '../appStateContext'
import { CallScreen } from '../components/CallScreen'
import { ConfirmDialog } from '../components/ConfirmDialog'
import { SkipLinks, type SkipLink } from '../components/SkipLinks'
import { VoiceModal, type VoiceCommand } from '../components/VoiceModal'
import { emergencyContact } from '../data'
import { useEscapeKey, useMediaQuery } from '../hooks'
import { NAV_ITEMS } from '../nav'
import { matchShortcut } from '../shortcuts'
import { AccessBar, HelpButton, Sidebar, TopBar } from './ShellParts'

/*
  One shell, three device sizes (the Figma Desktop / Tablet / Phone frames):
  - Phone   (< 768px):    sidebar starts as an icon rail and expands over the page, top bar, access bar
  - Tablet  (768-1023px): collapsible sidebar, top bar, access bar, one card column
  - Desktop (>= 1024px):  full sidebar, top bar, two card columns
*/
const PHONE = '(max-width: 767px)'

const SKIP_LINKS: SkipLink[] = [
  ['content', 'Skip to content'],
  ['primary-nav', 'Skip to navigation'],
  ['page-tools', 'Skip to voice, SOS and account'],
]

export function AppShell() {
  const { addToast, conversations, callWith, startCall, endCall } = useAppState()
  const toggles = useToggleActions()
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const scrollRef = useRef<HTMLElement>(null)
  const phone = useMediaQuery(PHONE)
  // Phones start with the rail; crossing the phone breakpoint resets the sidebar
  const [collapsed, setCollapsed] = useState(phone)
  const [wasPhone, setWasPhone] = useState(phone)
  if (phone !== wasPhone) {
    setWasPhone(phone)
    setCollapsed(phone)
  }
  const [voiceOpen, setVoiceOpen] = useState(false)
  const [sosOpen, setSosOpen] = useState(false)
  // An open conversation fills the page with its own scrolling and reply box (no scroll bar or help button)
  const chatOpen = pathname === '/messages.html' && conversations.some(c => c.id === params.get('c'))
  const calling = conversations.find(c => c.id === callWith)
  const title = chatOpen ? 'Conversation' : (NAV_ITEMS.find(n => pathname.startsWith(n.to))?.label ?? 'CareConnect')

  const scroll = (dir: 'up' | 'down') => scrollRef.current?.scrollBy({ top: dir === 'up' ? -220 : 220, behavior: 'smooth' })
  const closeVoice = useCallback(() => setVoiceOpen(false), [])
  const closeSos = useCallback(() => setSosOpen(false), [])

  // On phones the expanded sidebar covers the page: Escape or picking a page closes it
  const expandedOnPhone = !collapsed && phone
  useEscapeKey(() => setCollapsed(true), expandedOnPhone)

  // Ctrl + \ opens voice commands and Ctrl + S the emergency call. Capture runs
  // before RootLayout's handler, which answers these keys outside the shell.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const id = matchShortcut(e)
      if (id !== 'voice' && id !== 'sos') return
      e.preventDefault()
      if (id === 'voice') setVoiceOpen(true)
      else setSosOpen(true)
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [])

  function onVoiceCommand(c: VoiceCommand) {
    if (c === 'Scroll down') scroll('down')
    else if (c === 'Scroll up') scroll('up')
    else if (c === 'Go home') navigate('/today.html')
    else if (c === 'Go to medications') navigate('/medications.html')
    else if (c === 'Open schedule') navigate('/schedule.html')
    else if (c === 'Open messages') navigate('/messages.html')
    else if (c === 'Log a symptom') navigate('/symptoms.html')
  }

  return (
    <div className="flex h-full bg-bg">
      <SkipLinks links={SKIP_LINKS} />
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed(c => !c)} onNavigate={() => expandedOnPhone && setCollapsed(true)} />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col">
        <TopBar
          title={title}
          onVoice={() => setVoiceOpen(true)}
          onSos={() => setSosOpen(true)}
          onEyeTracking={toggles.eyeTracking}
        />

        <main id="content" aria-labelledby="page-title" ref={scrollRef} className={`min-h-0 flex-1 ${chatOpen ? 'flex flex-col' : 'overflow-y-auto'}`}>
          {chatOpen ? (
            <Outlet />
          ) : (
            <div className="mx-auto w-full max-w-[1200px] px-4 pt-5 pb-6 md:px-5 lg:px-[clamp(28px,4vw,56px)]">
              <Outlet />
            </div>
          )}
        </main>

        {!chatOpen && <AccessBar onScroll={scroll} onVoice={() => setVoiceOpen(true)} />}
      </div>

      {!chatOpen && <HelpButton />}
      {calling && (
        <CallScreen
          c={calling}
          onEnd={duration => {
            endCall()
            addToast(`Call with ${calling.name} ended · ${duration} (demo — no call was placed)`)
          }}
        />
      )}
      {voiceOpen && <VoiceModal onClose={closeVoice} onCommand={onVoiceCommand} />}
      {sosOpen && (
        <ConfirmDialog
          message={`Call ${emergencyContact.name}, your emergency contact?`}
          confirmLabel={`Call ${emergencyContact.name}`}
          onConfirm={() => {
            setSosOpen(false)
            startCall(emergencyContact.conversation)
          }}
          onCancel={closeSos}
        />
      )}
    </div>
  )
}
