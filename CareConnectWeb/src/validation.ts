// Form checks shared by Sign in and Create account. Each returns the message
// to show under the field, or '' when the value is fine.

// Something@something.something, without spaces: enough to catch typos
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function checkEmail(value: string) {
  const v = value.trim()
  if (!v) return 'Enter your email address.'
  if (!EMAIL.test(v)) return 'Enter an email address like name@example.com.'
  return ''
}

export const checkRequired = (value: string, message: string) => (value.trim() ? '' : message)

export function checkNewPassword(value: string) {
  if (value.length < 8) return 'Use at least 8 characters.'
  return ''
}

export type FieldErrors<K extends string> = Partial<Record<K, string>>

// Runs every check and keeps only the failures
export function collectErrors<K extends string>(checks: Record<K, string>): FieldErrors<K> {
  return Object.fromEntries(Object.entries(checks).filter(([, msg]) => msg)) as FieldErrors<K>
}

// Puts the cursor in the first field with a problem, so it is announced and can be fixed straight away
export function focusFirstError(form: HTMLFormElement, errors: FieldErrors<string>) {
  const first = Object.keys(errors)[0]
  if (first) (form.elements.namedItem(first) as HTMLElement | null)?.focus()
}
