import { Outlet } from 'react-router'
import { useAppState } from '../appStateContext'

/*
  Sign-in and create-account screens: a brand panel beside the form on tablet
  and desktop; the form alone on phones.
*/
export function AuthLayout() {
  const { theme, toggleTheme } = useAppState()
  const dark = theme === 'dark'

  return (
    <div className="h-dvh bg-bg md:grid md:grid-cols-[minmax(250px,0.7fr)_minmax(480px,1.3fr)] lg:grid-cols-[minmax(300px,0.8fr)_minmax(480px,1.2fr)]">
      <aside className="hidden flex-col justify-between border-r border-line px-8 pt-[72px] pb-12 text-ink md:flex lg:px-[clamp(36px,5vw,80px)]">
        <div className="flex items-center gap-2.5 text-[19px] font-extrabold tracking-[-0.03em]">
          <span className="grid size-[38px] place-items-center rounded-xl bg-brand text-lg text-white" aria-hidden="true">✚</span>
          CareConnect
        </div>
        <div>
          <p className="mb-5 text-[11px] font-extrabold tracking-[0.13em] text-link">CARE THAT STAYS CONNECTED</p>
          <p className="max-w-[460px] font-serif text-[40px] leading-[1.03] tracking-[-0.04em] lg:text-[clamp(38px,4.3vw,64px)]">
            A calmer way to manage each day.
          </p>
          <p className="mt-6 max-w-[440px] text-[15px] leading-[1.7] text-sub">
            Medication reminders, appointments, symptoms, and your care team—all together in one accessible place.
          </p>
        </div>
        <div className="flex flex-wrap gap-[18px] text-xs font-bold text-sub">
          <span>✓ Private by design</span>
          <span>✓ Built for accessibility</span>
        </div>
      </aside>

      <main className="relative h-full min-w-0 overflow-auto">
        <button
          onClick={toggleTheme}
          aria-label={`Switch to ${dark ? 'light' : 'dark'} theme`}
          className={`absolute top-4 right-4 z-10 flex size-11 items-center justify-center rounded-full text-lg ${dark ? 'bg-white/10' : 'bg-black/5'}`}
        >
          <span aria-hidden="true">{dark ? '☀️' : '🌙'}</span>
        </button>
        <Outlet />
      </main>
    </div>
  )
}
