import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AuthButton, AuthField } from '../components/AuthControls'
import { patient } from '../data'

// Simulated sign-in: no credential is checked, stored or sent anywhere
export function SignIn() {
  const navigate = useNavigate()
  const [error, setError] = useState('')

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    if (!String(data.get('email')).trim() || !String(data.get('password'))) {
      setError('Enter your email address and password.')
      return
    }
    navigate('/today.html')
  }

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
        <AuthButton type="button" variant="text" onClick={() => navigate('/today.html')}>
          Use Face ID instead
        </AuthButton>
      </div>
    </form>
  )
}
