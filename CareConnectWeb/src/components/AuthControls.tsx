import type { ButtonHTMLAttributes, InputHTMLAttributes } from 'react'

// Sizes follow the design: larger targets on tablet and desktop ("lg" in Figma)

interface FieldProps extends InputHTMLAttributes<HTMLInputElement> {
  id: string
  label: string
  helper?: string
  error?: string
}

export function AuthField({ id, label, helper, error, ...input }: FieldProps) {
  const described = [helper && `${id}-hint`, error && `${id}-err`].filter(Boolean).join(' ') || undefined
  return (
    <div className="flex w-full flex-col gap-2 md:gap-2.5">
      <label htmlFor={id} className="text-base font-semibold text-ink md:text-xl">
        {label}
      </label>
      <input
        id={id}
        aria-describedby={described}
        aria-invalid={error ? true : undefined}
        className="auth-input h-16 w-full rounded-2xl border-2 border-line-input bg-surface px-5 text-lg text-ink md:h-20 md:px-[25px] md:text-[22px]"
        {...input}
      />
      {helper && (
        <p id={`${id}-hint`} className="text-base text-muted md:text-xl">
          {helper}
        </p>
      )}
      {error && (
        <p id={`${id}-err`} role="alert" className="text-base font-semibold text-missed md:text-xl">
          {error}
        </p>
      )}
    </div>
  )
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'text'
}

export function AuthButton({ variant = 'primary', className = '', ...props }: ButtonProps) {
  const style =
    variant === 'text'
      ? 'min-h-16 text-link active:opacity-70 md:min-h-20'
      : 'h-16 rounded-2xl bg-primary text-white active:scale-[0.98] md:h-20'
  return <button className={`flex w-full items-center justify-center text-lg font-bold transition-all md:text-[22px] ${style} ${className}`} {...props} />
}
