import type { ReactNode } from 'react'
import { cn } from '@/lib/cn'

export type BadgeTone = 'gray' | 'blue' | 'green' | 'amber' | 'red' | 'violet' | 'navy' | 'orange'

const tones: Record<BadgeTone, string> = {
  gray: 'bg-slate-100 text-slate-600 ring-slate-200',
  blue: 'bg-blue-50 text-blue-700 ring-blue-100',
  green: 'bg-emerald-50 text-emerald-700 ring-emerald-100',
  amber: 'bg-amber-50 text-amber-700 ring-amber-100',
  red: 'bg-red-50 text-red-700 ring-red-100',
  violet: 'bg-violet-50 text-violet-700 ring-violet-100',
  navy: 'bg-indigo-50 text-indigo-800 ring-indigo-100',
  orange: 'bg-orange-50 text-orange-700 ring-orange-100',
}

interface BadgeProps {
  tone?: BadgeTone
  children: ReactNode
  className?: string
  dot?: boolean
}

export function Badge({ tone = 'gray', children, className, dot }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium whitespace-nowrap ring-1 ring-inset',
        tones[tone],
        className,
      )}
    >
      {dot && <span className="size-1.5 rounded-full bg-current" aria-hidden />}
      {children}
    </span>
  )
}
