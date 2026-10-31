import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'
import { dayOfMonth, monthShort } from '@/lib/format'

/* ------------------------------------------------------------------ */
/* Page header                                                         */
/* ------------------------------------------------------------------ */

interface PageHeaderProps {
  eyebrow?: ReactNode
  title: ReactNode
  description?: ReactNode
  actions?: ReactNode
  className?: string
}

export function PageHeader({ eyebrow, title, description, actions, className }: PageHeaderProps) {
  return (
    <div className={cn('mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between', className)}>
      <div className="min-w-0">
        {eyebrow && <p className="text-[11px] font-semibold tracking-wider text-blue-600 uppercase">{eyebrow}</p>}
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[26px]">{title}</h1>
        {description && <p className="mt-1 max-w-2xl text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Organization mark (acronym tile in the org color)                   */
/* ------------------------------------------------------------------ */

export function OrgMark({ acronym, color, size = 'md', className }: { acronym: string; color: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const sizes = {
    sm: 'size-8 text-[10px] rounded-lg',
    md: 'size-10 text-xs rounded-xl',
    lg: 'size-14 text-sm rounded-2xl',
  }

  return (
    <span
      className={cn('grid shrink-0 place-items-center font-bold tracking-tight', sizes[size], className)}
      style={{ backgroundColor: `${color}1a`, color }}
      aria-hidden
    >
      {acronym.slice(0, 4)}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Avatar (initials)                                                   */
/* ------------------------------------------------------------------ */

const avatarColors = ['bg-blue-100 text-blue-700', 'bg-emerald-100 text-emerald-700', 'bg-amber-100 text-amber-800', 'bg-violet-100 text-violet-700', 'bg-rose-100 text-rose-700', 'bg-cyan-100 text-cyan-700', 'bg-slate-200 text-slate-700']

export function Avatar({ initials, name, size = 'md', className }: { initials: string; name?: string; size?: 'sm' | 'md' | 'lg'; className?: string }) {
  const key = (name ?? initials).split('').reduce((acc, ch) => acc + ch.charCodeAt(0), 0)
  const sizes = { sm: 'size-7 text-[10px]', md: 'size-9 text-xs', lg: 'size-14 text-base' }

  return (
    <span className={cn('grid shrink-0 place-items-center rounded-full font-semibold', avatarColors[key % avatarColors.length], sizes[size], className)} aria-hidden>
      {initials}
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Date tile                                                           */
/* ------------------------------------------------------------------ */

export function DateTile({ iso, highlight }: { iso: string; highlight?: boolean }) {
  return (
    <span
      className={cn(
        'flex size-12 shrink-0 flex-col items-center justify-center rounded-xl leading-none',
        highlight ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700',
      )}
    >
      <span className={cn('text-[10px] font-semibold', highlight ? 'text-blue-100' : 'text-slate-500')}>{monthShort(iso)}</span>
      <span className="mt-1 text-lg font-bold">{dayOfMonth(iso)}</span>
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Progress bar                                                        */
/* ------------------------------------------------------------------ */

export function ProgressBar({ value, max = 100, tone = 'blue', className }: { value: number; max?: number; tone?: 'blue' | 'green' | 'amber' | 'red'; className?: string }) {
  const pct = Math.max(0, Math.min(100, max ? (value / max) * 100 : 0))
  const tones = { blue: 'bg-blue-600', green: 'bg-emerald-500', amber: 'bg-amber-500', red: 'bg-red-500' }

  return (
    <div className={cn('h-2 w-full overflow-hidden rounded-full bg-slate-100', className)} role="progressbar" aria-valuenow={Math.round(pct)} aria-valuemin={0} aria-valuemax={100}>
      <div className={cn('h-full rounded-full transition-all', tones[tone])} style={{ width: `${pct}%` }} />
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

interface TabsProps<T extends string> {
  value: T
  onChange: (value: T) => void
  items: { value: T; label: string; count?: number }[]
  className?: string
}

export function Tabs<T extends string>({ value, onChange, items, className }: TabsProps<T>) {
  return (
    <div className={cn('scrollbar-thin -mx-1 flex gap-1 overflow-x-auto border-b border-slate-200 px-1', className)} role="tablist">
      {items.map((item) => {
        const active = item.value === value
        return (
          <button
            key={item.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(item.value)}
            className={cn(
              '-mb-px flex items-center gap-1.5 border-b-2 px-3 py-2.5 text-sm font-medium whitespace-nowrap transition-colors',
              active ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-500 hover:text-slate-800',
            )}
          >
            {item.label}
            {item.count !== undefined && (
              <span className={cn('rounded-full px-1.5 py-0.5 text-[10px] font-semibold', active ? 'bg-blue-50 text-blue-700' : 'bg-slate-100 text-slate-500')}>
                {item.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Pill filter buttons                                                 */
/* ------------------------------------------------------------------ */

export function Pills<T extends string>({ value, onChange, items }: TabsProps<T>) {
  return (
    <div className="scrollbar-thin flex gap-2 overflow-x-auto pb-1">
      {items.map((item) => (
        <button
          key={item.value}
          onClick={() => onChange(item.value)}
          className={cn(
            'rounded-full px-3 py-1.5 text-xs font-medium whitespace-nowrap ring-1 ring-inset transition-colors',
            item.value === value ? 'bg-navy-900 text-white ring-navy-900' : 'bg-white text-slate-600 ring-slate-200 hover:bg-slate-50',
          )}
        >
          {item.label}
          {item.count !== undefined && <span className="ml-1 opacity-70">{item.count}</span>}
        </button>
      ))}
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* Key/value detail row                                                */
/* ------------------------------------------------------------------ */

export function Detail({ icon, label, children }: { icon?: ReactNode; label: string; children: ReactNode }) {
  return (
    <div className="flex gap-3">
      {icon && <span className="mt-0.5 text-slate-400 [&>svg]:size-4">{icon}</span>}
      <div className="min-w-0">
        <p className="text-[11px] font-medium tracking-wide text-slate-400 uppercase">{label}</p>
        <div className="mt-0.5 text-sm text-slate-800">{children}</div>
      </div>
    </div>
  )
}
