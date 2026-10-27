import { useEffect, useRef, useState, type ReactNode } from 'react'
import { signInWithBiometrics } from '../biometrics'
import { AuthButton } from './AuthControls'

/*
  Face ID screens, shared by Create account and Sign in:
  - FaceIdOffer: after creating an account, asks whether to use Face ID
  - FaceIdCheck: the device's own biometric prompt (see biometrics.ts), then
    Try again if it was cancelled, or a note if the device has none
*/

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

const secondaryButton =
  'flex h-16 w-full items-center justify-center rounded-2xl border-2 border-line bg-surface text-lg font-bold text-ink transition-all active:scale-[0.98] md:h-20 md:text-[22px]'

export function FaceIdOffer({ onYes, onNo }: { onYes: () => void; onNo: () => void }) {
  return (
    <FaceScreen
      titleId="face-ask-title"
      title="Sign in with your face?"
      intro="Your device checks it is you with its face, fingerprint or Windows Hello sign-in. No password, no keyboard."
    >
      <FaceCircle />
      <div className="flex w-full flex-col gap-5">
        <AuthButton type="button" onClick={onYes} autoFocus>
          Yes, use Face ID
        </AuthButton>
        <button type="button" onClick={onNo} className={secondaryButton}>
          No, use my password
        </button>
      </div>
      <p className="mt-6 text-base text-sub md:text-lg">Your face is never sent anywhere. It stays on this device, and you can turn Face ID off any time in Account.</p>
    </FaceScreen>
  )
}

type CheckStatus = 'checking' | 'cancelled' | 'unavailable'

/*
  setUp: right after creating an account (makes a new passkey; "Continue
  without Face ID" opens the app). Otherwise signing in (confirms with the
  saved passkey; "Use my password" goes back to the form).
*/
export function FaceIdCheck({ setUp = false, name, onDone, onSkip }: { setUp?: boolean; name: string; onDone: () => void; onSkip: () => void }) {
  const [status, setStatus] = useState<CheckStatus>('checking')
  // Bumped by Try again to ask the device once more
  const [attempt, setAttempt] = useState(0)
  const skipLabel = setUp ? 'Continue without Face ID' : 'Use my password'
  // Closes the device's prompt; also when leaving this screen
  const request = useRef<AbortController | null>(null)
  const skip = () => {
    request.current?.abort()
    onSkip()
  }

  useEffect(() => {
    const stop = new AbortController()
    request.current = stop
    void signInWithBiometrics(stop.signal, { setUp }).then(result => {
      if (stop.signal.aborted) return
      if (result === 'ok') onDone()
      else setStatus(result === 'unavailable' ? 'unavailable' : 'cancelled')
    })
    return () => stop.abort()
  }, [attempt, setUp, onDone])

  if (status === 'checking') {
    return (
      <FaceScreen
        titleId="face-scan-title"
        title={setUp ? `Welcome, ${name}` : `Welcome back, ${name}`}
        intro={setUp ? "Set up Face ID: confirm it is you in your device's prompt, with your face, fingerprint or PIN." : "Confirm it is you in your device's prompt: your face, fingerprint or PIN."}
      >
        <FaceCircle />
        <div className="flex items-center gap-5" role="status">
          <span className="size-12 shrink-0 animate-spin rounded-full border-[6px] border-brand border-r-transparent motion-reduce:animate-none" aria-hidden="true" />
          <span className="text-xl font-bold text-ink md:text-2xl">Waiting for your device…</span>
        </div>
        <p className="mt-8 text-base text-sub md:text-lg">A failed attempt never locks your account and never makes you start over.</p>
        <AuthButton type="button" variant="text" onClick={skip} className="mt-2">
          {setUp ? 'Continue without Face ID' : 'Use my password instead'}
        </AuthButton>
      </FaceScreen>
    )
  }

  const unavailable = status === 'unavailable'
  return (
    <FaceScreen
      titleId="face-failed-title"
      title={unavailable ? 'Face ID is not available here' : 'That did not work'}
      intro={
        unavailable
          ? `This device or browser has no face, fingerprint or Windows Hello sign-in. ${setUp ? 'You can still sign in with your password.' : 'Use your password instead.'}`
          : `The check was cancelled or did not recognise you. Nothing is locked: try again, or ${setUp ? 'continue without Face ID' : 'use your password'}.`
      }
    >
      <FaceCircle />
      <div className="flex w-full flex-col gap-5">
        {!unavailable && (
          <AuthButton
            type="button"
            onClick={() => {
              setStatus('checking')
              setAttempt(a => a + 1)
            }}
            autoFocus
          >
            Try again
          </AuthButton>
        )}
        <button type="button" onClick={skip} autoFocus={unavailable} className={secondaryButton}>
          {skipLabel}
        </button>
      </div>
    </FaceScreen>
  )
}
