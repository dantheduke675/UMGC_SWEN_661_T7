// Form checks for the sign-in and create-account screens. Each returns
// undefined when the value is fine, or a message that says what is wrong
// and how to fix it, shown under the field and read by screen readers.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const PASSWORD_MIN_LENGTH = 8;

export function nameError(name: string): string | undefined {
  if (!name.trim()) return 'Enter your full name.';
  return undefined;
}

export function emailError(email: string): string | undefined {
  const trimmed = email.trim();
  if (!trimmed) return 'Enter your email address.';
  if (!EMAIL_PATTERN.test(trimmed)) {
    return 'Enter an email address with an @ and a domain, like name@example.com.';
  }
  return undefined;
}

/** With `minLength` (create account) the length is checked too; sign-in only
 *  needs the field to be filled in. */
export function passwordError(password: string, minLength?: number): string | undefined {
  if (!password) return 'Enter your password.';
  if (minLength && password.length < minLength) {
    return `Use at least ${minLength} characters. This one has ${password.length}.`;
  }
  return undefined;
}

/** The sentence announced when a form is sent with errors. */
export function errorSummary(count: number): string {
  return count === 1
    ? 'There is 1 problem with the form. Fix it and try again.'
    : `There are ${count} problems with the form. Fix them and try again.`;
}
