import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { cn } from '@/lib/cn'

type Tone = 'blue' | 'green' | 'amber' | 'violet' | 'red' | 'slate'

const iconTones: Record<Tone, string> = {
  blue: 'bg-blue-50 text-blue-600',
  green: 'bg-emerald-50 text-emerald-600',
  amber: 'bg-amber-50 text-amber-600',
  violet: 'bg-violet-50 text-violet-600',
  red: 'bg-red-50 text-red-600',
  slate: 'bg-slate-100 text-slate-600',
}

interface StatCardProps {
  label: string
  value: ReactNode
  hint?: ReactNode
  icon?: ReactNode
  tone?: Tone
  to?: string
}

export function StatCard({ label, value, hint, icon, tone = 'blue', to }: StatCardProps) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium text-slate-500">{label}</p>
        {icon && <span className={cn('grid size-8 place-items-center rounded-lg [&>svg]:size-4', iconTones[tone])}>{icon}</span>}
      </div>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-slate-900 sm:text-[28px]">{value}</p>
      {hint && <p className="mt-1 text-xs leading-snug text-slate-500">{hint}</p>}
    </>
  )

  const classes = 'block rounded-2xl border border-slate-200/80 bg-white p-4 shadow-[0_1px_2px_rgba(15,23,42,0.04)] sm:p-5'

  if (to) {
    return (
      <Link to={to} className={cn(classes, 'transition hover:border-blue-200 hover:shadow-md')}>
        {body}
      </Link>
    )
  }

  return <div className={classes}>{body}</div>
}
