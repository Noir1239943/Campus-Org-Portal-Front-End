import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { cn } from '@/lib/cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success' | 'subtle'
type Size = 'sm' | 'md' | 'lg' | 'icon'

const variants: Record<Variant, string> = {
  primary: 'bg-blue-600 text-white shadow-sm hover:bg-blue-700 focus-visible:outline-blue-600',
  secondary: 'bg-white text-slate-700 ring-1 ring-inset ring-slate-200 shadow-sm hover:bg-slate-50 focus-visible:outline-blue-600',
  ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 focus-visible:outline-blue-600',
  danger: 'bg-white text-red-600 ring-1 ring-inset ring-red-200 hover:bg-red-50 focus-visible:outline-red-600',
  success: 'bg-emerald-600 text-white shadow-sm hover:bg-emerald-700 focus-visible:outline-emerald-600',
  subtle: 'bg-blue-50 text-blue-700 hover:bg-blue-100 focus-visible:outline-blue-600',
}

const sizes: Record<Size, string> = {
  sm: 'h-8 gap-1.5 rounded-lg px-3 text-xs',
  md: 'h-9 gap-2 rounded-lg px-3.5 text-sm',
  lg: 'h-11 gap-2 rounded-xl px-5 text-sm',
  icon: 'size-8 rounded-lg',
}

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: ReactNode
  /** Render as a router link instead of a button. */
  to?: string
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  { variant = 'primary', size = 'md', loading, icon, to, className, children, disabled, type = 'button', ...props },
  ref,
) {
  const classes = cn(
    'inline-flex shrink-0 items-center justify-center font-medium whitespace-nowrap transition-colors',
    'focus-visible:outline-2 focus-visible:outline-offset-2 disabled:pointer-events-none disabled:opacity-50',
    variants[variant],
    sizes[size],
    className,
  )

  const content = (
    <>
      {loading ? <Loader2 className="size-4 animate-spin" aria-hidden /> : icon}
      {children}
    </>
  )

  if (to) {
    return (
      <Link to={to} className={classes}>
        {content}
      </Link>
    )
  }

  return (
    <button ref={ref} type={type} className={classes} disabled={disabled || loading} {...props}>
      {content}
    </button>
  )
})
