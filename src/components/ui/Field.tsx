import { forwardRef, useId, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from 'react'
import { cn } from '@/lib/cn'

const control =
  'block w-full rounded-lg border-0 bg-white px-3 py-2 text-sm text-slate-900 shadow-sm ring-1 ring-inset ring-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-inset focus:ring-blue-600 disabled:bg-slate-50 disabled:text-slate-500'

interface FieldProps {
  label?: ReactNode
  hint?: ReactNode
  error?: string
  required?: boolean
  className?: string
  children: (id: string) => ReactNode
}

/** Label + control + hint/error, with the ids wired up for screen readers. */
export function Field({ label, hint, error, required, className, children }: FieldProps) {
  const id = useId()

  return (
    <div className={className}>
      {label && (
        <label htmlFor={id} className="mb-1.5 block text-xs font-medium text-slate-700">
          {label}
          {required && <span className="ml-0.5 text-red-500">*</span>}
        </label>
      )}
      {children(id)}
      {error ? (
        <p className="mt-1.5 text-xs text-red-600" role="alert">
          {error}
        </p>
      ) : (
        hint && <p className="mt-1.5 text-xs text-slate-500">{hint}</p>
      )}
    </div>
  )
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement> & { invalid?: boolean }>(
  function Input({ className, invalid, ...props }, ref) {
    return <input ref={ref} className={cn(control, 'h-10', invalid && 'ring-red-300 focus:ring-red-500', className)} {...props} />
  },
)

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement> & { invalid?: boolean }>(
  function Textarea({ className, invalid, rows = 4, ...props }, ref) {
    return (
      <textarea ref={ref} rows={rows} className={cn(control, 'resize-y', invalid && 'ring-red-300 focus:ring-red-500', className)} {...props} />
    )
  },
)

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement> & { invalid?: boolean }>(
  function Select({ className, invalid, children, ...props }, ref) {
    return (
      <select ref={ref} className={cn(control, 'h-10 pr-8', invalid && 'ring-red-300 focus:ring-red-500', className)} {...props}>
        {children}
      </select>
    )
  },
)

interface CheckboxProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  label: ReactNode
  description?: ReactNode
}

export function Checkbox({ label, description, className, ...props }: CheckboxProps) {
  const id = useId()

  return (
    <div className={cn('flex gap-3', className)}>
      <input
        id={id}
        type="checkbox"
        className="mt-0.5 size-4 shrink-0 rounded border-slate-300 text-blue-600 accent-blue-600 focus:ring-blue-600"
        {...props}
      />
      <label htmlFor={id} className="text-sm text-slate-700">
        {label}
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </label>
    </div>
  )
}

interface ToggleProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: ReactNode
  description?: ReactNode
}

export function Toggle({ checked, onChange, label, description }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="flex w-full items-start justify-between gap-4 text-left"
    >
      <span>
        <span className="block text-sm font-medium text-slate-800">{label}</span>
        {description && <span className="mt-0.5 block text-xs text-slate-500">{description}</span>}
      </span>
      <span className={cn('relative mt-0.5 h-5 w-9 shrink-0 rounded-full transition-colors', checked ? 'bg-blue-600' : 'bg-slate-300')}>
        <span className={cn('absolute top-0.5 left-0.5 size-4 rounded-full bg-white shadow transition-transform', checked && 'translate-x-4')} />
      </span>
    </button>
  )
}
