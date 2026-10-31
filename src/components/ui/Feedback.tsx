import type { ReactNode } from 'react'
import { AlertTriangle, Inbox, Loader2, RefreshCw } from 'lucide-react'
import { getErrorMessage } from '@/api/client'
import { cn } from '@/lib/cn'
import { Button } from './Button'

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn('size-5 animate-spin text-blue-600', className)} aria-label="Loading" />
}

/** Skeleton placeholder while a page loads. */
export function PageLoader({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <span className="sr-only">{label}</span>
      <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />
      <div className="h-8 w-72 max-w-full animate-pulse rounded bg-slate-200" />
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-2xl bg-white" />
        ))}
      </div>
      <div className="h-64 animate-pulse rounded-2xl bg-white" />
    </div>
  )
}

export function ErrorState({ error, onRetry }: { error: unknown; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-2xl border border-red-100 bg-white px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-red-50 text-red-600">
        <AlertTriangle className="size-5" />
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">We couldn't load this page</h3>
      <p className="mt-1 max-w-md text-sm text-slate-500">{getErrorMessage(error)}</p>
      {onRetry && (
        <Button variant="secondary" className="mt-4" icon={<RefreshCw className="size-4" />} onClick={onRetry}>
          Try again
        </Button>
      )}
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: ReactNode
  action?: ReactNode
  className?: string
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn('flex flex-col items-center px-6 py-10 text-center', className)}>
      <span className="grid size-11 place-items-center rounded-full bg-slate-100 text-slate-500 [&>svg]:size-5">
        {icon ?? <Inbox />}
      </span>
      <h3 className="mt-3 text-sm font-semibold text-slate-900">{title}</h3>
      {description && <p className="mt-1 max-w-sm text-sm text-slate-500">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}

interface AlertProps {
  tone?: 'info' | 'warning' | 'danger' | 'success'
  title?: ReactNode
  children?: ReactNode
  icon?: ReactNode
  action?: ReactNode
  className?: string
}

const alertTones = {
  info: 'border-blue-100 bg-blue-50/70 text-blue-900',
  warning: 'border-amber-200 bg-amber-50 text-amber-900',
  danger: 'border-red-200 bg-red-50 text-red-900',
  success: 'border-emerald-200 bg-emerald-50 text-emerald-900',
}

export function Alert({ tone = 'info', title, children, icon, action, className }: AlertProps) {
  return (
    <div className={cn('flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center', alertTones[tone], className)}>
      <div className="flex min-w-0 flex-1 gap-3">
        {icon && <span className="mt-0.5 shrink-0 [&>svg]:size-5">{icon}</span>}
        <div className="min-w-0 text-sm">
          {title && <p className="font-semibold">{title}</p>}
          {children && <div className={cn('opacity-90', title && 'mt-0.5')}>{children}</div>}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  )
}
