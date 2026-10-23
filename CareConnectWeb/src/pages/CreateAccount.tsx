import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router'
import { AuthButton, AuthField } from '../components/AuthControls'
import { checkEmail, checkNewPassword, checkRequired, collectErrors, focusFirstError, type FieldErrors } from '../validation'

// Simulated sign-up: nothing is stored or sent; choosing a role opens the app
export function CreateAccount() {
  const navigate = useNavigate()
  const [errors, setErrors] = useState<FieldErrors<'name' | 'email' | 'password'>>({})

  function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault()
    const data = new FormData(e.currentTarget)
    const found = collectErrors({
      name: checkRequired(String(data.get('name')), 'Enter your full name.'),
      email: checkEmail(String(data.get('email'))),
      password: checkNewPassword(String(data.get('password'))),
    })
    setErrors(found)
    if (Object.keys(found).length) return focusFirstError(e.currentTarget, found)
    navigate('/today.html')
  }

  const role = 'flex w-full items-center justify-center gap-2 rounded-2xl text-lg font-bold text-white active:scale-[0.98] h-[88px] md:h-20 md:text-[22px]'

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      aria-labelledby="ca-title"
      className="flex min-h-full flex-col gap-4 px-[26px] py-4 md:justify-between md:gap-6 md:px-[65px] md:pt-[110px] md:pb-[130px]"
    >
      <div className="flex flex-col gap-4 md:gap-6">
        <AuthButton type="button" variant="text" onClick={() => navigate('/')}>
          ← Back
        </AuthButton>
        <h1 id="ca-title" className="text-2xl font-bold text-ink md:text-[30px]">
          Create your account
        </h1>
        <AuthField id="ca-name" name="name" label="Full name" autoComplete="name" defaultValue="Maddy Chen" error={errors.name} />
        <AuthField id="ca-email" name="email" label="Email address" type="email" autoComplete="email" defaultValue="maddy@example.com" error={errors.email} />
        <AuthField
          id="ca-pass"
          name="password"
          label="Password"
          type="password"
          autoComplete="new-password"
          defaultValue="password12"
          helper="At least 8 characters."
          error={errors.password}
        />
      </div>
      <fieldset className="flex flex-col gap-4 md:gap-6">
        <legend className="mb-4 text-base font-bold tracking-[0.06em] text-sub md:mb-6 md:text-xl">I AM A…</legend>
        <button type="submit" className={`${role} bg-[#2f7a6b]`}>
          <span aria-hidden="true">🙂</span> Care recipient
        </button>
        <button type="submit" className={`${role} bg-violet`}>
          <span aria-hidden="true">👤</span> Caregiver
        </button>
      </fieldset>
    </form>
  )
}
