import { useCallback, useEffect, useState, type FormEvent, type ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { AuthButton, AuthField } from '../components/AuthControls'
import { patient } from '../data'

// How long the simulated face scan takes before opening the app
const FACE_SCAN_MS = 2500

type Step = 'password' | 'ask-face' | 'scanning'

/*
  Simulated sign-in: no credential is checked, stored or sent anywhere, and no
  camera is used. "Use Face ID instead" asks first, then shows the scan.
*/
export function SignIn() {
  const navigate = useNavigate()
  const [error, setError] = useState('')
  const [step, setStep] = useState<Step>('password')
  const openApp = useCallback(() => navigate('/today.html'), [navigate])

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (!String(data.get('email')).trim() || !String(data.get('password'))) {
      setError('Enter your email address and password.')
      return
    }
    navigate('/today.html')
  }

  if (step === 'ask-face') return <AskFaceId onYes={() => setStep('scanning')} onNo={() => setStep('password')} />
  if (step === 'scanning') return <FaceScan onDone={openApp} onCancel={() => setStep('password')} />

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="si-title"
      className="flex min-h-full flex-col gap-[18px] px-[26px] py-[50px] md:justify-between md:px-[65px] md:pt-[110px] md:pb-[130px]"
    >
      <div className="flex flex-col gap-[18px] md:gap-6">
        <AuthButton type="button" variant="text" onClick={() => navigate('/')}>
          ← Back
        </AuthButton>
        <h1 id="si-title" className="text-[28px] font-bold text-ink md:text-4xl">
          Sign in
        </h1>
        <AuthField
          id="si-email"
          name="email"
          label="Email address"
          type="email"
          autoComplete="email"
          defaultValue={patient.email}
          helper="We will never share this."
        />
        <AuthField
          id="si-pass"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          defaultValue="password"
          helper="Your password manager can fill this for you."
          error={error}
        />
      </div>
      <div className="mt-2 flex flex-col gap-[18px] md:mt-0 md:gap-6">
        <AuthButton type="submit">Sign in</AuthButton>
        <AuthButton type="button" variant="text" onClick={() => setStep('ask-face')}>
          Use Face ID instead
        </AuthButton>
      </div>
    </form>
  )
}

/* ---------- Face ID: shared pieces ---------- */
function FaceScreen({ titleId, title, intro, children }: { titleId: string; title: string; intro: string; children: ReactNode }) {
  return (
    <section aria-labelledby={titleId} className="mx-auto flex min-h-full max-w-[560px] flex-col items-center px-[26px] py-[50px] text-center md:justify-center md:px-10">
      <div className="mb-8 grid size-[90px] place-items-center rounded-3xl bg-brand text-[44px]" aria-hidden="true">💊</div>
      <h1 id={titleId} className="text-[28px] font-bold text-ink md:text-[40px]">
        {title}
      </h1>
      <p className="mt-4 text-lg text-sub md:text-2xl md:leading-relaxed">{intro}</p>
      {children}
    </section>
  )
}

const FaceCircle = () => (
  <div className="my-8 grid size-[180px] place-items-center rounded-full border-4 border-brand bg-surface-2 text-[64px]" aria-hidden="true">
    👤
  </div>
)

/* ---------- Face ID: ask first ---------- */
function AskFaceId({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <FaceScreen titleId="face-ask-title" title="Sign in with your face?" intro="You would open CareConnect just by looking at it. No password, no keyboard.">
      <FaceCircle />
      <div className="flex w-full flex-col gap-5">
        <AuthButton type="button" onClick={onYes} autoFocus>
          Yes, use Face ID
        </AuthButton>
        <button
          type="button"
          onClick={onNo}
          className="flex h-16 w-full items-center justify-center rounded-2xl border-2 border-line bg-surface text-lg font-bold text-ink transition-all active:scale-[0.98] md:h-20 md:text-[22px]"
        >
          No, use my password
        </button>
      </div>
      <p className="mt-6 text-base text-sub md:text-lg">Your face is never sent anywhere. It stays on this device, and you can turn Face ID off any time in Account.</p>
    </FaceScreen>
  )
}

/* ---------- Face ID: scanning ---------- */
function FaceScan({ onDone, onCancel }: { onDone: () => void; onCancel: () => void }) {
  useEffect(() => {
    const id = setTimeout(onDone, FACE_SCAN_MS)
    return () => clearTimeout(id)
  }, [onDone])

  return (
    <FaceScreen titleId="face-scan-title" title={`Welcome back, ${patient.name}`} intro="Signing you in now. Look at your phone — there is nothing to tap.">
      <FaceCircle />
      <div className="flex items-center gap-5" role="status">
        <span className="size-12 shrink-0 animate-spin rounded-full border-[6px] border-brand border-r-transparent motion-reduce:animate-none" aria-hidden="true" />
        <span className="text-xl font-bold text-ink md:text-2xl">Looking for your face…</span>
      </div>
      <p className="mt-8 text-base text-sub md:text-lg">A failed attempt never locks your account and never makes you start over.</p>
      <AuthButton type="button" variant="text" onClick={onCancel} className="mt-2">
        Use my password instead
      </AuthButton>
    </FaceScreen>
  )
}
