import { useCallback, useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AuthButton, AuthField } from '../components/AuthControls'
import { FaceIdCheck } from '../components/FaceId'
import { patient } from '../data'
import { checkEmail, checkRequired, collectErrors, focusFirstError, type FieldErrors } from '../validation'

/*
  Demo sign-in: the password is not checked, stored or sent anywhere. "Use
  Face ID instead" goes straight to the device's real biometric prompt
  (Windows Hello, Touch ID / Face ID, fingerprint; see biometrics.ts) and
  accepts whatever the device confirms. Create account offers Face ID first.
*/
export function SignIn() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<FieldErrors<'email' | 'password'>>({})
  const [useFace, setUseFace] = useState(false)
  // Stable, so re-rendering does not restart the device prompt
  const openApp = useCallback(() => navigate('/today.html'), [navigate])

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const found = collectErrors({
      email: checkEmail(String(data.get('email'))),
      password: checkRequired(String(data.get('password')), 'Enter your password.'),
    })
    setErrors(found)
    if (Object.keys(found).length) return focusFirstError(e.currentTarget, found)
    navigate('/today.html')
  }

  if (useFace) return <FaceIdCheck name={patient.name} onDone={openApp} onSkip={() => setUseFace(false)} />

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
          error={errors.email}
        />
        <AuthField
          id="si-pass"
          name="password"
          label="Password"
          type="password"
          autoComplete="current-password"
          defaultValue="password"
          helper="Your password manager can fill this for you."
          error={errors.password}
        />
      </div>
      <div className="mt-2 flex flex-col gap-[18px] md:mt-0 md:gap-6">
        <AuthButton type="submit">Sign in</AuthButton>
        <AuthButton type="button" variant="text" onClick={() => setUseFace(true)}>
          Use Face ID instead
        </AuthButton>
      </div>
    </form>
  )
}
